# State Management Abstraction

## State Interface Definition

FUNCTION define_state_interface()
  INTERFACE IStateManager
    METHOD get_state(key)
    METHOD set_state(key, value)
    METHOD update_state(key, updater_function)
    METHOD subscribe(key, listener)
    METHOD get_snapshot()
    METHOD reset()

## Functional State Store

FUNCTION create_state_store()
  LET state = new Map()
  LET listeners = new Map()
  LET history = []
  LET max_history = 50
  
  FUNCTION get_state(key)
    IF key is undefined THEN
      RETURN create_state_snapshot()
    ELSE
      RETURN state.get(key)
  
  FUNCTION set_state(key, value)
    LET old_value = state.get(key)
    
    IF value !== old_value THEN
      SET state[key] = value
      
      // Record in history
      ADD {action: 'set', key, old_value, new_value: value, timestamp: now()} to history
      
      IF history.length > max_history THEN
        REMOVE first item from history
      
      // Notify listeners
      notify_listeners(key, value, old_value)
  
  FUNCTION update_state(key, updater)
    LET current_value = state.get(key)
    LET new_value = updater(current_value)
    set_state(key, new_value)
  
  FUNCTION subscribe(key, listener)
    IF NOT listeners has key THEN
      SET listeners[key] = []
    
    ADD listener to listeners[key]
    
    // Return unsubscribe function
    RETURN FUNCTION unsubscribe()
      REMOVE listener from listeners[key]
  
  FUNCTION notify_listeners(key, new_value, old_value)
    IF listeners has key THEN
      FOR each listener in listeners[key] DO
        TRY
          listener({
            key: key,
            new_value: new_value,
            old_value: old_value,
            timestamp: now()
          })
        CATCH error
          console.error('Listener error:', error)
  
  FUNCTION create_state_snapshot()
    LET snapshot = {}
    FOR each [key, value] in state DO
      SET snapshot[key] = deep_clone(value)
    RETURN snapshot
  
  FUNCTION reset()
    state.clear()
    history.clear()
    // Keep listeners but notify them of reset
    FOR each key in listeners.keys() DO
      notify_listeners(key, undefined, state.get(key))

## Presentation State Manager

FUNCTION create_presentation_state()
  LET store = create_state_store()
  
  // Initialize default state
  store.set_state('current_slide', 0)
  store.set_state('total_slides', 0)
  store.set_state('is_fullscreen', false)
  store.set_state('is_presenting', false)
  store.set_state('theme', 'default')
  store.set_state('zoom_level', 1.0)
  store.set_state('notes_visible', false)
  store.set_state('navigation_history', [])
  
  FUNCTION navigate_to_slide(slide_index)
    LET current = store.get_state('current_slide')
    LET total = store.get_state('total_slides')
    
    // Validate slide index
    IF slide_index < 0 THEN
      slide_index = 0
    ELSE IF slide_index >= total THEN
      slide_index = total - 1
    
    IF slide_index !== current THEN
      // Update navigation history
      store.update_state('navigation_history', FUNCTION(history)
        LET new_history = [...history, current]
        IF new_history.length > 20 THEN
          new_history.shift()  // Keep only last 20
        RETURN new_history
      )
      
      // Update current slide
      store.set_state('current_slide', slide_index)
      
      RETURN true
    
    RETURN false
  
  FUNCTION go_back()
    LET history = store.get_state('navigation_history')
    IF history.length > 0 THEN
      LET previous_slide = history.pop()
      store.set_state('navigation_history', history)
      store.set_state('current_slide', previous_slide)
      RETURN true
    RETURN false
  
  FUNCTION toggle_fullscreen()
    store.update_state('is_fullscreen', FUNCTION(current)
      RETURN NOT current
    )
  
  FUNCTION set_theme(theme_name)
    LET valid_themes = ['default', 'dark', 'light', 'high-contrast']
    IF theme_name in valid_themes THEN
      store.set_state('theme', theme_name)
      RETURN true
    RETURN false
  
  RETURN {
    get: store.get_state,
    set: store.set_state,
    update: store.update_state,
    subscribe: store.subscribe,
    navigate_to_slide: navigate_to_slide,
    go_back: go_back,
    toggle_fullscreen: toggle_fullscreen,
    set_theme: set_theme
  }

## View State Synchronization

FUNCTION create_view_synchronizer(state_manager)
  LET sync_targets = new Map()
  
  FUNCTION register_sync_target(element_selector, state_key, update_function)
    LET element = document.querySelector(element_selector)
    IF NOT element THEN RETURN false
    
    // Store sync configuration
    SET sync_targets[state_key] = {
      element: element,
      selector: element_selector,
      updater: update_function
    }
    
    // Subscribe to state changes
    state_manager.subscribe(state_key, FUNCTION(change)
      update_function(element, change.new_value)
    )
    
    // Initial sync
    LET initial_value = state_manager.get(state_key)
    update_function(element, initial_value)
    
    RETURN true
  
  FUNCTION sync_slide_position(state_manager)
    register_sync_target('.curtains-stage', 'current_slide', FUNCTION(element, slide_index)
      element.style.transform = `translateX(-${slide_index * 100}%)`
    )
  
  FUNCTION sync_slide_counter(state_manager)
    register_sync_target('.curtains-counter', 'current_slide', FUNCTION(element, slide_index)
      LET total = state_manager.get('total_slides')
      element.textContent = `${slide_index + 1}/${total}`
    )
  
  FUNCTION sync_fullscreen_class(state_manager)
    register_sync_target('body', 'is_fullscreen', FUNCTION(element, is_fullscreen)
      IF is_fullscreen THEN
        element.classList.add('fullscreen-mode')
      ELSE
        element.classList.remove('fullscreen-mode')
    )
  
  FUNCTION sync_theme_class(state_manager)
    register_sync_target('body', 'theme', FUNCTION(element, theme)
      // Remove all theme classes
      element.className = element.className.replace(/theme-\S+/g, '')
      // Add new theme class
      element.classList.add(`theme-${theme}`)
    )
  
  FUNCTION initialize()
    sync_slide_position(state_manager)
    sync_slide_counter(state_manager)
    sync_fullscreen_class(state_manager)
    sync_theme_class(state_manager)

