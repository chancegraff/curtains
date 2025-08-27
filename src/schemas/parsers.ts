import { z } from 'zod'
import { BaseOptionsSchema, AdapterMetadataSchema, ValidationResultSchema } from './common'

// AST Node Type Schema
export const ASTNodeTypeSchema = z.enum([
  'root',
  'document',
  'slide',
  'container',
  'text',
  'heading',
  'paragraph',
  'list',
  'listItem',
  'link',
  'image',
  'code',
  'table',
  'tableRow',
  'tableCell',
  'blockquote',
  'thematicBreak',
  'strong',
  'emphasis'
])

// Define the base AST node type first
export type BaseASTNode = {
  type: z.infer<typeof ASTNodeTypeSchema>
  children?: BaseASTNode[] | undefined
  value?: string | undefined
  url?: string | undefined
  alt?: string | undefined
  title?: string | undefined
  lang?: string | undefined
  depth?: number | undefined
  ordered?: boolean | undefined
  classes?: string[] | undefined
  attributes?: Record<string, string> | undefined
  bold?: boolean | undefined
  italic?: boolean | undefined
  header?: boolean | undefined
  align?: 'left' | 'center' | 'right' | undefined
  index?: number | undefined
  slideCSS?: string | undefined
}

// Base AST Node Schema
export const ASTNodeSchema: z.ZodType<BaseASTNode> = z.lazy(() => z.object({
  type: ASTNodeTypeSchema,
  children: z.array(ASTNodeSchema).optional(),
  value: z.string().optional(),
  url: z.string().optional(),
  alt: z.string().optional(),
  title: z.string().optional(),
  lang: z.string().optional(),
  depth: z.number().min(1).max(6).optional(),
  ordered: z.boolean().optional(),
  classes: z.array(z.string()).optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  header: z.boolean().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  index: z.number().nonnegative().optional(),
  slideCSS: z.string().optional()
}))

// Document AST Schema
export const DocumentASTSchema = z.object({
  type: z.literal('document'),
  children: z.array(ASTNodeSchema),
  metadata: z.object({
    title: z.string().optional(),
    author: z.string().optional(),
    description: z.string().optional(),
    version: z.string().default('1.0.0'),
    created: z.string().optional(),
    modified: z.string().optional()
  }).optional(),
  globalStyles: z.string().optional()
})

// Slide AST Schema
export const SlideASTSchema = z.object({
  type: z.literal('slide'),
  index: z.number().nonnegative(),
  children: z.array(ASTNodeSchema),
  slideCSS: z.string().default(''),
  metadata: z.object({
    classes: z.array(z.string()).default([]),
    duration: z.number().optional(),
    transition: z.string().optional()
  }).optional()
})

// Container Metadata Schema
export const ContainerMetadataSchema = z.object({
  classes: z.array(z.string()).default([]),
  attributes: z.record(z.string(), z.string()).default({}),
  depth: z.number().nonnegative(),
  id: z.string().optional(),
  nestingPath: z.array(z.number()).default([])
})

// Style Extraction Result Schema
export const StyleExtractionSchema = z.object({
  content: z.string(),
  styles: z.array(z.object({
    css: z.string(),
    scope: z.enum(['global', 'slide']),
    source: z.string().optional(),
    line: z.number().optional()
  })),
  hasStyles: z.boolean()
})

// Parser Context Schema
export const ParserContextSchema = z.object({
  source: z.string(),
  position: z.number().nonnegative().default(0),
  line: z.number().positive().default(1),
  column: z.number().nonnegative().default(0),
  errors: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
  options: z.record(z.string(), z.unknown()).default({})
})

// Parser Options Schema
export const ParserOptionsSchema = BaseOptionsSchema.extend({
  preserveWhitespace: z.boolean().default(false),
  allowHTML: z.boolean().default(true),
  allowContainers: z.boolean().default(true),
  allowStyles: z.boolean().default(true),
  maxNestingDepth: z.number().positive().default(10),
  maxInputSize: z.number().positive().default(10485760), // 10MB
  validateContainers: z.boolean().default(true),
  extractStyles: z.boolean().default(true),
  splitSlides: z.boolean().default(true),
  slideDelimiter: z.string().default('==='),
  customElements: z.record(z.string(), z.unknown()).default({}),
  plugins: z.array(z.string()).default([])
})

