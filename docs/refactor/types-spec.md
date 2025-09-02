# Types Specification

Component: Consolidated schemas, interfaces, and types for all refactor specifications

## Imports

```typescript
import { z } from 'zod'

// Unified ecosystem type imports
import type { 
  Root as MdastRoot, 
  Node as MdastNode,
  Text,
  Heading,
  Paragraph,
  Emphasis,
  Strong,
  Link,
  Image,
  List,
  ListItem,
  Code,
  InlineCode,
  Table,
  TableRow,
  TableCell,
  ThematicBreak,
  Blockquote,
  Html,
  Definition,
  LinkReference,
  ImageReference
} from 'mdast'

import type { 
  Root as HastRoot, 
  Node as HastNode, 
  Element,
  Text as HastText,
  Comment,
  DocType
} from 'hast'

import type { Processor, Plugin } from 'unified'
import type { VFile } from 'vfile'

// Unified utilities type imports
import type { Visitor, Test } from 'unist-util-visit'
import type { Node } from 'unist'
```

## CLI Types

### Command and Options

```typescript
// Input validation
export const CLIArgsSchema = z.array(z.string())

// Command types
export const CommandSchema = z.enum(['build'])

// Theme options
export const ThemeSchema = z.enum(['light', 'dark'])

// Build options
export const BuildOptionsSchema = z.object({
  command: CommandSchema,
  input: z.string().refine(val => val.endsWith('.curtain')),
  output: z.string().refine(val => val.endsWith('.html')),
  theme: ThemeSchema.default('light')
})

// Runtime configuration
export const RuntimeConfigSchema = z.object({
  input: z.string(),
  output: z.string(),
  theme: ThemeSchema,
  timestamp: z.number(),
  processId: z.string().uuid()
})

// Error codes
export const ErrorCodeSchema = z.enum([
  'INVALID_ARGS',
  'FILE_ACCESS',
  'PARSE_ERROR',
  'NO_SLIDES',
  'OUTPUT_ERROR'
])

// Error structure
export const CLIErrorSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string(),
  exitCode: z.number().int().min(1).max(5)
})

// Operation queue
export const OperationSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['parse', 'transform', 'render', 'write']),
  input: OperationInputSchema,
  timestamp: z.number()
})

export const QueueSchema = z.array(OperationSchema)
```

## Pipeline Types

### Unified Processor Types

```typescript
// Unified processor configuration using actual plugin types
export const ProcessorConfigSchema = z.object({
  remarkPlugins: z.array(z.function()), // Array of Plugin functions
  rehypePlugins: z.array(z.function()), // Array of Plugin functions
  settings: z.record(z.string(), z.unknown())
})

// VFile schema matching unified's VFile type
export const VFileSchema = z.object({
  contents: z.union([z.string(), z.instanceof(Uint8Array)]),
  path: z.string().optional(),
  basename: z.string().optional(),
  stem: z.string().optional(),
  extname: z.string().optional(),
  dirname: z.string().optional(),
  data: z.record(z.string(), z.unknown()),
  messages: z.array(z.any()),
  history: z.array(z.string()),
  cwd: z.string()
})

// Processing result using VFile
export const ProcessingResultSchema = VFileSchema

// Unified processor instance type (for runtime validation)
export const ProcessorInstanceSchema = z.object({
  use: z.function(),
  parse: z.function(),
  stringify: z.function(),
  run: z.function(),
  runSync: z.function(),
  process: z.function(),
  processSync: z.function()
})
```

### Stage Definitions

```typescript
// Pipeline stages
export const StageTypeSchema = z.enum([
  'parse',
  'transform',
  'render',
  'write'
])

// Stage status
export const StageStatusSchema = z.enum([
  'pending',
  'running',
  'complete',
  'failed',
  'skipped'
])

// Stage definition
export const StageSchema = z.object({
  id: z.string().uuid(),
  type: StageTypeSchema,
  input: StageInputSchema,
  output: StageOutputSchema.optional(),
  status: StageStatusSchema,
  error: z.string().optional(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  dependencies: z.array(z.string().uuid())
})

// Pipeline configuration
export const PipelineConfigSchema = z.object({
  id: z.string().uuid(),
  stages: z.array(StageSchema),
  parallel: z.boolean().default(false),
  retryLimit: z.number().int().min(0).max(3).default(1),
  timeout: z.number().int().min(1000).default(30000)
})

// Execution context data schema (no functions)
export const ExecutionContextDataSchema = z.object({
  pipeline: PipelineConfigSchema,
  startTime: z.number(),
  endTime: z.number().optional(),
  status: z.enum(['running', 'complete', 'failed'])
})

// Stage result
export const StageResultSchema = z.object({
  stageId: z.string().uuid(),
  success: z.boolean(),
  output: z.lazy(() => StageOutputSchema).optional(),
  error: z.string().optional(),
  duration: z.number()
})

// Pipeline result
export const PipelineResultSchema = z.object({
  pipelineId: z.string().uuid(),
  stages: z.array(StageResultSchema),
  success: z.boolean(),
  duration: z.number()
})

// Execution strategy
export const ExecutionStrategySchema = z.enum([
  'sequential',
  'parallel',
  'waterfall'
])

// Error recovery strategies
export const RecoveryStrategySchema = z.enum([
  'retry',
  'skip',
  'fail-fast',
  'fallback'
])
```

## Parser Stage Types

