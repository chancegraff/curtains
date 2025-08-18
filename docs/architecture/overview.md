# Architecture Overview

## Overview

Curtains follows a modular, functional architecture with clear separation of concerns. The codebase is organized into distinct phases that mirror the data transformation pipeline: Parse → Transform → Render.

## Core Principles

1. **Clear separation of concerns** with distinct parser, transformer, and renderer phases
2. **Modular structure** where each file has a single responsibility
3. **Type safety** throughout with comprehensive TypeScript types
4. **Testability** with pure functions and clear interfaces
5. **Extensibility** with well-defined extension points
6. **Performance** with streaming and caching considerations
7. **Security** with proper input validation and escaping

## Data Flow

```
Input (.curtain file)
        ↓
┌─────────────────┐
│     Parser      │ → Splits document, extracts styles, parses containers & Markdown
└─────────────────┘
        ↓
  CurtainsDocument (AST)
        ↓
┌─────────────────┐
│   Transformer   │ → Converts AST to HTML, scopes styles, sanitizes links
└─────────────────┘
        ↓
 TransformedDocument
        ↓
┌─────────────────┐
│    Renderer     │ → Merges styles, builds HTML, injects into template
└─────────────────┘
        ↓
Output (.html file)
```

## Main Phases

### Parser Layer
**Purpose**: Parse source content into structured AST

Orchestrates:
1. Document splitting on `===` delimiters
2. Style extraction (global and slide-scoped)
3. Container parsing for custom elements
4. Markdown parsing via remark
5. AST building with enhanced nodes

### Transformer Layer
**Purpose**: Transform AST into renderable HTML with processed styles

Orchestrates:
1. AST to HTML conversion
2. Container transformation to div elements
3. Link sanitization for external links
4. Style scoping for slide-specific CSS

### Renderer Layer
**Purpose**: Generate final self-contained HTML file

Orchestrates:
1. Style merging (base → theme → global → slide-scoped)
2. HTML building with proper structure
3. Template injection with placeholders
4. Runtime embedding for browser functionality

## Performance Considerations

1. **Streaming**: For large files, consider streaming parser implementation
2. **Caching**: Cache compiled runtime.js between builds
3. **Parallel Processing**: Process slides in parallel during transform phase
4. **Memory**: Use iterators instead of arrays where possible
5. **Bundle Size**: Minify runtime code aggressively

## Security Considerations

1. **Input Validation**: Validate all user inputs
2. **CSS Injection**: No sanitization (user owns output)
3. **Path Traversal**: Validate file paths
4. **HTML Escaping**: Ensure all Markdown HTML is escaped
5. **Container Classes**: Validate class names for safety

## Related Documentation

- [Directory Structure](./directory-structure.md) - File organization and module layout
- [Modules](./modules.md) - Detailed module descriptions
- [Data Flow](./data-flow.md) - Complete data transformation pipeline
- [Dependencies](./dependencies.md) - Module dependency graph
- [Extension Points](./extension-points.md) - Future extensibility options