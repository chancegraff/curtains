# Pipeline Stages Specification

Component: Modular stages where each output feeds the next, converts Markdown→HTML

**Types Reference:** See [types-spec.md](./types-spec.md) for all type definitions

## Parse Stage Functions

```typescript
// Split content into slides
export function splitIntoSlides(
  content: string
): { globalContent: string; slideContents: string[] } {
  // Pure string splitting on delimiters
}

// Extract containers from content
export function extractContainers(
  content: string
): { containers: z.infer<typeof ContainerSchema>[]; cleaned: string } {
  // Pure regex extraction
}

// Extract styles from content
export function extractStyles(
  content: string
): { styles: z.infer<typeof ExtractedStyleSchema>[]; cleaned: string } {
  // Pure style tag extraction
}

// Parse markdown to mdast using unified ecosystem
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import type { Root as MdastRoot } from 'mdast'

export function parseMarkdownToMdast(
  content: string
): MdastRoot {
  // Direct use of unified with remark plugins
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
  
  return processor.parse(content) as MdastRoot
}

// Process single slide
export function processSlide(
  content: string,
  index: number
): ParsedSlide {
  // 1. Extract containers and styles
  const { containers, cleaned: cleanedFromContainers } = extractContainers(content)
  const { styles, cleaned: cleanedContent } = extractStyles(cleanedFromContainers)
  
  // 2. Parse markdown content to mdast
  const mdast = parseMarkdownToMdast(cleanedContent)
  
  // 3. Return parsed slide with mdast
  return {
    index,
    content: cleanedContent,
    mdast,
    containers,
    styles,
    metadata: {}
  }
}

// Validate slide count
export function validateSlideCount(
  count: number
): boolean {
  // Check min/max constraints
}

// Dedent container content
export function dedentContent(
  content: string
): string {
  // Remove common leading whitespace
}

// Expand inline containers
export function expandInlineContainers(
  content: string
): string {
  // Convert to multiline format
}
```

## AST Building Functions

```typescript
import type { Root as MdastRoot } from 'mdast'
import type { ParsedSlide, ASTSlide } from './types'

// Build AST from parsed slide
export function buildAST(
  slide: ParsedSlide
): ASTSlide {
  // Convert parsed content with mdast to custom AST
  // Integrates containers with markdown content
  const customNodes = slide.mdast 
    ? mdastToCustomAST(slide.mdast)
    : []
  
  return {
    index: slide.index,
    ast: {
      type: 'root',
      children: wrapInContainers(customNodes, slide.containers)
    },
    slideCSS: slide.styles.map(s => s.content).join('\n')
  }
}

// Convert mdast to custom AST using unified utilities
import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import type { Node as MdastNode } from 'mdast'

export function mdastToCustomAST(
  mdast: MdastRoot
): z.infer<typeof ASTNodeSchema>[] {
  const nodes: z.infer<typeof ASTNodeSchema>[] = []
  
  // Use unist-util-visit for tree traversal
  visit(mdast, (node: MdastNode) => {
    // Extract text content with mdast-util-to-string
    const textContent = toString(node)
    
    // Transform based on node type
    switch (node.type) {
      case 'heading':
        nodes.push({
          type: 'heading',
          depth: node.depth,
          children: processInlineContent(node.children)
        })
        break
      case 'paragraph':
        nodes.push({
          type: 'paragraph',
          children: processInlineContent(node.children)
        })
        break
      case 'text':
        nodes.push({
          type: 'text',
          value: node.value
        })
        break
      // Handle other node types...
    }
  })
  
  return nodes
}

// Wrap in container nodes
export function wrapInContainers(
  nodes: z.infer<typeof ASTNodeSchema>[],
  containers: z.infer<typeof ContainerSchema>[]
): z.infer<typeof ASTNodeSchema>[] {
  // Nest nodes in containers
}

// Process text formatting
export function processTextFormatting(
  node: z.infer<typeof ASTNodeSchema>
): z.infer<typeof TextNodeSchema> {
  // Extract bold/italic
}

// Process table structure
export function processTable(
  node: z.infer<typeof ASTNodeSchema>
): z.infer<typeof ASTNodeSchema> {
  // Build table AST
}

// Sanitize HTML attributes
export function sanitizeAttributes(
  attributes: Record<string, string | number | boolean>
): Record<string, string> {
  // Filter allowed attributes
}
```

## Transform Stage Functions

```typescript
// Convert mdast to hast using remark-rehype plugin
import remarkRehype from 'remark-rehype'
import type { Root as HastRoot } from 'hast'

export function mdastToHast(
  mdast: MdastRoot
): HastRoot {
  // Use remark-rehype plugin for mdast→hast conversion
  const processor = unified()
    .use(remarkRehype)
  
  return processor.runSync(mdast) as HastRoot
}

// Build custom HAST nodes using hastscript
import { h } from 'hastscript'
import type { Element } from 'hast'

export function buildContainerHast(
  classes: string[],
  children: HastNode[]
): Element {
  // Use hastscript builders for creating elements
  return h('div', { className: classes }, children)
}

// Stringify hast to HTML using rehype-stringify
import rehypeStringify from 'rehype-stringify'

export function hastToHTML(
  hast: HastRoot
): string {
  // Use rehype-stringify for hast→HTML conversion
  const processor = unified()
    .use(rehypeStringify)
  
  return processor.stringify(hast)
}

// Process hast node using hast utilities
import { isElement } from 'hast-util-is-element'
import type { Node as HastNode } from 'hast'

export function processHastNode(
  node: HastNode
): HastNode {
  // Use hast-util-is-element for node type checking
  if (isElement(node)) {
    // Modify element properties using hastscript
    return h(node.tagName, { ...node.properties }, node.children)
  }
  return node
}

// Scope CSS to slide
export function scopeStyles(
  css: string,
  slideIndex: number
): string {
  // Add nth-child selectors
}

// Process CSS rule
export function processCSSRule(
  rule: string,
  slideIndex: number
): string {
  // Scope individual rule
}

// Check if global rule
export function isGlobalRule(
  rule: string
): boolean {
  // Check for @-rules
}

// HTML escaping is handled automatically by rehype-stringify
// No manual escaping needed when using the unified ecosystem
// rehype-stringify ensures proper HTML entity encoding

// Add link attributes
export function processLink(
  url: string
): { target?: string; rel?: string } {
  // External link attributes
}

// Wrap content
export function wrapInContentDiv(
  html: string
): string {
  // Add .curtains-content wrapper
}
```