// Parse Result Schema
export const ParseResultSchema = z.object({
  ast: DocumentASTSchema,
  slides: z.array(SlideASTSchema),
  globalStyles: z.string().default(''),
  metadata: z.record(z.string(), z.unknown()).default({}),
  errors: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  statistics: z.object({
    totalSlides: z.number().nonnegative(),
    totalContainers: z.number().nonnegative(),
    maxNestingDepth: z.number().nonnegative(),
    parseTime: z.number().nonnegative().optional(),
    inputSize: z.number().nonnegative()
  })
})

// Parser Plugin Interface Schema
export const ParserPluginInterfaceSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  initialize: z.function({
    input: [z.unknown()], // parser instance
    output: z.void()
  }),
  preProcess: z.function({
    input: [z.string(), z.unknown()], // (input, context)
    output: z.string() // processed input
  }).optional(),
  postProcess: z.function({
    input: [z.unknown(), z.unknown()], // (ast, context)
    output: z.unknown() // processed AST
  }).optional(),
  parseNode: z.function({
    input: [z.unknown(), z.unknown()], // (node, context)
    output: z.unknown() // parsed node
  }).optional(),
  validateNode: z.function({
    input: [z.unknown()], // node
    output: ValidationResultSchema
  }).optional(),
  cleanup: z.function({
    input: [],
    output: z.void()
  }).optional()
})

// Parser Plugin Manager Schema
export const ParserPluginManagerSchema = z.object({
  plugins: z.array(ParserPluginInterfaceSchema),
  register: z.function({
    input: [z.unknown()], // plugin
    output: z.boolean() // success
  }),
  unregister: z.function({
    input: [z.string()], // plugin name
    output: z.boolean() // success
  }),
  getPlugin: z.function({
    input: [z.string()], // plugin name
    output: z.unknown() // plugin or null
  }),
  applyPreProcessors: z.function({
    input: [z.string(), z.unknown()], // (input, context)
    output: z.string() // processed input
  }),
  applyPostProcessors: z.function({
    input: [z.unknown(), z.unknown()], // (ast, context)
    output: z.unknown() // processed AST
  }),
  validateAll: z.function({
    input: [z.unknown()], // ast
    output: ValidationResultSchema
  })
})

// Base Parser Interface Schema
export const BaseParserInterfaceSchema = z.object({
  parse: z.function({
    input: [z.string(), z.unknown().optional()], // (input, options?)
    output: z.unknown() // ParseResult
  }),
  supports: z.function({
    input: [z.string()], // format
    output: z.boolean()
  }),
  validate: z.function({
    input: [z.string()], // input
    output: ValidationResultSchema
  }),
  getCapabilities: z.function({
    input: [],
    output: z.object({
      supportedFormats: z.array(z.string()),
      supportsMetadata: z.boolean(),
      supportsFrontmatter: z.boolean(),
      supportsContainers: z.boolean(),
      supportsStyles: z.boolean(),
      maxInputSize: z.number().optional(),
      pluginsEnabled: z.boolean()
    })
  }),
  configure: z.function({
    input: [z.unknown()], // options
    output: z.void()
  }),
  reset: z.function({
    input: [],
    output: z.void()
  })
})

