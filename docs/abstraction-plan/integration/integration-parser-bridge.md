# Integration - Parser Bridge

## Parser Adapter Implementation

The parser bridge wraps the existing parser module to implement the abstraction layer's ParserInterface.

## Parser Adapter Structure

FUNCTION create_parser_adapter()
  // Import existing parser module
  LET existing_parser = require('./parser/index')
  LET markdown_parser = require('./parser/markdown')
  LET container_parser = require('./parser/containers')
  LET style_parser = require('./parser/styles')
  LET slide_parser = require('./parser/slides')
  
  RETURN {
    parse: create_parse_function(existing_parser),
    supports: create_supports_function(),
    validate: create_validate_function(existing_parser)
  }

## Parse Function Implementation

FUNCTION create_parse_function(existing_parser)
  RETURN FUNCTION parse(input)
    TRY
      // Use existing parser's parse function
      LET raw_ast = existing_parser.parse(input)
      
      // Convert to standardized AST format
      LET standardized_ast = standardize_ast_structure(raw_ast)
      
      // Process container syntax
      standardized_ast = process_container_syntax(standardized_ast)
      
      // Extract and process styles
      standardized_ast = extract_embedded_styles(standardized_ast)
      
      // Split into slides
      standardized_ast = process_slide_boundaries(standardized_ast)
      
      RETURN standardized_ast
      
    CATCH error
      THROW create_parser_error(error, input)

## AST Standardization

FUNCTION standardize_ast_structure(raw_ast)
  // Convert from existing parser format to abstraction layer format
  LET standardized = {
    type: 'root',
    children: [],
    metadata: {
      parser: 'curtains',
      version: '1.0.0',
      timestamp: Date.now()
    }
  }
  
  // Recursively process nodes
  FOR EACH node IN raw_ast.children DO
    standardized.children.push(convert_node_to_standard(node))
  
  RETURN standardized

FUNCTION convert_node_to_standard(node)
  LET standard_node = {
    type: map_node_type(node.type),
    children: []
  }
  
  // Copy relevant properties
  IF node.value EXISTS THEN
    standard_node.value = node.value
  
  IF node.depth EXISTS THEN
    standard_node.depth = node.depth
  
  IF node.url EXISTS THEN
    standard_node.url = node.url
  
  IF node.alt EXISTS THEN
    standard_node.alt = node.alt
  
  IF node.lang EXISTS THEN
    standard_node.lang = node.lang
  
  IF node.ordered EXISTS THEN
    standard_node.ordered = node.ordered
  
  // Process children recursively
  IF node.children EXISTS AND is_array(node.children) THEN
    FOR EACH child IN node.children DO
      standard_node.children.push(convert_node_to_standard(child))
  
  RETURN standard_node

## Container Syntax Processing

FUNCTION process_container_syntax(ast)
  LET container_stack = []
  LET processed_ast = deep_clone(ast)
  
  FUNCTION visit_node(node, parent)
    // Check for container start markers (:::)
    IF is_container_start(node) THEN
      LET container = create_container_node(node)
      container_stack.push(container)
      RETURN null // Remove marker from AST
    
    // Check for container end markers (:::)
    IF is_container_end(node) THEN
      IF container_stack.length > 0 THEN
        LET container = container_stack.pop()
        RETURN container
      RETURN null
    
    // Add node to current container if inside one
    IF container_stack.length > 0 THEN
      LET current_container = container_stack[container_stack.length - 1]
      current_container.children.push(node)
      RETURN null
    
    // Process children
    IF node.children EXISTS THEN
      LET new_children = []
      FOR EACH child IN node.children DO
        LET processed = visit_node(child, node)
        IF processed !== null THEN
          new_children.push(processed)
      node.children = new_children
    
    RETURN node
  
  processed_ast = visit_node(processed_ast, null)
  RETURN processed_ast

FUNCTION is_container_start(node)
  IF node.type === 'paragraph' AND node.children.length === 1 THEN
    LET child = node.children[0]
    IF child.type === 'text' AND child.value.startsWith(':::') THEN
      RETURN true
  RETURN false

FUNCTION is_container_end(node)
  IF node.type === 'paragraph' AND node.children.length === 1 THEN
    LET child = node.children[0]
    IF child.type === 'text' AND child.value.trim() === ':::' THEN
      RETURN true
  RETURN false

FUNCTION create_container_node(marker_node)
  LET text = marker_node.children[0].value
  LET classes = extract_container_classes(text)
  
  RETURN {
    type: 'container',
    classes: classes,
    children: [],
    attributes: {}
  }

