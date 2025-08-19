# Renderer

Transforms validated AST to final HTML presentation.

## Implementation

```typescript
import { z } from 'zod'
import { rehype } from 'rehype'
import {
  TransformedDocumentSchema,
  BuildOptionsSchema,
  ThemeSchema
} from './data-structures'

// Runtime config schema
const RuntimeConfigSchema = z.object({
  totalSlides: z.number().int().min(1),
  theme: ThemeSchema,
  startSlide: z.number().int().min(0).default(0)
})

// HTML output schema
const HTMLOutputSchema = z.string().min(1).regex(/^<!DOCTYPE html>/i)

export function render(
  transformedDoc: unknown,
  options: unknown
): z.infer<typeof HTMLOutputSchema> {
  // 1. Validate inputs
  const doc = TransformedDocumentSchema.parse(transformedDoc)
  const opts = BuildOptionsSchema.parse(options)
  
  // 2. Merge all styles
  const styles = mergeStyles({
    base: getBaseStyles(),
    theme: getThemeStyles(opts.theme),
    global: doc.globalCSS,
    slides: doc.slides.map(s => s.css)
  })
  
  // 3. Build slide HTML
  const slidesHTML = doc.slides
    .map(slide => `<section class="curtains-slide">${slide.html}</section>`)
    .join('\n    ')
  
  // 4. Generate runtime config
  const runtimeConfig = RuntimeConfigSchema.parse({
    totalSlides: doc.slides.length,
    theme: opts.theme,
    startSlide: 0
  })
  
  // 5. Build complete HTML
  const html = buildHTML({
    styles,
    slidesHTML,
    runtimeConfig,
    runtime: getRuntimeJS()
  })
  
  // 6. Validate and return
  return HTMLOutputSchema.parse(html)
}

export function transform(document: unknown): z.infer<typeof TransformedDocumentSchema> {
  // Validate input document
  const CurtainsDocumentSchema = z.object({
    type: z.literal('curtains-document'),
    version: z.literal('0.1'),
    slides: z.array(z.object({
      type: z.literal('curtains-slide'),
      index: z.number(),
      ast: z.object({
        type: z.literal('root'),
        children: z.array(z.unknown())
      }),
      slideCSS: z.string()
    })).min(1),
    globalCSS: z.string()
  })
  
  const doc = CurtainsDocumentSchema.parse(document)
  
  // Transform each slide
  const slides = doc.slides.map(slide => {
    const html = astToHTML(slide.ast)
    const css = scopeStyles(slide.slideCSS, slide.index)
    
    return {
      html,
      css
    }
  })
  
  return TransformedDocumentSchema.parse({
    slides,
    globalCSS: doc.globalCSS
  })
}

function astToHTML(ast: unknown): string {
  // Validate AST structure
  const ASTSchema = z.object({
    type: z.literal('root'),
    children: z.array(z.unknown())
  })
  
  const validatedAST = ASTSchema.parse(ast)
  
  // Use rehype to convert to HTML
  // Transform containers to divs
  // Add target="_blank" to external links
  return '<div>Transformed HTML</div>'
}

function scopeStyles(css: string, slideIndex: number): string {
  // Don't scope @keyframes, @media, or @import
  const globalPatterns = /^@(keyframes|media|import)/
  
  return css
    .split('\n')
    .map(line => {
      if (globalPatterns.test(line.trim())) {
        return line
      }
      
      // Add slide-specific prefix to selectors
      return line.replace(/^([^{]+){/, (_, selector) => {
        const trimmed = selector.trim()
        if (!trimmed || globalPatterns.test(trimmed)) {
          return `${selector}{`
        }
        return `.curtains-slide:nth-child(${slideIndex + 1}) ${trimmed} {`
      })
    })
    .join('\n')
}

function mergeStyles(styles: {
  base: string
  theme: string
  global: string
  slides: string[]
}): string {
  // Order matters for CSS cascade
  return [
    styles.base,
    styles.theme,
    styles.global,
    ...styles.slides
  ]
    .filter(Boolean)
    .join('\n\n/* --- */\n\n')
}

function getBaseStyles(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    .curtains-root {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      position: relative;
    }
    
    .curtains-stage {
      width: 100%;
      height: 100%;
      display: flex;
      transition: transform 0.4s ease;
    }
    
    .curtains-slide {
      width: 100vw;
      height: 100vh;
      flex-shrink: 0;
      padding: 2rem;
      overflow: auto;
    }
    
    .curtains-counter {
      position: absolute;
      bottom: 1rem;
      right: 1rem;
      font-family: monospace;
    }
  `
}

function getThemeStyles(theme: z.infer<typeof ThemeSchema>): string {
  const themes = {
    light: `
      .curtains-root {
        background: white;
        color: #333;
      }
    `,
    dark: `
      .curtains-root {
        background: #1a1a1a;
        color: #e0e0e0;
      }
    `
  }
  
  return themes[theme]
}

function getRuntimeJS(): string {
  return `
    (function() {
      const nav = {
        current: 0,
        total: document.querySelectorAll('.curtains-slide').length,
        
        go(n) {
          this.current = Math.max(0, Math.min(n, this.total - 1))
          const stage = document.querySelector('.curtains-stage')
          stage.style.transform = \`translateX(-\${this.current * 100}%)\`
          this.updateCounter()
        },
        
        next() { this.go(this.current + 1) },
        prev() { this.go(this.current - 1) },
        
        updateCounter() {
          const counter = document.querySelector('.curtains-counter')
          if (counter) {
            counter.textContent = \`\${this.current + 1}/\${this.total}\`
          }
        }
      }
      
      // Keyboard navigation
      document.addEventListener('keydown', e => {
        switch(e.key) {
          case 'ArrowRight':
          case ' ':
            nav.next()
            break
          case 'ArrowLeft':
            nav.prev()
            break
          case 'f':
          case 'F':
            document.documentElement.requestFullscreen()
            break
        }
      })
      
      // Click navigation
      document.addEventListener('click', e => {
        if (e.target.closest('.curtains-slide')) {
          nav.next()
        }
      })
      
      // Initialize
      nav.go(0)
    })()
  `
}

function buildHTML(params: {
  styles: string
  slidesHTML: string
  runtimeConfig: z.infer<typeof RuntimeConfigSchema>
  runtime: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presentation</title>
  <style>${params.styles}</style>
</head>
<body>
  <div class="curtains-root" data-theme="${params.runtimeConfig.theme}">
    <div class="curtains-stage">
    ${params.slidesHTML}
    </div>
    <div class="curtains-counter">1/${params.runtimeConfig.totalSlides}</div>
  </div>
  <script>${params.runtime}</script>
</body>
</html>`
}
```