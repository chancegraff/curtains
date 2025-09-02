import z from 'zod';

import { NodePositionSchema } from './mdast';

// Integration with unified ecosystem:
// - Transform mdast -> hast using remark-rehype
// - Stringify hast -> HTML using rehype-stringify
// - These schemas validate the AST structures from rehype

// Note: We define our own interfaces instead of using @types/hast
// because z.lazy() requires the exact TypeScript type for recursion

// Hast node types
export const HastNodeTypeSchema = z.enum(['root', 'element', 'text', 'comment', 'doctype']);

// TypeScript interfaces for recursive types
// These match the structure of hast nodes from rehype
interface BaseHastNode {
  type: z.infer<typeof HastNodeTypeSchema>;
  position?: z.infer<typeof NodePositionSchema> | undefined;
}

interface HastTextNode extends BaseHastNode {
  type: 'text';
  value: string;
}

interface HastElementNode extends BaseHastNode {
  type: 'element';
  tagName: string;
  properties?: Record<string, string | number | boolean | (string | number)[]> | undefined;
  children?: HastNode[] | undefined;
}

interface HastRootNode extends BaseHastNode {
  type: 'root';
  children: HastNode[];
}

interface HastCommentNode extends BaseHastNode {
  type: 'comment';
  value: string;
}

interface HastDoctypeNode extends BaseHastNode {
  type: 'doctype';
  name?: string | undefined;
  public?: string | undefined;
  system?: string | undefined;
}

// Union type for all Hast nodes
type HastNode = HastTextNode | HastElementNode | HastRootNode | HastCommentNode | HastDoctypeNode;

// Base hast node schema
export const BaseHastNodeSchema = z.object({
  type: HastNodeTypeSchema,
  position: NodePositionSchema.optional(),
});

// Hast text node schema
export const HastTextNodeSchema: z.ZodType<HastTextNode> = z.object({
  type: z.literal('text'),
  value: z.string(),
  position: NodePositionSchema.optional(),
});

// Hast element properties schema
export const HastPropertiesSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number()]))])
);

// Hast element node schema with proper recursion
export const HastElementNodeSchema: z.ZodType<HastElementNode> = z.lazy(() =>
  z.object({
    type: z.literal('element'),
    tagName: z.string(),
    properties: HastPropertiesSchema.optional(),
    children: z.array(HastNodeSchema).optional(),
    position: NodePositionSchema.optional(),
  })
);

// Hast root node schema with proper recursion
export const HastRootNodeSchema: z.ZodType<HastRootNode> = z.lazy(() =>
  z.object({
    type: z.literal('root'),
    children: z.array(HastNodeSchema),
    position: NodePositionSchema.optional(),
  })
);

// Hast comment node schema
export const HastCommentNodeSchema: z.ZodType<HastCommentNode> = z.object({
  type: z.literal('comment'),
  value: z.string(),
  position: NodePositionSchema.optional(),
});

// Hast doctype node schema
export const HastDoctypeNodeSchema: z.ZodType<HastDoctypeNode> = z.object({
  type: z.literal('doctype'),
  name: z.string().optional(),
  public: z.string().optional(),
  system: z.string().optional(),
  position: NodePositionSchema.optional(),
});

// Define the union schema with proper recursion
export const HastNodeSchema: z.ZodType<HastNode> = z.lazy(() =>
  z.union([
    HastTextNodeSchema,
    HastElementNodeSchema,
    HastRootNodeSchema,
    HastCommentNodeSchema,
    HastDoctypeNodeSchema,
  ])
);

// Export types
export type HastNodeType = z.infer<typeof HastNodeTypeSchema>;
export type {
  HastCommentNode,
  HastDoctypeNode,
  HastElementNode,
  HastNode,
  HastRootNode,
  HastTextNode,
};
