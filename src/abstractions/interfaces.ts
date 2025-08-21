// Abstraction Interfaces
// Clean interfaces that hide implementation details from consumers

// Domain types that don't expose Zod schemas
export interface Document {
  readonly type: 'curtains-document'
  readonly version: string
  readonly slides: readonly Slide[]
  readonly globalCSS: string
}

export interface Slide {
  readonly type: 'curtains-slide'
  readonly index: number
  readonly ast: AST
  readonly slideCSS: string
}

export interface AST {
  readonly type: 'root'
  readonly children: readonly ASTNode[]
}

export interface TransformedDocument {
  readonly slides: readonly TransformedSlide[]
  readonly globalCSS: string
}

export interface TransformedSlide {
  readonly html: string
  readonly css: string
}

// Base AST node interface
export interface BaseASTNode {
  readonly type: string
}

export interface TextNode extends BaseASTNode {
  readonly type: 'text'
  readonly value: string
  readonly bold?: boolean
  readonly italic?: boolean
}

export interface HeadingNode extends BaseASTNode {
  readonly type: 'heading'
  readonly depth: number
  readonly children: readonly ASTNode[]
}

export interface ParagraphNode extends BaseASTNode {
  readonly type: 'paragraph'
  readonly children: readonly ASTNode[]
}

export interface ListNode extends BaseASTNode {
  readonly type: 'list'
  readonly ordered?: boolean
  readonly children: readonly ASTNode[]
}

export interface ListItemNode extends BaseASTNode {
  readonly type: 'listItem'
  readonly children: readonly ASTNode[]
}

export interface LinkNode extends BaseASTNode {
  readonly type: 'link'
  readonly url: string
  readonly children: readonly ASTNode[]
}

export interface ImageNode extends BaseASTNode {
  readonly type: 'image'
  readonly url: string
  readonly alt?: string
  readonly title?: string
  readonly classes?: readonly string[]
}

export interface CodeNode extends BaseASTNode {
  readonly type: 'code'
  readonly value: string
  readonly lang?: string
}

export interface ContainerNode extends BaseASTNode {
  readonly type: 'container'
  readonly classes: readonly string[]
  readonly children: readonly ASTNode[]
}

export interface TableNode extends BaseASTNode {
  readonly type: 'table'
  readonly children: readonly ASTNode[]
}

export interface TableRowNode extends BaseASTNode {
  readonly type: 'tableRow'
  readonly children: readonly ASTNode[]
}

export interface TableCellNode extends BaseASTNode {
  readonly type: 'tableCell'
  readonly header?: boolean
  readonly align?: 'left' | 'center' | 'right'
  readonly children: readonly ASTNode[]
}

// Union of all node types
export type ASTNode = 
  | TextNode
  | HeadingNode
  | ParagraphNode
  | ListNode
  | ListItemNode
  | LinkNode
  | ImageNode
  | CodeNode
  | ContainerNode
  | TableNode
  | TableRowNode
  | TableCellNode

// Parser interface
export interface MarkdownParser {
  /**
   * Parse content into a structured document
   * @param content - Raw content to parse
   * @returns Structured document
   */
  parse(content: string): Document

  /**
   * Check if parser supports a given format
   * @param format - Format identifier
   * @returns True if format is supported
   */
  supports(format: string): boolean
}

// Transformer interface  
export interface DocumentTransformer {
  /**
   * Transform a document to HTML representation
   * @param document - Document to transform
   * @returns Transformed document with HTML and CSS
   */
  transform(document: Document): TransformedDocument
}

// Error types for clean error handling
export interface ParseError extends Error {
  code: 'PARSE_ERROR'
  phase: 'parse'
  context?: unknown
}

export interface TransformError extends Error {
  code: 'TRANSFORM_ERROR' 
  phase: 'transform'
  context?: unknown
}

export type CurtainsError = ParseError | TransformError