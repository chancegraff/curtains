// HTML Generator
// Builds HTML slide structure from transformed documents

import type { TransformedDocument } from '../ast/types.js'

/**
 * Task 1: Build HTML slide structure
 * Converts transformed slides into proper section elements
 */
export function buildSlidesHTML(doc: TransformedDocument): string {
  return doc.slides
    .map(slide => `<section class="curtains-slide">${slide.html}</section>`)
    .join('\n      ')
}