```typescript
// Slide delimiter and patterns
export const DelimiterPatternSchema = z.literal('===')

// Container definition
export const ContainerSchema = z.object({
  tag: z.literal('container'),
  classes: z.array(z.string().regex(/^[a-zA-Z0-9_-]+$/)),
  content: z.string()
})

// Style extraction
export const ExtractedStyleSchema = z.object({
  content: z.string(),
  global: z.boolean(),
  slideIndex: z.number().optional()
})

// Slide metadata value types
export const SlideMetadataValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string())
])

// Parsed slide using actual mdast Root type
export const ParsedSlideSchema = z.object({
  index: z.number().int().min(0).max(98),
  content: z.string(),
  mdast: z.custom<MdastRoot>((val) => {
    // Runtime validation that matches mdast Root structure
    return val && typeof val === 'object' && 'type' in val && val.type === 'root'
  }).optional(),
  containers: z.array(ContainerSchema),
  styles: z.array(ExtractedStyleSchema),
  metadata: z.record(z.string(), SlideMetadataValueSchema).optional()
})

// Type alias for parsed slide with proper mdast type
export type ParsedSlide = Omit<z.infer<typeof ParsedSlideSchema>, 'mdast'> & {
  mdast?: MdastRoot
}

// Parser output
export const ParserOutputSchema = z.object({
  globalContent: z.string(),
  globalStyles: z.array(ExtractedStyleSchema),
  slides: z.array(ParsedSlideSchema),
  version: z.literal('0.1')
})
```

## AST Types

### Unified Ecosystem Integration

The AST types below work with the unified ecosystem for processing markdown and HTML:

1. **Parse Phase**: Use `remark` to parse markdown into mdast (Markdown AST)
2. **Transform Phase**: Use `remark-rehype` to transform mdast into hast (HTML AST)  
3. **Stringify Phase**: Use `rehype-stringify` to serialize hast into HTML

Our Zod schemas provide runtime validation for these AST structures while maintaining
compatibility with the unified ecosystem. We define our own TypeScript interfaces 
(rather than using @types/mdast and @types/hast) because z.lazy() requires exact
type definitions for recursive schemas.

### Mdast Types (Markdown AST from remark)

