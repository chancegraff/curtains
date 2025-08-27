import { z } from 'zod'
import { BaseOptionsSchema, AdapterMetadataSchema } from './common'

// HTML Builder Schemas
export const HTMLAttributesSchema = z.record(z.string(), z.string())

export const HTMLBuilderSchema = z.object({
  append: z.function({
    input: [z.string()], // content
    output: z.unknown() // builder (for chaining)
  }),
  prepend: z.function({
    input: [z.string()], // content
    output: z.unknown() // builder (for chaining)
  }),
  wrap: z.function({
    input: [z.string(), z.record(z.string(), z.string()).optional()], // (tag, attributes?)
    output: z.unknown() // builder (for chaining)
  }),
  build: z.function({
    input: [],
    output: z.string() // HTML string
  }),
})

// CSS Merger Schemas
export const CSSSourcesSchema = z.object({
  global: z.string().optional(),
  theme: z.string().optional(),
  slides: z.array(z.string()),
})

export const CSSMergerSchema = z.object({
  merge: z.function({
    input: [z.unknown()], // CSS sources
    output: z.string() // merged CSS
  }),
  scope: z.function({
    input: [z.string(), z.number()], // (css, slideIndex)
    output: z.string() // scoped CSS
  }),
  optimize: z.function({
    input: [z.string()], // css
    output: z.string() // optimized CSS
  }),
})

// Template Builder Schemas
export const TemplateDataSchema = z.object({
  title: z.string(),
  css: z.string(),
  content: z.string(),
  runtime: z.string(),
  config: z.string(),
})

export const TemplateBuilderSchema = z.object({
  build: z.function({
    input: [z.unknown()], // template data
    output: z.string() // complete HTML
  }),
  injectStyles: z.function({
    input: [z.string()], // css
    output: z.string() // styled HTML
  }),
  injectScripts: z.function({
    input: [z.string()], // js
    output: z.string() // scripted HTML
  }),
  injectContent: z.function({
    input: [z.string()], // html
    output: z.string() // wrapped HTML
  }),
})

// Runtime Generator Schemas
export const RuntimeFeatureSchema = z.object({
  name: z.string(),
  code: z.string(),
  dependencies: z.array(z.string()).default([]),
})

export const RuntimeConfigSchema = z.object({
  totalSlides: z.number().positive(),
  theme: z.string().default('default'),
  startSlide: z.number().nonnegative().default(0),
  features: z.array(z.string()).default(['navigation', 'keyboard', 'touch']),
})

export const RuntimeGeneratorSchema = z.object({
  generate: z.function({
    input: [z.unknown()], // config
    output: z.string() // runtime JavaScript
  }),
  addFeature: z.function({
    input: [z.string(), z.string()], // (name, code)
    output: z.void()
  }),
  removeFeature: z.function({
    input: [z.string()], // name
    output: z.void()
  }),
})

// Slide Generator Schemas
export const SlideDataSchema = z.object({
  html: z.string(),
  css: z.string(),
  index: z.number().nonnegative(),
  classes: z.array(z.string()).default([]),
})

export const SlideGeneratorSchema = z.object({
  generateSlide: z.function({
    input: [z.unknown(), z.number()], // (slideData, index)
    output: z.string() // slide HTML
  }),
  generateContainer: z.function({
    input: [z.array(z.unknown())], // slides
    output: z.string() // container HTML
  }),
})

// Transformed Document Schema
export const TransformedSlideSchema = z.object({
  html: z.string(),
  css: z.string(),
})

export const TransformedDocumentSchema = z.object({
  slides: z.array(TransformedSlideSchema),
  globalCSS: z.string(),
})

// Renderer Capabilities Schema
export const RendererCapabilitiesSchema = z.object({
  supportsThemes: z.boolean().default(true),
  supportsPlugins: z.boolean().default(false),
  outputFormats: z.array(z.string()).default(['html']),
  features: z.array(z.string()).default(['navigation', 'fullscreen', 'touch']),
  themes: z.array(z.string()).optional(),
})

