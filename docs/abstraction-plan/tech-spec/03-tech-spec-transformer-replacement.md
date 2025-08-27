# Technical Specification: Transformer Replacement with Abstraction Layer

## Overview

Complete replacement of the existing transformer module (`src/transformer/*`) with a new abstraction-based transformer implementation using visitor pattern, functional composition, and plugin architecture.

## Current Transformer Analysis

### Existing Structure
```
src/transformer/
  ├── index.ts            # Main transformer entry
  ├── ast-to-html.ts      # AST to HTML conversion
  └── style-scoping.ts    # CSS scoping logic
```

### Current Implementation Issues
- Direct AST manipulation without visitor pattern
- Hard-coded HTML generation
- String-based CSS scoping
- No transformation middleware
- Limited extensibility for custom nodes

## New Transformer Architecture

### Interface Definition

```
TRANSFORMER_INTERFACE:
  transform(ast: ASTDocument) => TransformedDocument
  configure(options: TransformerOptions) => void
  registerVisitor(nodeType: string, visitor: NodeVisitor) => void
  addMiddleware(middleware: TransformMiddleware) => void
  getCapabilities() => TransformerCapabilities
```

### Implementation Structure

```
abstractions/transformers/
  ├── interface.ts           # Transformer interface
  ├── baseTransformer.ts     # Base transformer implementation
  ├── htmlTransformer.ts     # HTML output transformer
  ├── nodeVisitors.ts        # Node visitor implementations
  ├── styleProcessor.ts      # Style processing and scoping
  └── middleware.ts          # Transformation middleware
```

## Transformer Implementation Details

### Base Transformer Module

```
FUNCTION createBaseTransformer()
  LET transformerState = {
    visitors: new Map(),
    middleware: [],
    options: defaultOptions
  }
  
  FUNCTION transform(ast)
    // Validate input AST
    LET validatedAST = validateAST(ast)
    
    // Apply pre-transform middleware
    validatedAST = applyMiddleware(validatedAST, 'pre')
    
    // Process document
    LET transformedDoc = processDocument(validatedAST)
    
    // Apply post-transform middleware
    transformedDoc = applyMiddleware(transformedDoc, 'post')
    
    // Validate output
    RETURN validateTransformedDocument(transformedDoc)
  
  FUNCTION processDocument(ast)
    LET slides = []
    LET globalStyles = ast.globalStyles || ''
    
    FOR EACH slide IN ast.slides DO
      LET transformedSlide = processSlide(slide, slides.length)
      ADD transformedSlide TO slides
    
    RETURN {
      slides: slides,
      globalCSS: globalStyles,
      metadata: ast.metadata
    }
  
  FUNCTION processSlide(slide, index)
    // Transform AST to output format
    LET html = visitNode(slide.ast)
    
    // Process and scope styles
    LET scopedCSS = processSlidStyles(slide.styles, index)
    
    RETURN {
      html: html,
      css: scopedCSS,
      index: index,
      metadata: slide.metadata
    }
```

### HTML Transformer Module

```
FUNCTION createHTMLTransformer()
  LET baseTransformer = createBaseTransformer()
  
  // Register HTML visitors for each node type
  registerHTMLVisitors(baseTransformer)
  
  FUNCTION visitNode(node)
    IF node === null OR node === undefined THEN
      RETURN ''
    
    LET visitor = getVisitor(node.type)
    IF visitor THEN
      RETURN visitor(node)
    ELSE
      RETURN defaultVisitor(node)
  
  FUNCTION getVisitor(nodeType)
    RETURN visitors.get(nodeType)
  
  FUNCTION defaultVisitor(node)
    IF node.children THEN
      RETURN node.children.map(visitNode).join('')
    ELSE IF node.value THEN
      RETURN escapeHtml(node.value)
    ELSE
      RETURN ''
  
  FUNCTION registerHTMLVisitors()
    // Text nodes
    registerVisitor('text', (node) => {
      RETURN escapeHtml(node.value)
    })
    
    // Heading nodes
    registerVisitor('heading', (node) => {
      LET level = Math.min(6, Math.max(1, node.level))
      LET content = visitChildren(node.children)
      RETURN `<h${level}>${content}</h${level}>`
    })
    
    // Paragraph nodes
    registerVisitor('paragraph', (node) => {
      LET content = visitChildren(node.children)
      RETURN `<p>${content}</p>`
    })
    
    // Container nodes
    registerVisitor('container', (node) => {
      LET classes = node.classes.join(' ')
      LET content = visitChildren(node.children)
      RETURN `<div class="${escapeHtml(classes)}">${content}</div>`
    })
    
    // List nodes
    registerVisitor('list', (node) => {
      LET tag = node.ordered ? 'ol' : 'ul'
      LET items = visitChildren(node.children)
      RETURN `<${tag}>${items}</${tag}>`
    })
    
    // List item nodes
    registerVisitor('listItem', (node) => {
      LET content = visitChildren(node.children)
      RETURN `<li>${content}</li>`
    })
    
    // Link nodes
    registerVisitor('link', (node) => {
      LET href = escapeHtml(node.url)
      LET content = visitChildren(node.children)
      LET target = isExternal(node.url) ? ' target="_blank"' : ''
      RETURN `<a href="${href}"${target}>${content}</a>`
    })
    
    // Image nodes
    registerVisitor('image', (node) => {
      LET src = escapeHtml(node.url)
      LET alt = escapeHtml(node.alt || '')
      RETURN `<img src="${src}" alt="${alt}">`
    })
    
    // Code nodes
    registerVisitor('code', (node) => {
      IF node.lang THEN
        LET lang = escapeHtml(node.lang)
        LET code = escapeHtml(node.value)
        RETURN `<pre><code class="language-${lang}">${code}</code></pre>`
      ELSE
        LET code = escapeHtml(node.value)
        RETURN `<code>${code}</code>`
    })
    
    // Blockquote nodes
    registerVisitor('blockquote', (node) => {
      LET content = visitChildren(node.children)
      RETURN `<blockquote>${content}</blockquote>`
    })
  
  FUNCTION visitChildren(children)
    IF NOT children OR children.length === 0 THEN
      RETURN ''
    
    RETURN children.map(visitNode).join('')
```

