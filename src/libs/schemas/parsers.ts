import type { Root as MdastRoot } from 'mdast';
import z from 'zod';

// Slide delimiter and patterns
export const DelimiterPatternSchema = z.literal('===');

// Container definition
export const ContainerSchema = z.object({
  tag: z.literal('container'),
  classes: z.array(z.string().regex(/^[a-zA-Z0-9_-]+$/)),
  content: z.string(),
});

// Style extraction
export const ExtractedStyleSchema = z.object({
  content: z.string(),
  global: z.boolean(),
  slideIndex: z.number().optional(),
});

// Slide metadata value types
export const SlideMetadataValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
]);

// Parsed slide using actual mdast Root type
export const ParsedSlideSchema = z.object({
  index: z.number().int().min(0).max(98),
  content: z.string(),
  mdast: z
    .custom<MdastRoot>(val => {
      // Runtime validation that matches mdast Root structure
      return val && typeof val === 'object' && 'type' in val && val.type === 'root';
    })
    .optional(),
  containers: z.array(ContainerSchema),
  styles: z.array(ExtractedStyleSchema),
  metadata: z.record(z.string(), SlideMetadataValueSchema).optional(),
});

// Type alias for parsed slide with proper mdast type
export type ParsedSlide = Omit<z.infer<typeof ParsedSlideSchema>, 'mdast'> & {
  mdast?: MdastRoot;
};

// Parser output
export const ParserOutputSchema = z.object({
  globalContent: z.string(),
  globalStyles: z.array(ExtractedStyleSchema),
  slides: z.array(ParsedSlideSchema),
  version: z.literal('0.1'),
});
