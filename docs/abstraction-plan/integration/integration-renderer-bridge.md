# Integration - Renderer Bridge

## Renderer Adapter Implementation

The renderer bridge wraps the existing renderer module to implement the abstraction layer's RendererInterface.

## Renderer Adapter Structure

FUNCTION create_renderer_adapter()
  // Import existing renderer modules
  LET existing_renderer = require('./renderer/index')
  LET html_generator = require('./renderer/html-generator')
  LET css_merger = require('./renderer/css-merger')
  LET template_builder = require('./renderer/template-builder')
  LET runtime_generator = require('./renderer/runtime')
  
  RETURN {
    render: create_render_function(existing_renderer),
    validateInput: create_validate_input_function(),
    getCapabilities: create_get_capabilities_function()
  }

## Render Function Implementation

FUNCTION create_render_function(existing_renderer)
  RETURN ASYNC FUNCTION render(document, options)
    TRY
      // Validate document structure
      IF NOT is_valid_transformed_document(document) THEN
        THROW ValidationError('Invalid document structure for rendering')
      
      // Normalize options
      LET render_options = normalize_render_options(options)
      
      // Use existing renderer
      LET html = await existing_renderer.render(document, render_options)
      
      // Post-process HTML if needed
      html = post_process_html(html, render_options)
      
      // Validate output
      IF NOT is_valid_html_output(html) THEN
        THROW RenderingError('Invalid HTML output generated')
      
      RETURN html
      
    CATCH error
      THROW create_renderer_error(error, document, options)

## Document Validation

FUNCTION create_validate_input_function()
  RETURN FUNCTION validateInput(document)
    TRY
      // Check document has required structure
      IF NOT document OR typeof document !== 'object' THEN
        RETURN false
      
      // Check for slides array
      IF NOT Array.isArray(document.slides) THEN
        RETURN false
      
      // Check each slide has HTML and CSS
      FOR EACH slide IN document.slides DO
        IF NOT slide.html OR typeof slide.html !== 'string' THEN
          RETURN false
        IF NOT slide.css OR typeof slide.css !== 'string' THEN
          // CSS is optional but should be string if present
          IF slide.css !== undefined AND slide.css !== '' THEN
            RETURN false
      
      // Check for global CSS
      IF document.globalCSS !== undefined THEN
        IF typeof document.globalCSS !== 'string' THEN
          RETURN false
      
      RETURN true
      
    CATCH error
      RETURN false

## Capabilities Function

FUNCTION create_get_capabilities_function()
  RETURN FUNCTION getCapabilities()
    RETURN {
      themes: ['default', 'dark', 'light', 'high-contrast'],
      features: [
        'navigation',
        'keyboard',
        'touch',
        'fullscreen',
        'scaling',
        'counter',
        'accessibility'
      ],
      outputFormats: ['html'],
      runtimeFeatures: {
        navigation: true,
        keyboard: true,
        touch: true,
        fullscreen: true,
        scaling: true,
        counter: true,
        accessibility: true
      },
      cssFeatures: {
        scoping: true,
        merging: true,
        optimization: true,
        themes: true
      },
      htmlFeatures: {
        semantic: true,
        accessible: true,
        responsive: true
      }
    }

## HTML Generation Bridge

FUNCTION bridge_html_generation(document, options)
  LET html_parts = []
  
  // Generate slide HTML
  FOR EACH slide, index IN document.slides DO
    LET slide_html = generate_slide_html(slide, index, options)
    html_parts.push(slide_html)
  
  // Wrap in container
  LET container_html = wrap_slides_in_container(html_parts)
  
  RETURN container_html

FUNCTION generate_slide_html(slide, index, options)
  LET slide_element = {
    tag: 'div',
    attributes: {
      class: `curtains-slide curtains-slide-${index}`,
      'data-slide': index,
      id: `slide-${index}`
    },
    content: slide.html
  }
  
  // Add custom classes if specified
  IF slide.classes AND slide.classes.length > 0 THEN
    slide_element.attributes.class += ' ' + slide.classes.join(' ')
  
  RETURN build_html_element(slide_element)

FUNCTION wrap_slides_in_container(slides_html)
  RETURN `
    <div class="curtains-stage">
      ${slides_html.join('\n')}
    </div>
  `

## CSS Processing Bridge

FUNCTION bridge_css_processing(document, options)
  LET css_sources = {
    global: document.globalCSS || '',
    theme: load_theme_css(options.theme),
    slides: []
  }
  
  // Collect slide-specific CSS
  FOR EACH slide, index IN document.slides DO
    IF slide.css AND slide.css.trim() !== '' THEN
      // Scope CSS to specific slide
      LET scoped_css = scope_css_to_slide(slide.css, index)
      css_sources.slides.push(scoped_css)
  
  // Merge all CSS
  LET merged_css = merge_css_sources(css_sources)
  
  // Optimize if needed
  IF options.optimizeCss THEN
    merged_css = optimize_css(merged_css)
  
  RETURN merged_css

FUNCTION scope_css_to_slide(css, slide_index)
  LET scope_prefix = `.curtains-slide-${slide_index}`
  LET scoped_rules = []
  
  // Parse CSS rules (simplified)
  LET rules = css.split('}')
  
  FOR EACH rule IN rules DO
    IF rule.trim() === '' THEN CONTINUE
    
    LET [selector, properties] = rule.split('{')
    IF NOT properties THEN CONTINUE
    
    // Add scope to selector
    LET scoped_selector = add_scope_to_selector(selector.trim(), scope_prefix)
    scoped_rules.push(`${scoped_selector} { ${properties} }`)
  
  RETURN scoped_rules.join('\n')

