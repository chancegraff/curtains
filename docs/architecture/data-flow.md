# Data Flow and Pipeline

## High-Level Data Flow

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

## Detailed Pipeline Flow

### Phase 1: Parsing

```typescript
// src/parser/index.ts
export function parse(source: string): CurtainsDocument {
  const { globalContent, slideContents } = splitDocument(source)
  
  // Extract global styles
  const { content: cleanGlobal, styles: globalStyles } = 
    extractStyles(globalContent, true)
  
  // Process each slide
  const slides = slideContents.map((slideContent, index) => {
    const { content, styles } = extractStyles(slideContent, false)
    const { content: marked, containers } = parseContainers(content)
    const mdast = parseMarkdown(marked)
    const ast = buildAST(mdast, containers)
    
    return {
      type: 'curtains-slide' as const,
      index,
      raw: slideContent,
      ast,
      slideCSS: styles.map(s => s.css).join('\n')
    }
  })
  
  return {
    type: 'curtains-document',
    version: '0.1',
    slides,
    globalCSS: globalStyles.map(s => s.css).join('\n')
  }
}
```

### Phase 2: Transformation

The transformer takes the AST and converts it into HTML with properly scoped styles:

1. **AST to HTML**: Convert each slide's AST into HTML
2. **Container Processing**: Transform `<container>` nodes to `<div>` elements
3. **Link Sanitization**: Add security attributes to external links
4. **Style Scoping**: Prefix slide-specific CSS selectors

### Phase 3: Rendering

The renderer assembles the final output:

1. **Style Merging**: Combine all CSS in proper order
2. **HTML Building**: Create slide structure
3. **Template Injection**: Fill template placeholders
4. **Runtime Embedding**: Include JavaScript for presentation controls

## Data Structures

### CurtainsDocument (Parser Output)

```typescript
type CurtainsDocument = {
  type: "curtains-document";
  version: "0.1";
  slides: CurtainsSlide[];
  globalCSS: string; // Style blocks from before first ===
};

type CurtainsSlide = {
  type: "curtains-slide";
  index: number;
  raw: string;
  ast: CurtainsAST; // Enhanced AST, not just mdast
  slideCSS: string; // Style blocks scoped to this slide
};

type CurtainsAST = {
  type: "root";
  children: (MarkdownNode | ContainerNode)[];
};

type ContainerNode = {
  type: "container";
  classes: string[]; // Parsed from class attribute
  children: CurtainsAST[];
};
```

### TransformedDocument (Transformer Output)

```typescript
export interface TransformedDocument {
  slides: TransformedSlide[]
  globalCSS: string
}

export interface TransformedSlide {
  html: string
  scopedCSS: string
}
```

### Final HTML Structure (Renderer Output)

```html
<div class="curtains-root" data-theme="light">
  <div class="curtains-stage">
    <section class="curtains-slide">
      <!-- Slide content with transformed containers -->
      <div class="hero-slide centered">
        <h1>Slide content</h1>
      </div>
    </section>
    <!-- More slides... -->
  </div>
  <div class="curtains-counter">1/10</div>
</div>
```

## CLI Runtime Flow

The complete CLI execution flow:

1. **Read input** `.curtain` file
2. **Split on first `===`** to separate global content from slides
3. **Extract global `<style>` blocks** from pre-delimiter content
4. **Parse slide chunks**, extracting slide-scoped `<style>` blocks
5. **Parse `<container>` elements** and Markdown
6. **Build enhanced AST** for each slide with style metadata
7. **Transform AST → HTML** (containers → divs)
8. **Process slide-scoped styles** with automatic prefixing
9. **Read pre-built** runtime.js and style.css
10. **Merge** base CSS + theme CSS + global custom CSS + prefixed slide CSS
11. **Inject** HTML, CSS, and JS into template
12. **Write** single output.html file

## Example Pipeline Execution

Given this input:

```curtain
<style>
.global { color: blue; }
</style>

===

# Title
<container class="hero">
Content
</container>

<style>
.hero { background: red; }
</style>
```

The pipeline produces:

1. **Parser**: Extracts global style, splits slide, parses container
2. **Transformer**: Converts to HTML, scopes `.hero` to slide 1
3. **Renderer**: Merges styles, builds final HTML with runtime

## Error Handling Flow

Errors are handled at each phase with specific exit codes:

- **Parse errors** (code 3): Invalid syntax, malformed containers
- **Transform errors** (code 4): No slides found, AST issues
- **Render errors** (code 5): Template issues, write failures

## Related Documentation

- [Overview](./overview.md) - High-level architecture
- [Modules](./modules.md) - Detailed module descriptions
- [Build Process](./build-process.md) - Build and bundling details