// Curtains Parser Interface Schema
export const CurtainsParserInterfaceSchema = BaseParserInterfaceSchema.extend({
  parseSlides: z.function({
    input: [z.string(), z.unknown().optional()], // (input, options?)
    output: z.array(z.unknown()) // array of slide ASTs
  }),
  extractGlobalStyles: z.function({
    input: [z.string()], // input
    output: z.string() // global CSS
  }),
  extractSlideStyles: z.function({
    input: [z.string()], // slide content
    output: z.string() // slide CSS
  }),
  parseContainers: z.function({
    input: [z.string()], // content
    output: z.array(z.unknown()) // container ASTs
  }),
  splitContent: z.function({
    input: [z.string()], // input
    output: z.object({
      globalContent: z.string(),
      slideContents: z.array(z.string())
    })
  }),
  validateNesting: z.function({
    input: [z.unknown()], // container AST
    output: ValidationResultSchema
  }),
  getStatistics: z.function({
    input: [z.unknown()], // parse result
    output: z.object({
      totalSlides: z.number(),
      totalContainers: z.number(),
      maxNestingDepth: z.number(),
      styleBlocks: z.number(),
      imageCount: z.number(),
      linkCount: z.number()
    })
  })
})

// Markdown Parser Interface Schema
export const MarkdownParserInterfaceSchema = BaseParserInterfaceSchema.extend({
  parseInline: z.function({
    input: [z.string()], // inline content
    output: z.array(z.unknown()) // inline AST nodes
  }),
  parseBlock: z.function({
    input: [z.string()], // block content
    output: z.array(z.unknown()) // block AST nodes
  }),
  convertMdast: z.function({
    input: [z.unknown()], // mdast node
    output: z.unknown() // converted AST node
  }),
  supportedExtensions: z.function({
    input: [],
    output: z.array(z.string()) // extension names
  })
})

// Parser Validator Schema
export const ParserValidatorSchema = z.object({
  validateInput: z.function({
    input: [z.string()], // input
    output: ValidationResultSchema
  }),
  validateAST: z.function({
    input: [z.unknown()], // AST
    output: ValidationResultSchema
  }),
  validateContainer: z.function({
    input: [z.unknown()], // container node
    output: ValidationResultSchema
  }),
  validateNesting: z.function({
    input: [z.unknown(), z.number()], // (node, depth)
    output: ValidationResultSchema
  }),
  validateClassName: z.function({
    input: [z.string()], // class name
    output: z.boolean()
  }),
  validateSlideIndex: z.function({
    input: [z.number()], // index
    output: z.boolean()
  }),
  validateStyleBlock: z.function({
    input: [z.string()], // CSS content
    output: ValidationResultSchema
  })
})

// AST Builder Schema
export const ASTBuilderSchema = z.object({
  createDocumentNode: z.function({
    input: [z.array(z.unknown()), z.unknown().optional()], // (children, metadata?)
    output: z.unknown() // document AST
  }),
  createSlideNode: z.function({
    input: [z.array(z.unknown()), z.number(), z.string().optional()], // (children, index, css?)
    output: z.unknown() // slide AST
  }),
  createContainerNode: z.function({
    input: [z.array(z.string()), z.array(z.unknown())], // (classes, children)
    output: z.unknown() // container AST
  }),
  createTextNode: z.function({
    input: [z.string(), z.object({
      bold: z.boolean().optional(),
      italic: z.boolean().optional()
    }).optional()], // (value, formatting?)
    output: z.unknown() // text AST
  }),
  createHeadingNode: z.function({
    input: [z.number().min(1).max(6), z.array(z.unknown())], // (level, children)
    output: z.unknown() // heading AST
  }),
  createParagraphNode: z.function({
    input: [z.array(z.unknown())], // children
    output: z.unknown() // paragraph AST
  }),
  createListNode: z.function({
    input: [z.boolean(), z.array(z.unknown())], // (ordered, children)
    output: z.unknown() // list AST
  }),
  createListItemNode: z.function({
    input: [z.array(z.unknown())], // children
    output: z.unknown() // list item AST
  }),
  createLinkNode: z.function({
    input: [z.string(), z.array(z.unknown()), z.string().optional()], // (url, children, title?)
    output: z.unknown() // link AST
  }),
  createImageNode: z.function({
    input: [z.string(), z.string().optional(), z.string().optional(), z.array(z.string()).optional()], // (url, alt?, title?, classes?)
    output: z.unknown() // image AST
  }),
  createCodeNode: z.function({
    input: [z.string(), z.string().optional()], // (value, language?)
    output: z.unknown() // code AST
  }),
  createTableNode: z.function({
    input: [z.array(z.unknown())], // rows
    output: z.unknown() // table AST
  }),
  createTableRowNode: z.function({
    input: [z.array(z.unknown())], // cells
    output: z.unknown() // table row AST
  }),
  createTableCellNode: z.function({
    input: [z.array(z.unknown()), z.boolean().optional(), z.enum(['left', 'center', 'right']).optional()], // (children, header?, align?)
    output: z.unknown() // table cell AST
  }),
  validateNode: z.function({
    input: [z.unknown()], // node
    output: ValidationResultSchema
  }),
  cloneNode: z.function({
    input: [z.unknown(), z.boolean().optional()], // (node, deep?)
    output: z.unknown() // cloned node
  })
})