FUNCTION add_scope_to_selector(selector, scope)
  // Handle multiple selectors (comma-separated)
  LET selectors = selector.split(',')
  LET scoped_selectors = []
  
  FOR EACH sel IN selectors DO
    sel = sel.trim()
    
    // Don't scope global selectors
    IF sel.startsWith(':root') OR sel.startsWith('html') OR sel.startsWith('body') THEN
      scoped_selectors.push(sel)
    ELSE
      scoped_selectors.push(`${scope} ${sel}`)
  
  RETURN scoped_selectors.join(', ')

## Runtime JavaScript Bridge

FUNCTION bridge_runtime_generation(document, options)
  LET runtime_config = {
    totalSlides: document.slides.length,
    theme: options.theme || 'default',
    startSlide: options.startSlide || 0,
    features: determine_enabled_features(options)
  }
  
  LET runtime_parts = []
  
  // Add configuration
  runtime_parts.push(generate_config_js(runtime_config))
  
  // Add navigation module
  IF runtime_config.features.includes('navigation') THEN
    runtime_parts.push(generate_navigation_js())
  
  // Add keyboard module
  IF runtime_config.features.includes('keyboard') THEN
    runtime_parts.push(generate_keyboard_js())
  
  // Add touch module
  IF runtime_config.features.includes('touch') THEN
    runtime_parts.push(generate_touch_js())
  
  // Add fullscreen module
  IF runtime_config.features.includes('fullscreen') THEN
    runtime_parts.push(generate_fullscreen_js())
  
  // Add initialization
  runtime_parts.push(generate_initialization_js())
  
  RETURN wrap_in_iife(runtime_parts.join('\n'))

FUNCTION determine_enabled_features(options)
  LET default_features = [
    'navigation',
    'keyboard',
    'touch',
    'fullscreen',
    'scaling',
    'counter'
  ]
  
  IF options.features EXISTS THEN
    RETURN options.features
  
  IF options.disableFeatures EXISTS THEN
    RETURN default_features.filter(f => !options.disableFeatures.includes(f))
  
  RETURN default_features

## Template Assembly Bridge

FUNCTION bridge_template_assembly(slides_html, css, runtime_js, options)
  LET template = load_html_template()
  
  // Replace placeholders
  template = template.replace('{{TITLE}}', escape_html(options.title || 'Presentation'))
  template = template.replace('{{CSS}}', css)
  template = template.replace('{{CONTENT}}', slides_html)
  template = template.replace('{{RUNTIME}}', runtime_js)
  template = template.replace('{{META}}', generate_meta_tags(options))
  
  RETURN template

FUNCTION load_html_template()
  RETURN `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>
  {{META}}
  <style>
    {{CSS}}
  </style>
</head>
<body>
  <div class="curtains-presentation">
    {{CONTENT}}
  </div>
  <script>
    {{RUNTIME}}
  </script>
</body>
</html>`

FUNCTION generate_meta_tags(options)
  LET meta_tags = []
  
  IF options.description THEN
    meta_tags.push(`<meta name="description" content="${escape_html(options.description)}">`)
  
  IF options.author THEN
    meta_tags.push(`<meta name="author" content="${escape_html(options.author)}">`)
  
  // Add Open Graph tags if specified
  IF options.ogTitle THEN
    meta_tags.push(`<meta property="og:title" content="${escape_html(options.ogTitle)}">`)
  
  RETURN meta_tags.join('\n  ')

## Option Normalization

FUNCTION normalize_render_options(options)
  LET normalized = {
    theme: options.theme || 'default',
    title: options.title || 'Presentation',
    features: options.features || undefined,
    disableFeatures: options.disableFeatures || undefined,
    optimizeCss: options.optimizeCss !== false,
    startSlide: options.startSlide || 0,
    debug: options.debug || false
  }
  
  // Copy metadata if present
  IF options.description THEN normalized.description = options.description
  IF options.author THEN normalized.author = options.author
  
  RETURN normalized

## Post-Processing

FUNCTION post_process_html(html, options)
  // Add debug comments if requested
  IF options.debug THEN
    html = add_debug_comments(html)
  
  // Minify if requested
  IF options.minify THEN
    html = minify_html(html)
  
  // Validate accessibility
  IF options.validateA11y THEN
    validate_accessibility(html)
  
  RETURN html

## Error Handling

FUNCTION create_renderer_error(original_error, document, options)
  LET error = {
    message: `Rendering error: ${original_error.message}`,
    code: 'RENDER_ERROR',
    phase: 'render',
    context: {
      slideCount: document.slides ? document.slides.length : 0,
      theme: options.theme,
      features: options.features
    },
    suggestions: generate_render_error_suggestions(original_error),
    original_error: original_error
  }
  
  RETURN error

## Registration Helper

FUNCTION register_renderer_adapter(registry)
  LET adapter = create_renderer_adapter()
  
  // Register as default renderer
  registry.register_renderer('default', adapter)
  
  // Register with specific names
  registry.register_renderer('html', adapter)
  registry.register_renderer('curtains', adapter)