import z from 'zod';

// Transformed slide
export const TransformedSlideSchema = z.object({
  html: z.string(),
  css: z.string(),
});

// Transformed document
export const TransformedDocumentSchema = z.object({
  slides: z.array(TransformedSlideSchema),
  globalCSS: z.string(),
});
