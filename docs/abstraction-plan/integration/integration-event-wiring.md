# Integration - Event Wiring

## Event System Connection to UI

The event wiring connects the abstraction layer's event bus to DOM events and user interactions.

## Event System Initialization

FUNCTION initialize_event_system(event_bus, state_manager)
  // Set up DOM event listeners
  setup_keyboard_events(event_bus)
  setup_mouse_events(event_bus)
  setup_touch_events(event_bus)
  setup_window_events(event_bus)
  
  // Connect event bus to state changes
  wire_event_to_state(event_bus, state_manager)
  
  // Set up UI update handlers
  setup_ui_update_handlers(event_bus, state_manager)
  
  // Initialize accessibility features
  setup_accessibility_events(event_bus)

## Keyboard Event Wiring

FUNCTION setup_keyboard_events(event_bus)
  document.addEventListener('keydown', FUNCTION(event)
    LET key_event = {
      key: event.key,
      code: event.code,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey
    }
    
    // Emit keyboard event
    event_bus.emit('keyboard:keydown', key_event)
    
    // Handle specific navigation keys
    SWITCH event.key
      CASE 'ArrowRight':
      CASE ' ':
        event.preventDefault()
        event_bus.emit('navigation:next')
        
      CASE 'ArrowLeft':
        event.preventDefault()
        event_bus.emit('navigation:previous')
        
      CASE 'ArrowUp':
        IF event.ctrlKey THEN
          event.preventDefault()
          event_bus.emit('navigation:first')
        
      CASE 'ArrowDown':
        IF event.ctrlKey THEN
          event.preventDefault()
          event_bus.emit('navigation:last')
        
      CASE 'Home':
        event.preventDefault()
        event_bus.emit('navigation:first')
        
      CASE 'End':
        event.preventDefault()
        event_bus.emit('navigation:last')
        
      CASE 'f':
      CASE 'F':
        event.preventDefault()
        event_bus.emit('fullscreen:toggle')
        
      CASE 'Escape':
        event_bus.emit('fullscreen:exit')
        
      CASE 'Enter':
        IF event.altKey THEN
          event.preventDefault()
          event_bus.emit('fullscreen:toggle')
        
      CASE '0' THROUGH '9':
        handle_number_navigation(event.key, event_bus)
  )

FUNCTION handle_number_navigation(key, event_bus)
  LET number = parseInt(key)
  
  // Build multi-digit slide number
  IF NOT window.slideNumberBuffer THEN
    window.slideNumberBuffer = ''
    window.slideNumberTimeout = null
  
  window.slideNumberBuffer += key
  
  // Clear previous timeout
  IF window.slideNumberTimeout THEN
    clearTimeout(window.slideNumberTimeout)
  
  // Set new timeout to process number
  window.slideNumberTimeout = setTimeout(FUNCTION()
    LET slide_number = parseInt(window.slideNumberBuffer)
    window.slideNumberBuffer = ''
    
    IF slide_number > 0 THEN
      event_bus.emit('navigation:goto', {
        slide: slide_number - 1  // Convert to 0-based index
      })
  , 500)

## Mouse Event Wiring

FUNCTION setup_mouse_events(event_bus)
  LET mouse_state = {
    isDragging: false,
    startX: 0,
    startY: 0,
    threshold: 50
  }
  
  // Click navigation
  document.addEventListener('click', FUNCTION(event)
    // Ignore clicks on interactive elements
    IF is_interactive_element(event.target) THEN
      RETURN
    
    LET viewport_width = window.innerWidth
    LET click_x = event.clientX
    
    // Determine navigation direction based on click position
    IF click_x > viewport_width * 0.75 THEN
      event_bus.emit('navigation:next')
    ELSE IF click_x < viewport_width * 0.25 THEN
      event_bus.emit('navigation:previous')
  )
  
  // Drag navigation
  document.addEventListener('mousedown', FUNCTION(event)
    IF event.button === 0 THEN  // Left button only
      mouse_state.isDragging = true
      mouse_state.startX = event.clientX
      mouse_state.startY = event.clientY
  )
  
  document.addEventListener('mousemove', FUNCTION(event)
    IF NOT mouse_state.isDragging THEN RETURN
    
    LET deltaX = event.clientX - mouse_state.startX
    LET deltaY = event.clientY - mouse_state.startY
    
    // Show drag preview
    IF Math.abs(deltaX) > 10 THEN
      event_bus.emit('navigation:drag', {
        deltaX: deltaX,
        deltaY: deltaY
      })
  )
  
  document.addEventListener('mouseup', FUNCTION(event)
    IF NOT mouse_state.isDragging THEN RETURN
    
    LET deltaX = event.clientX - mouse_state.startX
    
    // Determine if swipe was significant enough
    IF Math.abs(deltaX) > mouse_state.threshold THEN
      IF deltaX > 0 THEN
        event_bus.emit('navigation:previous')
      ELSE
        event_bus.emit('navigation:next')
    
    mouse_state.isDragging = false
    event_bus.emit('navigation:drag:end')
  )

