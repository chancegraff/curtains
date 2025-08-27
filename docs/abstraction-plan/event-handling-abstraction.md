# Event Handling Abstraction

## Event System Interface

FUNCTION define_event_interface()
  INTERFACE IEventHandler
    METHOD on(event_type, handler)
    METHOD off(event_type, handler)
    METHOD emit(event_type, data)
    METHOD once(event_type, handler)
  
  INTERFACE IEventEmitter
    METHOD subscribe(listener)
    METHOD unsubscribe(listener)
    METHOD notify(event)

## Functional Event Bus

FUNCTION create_event_bus()
  LET listeners = new Map()
  LET event_queue = []
  LET is_processing = false
  
  FUNCTION on(event_type, handler)
    IF NOT listeners has event_type THEN
      SET listeners[event_type] = []
    
    ADD handler to listeners[event_type]
    
    RETURN FUNCTION unsubscribe()
      REMOVE handler from listeners[event_type]
  
  FUNCTION emit(event_type, data)
    LET event = {
      type: event_type,
      data: data,
      timestamp: current_time(),
      propagation_stopped: false
    }
    
    ADD event to event_queue
    
    IF NOT is_processing THEN
      process_event_queue()
  
  FUNCTION process_event_queue()
    SET is_processing = true
    
    WHILE event_queue has items DO
      LET event = SHIFT first item from event_queue
      dispatch_event(event)
    
    SET is_processing = false
  
  FUNCTION dispatch_event(event)
    IF listeners has event.type THEN
      FOR each handler in listeners[event.type] DO
        IF NOT event.propagation_stopped THEN
          TRY
            handler(event)
          CATCH error
            handle_event_error(error, event)

## Navigation Event Handler

FUNCTION create_navigation_handler()
  LET state = {
    current_slide: 0,
    total_slides: 0,
    is_transitioning: false
  }
  
  FUNCTION initialize(config)
    SET state.total_slides = config.total_slides
    SET state.current_slide = config.start_slide || 0
    
    setup_keyboard_navigation()
    setup_mouse_navigation()
    setup_touch_navigation()
  
  FUNCTION setup_keyboard_navigation()
    FUNCTION handle_keydown(event)
      IF state.is_transitioning THEN RETURN
      
      SWITCH event.key
        CASE 'ArrowRight', 'Space':
          navigate_next()
        CASE 'ArrowLeft':
          navigate_previous()
        CASE 'Home':
          navigate_to_slide(0)
        CASE 'End':
          navigate_to_slide(state.total_slides - 1)
        CASE 'f', 'F':
          toggle_fullscreen()
        CASE '0' TO '9':
          handle_number_navigation(event.key)
    
    ATTACH handle_keydown to document.keydown
  
  FUNCTION navigate_next()
    LET next_slide = state.current_slide + 1
    IF next_slide >= state.total_slides THEN
      next_slide = 0  // Wrap around
    
    navigate_to_slide(next_slide)
  
  FUNCTION navigate_previous()
    LET prev_slide = state.current_slide - 1
    IF prev_slide < 0 THEN
      prev_slide = state.total_slides - 1  // Wrap around
    
    navigate_to_slide(prev_slide)
  
  FUNCTION navigate_to_slide(index)
    IF index < 0 OR index >= state.total_slides THEN
      RETURN
    
    IF index === state.current_slide THEN
      RETURN
    
    SET state.is_transitioning = true
    
    EMIT 'slide:before-change', {
      from: state.current_slide,
      to: index
    }
    
    // Perform transition
    perform_slide_transition(index)
    
    SET state.current_slide = index
    
    EMIT 'slide:after-change', {
      current: index,
      total: state.total_slides
    }
    
    SET state.is_transitioning = false

## Touch Event Handler

