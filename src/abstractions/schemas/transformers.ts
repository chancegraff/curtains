import { z } from 'zod'
import { BaseOptionsSchema, AdapterMetadataSchema, ValidationResultSchema } from './common'
import { DocumentASTSchema, ASTNodeTypeSchema } from './parsers'

// Transform Result Schema
export const TransformResultSchema = z.object({
  html: z.string(),
  css: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional()
})

// Transformer Context Schema
export const TransformerContextSchema = z.object({
  input: z.unknown(), // Input AST
  options: z.record(z.string(), z.unknown()).default({}),
  visitors: z.unknown(), // Visitor registry instance
  middleware: z.array(z.unknown()).default([]),
  errors: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
  currentSlide: z.number().nonnegative().optional(),
  currentDepth: z.number().nonnegative().default(0),
  statistics: z.object({
    nodesProcessed: z.number().nonnegative().default(0),
    transformTime: z.number().nonnegative().optional(),
    errors: z.number().nonnegative().default(0),
    warnings: z.number().nonnegative().default(0)
  }).default({
    nodesProcessed: 0,
    errors: 0,
    warnings: 0
  })
})

// Node Visitor Function Schema
export const NodeVisitorSchema = z.function({
  input: [z.unknown(), z.function({
    input: [z.unknown()], // visitNode function
    output: z.string()
  })], // (node, visitNode)
  output: z.string() // HTML result
})

// Visitor Registry Schema
export const VisitorRegistrySchema = z.object({
  visitors: z.map(z.string(), NodeVisitorSchema),
  fallbackVisitor: NodeVisitorSchema.optional(),
  register: z.function({
    input: [z.string(), NodeVisitorSchema], // (nodeType, visitor)
    output: z.void()
  }),
  unregister: z.function({
    input: [z.string()], // nodeType
    output: z.boolean() // success
  }),
  setFallback: z.function({
    input: [NodeVisitorSchema], // visitor
    output: z.void()
  }),
  visit: z.function({
    input: [z.unknown()], // node
    output: z.string() // HTML result
  }),
  hasVisitor: z.function({
    input: [z.string()], // nodeType
    output: z.boolean()
  }),
  getVisitor: z.function({
    input: [z.string()], // nodeType
    output: NodeVisitorSchema.optional()
  }),
  getSupportedTypes: z.function({
    input: [],
    output: z.array(z.string())
  }),
  clear: z.function({
    input: [],
    output: z.void()
  })
})

// Transformer Options Schema
export const TransformerOptionsSchema = BaseOptionsSchema.extend({
  outputFormat: z.string().default('html'),
  escapeHtml: z.boolean().default(true),
  sanitizeOutput: z.boolean().default(true),
  optimizeOutput: z.boolean().default(false),
  preserveWhitespace: z.boolean().default(false),
  allowRawHtml: z.boolean().default(false),
  customVisitors: z.record(z.string(), NodeVisitorSchema).default({}),
  middleware: z.array(z.unknown()).default([]),
  styleScoping: z.object({
    enabled: z.boolean().default(true),
    scopeMethod: z.enum(['nth-child', 'class', 'attribute']).default('nth-child'),
    customScopePrefix: z.string().optional()
  }).default({
    enabled: true,
    scopeMethod: 'nth-child'
  }),
  htmlGeneration: z.object({
    indentation: z.string().default(''),
    addLineBreaks: z.boolean().default(false),
    prettyPrint: z.boolean().default(false),
    includeComments: z.boolean().default(false)
  }).default({
    indentation: '',
    addLineBreaks: false,
    prettyPrint: false,
    includeComments: false
  }),
  cssProcessing: z.object({
    minify: z.boolean().default(false),
    autoprefixer: z.boolean().default(false),
    removeComments: z.boolean().default(false),
    optimizeSelectors: z.boolean().default(false)
  }).default({
    minify: false,
    autoprefixer: false,
    removeComments: false,
    optimizeSelectors: false
  })
})

