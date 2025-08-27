import { z } from 'zod'
import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import {
  HTMLBuilderSchema,
  CSSMergerSchema,
  TemplateBuilderSchema,
  RuntimeGeneratorSchema,
  SlideGeneratorSchema,
  RenderPipelineSchema,
  TransformedDocumentSchema,
  RenderOptionsSchema,
  TemplateDataSchema,
  RuntimeConfigSchema,
  CSSSources,
  CSSSourcesSchema,
  SlideDataSchema,
  HTMLAttributesSchema,
  RenderingErrorSchema,
  HTMLValidationSchema,
} from '../schemas/rendering'

// Get current file's directory for resolving relative paths
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Function to load base CSS from templates
const loadBaseCSS = (): string => {
  const cssPath = join(__dirname, './style.css')
  return readFileSync(cssPath, 'utf-8')
}

// Infer types from Zod schemas - no type casting allowed
type TransformedDocument = z.infer<typeof TransformedDocumentSchema>
type RenderOptions = z.infer<typeof RenderOptionsSchema>
type TemplateData = z.infer<typeof TemplateDataSchema>
type RuntimeConfig = z.infer<typeof RuntimeConfigSchema>
type SlideData = z.infer<typeof SlideDataSchema>
type HTMLAttributes = z.infer<typeof HTMLAttributesSchema>
type RenderingError = z.infer<typeof RenderingErrorSchema>
type HTMLValidation = z.infer<typeof HTMLValidationSchema>

// Additional implementation types
type HTMLBuilderImpl = {
  append: (content: string) => HTMLBuilderImpl
  prepend: (content: string) => HTMLBuilderImpl
  wrap: (tag: string, attributes?: Record<string, string>) => HTMLBuilderImpl
  build: () => string
}

type CSSMergerImpl = {
  merge: (sources: unknown) => string
  scope: (css: string, slideIndex: number) => string
  optimize: (css: string) => string
}

type TemplateBuilderImpl = {
  build: (data: unknown) => string
  injectStyles: (css: string) => string
  injectScripts: (js: string) => string
  injectContent: (html: string) => string
}

type RuntimeGeneratorImpl = {
  generate: (config: unknown) => string
  addFeature: (name: string, code: string) => void
  removeFeature: (name: string) => void
}

type SlideGeneratorImpl = {
  generateSlide: (slideData: unknown, index: number) => string
  generateContainer: (slides: unknown[]) => string
}

type RenderPipelineImpl = {
  htmlBuilder: HTMLBuilderImpl
  cssMerger: CSSMergerImpl
  templateBuilder: TemplateBuilderImpl
  runtimeGenerator: RuntimeGeneratorImpl
  slideGenerator: SlideGeneratorImpl
  render: (transformedDoc: unknown, options?: unknown) => string
}

// Validation helpers using Zod parse
const validateTransformedDocument = (document: unknown): TransformedDocument => {
  return TransformedDocumentSchema.parse(document)
}

const validateRenderOptions = (options: unknown): RenderOptions => {
  return RenderOptionsSchema.parse(options ?? {})
}

const validateRuntimeConfig = (config: unknown): RuntimeConfig => {
  return RuntimeConfigSchema.parse(config)
}

const validateTemplateData = (data: unknown): TemplateData => {
  return TemplateDataSchema.parse(data)
}

const validateCSSources = (sources: unknown): CSSSources => {
  return CSSSourcesSchema.parse(sources)
}

const validateSlideData = (slide: unknown): SlideData => {
  return SlideDataSchema.parse(slide)
}

const validateHTMLAttributes = (attrs: unknown): HTMLAttributes => {
  return HTMLAttributesSchema.parse(attrs ?? {})
}

// Error creation helper
const createRenderingError = (
  type: 'validation' | 'template' | 'runtime' | 'unknown',
  context: Record<string, unknown>,
  originalError: unknown,
  suggestion: string
): RenderingError => {
  const errorData = {
    type,
    phase: 'rendering' as const,
    context,
    originalError,
    suggestion,
  }
  return RenderingErrorSchema.parse(errorData)
}