// Render Options Schema
export const RenderOptionsSchema = BaseOptionsSchema.extend({
  title: z.string().default('Presentation'),
  theme: z.string().default('default'),
  startSlide: z.number().nonnegative().default(0),
  features: z.array(z.string()).default(['navigation', 'keyboard', 'touch']),
  minify: z.boolean().default(false),
})

// Renderer Interface Schema
export const RendererInterfaceSchema = z.object({
  render: z.function({
    input: [z.unknown(), z.unknown().optional()], // (document, options?)
    output: z.string() // HTML string
  }),
  validateInput: z.function({
    input: [z.unknown()], // document
    output: z.boolean() // is valid
  }),
  getCapabilities: z.function({
    input: [],
    output: z.unknown() // capabilities object
  }),
})

// Renderer Adapter Schema
export const RendererAdapterSchema = RendererInterfaceSchema.extend({
  metadata: AdapterMetadataSchema,
})

// Render Pipeline Schema
export const RenderPipelineSchema = z.object({
  htmlBuilder: HTMLBuilderSchema,
  cssMerger: CSSMergerSchema,
  templateBuilder: TemplateBuilderSchema,
  runtimeGenerator: RuntimeGeneratorSchema,
  slideGenerator: SlideGeneratorSchema,
  render: z.function({
    input: [z.unknown(), z.unknown().optional()], // (transformedDoc, options?)
    output: z.string() // complete HTML
  }),
})

// Rendering Error Schemas
export const RenderingErrorSchema = z.object({
  type: z.enum(['validation', 'template', 'runtime', 'unknown']),
  phase: z.literal('rendering'),
  context: z.record(z.string(), z.unknown()),
  originalError: z.unknown(),
  suggestion: z.string(),
})

export const TemplateErrorSchema = z.object({
  message: z.string(),
  placeholder: z.string(),
  templateSection: z.string(),
})

// HTML Validation Schema
export const HTMLValidationSchema = z.object({
  isValidHtml: z.boolean(),
  hasRequiredElements: z.boolean(),
  missingElements: z.array(z.string()),
  validationErrors: z.array(z.string()),
})

// Type Exports
export type HTMLAttributes = z.infer<typeof HTMLAttributesSchema>
export type HTMLBuilder = z.infer<typeof HTMLBuilderSchema>
export type CSSSources = z.infer<typeof CSSSourcesSchema>
export type CSSMerger = z.infer<typeof CSSMergerSchema>
export type TemplateData = z.infer<typeof TemplateDataSchema>
export type TemplateBuilder = z.infer<typeof TemplateBuilderSchema>
export type RuntimeFeature = z.infer<typeof RuntimeFeatureSchema>
export type RuntimeConfig = z.infer<typeof RuntimeConfigSchema>
export type RuntimeGenerator = z.infer<typeof RuntimeGeneratorSchema>
export type SlideData = z.infer<typeof SlideDataSchema>
export type SlideGenerator = z.infer<typeof SlideGeneratorSchema>
export type TransformedSlide = z.infer<typeof TransformedSlideSchema>
export type TransformedDocument = z.infer<typeof TransformedDocumentSchema>
export type RendererCapabilities = z.infer<typeof RendererCapabilitiesSchema>
export type RenderOptions = z.infer<typeof RenderOptionsSchema>
export type RendererInterface = z.infer<typeof RendererInterfaceSchema>
export type RendererAdapter = z.infer<typeof RendererAdapterSchema>
export type RenderPipeline = z.infer<typeof RenderPipelineSchema>
export type RenderingError = z.infer<typeof RenderingErrorSchema>
export type TemplateError = z.infer<typeof TemplateErrorSchema>
export type HTMLValidation = z.infer<typeof HTMLValidationSchema>