```typescript
// Integration with unified ecosystem:
// - Parse markdown -> mdast using remark
// - Transform mdast -> hast using remark-rehype
// - These schemas validate the AST structures from remark

// Note: We define our own interfaces instead of using @types/mdast
// because z.lazy() requires the exact TypeScript type for recursion

// Node positions schemas
export const NodePointSchema = z.object({
  line: z.number(),
  column: z.number(),
  offset: z.number()
})

export const NodePositionSchema = z.object({
  start: NodePointSchema,
  end: NodePointSchema
})

// Mdast node types from remark
export const MdastNodeTypeSchema = z.enum([
  'root', 'heading', 'paragraph', 'text', 'emphasis', 'strong',
  'link', 'image', 'list', 'listItem', 'code', 'inlineCode',
  'table', 'tableRow', 'tableCell', 'break', 'thematicBreak',
  'blockquote', 'html', 'definition', 'linkReference', 'imageReference'
])

// TypeScript interfaces for recursive types
// These match the structure of mdast nodes from remark
export interface IMdastTextNode {
  type: 'text'
  value: string
  position?: z.infer<typeof NodePositionSchema> | undefined
}

export interface IMdastHeadingNode {
  type: 'heading'
  depth: number
  children: IMdastNode[]
  position?: z.infer<typeof NodePositionSchema> | undefined
}

export interface IMdastParagraphNode {
  type: 'paragraph'
  children: IMdastNode[]
  position?: z.infer<typeof NodePositionSchema> | undefined
}

export interface IMdastEmphasisNode {
  type: 'emphasis'
  children: IMdastNode[]
  position?: z.infer<typeof NodePositionSchema> | undefined
}

export interface IMdastStrongNode {
  type: 'strong'
  children: IMdastNode[]
  position?: z.infer<typeof NodePositionSchema> | undefined
}

export interface IMdastLinkNode {
  type: 'link'
  url: string
  title?: string | undefined
  children: IMdastNode[]
  position?: z.infer<typeof NodePositionSchema> | undefined
}

export interface IMdastImageNode {
  type: 'image'
  url: string
  alt?: string | undefined
  title?: string | undefined
  position?: z.infer<typeof NodePositionSchema> | undefined
}

export interface IMdastListNode {
  type: 'list'
  ordered?: boolean | undefined
  start?: number | undefined
  spread?: boolean | undefined
  children: IMdastNode[]
  position?: z.infer<typeof NodePositionSchema> | undefined
}

export interface IMdastListItemNode {
  type: 'listItem'
  checked?: boolean | undefined
  spread?: boolean | undefined
  children: IMdastNode[]
  position?: z.infer<typeof NodePositionSchema> | undefined
}

export interface IMdastCodeNode {
  type: 'code'
  lang?: string | undefined
  meta?: string | undefined
  value: string
  position?: z.infer<typeof NodePositionSchema> | undefined
}

export interface IMdastInlineCodeNode {
  type: 'inlineCode'
  value: string
  position?: z.infer<typeof NodePositionSchema> | undefined
}

export interface IMdastTableNode {
  type: 'table'
  align?: (('left' | 'center' | 'right') | null)[] | undefined
  children: IMdastNode[]
  position?: z.infer<typeof NodePositionSchema> | undefined
}

export interface IMdastTableRowNode {
  type: 'tableRow'
  children: IMdastNode[]
  position?: z.infer<typeof NodePositionSchema> | undefined
}

export interface IMdastTableCellNode {
  type: 'tableCell'
  children: IMdastNode[]
  position?: z.infer<typeof NodePositionSchema> | undefined
}

export interface IMdastRootNode {
  type: 'root'
  children: IMdastNode[]
  position?: z.infer<typeof NodePositionSchema> | undefined
}

// Union type for all mdast nodes
export type IMdastNode =
  | IMdastTextNode
  | IMdastHeadingNode
  | IMdastParagraphNode
  | IMdastEmphasisNode
  | IMdastStrongNode
  | IMdastLinkNode
  | IMdastImageNode
  | IMdastListNode
  | IMdastListItemNode
  | IMdastCodeNode
  | IMdastInlineCodeNode
  | IMdastTableNode
  | IMdastTableRowNode
  | IMdastTableCellNode
  | IMdastRootNode

// Base mdast node
export const BaseMdastNodeSchema = z.object({
  type: MdastNodeTypeSchema,
  position: NodePositionSchema.optional()
})

// Create individual schemas first without circular dependencies
const MdastTextNodeSchemaBase: z.ZodType<IMdastTextNode> = z.object({
  type: z.literal('text'),
  value: z.string(),
  position: NodePositionSchema.optional()
})

const MdastImageNodeSchemaBase: z.ZodType<IMdastImageNode> = z.object({
  type: z.literal('image'),
  url: z.string(),
  alt: z.string().optional(),
  title: z.string().optional(),
  position: NodePositionSchema.optional()
})

const MdastCodeNodeSchemaBase: z.ZodType<IMdastCodeNode> = z.object({
  type: z.literal('code'),
  lang: z.string().optional(),
  meta: z.string().optional(),
  value: z.string(),
  position: NodePositionSchema.optional()
})

const MdastInlineCodeNodeSchemaBase: z.ZodType<IMdastInlineCodeNode> = z.object({
  type: z.literal('inlineCode'),
  value: z.string(),
  position: NodePositionSchema.optional()
})

// Now create the recursive union using lazy
const createMdastNodeSchema = (): z.ZodType<IMdastNode> => {
  const MdastNodeSchema: z.ZodType<IMdastNode> = z.lazy(() =>
    z.union([
      MdastTextNodeSchemaBase,
      z.object({
        type: z.literal('heading'),
        depth: z.number().int().min(1).max(6),
        children: z.array(MdastNodeSchema),
        position: NodePositionSchema.optional()
      }),
      z.object({
        type: z.literal('paragraph'),
        children: z.array(MdastNodeSchema),
        position: NodePositionSchema.optional()
      }),
      z.object({
        type: z.literal('emphasis'),
        children: z.array(MdastNodeSchema),
        position: NodePositionSchema.optional()
      }),
      z.object({
        type: z.literal('strong'),
        children: z.array(MdastNodeSchema),
        position: NodePositionSchema.optional()
      }),
      z.object({
        type: z.literal('link'),
        url: z.string(),
        title: z.string().optional(),
        children: z.array(MdastNodeSchema),
        position: NodePositionSchema.optional()
      }),
      MdastImageNodeSchemaBase,
      z.object({
        type: z.literal('list'),
        ordered: z.boolean().optional(),
        start: z.number().optional(),
        spread: z.boolean().optional(),
        children: z.array(MdastNodeSchema),
        position: NodePositionSchema.optional()
      }),
      z.object({
        type: z.literal('listItem'),
        checked: z.boolean().optional(),
        spread: z.boolean().optional(),
        children: z.array(MdastNodeSchema),
        position: NodePositionSchema.optional()
      }),
      MdastCodeNodeSchemaBase,
      MdastInlineCodeNodeSchemaBase,
      z.object({
        type: z.literal('table'),
        align: z.array(z.enum(['left', 'center', 'right']).nullable()).optional(),
        children: z.array(MdastNodeSchema),
        position: NodePositionSchema.optional()
      }),
      z.object({
        type: z.literal('tableRow'),
        children: z.array(MdastNodeSchema),
        position: NodePositionSchema.optional()
      }),
      z.object({
        type: z.literal('tableCell'),
        children: z.array(MdastNodeSchema),
        position: NodePositionSchema.optional()
      }),
      z.object({
        type: z.literal('root'),
        children: z.array(MdastNodeSchema),
        position: NodePositionSchema.optional()
      })
    ])
  )
  
  return MdastNodeSchema
}

// Export the main schema
export const MdastNodeSchema = createMdastNodeSchema()

// Export individual schemas for convenience
export const MdastTextNodeSchema = MdastTextNodeSchemaBase
export const MdastImageNodeSchema = MdastImageNodeSchemaBase
export const MdastCodeNodeSchema = MdastCodeNodeSchemaBase
export const MdastInlineCodeNodeSchema = MdastInlineCodeNodeSchemaBase

// Export types derived from schemas
export type MdastNode = z.infer<typeof MdastNodeSchema>
export type MdastTextNode = z.infer<typeof MdastTextNodeSchema>
export type MdastImageNode = z.infer<typeof MdastImageNodeSchema>
export type MdastCodeNode = z.infer<typeof MdastCodeNodeSchema>
export type MdastInlineCodeNode = z.infer<typeof MdastInlineCodeNodeSchema>
```

### Hast Types (HTML AST from rehype)

