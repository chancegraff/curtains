import type { Root as MdastRoot } from 'mdast';
import z from 'zod';

import { CurtainsDocumentSchema } from './ast';
import { ExtractedStyleSchema, ParsedSlide, ParsedSlideSchema } from './parsers';
import { TransformedDocumentSchema } from './transformers';

// === Input File → Parse Stage ===
export const FileToParseSchema = z.object({
  path: z.string(),
  content: z.string(),
  encoding: z.literal('utf-8'),
});

// === Parse Stage → AST Stage ===
export const ParseToASTSchema = z.object({
  globalContent: z.string(),
  globalMdast: z
    .custom<MdastRoot>(val => {
      return val && typeof val === 'object' && 'type' in val && val.type === 'root';
    })
    .optional(),
  globalStyles: z.array(ExtractedStyleSchema),
  slides: z.array(ParsedSlideSchema),
});

// Type alias with proper mdast type
export type ParseToAST = Omit<z.infer<typeof ParseToASTSchema>, 'globalMdast' | 'slides'> & {
  globalMdast?: MdastRoot;
  slides: ParsedSlide[];
};

// === AST Stage → Transform Stage ===
export const ASTToTransformSchema = CurtainsDocumentSchema;

// === Transform Stage → Render Stage ===
export const TransformToRenderSchema = TransformedDocumentSchema;

// === Render Stage → Write Stage ===
export const RenderToWriteSchema = z.object({
  html: z.string(),
  outputPath: z.string(),
});
