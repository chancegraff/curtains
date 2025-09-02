import z from 'zod';

// Integration with unified ecosystem:
// - Parse markdown -> mdast using remark
// - Transform mdast -> hast using remark-rehype
// - These schemas validate the AST structures from remark

// Note: We define our own interfaces instead of using @types/mdast
// because z.lazy() requires the exact TypeScript type for recursion

// Node positions schemas
export const NodePointSchema = z.object({
  line: z.number(),
  column: z.number(),
  offset: z.number(),
});

export const NodePositionSchema = z.object({
  start: NodePointSchema,
  end: NodePointSchema,
});

// Mdast node types from remark
export const MdastNodeTypeSchema = z.enum([
  'root',
  'heading',
  'paragraph',
  'text',
  'emphasis',
  'strong',
  'link',
  'image',
  'list',
  'listItem',
  'code',
  'inlineCode',
  'table',
  'tableRow',
  'tableCell',
  'break',
  'thematicBreak',
  'blockquote',
  'html',
  'definition',
  'linkReference',
  'imageReference',
]);

// TypeScript interfaces for recursive types
// These match the structure of mdast nodes from remark
export interface IMdastTextNode {
  type: 'text';
  value: string;
  position?: z.infer<typeof NodePositionSchema> | undefined;
}

export interface IMdastHeadingNode {
  type: 'heading';
  depth: number;
  children: IMdastNode[];
  position?: z.infer<typeof NodePositionSchema> | undefined;
}

export interface IMdastParagraphNode {
  type: 'paragraph';
  children: IMdastNode[];
  position?: z.infer<typeof NodePositionSchema> | undefined;
}

export interface IMdastEmphasisNode {
  type: 'emphasis';
  children: IMdastNode[];
  position?: z.infer<typeof NodePositionSchema> | undefined;
}

export interface IMdastStrongNode {
  type: 'strong';
  children: IMdastNode[];
  position?: z.infer<typeof NodePositionSchema> | undefined;
}

export interface IMdastLinkNode {
  type: 'link';
  url: string;
  title?: string | undefined;
  children: IMdastNode[];
  position?: z.infer<typeof NodePositionSchema> | undefined;
}

export interface IMdastImageNode {
  type: 'image';
  url: string;
  alt?: string | undefined;
  title?: string | undefined;
  position?: z.infer<typeof NodePositionSchema> | undefined;
}

export interface IMdastListNode {
  type: 'list';
  ordered?: boolean | undefined;
  start?: number | undefined;
  spread?: boolean | undefined;
  children: IMdastNode[];
  position?: z.infer<typeof NodePositionSchema> | undefined;
}

export interface IMdastListItemNode {
  type: 'listItem';
  checked?: boolean | undefined;
  spread?: boolean | undefined;
  children: IMdastNode[];
  position?: z.infer<typeof NodePositionSchema> | undefined;
}

export interface IMdastCodeNode {
  type: 'code';
  lang?: string | undefined;
  meta?: string | undefined;
  value: string;
  position?: z.infer<typeof NodePositionSchema> | undefined;
}

export interface IMdastInlineCodeNode {
  type: 'inlineCode';
  value: string;
  position?: z.infer<typeof NodePositionSchema> | undefined;
}

export interface IMdastTableNode {
  type: 'table';
  align?: (('left' | 'center' | 'right') | null)[] | undefined;
  children: IMdastNode[];
  position?: z.infer<typeof NodePositionSchema> | undefined;
}

export interface IMdastTableRowNode {
  type: 'tableRow';
  children: IMdastNode[];
  position?: z.infer<typeof NodePositionSchema> | undefined;
}

export interface IMdastTableCellNode {
  type: 'tableCell';
  children: IMdastNode[];
  position?: z.infer<typeof NodePositionSchema> | undefined;
}

export interface IMdastRootNode {
  type: 'root';
  children: IMdastNode[];
  position?: z.infer<typeof NodePositionSchema> | undefined;
}

// Union type for all mdast nodes
export type IMdastNode =
  | IMdastTextNode
  | IMdastHeadingNode
  | IMdastParagraphNode
  | IMdastEmphasisNode
  | IMdastStrongNode
  | IMdastLinkNode
  | IMdastImageNode
  | IMdastListNode
  | IMdastListItemNode
  | IMdastCodeNode
  | IMdastInlineCodeNode
  | IMdastTableNode
  | IMdastTableRowNode
  | IMdastTableCellNode
  | IMdastRootNode;