// HTML Builder Implementation
export const createHTMLBuilder = (): HTMLBuilderImpl => {
  const chunks: string[] = []

  const append = (content: string): HTMLBuilderImpl => {
    chunks.push(content)
    return builder
  }

  const prepend = (content: string): HTMLBuilderImpl => {
    chunks.unshift(content)
    return builder
  }

  const wrap = (tag: string, attributes?: Record<string, string>): HTMLBuilderImpl => {
    const validatedAttrs = validateHTMLAttributes(attributes)

    const attrString = Object.entries(validatedAttrs)
      .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
      .join(' ')

    const openingTag = attrString ? `<${tag} ${attrString}>` : `<${tag}>`
    const closingTag = `</${tag}>`

    chunks.unshift(openingTag)
    chunks.push(closingTag)

    return builder
  }

  const build = (): string => {
    return chunks.join('')
  }

  const builder = {
    append,
    prepend,
    wrap,
    build,
  }

  // Validate the implementation against schema
  HTMLBuilderSchema.parse(builder)

  return builder
}

// CSS Merger Implementation
export const createCSSMerger = (): CSSMergerImpl => {
  const merge = (sources: unknown): string => {
    const validatedSources = validateCSSources(sources)
    let merged = ''

    // Order matters: global, theme, slide-specific
    if (validatedSources.global !== null && validatedSources.global !== undefined) {
      merged += validatedSources.global + '\n'
    }

    if (validatedSources.theme !== null && validatedSources.theme !== undefined) {
      merged += validatedSources.theme + '\n'
    }

    for (const slideCSS of validatedSources.slides) {
      if (slideCSS?.trim()) {
        merged += slideCSS + '\n'
      }
    }

    return merged.trim()
  }

  const scope = (css: string, slideIndex: number): string => {
    if (!css?.trim()) {
      return css
    }

    // Simple scoping: add slide-specific class to each CSS rule
    const scopePrefix = `.curtains-slide-${slideIndex}`

    // Basic CSS parsing and scoping - split by rules
    const rules = css.split('}').filter(rule => rule.trim())
    const scopedRules = rules.map(rule => {
      if (!rule.trim()) return rule

      const [selector, ...bodyParts] = rule.split('{')
      if (bodyParts.length === 0) return rule

      const body = bodyParts.join('{')
      const trimmedSelector = selector?.trim()

      // Add scope to selector
      const scopedSelector = trimmedSelector
        ?.split(',')
        .map(sel => `${scopePrefix} ${sel.trim()}`)
        .join(', ')

      return `${scopedSelector} { ${body}`
    })

    return scopedRules.join(' } ') + (scopedRules.length > 0 ? ' }' : '')
  }

  const optimize = (css: string): string => {
    if (!css?.trim()) {
      return css
    }

    // Basic optimization: remove extra whitespace and empty lines
    return css
      .replace(/\s+/g, ' ')
      .replace(/;\s*}/g, '}')
      .replace(/{\s+/g, '{')
      .replace(/;\s+/g, ';')
      .trim()
  }

  const merger = {
    merge,
    scope,
    optimize,
  }

  // Validate the implementation against schema
  CSSMergerSchema.parse(merger)

  return merger
}