// Parser Error Schema
export const ParserErrorSchema = z.object({
  type: z.enum(['syntax', 'validation', 'nesting', 'size', 'timeout', 'plugin']),
  message: z.string(),
  line: z.number().optional(),
  column: z.number().optional(),
  position: z.number().optional(),
  length: z.number().optional(),
  context: z.string().optional(),
  suggestion: z.string().optional(),
  severity: z.enum(['error', 'warning', 'info']).default('error')
})

// Parser Statistics Schema
export const ParserStatisticsSchema = z.object({
  inputSize: z.number().nonnegative(),
  outputSize: z.number().nonnegative(),
  parseTime: z.number().nonnegative(),
  totalSlides: z.number().nonnegative(),
  totalContainers: z.number().nonnegative(),
  maxNestingDepth: z.number().nonnegative(),
  styleBlocks: z.number().nonnegative(),
  imageCount: z.number().nonnegative(),
  linkCount: z.number().nonnegative(),
  tableCount: z.number().nonnegative(),
  codeBlocks: z.number().nonnegative(),
  wordCount: z.number().nonnegative(),
  characterCount: z.number().nonnegative(),
  lineCount: z.number().nonnegative()
})

// Parser Performance Schema
export const ParserPerformanceSchema = z.object({
  startTime: z.number(),
  endTime: z.number(),
  totalTime: z.number(),
  phases: z.object({
    preprocessing: z.number().optional(),
    lexing: z.number().optional(),
    parsing: z.number().optional(),
    validation: z.number().optional(),
    postprocessing: z.number().optional()
  }),
  memoryUsage: z.object({
    initial: z.number().optional(),
    peak: z.number().optional(),
    final: z.number().optional()
  }).optional()
})

// Parser Adapter Schema
export const ParserAdapterSchema = z.object({
  parse: z.function({
    input: [z.string(), z.unknown().optional()], // (input, options?)
    output: z.unknown() // parse result
  }),
  supports: z.function({
    input: [z.string()], // format
    output: z.boolean()
  }),
  validate: z.function({
    input: [z.string()], // input
    output: ValidationResultSchema
  }),
  getCapabilities: z.function({
    input: [],
    output: z.unknown() // capabilities object
  }),
  metadata: AdapterMetadataSchema
})

// Content Splitter Schema
export const ContentSplitterSchema = z.object({
  split: z.function({
    input: [z.string(), z.string().optional()], // (content, delimiter?)
    output: z.array(z.string()) // parts
  }),
  splitSlides: z.function({
    input: [z.string()], // content
    output: z.object({
      globalContent: z.string(),
      slideContents: z.array(z.string())
    })
  }),
  joinSlides: z.function({
    input: [z.string(), z.array(z.string()), z.string().optional()], // (global, slides, delimiter?)
    output: z.string() // combined content
  })
})

