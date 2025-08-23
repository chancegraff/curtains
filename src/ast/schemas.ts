// AST Zod Schemas
// Contains all Zod schemas for AST validation

import { z } from 'zod'

// Forward declaration for recursive types
interface BaseASTNode {
  type: string
}

interface TextNode extends BaseASTNode {
  type: 'text'
  value: string
  bold?: boolean | undefined
  italic?: boolean | undefined
}

interface HeadingNode extends BaseASTNode {
  type: 'heading'
  depth: number
  children: ASTNode[]
}

interface ParagraphNode extends BaseASTNode {
  type: 'paragraph'
  children: ASTNode[]
}

interface ListNode extends BaseASTNode {
  type: 'list'
  ordered?: boolean | undefined
  children: ASTNode[]
}

interface ListItemNode extends BaseASTNode {
  type: 'listItem'
  children: ASTNode[]
}

interface LinkNode extends BaseASTNode {
  type: 'link'
  url: string
  children: ASTNode[]
}

interface ImageNode extends BaseASTNode {
  type: 'image'
  url: string
  alt?: string | undefined
  title?: string | undefined
  classes?: string[] | undefined
}

interface CodeNode extends BaseASTNode {
  type: 'code'
  value: string
  lang?: string | undefined
}

interface TableCellNode extends BaseASTNode {
  type: 'tableCell'
  header?: boolean | undefined
  align?: 'left' | 'center' | 'right' | undefined
  children: ASTNode[]
}

interface TableRowNode extends BaseASTNode {
  type: 'tableRow'
  children: ASTNode[]
}

interface TableNode extends BaseASTNode {
  type: 'table'
  children: ASTNode[]
}

interface ContainerNode extends BaseASTNode {
  type: 'container'
  classes: string[]
  children: ASTNode[]
}

type ASTNode = 
  | ContainerNode
  | TextNode
  | HeadingNode
  | ParagraphNode
  | ListNode
  | ListItemNode
  | LinkNode
  | ImageNode
  | CodeNode
  | TableNode
  | TableRowNode
  | TableCellNode

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

export const HeadingNodeSchema: z.ZodType<HeadingNode> = z.object({
  type: z.literal('heading'),
  depth: z.number().int().min(1).max(6),
  children: z.array(z.lazy(() => ASTNodeSchema))
})

export const ParagraphNodeSchema: z.ZodType<ParagraphNode> = z.object({
  type: z.literal('paragraph'),
  children: z.array(z.lazy(() => ASTNodeSchema))
})

export const ListNodeSchema: z.ZodType<ListNode> = z.object({
  type: z.literal('list'),
  ordered: z.boolean().optional(),
  children: z.array(z.lazy(() => ASTNodeSchema))
})

export const ListItemNodeSchema: z.ZodType<ListItemNode> = z.object({
  type: z.literal('listItem'),
  children: z.array(z.lazy(() => ASTNodeSchema))
})

export const LinkNodeSchema: z.ZodType<LinkNode> = z.object({
  type: z.literal('link'),
  url: z.string(), // Allow any string for internal/relative links
  children: z.array(z.lazy(() => ASTNodeSchema))
})

export const ImageNodeSchema: z.ZodType<ImageNode> = z.object({
  type: z.literal('image'),
  url: z.string(), // Allow any string for relative/local images
  alt: z.string().optional(),
  title: z.string().optional(),
  classes: z.array(z.string()).optional()
})

export const CodeNodeSchema: z.ZodType<CodeNode> = z.object({
  type: z.literal('code'),
  value: z.string(),
  lang: z.string().optional()
})

// Table node schemas
export const TableCellNodeSchema: z.ZodType<TableCellNode> = z.object({
  type: z.literal('tableCell'),
  header: z.boolean().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  children: z.array(z.lazy(() => ASTNodeSchema))
})

export const TableRowNodeSchema: z.ZodType<TableRowNode> = z.object({
  type: z.literal('tableRow'),
  children: z.array(z.lazy(() => ASTNodeSchema))
})

export const TableNodeSchema: z.ZodType<TableNode> = z.object({
  type: z.literal('table'),
  children: z.array(z.lazy(() => ASTNodeSchema))
})

// Container node schema (Curtains-specific)
export const ContainerNodeSchema: z.ZodType<ContainerNode> = z.object({
  type: z.literal('container'),
  classes: z.array(z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Invalid class name')),
  children: z.array(z.lazy(() => ASTNodeSchema))
})

// Union of all node types
export const ASTNodeSchema: z.ZodType<ASTNode> = z.union([
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