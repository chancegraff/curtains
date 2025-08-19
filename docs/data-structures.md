# Data Structures

## Core Zod Schemas

```typescript
import { z } from 'zod'

// Version schema
const VersionSchema = z.literal('0.1')

// Base node types
const NodeTypeSchema = z.enum(['root', 'container', 'heading', 'paragraph', 'list', 'listItem', 'link', 'image', 'code', 'text'])

// Container node schema
const ContainerNodeSchema = z.object({
  type: z.literal('container'),
  classes: z.array(z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Invalid class name')),
  children: z.array(z.lazy(() => ASTNodeSchema))
})

// Markdown node schemas (mdast compatible)
const TextNodeSchema = z.object({
  type: z.literal('text'),
  value: z.string()
})

const HeadingNodeSchema = z.object({
  type: z.literal('heading'),
  depth: z.number().int().min(1).max(6),
  children: z.array(z.lazy(() => ASTNodeSchema))
})

const LinkNodeSchema = z.object({
  type: z.literal('link'),
  url: z.string().url(),
  children: z.array(z.lazy(() => ASTNodeSchema))
})

// Union of all node types
const ASTNodeSchema: z.ZodType = z.union([
  ContainerNodeSchema,
  TextNodeSchema,
  HeadingNodeSchema,
  LinkNodeSchema,
  // Add other mdast node types as needed
])

// Root AST schema
const CurtainsASTSchema = z.object({
  type: z.literal('root'),
  children: z.array(ASTNodeSchema)
})

// Slide schema
const CurtainsSlideSchema = z.object({
  type: z.literal('curtains-slide'),
  index: z.number().int().min(0).max(98), // MAX_SLIDES - 1
  ast: CurtainsASTSchema,
  slideCSS: z.string()
})

// Document schema (Parser output)
const CurtainsDocumentSchema = z.object({
  type: z.literal('curtains-document'),
  version: VersionSchema,
  slides: z.array(CurtainsSlideSchema).min(1, 'Document must have at least one slide'),
  globalCSS: z.string()
})

// Transformed slide schema
const TransformedSlideSchema = z.object({
  html: z.string(),
  css: z.string() // Already scoped with nth-child prefix
})

// Transformed document schema (Transformer output)
const TransformedDocumentSchema = z.object({
  slides: z.array(TransformedSlideSchema).min(1),
  globalCSS: z.string()
})

// CLI Options schema
const ThemeSchema = z.enum(['light', 'dark'])

const BuildOptionsSchema = z.object({
  input: z.string().refine(val => val.endsWith('.curtain'), {
    message: 'Input must be a .curtain file'
  }),
  output: z.string().refine(val => val.endsWith('.html'), {
    message: 'Output must be a .html file'
  }),
  theme: ThemeSchema.default('light')
})

// Constants with validation
const DEFAULTS = {
  MAX_SLIDES: 99,
  MAX_NESTING_DEPTH: 10,
  THEME: 'light' as const,
  OUTPUT_EXTENSION: '.html'
} as const

// Regex patterns
const REGEX = {
  DELIMITER: /^\s*===\s*$/m,
  CONTAINER: /<container\s+class="([^"]*)">[\s\S]*?<\/container>/gi,
  STYLE: /<style>[\s\S]*?<\/style>/gi,
  CLASS_NAME: /^[a-zA-Z0-9_-]+$/
} as const

// Export types inferred from schemas
export type CurtainsDocument = z.infer<typeof CurtainsDocumentSchema>
export type CurtainsSlide = z.infer<typeof CurtainsSlideSchema>
export type CurtainsAST = z.infer<typeof CurtainsASTSchema>
export type ContainerNode = z.infer<typeof ContainerNodeSchema>
export type TransformedDocument = z.infer<typeof TransformedDocumentSchema>
export type TransformedSlide = z.infer<typeof TransformedSlideSchema>
export type BuildOptions = z.infer<typeof BuildOptionsSchema>
export type Theme = z.infer<typeof ThemeSchema>

// Export schemas for runtime validation
export {
  CurtainsDocumentSchema,
  CurtainsSlideSchema,
  CurtainsASTSchema,
  ContainerNodeSchema,
  TransformedDocumentSchema,
  TransformedSlideSchema,
  BuildOptionsSchema,
  ThemeSchema,
  DEFAULTS,
  REGEX
}
```