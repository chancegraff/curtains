# Integration - Main Pipeline

## Pipeline Architecture

The main pipeline coordinates all phases of markdown processing through a unified interface.

## Pipeline Setup

FUNCTION setup_main_pipeline()
  // Create core components
  LET registry = create_global_registry()
  LET state_manager = create_presentation_state()
  LET event_bus = create_event_bus()
  LET container_system = create_container_factory()
  
  // Create pipeline coordinator
  LET coordinator = create_pipeline_coordinator(
    registry,
    state_manager,
    event_bus,
    container_system
  )
  
  // Register default adapters
  register_default_adapters(registry)
  
  // Setup middleware chain
  setup_middleware_chain(registry)
  
  // Initialize event handlers
  initialize_event_handlers(event_bus, state_manager)
  
  RETURN coordinator

## Default Adapter Registration

FUNCTION register_default_adapters(registry)
  // Register parser adapter
  LET parser_adapter = create_parser_adapter()
  registry.register_parser('default', parser_adapter)
  registry.register_parser('curtains', parser_adapter)
  registry.register_parser('markdown', create_standard_markdown_adapter())
  
  // Register transformer adapter
  LET transformer_adapter = create_transformer_adapter()
  registry.register_transformer('default', transformer_adapter)
  
  // Register renderer adapter
  LET renderer_adapter = create_renderer_adapter()
  registry.register_renderer('default', renderer_adapter)
  registry.register_renderer('html', renderer_adapter)

## Middleware Chain Setup

FUNCTION setup_middleware_chain(registry)
  // Validation middleware
  registry.add_middleware({
    name: 'validator',
    phases: ['afterParse', 'afterTransform', 'beforeRender'],
    process: FUNCTION(context, phase)
      SWITCH phase
        CASE 'afterParse':
          validate_ast_structure(context.ast)
        CASE 'afterTransform':
          validate_transformed_document(context.transformed)
        CASE 'beforeRender':
          validate_render_input(context.transformed)
      RETURN context
  })
  
  // Logging middleware
  registry.add_middleware({
    name: 'logger',
    phases: ['*'],
    process: FUNCTION(context, phase)
      LOG `Pipeline phase: ${phase}`
      LOG `Context keys: ${Object.keys(context)}`
      IF context.errors.length > 0 THEN
        LOG `Errors: ${context.errors}`
      RETURN context
  })
  
  // Container processing middleware
  registry.add_middleware({
    name: 'container_processor',
    phases: ['afterParse'],
    process: FUNCTION(context, phase)
      IF phase === 'afterParse' THEN
        context.ast = process_container_nodes(context.ast)
      RETURN context
  })
  
  // Style scoping middleware
  registry.add_middleware({
    name: 'style_scoper',
    phases: ['afterTransform'],
    process: FUNCTION(context, phase)
      IF phase === 'afterTransform' THEN
        context.transformed = apply_style_scoping(context.transformed)
      RETURN context
  })

## Pipeline Processing Function

FUNCTION process_markdown_through_pipeline(input, options, coordinator)
  // Create processing context
  LET context = {
    input: input,
    options: normalize_options(options),
    errors: [],
    timing: {
      start: performance.now(),
      phases: {}
    }
  }
  
  TRY
    // Phase 1: Parse
    context = execute_parse_phase(context, coordinator)
    
    // Phase 2: Transform
    context = execute_transform_phase(context, coordinator)
    
    // Phase 3: Render
    context = execute_render_phase(context, coordinator)
    
    // Phase 4: Finalize
    context = execute_finalize_phase(context, coordinator)
    
    RETURN {
      success: true,
      output: context.output,
      metadata: {
        timing: context.timing,
        slideCount: context.transformed.slides.length,
        errors: context.errors
      }
    }
    
  CATCH error
    RETURN {
      success: false,
      error: wrap_pipeline_error(error, context),
      partialOutput: context.partialOutput,
      metadata: {
        timing: context.timing,
        errors: context.errors
      }
    }

## Phase Execution Functions

FUNCTION execute_parse_phase(context, coordinator)
  LET phase_start = performance.now()
  
  // Get parser from registry
  LET parser_name = context.options.parser || 'default'
  LET parser = coordinator.registry.get_adapter('parser', parser_name)
  
  // Apply before middleware
  context = apply_middleware_chain(context, 'beforeParse')
  
  // Parse input
  context.ast = parser.parse(context.input)
  
  // Validate AST
  IF NOT is_valid_ast(context.ast) THEN
    THROW ValidationError('Invalid AST structure')
  
  // Apply after middleware
  context = apply_middleware_chain(context, 'afterParse')
  
  context.timing.phases.parse = performance.now() - phase_start
  RETURN context