// HTML Generator Schema
export const HTMLGeneratorSchema = z.object({
  generateElement: z.function({
    input: [z.string(), z.record(z.string(), z.string()), z.string()], // (tag, attributes, content)
    output: z.string() // HTML element
  }),
  generateSelfClosingElement: z.function({
    input: [z.string(), z.record(z.string(), z.string())], // (tag, attributes)
    output: z.string() // self-closing HTML element
  }),
  escapeHtml: z.function({
    input: [z.string()], // text
    output: z.string() // escaped HTML
  }),
  escapeAttribute: z.function({
    input: [z.string()], // value
    output: z.string() // escaped attribute value
  }),
  serializeAttributes: z.function({
    input: [z.record(z.string(), z.string())], // attributes
    output: z.string() // serialized attributes string
  }),
  wrapWithTag: z.function({
    input: [z.string(), z.string(), z.record(z.string(), z.string()).optional()], // (content, tag, attributes?)
    output: z.string() // wrapped HTML
  }),
  joinElements: z.function({
    input: [z.array(z.string()), z.string().optional()], // (elements, separator?)
    output: z.string() // joined HTML
  }),
  isExternal: z.function({
    input: [z.string()], // url
    output: z.boolean() // is external
  }),
  sanitize: z.function({
    input: [z.string()], // html
    output: z.string() // sanitized HTML
  }),
  optimize: z.function({
    input: [z.string()], // html
    output: z.string() // optimized HTML
  })
})

// CSS Processor Schema
export const CSSProcessorSchema = z.object({
  parse: z.function({
    input: [z.string()], // css
    output: z.array(z.object({
      type: z.enum(['rule', 'at-rule', 'comment']),
      selectors: z.array(z.string()).optional(),
      declarations: z.string().optional(),
      rule: z.string().optional(),
      raw: z.string()
    })) // parsed rules
  }),
  serialize: z.function({
    input: [z.array(z.object({
      type: z.enum(['rule', 'at-rule', 'comment']),
      selectors: z.array(z.string()).optional(),
      declarations: z.string().optional(),
      rule: z.string().optional(),
      raw: z.string()
    }))], // rules
    output: z.string() // serialized CSS
  }),
  scopeRule: z.function({
    input: [z.object({
      type: z.enum(['rule', 'at-rule', 'comment']),
      selectors: z.array(z.string()).optional(),
      declarations: z.string().optional(),
      rule: z.string().optional(),
      raw: z.string()
    }), z.string()], // (rule, scope)
    output: z.object({
      type: z.enum(['rule', 'at-rule', 'comment']),
      selectors: z.array(z.string()).optional(),
      declarations: z.string().optional(),
      rule: z.string().optional(),
      raw: z.string()
    }) // scoped rule
  }),
  scopeSelector: z.function({
    input: [z.string(), z.string()], // (selector, scope)
    output: z.string() // scoped selector
  }),
  minify: z.function({
    input: [z.string()], // css
    output: z.string() // minified CSS
  }),
  optimize: z.function({
    input: [z.string()], // css
    output: z.string() // optimized CSS
  }),
  removeComments: z.function({
    input: [z.string()], // css
    output: z.string() // CSS without comments
  }),
  validateCSS: z.function({
    input: [z.string()], // css
    output: ValidationResultSchema
  })
})

// Style Scoping Schema
export const StyleScopingSchema = z.object({
  method: z.enum(['nth-child', 'class', 'attribute']),
  customPrefix: z.string().optional(),
  scopeStyles: z.function({
    input: [z.string(), z.number()], // (css, slideIndex)
    output: z.string() // scoped CSS
  }),
  generateScope: z.function({
    input: [z.number()], // slideIndex
    output: z.string() // scope selector
  }),
  isGlobalRule: z.function({
    input: [z.string()], // rule
    output: z.boolean() // is global
  }),
  shouldSkipScoping: z.function({
    input: [z.string()], // selector
    output: z.boolean() // should skip
  })
})

// Transformer Middleware Schema
export const TransformerMiddlewareSchema = z.object({
  name: z.string(),
  phase: z.enum(['pre', 'post', 'node', 'visitor']),
  priority: z.number().default(0),
  process: z.function({
    input: [z.unknown(), z.unknown()], // (data, context)
    output: z.unknown() // processed data
  }),
  enabled: z.boolean().default(true)
})