// Template Builder Implementation
export const createTemplateBuilder = (): TemplateBuilderImpl => {
  const templateCache = new Map<string, string>()

  const getBaseTemplate = (): string => {
    if (templateCache.has('base')) {
      return templateCache.get('base') ?? ''
    }

    const template = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>
  <style>{{CSS}}</style>
</head>
<body>
  {{CONTENT}}
  <script>{{RUNTIME}}</script>
  <script>
    // Initialize with config
    if (typeof window !== 'undefined' && window.initializeCurtains) {
      window.initializeCurtains({{CONFIG}});
    }
  </script>
</body>
</html>`

    templateCache.set('base', template)
    return template
  }

  const replacePlaceholder = (template: string, placeholder: string, value: string): string => {
    return template.replace(new RegExp(placeholder, 'g'), value)
  }

  const build = (data: unknown): string => {
    const validatedData = validateTemplateData(data)
    let template = getBaseTemplate()

    // Replace placeholders functionally
    template = replacePlaceholder(template, '{{TITLE}}', escapeHtml(validatedData.title))
    template = replacePlaceholder(template, '{{CSS}}', validatedData.css)
    template = replacePlaceholder(template, '{{CONTENT}}', validatedData.content)
    template = replacePlaceholder(template, '{{RUNTIME}}', validatedData.runtime)
    template = replacePlaceholder(template, '{{CONFIG}}', validatedData.config)

    return template
  }

  const injectStyles = (css: string): string => {
    return `<style>${css}</style>`
  }

  const injectScripts = (js: string): string => {
    return `<script>${js}</script>`
  }

  const injectContent = (html: string): string => {
    return `<div class="curtains-presentation">${html}</div>`
  }

  const builder = {
    build,
    injectStyles,
    injectScripts,
    injectContent,
  }

  // Validate the implementation against schema
  TemplateBuilderSchema.parse(builder)

  return builder
}

// Runtime Generator Implementation
export const createRuntimeGenerator = (): RuntimeGeneratorImpl => {
  const features = new Map<string, string>()

  // Initialize with core features
  const initializeCoreFeatures = (): void => {
    features.set('navigation', `
      // Navigation functionality
      let currentSlide = 0;
      let totalSlides = 0;

      function navigateToSlide(index) {
        if (index >= 0 && index < totalSlides && index !== currentSlide) {
          const stage = document.querySelector('.curtains-stage');
          if (stage) {
            stage.style.transform = 'translateX(-' + (index * 100) + '%)';
            currentSlide = index;
            updateSlideCounter();
          }
        }
      }

      function navigateNext() {
        const next = (currentSlide + 1) % totalSlides;
        navigateToSlide(next);
      }

      function navigatePrevious() {
        const prev = currentSlide === 0 ? totalSlides - 1 : currentSlide - 1;
        navigateToSlide(prev);
      }
    `)

    features.set('keyboard', `
      // Keyboard navigation
      document.addEventListener('keydown', function(event) {
        switch(event.key) {
          case 'ArrowRight':
          case ' ':
            event.preventDefault();
            navigateNext();
            break;
          case 'ArrowLeft':
            event.preventDefault();
            navigatePrevious();
            break;
          case 'Home':
            event.preventDefault();
            navigateToSlide(0);
            break;
          case 'End':
            event.preventDefault();
            navigateToSlide(totalSlides - 1);
            break;
          case 'f':
          case 'F':
            event.preventDefault();
            toggleFullscreen();
            break;
        }
      });
    `)

    features.set('touch', `
      // Touch navigation
      let touchStartX = null;
      let touchStartY = null;

      document.addEventListener('touchstart', function(event) {
        const touch = event.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      });

      document.addEventListener('touchend', function(event) {
        if (touchStartX === null || touchStartY === null) return;

        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
          if (deltaX > 0) {
            navigatePrevious();
          } else {
            navigateNext();
          }
        }

        touchStartX = null;
        touchStartY = null;
      });
    `)

    features.set('fullscreen', `
      // Fullscreen functionality
      function toggleFullscreen() {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }
    `)

    features.set('scaling', `
      // Auto-scaling functionality
      function updateScale() {
        const slides = document.querySelectorAll('.curtains-slide');
        const container = document.querySelector('.curtains-stage');
        if (slides.length === 0 || !container) return;

        const slide = slides[0];
        const containerRect = container.getBoundingClientRect();
        const scaleX = containerRect.width / slide.offsetWidth;
        const scaleY = containerRect.height / slide.offsetHeight;
        const scale = Math.min(scaleX, scaleY);

        slides.forEach(slideEl => {
          slideEl.style.transform = 'scale(' + scale + ')';
        });
      }

      window.addEventListener('resize', updateScale);
      document.addEventListener('DOMContentLoaded', updateScale);
    `)
  }

  // Initialize core features
  initializeCoreFeatures()

  const generate = (config: unknown): string => {
    const validatedConfig = validateRuntimeConfig(config)
    const runtimeParts: string[] = []

    // Add IIFE wrapper start
    runtimeParts.push('(function() {')

    // Add config
    runtimeParts.push(`const config = ${JSON.stringify(validatedConfig)};`)
    runtimeParts.push('totalSlides = config.totalSlides;')
    runtimeParts.push('currentSlide = config.startSlide;')

    // Add enabled features
    for (const featureName of validatedConfig.features) {
      if (features.has(featureName)) {
        runtimeParts.push(features.get(featureName) ?? '')
      }
    }

    // Add utility functions
    runtimeParts.push(`
      function updateSlideCounter() {
        const counter = document.querySelector('.curtains-counter');
        if (counter) {
          counter.textContent = (currentSlide + 1) + '/' + totalSlides;
        }
      }

      // Initialize presentation
      window.initializeCurtains = function(runtimeConfig) {
        if (runtimeConfig) {
          totalSlides = runtimeConfig.totalSlides || totalSlides;
          currentSlide = runtimeConfig.startSlide || 0;
        }

        // Navigate to start slide
        navigateToSlide(currentSlide);

        // Update counter
        updateSlideCounter();

        // Add slide counter if it doesn't exist
        if (!document.querySelector('.curtains-counter')) {
          const counter = document.createElement('div');
          counter.className = 'curtains-counter';
          counter.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 1000; padding: 8px 12px; background: rgba(0,0,0,0.8); color: white; border-radius: 4px; font-family: monospace;';
          document.body.appendChild(counter);
          updateSlideCounter();
        }
      };
    `)

    // Add IIFE wrapper end
    runtimeParts.push('})();')

    return runtimeParts.join('\n')
  }

  const addFeature = (name: string, code: string): void => {
    features.set(name, code)
  }

  const removeFeature = (name: string): void => {
    features.delete(name)
  }

  const generator = {
    generate,
    addFeature,
    removeFeature,
  }

  // Validate the implementation against schema
  RuntimeGeneratorSchema.parse(generator)

  return generator
}

// Type guard to check if a value is a record with string keys
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Helper function to safely extract string property from unknown object
const safeGetStringProperty = (
  obj: unknown,
  property: string,
  defaultValue: string = ''
): string => {
  if (isRecord(obj) && property in obj) {
    const value = obj[property]
    return typeof value === 'string' ? value : defaultValue
  }
  return defaultValue
}

// Helper function to safely extract any property from unknown object
const safeGetProperty = (
  obj: unknown,
  property: string
): unknown => {
  if (isRecord(obj) && property in obj) {
    return obj[property]
  }
  return undefined
}

// Type guard for checking if value is a string array
const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

// Slide Generator Implementation
export const createSlideGenerator = (): SlideGeneratorImpl => {
  const generateSlide = (slideData: unknown, index: number): string => {
    // Safely extract properties with proper type guards
    const htmlProperty = safeGetStringProperty(slideData, 'html', '')
    const cssProperty = safeGetStringProperty(slideData, 'css', '')
    const classesProperty = safeGetProperty(slideData, 'classes')

    const validatedSlide = validateSlideData({
      html: htmlProperty,
      css: cssProperty,
      index,
      classes: isStringArray(classesProperty) ? classesProperty : [],
    })

    const htmlBuilder = createHTMLBuilder()

    // Add slide content
    htmlBuilder.append(validatedSlide.html)

    // Add classes
    const classes = ['curtains-slide', `curtains-slide-${index}`, ...validatedSlide.classes]

    // Wrap in slide container
    htmlBuilder.wrap('div', {
      class: classes.join(' '),
      'data-slide': index.toString(),
      id: `slide-${index}`,
    })

    return htmlBuilder.build()
  }

  const generateContainer = (slides: unknown[]): string => {
    if (!Array.isArray(slides)) {
      throw new Error('Slides must be an array')
    }

    let containerHTML = ''

    for (let i = 0; i < slides.length; i++) {
      containerHTML += generateSlide(slides[i], i)
    }

    return wrapInStage(containerHTML)
  }

  const wrapInStage = (content: string): string => {
    const htmlBuilder = createHTMLBuilder()
    htmlBuilder.append(content)
    htmlBuilder.wrap('div', { class: 'curtains-stage' })
    return htmlBuilder.build()
  }

  const generator = {
    generateSlide,
    generateContainer,
  }

  // Validate the implementation against schema
  SlideGeneratorSchema.parse(generator)

  return generator
}

// HTML Validation Helper
const validateHTML = (html: string): HTMLValidation => {
  const missingElements: string[] = []
  const validationErrors: string[] = []

  const validation = {
    isValidHtml: true,
    hasRequiredElements: true,
    missingElements,
    validationErrors,
  }

  // Basic HTML validation checks
  if (!html?.trim()) {
    validation.isValidHtml = false
    validation.validationErrors.push('HTML is empty')
    return HTMLValidationSchema.parse(validation)
  }

  // Check for required elements
  const requiredElements = ['html', 'head', 'body', 'title']

  for (const element of requiredElements) {
    const regex = new RegExp(`<${element}[^>]*>`, 'i')
    if (!regex.test(html)) {
      missingElements.push(element)
    }
  }

  if (missingElements.length > 0) {
    validation.hasRequiredElements = false
    validation.missingElements = missingElements
  }

  return HTMLValidationSchema.parse(validation)
}

// Escape HTML helper
const escapeHtml = (text: string): string => {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }

  return text.replace(/[&<>"']/g, (char) => escapeMap[char] ?? char)
}

// Main Render Pipeline Implementation
export const createRenderPipeline = (): RenderPipelineImpl => {
  const htmlBuilder = createHTMLBuilder()
  const cssMerger = createCSSMerger()
  const templateBuilder = createTemplateBuilder()
  const runtimeGenerator = createRuntimeGenerator()
  const slideGenerator = createSlideGenerator()

  const render = (transformedDoc: unknown, options?: unknown): string => {
    try {
      const validatedDoc = validateTransformedDocument(transformedDoc)
      const validatedOptions = validateRenderOptions(options)

      // Step 1: Generate slide HTML
      const slidesHTML = slideGenerator.generateContainer(validatedDoc.slides)

      // Step 2: Merge and optimize CSS
      const mergedCSS = cssMerger.merge({
        global: validatedDoc.globalCSS,
        theme: loadBaseCSS(), // Load base theme CSS with essential presentation styles
        slides: validatedDoc.slides.map(slide => slide.css),
      })

      const optimizedCSS = cssMerger.optimize(mergedCSS)

      // Step 3: Generate runtime JavaScript
      const runtimeConfig = validateRuntimeConfig({
        totalSlides: validatedDoc.slides.length,
        theme: validatedOptions.theme,
        startSlide: validatedOptions.startSlide,
        features: validatedOptions.features,
      })

      const runtimeJS = runtimeGenerator.generate(runtimeConfig)

      // Step 4: Build complete HTML
      const finalHTML = templateBuilder.build({
        title: validatedOptions.title,
        css: optimizedCSS,
        content: slidesHTML,
        runtime: runtimeJS,
        config: JSON.stringify(runtimeConfig),
      })

      // Step 5: Validate output
      const htmlValidation = validateHTML(finalHTML)
      if (!htmlValidation.isValidHtml) {
        throw createRenderingError(
          'validation',
          { validation: htmlValidation },
          new Error('Invalid HTML output'),
          'Check HTML template and content generation'
        )
      }

      return finalHTML

    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        throw createRenderingError(
          'validation',
          { zodError: error },
          error,
          'Check input document structure and options'
        )
      }

      throw createRenderingError(
        'unknown',
        { error },
        error,
        'Check logs for details'
      )
    }
  }

  const pipeline = {
    htmlBuilder,
    cssMerger,
    templateBuilder,
    runtimeGenerator,
    slideGenerator,
    render,
  }

  // Validate the complete pipeline against schema
  RenderPipelineSchema.parse(pipeline)

  return pipeline
}

// Export the main pipeline creation function and individual components are already exported above
