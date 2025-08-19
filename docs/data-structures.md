# Data Structures

## Core Types

### CurtainsDocument (Parser Output)
```typescript
type CurtainsDocument = {
  type: "curtains-document"
  version: "0.1"
  slides: CurtainsSlide[]
  globalCSS: string  // Styles before first ===
}

type CurtainsSlide = {
  type: "curtains-slide"
  index: number
  ast: CurtainsAST
  slideCSS: string  // Styles for this slide only
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
  classes: string[]
  children: (MarkdownNode | ContainerNode)[]
}

// MarkdownNode = standard mdast nodes (heading, paragraph, list, etc.)
```

### TransformedDocument (Transformer Output)
```typescript
type TransformedDocument = {
  slides: TransformedSlide[]
  globalCSS: string
}

type TransformedSlide = {
  html: string
  css: string  // Already scoped with nth-child prefix
}
```

### CLI Options
```typescript
type BuildOptions = {
  input: string       // Path to .curtain file
  output: string      // Path to .html file
  theme: 'light' | 'dark'
}
```

## Constants
```typescript
const DEFAULTS = {
  MAX_SLIDES: 99,
  MAX_NESTING_DEPTH: 10,
  THEME: 'light',
  OUTPUT_EXTENSION: '.html'
}

const REGEX = {
  DELIMITER: /^\s*===\s*$/m,
  CONTAINER: /<container\s+class="([^"]*)">([\s\S]*?)<\/container>/gi,
  STYLE: /<style>([\s\S]*?)<\/style>/gi,
  CLASS_NAME: /^[a-zA-Z0-9_-]+$/
}
```