## Style Extraction

FUNCTION extract_embedded_styles(ast)
  LET global_styles = []
  LET processed_ast = deep_clone(ast)
  
  FUNCTION visit_for_styles(node, parent)
    // Check for style blocks
    IF node.type === 'code' AND node.lang === 'css' THEN
      global_styles.push(node.value)
      RETURN null // Remove style block from AST
    
    // Check for inline style attributes
    IF node.type === 'html' AND contains_style_tag(node.value) THEN
      LET style = extract_style_content(node.value)
      global_styles.push(style)
      RETURN null
    
    // Process children
    IF node.children EXISTS THEN
      LET new_children = []
      FOR EACH child IN node.children DO
        LET processed = visit_for_styles(child, node)
        IF processed !== null THEN
          new_children.push(processed)
      node.children = new_children
    
    RETURN node
  
  processed_ast = visit_for_styles(processed_ast, null)
  
  // Attach styles to AST metadata
  processed_ast.metadata.globalStyles = global_styles.join('\n')
  
  RETURN processed_ast

## Slide Processing

FUNCTION process_slide_boundaries(ast)
  LET slides = []
  LET current_slide = {
    type: 'slide',
    children: [],
    metadata: {}
  }
  
  FUNCTION is_slide_separator(node)
    IF node.type === 'thematicBreak' THEN RETURN true
    IF node.type === 'heading' AND node.depth === 1 THEN RETURN true
    RETURN false
  
  FOR EACH node IN ast.children DO
    IF is_slide_separator(node) AND current_slide.children.length > 0 THEN
      // Save current slide
      slides.push(current_slide)
      // Start new slide
      current_slide = {
        type: 'slide',
        children: [],
        metadata: {}
      }
      // Add separator as first element if it's a heading
      IF node.type === 'heading' THEN
        current_slide.children.push(node)
    ELSE
      current_slide.children.push(node)
  
  // Add last slide if it has content
  IF current_slide.children.length > 0 THEN
    slides.push(current_slide)
  
  // Update AST structure
  ast.children = slides
  ast.metadata.slideCount = slides.length
  
  RETURN ast

## Support Function Implementation

FUNCTION create_supports_function()
  RETURN FUNCTION supports(format)
    LET supported_formats = [
      'curtains',
      'markdown',
      'md',
      'commonmark',
      'gfm'
    ]
    
    RETURN supported_formats.includes(format.toLowerCase())

## Validation Function Implementation

FUNCTION create_validate_function(existing_parser)
  RETURN FUNCTION validate(input)
    TRY
      // Check input is a string
      IF typeof input !== 'string' THEN
        RETURN false
      
      // Check input is not empty
      IF input.trim().length === 0 THEN
        RETURN false
      
      // Try parsing to validate syntax
      LET test_parse = existing_parser.parse(input)
      
      // Check for required structure
      IF NOT test_parse OR NOT test_parse.children THEN
        RETURN false
      
      RETURN true
      
    CATCH error
      RETURN false

## Error Handling

FUNCTION create_parser_error(original_error, input)
  LET error = {
    message: `Parser error: ${original_error.message}`,
    code: 'PARSE_ERROR',
    phase: 'parse',
    location: extract_error_location(original_error),
    input_snippet: create_input_snippet(input, original_error),
    suggestions: generate_parse_error_suggestions(original_error),
    original_error: original_error
  }
  
  RETURN error

FUNCTION extract_error_location(error)
  IF error.line EXISTS AND error.column EXISTS THEN
    RETURN {
      line: error.line,
      column: error.column
    }
  
  // Try to extract from error message
  LET line_match = error.message.match(/line (\d+)/i)
  LET col_match = error.message.match(/column (\d+)/i)
  
  IF line_match OR col_match THEN
    RETURN {
      line: line_match ? parseInt(line_match[1]) : null,
      column: col_match ? parseInt(col_match[1]) : null
    }
  
  RETURN null

## Registration Helper

FUNCTION register_parser_adapter(registry)
  LET adapter = create_parser_adapter()
  
  // Register as default parser
  registry.register_parser('default', adapter)
  
  // Register with specific names
  registry.register_parser('curtains', adapter)
  registry.register_parser('markdown', adapter)
  
  // Register standard markdown parser separately
  LET standard_md_adapter = create_standard_markdown_adapter()
  registry.register_parser('commonmark', standard_md_adapter)
  registry.register_parser('gfm', standard_md_adapter)