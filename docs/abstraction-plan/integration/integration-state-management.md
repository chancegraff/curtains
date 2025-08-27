# Integration - State Management

## State Management Connection to Presentation Flow

The state management system tracks presentation state and synchronizes with the UI.

## State Store Initialization

FUNCTION initialize_presentation_state(state_store)
  // Set initial state values
  state_store.setState('current_slide', 0)
  state_store.setState('total_slides', 0)
  state_store.setState('is_fullscreen', false)
  state_store.setState('is_presenting', false)
  state_store.setState('theme', 'default')
  state_store.setState('zoom_level', 1.0)
  state_store.setState('notes_visible', false)
  state_store.setState('navigation_history', [])
  state_store.setState('slide_timers', {})
  state_store.setState('annotations', [])
  state_store.setState('bookmarks', [])
  
  // Load persisted state if available
  load_persisted_state(state_store)
  
  // Set up auto-save
  setup_state_persistence(state_store)
  
  // Initialize computed values
  setup_computed_state(state_store)
  
  RETURN state_store

## Navigation State Management

FUNCTION manage_navigation_state(state_store)
  // Navigation helper functions
  FUNCTION navigate_to_slide(slide_index)
    LET current = state_store.getState('current_slide')
    LET total = state_store.getState('total_slides')
    
    // Validate slide index
    IF slide_index < 0 THEN
      slide_index = 0
    ELSE IF slide_index >= total THEN
      slide_index = total - 1
    
    IF slide_index === current THEN
      RETURN false
    
    // Update navigation history
    state_store.updateState('navigation_history', FUNCTION(history)
      LET new_history = [...history, current]
      // Keep only last 50 entries
      IF new_history.length > 50 THEN
        new_history = new_history.slice(-50)
      RETURN new_history
    )
    
    // Record slide timing
    record_slide_timing(state_store, current)
    
    // Update current slide
    state_store.setState('current_slide', slide_index)
    
    // Start timer for new slide
    start_slide_timer(state_store, slide_index)
    
    RETURN true
  
  FUNCTION go_back()
    LET history = state_store.getState('navigation_history')
    IF history.length === 0 THEN
      RETURN false
    
    LET previous = history[history.length - 1]
    
    // Remove last entry from history
    state_store.updateState('navigation_history', FUNCTION(h)
      RETURN h.slice(0, -1)
    )
    
    // Navigate to previous slide
    state_store.setState('current_slide', previous)
    
    RETURN true
  
  FUNCTION go_to_first()
    RETURN navigate_to_slide(0)
  
  FUNCTION go_to_last()
    LET total = state_store.getState('total_slides')
    RETURN navigate_to_slide(total - 1)
  
  RETURN {
    navigateToSlide: navigate_to_slide,
    goBack: go_back,
    goToFirst: go_to_first,
    goToLast: go_to_last
  }

## Slide Timing Management

FUNCTION record_slide_timing(state_store, slide_index)
  state_store.updateState('slide_timers', FUNCTION(timers)
    LET timer = timers[slide_index]
    IF timer AND timer.start_time THEN
      LET duration = Date.now() - timer.start_time
      
      IF NOT timer.total_time THEN
        timer.total_time = 0
      
      timer.total_time += duration
      timer.last_duration = duration
      timer.visit_count = (timer.visit_count || 0) + 1
      timer.start_time = null
    
    RETURN timers
  )

FUNCTION start_slide_timer(state_store, slide_index)
  state_store.updateState('slide_timers', FUNCTION(timers)
    IF NOT timers[slide_index] THEN
      timers[slide_index] = {
        total_time: 0,
        visit_count: 0
      }
    
    timers[slide_index].start_time = Date.now()
    
    RETURN timers
  )

## Theme State Management

FUNCTION manage_theme_state(state_store)
  FUNCTION set_theme(theme_name)
    LET valid_themes = [
      'default',
      'dark',
      'light',
      'high-contrast',
      'solarized',
      'monokai'
    ]
    
    IF NOT valid_themes.includes(theme_name) THEN
      RETURN false
    
    state_store.setState('theme', theme_name)
    apply_theme_to_dom(theme_name)
    
    RETURN true
  
  FUNCTION toggle_dark_mode()
    LET current_theme = state_store.getState('theme')
    LET new_theme = current_theme === 'dark' ? 'light' : 'dark'
    RETURN set_theme(new_theme)
  
  RETURN {
    setTheme: set_theme,
    toggleDarkMode: toggle_dark_mode
  }

## Presentation Mode State