// Style Extractor Schema
export const StyleExtractorSchema = z.object({
  extract: z.function({
    input: [z.string(), z.enum(['global', 'slide']).optional()], // (content, scope?)
    output: StyleExtractionSchema
  }),
  extractGlobal: z.function({
    input: [z.string()], // content
    output: z.string() // global CSS
  }),
  extractSlide: z.function({
    input: [z.string()], // content
    output: z.string() // slide CSS
  }),
  removeStyles: z.function({
    input: [z.string()], // content
    output: z.string() // content without styles
  }),
  validateCSS: z.function({
    input: [z.string()], // CSS
    output: ValidationResultSchema
  })
})

// Container Parser Schema
export const ContainerParserSchema = z.object({
  parse: z.function({
    input: [z.string()], // content
    output: z.array(z.unknown()) // container ASTs
  }),
  parseNested: z.function({
    input: [z.string(), z.number().optional()], // (content, maxDepth?)
    output: z.array(z.unknown()) // nested container ASTs
  }),
  validateStructure: z.function({
    input: [z.string()], // content
    output: ValidationResultSchema
  }),
  extractClasses: z.function({
    input: [z.string()], // container tag
    output: z.array(z.string()) // class names
  }),
  normalizeContent: z.function({
    input: [z.string()], // content
    output: z.string() // normalized content
  })
})

// Markdown Processor Schema
export const MarkdownProcessorSchema = z.object({
  process: z.function({
    input: [z.string(), z.unknown().optional()], // (content, options?)
    output: z.unknown() // processed AST
  }),
  processInline: z.function({
    input: [z.string()], // inline content
    output: z.array(z.unknown()) // inline nodes
  }),
  processBlock: z.function({
    input: [z.string()], // block content
    output: z.array(z.unknown()) // block nodes
  }),
  sanitize: z.function({
    input: [z.string()], // content
    output: z.string() // sanitized content
  }),
  convertMdast: z.function({
    input: [z.unknown()], // mdast node
    output: z.unknown() // converted AST node
  })
})

// Parser Capabilities Schema
export const ParserCapabilitiesSchema = z.object({
  supportedFormats: z.array(z.string()),
  supportsMetadata: z.boolean().default(false),
  supportsFrontmatter: z.boolean().default(false),
  maxInputSize: z.number().optional(),
})

// Type Exports
export type ASTNodeType = z.infer<typeof ASTNodeTypeSchema>
export type ASTNode = BaseASTNode
export type DocumentAST = z.infer<typeof DocumentASTSchema>
export type SlideAST = z.infer<typeof SlideASTSchema>
export type ContainerMetadata = z.infer<typeof ContainerMetadataSchema>
export type StyleExtraction = z.infer<typeof StyleExtractionSchema>
export type ParserContext = z.infer<typeof ParserContextSchema>
export type ParserOptions = z.infer<typeof ParserOptionsSchema>
export type ParseResult = z.infer<typeof ParseResultSchema>
export type ParserPluginInterface = z.infer<typeof ParserPluginInterfaceSchema>
export type ParserPluginManager = z.infer<typeof ParserPluginManagerSchema>
export type BaseParserInterface = z.infer<typeof BaseParserInterfaceSchema>
export type CurtainsParserInterface = z.infer<typeof CurtainsParserInterfaceSchema>
export type MarkdownParserInterface = z.infer<typeof MarkdownParserInterfaceSchema>
export type ParserValidator = z.infer<typeof ParserValidatorSchema>
export type ASTBuilder = z.infer<typeof ASTBuilderSchema>
export type ParserError = z.infer<typeof ParserErrorSchema>
export type ParserStatistics = z.infer<typeof ParserStatisticsSchema>
export type ParserPerformance = z.infer<typeof ParserPerformanceSchema>
export type ParserAdapter = z.infer<typeof ParserAdapterSchema>
export type ParserCapabilities = z.infer<typeof ParserCapabilitiesSchema>
export type ContentSplitter = z.infer<typeof ContentSplitterSchema>
export type StyleExtractor = z.infer<typeof StyleExtractorSchema>
export type ContainerParser = z.infer<typeof ContainerParserSchema>
export type MarkdownProcessor = z.infer<typeof MarkdownProcessorSchema>
