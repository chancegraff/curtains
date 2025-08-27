# Integration Plan

## Overall Integration Strategy

FUNCTION integrate_abstraction_layer()
  // Phase 1: Set up core abstractions
  LET parser_interface = create_parser_interface()
  LET transformer_interface = create_transformer_interface()
  LET renderer_interface = create_renderer_interface()
  
  // Phase 2: Create adapter registry
  LET registry = create_global_registry()
  
  // Phase 3: Wire up pipeline
  LET pipeline = create_integrated_pipeline(registry)
  
  // Phase 4: Initialize system
  initialize_system(pipeline)
  
  RETURN pipeline

## Global Registry System

FUNCTION create_global_registry()
  LET adapters = {
    parsers: new Map(),
    transformers: new Map(),
    renderers: new Map(),
    middleware: []
  }
  
  FUNCTION register_parser(name, parser)
    IF validate_parser_interface(parser) THEN
      SET adapters.parsers[name] = parser
      RETURN true
    THROW InterfaceError('Parser does not implement IParser')
  
  FUNCTION register_transformer(name, transformer)
    IF validate_transformer_interface(transformer) THEN
      SET adapters.transformers[name] = transformer
      RETURN true
    THROW InterfaceError('Transformer does not implement ITransformer')
  
  FUNCTION register_renderer(name, renderer)
    IF validate_renderer_interface(renderer) THEN
      SET adapters.renderers[name] = renderer
      RETURN true
    THROW InterfaceError('Renderer does not implement IRenderer')
  
  FUNCTION get_adapter(type, name)
    SWITCH type
      CASE 'parser':
        RETURN adapters.parsers.get(name) || adapters.parsers.get('default')
      CASE 'transformer':
        RETURN adapters.transformers.get(name) || adapters.transformers.get('default')
      CASE 'renderer':
        RETURN adapters.renderers.get(name) || adapters.renderers.get('default')
      DEFAULT:
        THROW Error(`Unknown adapter type: ${type}`)
  
  RETURN {
    register_parser: register_parser,
    register_transformer: register_transformer,
    register_renderer: register_renderer,
    get_adapter: get_adapter,
    add_middleware: (m) => adapters.middleware.push(m),
    get_middleware: () => [...adapters.middleware]
  }

## Integrated Pipeline

FUNCTION create_integrated_pipeline(registry)
  LET state_manager = create_presentation_state()
  LET event_coordinator = create_event_coordinator()
  LET container_system = create_container_query()
  
  FUNCTION process(input, options)
    // Initialize pipeline context
    LET context = {
      input: input,
      options: options || {},
      state: state_manager,
      events: event_coordinator,
      errors: [],
      timing: {
        start: performance.now(),
        phases: {}
      }
    }
    
    TRY
      // Phase 1: Parse
      context = parse_phase(context, registry)
      
      // Phase 2: Transform
      context = transform_phase(context, registry)
      
      // Phase 3: Render
      context = render_phase(context, registry)
      
      // Phase 4: Finalize
      context = finalize_phase(context)
      
      RETURN {
        success: true,
        output: context.output,
        timing: calculate_timing(context.timing)
      }
      
    CATCH error
      RETURN {
        success: false,
        error: wrap_pipeline_error(error, context),
        partial_output: context.partial_output
      }
  
  FUNCTION parse_phase(context, registry)
    LET phase_start = performance.now()
    
    // Select parser
    LET parser_name = context.options.parser || 'default'
    LET parser = registry.get_adapter('parser', parser_name)
    
    IF NOT parser THEN
      THROW Error(`Parser not found: ${parser_name}`)
    
    // Apply middleware
    context = apply_middleware(context, registry.get_middleware(), 'before_parse')
    
    // Parse input
    context.ast = parser.parse(context.input)
    
    // Validate AST
    IF NOT validate_ast(context.ast) THEN
      THROW ValidationError('Invalid AST structure')
    
    // Apply middleware
    context = apply_middleware(context, registry.get_middleware(), 'after_parse')
    
    context.timing.phases.parse = performance.now() - phase_start
    RETURN context
  
  FUNCTION transform_phase(context, registry)
    LET phase_start = performance.now()
    
    // Select transformer
    LET transformer_name = context.options.transformer || 'default'
    LET transformer = registry.get_adapter('transformer', transformer_name)
    
    IF NOT transformer THEN
      THROW Error(`Transformer not found: ${transformer_name}`)
    
    // Apply middleware
    context = apply_middleware(context, registry.get_middleware(), 'before_transform')
    
    // Transform AST
    context.transformed = transformer.transform(context.ast)
    
    // Process containers
    context.transformed = process_containers(context.transformed)
    
    // Apply middleware
    context = apply_middleware(context, registry.get_middleware(), 'after_transform')
    
    context.timing.phases.transform = performance.now() - phase_start
    RETURN context
  
  FUNCTION render_phase(context, registry)
    LET phase_start = performance.now()
    
    // Select renderer
    LET renderer_name = context.options.renderer || 'default'
    LET renderer = registry.get_adapter('renderer', renderer_name)
    
    IF NOT renderer THEN
      THROW Error(`Renderer not found: ${renderer_name}`)
    
    // Apply middleware
    context = apply_middleware(context, registry.get_middleware(), 'before_render')
    
    // Render to output
    context.output = renderer.render(context.transformed, context.options)
    
    // Apply middleware
    context = apply_middleware(context, registry.get_middleware(), 'after_render')
    
    context.timing.phases.render = performance.now() - phase_start
    RETURN context
  
  FUNCTION finalize_phase(context)
    LET phase_start = performance.now()
    
    // Update state
    context.state.set('total_slides', context.transformed.slides.length)
    context.state.set('current_slide', 0)
    
    // Initialize event handlers
    context.events.initialize({
      total_slides: context.transformed.slides.length,
      start_slide: context.options.start_slide || 0
    })
    
    // Apply final middleware
    context = apply_middleware(context, registry.get_middleware(), 'finalize')
    
    context.timing.phases.finalize = performance.now() - phase_start
    context.timing.total = performance.now() - context.timing.start
    
    RETURN context
  
  RETURN {
    process: process,
    registry: registry,
    state: state_manager,
    events: event_coordinator
  }