```typescript
// Integration with unified ecosystem:
// - Transform mdast -> hast using remark-rehype
// - Stringify hast -> HTML using rehype-stringify
// - These schemas validate the AST structures from rehype

// Note: We define our own interfaces instead of using @types/hast
// because z.lazy() requires the exact TypeScript type for recursion

import { NodePositionSchema } from './mdast'

// Hast node types
export const HastNodeTypeSchema = z.enum([
  'root', 'element', 'text', 'comment', 'doctype'
])

// TypeScript interfaces for recursive types
// These match the structure of hast nodes from rehype
interface BaseHastNode {
  type: z.infer<typeof HastNodeTypeSchema>
  position?: z.infer<typeof NodePositionSchema> | undefined
}

interface HastTextNode extends BaseHastNode {
  type: 'text'
  value: string
}

interface HastElementNode extends BaseHastNode {
  type: 'element'
  tagName: string
  properties?: Record<string, string | number | boolean | (string | number)[]> | undefined
  children?: HastNode[] | undefined
}

interface HastRootNode extends BaseHastNode {
  type: 'root'
  children: HastNode[]
}

interface HastCommentNode extends BaseHastNode {
  type: 'comment'
  value: string
}

interface HastDoctypeNode extends BaseHastNode {
  type: 'doctype'
  name?: string | undefined
  public?: string | undefined
  system?: string | undefined
}

// Union type for all Hast nodes
type HastNode = HastTextNode | HastElementNode | HastRootNode | HastCommentNode | HastDoctypeNode

// Base hast node schema
export const BaseHastNodeSchema = z.object({
  type: HastNodeTypeSchema,
  position: NodePositionSchema.optional()
})

// Hast text node schema
export const HastTextNodeSchema: z.ZodType<HastTextNode> = z.object({
  type: z.literal('text'),
  value: z.string(),
  position: NodePositionSchema.optional()
})

// Hast element properties schema
export const HastPropertiesSchema = z.record(
  z.string(),
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number()]))
  ])
)

// Hast element node schema with proper recursion
export const HastElementNodeSchema: z.ZodType<HastElementNode> = z.lazy(() =>
  z.object({
    type: z.literal('element'),
    tagName: z.string(),
    properties: HastPropertiesSchema.optional(),
    children: z.array(HastNodeSchema).optional(),
    position: NodePositionSchema.optional()
  })
)

// Hast root node schema with proper recursion
export const HastRootNodeSchema: z.ZodType<HastRootNode> = z.lazy(() =>
  z.object({
    type: z.literal('root'),
    children: z.array(HastNodeSchema),
    position: NodePositionSchema.optional()
  })
)

// Hast comment node schema
export const HastCommentNodeSchema: z.ZodType<HastCommentNode> = z.object({
  type: z.literal('comment'),
  value: z.string(),
  position: NodePositionSchema.optional()
})

// Hast doctype node schema
export const HastDoctypeNodeSchema: z.ZodType<HastDoctypeNode> = z.object({
  type: z.literal('doctype'),
  name: z.string().optional(),
  public: z.string().optional(),
  system: z.string().optional(),
  position: NodePositionSchema.optional()
})

// Define the union schema with proper recursion
export const HastNodeSchema: z.ZodType<HastNode> = z.lazy(() =>
  z.union([
    HastTextNodeSchema,
    HastElementNodeSchema,
    HastRootNodeSchema,
    HastCommentNodeSchema,
    HastDoctypeNodeSchema
  ])
)

// Export types
export type HastNodeType = z.infer<typeof HastNodeTypeSchema>
export type { HastCommentNode, HastDoctypeNode, HastElementNode, HastNode, HastRootNode, HastTextNode }
```

### Usage Example with Unified Ecosystem

```typescript
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { MdastNodeSchema, HastNodeSchema } from './schemas'

// Example: Processing markdown with runtime validation
async function processMarkdown(markdown: string): Promise<string> {
  // Parse markdown to mdast using remark
  const processor = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeStringify)
  
  const file = await processor.process(markdown)
  
  // Validate the mdast structure (after parsing)
  const mdastTree = processor.parse(markdown)
  const validatedMdast = MdastNodeSchema.parse(mdastTree)
  
  // Transform mdast to hast
  const hastTree = await processor.run(validatedMdast)
  const validatedHast = HastNodeSchema.parse(hastTree)
  
  // Stringify hast to HTML
  const html = processor.stringify(validatedHast)
  
  return String(html)
}

// Example: Working with parsed AST nodes
function processHeadings(node: IMdastNode): string[] {
  const headings: string[] = []
  
  if (node.type === 'heading') {
    // TypeScript knows node is IMdastHeadingNode here
    const text = extractText(node.children)
    headings.push(text)
  }
  
  // Recursively process children
  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      headings.push(...processHeadings(child))
    }
  }
  
  return headings
}

function extractText(nodes: IMdastNode[]): string {
  return nodes
    .map(node => {
      if (node.type === 'text') {
        return node.value
      }
      if ('children' in node) {
        return extractText(node.children)
      }
      return ''
    })
    .join('')
}
```

### Custom AST Types (Curtains-specific)