FUNCTION manage_presentation_mode(state_store)
  FUNCTION enter_presentation()
    state_store.setState('is_presenting', true)
    state_store.setState('notes_visible', false)
    
    // Hide cursor after inactivity
    setup_cursor_auto_hide()
    
    // Disable text selection
    document.body.style.userSelect = 'none'
    
    // Add presentation class
    document.body.classList.add('presentation-mode')
  
  FUNCTION exit_presentation()
    state_store.setState('is_presenting', false)
    
    // Show cursor
    clear_cursor_auto_hide()
    
    // Enable text selection
    document.body.style.userSelect = 'auto'
    
    // Remove presentation class
    document.body.classList.remove('presentation-mode')
  
  FUNCTION toggle_presentation()
    LET is_presenting = state_store.getState('is_presenting')
    IF is_presenting THEN
      exit_presentation()
    ELSE
      enter_presentation()
  
  RETURN {
    enterPresentation: enter_presentation,
    exitPresentation: exit_presentation,
    togglePresentation: toggle_presentation
  }

## Annotation State Management

FUNCTION manage_annotation_state(state_store)
  FUNCTION add_annotation(slide_index, annotation)
    state_store.updateState('annotations', FUNCTION(annotations)
      LET new_annotation = {
        id: generate_id(),
        slide: slide_index,
        text: annotation.text,
        position: annotation.position,
        timestamp: Date.now()
      }
      
      RETURN [...annotations, new_annotation]
    )
  
  FUNCTION remove_annotation(annotation_id)
    state_store.updateState('annotations', FUNCTION(annotations)
      RETURN annotations.filter(a => a.id !== annotation_id)
    )
  
  FUNCTION get_slide_annotations(slide_index)
    LET all_annotations = state_store.getState('annotations')
    RETURN all_annotations.filter(a => a.slide === slide_index)
  
  RETURN {
    addAnnotation: add_annotation,
    removeAnnotation: remove_annotation,
    getSlideAnnotations: get_slide_annotations
  }

## Bookmark State Management

FUNCTION manage_bookmark_state(state_store)
  FUNCTION add_bookmark(slide_index, name)
    state_store.updateState('bookmarks', FUNCTION(bookmarks)
      LET new_bookmark = {
        id: generate_id(),
        slide: slide_index,
        name: name || `Slide ${slide_index + 1}`,
        timestamp: Date.now()
      }
      
      RETURN [...bookmarks, new_bookmark]
    )
  
  FUNCTION remove_bookmark(bookmark_id)
    state_store.updateState('bookmarks', FUNCTION(bookmarks)
      RETURN bookmarks.filter(b => b.id !== bookmark_id)
    )
  
  FUNCTION go_to_bookmark(bookmark_id)
    LET bookmarks = state_store.getState('bookmarks')
    LET bookmark = bookmarks.find(b => b.id === bookmark_id)
    
    IF bookmark THEN
      state_store.setState('current_slide', bookmark.slide)
      RETURN true
    
    RETURN false
  
  RETURN {
    addBookmark: add_bookmark,
    removeBookmark: remove_bookmark,
    goToBookmark: go_to_bookmark
  }

## State Persistence

FUNCTION setup_state_persistence(state_store)
  LET storage_key = 'curtains_presentation_state'
  LET save_debounce = null
  
  // Auto-save state changes
  state_store.subscribe('current_slide', debounced_save)
  state_store.subscribe('theme', debounced_save)
  state_store.subscribe('zoom_level', debounced_save)
  state_store.subscribe('bookmarks', debounced_save)
  state_store.subscribe('annotations', debounced_save)
  
  FUNCTION debounced_save()
    clearTimeout(save_debounce)
    save_debounce = setTimeout(save_state, 1000)
  
  FUNCTION save_state()
    LET state_to_save = {
      current_slide: state_store.getState('current_slide'),
      theme: state_store.getState('theme'),
      zoom_level: state_store.getState('zoom_level'),
      bookmarks: state_store.getState('bookmarks'),
      annotations: state_store.getState('annotations'),
      slide_timers: state_store.getState('slide_timers'),
      saved_at: Date.now()
    }
    
    TRY
      localStorage.setItem(storage_key, JSON.stringify(state_to_save))
    CATCH error
      console.warn('Failed to save state:', error)

