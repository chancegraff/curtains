import { z } from 'zod'
import {
  ParserPluginInterfaceSchema,
  ParserContextSchema,
  ASTNodeSchema,
  type ParserPluginInterface,
  type BaseASTNode,
  type ParserContext
} from '../schemas/parsers'
import { ValidationResultSchema, type ValidationResult } from '../schemas/common'

// Plugin creation options schema
const PluginOptionsSchema = z.object({
  enabled: z.boolean().default(true),
  priority: z.number().default(0),
  debug: z.boolean().default(false),
  options: z.record(z.string(), z.unknown()).default({})
})

type PluginOptions = z.infer<typeof PluginOptionsSchema>

// Plugin hook function types
type PreProcessorFn = (input: string, context: ParserContext) => string
type PostProcessorFn = (ast: BaseASTNode, context: ParserContext) => BaseASTNode
type NodeParserFn = (node: unknown, context: ParserContext) => BaseASTNode
type ValidatorFn = (node: BaseASTNode) => ValidationResult
type InitializerFn = (parser: unknown) => void
type CleanupFn = () => void

// Plugin definition for creation
type PluginDefinition = {
  name: string
  version: string
  description?: string
  preProcess?: PreProcessorFn
  postProcess?: PostProcessorFn
  parseNode?: NodeParserFn
  validateNode?: ValidatorFn
  initialize?: InitializerFn
  cleanup?: CleanupFn
}

/**
 * Creates a parser plugin with the specified definition
 */
export function createParserPlugin(
  definition: PluginDefinition,
  options: Partial<PluginOptions> = {}
): ParserPluginInterface {
  PluginOptionsSchema.parse(options)

  const plugin = {
    name: definition.name,
    version: definition.version,
    description: definition.description,
    initialize: definition.initialize ?? ((_parser: unknown): void => {}),
    preProcess: definition.preProcess ? (input: string, context: unknown): string => {
      const typedContext = ParserContextSchema.parse(context)
      if (definition.preProcess) {
        return definition.preProcess(input, typedContext)
      }
      return input
    } : undefined,
    postProcess: definition.postProcess ? (ast: unknown, context: unknown): unknown => {
      const typedAST = ASTNodeSchema.parse(ast)
      const typedContext = ParserContextSchema.parse(context)
      if (definition.postProcess) {
        return definition.postProcess(typedAST, typedContext)
      }
      return ast
    } : undefined,
    parseNode: definition.parseNode ? (node: unknown, context: unknown): unknown => {
      const typedContext = ParserContextSchema.parse(context)
      if (definition.parseNode) {
        return definition.parseNode(node, typedContext)
      }
      return node
    } : undefined,
    validateNode: definition.validateNode ? (node: unknown): ValidationResult => {
      const typedNode = ASTNodeSchema.parse(node)
      if (definition.validateNode) {
        return definition.validateNode(typedNode)
      }
      return { isValid: true, errors: [], warnings: [] }
    } : undefined,
    cleanup: definition.cleanup
  }

  return ParserPluginInterfaceSchema.parse(plugin)
}

/**
 * Composes multiple plugins into a single plugin that applies them in sequence
 */
export function composeParserPlugins(
  name: string,
  version: string,
  plugins: ParserPluginInterface[]
): ParserPluginInterface {
  const composedPlugin: ParserPluginInterface = {
    name,
    version,
    description: `Composed plugin containing: ${plugins.map(p => p.name).join(', ')}`,

    initialize: (parser: unknown): void => {
      for (const plugin of plugins) {
        plugin.initialize(parser)
      }
    },

    preProcess: plugins.some(p => p.preProcess)
      ? (input: string, context: unknown): string => {
          const typedContext = ParserContextSchema.parse(context)
          let result = input
          for (const plugin of plugins) {
            if (plugin.preProcess) {
              result = plugin.preProcess(result, typedContext)
            }
          }
          return result
        }
      : undefined,

    postProcess: plugins.some(p => p.postProcess)
      ? (ast: unknown, context: unknown): unknown => {
          const typedAST = ASTNodeSchema.parse(ast)
          const typedContext = ParserContextSchema.parse(context)
          let result = typedAST
          for (const plugin of plugins) {
            if (plugin.postProcess) {
              const pluginResult = plugin.postProcess(result, typedContext)
              result = ASTNodeSchema.parse(pluginResult)
            }
          }
          return result
        }
      : undefined,

    parseNode: plugins.find(p => p.parseNode)?.parseNode,

    validateNode: plugins.some(p => p.validateNode)
      ? (node: unknown): ValidationResult => {
          const typedNode = ASTNodeSchema.parse(node)
          const errors: string[] = []
          const warnings: string[] = []

          for (const plugin of plugins) {
            if (plugin.validateNode) {
              const result = plugin.validateNode(typedNode)
              errors.push(...result.errors)
              warnings.push(...result.warnings)
            }
          }

          return {
            isValid: errors.length === 0,
            errors,
            warnings
          }
        }
      : undefined,

    cleanup: (): void => {
      for (const plugin of plugins) {
        if (plugin.cleanup) {
          plugin.cleanup()
        }
      }
    }
  }

  return ParserPluginInterfaceSchema.parse(composedPlugin)
}