```typescript
// Custom AST extending unified ecosystem
// These types work alongside mdast/hast, not replacing them
// Use remark/rehype plugins to process these custom nodes

// Custom node types for Curtains (includes container support)
export const ASTNodeTypeSchema = z.enum([
  'root', 'container', 'heading', 'paragraph', 'list', 'listItem',
  'link', 'image', 'code', 'text', 'table', 'tableRow', 'tableCell'
])

// Base node
export const BaseNodeSchema = z.object({
  type: ASTNodeTypeSchema
})

// Text node
export const TextNodeSchema = BaseNodeSchema.extend({
  type: z.literal('text'),
  value: z.string(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional()
})

// Container node
export const ContainerNodeSchema = BaseNodeSchema.extend({
  type: z.literal('container'),
  classes: z.array(z.string()),
  children: z.array(z.lazy(() => ASTNodeSchema))
})

// Heading node
export const HeadingNodeSchema = BaseNodeSchema.extend({
  type: z.literal('heading'),
  depth: z.number().int().min(1).max(6),
  children: z.array(z.lazy(() => ASTNodeSchema))
})

// All AST nodes union
export const ASTNodeSchema = z.discriminatedUnion('type', [
  TextNodeSchema,
  ContainerNodeSchema,
  HeadingNodeSchema,
  // ... other node types
])

// AST root node
export const ASTRootNodeSchema = z.object({
  type: z.literal('root'),
  children: z.array(ASTNodeSchema)
})

// AST slide
export const ASTSlideSchema = z.object({
  index: z.number(),
  ast: ASTRootNodeSchema,
  slideCSS: z.string()
})

// Curtains document
export const CurtainsDocumentSchema = z.object({
  type: z.literal('curtains-document'),
  version: z.literal('0.1'),
  slides: z.array(ASTSlideSchema),
  globalCSS: z.string()
})
```

## Transform Types

```typescript
// Transformed slide
export const TransformedSlideSchema = z.object({
  html: z.string(),
  css: z.string()
})

// Transformed document
export const TransformedDocumentSchema = z.object({
  slides: z.array(TransformedSlideSchema),
  globalCSS: z.string()
})
```

## Render Types

```typescript
// Final HTML output
export const HTMLOutputSchema = z.string()
```

## Registry Types (Reducer Pattern)

### Registry Actions

```typescript
// Action payloads
export const SetConfigPayloadSchema = z.object({
  config: RuntimeConfigSchema
})

export const SaveStatePayloadSchema = z.object({
  key: StateKeySchema,
  value: StateValueSchema
})

export const CreateSnapshotPayloadSchema = z.object({
  timestamp: z.number()
})

export const RestoreSnapshotPayloadSchema = z.object({
  snapshot: StateSnapshotSchema
})

export const AddListenerPayloadSchema = z.object({
  listener: ListenerSchema
})

export const RemoveListenerPayloadSchema = z.object({
  listenerId: z.string().uuid()
})

export const EmitEventPayloadSchema = z.object({
  event: EventSchema
})

export const UpdateCachePayloadSchema = z.object({
  key: z.string(),
  value: CacheValueSchema,
  ttl: z.number()
})

export const InvalidateCachePayloadSchema = z.object({
  pattern: z.string().optional(),
  all: z.boolean().optional()
})

export const AcquireLockPayloadSchema = z.object({
  requestId: z.string().uuid()
})

export const ReleaseLockPayloadSchema = z.object({
  requestId: z.string().uuid()
})

export const AddErrorPayloadSchema = z.object({
  error: StateErrorEntrySchema
})

export const AddToHistoryPayloadSchema = z.object({
  snapshot: StateSnapshotSchema
})

// Registry Actions (discriminated union)
export const SetConfigActionSchema = z.object({
  type: z.literal('SET_CONFIG'),
  payload: SetConfigPayloadSchema
})

export const SaveStateActionSchema = z.object({
  type: z.literal('SAVE_STATE'),
  payload: SaveStatePayloadSchema
})

export const CreateSnapshotActionSchema = z.object({
  type: z.literal('CREATE_SNAPSHOT'),
  payload: CreateSnapshotPayloadSchema
})

export const RestoreSnapshotActionSchema = z.object({
  type: z.literal('RESTORE_SNAPSHOT'),
  payload: RestoreSnapshotPayloadSchema
})

export const AddListenerActionSchema = z.object({
  type: z.literal('ADD_LISTENER'),
  payload: AddListenerPayloadSchema
})

export const RemoveListenerActionSchema = z.object({
  type: z.literal('REMOVE_LISTENER'),
  payload: RemoveListenerPayloadSchema
})

export const EmitEventActionSchema = z.object({
  type: z.literal('EMIT_EVENT'),
  payload: EmitEventPayloadSchema
})

export const UpdateCacheActionSchema = z.object({
  type: z.literal('UPDATE_CACHE'),
  payload: UpdateCachePayloadSchema
})

export const InvalidateCacheActionSchema = z.object({
  type: z.literal('INVALIDATE_CACHE'),
  payload: InvalidateCachePayloadSchema
})

export const AcquireLockActionSchema = z.object({
  type: z.literal('ACQUIRE_LOCK'),
  payload: AcquireLockPayloadSchema
})

export const ReleaseLockActionSchema = z.object({
  type: z.literal('RELEASE_LOCK'),
  payload: ReleaseLockPayloadSchema
})

export const AddErrorActionSchema = z.object({
  type: z.literal('ADD_ERROR'),
  payload: AddErrorPayloadSchema
})

export const ClearErrorsActionSchema = z.object({
  type: z.literal('CLEAR_ERRORS')
})

export const AddToHistoryActionSchema = z.object({
  type: z.literal('ADD_TO_HISTORY'),
  payload: AddToHistoryPayloadSchema
})

// All Registry Actions union
export const RegistryActionSchema = z.discriminatedUnion('type', [
  SetConfigActionSchema,
  SaveStateActionSchema,
  CreateSnapshotActionSchema,
  RestoreSnapshotActionSchema,
  AddListenerActionSchema,
  RemoveListenerActionSchema,
  EmitEventActionSchema,
  UpdateCacheActionSchema,
  InvalidateCacheActionSchema,
  AcquireLockActionSchema,
  ReleaseLockActionSchema,
  AddErrorActionSchema,
  ClearErrorsActionSchema,
  AddToHistoryActionSchema
])

### Registry State

```typescript
// Complete listener schema with handler
export const ListenerSchema = z.object({
  id: z.string().uuid(),
  event: EventTypeSchema,
  // handler is a function, stored separately in implementation
})

