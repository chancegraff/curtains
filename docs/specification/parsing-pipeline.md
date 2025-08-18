# Parsing Pipeline

## Overview

The parsing pipeline transforms Curtains source files into a structured AST (Abstract Syntax Tree) that can be rendered to HTML.

## Pipeline Stages

1. Read `.curtain` file
2. Extract content before first `===` delimiter
3. Extract global `<style>` blocks from pre-delimiter content
4. Split remaining content on `===` delimiter into slide chunks
5. For each non-empty chunk:
   * Extract slide-scoped `<style>` blocks and store with slide index
   * Parse `<container>` elements (only Curtains custom element)
   * Parse Markdown content with remark
   * Build enhanced AST with custom nodes
6. Store AST for render phase (NOT converted to HTML yet)

## Detailed Process

### Stage 1: Document Splitting

The document is split on `===` delimiters:

```typescript
function splitDocument(source: string): SplitResult {
  const parts = source.split(/^\s*===\s*$/m)
  
  return {
    globalContent: parts[0] || '',
    slideContents: parts.slice(1).filter(s => s.trim())
  }
}
```

### Stage 2: Style Extraction

Extract `<style>` blocks while preserving position information:

```typescript
function extractStyles(content: string, isGlobal: boolean): ExtractedStyles {
  const styleRegex = /<style>([\s\S]*?)<\/style>/gi
  const styles: StyleBlock[] = []
  
  let cleanContent = content.replace(styleRegex, (match, css) => {
    styles.push({
      css,
      position: isGlobal ? 'global' : 'slide',
      slideIndex: isGlobal ? undefined : currentSlideIndex
    })
    return '' // Remove from content
  })
  
  return { content: cleanContent, styles }
}
```

### Stage 3: Container Parsing

Parse `<container>` elements into AST nodes:

```typescript
function parseContainers(content: string): ParsedContent {
  const containers = new Map<string, ContainerNode>()
  
  // Replace containers with markers
  const marked = content.replace(
    /<container\s+class="([^"]*)">([\s\S]*?)<\/container>/gi,
    (match, classes, innerContent) => {
      const id = generateId()
      containers.set(id, {
        type: 'container',
        classes: classes.split(/\s+/),
        children: parseContainers(innerContent).containers // Recursive
      })
      return `{{CONTAINER:${id}}}`
    }
  )
  
  return { content: marked, containers }
}
```

### Stage 4: Markdown Parsing

Parse Markdown content using remark:

```typescript
function parseMarkdown(content: string): Root {
  const processor = remark()
    .use(remarkGfm) // Tables, strikethrough, etc.
    .use(remarkHTML, { sanitize: true }) // Escape HTML
    
  return processor.parse(content)
}
```

### Stage 5: AST Building

Build enhanced AST with container nodes integrated:

```typescript
function buildAST(
  markdownAST: Root,
  containers: Map<string, ContainerNode>
): CurtainsAST {
  // Walk the mdast tree
  walk(markdownAST, (node) => {
    if (node.type === 'text' && node.value.includes('{{CONTAINER:')) {
      const id = extractContainerId(node.value)
      const container = containers.get(id)
      // Replace text node with container node
      replaceNode(node, container)
    }
  })
  
  return {
    type: 'root',
    children: markdownAST.children
  }
}
```

## AST Structure

### Document Level

```typescript
type CurtainsDocument = {
  type: "curtains-document"
  version: "0.1"
  slides: CurtainsSlide[]
  globalCSS: string // Style blocks from before first ===
}
```

### Slide Level

```typescript
type CurtainsSlide = {
  type: "curtains-slide"
  index: number
  raw: string // Original source
  ast: CurtainsAST // Enhanced AST
  slideCSS: string // Style blocks scoped to this slide
}
```

### AST Nodes

```typescript
type CurtainsAST = {
  type: "root"
  children: (MarkdownNode | ContainerNode)[]
}

type ContainerNode = {
  type: "container"
  classes: string[] // Parsed from class attribute
  children: CurtainsAST[] // Can contain nested containers
}

type MarkdownNode = 
  | HeadingNode
  | ParagraphNode
  | ListNode
  | CodeBlockNode
  | ImageNode
  | LinkNode
  | TextNode
  // ... other mdast nodes
```

## Parser Configuration

### Remark Plugins

```typescript
const processor = remark()
  .use(remarkGfm)           // GitHub Flavored Markdown
  .use(remarkHTML, {        // HTML handling
    sanitize: true,         // Escape all HTML
    handlers: {
      // Custom handlers for special elements
    }
  })
```

### Parser Options

```typescript
interface ParserOptions {
  maxNestingDepth: number   // Default: 10
  maxSlides: number         // Default: 99
  strictMode: boolean       // Default: false
  preserveWhitespace: boolean // Default: false
}
```

## Error Handling

### Parse Errors

The parser handles various error conditions:

```typescript
enum ParseError {
  UNCLOSED_CONTAINER = 'Unclosed container tag',
  INVALID_NESTING = 'Container nesting too deep',
  MALFORMED_STYLE = 'Malformed style block',
  INVALID_MARKDOWN = 'Invalid Markdown syntax'
}
```

### Error Recovery

- **Unclosed containers:** Close at slide boundary
- **Invalid nesting:** Flatten to max depth
- **Malformed styles:** Skip block with warning
- **Invalid Markdown:** Best-effort parsing

## Edge Cases

### No Delimiters
If no `===` found, entire document becomes single slide:
```markdown
# Single Slide Presentation
All content is in one slide.
```

### Empty Slides
Empty slides are filtered out:
```markdown
===
===  <!-- This empty slide is removed -->
===
Content
```

### Nested Containers
Containers can be deeply nested:
```markdown
<container class="outer">
  <container class="middle">
    <container class="inner">
      Content at depth 3
    </container>
  </container>
</container>
```

### Style Block Positions
Position determines scope:
```markdown
<style>/* Global */</style>
Content before first delimiter
===
<style>/* Slide 1 only */</style>
Slide 1 content
===
<style>/* Slide 2 only */</style>
Slide 2 content
```

## Performance Considerations

### Memory Usage
- AST kept in memory during processing
- Large presentations may require streaming

### Optimization Strategies
- Lazy parsing for large documents
- Caching parsed containers
- Parallel slide processing

## Output Format

The parser outputs a complete AST, not HTML. This separation allows:
- Multiple output formats (future)
- AST transformations
- Testing without rendering
- Plugin hooks (future)

## Related Documentation

- [Source Format](./source-format.md) - Input syntax
- [Render Pipeline](./render-pipeline.md) - HTML generation
- [Technical Limits](./technical-limits.md) - Size constraints