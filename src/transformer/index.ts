import { CurtainsDocumentSchema, TransformedDocumentSchema } from '../ast/schemas';
import type { TransformedDocument } from '../ast/types';
import { astToHTML } from './ast-to-html';
import { scopeStyles } from './style-scoping';

/**
 * Transforms a validated CurtainsDocument to a TransformedDocument ready for rendering
 * @param document - Validated CurtainsDocument from parser
 * @returns TransformedDocument with HTML content and scoped CSS
 */
export function transform(document: unknown): TransformedDocument {
  // Validate input document
  const doc = CurtainsDocumentSchema.parse(document);

  // Transform each slide
  const slides = doc.slides.map(slide => {
    // Convert AST to HTML with rehype
    const html = astToHTML(slide.ast);

    // Scope slide-specific styles with nth-child selectors
    const css = scopeStyles(slide.slideCSS, slide.index);

    return {
      html,
      css,
    };
  });

  // Validate and return transformed document
  return TransformedDocumentSchema.parse({
    slides,
    globalCSS: doc.globalCSS,
  });
}

// Re-export utilities for testing
export { astToHTML } from './ast-to-html';
export { scopeStyles } from './style-scoping';
