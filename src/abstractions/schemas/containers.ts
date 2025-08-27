import { z } from 'zod'

// Base Element Type Schema
export const ElementTypeSchema = z.enum([
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
  'strong',
  'em',
  'blockquote',
])

// Base Element Interface Schema
export const ElementInterfaceSchema = z.object({
  type: ElementTypeSchema,
  getType: z.function({
    input: [],
    output: ElementTypeSchema
  }),
  getContent: z.function({
    input: [],
    output: z.string()
  }),
  getAttributes: z.function({
    input: [],
    output: z.record(z.string(), z.string())
  }),
  acceptVisitor: z.function({
    input: [z.unknown()], // visitor
    output: z.unknown() // visitor result
  }),
  clone: z.function({
    input: [],
    output: z.unknown() // cloned element
  }),
  equals: z.function({
    input: [z.unknown()], // other element
    output: z.boolean()
  }),
})

// Container Interface Schema
export const ContainerInterfaceSchema = z.object({
  type: z.literal('container'),
  classes: z.array(z.string()).default([]),
  children: z.array(z.unknown()).default([]), // References to other elements
  attributes: z.record(z.string(), z.string()).default({}),
  addChild: z.function({
    input: [z.unknown()], // element
    output: z.boolean() // success
  }),
  removeChild: z.function({
    input: [z.unknown()], // element
    output: z.boolean() // success
  }),
  getChildren: z.function({
    input: [],
    output: z.array(z.unknown()) // copy of children
  }),
  hasClass: z.function({
    input: [z.string()], // className
    output: z.boolean()
  }),
  addClass: z.function({
    input: [z.string()], // className
    output: z.void()
  }),
  getAttributes: z.function({
    input: [],
    output: z.record(z.string(), z.string())
  }),
  render: z.function({
    input: [],
    output: z.string() // HTML string
  }),
})

// Text Element Schema
export const TextElementSchema = z.object({
  type: z.literal('text'),
  value: z.string(),
  bold: z.boolean().default(false),
  italic: z.boolean().default(false),
  render: z.function({
    input: [],
    output: z.string() // HTML string
  }),
  clone: z.function({
    input: [],
    output: z.unknown() // cloned text element
  }),
})

// Heading Element Schema
export const HeadingElementSchema = z.object({
  type: z.literal('heading'),
  depth: z.number().min(1).max(6).default(1),
  children: z.array(z.unknown()).default([]),
  render: z.function({
    input: [],
    output: z.string() // HTML string
  }),
  clone: z.function({
    input: [],
    output: z.unknown() // cloned heading element
  }),
})

// Paragraph Element Schema
export const ParagraphElementSchema = z.object({
  type: z.literal('paragraph'),
  children: z.array(z.unknown()).default([]),
  render: z.function({
    input: [],
    output: z.string() // HTML string
  }),
  clone: z.function({
    input: [],
    output: z.unknown() // cloned paragraph element
  }),
})

// List Element Schema
export const ListElementSchema = z.object({
  type: z.literal('list'),
  ordered: z.boolean().default(false),
  children: z.array(z.unknown()).default([]),
  render: z.function({
    input: [],
    output: z.string() // HTML string
  }),
  clone: z.function({
    input: [],
    output: z.unknown() // cloned list element
  }),
})

// Link Element Schema
export const LinkElementSchema = z.object({
  type: z.literal('link'),
  url: z.string(),
  title: z.string().optional(),
  children: z.array(z.unknown()).default([]),
  render: z.function({
    input: [],
    output: z.string() // HTML string
  }),
  clone: z.function({
    input: [],
    output: z.unknown() // cloned link element
  }),
})

// Image Element Schema
export const ImageElementSchema = z.object({
  type: z.literal('image'),
  url: z.string(),
  alt: z.string().default(''),
  classes: z.array(z.string()).default([]),
  render: z.function({
    input: [],
    output: z.string() // HTML string
  }),
  clone: z.function({
    input: [],
    output: z.unknown() // cloned image element
  }),
})

// Code Element Schema
export const CodeElementSchema = z.object({
  type: z.literal('code'),
  value: z.string(),
  language: z.string().optional(),
  inline: z.boolean().default(false),
  render: z.function({
    input: [],
    output: z.string() // HTML string
  }),
  clone: z.function({
    input: [],
    output: z.unknown() // cloned code element
  }),
})

// Table Element Schema
export const TableElementSchema = z.object({
  type: z.literal('table'),
  children: z.array(z.unknown()).default([]), // Table rows
  render: z.function({
    input: [],
    output: z.string() // HTML string
  }),
  clone: z.function({
    input: [],
    output: z.unknown() // cloned table element
  }),
})