## Touch Event Wiring

FUNCTION setup_touch_events(event_bus)
  LET touch_state = {
    startX: 0,
    startY: 0,
    startTime: 0,
    isSwipping: false
  }
  
  document.addEventListener('touchstart', FUNCTION(event)
    LET touch = event.touches[0]
    touch_state.startX = touch.clientX
    touch_state.startY = touch.clientY
    touch_state.startTime = Date.now()
    touch_state.isSwipping = true
    
    event_bus.emit('touch:start', {
      x: touch.clientX,
      y: touch.clientY
    })
  )
  
  document.addEventListener('touchmove', FUNCTION(event)
    IF NOT touch_state.isSwipping THEN RETURN
    
    LET touch = event.touches[0]
    LET deltaX = touch.clientX - touch_state.startX
    LET deltaY = touch.clientY - touch_state.startY
    
    // Prevent vertical scrolling if horizontal swipe detected
    IF Math.abs(deltaX) > Math.abs(deltaY) AND Math.abs(deltaX) > 10 THEN
      event.preventDefault()
      
      event_bus.emit('touch:move', {
        deltaX: deltaX,
        deltaY: deltaY
      })
  )
  
  document.addEventListener('touchend', FUNCTION(event)
    IF NOT touch_state.isSwipping THEN RETURN
    
    LET touch = event.changedTouches[0]
    LET deltaX = touch.clientX - touch_state.startX
    LET deltaY = touch.clientY - touch_state.startY
    LET deltaTime = Date.now() - touch_state.startTime
    
    // Determine if valid swipe gesture
    IF Math.abs(deltaX) > 50 AND Math.abs(deltaX) > Math.abs(deltaY) THEN
      IF deltaTime < 500 THEN  // Quick swipe
        IF deltaX > 0 THEN
          event_bus.emit('navigation:previous')
        ELSE
          event_bus.emit('navigation:next')
    
    touch_state.isSwipping = false
    event_bus.emit('touch:end')
  )
  
  // Handle multi-touch gestures
  document.addEventListener('touchstart', FUNCTION(event)
    IF event.touches.length === 2 THEN
      // Two-finger tap for fullscreen
      event_bus.emit('fullscreen:toggle')
  )

## Window Event Wiring

FUNCTION setup_window_events(event_bus)
  // Resize events
  LET resize_timeout = null
  window.addEventListener('resize', FUNCTION()
    // Debounce resize events
    clearTimeout(resize_timeout)
    resize_timeout = setTimeout(FUNCTION()
      event_bus.emit('window:resize', {
        width: window.innerWidth,
        height: window.innerHeight
      })
    , 250)
  )
  
  // Fullscreen change events
  document.addEventListener('fullscreenchange', FUNCTION()
    event_bus.emit('fullscreen:change', {
      isFullscreen: document.fullscreenElement !== null
    })
  )
  
  // Visibility change events
  document.addEventListener('visibilitychange', FUNCTION()
    event_bus.emit('visibility:change', {
      isVisible: !document.hidden
    })
  )
  
  // Online/offline events
  window.addEventListener('online', FUNCTION()
    event_bus.emit('connection:online')
  )
  
  window.addEventListener('offline', FUNCTION()
    event_bus.emit('connection:offline')
  )

## Event to State Wiring

FUNCTION wire_event_to_state(event_bus, state_manager)
  // Navigation events update current slide
  event_bus.on('navigation:next', FUNCTION()
    LET current = state_manager.get('current_slide')
    LET total = state_manager.get('total_slides')
    LET next = (current + 1) % total
    state_manager.navigateToSlide(next)
  )
  
  event_bus.on('navigation:previous', FUNCTION()
    LET current = state_manager.get('current_slide')
    LET total = state_manager.get('total_slides')
    LET prev = current === 0 ? total - 1 : current - 1
    state_manager.navigateToSlide(prev)
  )
  
  event_bus.on('navigation:goto', FUNCTION(event)
    state_manager.navigateToSlide(event.data.slide)
  )
  
  event_bus.on('navigation:first', FUNCTION()
    state_manager.navigateToSlide(0)
  )
  
  event_bus.on('navigation:last', FUNCTION()
    LET total = state_manager.get('total_slides')
    state_manager.navigateToSlide(total - 1)
  )
  
  // Fullscreen events update state
  event_bus.on('fullscreen:toggle', FUNCTION()
    state_manager.toggleFullscreen()
  )
  
  event_bus.on('fullscreen:change', FUNCTION(event)
    state_manager.set('is_fullscreen', event.data.isFullscreen)
  )
  
  // Theme events
  event_bus.on('theme:change', FUNCTION(event)
    state_manager.setTheme(event.data.theme)
  )

