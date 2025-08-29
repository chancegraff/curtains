import { CurtainsDocumentSchema } from '../ast/schemas.js';
import type { CurtainsDocument } from '../ast/types.js';
import { processSlides, splitIntoSlides } from './slides.js';
import { extractGlobalStyles } from './styles.js';
import { validateInput, validateSlideCount } from './validate.js';

/**
 * Parses curtains presentation input into a structured document
 * @param input - Raw presentation input content
 * @returns Validated CurtainsDocument structure
 * @throws Error if input is invalid or parsing fails
 */
export function parse(input: unknown): CurtainsDocument {
  // 1. Validate input
  const source = validateInput(input);

  // 2. Split on delimiters
  const { globalContent, slideContents } = splitIntoSlides(source);

  // 3. Validate slide count
  validateSlideCount(slideContents.length);

  // 4. Extract global styles
  const globalCSS = extractGlobalStyles(globalContent);

  // 5. Process slides
  const slides = processSlides(slideContents);

  // 6. Validate and return document
  return CurtainsDocumentSchema.parse({
    type: 'curtains-document',
    version: '0.1',
    slides,
    globalCSS,
  });
}

// Re-export key functions for modular usage if needed
export { buildAST, parseContainers } from './containers.js';
export { parseMarkdown } from './markdown.js';
export { processSlide, processSlides, splitIntoSlides } from './slides.js';
export { extractGlobalStyles, extractSlideStyles, extractStyles } from './styles.js';
export { validateInput } from './validate.js';

// Export types for consumers
export type { ContainerParseResult } from './containers.js';
export type { SlideParseInput } from './slides.js';
export type { ExtractedStyle } from './styles.js';