FUNCTION load_persisted_state(state_store)
  LET storage_key = 'curtains_presentation_state'
  
  TRY
    LET saved_state = localStorage.getItem(storage_key)
    IF saved_state THEN
      LET parsed = JSON.parse(saved_state)
      
      // Check if saved state is recent (within 24 hours)
      IF Date.now() - parsed.saved_at < 24 * 60 * 60 * 1000 THEN
        // Restore state values
        IF parsed.current_slide !== undefined THEN
          state_store.setState('current_slide', parsed.current_slide)
        
        IF parsed.theme THEN
          state_store.setState('theme', parsed.theme)
        
        IF parsed.zoom_level THEN
          state_store.setState('zoom_level', parsed.zoom_level)
        
        IF parsed.bookmarks THEN
          state_store.setState('bookmarks', parsed.bookmarks)
        
        IF parsed.annotations THEN
          state_store.setState('annotations', parsed.annotations)
        
        IF parsed.slide_timers THEN
          state_store.setState('slide_timers', parsed.slide_timers)
  CATCH error
    console.warn('Failed to load persisted state:', error)

## Computed State Values

FUNCTION setup_computed_state(state_store)
  // Progress percentage
  FUNCTION compute_progress()
    LET current = state_store.getState('current_slide')
    LET total = state_store.getState('total_slides')
    
    IF total <= 1 THEN RETURN 0
    RETURN (current / (total - 1)) * 100
  
  // Is at beginning
  FUNCTION is_at_beginning()
    RETURN state_store.getState('current_slide') === 0
  
  // Is at end
  FUNCTION is_at_end()
    LET current = state_store.getState('current_slide')
    LET total = state_store.getState('total_slides')
    RETURN current === total - 1
  
  // Can go back
  FUNCTION can_go_back()
    LET history = state_store.getState('navigation_history')
    RETURN history.length > 0
  
  // Total presentation time
  FUNCTION get_total_time()
    LET timers = state_store.getState('slide_timers')
    LET total = 0
    
    FOR EACH slide_timer IN Object.values(timers) DO
      total += slide_timer.total_time || 0
    
    RETURN total
  
  RETURN {
    computeProgress: compute_progress,
    isAtBeginning: is_at_beginning,
    isAtEnd: is_at_end,
    canGoBack: can_go_back,
    getTotalTime: get_total_time
  }

## State Synchronization with DOM

FUNCTION sync_state_to_dom(state_store)
  // Sync current slide
  state_store.subscribe('current_slide', FUNCTION(change)
    update_slide_visibility(change.newValue)
    update_progress_bar(change.newValue, state_store.getState('total_slides'))
    update_url_hash(change.newValue)
  )
  
  // Sync theme
  state_store.subscribe('theme', FUNCTION(change)
    apply_theme_to_dom(change.newValue)
  )
  
  // Sync fullscreen
  state_store.subscribe('is_fullscreen', FUNCTION(change)
    IF change.newValue THEN
      enter_fullscreen_mode()
    ELSE
      exit_fullscreen_mode()
  )
  
  // Sync zoom level
  state_store.subscribe('zoom_level', FUNCTION(change)
    apply_zoom_level(change.newValue)
  )
  
  // Sync notes visibility
  state_store.subscribe('notes_visible', FUNCTION(change)
    toggle_notes_visibility(change.newValue)
  )

FUNCTION update_slide_visibility(slide_index)
  LET slides = document.querySelectorAll('.curtains-slide')
  
  slides.forEach(FUNCTION(slide, index)
    IF index === slide_index THEN
      slide.classList.add('active')
      slide.setAttribute('aria-hidden', 'false')
    ELSE
      slide.classList.remove('active')
      slide.setAttribute('aria-hidden', 'true')
  )

FUNCTION update_progress_bar(current, total)
  LET progress_bar = document.querySelector('.curtains-progress')
  IF progress_bar THEN
    LET percentage = total > 1 ? (current / (total - 1)) * 100 : 0
    progress_bar.style.width = `${percentage}%`

FUNCTION update_url_hash(slide_index)
  // Update URL without triggering navigation
  history.replaceState(null, '', `#slide-${slide_index + 1}`)

## Helper Functions

FUNCTION generate_id()
  RETURN Date.now().toString(36) + Math.random().toString(36).substring(2)

FUNCTION apply_theme_to_dom(theme_name)
  // Remove all theme classes
  document.body.className = document.body.className
    .replace(/\btheme-\S+/g, '')
  
  // Add new theme class
  document.body.classList.add(`theme-${theme_name}`)

FUNCTION apply_zoom_level(zoom)
  LET stage = document.querySelector('.curtains-stage')
  IF stage THEN
    stage.style.transform = `scale(${zoom})`