/**
 * Validates that a plugin conforms to the expected interface
 */
export function validatePlugin(plugin: unknown): ValidationResult {
  try {
    ParserPluginInterfaceSchema.parse(plugin)
    return ValidationResultSchema.parse({
      isValid: true,
      errors: [],
      warnings: []
    })
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ')
      : 'Invalid plugin structure'

    return ValidationResultSchema.parse({
      isValid: false,
      errors: [message],
      warnings: []
    })
  }
}

/**
 * Creates a plugin registry for managing multiple plugins
 */
export function createPluginRegistry(): {
  register: (plugin: ParserPluginInterface) => boolean
  unregister: (name: string) => boolean
  get: (name: string) => ParserPluginInterface | null
  list: () => string[]
  getAll: () => ParserPluginInterface[]
  validate: (name?: string) => ValidationResult
} {
  const plugins = new Map<string, ParserPluginInterface>()

  const register = (plugin: ParserPluginInterface): boolean => {
    const validation = validatePlugin(plugin)
    if (!validation.isValid) {
      return false
    }

    plugins.set(plugin.name, plugin)
    return true
  }

  const unregister = (name: string): boolean => {
    const plugin = plugins.get(name)
    if (!plugin) {
      return false
    }

    if (plugin.cleanup) {
      plugin.cleanup()
    }

    return plugins.delete(name)
  }

  const get = (name: string): ParserPluginInterface | null => {
    return plugins.get(name) ?? null
  }

  const list = (): string[] => {
    return Array.from(plugins.keys())
  }

  const getAll = (): ParserPluginInterface[] => {
    return Array.from(plugins.values())
  }

  const validate = (name?: string): ValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []

    const pluginsToValidate = name ? [plugins.get(name)].filter(Boolean) : Array.from(plugins.values())

    for (const plugin of pluginsToValidate) {
      if (plugin) {
        const validation = validatePlugin(plugin)
        if (!validation.isValid) {
          errors.push(`Plugin ${plugin.name}: ${validation.errors.join('; ')}`)
        }
        warnings.push(...validation.warnings)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  return { register, unregister, get, list, getAll, validate }
}

// ========== BUILT-IN PARSER PLUGINS ==========

/**
 * Plugin for parsing YAML/JSON frontmatter at the beginning of documents
 */
export function createFrontmatterPlugin(): ParserPluginInterface {
  return createParserPlugin({
    name: 'frontmatter',
    version: '1.0.0',
    description: 'Extracts YAML/JSON frontmatter from documents',

    preProcess: (input: string, context: ParserContext): string => {
      // Look for frontmatter delimited by --- or +++
      const frontmatterRegex = /^(---|\+\+\+)\n([\s\S]*?)\n(---|\+\+\+)\n/
      const match = input.match(frontmatterRegex)

      if (match) {
        const [fullMatch, delimiter, frontmatterContent] = match

        try {
          let metadata: Record<string, unknown>

          if (delimiter === '+++') {
            // TOML frontmatter (simplified parsing)
            metadata = parseTOML(frontmatterContent ?? '')
          } else {
            // YAML frontmatter (simplified parsing)
            metadata = parseYAML(frontmatterContent ?? '')
          }

          // Store in context
          context.metadata.frontmatter = metadata

          // Remove frontmatter from content
          return input.replace(fullMatch, '')
        } catch (error) {
          context.warnings.push(`Failed to parse frontmatter: ${error instanceof Error ? error.message : 'Unknown error'}`)
          return input
        }
      }

      return input
    }
  })
}

/**
 * Plugin for handling math expressions with $$...$$ syntax
 */
export function createMathPlugin(): ParserPluginInterface {
  return createParserPlugin({
    name: 'math',
    version: '1.0.0',
    description: 'Processes math expressions in $$...$$ blocks',

    preProcess: (input: string, _context: ParserContext): string => {
      // Replace math blocks with code blocks to prevent interference with other parsing
      let processedInput = input

      // Handle block math $$...$$
      processedInput = processedInput.replace(/\$\$([\s\S]*?)\$\$/g, (_match, mathContent) => {
        return `\n\`\`\`math\n${mathContent.trim()}\n\`\`\`\n`
      })

      // Handle inline math $...$
      processedInput = processedInput.replace(/\$([^$\n]+)\$/g, (_match, mathContent) => {
        return `\`${mathContent}\``
      })

      return processedInput
    },

    postProcess: (ast: BaseASTNode, _context: ParserContext): BaseASTNode => {
      // Process the AST to identify and mark math nodes
      const processMathNodes = (node: BaseASTNode): BaseASTNode => {
        if (node.type === 'code' && node.lang === 'math') {
          return {
            ...node,
            type: 'code',
            lang: 'math',
            classes: [...(node.classes ?? []), 'math-block']
          }
        }

        if (node.children) {
          return {
            ...node,
            children: node.children.map(processMathNodes)
          }
        }

        return node
      }

      return processMathNodes(ast)
    }
  })
}

/**
 * Plugin for custom container syntax ::: type
 */
export function createCustomContainerPlugin(): ParserPluginInterface {
  return createParserPlugin({
    name: 'custom-container',
    version: '1.0.0',
    description: 'Processes custom container syntax ::: type',

    preProcess: (input: string, _context: ParserContext): string => {
      // Convert custom container syntax to standard container format
      let processedInput = input

      // Match ::: containerType optional-title
      const containerRegex = /^:::(\w+)(?:\s+(.+))?\n([\s\S]*?)^:::\s*$/gm

      processedInput = processedInput.replace(containerRegex, (_match, containerType, title, content) => {
        const titleAttr = title ? ` title="${title.trim()}"` : ''
        return `<div class="${containerType}"${titleAttr}>\n${content.trim()}\n</div>`
      })

      return processedInput
    }
  })
}

/**
 * Plugin for extracting and processing document metadata
 */
export function createMetadataPlugin(): ParserPluginInterface {
  return createParserPlugin({
    name: 'metadata',
    version: '1.0.0',
    description: 'Extracts and processes document metadata from various sources',

    postProcess: (ast: BaseASTNode, context: ParserContext): BaseASTNode => {
      const metadata: Record<string, unknown> = {}

      // Extract title from first heading
      const extractTitle = (node: BaseASTNode): string | null => {
        if (node.type === 'heading' && node.depth === 1) {
          return extractTextFromNode(node)
        }

        if (node.children) {
          for (const child of node.children) {
            const title = extractTitle(child)
            if (title) return title
          }
        }

        return null
      }

      // Count various elements
      const countNodes = (node: BaseASTNode, type: string): number => {
        let count = node.type === type ? 1 : 0
        if (node.children) {
          for (const child of node.children) {
            count += countNodes(child, type)
          }
        }
        return count
      }

      // Extract metadata
      metadata.title = extractTitle(ast)
      metadata.slideCount = countNodes(ast, 'slide')
      metadata.imageCount = countNodes(ast, 'image')
      metadata.linkCount = countNodes(ast, 'link')
      metadata.codeBlockCount = countNodes(ast, 'code')
      metadata.wordCount = estimateWordCount(ast)
      metadata.extractedAt = new Date().toISOString()

      // Merge with existing metadata
      Object.assign(context.metadata, metadata)

      // Add metadata to document if it's a document node
      if (ast.type === 'document') {
        // Store metadata in context only, as BaseASTNode doesn't include metadata
        // The consuming parser will handle metadata placement in DocumentAST
        return ast
      }

      return ast
    }
  })
}

/**
 * Plugin for handling code highlighting and language detection
 */
export function createCodeHighlightPlugin(): ParserPluginInterface {
  return createParserPlugin({
    name: 'code-highlight',
    version: '1.0.0',
    description: 'Processes code blocks for syntax highlighting',

    postProcess: (ast: BaseASTNode, _context: ParserContext): BaseASTNode => {
      const processCodeNodes = (node: BaseASTNode): BaseASTNode => {
        if (node.type === 'code') {
          const lang = node.lang ?? detectLanguage(node.value ?? '')
          return {
            ...node,
            lang,
            classes: [...(node.classes ?? []), 'highlight', `language-${lang}`],
            attributes: {
              ...(node.attributes ?? {}),
              'data-language': lang
            }
          }
        }

        if (node.children) {
          return {
            ...node,
            children: node.children.map(processCodeNodes)
          }
        }

        return node
      }

      return processCodeNodes(ast)
    }
  })
}

/**
 * Plugin for processing and optimizing images
 */
export function createImagePlugin(): ParserPluginInterface {
  return createParserPlugin({
    name: 'image-processor',
    version: '1.0.0',
    description: 'Processes and optimizes image nodes',

    postProcess: (ast: BaseASTNode, _context: ParserContext): BaseASTNode => {
      const processImageNodes = (node: BaseASTNode): BaseASTNode => {
        if (node.type === 'image') {
          const classes = [...(node.classes ?? [])]
          const attributes = { ...(node.attributes ?? {}) }

          // Add lazy loading
          attributes.loading = 'lazy'

          // Add responsive classes based on URL patterns
          if (node.url?.includes('large') || node.url?.includes('banner')) {
            classes.push('responsive', 'large-image')
          } else {
            classes.push('responsive')
          }

          // Set alt text if missing
          const alt = node.alt ?? 'Image'

          return {
            ...node,
            alt,
            classes,
            attributes
          }
        }

        if (node.children) {
          return {
            ...node,
            children: node.children.map(processImageNodes)
          }
        }

        return node
      }

      return processImageNodes(ast)
    }
  })
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Simple YAML parser for frontmatter (basic implementation)
 */
function parseYAML(content: string): Record<string, unknown> {
  const metadata: Record<string, unknown> = {}
  const lines = content.trim().split('\n')

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/)
    if (match) {
      const [, key, value] = match
      if (key && value) {
        metadata[key] = parseYAMLValue(value.trim())
      }
    }
  }

  return metadata
}

/**
 * Simple TOML parser for frontmatter (basic implementation)
 */
function parseTOML(content: string): Record<string, unknown> {
  const metadata: Record<string, unknown> = {}
  const lines = content.trim().split('\n')

  for (const line of lines) {
    const match = line.match(/^(\w+)\s*=\s*(.+)$/)
    if (match) {
      const [, key, value] = match
      if (key && value) {
        metadata[key] = parseTOMLValue(value.trim())
      }
    }
  }

  return metadata
}

/**
 * Parse YAML value with basic type detection
 */
function parseYAMLValue(value: string): unknown {
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }

  // Boolean
  if (value === 'true') return true
  if (value === 'false') return false

  // Number
  const num = Number(value)
  if (!isNaN(num)) return num

  // Array (simple)
  if (value.startsWith('[') && value.endsWith(']')) {
    const items = value.slice(1, -1).split(',').map(item => item.trim())
    return items.map(parseYAMLValue)
  }

  return value
}