## Middleware System

FUNCTION apply_middleware(context, middlewares, phase)
  FOR each middleware in middlewares DO
    IF middleware.phases.includes(phase) OR middleware.phases.includes('*') THEN
      TRY
        context = middleware.process(context, phase)
      CATCH error
        // Log but don't fail pipeline
        console.warn(`Middleware error in ${phase}:`, error)
        context.errors.push({
          phase: phase,
          middleware: middleware.name,
          error: error
        })
  
  RETURN context

FUNCTION create_logging_middleware()
  RETURN {
    name: 'logger',
    phases: ['*'],
    process: FUNCTION(context, phase)
      console.log(`Pipeline phase: ${phase}`)
      console.log(`Context keys:`, Object.keys(context))
      RETURN context
  }

FUNCTION create_validation_middleware()
  RETURN {
    name: 'validator',
    phases: ['after_parse', 'after_transform'],
    process: FUNCTION(context, phase)
      IF phase === 'after_parse' THEN
        IF NOT context.ast THEN
          THROW Error('No AST produced by parser')
      
      IF phase === 'after_transform' THEN
        IF NOT context.transformed THEN
          THROW Error('No transformed document produced')
      
      RETURN context
  }

## Adapter Wrappers

FUNCTION wrap_existing_parser(existing_parser)
  RETURN {
    parse: FUNCTION(input)
      // Adapt existing parser to interface
      RETURN existing_parser.parse(input)
    
    supports: FUNCTION(format)
      // Check if parser supports format
      RETURN format === 'curtains' OR format === 'markdown'
    
    validate: FUNCTION(input)
      TRY
        existing_parser.validateInput(input)
        RETURN true
      CATCH
        RETURN false
  }

FUNCTION wrap_existing_transformer(existing_transformer)
  RETURN {
    transform: FUNCTION(ast)
      // Adapt existing transformer
      RETURN existing_transformer.transform(ast)
    
    configure: FUNCTION(options)
      // Apply transformer options
      RETURN existing_transformer
    
    get_capabilities: FUNCTION()
      RETURN {
        supports_containers: true,
        supports_styles: true,
        output_format: 'html'
      }
  }

FUNCTION wrap_existing_renderer(existing_renderer)
  RETURN {
    render: FUNCTION(document, options)
      // Adapt existing renderer
      RETURN existing_renderer.render(document, options)
    
    validate_input: FUNCTION(document)
      TRY
        existing_renderer.validateDocument(document)
        RETURN true
      CATCH
        RETURN false
    
    get_capabilities: FUNCTION()
      RETURN {
        themes: ['default', 'dark', 'light'],
        features: ['navigation', 'fullscreen', 'touch'],
        output_formats: ['html']
      }
  }

