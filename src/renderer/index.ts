// Renderer Implementation
// Phase 4: Converts TransformedDocument to complete HTML presentation

import { TransformedDocumentSchema } from '../ast/schemas.js'
import { BuildOptionsSchema } from '../config/schemas.js'
import { buildSlidesHTML } from './html-generator.js'
import { mergeCSS } from './css-merger.js'
import { getRuntimeJS } from './runtime.js'
import { buildCompleteHTML } from './template-builder.js'
import { RuntimeConfigSchema, HTMLOutputSchema } from './schemas.js'

/**
 * Renders a TransformedDocument to complete HTML presentation
 * Implements Phase 4: HTML structure, CSS merging, template injection, runtime embedding
 */
export async function render(
  transformedDoc: unknown,
  options: unknown
): Promise<string> {
  // 1. Validate inputs with Zod
  const doc = TransformedDocumentSchema.parse(transformedDoc)
  const opts = BuildOptionsSchema.parse(options)
  
  // 2. Build HTML slide structure
  const slidesHTML = buildSlidesHTML(doc)
  
  // 3. Merge CSS in correct order
  const mergedCSS = await mergeCSS({
    globalCSS: doc.globalCSS,
    slidesCSS: doc.slides.map(slide => slide.css),
    theme: opts.theme
  })
  
  // 4. Generate runtime configuration
  const runtimeConfig = RuntimeConfigSchema.parse({
    totalSlides: doc.slides.length,
    theme: opts.theme,
    startSlide: 0
  })
  
  // 5. Get runtime JavaScript
  const runtimeJS = getRuntimeJS()
  
  // 6. Inject into template and return complete HTML
  const html = buildCompleteHTML({
    slidesHTML,
    css: mergedCSS,
    runtimeConfig,
    runtimeJS
  })
  
  // 7. Validate and return final HTML
  return HTMLOutputSchema.parse(html)
}