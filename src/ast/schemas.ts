// AST Zod Schemas
// Contains all Zod schemas for AST validation

import { z } from 'zod'

// Version schema
const VersionSchema = z.literal('0.1')

// Base node types schema
export const NodeTypeSchema = z.enum(['root', 'container', 'heading', 'paragraph', 'list', 'listItem', 'link', 'image', 'code', 'text', 'table', 'tableRow', 'tableCell'])

// Markdown node schemas (mdast compatible)
export const TextNodeSchema = z.object({
  type: z.literal('text'),
  value: z.string(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional()
})

export const HeadingNodeSchema = z.object({
  type: z.literal('heading'),
  depth: z.number().int().min(1).max(6),
  children: z.array(z.lazy(() => ASTNodeSchema))
})

export const ParagraphNodeSchema = z.object({
  type: z.literal('paragraph'),
  children: z.array(z.lazy(() => ASTNodeSchema))
})

export const ListNodeSchema = z.object({
  type: z.literal('list'),
  ordered: z.boolean().optional(),
  children: z.array(z.lazy(() => ASTNodeSchema))
})

export const ListItemNodeSchema = z.object({
  type: z.literal('listItem'),
  children: z.array(z.lazy(() => ASTNodeSchema))
})

export const LinkNodeSchema = z.object({
  type: z.literal('link'),
  url: z.string(), // Allow any string for internal/relative links
  children: z.array(z.lazy(() => ASTNodeSchema))
})

export const ImageNodeSchema = z.object({
  type: z.literal('image'),
  url: z.string(), // Allow any string for relative/local images
  alt: z.string().optional(),
  title: z.string().optional(),
  classes: z.array(z.string()).optional()
})

export const CodeNodeSchema = z.object({
  type: z.literal('code'),
  value: z.string(),
  lang: z.string().optional()
})

// Table node schemas
export const TableCellNodeSchema = z.object({
  type: z.literal('tableCell'),
  header: z.boolean().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  children: z.array(z.lazy(() => ASTNodeSchema))
})

export const TableRowNodeSchema = z.object({
  type: z.literal('tableRow'),
  children: z.array(z.lazy(() => ASTNodeSchema))
})

export const TableNodeSchema = z.object({
  type: z.literal('table'),
  children: z.array(z.lazy(() => ASTNodeSchema))
})

// Container node schema (Curtains-specific)
export const ContainerNodeSchema = z.object({
  type: z.literal('container'),
  classes: z.array(z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Invalid class name')),
  children: z.array(z.lazy(() => ASTNodeSchema))
})

// Union of all node types
export const ASTNodeSchema: z.ZodType = z.union([
  ContainerNodeSchema,
  TextNodeSchema,
  HeadingNodeSchema,
  ParagraphNodeSchema,
  ListNodeSchema,
  ListItemNodeSchema,
  LinkNodeSchema,
  ImageNodeSchema,
  CodeNodeSchema,
  TableNodeSchema,
  TableRowNodeSchema,
  TableCellNodeSchema
])

// Root AST schema
export const CurtainsASTSchema = z.object({
  type: z.literal('root'),
  children: z.array(ASTNodeSchema)
})

// Slide schema
export const CurtainsSlideSchema = z.object({
  type: z.literal('curtains-slide'),
  index: z.number().int().min(0).max(98), // MAX_SLIDES - 1
  ast: CurtainsASTSchema,
  slideCSS: z.string()
})

// Document schema (Parser output)
export const CurtainsDocumentSchema = z.object({
  type: z.literal('curtains-document'),
  version: VersionSchema,
  slides: z.array(CurtainsSlideSchema).min(1, 'Document must have at least one slide'),
  globalCSS: z.string()
})

// Transformed slide schema
export const TransformedSlideSchema = z.object({
  html: z.string(),
  css: z.string() // Already scoped with nth-child prefix
})

// Transformed document schema (Transformer output)
export const TransformedDocumentSchema = z.object({
  slides: z.array(TransformedSlideSchema).min(1),
  globalCSS: z.string()
})