### Style Processor Module

```
FUNCTION createStyleProcessor()
  LET cssParser = createCSSParser()
  
  FUNCTION processSlidStyles(css, slideIndex)
    IF NOT css OR css.trim() === '' THEN
      RETURN ''
    
    // Parse CSS into rules
    LET rules = cssParser.parse(css)
    
    // Scope each rule to slide
    LET scopedRules = rules.map(rule => scopeRule(rule, slideIndex))
    
    // Serialize back to CSS
    RETURN cssParser.serialize(scopedRules)
  
  FUNCTION scopeRule(rule, slideIndex)
    // Skip at-rules
    IF rule.type === 'at-rule' THEN
      RETURN rule
    
    // Add slide scope to selectors
    IF rule.selectors THEN
      rule.selectors = rule.selectors.map(selector => 
        scopeSelector(selector, slideIndex)
      )
    
    RETURN rule
  
  FUNCTION scopeSelector(selector, slideIndex)
    // Don't scope global selectors
    IF selector.startsWith(':root') OR selector.startsWith('html') THEN
      RETURN selector
    
    // Add slide-specific scope
    RETURN `.curtains-slide-${slideIndex} ${selector}`
  
  FUNCTION createCSSParser()
    // Simple CSS parser for scoping
    FUNCTION parse(css)
      LET rules = []
      LET rulePattern = /([^{]+)\{([^}]+)\}/g
      
      LET match
      WHILE (match = rulePattern.exec(css)) DO
        LET selectors = match[1].split(',').map(s => s.trim())
        LET declarations = match[2].trim()
        
        ADD {
          type: 'rule',
          selectors: selectors,
          declarations: declarations
        } TO rules
      
      RETURN rules
    
    FUNCTION serialize(rules)
      RETURN rules.map(rule => {
        IF rule.type === 'rule' THEN
          LET selectors = rule.selectors.join(', ')
          RETURN `${selectors} { ${rule.declarations} }`
        ELSE
          RETURN rule.raw
      }).join('\n')
    
    RETURN { parse, serialize }
```

### Node Visitor Registration

```
FUNCTION createNodeVisitorRegistry()
  LET visitors = new Map()
  LET fallbackVisitor = null
  
  FUNCTION registerVisitor(nodeType, visitor)
    // Validate visitor function
    IF typeof visitor !== 'function' THEN
      THROW Error('Visitor must be a function')
    
    visitors.set(nodeType, visitor)
  
  FUNCTION unregisterVisitor(nodeType)
    visitors.delete(nodeType)
  
  FUNCTION setFallbackVisitor(visitor)
    fallbackVisitor = visitor
  
  FUNCTION visitNode(node)
    LET visitor = visitors.get(node.type)
    
    IF visitor THEN
      RETURN visitor(node, visitNode)
    ELSE IF fallbackVisitor THEN
      RETURN fallbackVisitor(node, visitNode)
    ELSE
      RETURN defaultVisitor(node, visitNode)
  
  FUNCTION defaultVisitor(node, visit)
    IF node.children THEN
      RETURN node.children.map(visit).join('')
    ELSE IF node.value THEN
      RETURN String(node.value)
    ELSE
      RETURN ''
  
  RETURN {
    register: registerVisitor,
    unregister: unregisterVisitor,
    setFallback: setFallbackVisitor,
    visit: visitNode
  }
```

### Transformation Middleware

