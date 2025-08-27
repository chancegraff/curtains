# Technical Specification: Parser Replacement with Abstraction Layer

## Overview

Complete replacement of the existing parser module (`src/parser/*`) with a new abstraction-based parser implementation that provides interface compliance, validation, and extensibility.

## Current Parser Analysis

### Existing Structure
```
src/parser/
  ├── index.ts         # Main parser entry
  ├── markdown.ts      # Markdown parsing
  ├── containers.ts    # Container extraction
  ├── slides.ts        # Slide splitting
  ├── styles.ts        # Style extraction
  └── validate.ts      # Input validation
```

### Current Implementation Issues
- Direct function exports without interfaces
- Tight coupling to specific AST structure
- No plugin support for custom elements
- Hard-coded container and style patterns
- Limited markdown flavor support

## New Parser Architecture

### Interface Definition

```
PARSER_INTERFACE:
  parse(input: string) => ASTDocument
  supports(format: string) => boolean
  validate(input: string) => boolean
  getCapabilities() => ParserCapabilities
  configure(options: ParserOptions) => void
```

### Implementation Structure

```
abstractions/parsers/
  ├── interface.ts           # Parser interface definition
  ├── baseParser.ts          # Base parser implementation
  ├── curtainsParser.ts      # Curtains-specific parser
  ├── markdownParser.ts      # Standard markdown parser
  ├── validators.ts          # Input validators
  └── astBuilder.ts          # AST construction helpers
```

## Parser Implementation Details

### Base Parser Module

```
FUNCTION createBaseParser()
  LET parserState = {
    options: defaultOptions,
    plugins: new Map(),
    validators: []
  }
  
  FUNCTION parse(input)
    // Validate input
    LET validatedInput = validateParserInput(input)
    
    // Pre-processing hooks
    validatedInput = applyPreProcessors(validatedInput)
    
    // Core parsing
    LET ast = performParsing(validatedInput)
    
    // Post-processing hooks
    ast = applyPostProcessors(ast)
    
    // Validate output
    RETURN validateAST(ast)
  
  FUNCTION supports(format)
    LET supportedFormats = ['markdown', 'curtains', 'md']
    RETURN supportedFormats.includes(format.toLowerCase())
  
  FUNCTION validate(input)
    TRY
      validateParserInput(input)
      performParsing(input)
      RETURN true
    CATCH
      RETURN false
  
  FUNCTION getCapabilities()
    RETURN {
      supportedFormats: ['markdown', 'curtains'],
      supportsContainers: true,
      supportsStyles: true,
      supportsFrontmatter: false,
      maxInputSize: 10485760,
      pluginsEnabled: true
    }
```

### Curtains Parser Module

```
FUNCTION createCurtainsParser()
  LET baseParser = createBaseParser()
  
  FUNCTION parseCurtainsDocument(input)
    // Split on delimiters
    LET parts = splitOnDelimiters(input)
    
    // Extract global section
    LET globalSection = parts.shift()
    LET globalStyles = extractStyles(globalSection)
    
    // Parse slides
    LET slides = []
    FOR EACH slidePart IN parts DO
      LET slide = parseSlide(slidePart)
      ADD slide TO slides
    
    // Build document AST
    RETURN buildDocumentAST({
      globalStyles: globalStyles,
      slides: slides
    })
  
  FUNCTION parseSlide(slideContent)
    // Extract slide-specific styles
    LET styles = extractStyles(slideContent)
    LET cleanContent = removeStyles(slideContent)
    
    // Parse containers
    LET containerMap = new Map()
    LET processedContent = processContainers(cleanContent, containerMap)
    
    // Parse markdown
    LET markdownAST = parseMarkdown(processedContent)
    
    // Replace container placeholders
    LET finalAST = replaceContainerPlaceholders(markdownAST, containerMap)
    
    RETURN {
      ast: finalAST,
      styles: styles
    }
  
  FUNCTION extractStyles(content)
    LET styles = []
    LET stylePattern = /<style>([\s\S]*?)<\/style>/gi
    
    LET match
    WHILE (match = stylePattern.exec(content)) DO
      ADD match[1] TO styles
    
    RETURN styles.join('\n')
  
  FUNCTION processContainers(content, containerMap)
    LET containerPattern = /<container\s+class="([^"]*)">([\s\S]*?)<\/container>/gi
    LET placeholderIndex = 0
    
    RETURN content.replace(containerPattern, (match, classes, innerContent) => {
      LET containerId = `CONTAINER_${placeholderIndex++}`
      
      // Recursively process nested containers
      LET processedInner = processContainers(innerContent, containerMap)
      
      // Parse inner markdown
      LET innerAST = parseMarkdown(processedInner)
      
      // Create container node
      LET containerNode = createContainerNode(classes.split(' '), innerAST)
      
      // Store in map
      containerMap.set(containerId, containerNode)
      
      RETURN `{{${containerId}}}`
    })
```

### Markdown Parser Integration

```
FUNCTION createMarkdownParser()
  // Use unified/remark for standard markdown
  LET processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(customPlugins)
  
  FUNCTION parseMarkdown(content)
    LET mdast = processor.parse(content)
    RETURN convertMdastToAST(mdast)
  
  FUNCTION convertMdastToAST(mdast)
    // Convert mdast nodes to our AST format
    RETURN visitNode(mdast, {
      text: (node) => createTextNode(node.value),
      paragraph: (node) => createParagraphNode(node.children),
      heading: (node) => createHeadingNode(node.depth, node.children),
      list: (node) => createListNode(node.ordered, node.children),
      code: (node) => createCodeNode(node.lang, node.value),
      link: (node) => createLinkNode(node.url, node.children),
      image: (node) => createImageNode(node.url, node.alt)
    })
```

