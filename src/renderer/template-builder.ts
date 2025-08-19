// Template Builder
// Assembles the complete HTML document structure

import type { z } from 'zod'
import type { RuntimeConfigSchema } from './schemas.js'

/**
 * Task 3: Inject into template
 * Builds the complete HTML document structure
 */
export function buildCompleteHTML(params: {
  slidesHTML: string
  css: string
  runtimeConfig: z.infer<typeof RuntimeConfigSchema>
  runtimeJS: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Curtains presentation with ${params.runtimeConfig.totalSlides} slides">
  <meta name="generator" content="Curtains Presentation Tool">
  <title>Presentation</title>
  <style>
${params.css}
  </style>
</head>
<body>
  <div class="curtains-root" data-theme="${params.runtimeConfig.theme}">
    <div class="curtains-stage">
      ${params.slidesHTML}
    </div>
    <div class="curtains-counter">1/${params.runtimeConfig.totalSlides}</div>
  </div>
  <script>
${params.runtimeJS}
  </script>
</body>
</html>`
}