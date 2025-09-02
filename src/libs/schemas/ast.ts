import z from 'zod';

// Custom node types for Curtains (includes container support)
export const ASTNodeTypeSchema = z.enum([
  'root',
  'container',
  'heading',
  'paragraph',
  'list',
  'listItem',
  'link',
  'image',
  'code',
  'text',
  'table',
  'tableRow',
  'tableCell',
]);

// TypeScript interfaces for recursive types
interface BaseNode {
  type: z.infer<typeof ASTNodeTypeSchema>;
}

interface TextNode extends BaseNode {
  type: 'text';
  value: string;
  bold?: boolean | undefined;
  italic?: boolean | undefined;
}

interface ContainerNode extends BaseNode {
  type: 'container';
  classes: string[];
  children: ASTNode[];
}

interface HeadingNode extends BaseNode {
  type: 'heading';
  depth: number;
  children: ASTNode[];
}

interface ParagraphNode extends BaseNode {
  type: 'paragraph';
  children: ASTNode[];
}

interface ListNode extends BaseNode {
  type: 'list';
  children: ASTNode[];
  ordered?: boolean | undefined;
}

interface ListItemNode extends BaseNode {
  type: 'listItem';
  children: ASTNode[];
}

interface LinkNode extends BaseNode {
  type: 'link';
  url: string;
  children: ASTNode[];
}

interface ImageNode extends BaseNode {
  type: 'image';
  url: string;
  alt?: string | undefined;
}

interface CodeNode extends BaseNode {
  type: 'code';
  value: string;
  lang?: string | undefined;
}

interface TableNode extends BaseNode {
  type: 'table';
  children: ASTNode[];
  align?: (('left' | 'center' | 'right') | null)[] | undefined;
}

interface TableRowNode extends BaseNode {
  type: 'tableRow';
  children: ASTNode[];
}

interface TableCellNode extends BaseNode {
  type: 'tableCell';
  children: ASTNode[];
  align?: 'left' | 'center' | 'right' | null | undefined;
}

// Union type for all AST nodes
type ASTNode = 
  | TextNode 
  | ContainerNode 
  | HeadingNode 
  | ParagraphNode 
  | ListNode 
  | ListItemNode 
  | LinkNode 
  | ImageNode 
  | CodeNode 
  | TableNode 
  | TableRowNode 
  | TableCellNode;

interface ASTRootNode {
  type: 'root';
  children: ASTNode[];
}

interface ASTSlide {
  index: number;
  ast: ASTRootNode;
  slideCSS: string;
}

interface CurtainsDocument {
  type: 'curtains-document';
  version: '0.1';
  slides: ASTSlide[];
  globalCSS: string;
}

// Base node schema
export const BaseNodeSchema = z.object({
  type: ASTNodeTypeSchema,
});

// Text node schema (non-recursive, no need for z.lazy)
export const TextNodeSchema: z.ZodType<TextNode> = z.object({
  type: z.literal('text'),
  value: z.string(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
});

// Container node schema with proper recursion
export const ContainerNodeSchema: z.ZodType<ContainerNode> = z.lazy(() =>
  z.object({
    type: z.literal('container'),
    classes: z.array(z.string()),
    children: z.array(ASTNodeSchema),
  })
);

// Heading node schema with proper recursion
export const HeadingNodeSchema: z.ZodType<HeadingNode> = z.lazy(() =>
  z.object({
    type: z.literal('heading'),
    depth: z.number().int().min(1).max(6),
    children: z.array(ASTNodeSchema),
  })
);

// Paragraph node schema
export const ParagraphNodeSchema: z.ZodType<ParagraphNode> = z.lazy(() =>
  z.object({
    type: z.literal('paragraph'),
    children: z.array(ASTNodeSchema),
  })
);

// List node schema
export const ListNodeSchema: z.ZodType<ListNode> = z.lazy(() =>
  z.object({
    type: z.literal('list'),
    children: z.array(ASTNodeSchema),
    ordered: z.boolean().optional(),
  })
);

// ListItem node schema
export const ListItemNodeSchema: z.ZodType<ListItemNode> = z.lazy(() =>
  z.object({
    type: z.literal('listItem'),
    children: z.array(ASTNodeSchema),
  })
);

// Link node schema
export const LinkNodeSchema: z.ZodType<LinkNode> = z.lazy(() =>
  z.object({
    type: z.literal('link'),
    url: z.string(),
    children: z.array(ASTNodeSchema),
  })
);

// Image node schema
export const ImageNodeSchema: z.ZodType<ImageNode> = z.object({
  type: z.literal('image'),
  url: z.string(),
  alt: z.string().optional(),
});

// Code node schema
export const CodeNodeSchema: z.ZodType<CodeNode> = z.object({
  type: z.literal('code'),
  value: z.string(),
  lang: z.string().optional(),
});

// Table node schema
export const TableNodeSchema: z.ZodType<TableNode> = z.lazy(() =>
  z.object({
    type: z.literal('table'),
    children: z.array(ASTNodeSchema),
    align: z.array(z.enum(['left', 'center', 'right']).nullable()).optional(),
  })
);

// TableRow node schema
export const TableRowNodeSchema: z.ZodType<TableRowNode> = z.lazy(() =>
  z.object({
    type: z.literal('tableRow'),
    children: z.array(ASTNodeSchema),
  })
);

// TableCell node schema
export const TableCellNodeSchema: z.ZodType<TableCellNode> = z.lazy(() =>
  z.object({
    type: z.literal('tableCell'),
    children: z.array(ASTNodeSchema),
    align: z.enum(['left', 'center', 'right']).nullable().optional(),
  })
);

// Define the union schema with proper recursion
export const ASTNodeSchema: z.ZodType<ASTNode> = z.lazy(() =>
  z.union([
    TextNodeSchema,
    ContainerNodeSchema,
    HeadingNodeSchema,
    ParagraphNodeSchema,
    ListNodeSchema,
    ListItemNodeSchema,
    LinkNodeSchema,
    ImageNodeSchema,
    CodeNodeSchema,
    TableNodeSchema,
    TableRowNodeSchema,
    TableCellNodeSchema,
  ])
);

// AST root node schema
export const ASTRootNodeSchema: z.ZodType<ASTRootNode> = z.object({
  type: z.literal('root'),
  children: z.array(ASTNodeSchema),
});

// AST slide schema
export const ASTSlideSchema: z.ZodType<ASTSlide> = z.object({
  index: z.number(),
  ast: ASTRootNodeSchema,
  slideCSS: z.string(),
});

// Curtains document schema
export const CurtainsDocumentSchema: z.ZodType<CurtainsDocument> = z.object({
  type: z.literal('curtains-document'),
  version: z.literal('0.1'),
  slides: z.array(ASTSlideSchema),
  globalCSS: z.string(),
});

// Export types
export type ASTNodeType = z.infer<typeof ASTNodeTypeSchema>;
export type { 
  ASTNode, 
  ASTRootNode, 
  ASTSlide, 
  CodeNode,
  ContainerNode, 
  CurtainsDocument, 
  HeadingNode, 
  ImageNode,
  LinkNode,
  ListItemNode,
  ListNode,
  ParagraphNode,
  TableCellNode,
  TableNode,
  TableRowNode,
  TextNode,
};