/**
 * Parse TOML value with basic type detection
 */
function parseTOMLValue(value: string): unknown {
  // String
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1)
  }

  // Boolean
  if (value === 'true') return true
  if (value === 'false') return false

  // Number
  const num = Number(value)
  if (!isNaN(num)) return num

  return value
}

/**
 * Extract text content from an AST node
 */
function extractTextFromNode(node: BaseASTNode): string {
  if (node.type === 'text' && node.value) {
    return node.value
  }

  if (node.children) {
    return node.children.map(extractTextFromNode).join('')
  }

  return ''
}

/**
 * Estimate word count from AST
 */
function estimateWordCount(ast: BaseASTNode): number {
  const text = extractTextFromNode(ast)
  return text.split(/\s+/).filter(word => word.length > 0).length
}

/**
 * Simple language detection for code blocks
 */
function detectLanguage(code: string): string {
  if (code.includes('function') && code.includes('{')) return 'javascript'
  if (code.includes('def ') && code.includes(':')) return 'python'
  if (code.includes('class ') && code.includes('public')) return 'java'
  if (code.includes('#include') || code.includes('int main')) return 'cpp'
  if (code.includes('<html>') || code.includes('<div>')) return 'html'
  if (code.includes('SELECT') || code.includes('FROM')) return 'sql'
  if (code.includes('import ') && code.includes('from ')) return 'python'
  if (code.includes('const ') && code.includes('=>')) return 'javascript'

  return 'text'
}

/**
 * Creates a default plugin set with commonly used plugins
 */
export function createDefaultPluginSet(): ParserPluginInterface[] {
  return [
    createFrontmatterPlugin(),
    createMathPlugin(),
    createCustomContainerPlugin(),
    createMetadataPlugin(),
    createCodeHighlightPlugin(),
    createImagePlugin()
  ]
}