FUNCTION execute_transform_phase(context, coordinator)
  LET phase_start = performance.now()
  
  // Get transformer from registry
  LET transformer_name = context.options.transformer || 'default'
  LET transformer = coordinator.registry.get_adapter('transformer', transformer_name)
  
  // Apply before middleware
  context = apply_middleware_chain(context, 'beforeTransform')
  
  // Transform AST to presentation document
  context.transformed = transformer.transform(context.ast)
  
  // Process containers if present
  IF has_containers(context.transformed) THEN
    context.transformed = process_containers_in_document(context.transformed)
  
  // Apply after middleware
  context = apply_middleware_chain(context, 'afterTransform')
  
  context.timing.phases.transform = performance.now() - phase_start
  RETURN context

FUNCTION execute_render_phase(context, coordinator)
  LET phase_start = performance.now()
  
  // Get renderer from registry
  LET renderer_name = context.options.renderer || 'default'
  LET renderer = coordinator.registry.get_adapter('renderer', renderer_name)
  
  // Apply before middleware
  context = apply_middleware_chain(context, 'beforeRender')
  
  // Render to HTML
  context.output = renderer.render(context.transformed, context.options)
  
  // Validate output
  IF NOT is_valid_html(context.output) THEN
    THROW RenderingError('Invalid HTML output')
  
  // Apply after middleware
  context = apply_middleware_chain(context, 'afterRender')
  
  context.timing.phases.render = performance.now() - phase_start
  RETURN context

FUNCTION execute_finalize_phase(context, coordinator)
  LET phase_start = performance.now()
  
  // Update presentation state
  coordinator.state_manager.set('total_slides', context.transformed.slides.length)
  coordinator.state_manager.set('current_slide', 0)
  coordinator.state_manager.set('theme', context.options.theme || 'default')
  
  // Initialize event system
  coordinator.event_bus.emit('presentation:ready', {
    slideCount: context.transformed.slides.length,
    theme: context.options.theme
  })
  
  // Apply finalize middleware
  context = apply_middleware_chain(context, 'finalize')
  
  context.timing.phases.finalize = performance.now() - phase_start
  context.timing.total = performance.now() - context.timing.start
  
  RETURN context

## Error Handling

FUNCTION wrap_pipeline_error(error, context)
  LET wrapped = {
    message: error.message,
    code: determine_error_code(error),
    phase: determine_error_phase(context),
    context: {
      input: truncate_for_error(context.input),
      options: context.options,
      currentPhase: context.currentPhase,
      completedPhases: get_completed_phases(context)
    },
    stack: error.stack,
    timestamp: Date.now()
  }
  
  // Add recovery suggestions
  wrapped.suggestions = generate_recovery_suggestions(wrapped.code, wrapped.phase)
  
  RETURN wrapped

## Helper Functions

FUNCTION normalize_options(options)
  LET normalized = {
    parser: options.parser || 'default',
    transformer: options.transformer || 'default',
    renderer: options.renderer || 'default',
    theme: options.theme || 'default',
    plugins: options.plugins || [],
    debug: options.debug || false
  }
  
  RETURN normalized

FUNCTION apply_middleware_chain(context, phase)
  LET middlewares = context.coordinator.registry.get_middleware()
  
  FOR EACH middleware IN middlewares DO
    IF middleware.phases.includes(phase) OR middleware.phases.includes('*') THEN
      context = middleware.process(context, phase)
  
  RETURN context

FUNCTION is_valid_ast(ast)
  // Check basic AST structure
  IF NOT ast OR typeof ast !== 'object' THEN RETURN false
  IF NOT ast.type THEN RETURN false
  IF ast.type !== 'root' THEN RETURN false
  IF NOT Array.isArray(ast.children) THEN RETURN false
  
  RETURN true

FUNCTION is_valid_html(html)
  // Basic HTML validation
  IF NOT html OR typeof html !== 'string' THEN RETURN false
  IF NOT html.includes('<!DOCTYPE') THEN RETURN false
  IF NOT html.includes('<html') THEN RETURN false
  IF NOT html.includes('<body') THEN RETURN false
  
  RETURN true