// Node Traversal Schema
export const NodeTraversalSchema = z.object({
  traverse: z.function({
    input: [z.unknown(), z.function({
      input: [z.unknown()], // node
      output: z.unknown() // modified node or void
    })], // (node, visitor)
    output: z.unknown() // traversed node
  }),
  walkDepthFirst: z.function({
    input: [z.unknown(), z.function({
      input: [z.unknown(), z.number()], // (node, depth)
      output: z.boolean() // continue traversal
    })], // (node, callback)
    output: z.void()
  }),
  walkBreadthFirst: z.function({
    input: [z.unknown(), z.function({
      input: [z.unknown(), z.number()], // (node, depth)
      output: z.boolean() // continue traversal
    })], // (node, callback)
    output: z.void()
  }),
  findNodes: z.function({
    input: [z.unknown(), z.function({
      input: [z.unknown()], // node
      output: z.boolean() // matches
    })], // (root, predicate)
    output: z.array(z.unknown()) // matching nodes
  }),
  getDepth: z.function({
    input: [z.unknown()], // node
    output: z.number() // depth
  }),
  getNodePath: z.function({
    input: [z.unknown(), z.unknown()], // (root, target)
    output: z.array(z.number()) // path indices
  }),
  cloneNode: z.function({
    input: [z.unknown(), z.boolean().optional()], // (node, deep?)
    output: z.unknown() // cloned node
  })
})

// Transformation Pipeline Schema
export const TransformationPipelineSchema = z.object({
  context: TransformerContextSchema,
  visitors: VisitorRegistrySchema,
  htmlGenerator: HTMLGeneratorSchema,
  cssProcessor: CSSProcessorSchema,
  styleScoping: StyleScopingSchema,
  middleware: z.array(TransformerMiddlewareSchema),
  transform: z.function({
    input: [z.unknown(), z.unknown().optional()], // (ast, options?)
    output: z.object({
      slides: z.array(TransformResultSchema),
      globalCSS: z.string(),
      metadata: z.record(z.string(), z.unknown()).optional(),
      errors: z.array(z.string()),
      warnings: z.array(z.string())
    }) // pipeline result
  }),
  processDocument: z.function({
    input: [z.unknown()], // document AST
    output: z.object({
      slides: z.array(TransformResultSchema),
      globalCSS: z.string(),
      metadata: z.record(z.string(), z.unknown()).optional()
    }) // processed document
  }),
  processSlide: z.function({
    input: [z.unknown()], // slide AST
    output: TransformResultSchema // processed slide
  }),
  processNode: z.function({
    input: [z.unknown()], // AST node
    output: z.string() // HTML result
  }),
  applyMiddleware: z.function({
    input: [z.unknown(), z.enum(['pre', 'post', 'node', 'visitor'])], // (data, phase)
    output: z.unknown() // processed data
  }),
  addMiddleware: z.function({
    input: [TransformerMiddlewareSchema], // middleware
    output: z.void()
  }),
  removeMiddleware: z.function({
    input: [z.string()], // name
    output: z.boolean() // success
  }),
  validateInput: z.function({
    input: [z.unknown()], // input
    output: ValidationResultSchema
  }),
  validateOutput: z.function({
    input: [z.unknown()], // output
    output: ValidationResultSchema
  })
})

