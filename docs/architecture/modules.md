# Module Details

## CLI Layer (`/cli`)

**Purpose**: Handle command-line interface and user interaction

### `index.ts`
```typescript
// Entry point for the CLI application
export function main(argv: string[]): Promise<void>

// Parses CLI arguments and routes to appropriate command
// Handles --help, --version, and error states
// Sets up process exit codes
```

### `commands.ts`
```typescript
import { BuildOptions } from '../types'

// Execute the build command
export async function build(options: BuildOptions): Promise<void>

// Orchestrates the entire pipeline:
// 1. Read input file
// 2. Call parser
// 3. Call transformer  
// 4. Call renderer
// 5. Write output file
```

## Parser Layer (`/parser`)

**Purpose**: Parse source content into structured AST

### `index.ts`
```typescript
import { CurtainsDocument } from '../types'

// Main parser entry point
export function parse(source: string): CurtainsDocument

// Orchestrates:
// 1. Document splitting
// 2. Style extraction
// 3. Container parsing
// 4. Markdown parsing
// 5. AST building
```

### `document-splitter.ts`
```typescript
export interface SplitResult {
  globalContent: string      // Content before first ===
  slideContents: string[]    // Individual slide contents
}

// Split document on === delimiters
export function splitDocument(source: string): SplitResult

// Handles edge cases:
// - No delimiters (single slide)
// - Empty slides (filtered out)
// - Whitespace around delimiters
```

### `style-extractor.ts`
```typescript
export interface ExtractedStyles {
  content: string           // Content with <style> blocks removed
  styles: StyleBlock[]      // Extracted style blocks
}

export interface StyleBlock {
  css: string              // CSS content
  position: 'global' | 'slide'
  slideIndex?: number      // For slide-scoped styles
}

// Extract <style> blocks from content
export function extractStyles(content: string, isGlobal: boolean): ExtractedStyles

// Preserves position information for proper scoping
// Returns clean content for further parsing
```

### `container-parser.ts`
```typescript
import { ContainerNode } from '../types'

export interface ParsedContent {
  content: string          // Content with containers replaced by markers
  containers: Map<string, ContainerNode>  // Container ID -> node mapping
}

// Parse <container> elements into AST nodes
export function parseContainers(content: string): ParsedContent

// Handles:
// - Nested containers
// - Multiple classes
// - Malformed tags (error reporting)
// Returns markers for later substitution
```

### `markdown-parser.ts`
```typescript
import { Root } from 'mdast'

// Parse Markdown content using remark
export function parseMarkdown(content: string): Root

// Configures remark with:
// - CommonMark compliance
// - HTML escaping
// - Required plugins
```

### `ast-builder.ts`
```typescript
import { CurtainsAST, CurtainsSlide } from '../types'

// Build enhanced AST with container nodes integrated
export function buildAST(
  markdownAST: Root,
  containers: Map<string, ContainerNode>
): CurtainsAST

// Merges Markdown AST with container nodes
// Replaces container markers with actual nodes
// Maintains proper nesting structure
```

## Transformer Layer (`/transformer`)

**Purpose**: Transform AST into renderable HTML with processed styles

### `index.ts`
```typescript
import { CurtainsDocument, TransformedDocument } from '../types'

export interface TransformedDocument {
  slides: TransformedSlide[]
  globalCSS: string
}

export interface TransformedSlide {
  html: string
  scopedCSS: string
}

// Main transformer entry point
export function transform(document: CurtainsDocument): TransformedDocument

// Orchestrates:
// 1. AST to HTML conversion
// 2. Container transformation
// 3. Link sanitization
// 4. Style scoping
```

### `ast-to-html.ts`
```typescript
import { CurtainsAST } from '../types'

// Convert Curtains AST to HTML string
export function astToHTML(ast: CurtainsAST): string

// Uses rehype for Markdown → HTML
// Preserves container structure
// Handles special nodes appropriately
```

