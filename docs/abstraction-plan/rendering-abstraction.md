# Rendering Pipeline Abstraction

## Renderer Interface Definition

FUNCTION define_renderer_interface()
  INTERFACE IRenderer
    METHOD render(document, options)
      INPUT document as TransformedDocument
      INPUT options as RenderOptions
      OUTPUT html as string
    
    METHOD validate_input(document)
      INPUT document as unknown
      OUTPUT is_valid as boolean
    
    METHOD get_capabilities()
      OUTPUT capabilities as RendererCapabilities

## HTML Builder Abstraction

FUNCTION create_html_builder_abstraction()
  INTERFACE IHTMLBuilder
    METHOD append(content)
    METHOD prepend(content)
    METHOD wrap(tag, attributes)
    METHOD build()
  
  FUNCTION functional_html_builder()
    LET chunks = empty_array
    
    RETURN {
      append: FUNCTION(content)
        ADD content to chunks
        RETURN this
      
      prepend: FUNCTION(content)
        INSERT content at beginning of chunks
        RETURN this
      
      wrap: FUNCTION(tag, attributes)
        LET opening = create_opening_tag(tag, attributes)
        LET closing = create_closing_tag(tag)
        PREPEND opening to chunks
        APPEND closing to chunks
        RETURN this
      
      build: FUNCTION()
        RETURN join chunks into string
    }

## CSS Merger Abstraction

FUNCTION create_css_merger_abstraction()
  INTERFACE ICSSMerger
    METHOD merge(css_sources)
    METHOD scope(css, context)
    METHOD optimize(css)
  
  FUNCTION functional_css_merger()
    FUNCTION merge(sources)
      LET merged = empty_string
      
      // Order matters: global, theme, slide-specific
      IF sources.global EXISTS THEN
        APPEND sources.global to merged
      
      IF sources.theme EXISTS THEN
        APPEND theme_css to merged
      
      FOR each slide_css in sources.slides DO
        IF slide_css is not empty THEN
          APPEND slide_css to merged
      
      RETURN merged
    
    FUNCTION scope(css, slide_index)
      LET scoped = empty_string
      LET rules = parse_css_rules(css)
      
      FOR each rule in rules DO
        LET scoped_selector = add_slide_scope(rule.selector, slide_index)
        APPEND scoped_selector + rule.body to scoped
      
      RETURN scoped
    
    FUNCTION optimize(css)
      REMOVE duplicate rules
      COMBINE similar selectors
      MINIFY if in production mode
      RETURN optimized_css

## Template Builder Abstraction

FUNCTION create_template_abstraction()
  INTERFACE ITemplateBuilder
    METHOD build(template_data)
    METHOD inject_styles(css)
    METHOD inject_scripts(js)
    METHOD inject_content(html)
  
  FUNCTION functional_template_builder()
    LET template_cache = new Map()
    
    FUNCTION get_base_template()
      IF template_cache has 'base' THEN
        RETURN template_cache.get('base')
      
      LET template = CREATE_HTML_STRUCTURE
      CACHE template in template_cache
      RETURN template
    
    FUNCTION build(data)
      LET template = get_base_template()
      
      // Replace placeholders functionally
      template = replace_placeholder(template, '{{TITLE}}', data.title)
      template = replace_placeholder(template, '{{CSS}}', data.css)
      template = replace_placeholder(template, '{{CONTENT}}', data.content)
      template = replace_placeholder(template, '{{RUNTIME}}', data.runtime)
      template = replace_placeholder(template, '{{CONFIG}}', data.config)
      
      RETURN template
    
    FUNCTION inject_styles(css)
      RETURN wrap_in_style_tags(css)
    
    FUNCTION inject_scripts(js)
      RETURN wrap_in_script_tags(js)
    
    FUNCTION inject_content(html)
      RETURN wrap_in_container(html)

## Runtime Generator Abstraction

FUNCTION create_runtime_abstraction()
  INTERFACE IRuntimeGenerator
    METHOD generate(config)
    METHOD add_feature(feature_name, feature_code)
    METHOD remove_feature(feature_name)
  
  FUNCTION functional_runtime_generator()
    LET features = new Map()
    
    // Core features
    INITIALIZE features with:
      'navigation' -> navigation_code
      'keyboard' -> keyboard_handler_code
      'touch' -> touch_handler_code
      'fullscreen' -> fullscreen_code
      'scaling' -> scaling_code
    
    FUNCTION generate(config)
      LET runtime_parts = []
      
      // Add IIFE wrapper start
      APPEND '(function() {' to runtime_parts
      
      // Add config
      APPEND 'const config = ' + serialize(config) to runtime_parts
      
      // Add enabled features
      FOR each feature in features DO
        IF config.enable_feature(feature.name) THEN
          APPEND feature.code to runtime_parts
      
      // Add initialization
      APPEND initialization_code to runtime_parts
      
      // Add IIFE wrapper end
      APPEND '})();' to runtime_parts
      
      RETURN join runtime_parts
    
    FUNCTION add_feature(name, code)
      SET features[name] = code
    
    FUNCTION remove_feature(name)
      DELETE features[name]