### AST Builder Module

```
FUNCTION createASTBuilder()
  // Node creation functions with validation
  
  FUNCTION createDocumentNode(slides, metadata)
    RETURN validateNode({
      type: 'document',
      metadata: metadata || {},
      slides: slides,
      version: '1.0.0'
    })
  
  FUNCTION createSlideNode(content, styles)
    RETURN validateNode({
      type: 'slide',
      content: content,
      styles: styles || '',
      metadata: {}
    })
  
  FUNCTION createContainerNode(classes, children)
    RETURN validateNode({
      type: 'container',
      classes: validateClasses(classes),
      children: children || [],
      attributes: {}
    })
  
  FUNCTION createTextNode(value)
    RETURN validateNode({
      type: 'text',
      value: value
    })
  
  FUNCTION createHeadingNode(level, children)
    RETURN validateNode({
      type: 'heading',
      level: Math.min(6, Math.max(1, level)),
      children: children || []
    })
  
  FUNCTION validateNode(node)
    // Use Zod schema for validation
    RETURN ASTNodeSchema.parse(node)
```

### Validation Module

```
FUNCTION createParserValidators()
  // Input validation schemas
  LET InputSchema = z.string().min(1).max(10485760)
  
  LET SlideDelimiterSchema = z.string().regex(/^===\s*$/m)
  
  LET ContainerSchema = z.object({
    tag: z.literal('container'),
    classes: z.array(z.string().regex(/^[a-zA-Z0-9-_]+$/)),
    content: z.string()
  })
  
  LET StyleBlockSchema = z.object({
    tag: z.literal('style'),
    content: z.string(),
    scoped: z.boolean().optional()
  })
  
  FUNCTION validateInput(input)
    RETURN InputSchema.parse(input)
  
  FUNCTION validateContainer(container)
    RETURN ContainerSchema.parse(container)
  
  FUNCTION validateStyleBlock(style)
    RETURN StyleBlockSchema.parse(style)
  
  FUNCTION validateAST(ast)
    RETURN ASTDocumentSchema.parse(ast)
```

## Plugin Architecture

### Parser Plugin Interface

```
PLUGIN_INTERFACE:
  name: string
  version: string
  register(parser: Parser) => void
  preProcess?(input: string) => string
  postProcess?(ast: ASTNode) => ASTNode
  nodeVisitor?: NodeVisitor
  customElements?: ElementDefinition[]
```

### Plugin Registration

```
FUNCTION registerParserPlugin(plugin)
  // Validate plugin interface
  validatePlugin(plugin)
  
  // Register pre-processors
  IF plugin.preProcess THEN
    addPreProcessor(plugin.preProcess)
  
  // Register post-processors
  IF plugin.postProcess THEN
    addPostProcessor(plugin.postProcess)
  
  // Register custom elements
  IF plugin.customElements THEN
    FOR EACH element IN plugin.customElements DO
      registerCustomElement(element)
  
  // Register node visitor
  IF plugin.nodeVisitor THEN
    addNodeVisitor(plugin.nodeVisitor)
```

## Adapter Implementation

### Parser Adapter Wrapper

```
FUNCTION createParserAdapter()
  LET parser = createCurtainsParser()
  
  RETURN {
    parse: (input) => {
      validateString(input)
      RETURN parser.parseCurtainsDocument(input)
    },
    
    supports: (format) => {
      validateString(format)
      RETURN parser.supports(format)
    },
    
    validate: (input) => {
      TRY
        validateString(input)
        parser.parseCurtainsDocument(input)
        RETURN true
      CATCH
        RETURN false
    },
    
    metadata: {
      name: 'curtains-parser',
      version: '2.0.0',
      description: 'Abstraction-based Curtains parser',
      capabilities: parser.getCapabilities()
    }
  }
```

## Integration Points

### Registry Registration

```
FUNCTION registerParser(registry)
  LET parserAdapter = createParserAdapter()
  registry.registerParser('default', parserAdapter)
  registry.registerParser('curtains', parserAdapter)
  
  // Also register standard markdown parser
  LET markdownAdapter = createMarkdownAdapter()
  registry.registerParser('markdown', markdownAdapter)
  registry.registerParser('gfm', markdownAdapter)
```

### CLI Usage

```
// In updated CLI
LET pipeline = createIntegratedPipeline()
LET result = pipeline.process(input, {
  parser: 'curtains',  // Select parser by name
  // ... other options
})
```

## Testing Requirements

TEST_COVERAGE:
  - Parse valid Curtains documents
  - Handle invalid input gracefully  
  - Extract styles correctly
  - Process nested containers
  - Support standard markdown
  - Plugin registration and execution
  - Validation at all boundaries
  - Error messages are descriptive

## Files to Create

NEW_FILES:
  - src/abstractions/parsers/interface.ts
  - src/abstractions/parsers/baseParser.ts
  - src/abstractions/parsers/curtainsParser.ts
  - src/abstractions/parsers/markdownParser.ts
  - src/abstractions/parsers/validators.ts
  - src/abstractions/parsers/astBuilder.ts
  - src/abstractions/parsers/plugins.ts

## Files to Delete

DELETE_FILES:
  - src/parser/index.ts
  - src/parser/markdown.ts
  - src/parser/containers.ts
  - src/parser/slides.ts
  - src/parser/styles.ts
  - src/parser/validate.ts
  - All src/parser/*.test.ts files