// Element Factory Schema
export const ElementFactorySchema = z.object({
  register: z.function({
    input: [z.string(), z.unknown()], // (type, factoryFunction)
    output: z.void()
  }),
  create: z.function({
    input: [z.string(), z.unknown()], // (type, props)
    output: z.unknown() // created element
  }),
  getSupportedTypes: z.function({
    input: [],
    output: z.array(z.string())
  }),
})

// Element Props Schema
export const ElementPropsSchema = z.record(z.string(), z.unknown())

// Visitor Interface Schema
export const VisitorInterfaceSchema = z.object({
  visitContainer: z.function({
    input: [z.unknown()], // container
    output: z.string() // HTML result
  }),
  visitText: z.function({
    input: [z.unknown()], // text element
    output: z.string() // HTML result
  }),
  visitHeading: z.function({
    input: [z.unknown()], // heading element
    output: z.string() // HTML result
  }),
  visitParagraph: z.function({
    input: [z.unknown()], // paragraph element
    output: z.string() // HTML result
  }),
  visitList: z.function({
    input: [z.unknown()], // list element
    output: z.string() // HTML result
  }),
  visitImage: z.function({
    input: [z.unknown()], // image element
    output: z.string() // HTML result
  }),
  visitCode: z.function({
    input: [z.unknown()], // code element
    output: z.string() // HTML result
  }),
  visitTable: z.function({
    input: [z.unknown()], // table element
    output: z.string() // HTML result
  }),
})

// HTML Visitor Schema
export const HTMLVisitorSchema = VisitorInterfaceSchema.extend({
  escapeHtml: z.function({
    input: [z.string()], // html string
    output: z.string() // escaped html
  }),
  renderChildren: z.function({
    input: [z.array(z.unknown())], // children array
    output: z.string() // rendered HTML
  }),
})

// Nesting Rules Schema
export const NestingRulesSchema = z.record(
  ElementTypeSchema,
  z.array(z.union([ElementTypeSchema, z.literal('*')]))
)

// Nesting Validator Schema
export const NestingValidatorSchema = z.object({
  maxDepth: z.number().positive().default(10),
  rules: NestingRulesSchema,
  validateNesting: z.function({
    input: [ElementTypeSchema, ElementTypeSchema], // (parentType, childType)
    output: z.boolean()
  }),
  validateDepth: z.function({
    input: [z.unknown(), z.number()], // (container, currentDepth)
    output: z.boolean()
  }),
  validateStructure: z.function({
    input: [z.unknown()], // container
    output: z.object({
      isValid: z.boolean(),
      errors: z.array(z.string())
    })
  }),
})

// Container Validation Result Schema
export const ContainerValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  maxDepthExceeded: z.boolean(),
  invalidNesting: z.array(z.object({
    parentType: ElementTypeSchema,
    childType: ElementTypeSchema,
    path: z.string(),
  })),
})

// Container Transformer Schema
export const ContainerTransformerSchema = z.object({
  transformers: z.array(z.unknown()),
  addTransformer: z.function({
    input: [z.unknown()], // transformer function
    output: z.void()
  }),
  transform: z.function({
    input: [z.unknown()], // container
    output: z.unknown() // transformed container
  }),
  flattenSingleChild: z.function({
    input: [z.unknown()], // container
    output: z.unknown() // flattened container
  }),
  mergeText: z.function({
    input: [z.unknown()], // container
    output: z.unknown() // container with merged text
  }),
  applyClasses: z.function({
    input: [z.unknown(), z.unknown()], // (container, classMap)
    output: z.unknown() // container with applied classes
  }),
})

// Container Query Schema
export const ContainerQuerySchema = z.object({
  query: z.function({
    input: [z.unknown(), z.string()], // (root, selector)
    output: z.array(z.unknown()) // matching containers
  }),
  findByClass: z.function({
    input: [z.unknown(), z.string()], // (root, className)
    output: z.array(z.unknown()) // matching containers
  }),
  findByType: z.function({
    input: [z.unknown(), z.string()], // (root, type)
    output: z.array(z.unknown()) // matching elements
  }),
  getStats: z.function({
    input: [z.unknown()], // root
    output: z.object({
      totalContainers: z.number(),
      maxDepth: z.number(),
      classDistribution: z.record(z.string(), z.number()),
      elementCounts: z.record(z.string(), z.number())
    })
  }),
})

// Container Statistics Schema
export const ContainerStatsSchema = z.object({
  totalContainers: z.number().nonnegative(),
  maxDepth: z.number().nonnegative(),
  classDistribution: z.record(z.string(), z.number()),
  elementCounts: z.record(z.string(), z.number()),
})

// Class Mapping Configuration Schema
export const ClassMappingConfigSchema = z.object({
  wrapper: z.string().optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  transformations: z.array(z.string()).optional(),
})

export const ClassMappingSchema = z.record(z.string(), ClassMappingConfigSchema)

// Element Clone Options Schema
export const CloneOptionsSchema = z.object({
  deep: z.boolean().default(true),
  preserveIds: z.boolean().default(false),
  copyAttributes: z.boolean().default(true),
})