// Registry State (complete state structure)
export const RegistryStateSchema = z.object({
  // Core state data
  entries: z.map(StateKeySchema, StateEntrySchema),
  history: z.array(StateSnapshotSchema),
  version: z.number().int().min(0),

  // Event system
  listeners: z.map(z.string().uuid(), ListenerSchema),
  eventQueue: z.array(EventSchema),

  // Cache management
  cache: z.map(z.string(), CacheEntrySchema),

  // Lock management
  lockHolder: z.string().uuid().nullable(),
  lockQueue: z.array(z.string().uuid()),

  // Error tracking
  errors: z.array(StateErrorEntrySchema),

  // Metadata
  lastModified: z.number(),
  checksum: z.string()
})

// Initial state factory
export const createInitialStateSchema = () => RegistryStateSchema.parse({
  entries: new Map(),
  history: [],
  version: 0,
  listeners: new Map(),
  eventQueue: [],
  cache: new Map(),
  lockHolder: null,
  lockQueue: [],
  errors: [],
  lastModified: Date.now(),
  checksum: ''
})
```

### Registry Store Types

```typescript
// Store configuration
export const StoreConfigSchema = z.object({
  initialState: RegistryStateSchema.optional(),
  middleware: z.array(z.function()).optional()
})

// Store methods return types
export const StoreGetStateResultSchema = RegistryStateSchema

export const StoreDispatchParamsSchema = z.object({
  action: RegistryActionSchema
})

export const StoreSubscribeParamsSchema = z.object({
  listener: z.function()
})

export const StoreGetValueParamsSchema = z.object({
  key: StateKeySchema
})

// Middleware type
export const MiddlewareTypeSchema = z.function()
```

## Data Flow Types

```typescript
// === CLI → Registry ===
export const CLIToRegistrySchema = z.object({
  type: z.literal('cli-config'),
  config: RuntimeConfigSchema,
  queue: QueueSchema,
  timestamp: z.number()
})

// === Registry → Coordinator ===
export const RegistryToCoordinatorDataSchema = z.object({
  type: z.literal('execution-request'),
  config: RuntimeConfigSchema,
  queue: QueueSchema
})

// === Coordinator → Pipeline ===
export const CoordinatorToPipelineSchema = z.object({
  type: z.literal('stage-execution'),
  stage: StageSchema,
  input: StageInputSchema,
  context: ExecutionContextDataSchema
})

// === Pipeline → Registry ===
export const PipelineToRegistrySchema = z.object({
  type: z.literal('stage-result'),
  stageId: z.string().uuid(),
  output: StageOutputSchema,
  status: StageStatusSchema,
  duration: z.number()
})

// Output metadata
export const OutputMetadataSchema = z.object({
  totalSlides: z.number(),
  theme: ThemeSchema,
  generatedAt: z.number()
})

// === Registry → Output ===
export const RegistryToOutputSchema = z.object({
  type: z.literal('final-output'),
  html: z.string(),
  outputPath: z.string(),
  metadata: OutputMetadataSchema
})
```

## File I/O Types

```typescript
// === Input File → Parse Stage ===
export const FileToParseSchema = z.object({
  path: z.string(),
  content: z.string(),
  encoding: z.literal('utf-8')
})

// === Parse Stage → AST Stage ===
export const ParseToASTSchema = z.object({
  globalContent: z.string(),
  globalMdast: z.custom<MdastRoot>((val) => {
    return val && typeof val === 'object' && 'type' in val && val.type === 'root'
  }).optional(),
  globalStyles: z.array(ExtractedStyleSchema),
  slides: z.array(ParsedSlideSchema)
})

// Type alias with proper mdast type
export type ParseToAST = Omit<z.infer<typeof ParseToASTSchema>, 'globalMdast' | 'slides'> & {
  globalMdast?: MdastRoot
  slides: ParsedSlide[]
}

// === AST Stage → Transform Stage ===
export const ASTToTransformSchema = CurtainsDocumentSchema

// === Transform Stage → Render Stage ===
export const TransformToRenderSchema = TransformedDocumentSchema

// === Render Stage → Write Stage ===
export const RenderToWriteSchema = z.object({
  html: z.string(),
  outputPath: z.string()
})
```

## Error Types

```typescript
// Error details for context
export const ErrorDetailsSchema = z.object({
  message: z.string(),
  stack: z.string().optional()
})

// Error context value types
export const ErrorContextValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  ErrorDetailsSchema
])

