# Implementation Guide

## What We're Building
A CLI tool that converts extended Markdown (with layout containers and CSS) into self-contained HTML presentations.

## Build Order

### 1. CLI Entry Point
- Parse command: `curtains build input.curtain -o output.html [--theme light|dark]`
- Validate arguments, read input file
- Orchestrate pipeline: parse → transform → render → write

### 2. Parser
- Split on `===` delimiters (global content, then slides)
- Extract `<style>` blocks (position determines scope)
- Parse `<container class="...">` elements
- Parse Markdown with remark
- Build AST combining all elements

### 3. Transformer
- Convert AST to HTML using rehype
- Transform containers to `<div>` elements
- Add `target="_blank"` to external links
- Scope slide styles with `.curtains-slide:nth-child(n)` prefix

### 4. Renderer
- Merge CSS: base → theme → global → slide-scoped
- Build HTML structure with slides
- Inject into template
- Embed runtime JavaScript inline

### 5. Runtime (Browser JS)
- Keyboard navigation (arrows, space, F)
- Click navigation
- Slide counter updates
- Fullscreen toggle

## Key Implementation Details

### Slide Delimiter
- Regex: `/^\s*===\s*$/m`
- Everything before first `===` is global

### Style Scoping
- Before first `===`: Global styles
- After `===`: Auto-prefixed to that slide

### Container Elements
- Only `<container>` tags are processed
- All other HTML is escaped
- Transforms to `<div class="...">`

### Output Structure
```html
<div class="curtains-root" data-theme="light">
  <div class="curtains-stage">
    <section class="curtains-slide">...</section>
    <!-- more slides -->
  </div>
  <div class="curtains-counter">1/10</div>
</div>
```

## Exit Codes
- 0: Success
- 1: Invalid arguments
- 2: File access error
- 3: Parse error
- 4: No slides found
- 5: Output write error