### `style-scoper.ts`
```typescript
// Add slide-specific prefixes to CSS selectors
export function scopeStyles(css: string, slideIndex: number): string

// Transforms:
// .my-class → .curtains-slide:nth-child(n) .my-class
// Handles complex selectors
// Preserves media queries and keyframes
```

### `link-sanitizer.ts`
```typescript
// Process links in HTML content
export function sanitizeLinks(html: string): string

// Adds to external links:
// - target="_blank"
// - rel="noopener noreferrer"
// Preserves internal links (#hash)
```

### `container-transformer.ts`
```typescript
import { ContainerNode } from '../types'

// Transform container node to div element
export function transformContainer(node: ContainerNode): string

// Converts:
// <container class="foo bar"> → <div class="foo bar">
// Handles nested containers recursively
```

## Renderer Layer (`/renderer`)

**Purpose**: Generate final self-contained HTML file

### `index.ts`
```typescript
import { TransformedDocument, RenderOptions } from '../types'

// Main renderer entry point
export function render(
  document: TransformedDocument,
  options: RenderOptions
): string

// Orchestrates:
// 1. Style merging
// 2. HTML building
// 3. Template injection
// 4. Runtime embedding
```

### `style-merger.ts`
```typescript
export interface MergedStyles {
  css: string  // Complete CSS for <style> tag
}

// Merge all CSS sources in correct order
export function mergeStyles(
  baseCSS: string,
  themeCSS: string,
  globalCSS: string,
  slideStyles: string[]
): MergedStyles

// Order: base → theme → global → slide-scoped
// Handles deduplication
// Minifies if needed
```

### `html-builder.ts`
```typescript
// Build HTML structure for slides
export function buildHTML(slides: string[]): string

// Creates:
// <div class="curtains-stage">
//   <section class="curtains-slide">...</section>
//   ...
// </div>
```

### `template-injector.ts`
```typescript
export interface InjectionData {
  html: string
  css: string
  javascript: string
  theme: 'light' | 'dark'
  slideCount: number
}

// Inject content into HTML template
export function injectIntoTemplate(
  template: string,
  data: InjectionData
): string

// Replaces placeholders:
// {{STYLES}} → CSS
// {{CONTENT}} → HTML
// {{RUNTIME}} → JavaScript
// {{THEME}} → theme name
```

## Runtime Layer (`/runtime`)

**Purpose**: Browser-side presentation functionality

### `index.ts`
```typescript
// Main runtime initialization
export function initRuntime(): void

// Sets up:
// - Event listeners
// - Initial state
// - Counter display
// Auto-executes on load
```

### `navigation.ts`
```typescript
export class NavigationController {
  currentIndex: number
  totalSlides: number
  
  next(): void
  previous(): void
  goToSlide(index: number): void
  
  // Handles wrap-around
  // Updates DOM transforms
  // Triggers counter update
}
```

### `keyboard.ts`
```typescript
export class KeyboardHandler {
  constructor(navigation: NavigationController)
  
  handleKeydown(event: KeyboardEvent): void
  
  // Maps:
  // ArrowRight/Space/Enter → next
  // ArrowLeft → previous
  // F → fullscreen
}
```

### `fullscreen.ts`
```typescript
export class FullscreenManager {
  toggle(): void
  enter(): void
  exit(): void
  
  // Wraps Fullscreen API
  // Handles vendor prefixes
  // Graceful fallback
}
```

### `counter.ts`
```typescript
export class CounterDisplay {
  update(current: number, total: number): void
  
  // Updates .curtains-counter element
  // Format: "current/total"
}
```

## Related Documentation

- [Directory Structure](./directory-structure.md) - File organization
- [Data Flow](./data-flow.md) - How data moves through modules
- [Dependencies](./dependencies.md) - Module relationships
- [Testing Strategy](./testing-strategy.md) - Testing approach