// Base Transformer Interface Schema
export const BaseTransformerSchema = z.object({
  transform: z.function({
    input: [z.unknown(), TransformerOptionsSchema.optional()], // (ast, options?)
    output: z.object({
      slides: z.array(TransformResultSchema),
      globalCSS: z.string(),
      metadata: z.record(z.string(), z.unknown()).optional(),
      errors: z.array(z.string()),
      warnings: z.array(z.string())
    }) // transform result
  }),
  configure: z.function({
    input: [TransformerOptionsSchema], // options
    output: z.void()
  }),
  registerVisitor: z.function({
    input: [z.string(), NodeVisitorSchema], // (nodeType, visitor)
    output: z.void()
  }),
  unregisterVisitor: z.function({
    input: [z.string()], // nodeType
    output: z.boolean() // success
  }),
  addMiddleware: z.function({
    input: [TransformerMiddlewareSchema], // middleware
    output: z.void()
  }),
  removeMiddleware: z.function({
    input: [z.string()], // name
    output: z.boolean() // success
  }),
  getCapabilities: z.function({
    input: [],
    output: z.object({
      outputFormats: z.array(z.string()),
      supportsContainers: z.boolean(),
      supportsStyles: z.boolean(),
      supportsMiddleware: z.boolean(),
      supportsCustomVisitors: z.boolean(),
      supportedNodeTypes: z.array(z.string())
    })
  }),
  validate: z.function({
    input: [z.unknown()], // input
    output: ValidationResultSchema
  }),
  reset: z.function({
    input: [],
    output: z.void()
  }),
  getMetadata: z.function({
    input: [],
    output: AdapterMetadataSchema
  }),
  getStatistics: z.function({
    input: [],
    output: z.object({
      transformsPerformed: z.number().nonnegative(),
      totalProcessingTime: z.number().nonnegative(),
      averageProcessingTime: z.number().nonnegative().optional(),
      errorsEncountered: z.number().nonnegative(),
      warningsGenerated: z.number().nonnegative(),
      nodesProcessed: z.number().nonnegative(),
      customVisitors: z.number().nonnegative(),
      middlewareCount: z.number().nonnegative()
    })
  })
})

// HTML Transformer Schema
export const HTMLTransformerSchema = BaseTransformerSchema.extend({
  htmlGenerator: HTMLGeneratorSchema,
  registerHTMLVisitors: z.function({
    input: [],
    output: z.void()
  }),
  visitNode: z.function({
    input: [z.unknown()], // node
    output: z.string() // HTML
  }),
  visitChildren: z.function({
    input: [z.array(z.unknown())], // children
    output: z.string() // HTML
  }),
  escapeHtml: z.function({
    input: [z.string()], // text
    output: z.string() // escaped HTML
  }),
  sanitizeOutput: z.function({
    input: [z.string()], // html
    output: z.string() // sanitized HTML
  }),
  optimizeOutput: z.function({
    input: [z.string()], // html
    output: z.string() // optimized HTML
  })
})

// Transformer Capabilities Schema
export const TransformerCapabilitiesSchema = z.object({
  outputFormats: z.array(z.string()),
  supportsContainers: z.boolean(),
  supportsStyles: z.boolean(),
  supportsMiddleware: z.boolean(),
  supportsCustomVisitors: z.boolean(),
  supportedNodeTypes: z.array(z.string()),
  maxNestingDepth: z.number().optional(),
  supportedFeatures: z.array(z.string()).optional(),
  version: z.string().optional()
})

// Transformer Utilities Schema
export const TransformerUtilitiesSchema = z.object({
  escapeHtml: z.function({
    input: [z.string()], // text
    output: z.string() // escaped HTML
  }),
  isExternal: z.function({
    input: [z.string()], // url
    output: z.boolean() // is external
  }),
  sanitizeHtml: z.function({
    input: [z.string()], // html
    output: z.string() // sanitized HTML
  }),
  optimizeCSS: z.function({
    input: [z.string()], // css
    output: z.string() // optimized CSS
  }),
  normalizeWhitespace: z.function({
    input: [z.string()], // text
    output: z.string() // normalized text
  }),
  generateId: z.function({
    input: [z.string().optional()], // prefix?
    output: z.string() // unique id
  }),
  validateHtml: z.function({
    input: [z.string()], // html
    output: ValidationResultSchema
  }),
  parseAttributes: z.function({
    input: [z.string()], // attribute string
    output: z.record(z.string(), z.string()) // parsed attributes
  }),
  mergeAttributes: z.function({
    input: [z.record(z.string(), z.string()), z.record(z.string(), z.string())], // (attrs1, attrs2)
    output: z.record(z.string(), z.string()) // merged attributes
  })
})