## Render Stage Functions

```typescript
// Build slide sections
export function buildSlidesHTML(
  doc: z.infer<typeof TransformedDocumentSchema>
): string {
  // Create slide HTML structure
}

// Merge CSS layers
export function mergeCSS(
  options: {
    globalCSS: string
    slidesCSS: string[]
    theme: 'light' | 'dark'
  }
): string {
  // Combine CSS in order
}

// Load theme CSS
export function loadThemeCSS(
  theme: 'light' | 'dark'
): string {
  // Get theme variables
}

// Generate runtime JS
export function generateRuntimeJS(
  config: z.infer<typeof RuntimeConfigSchema>
): string {
  // Create navigation script
}

// Build complete HTML
export function buildCompleteHTML(
  options: {
    slidesHTML: string
    css: string
    runtimeConfig: z.infer<typeof RuntimeConfigSchema>
    runtimeJS: string
  }
): string {
  // Assemble final document
}

// Create HTML template
export function createHTMLTemplate(): string {
  // Base HTML5 structure
}

// Inject meta tags
export function injectMetaTags(
  html: string,
  meta: Record<string, string>
): string {
  // Add viewport, charset
}
```

## Stage Composition

```typescript
import { pipe } from './utils/functional'
import type { CurtainsDocument, TransformedDocument } from './types'

// Compose parse operations using functional pipeline
export const parseStage = (input: string) => {
  const { globalContent, slideContents } = splitIntoSlides(input)
  const slides = slideContents.map((content, index) => 
    processSlide(content, index)
  )
  
  if (!validateSlideCount(slides.length)) {
    throw new Error('Invalid slide count')
  }
  
  return {
    globalContent,
    globalStyles: [],
    slides,
    version: '0.1' as const
  }
}

// Compose transform operations
export const transformStage = (doc: CurtainsDocument): TransformedDocument => {
  const transformedSlides = doc.slides.map(slide => {
    // Convert custom AST to hast
    const hast = customASTToHast(slide.ast)
    // Process and stringify to HTML
    const html = hastToHTML(hast)
    // Scope CSS to slide
    const css = scopeStyles(slide.slideCSS, slide.index)
    
    return {
      html: wrapInContentDiv(html),
      css
    }
  })
  
  return {
    slides: transformedSlides,
    globalCSS: doc.globalCSS
  }
}

// Compose render operations
export const renderStage = (doc: TransformedDocument): string => {
  const slidesHTML = buildSlidesHTML(doc)
  const mergedCSS = mergeCSS({
    globalCSS: doc.globalCSS,
    slidesCSS: doc.slides.map(s => s.css),
    theme: 'light'
  })
  const runtimeConfig = {
    input: '',
    output: '',
    theme: 'light' as const,
    timestamp: Date.now(),
    processId: crypto.randomUUID()
  }
  const runtimeJS = generateRuntimeJS(runtimeConfig)
  
  return buildCompleteHTML({
    slidesHTML,
    css: mergedCSS,
    runtimeConfig,
    runtimeJS
  })
}
```

## Unified Pipeline Flow

```
Input → remarkParse → mdast → remarkRehype → hast → rehypeStringify → Output
         ↓             ↓          ↓           ↓           ↓             ↓
      Markdown      AST Tree   Transform   HTML AST   HTML String   Complete
                       ↓                      ↓                     Document
                unist-util-visit       hastscript
              mdast-util-to-string      builders
```

### Unified Ecosystem Pipeline

```typescript
// Complete pipeline using unified ecosystem
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import { h } from 'hastscript'
import { isElement } from 'hast-util-is-element'

// 1. Parse Stage:
export const markdownProcessor = unified()
  .use(remarkParse)      // Markdown → mdast
  .use(remarkGfm)        // GitHub Flavored Markdown support

// 2. Tree Traversal (for custom processing):
export function traverseMdast(mdast: MdastRoot) {
  visit(mdast, (node) => {
    // Process each node
    const text = toString(node)  // Extract text content
    // Custom transformations...
  })
}

// 3. Transform Stage:
export const mdastToHtmlProcessor = unified()
  .use(remarkRehype)     // mdast → hast
  .use(rehypeStringify)  // hast → HTML string

// 4. Custom element creation:
export function createCustomElements() {
  // Use hastscript for element creation
  return h('div.container', [
    h('h1', 'Title'),
    h('p', 'Content')
  ])
}

// 5. Complete pipeline:
export async function processMarkdown(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown)
  
  return String(file)
}
```

## Immutability Patterns

- All functions return new values
- No mutations of input data
- AST nodes are immutable
- CSS/HTML strings are generated fresh
- No shared state between stages