FUNCTION create_touch_handler()
  LET touch_state = {
    start_x: null,
    start_y: null,
    start_time: null,
    is_swiping: false
  }
  
  FUNCTION handle_touch_start(event)
    LET touch = event.touches[0]
    SET touch_state.start_x = touch.clientX
    SET touch_state.start_y = touch.clientY
    SET touch_state.start_time = current_time()
    SET touch_state.is_swiping = true
  
  FUNCTION handle_touch_move(event)
    IF NOT touch_state.is_swiping THEN RETURN
    
    LET touch = event.touches[0]
    LET delta_x = touch.clientX - touch_state.start_x
    LET delta_y = touch.clientY - touch_state.start_y
    
    // Prevent vertical scrolling if horizontal swipe detected
    IF abs(delta_x) > abs(delta_y) AND abs(delta_x) > 10 THEN
      event.preventDefault()
  
  FUNCTION handle_touch_end(event)
    IF NOT touch_state.is_swiping THEN RETURN
    
    LET touch = event.changedTouches[0]
    LET delta_x = touch.clientX - touch_state.start_x
    LET delta_y = touch.clientY - touch_state.start_y
    LET delta_time = current_time() - touch_state.start_time
    
    // Determine if valid swipe
    IF abs(delta_x) > 50 AND abs(delta_x) > abs(delta_y) THEN
      IF delta_time < 500 THEN  // Quick swipe
        IF delta_x > 0 THEN
          EMIT 'navigation:previous'
        ELSE
          EMIT 'navigation:next'
    
    // Reset state
    SET touch_state.is_swiping = false
    SET touch_state.start_x = null
    SET touch_state.start_y = null

## Mouse Event Handler

FUNCTION create_mouse_handler()
  LET mouse_state = {
    is_dragging: false,
    start_x: null,
    drag_threshold: 5
  }
  
  FUNCTION handle_click(event)
    // Ignore if clicking interactive elements
    IF event.target matches 'a, button, input, textarea, select' THEN
      RETURN
    
    LET viewport_width = window.innerWidth
    LET click_x = event.clientX
    
    IF click_x > viewport_width / 2 THEN
      EMIT 'navigation:next'
    ELSE
      EMIT 'navigation:previous'
  
  FUNCTION handle_mouse_down(event)
    SET mouse_state.is_dragging = true
    SET mouse_state.start_x = event.clientX
  
  FUNCTION handle_mouse_move(event)
    IF NOT mouse_state.is_dragging THEN RETURN
    
    LET delta_x = event.clientX - mouse_state.start_x
    
    IF abs(delta_x) > mouse_state.drag_threshold THEN
      // Show drag preview
      show_drag_preview(delta_x)
  
  FUNCTION handle_mouse_up(event)
    IF NOT mouse_state.is_dragging THEN RETURN
    
    LET delta_x = event.clientX - mouse_state.start_x
    
    IF abs(delta_x) > 100 THEN
      IF delta_x > 0 THEN
        EMIT 'navigation:previous'
      ELSE
        EMIT 'navigation:next'
    
    SET mouse_state.is_dragging = false
    hide_drag_preview()

## Fullscreen Event Handler

FUNCTION create_fullscreen_handler()
  LET fullscreen_state = {
    is_fullscreen: false,
    previous_scroll: null
  }
  
  FUNCTION toggle_fullscreen()
    IF NOT fullscreen_state.is_fullscreen THEN
      enter_fullscreen()
    ELSE
      exit_fullscreen()
  
  FUNCTION enter_fullscreen()
    LET element = document.documentElement
    
    IF element.requestFullscreen EXISTS THEN
      element.requestFullscreen()
    ELSE IF element.webkitRequestFullscreen EXISTS THEN
      element.webkitRequestFullscreen()
    ELSE IF element.mozRequestFullScreen EXISTS THEN
      element.mozRequestFullScreen()
    
    SET fullscreen_state.is_fullscreen = true
    SET fullscreen_state.previous_scroll = window.scrollY
    
    EMIT 'fullscreen:enter'
  
  FUNCTION exit_fullscreen()
    IF document.exitFullscreen EXISTS THEN
      document.exitFullscreen()
    ELSE IF document.webkitExitFullscreen EXISTS THEN
      document.webkitExitFullscreen()
    ELSE IF document.mozCancelFullScreen EXISTS THEN
      document.mozCancelFullScreen()
    
    SET fullscreen_state.is_fullscreen = false
    
    IF fullscreen_state.previous_scroll NOT null THEN
      window.scrollTo(0, fullscreen_state.previous_scroll)
    
    EMIT 'fullscreen:exit'