```
FUNCTION createTransformMiddleware()
  LET middleware = []
  
  FUNCTION addMiddleware(mw)
    // Validate middleware interface
    IF NOT mw.name OR NOT mw.process THEN
      THROW Error('Invalid middleware')
    
    middleware.push(mw)
  
  FUNCTION removeMiddleware(name)
    middleware = middleware.filter(mw => mw.name !== name)
  
  FUNCTION applyMiddleware(data, phase)
    LET result = data
    
    FOR EACH mw IN middleware DO
      IF mw.phases.includes(phase) OR mw.phases.includes('*') THEN
        result = mw.process(result, phase)
    
    RETURN result
  
  // Built-in middleware
  
  FUNCTION createSanitizationMiddleware()
    RETURN {
      name: 'sanitization',
      phases: ['post'],
      process: (data) => {
        // Sanitize HTML output
        data.slides = data.slides.map(slide => ({
          ...slide,
          html: sanitizeHtml(slide.html)
        }))
        RETURN data
      }
    }
  
  FUNCTION createOptimizationMiddleware()
    RETURN {
      name: 'optimization',
      phases: ['post'],
      process: (data) => {
        // Optimize CSS
        data.slides = data.slides.map(slide => ({
          ...slide,
          css: optimizeCSS(slide.css)
        }))
        RETURN data
      }
    }
  
  FUNCTION createValidationMiddleware()
    RETURN {
      name: 'validation',
      phases: ['pre', 'post'],
      process: (data, phase) => {
        IF phase === 'pre' THEN
          validateAST(data)
        ELSE
          validateTransformedDocument(data)
        RETURN data
      }
    }
  
  RETURN {
    add: addMiddleware,
    remove: removeMiddleware,
    apply: applyMiddleware,
    sanitization: createSanitizationMiddleware,
    optimization: createOptimizationMiddleware,
    validation: createValidationMiddleware
  }
```

### Utility Functions

```
FUNCTION createTransformerUtilities()
  FUNCTION escapeHtml(text)
    LET escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }
    
    RETURN text.replace(/[&<>"']/g, char => escapeMap[char])
  
  FUNCTION isExternal(url)
    RETURN url.startsWith('http://') OR url.startsWith('https://')
  
  FUNCTION sanitizeHtml(html)
    // Basic HTML sanitization
    // In production, use a proper library like DOMPurify
    RETURN html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/on\w+\s*=\s*'[^']*'/gi, '')
  
  FUNCTION optimizeCSS(css)
    RETURN css
      .replace(/\s+/g, ' ')
      .replace(/;\s*}/g, '}')
      .replace(/{\s+/g, '{')
      .replace(/;\s+/g, ';')
      .trim()
  
  RETURN {
    escapeHtml,
    isExternal,
    sanitizeHtml,
    optimizeCSS
  }
```

## Adapter Implementation

### Transformer Adapter Wrapper

```
FUNCTION createTransformerAdapter()
  LET transformer = createHTMLTransformer()
  
  RETURN {
    transform: (ast) => {
      validateAST(ast)
      RETURN transformer.transform(ast)
    },
    
    configure: (options) => {
      validateTransformerOptions(options)
      transformer.configure(options)
    },
    
    getCapabilities: () => {
      RETURN {
        outputFormats: ['html'],
        supportsContainers: true,
        supportsStyles: true,
        supportsMiddleware: true,
        supportsCustomVisitors: true
      }
    },
    
    metadata: {
      name: 'html-transformer',
      version: '2.0.0',
      description: 'AST to HTML transformer with visitor pattern'
    }
  }
```

## Integration Points

### Registry Registration

```
FUNCTION registerTransformer(registry)
  LET transformerAdapter = createTransformerAdapter()
  registry.registerTransformer('default', transformerAdapter)
  registry.registerTransformer('html', transformerAdapter)
```

### Pipeline Usage

```
// In pipeline coordinator
LET transformer = registry.getAdapter('transformer', options.transformer)
LET transformed = transformer.transform(ast)
```

## Plugin Support

### Transformer Plugin Interface

```
PLUGIN_INTERFACE:
  name: string
  version: string
  register(transformer: Transformer) => void
  visitors?: Map<string, NodeVisitor>
  middleware?: TransformMiddleware[]
  utilities?: UtilityFunctions
```

### Plugin Registration

```
FUNCTION registerTransformerPlugin(plugin)
  // Register custom visitors
  IF plugin.visitors THEN
    FOR EACH [nodeType, visitor] IN plugin.visitors DO
      transformer.registerVisitor(nodeType, visitor)
  
  // Register middleware
  IF plugin.middleware THEN
    FOR EACH mw IN plugin.middleware DO
      transformer.addMiddleware(mw)
  
  // Register utilities
  IF plugin.utilities THEN
    Object.assign(utilities, plugin.utilities)
```

## Testing Requirements

TEST_COVERAGE:
  - Transform valid AST to HTML
  - Handle all node types correctly
  - Apply CSS scoping properly
  - Execute middleware in order
  - Support custom visitors
  - Sanitize output HTML
  - Optimize CSS output
  - Handle malformed AST gracefully

## Files to Create

NEW_FILES:
  - src/abstractions/transformers/interface.ts
  - src/abstractions/transformers/baseTransformer.ts
  - src/abstractions/transformers/htmlTransformer.ts
  - src/abstractions/transformers/nodeVisitors.ts
  - src/abstractions/transformers/styleProcessor.ts
  - src/abstractions/transformers/middleware.ts
  - src/abstractions/transformers/utilities.ts

## Files to Delete

DELETE_FILES:
  - src/transformer/index.ts
  - src/transformer/ast-to-html.ts
  - src/transformer/style-scoping.ts
  - All src/transformer/*.test.ts files