// Error flow through system
export const ErrorPropagationSchema = z.object({
  source: z.enum(['cli', 'registry', 'coordinator', 'pipeline']),
  stage: StageTypeSchema.optional(),
  error: CLIErrorSchema,
  context: z.record(z.string(), ErrorContextValueSchema),
  timestamp: z.number()
})

// Error recovery data
export const ErrorRecoverySchema = z.object({
  failedStage: StageSchema,
  lastGoodState: StateSnapshotSchema,
  retryCount: z.number(),
  strategy: RecoveryStrategySchema
})
```

## Unified Utilities Types

```typescript
// Using actual types from unified utilities
import type { BuildOptions } from 'hastscript'

// Visitor function matching unist-util-visit's Visitor type
export const VisitorFunctionSchema = z.function()
  .args(
    z.custom<Node>(), // unist Node
    z.number().optional(), // index
    z.custom<Node>().optional() // parent
  )
  .returns(z.union([z.void(), z.boolean(), z.literal('skip')]))

// Type-safe visitor for specific node types
export type TypedVisitor<T extends Node> = (
  node: T,
  index?: number,
  parent?: Node
) => void | boolean | 'skip'

// Test function matching unist-util-visit's Test type
export type VisitTest = Test

// Visit options using actual type
export const VisitOptionsSchema = z.object({
  test: z.custom<Test>().optional(),
  reverse: z.boolean().optional()
})

// Hastscript builder options using actual type
export const HastscriptOptionsSchema = z.object({
  space: z.enum(['html', 'svg']).optional(),
  fragment: z.boolean().optional()
}) satisfies z.ZodType<Partial<BuildOptions>>

// Helper function types for unified utilities
export type MdastToString = (node: MdastNode) => string
export type IsElement = (node: HastNode) => node is Element
export type HasProperty = (node: HastNode, prop: string) => boolean
```

## System Event Types

```typescript
// CLI start event
export const CLIStartEventSchema = z.object({
  args: CLIArgsSchema,
  timestamp: z.number()
})

// Registry state saved event
export const RegistryStateSavedEventSchema = z.object({
  key: StateKeySchema,
  version: z.number()
})

// Coordinator pipeline started event
export const CoordinatorPipelineStartedEventSchema = z.object({
  pipelineId: z.string().uuid(),
  stageCount: z.number()
})

// Pipeline stage complete event
export const PipelineStageCompleteEventSchema = z.object({
  stageId: z.string().uuid(),
  duration: z.number()
})

// Output file written event
export const OutputFileWrittenEventSchema = z.object({
  path: z.string(),
  size: z.number()
})

// System events flow
export const SystemEventFlowSchema = z.object({
  'cli:start': CLIStartEventSchema,
  'registry:state-saved': RegistryStateSavedEventSchema,
  'coordinator:pipeline-started': CoordinatorPipelineStartedEventSchema,
  'pipeline:stage-complete': PipelineStageCompleteEventSchema,
  'output:file-written': OutputFileWrittenEventSchema
})
```

## Build Command Flow Types

```typescript
// Build input stage
export const BuildInputStageSchema = z.object({
  path: z.string(),
  content: z.string()
})

// Build parse stage
export const BuildParseStageSchema = z.object({
  ast: CurtainsDocumentSchema
})

// Build transform stage
export const BuildTransformStageSchema = z.object({
  transformed: TransformedDocumentSchema
})

// Build render stage
export const BuildRenderStageSchema = z.object({
  html: z.string(),
  theme: ThemeSchema
})

// Build output stage
export const BuildOutputStageSchema = z.object({
  path: z.string(),
  written: z.boolean()
})

// Build command flow (the only command)
export const BuildCommandFlowSchema = z.object({
  input: BuildInputStageSchema,
  parse: BuildParseStageSchema,
  transform: BuildTransformStageSchema,
  render: BuildRenderStageSchema,
  output: BuildOutputStageSchema
})
```

## Cache Flow Types

```typescript
// Cache lookup result
export const CacheLookupSchema = z.object({
  hit: z.boolean(),
  value: CacheValueSchema.optional(),
  age: z.number().optional()
})

// Cache update operation
export const CacheUpdateSchema = z.object({
  key: z.string(),
  value: CacheValueSchema,
  ttl: z.number()
})

// Cache invalidation operation
export const CacheInvalidateSchema = z.object({
  pattern: z.string().optional(),
  all: z.boolean().optional()
})

// Cache data flow
export const CacheFlowSchema = z.object({
  key: z.string(),
  lookup: CacheLookupSchema,
  update: CacheUpdateSchema,
  invalidate: CacheInvalidateSchema
})
```

## Validation Points Types

```typescript
// Input validation point
export const InputValidationPointSchema = z.object({
  location: z.literal('cli'),
  schema: BuildOptionsSchema,
  required: z.boolean()
})

// Parse stage validation
export const ParseValidationSchema = z.object({
  type: z.literal('parse'),
  schema: z.literal('ParserOutputSchema')
})

// Transform stage validation
export const TransformValidationSchema = z.object({
  type: z.literal('transform'),
  schema: z.literal('TransformedDocumentSchema')
})

// Render stage validation
export const RenderValidationSchema = z.object({
  type: z.literal('render'),
  schema: z.literal('HTMLOutputSchema')
})

// Write stage validation
export const WriteValidationSchema = z.object({
  type: z.literal('write'),
  schema: z.literal('WriteResultSchema')
})