## System Initialization

FUNCTION initialize_system(pipeline)
  // Register default adapters
  register_default_adapters(pipeline.registry)
  
  // Set up error handling
  setup_error_handling(pipeline)
  
  // Initialize state
  initialize_state(pipeline.state)
  
  // Set up event listeners
  setup_event_listeners(pipeline.events)
  
  // Load plugins if configured
  load_plugins(pipeline)

FUNCTION register_default_adapters(registry)
  // Wrap and register existing modules
  LET default_parser = wrap_existing_parser(existing_parse_module)
  LET default_transformer = wrap_existing_transformer(existing_transform_module)
  LET default_renderer = wrap_existing_renderer(existing_render_module)
  
  registry.register_parser('default', default_parser)
  registry.register_transformer('default', default_transformer)
  registry.register_renderer('default', default_renderer)
  
  // Register middleware
  registry.add_middleware(create_logging_middleware())
  registry.add_middleware(create_validation_middleware())

## Migration Path

FUNCTION create_migration_wrapper()
  LET new_pipeline = create_integrated_pipeline(create_global_registry())
  
  // Initialize with defaults
  initialize_system(new_pipeline)
  
  FUNCTION legacy_parse(input)
    LET result = new_pipeline.process(input, {
      parser: 'default',
      transformer: 'default',
      renderer: 'default'
    })
    
    IF result.success THEN
      RETURN result.output
    ELSE
      THROW result.error
  
  FUNCTION modern_process(input, options)
    RETURN new_pipeline.process(input, options)
  
  RETURN {
    // Legacy API
    parse: legacy_parse,
    
    // Modern API
    process: modern_process,
    registry: new_pipeline.registry,
    state: new_pipeline.state,
    events: new_pipeline.events
  }

## Performance Monitoring

FUNCTION create_performance_monitor()
  LET metrics = {
    parse_times: [],
    transform_times: [],
    render_times: [],
    total_times: []
  }
  
  FUNCTION record_timing(phase, duration)
    IF phase === 'parse' THEN
      ADD duration to metrics.parse_times
    ELSE IF phase === 'transform' THEN
      ADD duration to metrics.transform_times
    ELSE IF phase === 'render' THEN
      ADD duration to metrics.render_times
    ELSE IF phase === 'total' THEN
      ADD duration to metrics.total_times
    
    // Keep only last 100 measurements
    FOR each metric_array in metrics DO
      IF metric_array.length > 100 THEN
        REMOVE first item from metric_array
  
  FUNCTION get_average(phase)
    LET times = metrics[`${phase}_times`]
    IF times.length === 0 THEN RETURN 0
    
    LET sum = times.reduce((a, b) => a + b, 0)
    RETURN sum / times.length
  
  FUNCTION get_percentile(phase, percentile)
    LET times = [...metrics[`${phase}_times`]].sort((a, b) => a - b)
    IF times.length === 0 THEN RETURN 0
    
    LET index = Math.floor(times.length * percentile / 100)
    RETURN times[index]
  
  RETURN {
    record: record_timing,
    get_average: get_average,
    get_p50: (phase) => get_percentile(phase, 50),
    get_p95: (phase) => get_percentile(phase, 95),
    get_p99: (phase) => get_percentile(phase, 99)
  }

## Error Recovery

FUNCTION create_error_recovery()
  FUNCTION recover_from_parse_error(error, input)
    // Try fallback parser
    TRY
      RETURN fallback_parser.parse(input)
    CATCH
      // Return minimal valid AST
      RETURN {
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'text',
            value: 'Error parsing input: ' + error.message
          }]
        }]
      }
  
  FUNCTION recover_from_transform_error(error, ast)
    // Return minimal transformed document
    RETURN {
      slides: [{
        html: '<p>Error during transformation</p>',
        css: ''
      }],
      globalCSS: ''
    }
  
  FUNCTION recover_from_render_error(error, document)
    // Return basic HTML
    RETURN `
      <!DOCTYPE html>
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Rendering Error</h1>
          <p>${error.message}</p>
        </body>
      </html>
    `
  
  RETURN {
    parse: recover_from_parse_error,
    transform: recover_from_transform_error,
    render: recover_from_render_error
  }