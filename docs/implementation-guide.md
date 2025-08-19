# Implementation Guide

## What We're Building
A CLI tool that converts extended Markdown (with layout containers and CSS) into self-contained HTML presentations.

## Build Pipeline

```
.curtain file → Parser → Transformer → Renderer → .html file
```

## Build Order

### 1. CLI Entry Point
- Parse command: `curtains build input.curtain -o output.html [--theme light|dark]`
- Validate all inputs with Zod schemas
- Orchestrate pipeline with proper error handling

### 2. Parser
- Split on `===` delimiters
- Extract and validate `<style>` blocks
- Parse `<container>` elements with Zod validation
- Parse Markdown with remark
- Return validated CurtainsDocument

### 3. Transformer
- Convert validated AST to HTML using rehype
- Transform containers to `<div>` elements
- Add `target="_blank"` to external links
- Scope slide styles with nth-child selectors
- Return validated TransformedDocument

### 4. Renderer
- Merge CSS layers (base → theme → global → slide)
- Build final HTML with embedded runtime
- Return complete HTML string

### 5. Runtime (Browser)
- Keyboard navigation (arrows, space, F)
- Click/touch navigation
- Slide counter updates
- Fullscreen support

## Key Implementation Details

### Validation Strategy
Every function that accepts unknown input MUST validate with Zod:
- CLI arguments
- File contents
- Parser output
- Transform results
- All external data

### Style Scoping
- Global: Before first `===`
- Slide: Auto-prefixed with `.curtains-slide:nth-child(n)`

### Container Processing
- Only `<container>` tags processed
- All other HTML escaped
- Class names validated against regex

### Error Handling
All errors validated and typed with Zod schemas. Exit codes:
- 0: Success
- 1: Invalid arguments
- 2: File access error
- 3: Parse error
- 4: No slides found
- 5: Output error