// Element Serialization Schema
export const SerializedElementSchema = z.object({
  type: ElementTypeSchema,
  props: z.record(z.string(), z.unknown()),
  children: z.array(z.unknown()).optional(),
})

// Container Serializer Schema
export const ContainerSerializerSchema = z.object({
  serialize: z.function({
    input: [z.unknown()], // element
    output: z.unknown() // serialized element
  }),
  deserialize: z.function({
    input: [z.unknown()], // serialized element
    output: z.unknown() // element
  }),
  toJson: z.function({
    input: [z.unknown()], // element
    output: z.string() // JSON string
  }),
  fromJson: z.function({
    input: [z.string()], // JSON string
    output: z.unknown() // element
  }),
})

// Element Event Schema
export const ElementEventSchema = z.object({
  type: z.enum(['created', 'modified', 'deleted', 'moved']),
  element: z.unknown(),
  timestamp: z.number(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// Element Event Handler Schema  
export const ElementEventHandlerSchema = z.function({
  input: [z.object({
    type: z.enum(['created', 'modified', 'deleted', 'moved']),
    element: z.unknown(),
    timestamp: z.number(),
    metadata: z.record(z.string(), z.unknown()).optional()
  })], // event
  output: z.void()
})

// Element Event Emitter Schema
export const ElementEventEmitterSchema = z.object({
  on: z.function({
    input: [z.string(), z.unknown()], // (eventType, handler)
    output: z.unknown() // unsubscribe function
  }),
  off: z.function({
    input: [z.string(), z.unknown()], // (eventType, handler)
    output: z.void()
  }),
  emit: z.function({
    input: [z.string(), z.unknown()], // (eventType, data)
    output: z.void()
  }),
  once: z.function({
    input: [z.string(), z.unknown()], // (eventType, handler)
    output: z.unknown() // unsubscribe function
  }),
})

// Container Builder Schema
export const ContainerBuilderSchema = z.object({
  createContainer: z.function({
    input: [z.array(z.string()).optional(), z.array(z.unknown()).optional()], // (classes?, children?)
    output: z.unknown() // container
  }),
  addElement: z.function({
    input: [z.unknown()], // element
    output: z.unknown() // builder (for chaining)
  }),
  addClass: z.function({
    input: [z.string()], // className
    output: z.unknown() // builder (for chaining)
  }),
  setAttribute: z.function({
    input: [z.string(), z.string()], // (key, value)
    output: z.unknown() // builder (for chaining)
  }),
  build: z.function({
    input: [],
    output: z.unknown() // built container
  }),
})

// Type Exports
export type ElementType = z.infer<typeof ElementTypeSchema>
export type ElementInterface = z.infer<typeof ElementInterfaceSchema>
export type ContainerInterface = z.infer<typeof ContainerInterfaceSchema>
export type TextElement = z.infer<typeof TextElementSchema>
export type HeadingElement = z.infer<typeof HeadingElementSchema>
export type ParagraphElement = z.infer<typeof ParagraphElementSchema>
export type ListElement = z.infer<typeof ListElementSchema>
export type LinkElement = z.infer<typeof LinkElementSchema>
export type ImageElement = z.infer<typeof ImageElementSchema>
export type CodeElement = z.infer<typeof CodeElementSchema>
export type TableElement = z.infer<typeof TableElementSchema>
export type ElementFactory = z.infer<typeof ElementFactorySchema>
export type ElementProps = z.infer<typeof ElementPropsSchema>
export type VisitorInterface = z.infer<typeof VisitorInterfaceSchema>
export type HTMLVisitor = z.infer<typeof HTMLVisitorSchema>
export type NestingRules = z.infer<typeof NestingRulesSchema>
export type NestingValidator = z.infer<typeof NestingValidatorSchema>
export type ContainerValidationResult = z.infer<typeof ContainerValidationResultSchema>
export type ContainerTransformer = z.infer<typeof ContainerTransformerSchema>
export type ContainerQuery = z.infer<typeof ContainerQuerySchema>
export type ContainerStats = z.infer<typeof ContainerStatsSchema>
export type ClassMappingConfig = z.infer<typeof ClassMappingConfigSchema>
export type ClassMapping = z.infer<typeof ClassMappingSchema>
export type CloneOptions = z.infer<typeof CloneOptionsSchema>
export type SerializedElement = z.infer<typeof SerializedElementSchema>
export type ContainerSerializer = z.infer<typeof ContainerSerializerSchema>
export type ElementEvent = z.infer<typeof ElementEventSchema>
export type ElementEventHandler = z.infer<typeof ElementEventHandlerSchema>
export type ElementEventEmitter = z.infer<typeof ElementEventEmitterSchema>
export type ContainerBuilder = z.infer<typeof ContainerBuilderSchema>