// Stage validation point
export const StageValidationPointSchema = z.object({
  location: z.literal('coordinator'),
  from: StageTypeSchema,
  to: StageTypeSchema,
  schema: z.union([
    ParseValidationSchema,
    TransformValidationSchema,
    RenderValidationSchema,
    WriteValidationSchema
  ])
})

// Output validation point
export const OutputValidationPointSchema = z.object({
  location: z.literal('renderer'),
  schema: HTMLOutputSchema,
  required: z.boolean()
})

// Validation checkpoints
export const ValidationPointsSchema = z.object({
  inputValidation: InputValidationPointSchema,
  stageValidation: StageValidationPointSchema,
  outputValidation: OutputValidationPointSchema
})
```

## Performance Metrics Types

```typescript
// Stage performance metric
export const StageMetricSchema = z.object({
  stage: StageTypeSchema,
  duration: z.number(),
  memory: z.number(),
  cacheHit: z.boolean()
})

// Total performance metrics
export const TotalMetricsSchema = z.object({
  duration: z.number(),
  peakMemory: z.number(),
  cacheHitRate: z.number()
})

// Performance bottleneck
export const BottleneckSchema = z.object({
  stage: StageTypeSchema,
  impact: z.number() // percentage
})

// Performance data collection
export const PerformanceMetricsSchema = z.object({
  stageMetrics: z.array(StageMetricSchema),
  totalMetrics: TotalMetricsSchema,
  bottlenecks: z.array(BottleneckSchema)
})
```

## Stage I/O Types (Unified)

```typescript
// Parse operation input
export const ParseOperationInputSchema = z.object({
  type: z.literal('parse'),
  content: z.string()
})

// Transform operation input
export const TransformOperationInputSchema = z.object({
  type: z.literal('transform'),
  ast: CurtainsDocumentSchema
})

// Render operation input
export const RenderOperationInputSchema = z.object({
  type: z.literal('render'),
  transformed: TransformedDocumentSchema
})

// Write operation input
export const WriteOperationInputSchema = z.object({
  type: z.literal('write'),
  html: z.string(),
  path: z.string()
})

// Operation input types based on operation type
export const OperationInputSchema = z.union([
  ParseOperationInputSchema,
  TransformOperationInputSchema,
  RenderOperationInputSchema,
  WriteOperationInputSchema
])

// Parse stage input
export const ParseStageInputSchema = z.object({
  type: z.literal('parse'),
  content: z.string()
})

// Transform stage input
export const TransformStageInputSchema = z.object({
  type: z.literal('transform'),
  ast: CurtainsDocumentSchema
})

// Render stage input
export const RenderStageInputSchema = z.object({
  type: z.literal('render'),
  transformed: TransformedDocumentSchema
})

// Write stage input
export const WriteStageInputSchema = z.object({
  type: z.literal('write'),
  html: z.string(),
  path: z.string()
})

// Stage IO types based on stage type
export const StageInputSchema = z.union([
  ParseStageInputSchema,
  TransformStageInputSchema,
  RenderStageInputSchema,
  WriteStageInputSchema
])

// Parse stage output
export const ParseStageOutputSchema = z.object({
  type: z.literal('parse'),
  result: ParserOutputSchema
})

// Transform stage output
export const TransformStageOutputSchema = z.object({
  type: z.literal('transform'),
  result: TransformedDocumentSchema
})

// Render stage output
export const RenderStageOutputSchema = z.object({
  type: z.literal('render'),
  html: z.string()
})

// Write stage output
export const WriteStageOutputSchema = z.object({
  type: z.literal('write'),
  success: z.boolean(),
  path: z.string()
})

export const StageOutputSchema = z.union([
  ParseStageOutputSchema,
  TransformStageOutputSchema,
  RenderStageOutputSchema,
  WriteStageOutputSchema
])
```

## TypeScript Interfaces

```typescript
// Registry interface
export interface Registry {
  save<T>(key: string, value: T): Promise<void>;
  get<T>(key: string): T | undefined;
  emit(event: string, payload?: unknown): Promise<void>;
  subscribe(event: string, handler: (payload: unknown) => void): () => void;
  snapshot(): z.infer<typeof StateSnapshotSchema>;
  getHistory(limit?: number): z.infer<typeof StateSnapshotSchema>[];
  restore(snapshot: z.infer<typeof StateSnapshotSchema>): void;
}

// Full execution context type with registry interface
export interface ExecutionContext extends z.infer<typeof ExecutionContextDataSchema> {
  registry: Registry;
}

// Full listener interface
export interface Listener extends z.infer<typeof ListenerDataSchema> {
  handler(payload: z.infer<typeof EventPayloadSchema>): void;
}

// Full registry state interface
export interface RegistryState extends z.infer<typeof RegistryStateDataSchema> {
  listeners: Listener[];
}

// Registry to Coordinator with registry reference
export interface RegistryToCoordinator extends z.infer<typeof RegistryToCoordinatorDataSchema> {
  registry: Registry;
}

// Stage handler interface
export interface StageHandler {
  type: z.infer<typeof StageTypeSchema>;
  handler(input: z.infer<typeof StageInputSchema>, registry: Registry): Promise<z.infer<typeof StageOutputSchema>>;
  validator?(output: z.infer<typeof StageOutputSchema>): boolean;
}

// Pipeline initialization event
export const PipelineInitEventSchema = z.object({
  type: z.literal('start-pipeline'),
  timestamp: z.number()
})

// Progress event
export const PipelineProgressEventSchema = z.object({
  progress: z.number(),
  completed: z.number(),
  total: z.number()
})
```
