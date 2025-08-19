// AST Type Definitions
// Contains all TypeScript types for the Curtains AST structure
// Note: Types are inferred from Zod schemas to ensure runtime/compile-time consistency

import type { z } from 'zod'
import type {
  CurtainsDocumentSchema,
  CurtainsSlideSchema,
  CurtainsASTSchema,
  ContainerNodeSchema,
  TextNodeSchema,
  HeadingNodeSchema,
  ParagraphNodeSchema,
  ListNodeSchema,
  ListItemNodeSchema,
  LinkNodeSchema,
  ImageNodeSchema,
  CodeNodeSchema,
  ASTNodeSchema,
  TransformedSlideSchema,
  TransformedDocumentSchema,
  NodeTypeSchema
} from './schemas.js'

// Base node types - inferred from schema
export type NodeType = z.infer<typeof NodeTypeSchema>

// AST node types - all inferred from schemas for consistency
export type TextNode = z.infer<typeof TextNodeSchema>
export type HeadingNode = z.infer<typeof HeadingNodeSchema>
export type ParagraphNode = z.infer<typeof ParagraphNodeSchema>
export type ListNode = z.infer<typeof ListNodeSchema>
export type ListItemNode = z.infer<typeof ListItemNodeSchema>
export type LinkNode = z.infer<typeof LinkNodeSchema>
export type ImageNode = z.infer<typeof ImageNodeSchema>
export type CodeNode = z.infer<typeof CodeNodeSchema>
export type ContainerNode = z.infer<typeof ContainerNodeSchema>
export type ASTNode = z.infer<typeof ASTNodeSchema>

// Root AST structure
export type CurtainsAST = z.infer<typeof CurtainsASTSchema>

// Document structure types
export type CurtainsSlide = z.infer<typeof CurtainsSlideSchema>
export type CurtainsDocument = z.infer<typeof CurtainsDocumentSchema>

// Transformer output types
export type TransformedSlide = z.infer<typeof TransformedSlideSchema>
export type TransformedDocument = z.infer<typeof TransformedDocumentSchema>