## UI Update Handlers

FUNCTION setup_ui_update_handlers(event_bus, state_manager)
  // Update slide position when navigation occurs
  state_manager.subscribe('current_slide', FUNCTION(change)
    update_slide_position(change.newValue)
    update_slide_counter(change.newValue, state_manager.get('total_slides'))
    update_navigation_buttons(change.newValue, state_manager.get('total_slides'))
    
    // Emit slide change event
    event_bus.emit('slide:change', {
      from: change.oldValue,
      to: change.newValue
    })
  )
  
  // Update fullscreen class
  state_manager.subscribe('is_fullscreen', FUNCTION(change)
    IF change.newValue THEN
      document.body.classList.add('fullscreen-mode')
      enter_fullscreen()
    ELSE
      document.body.classList.remove('fullscreen-mode')
      exit_fullscreen()
  )
  
  // Update theme
  state_manager.subscribe('theme', FUNCTION(change)
    update_theme_class(change.oldValue, change.newValue)
  )

FUNCTION update_slide_position(slide_index)
  LET stage = document.querySelector('.curtains-stage')
  IF stage THEN
    stage.style.transform = `translateX(-${slide_index * 100}%)`
    
    // Update active slide class
    LET slides = document.querySelectorAll('.curtains-slide')
    slides.forEach(FUNCTION(slide, index)
      IF index === slide_index THEN
        slide.classList.add('active')
      ELSE
        slide.classList.remove('active')
    )

FUNCTION update_slide_counter(current, total)
  LET counter = document.querySelector('.curtains-counter')
  IF NOT counter THEN
    // Create counter if it doesn't exist
    counter = document.createElement('div')
    counter.className = 'curtains-counter'
    document.body.appendChild(counter)
  
  counter.textContent = `${current + 1} / ${total}`

## Accessibility Event Wiring

FUNCTION setup_accessibility_events(event_bus)
  // Create screen reader announcer
  LET announcer = create_announcer()
  
  // Announce slide changes
  event_bus.on('slide:change', FUNCTION(event)
    LET message = `Slide ${event.data.to + 1}`
    announce(announcer, message)
  )
  
  // Announce fullscreen changes
  event_bus.on('fullscreen:change', FUNCTION(event)
    LET message = event.data.isFullscreen ? 
      'Entered fullscreen mode' : 
      'Exited fullscreen mode'
    announce(announcer, message)
  )
  
  // Set up focus management
  setup_focus_management(event_bus)

FUNCTION create_announcer()
  LET announcer = document.createElement('div')
  announcer.setAttribute('role', 'status')
  announcer.setAttribute('aria-live', 'polite')
  announcer.setAttribute('aria-atomic', 'true')
  announcer.style.position = 'absolute'
  announcer.style.left = '-10000px'
  announcer.style.width = '1px'
  announcer.style.height = '1px'
  announcer.style.overflow = 'hidden'
  document.body.appendChild(announcer)
  
  RETURN announcer

FUNCTION announce(announcer, message)
  // Clear and set message for screen readers
  announcer.textContent = ''
  setTimeout(FUNCTION()
    announcer.textContent = message
  , 100)

## Helper Functions

FUNCTION is_interactive_element(element)
  LET interactive_tags = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT']
  RETURN interactive_tags.includes(element.tagName) OR 
         element.hasAttribute('tabindex') OR
         element.hasAttribute('contenteditable')

FUNCTION enter_fullscreen()
  LET element = document.documentElement
  
  IF element.requestFullscreen THEN
    element.requestFullscreen()
  ELSE IF element.webkitRequestFullscreen THEN
    element.webkitRequestFullscreen()
  ELSE IF element.mozRequestFullScreen THEN
    element.mozRequestFullScreen()
  ELSE IF element.msRequestFullscreen THEN
    element.msRequestFullscreen()

FUNCTION exit_fullscreen()
  IF document.exitFullscreen THEN
    document.exitFullscreen()
  ELSE IF document.webkitExitFullscreen THEN
    document.webkitExitFullscreen()
  ELSE IF document.mozCancelFullScreen THEN
    document.mozCancelFullScreen()
  ELSE IF document.msExitFullscreen THEN
    document.msExitFullscreen()