// Base mdast node
export const BaseMdastNodeSchema = z.object({
  type: MdastNodeTypeSchema,
  position: NodePositionSchema.optional(),
});

// Create individual schemas first without circular dependencies
const MdastTextNodeSchemaBase: z.ZodType<IMdastTextNode> = z.object({
  type: z.literal('text'),
  value: z.string(),
  position: NodePositionSchema.optional(),
});

const MdastImageNodeSchemaBase: z.ZodType<IMdastImageNode> = z.object({
  type: z.literal('image'),
  url: z.string(),
  alt: z.string().optional(),
  title: z.string().optional(),
  position: NodePositionSchema.optional(),
});

const MdastCodeNodeSchemaBase: z.ZodType<IMdastCodeNode> = z.object({
  type: z.literal('code'),
  lang: z.string().optional(),
  meta: z.string().optional(),
  value: z.string(),
  position: NodePositionSchema.optional(),
});

const MdastInlineCodeNodeSchemaBase: z.ZodType<IMdastInlineCodeNode> = z.object({
  type: z.literal('inlineCode'),
  value: z.string(),
  position: NodePositionSchema.optional(),
});

// Now create the recursive union using lazy
const createMdastNodeSchema = (): z.ZodType<IMdastNode> => {
  const MdastNodeSchema: z.ZodType<IMdastNode> = z.lazy(() =>
    z.union([
      MdastTextNodeSchemaBase,
      z.object({
        type: z.literal('heading'),
        depth: z.number().int().min(1).max(6),
        children: z.array(MdastNodeSchema),
        position: NodePositionSchema.optional(),
      }),
      z.object({
        type: z.literal('paragraph'),
        children: z.array(MdastNodeSchema),
        position: NodePositionSchema.optional(),
      }),
      z.object({
        type: z.literal('emphasis'),
        children: z.array(MdastNodeSchema),
        position: NodePositionSchema.optional(),
      }),
      z.object({
        type: z.literal('strong'),
        children: z.array(MdastNodeSchema),
        position: NodePositionSchema.optional(),
      }),
      z.object({
        type: z.literal('link'),
        url: z.string(),
        title: z.string().optional(),
        children: z.array(MdastNodeSchema),
        position: NodePositionSchema.optional(),
      }),
      MdastImageNodeSchemaBase,
      z.object({
        type: z.literal('list'),
        ordered: z.boolean().optional(),
        start: z.number().optional(),
        spread: z.boolean().optional(),
        children: z.array(MdastNodeSchema),
        position: NodePositionSchema.optional(),
      }),
      z.object({
        type: z.literal('listItem'),
        checked: z.boolean().optional(),
        spread: z.boolean().optional(),
        children: z.array(MdastNodeSchema),
        position: NodePositionSchema.optional(),
      }),
      MdastCodeNodeSchemaBase,
      MdastInlineCodeNodeSchemaBase,
      z.object({
        type: z.literal('table'),
        align: z.array(z.enum(['left', 'center', 'right']).nullable()).optional(),
        children: z.array(MdastNodeSchema),
        position: NodePositionSchema.optional(),
      }),
      z.object({
        type: z.literal('tableRow'),
        children: z.array(MdastNodeSchema),
        position: NodePositionSchema.optional(),
      }),
      z.object({
        type: z.literal('tableCell'),
        children: z.array(MdastNodeSchema),
        position: NodePositionSchema.optional(),
      }),
      z.object({
        type: z.literal('root'),
        children: z.array(MdastNodeSchema),
        position: NodePositionSchema.optional(),
      }),
    ])
  );

  return MdastNodeSchema;
};

// Export the main schema
export const MdastNodeSchema = createMdastNodeSchema();

// Export individual schemas for convenience
export const MdastTextNodeSchema = MdastTextNodeSchemaBase;
export const MdastImageNodeSchema = MdastImageNodeSchemaBase;
export const MdastCodeNodeSchema = MdastCodeNodeSchemaBase;
export const MdastInlineCodeNodeSchema = MdastInlineCodeNodeSchemaBase;

// Export types derived from schemas
export type MdastNode = z.infer<typeof MdastNodeSchema>;
export type MdastTextNode = z.infer<typeof MdastTextNodeSchema>;
export type MdastImageNode = z.infer<typeof MdastImageNodeSchema>;
export type MdastCodeNode = z.infer<typeof MdastCodeNodeSchema>;
export type MdastInlineCodeNode = z.infer<typeof MdastInlineCodeNodeSchema>;