## Accessibility Event Handler

FUNCTION create_accessibility_handler()
  LET a11y_state = {
    announcer: null,
    focus_trap: null
  }
  
  FUNCTION initialize()
    create_live_region()
    setup_focus_management()
    setup_aria_attributes()
  
  FUNCTION create_live_region()
    LET announcer = document.createElement('div')
    SET announcer.id = 'slide-announcer'
    SET announcer.role = 'status'
    SET announcer.aria-live = 'polite'
    SET announcer.aria-atomic = 'true'
    SET announcer.style = 'position: absolute; left: -10000px;'
    
    APPEND announcer to document.body
    SET a11y_state.announcer = announcer
  
  FUNCTION announce(message)
    IF a11y_state.announcer EXISTS THEN
      SET a11y_state.announcer.textContent = message
  
  FUNCTION setup_focus_management()
    FUNCTION trap_focus(container)
      LET focusable_elements = query_focusable_elements(container)
      
      IF focusable_elements.length === 0 THEN RETURN
      
      LET first_element = focusable_elements[0]
      LET last_element = focusable_elements[focusable_elements.length - 1]
      
      FUNCTION handle_tab(event)
        IF event.key !== 'Tab' THEN RETURN
        
        IF event.shiftKey THEN
          IF document.activeElement === first_element THEN
            event.preventDefault()
            last_element.focus()
        ELSE
          IF document.activeElement === last_element THEN
            event.preventDefault()
            first_element.focus()
      
      ATTACH handle_tab to container.keydown

## Event Coordination

FUNCTION create_event_coordinator()
  LET event_bus = create_event_bus()
  LET navigation = create_navigation_handler()
  LET touch = create_touch_handler()
  LET mouse = create_mouse_handler()
  LET fullscreen = create_fullscreen_handler()
  LET accessibility = create_accessibility_handler()
  
  FUNCTION initialize(config)
    // Initialize all handlers
    navigation.initialize(config)
    accessibility.initialize()
    
    // Connect event flows
    event_bus.on('navigation:next', () => navigation.navigate_next())
    event_bus.on('navigation:previous', () => navigation.navigate_previous())
    event_bus.on('navigation:goto', (data) => navigation.navigate_to_slide(data.slide))
    
    // Update UI on slide changes
    event_bus.on('slide:after-change', (data) => {
      update_slide_counter(data.current, data.total)
      accessibility.announce(`Slide ${data.current + 1} of ${data.total}`)
    })
    
    // Handle fullscreen events
    event_bus.on('fullscreen:toggle', () => fullscreen.toggle_fullscreen())
    
    RETURN {
      on: event_bus.on,
      off: event_bus.off,
      emit: event_bus.emit,
      navigate_to: navigation.navigate_to_slide,
      toggle_fullscreen: fullscreen.toggle_fullscreen
    }

## Performance Optimization

FUNCTION optimize_event_handling()
  FUNCTION debounce(func, delay)
    LET timeout_id = null
    
    RETURN FUNCTION(...args)
      CLEAR timeout_id
      SET timeout_id = setTimeout(() => {
        func.apply(this, args)
      }, delay)
  
  FUNCTION throttle(func, limit)
    LET in_throttle = false
    
    RETURN FUNCTION(...args)
      IF NOT in_throttle THEN
        func.apply(this, args)
        SET in_throttle = true
        setTimeout(() => {
          SET in_throttle = false
        }, limit)
  
  // Apply optimizations
  LET optimized_resize = debounce(handle_resize, 250)
  LET optimized_scroll = throttle(handle_scroll, 100)
  
  RETURN {
    resize: optimized_resize,
    scroll: optimized_scroll
  }