## Slide HTML Generator Abstraction

FUNCTION create_slide_generator_abstraction()
  INTERFACE ISlideGenerator
    METHOD generate_slide(slide_data, index)
    METHOD generate_container(slides)
  
  FUNCTION functional_slide_generator()
    FUNCTION generate_slide(slide, index)
      LET builder = create_html_builder()
      
      builder
        .append(slide.html)
        .wrap('div', {
          class: 'curtains-slide',
          'data-slide': index,
          id: 'slide-' + index
        })
      
      RETURN builder.build()
    
    FUNCTION generate_container(slides)
      LET container_html = empty_string
      
      FOR each slide, index in slides DO
        container_html += generate_slide(slide, index)
      
      RETURN wrap_in_stage(container_html)
    
    FUNCTION wrap_in_stage(content)
      RETURN '<div class="curtains-stage">' + content + '</div>'

## Renderer Pipeline Coordinator

FUNCTION create_render_pipeline()
  LET html_builder = create_html_builder_abstraction()
  LET css_merger = create_css_merger_abstraction()
  LET template_builder = create_template_abstraction()
  LET runtime_generator = create_runtime_abstraction()
  LET slide_generator = create_slide_generator_abstraction()
  
  FUNCTION render(transformed_doc, options)
    // Step 1: Generate slide HTML
    LET slides_html = slide_generator.generate_container(transformed_doc.slides)
    
    // Step 2: Merge and optimize CSS
    LET merged_css = css_merger.merge({
      global: transformed_doc.globalCSS,
      theme: options.theme,
      slides: transformed_doc.slides.map(s => s.css)
    })
    
    // Step 3: Generate runtime JavaScript
    LET runtime_config = {
      totalSlides: transformed_doc.slides.length,
      theme: options.theme,
      startSlide: 0,
      features: options.features || default_features
    }
    LET runtime_js = runtime_generator.generate(runtime_config)
    
    // Step 4: Build complete HTML
    LET final_html = template_builder.build({
      title: options.title || 'Presentation',
      css: merged_css,
      content: slides_html,
      runtime: runtime_js,
      config: serialize(runtime_config)
    })
    
    // Step 5: Validate output
    IF validate_html(final_html) THEN
      RETURN final_html
    ELSE
      THROW RenderingError('Invalid HTML output')

## Adapter Implementation

FUNCTION create_renderer_adapter(existing_renderer)
  IMPLEMENT IRenderer {
    render: FUNCTION(document, options)
      // Adapt existing renderer to interface
      RETURN existing_renderer.render(document, options)
    
    validate_input: FUNCTION(document)
      TRY
        validate_with_schema(document)
        RETURN true
      CATCH
        RETURN false
    
    get_capabilities: FUNCTION()
      RETURN {
        supports_themes: true,
        supports_plugins: false,
        output_formats: ['html'],
        features: ['navigation', 'fullscreen', 'touch']
      }
  }

## Renderer Registry

FUNCTION create_renderer_registry()
  LET renderers = new Map()
  
  FUNCTION register(name, renderer)
    IF renderer implements IRenderer THEN
      SET renderers[name] = renderer
      RETURN true
    ELSE
      THROW InterfaceViolationError('Renderer must implement IRenderer')
  
  FUNCTION get(name)
    IF renderers has name THEN
      RETURN renderers[name]
    ELSE
      RETURN renderers['default']
  
  FUNCTION list()
    RETURN Array.from(renderers.keys())

## Error Handling in Rendering

FUNCTION handle_render_errors(error, context)
  LET error_info = {
    phase: 'rendering',
    context: context,
    original_error: error
  }
  
  IF error is ValidationError THEN
    error_info.type = 'validation'
    error_info.suggestion = 'Check document structure'
  ELSE IF error is TemplateError THEN
    error_info.type = 'template'
    error_info.suggestion = 'Check template placeholders'
  ELSE IF error is RuntimeError THEN
    error_info.type = 'runtime'
    error_info.suggestion = 'Check runtime configuration'
  ELSE
    error_info.type = 'unknown'
    error_info.suggestion = 'Check logs for details'
  
  THROW new RenderingError(error_info)