## Persistent State

FUNCTION create_persistent_state()
  LET storage_key = 'curtains_presentation_state'
  
  FUNCTION save_to_storage(state)
    TRY
      LET serialized = JSON.stringify({
        current_slide: state.current_slide,
        theme: state.theme,
        zoom_level: state.zoom_level,
        notes_visible: state.notes_visible,
        saved_at: new Date().toISOString()
      })
      localStorage.setItem(storage_key, serialized)
      RETURN true
    CATCH error
      console.warn('Failed to save state:', error)
      RETURN false
  
  FUNCTION load_from_storage()
    TRY
      LET stored = localStorage.getItem(storage_key)
      IF stored THEN
        LET parsed = JSON.parse(stored)
        
        // Validate stored data age (expire after 24 hours)
        LET saved_time = new Date(parsed.saved_at)
        LET now = new Date()
        LET hours_elapsed = (now - saved_time) / (1000 * 60 * 60)
        
        IF hours_elapsed < 24 THEN
          RETURN parsed
      
      RETURN null
    CATCH error
      console.warn('Failed to load state:', error)
      RETURN null
  
  FUNCTION clear_storage()
    localStorage.removeItem(storage_key)

## State Computed Values

FUNCTION create_computed_state(state_manager)
  LET computed_cache = new Map()
  LET dependencies = new Map()
  
  FUNCTION define_computed(name, dependencies_list, compute_function)
    // Store computation definition
    SET dependencies[name] = dependencies_list
    
    // Subscribe to dependency changes
    FOR each dep in dependencies_list DO
      state_manager.subscribe(dep, FUNCTION()
        // Invalidate cache
        computed_cache.delete(name)
      )
  
  FUNCTION get_computed(name)
    IF computed_cache has name THEN
      RETURN computed_cache.get(name)
    
    // Compute value
    LET deps = dependencies.get(name)
    LET dep_values = deps.map(d => state_manager.get(d))
    LET computed_value = compute_function(...dep_values)
    
    // Cache result
    computed_cache.set(name, computed_value)
    
    RETURN computed_value
  
  // Define common computed values
  define_computed('progress_percentage', ['current_slide', 'total_slides'], 
    FUNCTION(current, total)
      IF total === 0 THEN RETURN 0
      RETURN (current / (total - 1)) * 100
  )
  
  define_computed('is_first_slide', ['current_slide'],
    FUNCTION(current)
      RETURN current === 0
  )
  
  define_computed('is_last_slide', ['current_slide', 'total_slides'],
    FUNCTION(current, total)
      RETURN current === total - 1
  )
  
  RETURN {
    get: get_computed,
    define: define_computed
  }

## State Middleware

FUNCTION create_state_middleware()
  LET middlewares = []
  
  FUNCTION use(middleware_function)
    ADD middleware_function to middlewares
  
  FUNCTION apply_middleware(action, state, next)
    LET index = 0
    
    FUNCTION dispatch(action_to_dispatch)
      IF index >= middlewares.length THEN
        RETURN next(action_to_dispatch)
      
      LET middleware = middlewares[index]
      index += 1
      
      RETURN middleware(action_to_dispatch, state, dispatch)
    
    RETURN dispatch(action)
  
  // Example middleware: Logger
  FUNCTION logger_middleware(action, state, next)
    console.log('State action:', action)
    LET result = next(action)
    console.log('New state:', state.get_snapshot())
    RETURN result
  
  // Example middleware: Validator
  FUNCTION validator_middleware(action, state, next)
    IF action.type === 'SET_SLIDE' THEN
      LET total = state.get('total_slides')
      IF action.value < 0 OR action.value >= total THEN
        console.warn('Invalid slide index:', action.value)
        RETURN false
    
    RETURN next(action)
  
  RETURN {
    use: use,
    apply: apply_middleware,
    logger: logger_middleware,
    validator: validator_middleware
  }

## State Time Travel

FUNCTION create_time_travel(state_manager)
  LET history = []
  LET current_index = -1
  LET max_history = 100
  
  FUNCTION record_state()
    LET snapshot = state_manager.get_snapshot()
    
    // Remove any future states if we've gone back
    IF current_index < history.length - 1 THEN
      history = history.slice(0, current_index + 1)
    
    ADD snapshot to history
    current_index += 1
    
    IF history.length > max_history THEN
      REMOVE first item from history
      current_index -= 1
  
  FUNCTION undo()
    IF current_index > 0 THEN
      current_index -= 1
      restore_state(history[current_index])
      RETURN true
    RETURN false
  
  FUNCTION redo()
    IF current_index < history.length - 1 THEN
      current_index += 1
      restore_state(history[current_index])
      RETURN true
    RETURN false
  
  FUNCTION restore_state(snapshot)
    FOR each [key, value] in snapshot DO
      state_manager.set(key, value)
  
  RETURN {
    record: record_state,
    undo: undo,
    redo: redo,
    can_undo: () => current_index > 0,
    can_redo: () => current_index < history.length - 1
  }