// Transformer Plugin Schema
export const TransformerPluginSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  visitors: z.record(z.string(), NodeVisitorSchema).optional(),
  middleware: z.array(TransformerMiddlewareSchema).optional(),
  utilities: z.record(z.string(), z.function()).optional(),
  initialize: z.function({
    input: [z.unknown()], // transformer instance
    output: z.void()
  }),
  cleanup: z.function({
    input: [],
    output: z.void()
  }).optional(),
  dependencies: z.array(z.string()).default([]),
  enabled: z.boolean().default(true)
})

// Transformer Error Schema
export const TransformerErrorSchema = z.object({
  type: z.enum(['validation', 'transformation', 'visitor', 'middleware', 'unknown']),
  message: z.string(),
  phase: z.enum(['pre', 'transform', 'post', 'finalize']).optional(),
  nodeType: ASTNodeTypeSchema.optional(),
  context: z.record(z.string(), z.unknown()).optional(),
  stack: z.string().optional(),
  recoverable: z.boolean().default(true),
  suggestion: z.string().optional()
})

// Transformer Statistics Schema
export const TransformerStatisticsSchema = z.object({
  transformsPerformed: z.number().nonnegative(),
  totalProcessingTime: z.number().nonnegative(),
  averageProcessingTime: z.number().nonnegative().optional(),
  errorsEncountered: z.number().nonnegative(),
  warningsGenerated: z.number().nonnegative(),
  nodesProcessed: z.number().nonnegative(),
  slideCount: z.number().nonnegative(),
  customVisitors: z.number().nonnegative(),
  middlewareCount: z.number().nonnegative(),
  memoryUsage: z.object({
    initial: z.number().optional(),
    peak: z.number().optional(),
    final: z.number().optional()
  }).optional(),
  performanceBreakdown: z.object({
    parsing: z.number().optional(),
    transformation: z.number().optional(),
    styling: z.number().optional(),
    serialization: z.number().optional()
  }).optional()
})

// Transformer Adapter Schema
export const TransformerAdapterSchema = z.object({
  transform: z.function({
    input: [DocumentASTSchema, TransformerOptionsSchema.optional()], // (ast, options?)
    output: z.object({
      slides: z.array(TransformResultSchema),
      globalCSS: z.string(),
      metadata: z.record(z.string(), z.unknown()).optional(),
      errors: z.array(z.string()),
      warnings: z.array(z.string())
    }) // transform result
  }),
  configure: z.function({
    input: [TransformerOptionsSchema], // options
    output: z.void()
  }),
  getCapabilities: z.function({
    input: [],
    output: TransformerCapabilitiesSchema
  }),
  validate: z.function({
    input: [z.unknown()], // input
    output: ValidationResultSchema
  }),
  metadata: AdapterMetadataSchema
})

// Type Exports
export type TransformResult = z.infer<typeof TransformResultSchema>
export type TransformerContext = z.infer<typeof TransformerContextSchema>
export type NodeVisitor = z.infer<typeof NodeVisitorSchema>
export type VisitorRegistry = z.infer<typeof VisitorRegistrySchema>
export type TransformerOptions = z.infer<typeof TransformerOptionsSchema>
export type HTMLGenerator = z.infer<typeof HTMLGeneratorSchema>
export type CSSProcessor = z.infer<typeof CSSProcessorSchema>
export type StyleScoping = z.infer<typeof StyleScopingSchema>
export type TransformerMiddleware = z.infer<typeof TransformerMiddlewareSchema>
export type NodeTraversal = z.infer<typeof NodeTraversalSchema>
export type TransformationPipeline = z.infer<typeof TransformationPipelineSchema>
export type BaseTransformer = z.infer<typeof BaseTransformerSchema>
export type HTMLTransformer = z.infer<typeof HTMLTransformerSchema>
export type TransformerCapabilities = z.infer<typeof TransformerCapabilitiesSchema>
export type TransformerUtilities = z.infer<typeof TransformerUtilitiesSchema>
export type TransformerPlugin = z.infer<typeof TransformerPluginSchema>
export type TransformerError = z.infer<typeof TransformerErrorSchema>
export type TransformerStatistics = z.infer<typeof TransformerStatisticsSchema>
export type TransformerAdapter = z.infer<typeof TransformerAdapterSchema>
