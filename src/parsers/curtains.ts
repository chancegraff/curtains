import {
  CurtainsParserInterfaceSchema,
  ParserOptionsSchema,
  ParseResultSchema,
  DocumentASTSchema,
  SlideASTSchema,
  StyleExtractionSchema,
  ASTNodeSchema,
  type CurtainsParserInterface,
  type ParserOptions,
  type ParseResult,
  type DocumentAST,
  type SlideAST,
  type StyleExtraction
} from '../schemas/parsers'
import { ValidationResultSchema, type ValidationResult } from '../schemas/common'
import { createBaseParser } from './base'
import { createLogger } from '../utils/logger'
import {
  ContainerNodeSchema,
  TextNodeSchema,
  HeadingNodeSchema,
  ParagraphNodeSchema,
  ListNodeSchema,
  ListItemNodeSchema,
  LinkNodeSchema,
  ImageNodeSchema,
  CodeNodeSchema,
  TableNodeSchema,
  TableRowNodeSchema,
  TableCellNodeSchema,
  type ASTNode as CurtainsASTNode
} from '../schemas/ast'
import { trySync, type Result } from '../utils/result'

// Complex condition extractors
export function isValidSlideCount(count: number): boolean {
  return count >= 0 && count <= 1000
}

export function isValidSlideIndex(index: number): boolean {
  return index >= 0
}

export function isValidClassName(className: string): boolean {
  return Boolean(className) &&
         className.trim().length > 0 &&
         /^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(className.trim())
}

export function isValidNestingDepth(depth: number, maxDepth: number): boolean {
  return depth >= 0 && depth <= maxDepth
}

export function hasStyleTags(content: string): boolean {
  return /<style[\s\S]*?<\/style>/gi.test(content)
}

export function hasContainerTags(content: string): boolean {
  return /<container[\s\S]*?<\/container>/gi.test(content)
}

export function hasSlideDelimiters(content: string): boolean {
  return /^\s*===\s*$/m.test(content)
}

// Input normalizers
export function normalizeClassName(className: string): string {
  return className.trim()
}

export function normalizeSlideContent(content: string): string {
  return content.trim()
}

// Local validation functions with logger
function validateCurtainsInput(input: string, logger = createLogger(false)): void {
  logger.debug('Validating curtains input')

  if (typeof input !== 'string') {
    logger.error('Input validation failed: not a string')
    throw new Error('Input must be a string')
  }
  if (input.length === 0) {
    logger.warn('Input validation warning: empty input')
    throw new Error('Input cannot be empty')
  }

  logger.debug('Curtains input validation passed')
}

function validateSlideCount(count: number, logger = createLogger(false)): void {
  logger.debug(`Validating slide count: ${count}`)

  if (!isValidSlideCount(count)) {
    logger.error(`Invalid slide count: ${count}`)
    if (count < 0) {
      throw new Error('Slide count cannot be negative')
    }
    throw new Error('Too many slides (max 1000)')
  }

  logger.debug('Slide count validation passed')
}

function validateSlideIndex(index: number, logger = createLogger(false)): void {
  if (!isValidSlideIndex(index)) {
    logger.error(`Invalid slide index: ${index}`)
    throw new Error('Slide index cannot be negative')
  }
}

function validateClassName(className: string, logger = createLogger(false)): void {
  if (!isValidClassName(className)) {
    logger.error(`Invalid CSS class name: ${className}`)
    if (!className || className.trim().length === 0) {
      throw new Error('Class name cannot be empty')
    }
    throw new Error(`Invalid CSS class name: ${className}`)
  }
}

function validateNestingDepth(depth: number, maxDepth: number, logger = createLogger(false)): void {
  if (!isValidNestingDepth(depth, maxDepth)) {
    logger.error(`Invalid nesting depth: ${depth} (max: ${maxDepth})`)
    throw new Error('Nesting depth cannot be negative')
  }
}

// Constants for parsing
const SLIDE_DELIMITER_REGEX = /^\s*===\s*$/m
const STYLE_REGEX = /<style>([\s\S]*?)<\/style>/gi
const CONTAINER_REGEX = /<container\s*(?:class="([^"]*)")?>([\s\S]*?)<\/container>/gi

/**
 * Splits content into global section and slide sections
 */
export function splitContent(input: string, options: { splitSlides?: boolean; slideDelimiter?: string } = {}): { globalContent: string; slideContents: string[] } {
  const { splitSlides = true } = options

  if (!splitSlides) {
    return { globalContent: input, slideContents: [] }
  }

  const parts = input.split(SLIDE_DELIMITER_REGEX)
  const globalContent = parts[0] ?? ''
  const slideContents = parts.slice(1)

  return { globalContent, slideContents }
}

/**
 * Extracts styles from content and returns clean content with styles
 */
export function extractStyles(content: string, scope: 'global' | 'slide' = 'global', options: { extractStyles?: boolean } = {}): StyleExtraction {
  const { extractStyles: shouldExtract = true } = options
  const styles: Array<{ css: string; scope: 'global' | 'slide'; source?: string; line?: number }> = []

  if (!shouldExtract) {
    return StyleExtractionSchema.parse({
      content,
      styles: [],
      hasStyles: false
    })
  }

  let cleanContent = content
  let match: RegExpExecArray | null
  const regex = new RegExp(STYLE_REGEX.source, STYLE_REGEX.flags)

  while ((match = regex.exec(content)) !== null) {
    const css = match[1]?.trim() ?? ''
    if (css) {
      styles.push({
        css,
        scope,
        source: 'style-tag',
        line: content.substring(0, match.index).split('\n').length
      })
    }
  }

  // Remove style tags from content
  cleanContent = content.replace(STYLE_REGEX, '').trim()

  return StyleExtractionSchema.parse({
    content: cleanContent,
    styles,
    hasStyles: styles.length > 0
  })
}

/**
 * Extracts global styles from content
 */
export function extractGlobalStyles(input: string): string {
  const extraction = extractStyles(input, 'global')
  return extraction.styles.map(s => s.css).join('\n')
}

/**
 * Extracts slide-specific styles from content
 */
export function extractSlideStyles(slideContent: string): string {
  const extraction = extractStyles(slideContent, 'slide')
  return extraction.styles.map(s => s.css).join('\n')
}

/**
 * Converts base parser AST to Curtains AST format using Result type
 */
export function convertBaseASTToCurtainsAST(baseNode: unknown): Result<CurtainsASTNode, Error> {
  const parseResult = trySync(() => {
    const node = ASTNodeSchema.parse(baseNode)

    switch (node.type) {
      case 'text': {
        return TextNodeSchema.parse({
          type: 'text',
          value: node.value ?? '',
          bold: node.bold,
          italic: node.italic
        })
      }

      case 'heading': {
        const children: CurtainsASTNode[] = []
        if (node.children) {
          for (const child of node.children) {
            const childResult = convertBaseASTToCurtainsAST(child)
            if (childResult.success) {
              children.push(childResult.value)
            }
          }
        }
        return HeadingNodeSchema.parse({
          type: 'heading',
          depth: node.depth ?? 1,
          children
        })
      }

      case 'paragraph': {
        const children: CurtainsASTNode[] = []
        if (node.children) {
          for (const child of node.children) {
            const childResult = convertBaseASTToCurtainsAST(child)
            if (childResult.success) {
              children.push(childResult.value)
            }
          }
        }
        if (children.length === 0) {
          throw new Error('Paragraph has no valid children')
        }

        return ParagraphNodeSchema.parse({
          type: 'paragraph',
          children
        })
      }

      case 'list': {
        const children: CurtainsASTNode[] = []
        if (node.children) {
          for (const child of node.children) {
            const childResult = convertBaseASTToCurtainsAST(child)
            if (childResult.success) {
              children.push(childResult.value)
            }
          }
        }
        return ListNodeSchema.parse({
          type: 'list',
          ordered: node.ordered ?? false,
          children
        })
      }

      case 'listItem': {
        const children: CurtainsASTNode[] = []
        if (node.children) {
          for (const child of node.children) {
            const childResult = convertBaseASTToCurtainsAST(child)
            if (childResult.success) {
              children.push(childResult.value)
            }
          }
        }
        return ListItemNodeSchema.parse({
          type: 'listItem',
          children
        })
      }

      case 'link': {
        const children: CurtainsASTNode[] = []
        if (node.children) {
          for (const child of node.children) {
            const childResult = convertBaseASTToCurtainsAST(child)
            if (childResult.success) {
              children.push(childResult.value)
            }
          }
        }
        return LinkNodeSchema.parse({
          type: 'link',
          url: node.url ?? '',
          children
        })
      }

      case 'image': {
        return ImageNodeSchema.parse({
          type: 'image',
          url: node.url ?? '',
          alt: node.alt,
          title: node.title,
          classes: node.classes
        })
      }

      case 'code': {
        return CodeNodeSchema.parse({
          type: 'code',
          value: node.value ?? '',
          lang: node.lang
        })
      }

      case 'table': {
        const children: CurtainsASTNode[] = []
        if (node.children) {
          for (const child of node.children) {
            const childResult = convertBaseASTToCurtainsAST(child)
            if (childResult.success) {
              children.push(childResult.value)
            }
          }
        }
        return TableNodeSchema.parse({
          type: 'table',
          children
        })
      }

      case 'tableRow': {
        const children: CurtainsASTNode[] = []
        if (node.children) {
          for (const child of node.children) {
            const childResult = convertBaseASTToCurtainsAST(child)
            if (childResult.success) {
              children.push(childResult.value)
            }
          }
        }
        return TableRowNodeSchema.parse({
          type: 'tableRow',
          children
        })
      }

      case 'tableCell': {
        const children: CurtainsASTNode[] = []
        if (node.children) {
          for (const child of node.children) {
            const childResult = convertBaseASTToCurtainsAST(child)
            if (childResult.success) {
              children.push(childResult.value)
            }
          }
        }
        return TableCellNodeSchema.parse({
          type: 'tableCell',
          header: node.header,
          align: node.align,
          children
        })
      }

      default:
        // For unknown nodes, try to extract text content
        if (node.value) {
          return TextNodeSchema.parse({
            type: 'text',
            value: node.value
          })
        }
        throw new Error(`Unknown node type: ${node.type}`)
    }
  })

  return parseResult
}

/**
 * Legacy wrapper for backward compatibility - converts Result to nullable
 */
export function convertBaseASTToCurtainsASTLegacy(baseNode: unknown): CurtainsASTNode | null {
  const result = convertBaseASTToCurtainsAST(baseNode)
  return result.success ? result.value : null
}

/**
 * Parses markdown content into AST nodes using the base parser
 */
export function parseMarkdownContent(content: string, baseParser: { parse: (input: string) => unknown }): CurtainsASTNode[] {
  if (!content.trim()) {
    return []
  }

  // Use base parser to get basic markdown parsing
  const parseResult = baseParser.parse(content)
  const typedResult = ParseResultSchema.parse(parseResult)

  // Extract nodes from the document AST and convert to Curtains AST format
  if (typedResult.ast?.children) {
    const nodes: CurtainsASTNode[] = []
    for (const child of typedResult.ast.children) {
      const result = convertBaseASTToCurtainsAST(child)
      if (result.success) {
        nodes.push(result.value)
      }
    }
    return nodes
  }

  return []
}

/**
 * Parses content into AST nodes, handling containers recursively
 */
export function parseContentIntoAST(
  content: string,
  depth: number,
  options: { maxNestingDepth?: number; validateContainers?: boolean },
  baseParser: { parse: (input: string) => unknown }
): CurtainsASTNode[] {
  const { maxNestingDepth = 10, validateContainers = true } = options

  if (depth > maxNestingDepth) {
    throw new Error(`Container nesting too deep (max ${maxNestingDepth})`)
  }

  const result: CurtainsASTNode[] = []
  let remainingContent = content
  let match: RegExpExecArray | null
  const containerRegex = new RegExp(CONTAINER_REGEX.source, CONTAINER_REGEX.flags)

  while ((match = containerRegex.exec(remainingContent)) !== null) {
    const beforeContainer = remainingContent.substring(0, match.index).trim()

    // Process content before container
    if (beforeContainer) {
      const beforeNodes = parseMarkdownContent(beforeContainer, baseParser)
      result.push(...beforeNodes)
    }

    // Process container
    const classesStr = match[1] ?? ''
    const containerContent = match[2] ?? ''
    const classes = classesStr.split(/\s+/).filter(Boolean).map(normalizeClassName)

    // Validate classes
    if (validateContainers) {
      classes.forEach(className => validateClassName(className))
      validateNestingDepth(depth + 1, maxNestingDepth)
    }

    // Recursively parse container content
    const containerChildren = parseContentIntoAST(containerContent.trim(), depth + 1, options, baseParser)

    const containerNode: CurtainsASTNode = ContainerNodeSchema.parse({
      type: 'container',
      classes,
      children: containerChildren
    })

    result.push(containerNode)

    // Update remaining content
    remainingContent = remainingContent.substring(match.index + match[0].length)
    containerRegex.lastIndex = 0
  }

  // Process remaining content
  if (remainingContent.trim()) {
    const remainingNodes = parseMarkdownContent(remainingContent.trim(), baseParser)
    result.push(...remainingNodes)
  }

  return result
}

/**
 * Parses containers in content recursively
 */
export function parseContainers(
  content: string,
  options: { allowContainers?: boolean; maxNestingDepth?: number; validateContainers?: boolean } = {},
  baseParser: { parse: (input: string) => unknown }
): CurtainsASTNode[] {
  const { allowContainers = true } = options

  if (!allowContainers) {
    return parseMarkdownContent(content, baseParser)
  }

  return parseContentIntoAST(content, 0, options, baseParser)
}

/**
 * Parses slides from slide contents array
 */
export function parseSlides(
  input: string,
  options: { splitSlides?: boolean; allowContainers?: boolean; maxNestingDepth?: number; validateContainers?: boolean } = {},
  baseParser: { parse: (input: string) => unknown }
): SlideAST[] {
  const { slideContents } = splitContent(input, options)

  // If no slide separators found, treat entire content as one slide
  const actualSlideContents = slideContents.length > 0 ? slideContents : [input]

  validateSlideCount(actualSlideContents.length)

  return actualSlideContents.map((slideContent, index) => {
    validateSlideIndex(index)

    const normalizedContent = normalizeSlideContent(slideContent)
    const slideStyles = extractSlideStyles(normalizedContent)
    const styleExtraction = extractStyles(normalizedContent, 'slide')
    const slideAST = parseContainers(styleExtraction.content, options, baseParser)

    return SlideASTSchema.parse({
      type: 'slide',
      index,
      children: slideAST,
      slideCSS: slideStyles,
      metadata: {
        classes: [],
        duration: undefined,
        transition: undefined
      }
    })
  })
}

/**
 * Validates nesting structure of containers
 */
export function validateNesting(ast: unknown, options: { maxNestingDepth?: number; debug?: boolean } = {}): ValidationResult {
  const { maxNestingDepth = 10 } = options
  const errors: string[] = []
  const warnings: string[] = []

  const validateNode = (node: unknown, depth: number = 0): void => {
    try {
      const validatedNode = ASTNodeSchema.parse(node)

      if (validatedNode.type === 'container') {
        if (depth > maxNestingDepth) {
          errors.push(`Container nesting too deep at depth ${depth} (max ${maxNestingDepth})`)
        }

        if (validatedNode.classes && validatedNode.classes.length === 0) {
          warnings.push('Container has no classes specified')
        }

        if (validatedNode.children) {
          validatedNode.children.forEach(child => validateNode(child, depth + 1))
        }
      } else if (validatedNode.children) {
        validatedNode.children.forEach(child => validateNode(child, depth))
      }
    } catch (parseError) {
      errors.push(`Invalid AST node structure: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
    }
  }

  validateNode(ast)

  return ValidationResultSchema.parse({
    isValid: errors.length === 0,
    errors,
    warnings
  })
}

/**
 * Gets statistics from a parse result
 */
export function getStatistics(parseResult: unknown, options: { debug?: boolean } = {}): { totalSlides: number; totalContainers: number; maxNestingDepth: number; styleBlocks: number; imageCount: number; linkCount: number } {
  const { debug = false } = options

  try {
    const result = ParseResultSchema.parse(parseResult)

    const countNodes = (nodes: unknown[], type: string): number => {
      let count = 0
      for (const node of nodes) {
        try {
          const validatedNode = ASTNodeSchema.parse(node)
          if (validatedNode.type === type) {
            count++
          }
          if (validatedNode.children) {
            count += countNodes(validatedNode.children, type)
          }
        } catch (error) {
          // Skip invalid nodes - log for debugging if needed
          if (debug) {
            const logger = createLogger(debug)
            logger.warn('Invalid AST node encountered during counting:', error instanceof Error ? error.message : 'Unknown error')
          }
        }
      }
      return count
    }

    const calculateMaxDepth = (nodes: unknown[], depth: number = 0): number => {
      let maxDepth = depth
      for (const node of nodes) {
        try {
          const validatedNode = ASTNodeSchema.parse(node)
          if (validatedNode.children) {
            maxDepth = Math.max(maxDepth, calculateMaxDepth(validatedNode.children, depth + 1))
          }
        } catch (error) {
          // Skip invalid nodes - log for debugging if needed
          if (debug) {
            const logger = createLogger(debug)
            logger.warn('Invalid AST node encountered during depth calculation:', error instanceof Error ? error.message : 'Unknown error')
          }
        }
      }
      return maxDepth
    }

    const allNodes = result.slides.flatMap(slide => slide.children ?? [])

    return {
      totalSlides: result.slides.length,
      totalContainers: countNodes(allNodes, 'container'),
      maxNestingDepth: calculateMaxDepth(allNodes),
      styleBlocks: result.slides.reduce((sum, slide) => {
        const cssLines = (slide.slideCSS ?? '').split('\n').filter(line => line.trim())
        return sum + cssLines.length
      }, 0),
      imageCount: countNodes(allNodes, 'image'),
      linkCount: countNodes(allNodes, 'link')
    }
  } catch {
    return {
      totalSlides: 0,
      totalContainers: 0,
      maxNestingDepth: 0,
      styleBlocks: 0,
      imageCount: 0,
      linkCount: 0
    }
  }
}

/**
 * Creates a Curtains-specific parser that extends the base parser
 * with container and slide processing capabilities
 */
export function createCurtainsParser(): CurtainsParserInterface {
  const baseParser = createBaseParser()
  let currentOptions: ParserOptions = ParserOptionsSchema.parse({
    debug: false,
    strict: true,
    timeout: 30000,
    preserveWhitespace: false,
    allowHTML: true,
    allowContainers: true,
    allowStyles: true,
    maxNestingDepth: 10,
    maxInputSize: 10485760,
    validateContainers: true,
    extractStyles: true,
    splitSlides: true,
    slideDelimiter: '===',
    customElements: {},
    plugins: []
  })

  /**
   * Main parse function that processes Curtains documents
   */
  const parse = (input: string, options?: unknown): ParseResult => {
    const logger = createLogger(currentOptions.debug)
    logger.debug('Starting Curtains document parsing')

    // Merge options if provided
    if (options) {
      const newOptions = ParserOptionsSchema.partial().parse(options)
      currentOptions = ParserOptionsSchema.parse({ ...currentOptions, ...newOptions })
      logger.debug('Merged parsing options')
    }

    // Validate and normalize input
    validateCurtainsInput(input, logger)
    const normalizedInput = normalizeSlideContent(input)
    logger.debug(`Input validation passed - length: ${normalizedInput.length}`)

    const startTime = Date.now()

    try {
      // Split content using extracted function
      logger.debug('Splitting content into global and slide sections')
      const { globalContent } = splitContent(normalizedInput, currentOptions)

      // Extract global styles using extracted function
      logger.debug('Extracting global styles')
      const globalStyleExtraction = extractStyles(globalContent, 'global', currentOptions)
      const globalStyles = globalStyleExtraction.styles.map(s => s.css).join('\n')
      logger.debug(`Extracted ${globalStyleExtraction.styles.length} global styles`)

      // Parse slides using extracted function
      logger.debug('Parsing slides')
      const slides = parseSlides(normalizedInput, currentOptions, baseParser)
      logger.debug(`Parsed ${slides.length} slides`)

      // Build document AST
      const allSlideNodes = slides.flatMap(slide => slide.children ?? [])
      const documentAST: DocumentAST = DocumentASTSchema.parse({
        type: 'document',
        children: allSlideNodes,
        metadata: {
          version: '1.0.0'
        },
        globalStyles
      })

      const parseTime = Date.now() - startTime
      logger.debug(`Parsing completed in ${parseTime}ms`)

      const result: ParseResult = ParseResultSchema.parse({
        ast: documentAST,
        slides,
        globalStyles,
        metadata: {},
        errors: [],
        warnings: [],
        statistics: {
          totalSlides: slides.length,
          totalContainers: getStatistics({ slides }, currentOptions).totalContainers,
          maxNestingDepth: getStatistics({ slides }, currentOptions).maxNestingDepth,
          parseTime,
          inputSize: input.length
        }
      })

      logger.debug('Parse result successfully created')
      return result
    } catch (error) {
      const parseTime = Date.now() - startTime
      logger.error(`Parsing failed after ${parseTime}ms: ${error instanceof Error ? error.message : 'Unknown error'}`)

      throw ParseResultSchema.parse({
        ast: DocumentASTSchema.parse({
          type: 'document',
          children: [],
          metadata: { version: '1.0.0' }
        }),
        slides: [],
        globalStyles: '',
        metadata: {},
        errors: [error instanceof Error ? error.message : 'Unknown parsing error'],
        warnings: [],
        statistics: {
          totalSlides: 0,
          totalContainers: 0,
          maxNestingDepth: 0,
          parseTime,
          inputSize: input.length
        }
      })
    }
  }

  // Create the Curtains parser interface
  const curtainsParser: CurtainsParserInterface = {
    // Base parser methods
    parse,
    supports: baseParser.supports,
    validate: baseParser.validate,
    getCapabilities: () => ({
      ...baseParser.getCapabilities(),
      supportsContainers: true,
      supportsStyles: true,
      supportsFrontmatter: false
    }),
    configure: (options: unknown) => {
      baseParser.configure(options)
      const newOptions = ParserOptionsSchema.partial().parse(options)
      currentOptions = ParserOptionsSchema.parse({ ...currentOptions, ...newOptions })
    },
    reset: () => {
      baseParser.reset()
      currentOptions = ParserOptionsSchema.parse({
        debug: false,
        strict: true,
        timeout: 30000,
        preserveWhitespace: false,
        allowHTML: true,
        allowContainers: true,
        allowStyles: true,
        maxNestingDepth: 10,
        maxInputSize: 10485760,
        validateContainers: true,
        extractStyles: true,
        splitSlides: true,
        slideDelimiter: '===',
        customElements: {},
        plugins: []
      })
    },

    // Curtains-specific methods using extracted functions
    parseSlides: (input: string, options?: unknown) => {
      const parsedOptions = options ? ParserOptionsSchema.partial().parse(options) : {}
      const finalOptions = {
        splitSlides: parsedOptions.splitSlides ?? currentOptions.splitSlides,
        allowContainers: parsedOptions.allowContainers ?? currentOptions.allowContainers,
        maxNestingDepth: parsedOptions.maxNestingDepth ?? currentOptions.maxNestingDepth,
        validateContainers: parsedOptions.validateContainers ?? currentOptions.validateContainers
      }
      return parseSlides(input, finalOptions, baseParser)
    },
    extractGlobalStyles: (input: string) => extractGlobalStyles(input),
    extractSlideStyles: (slideContent: string) => extractSlideStyles(slideContent),
    parseContainers: (content: string) => {
      const options = {
        allowContainers: currentOptions.allowContainers,
        maxNestingDepth: currentOptions.maxNestingDepth,
        validateContainers: currentOptions.validateContainers
      }
      return parseContainers(content, options, baseParser)
    },
    splitContent: (input: string) => splitContent(input, { splitSlides: currentOptions.splitSlides }),
    validateNesting: (ast: unknown) => validateNesting(ast, { maxNestingDepth: currentOptions.maxNestingDepth }),
    getStatistics: (parseResult: unknown) => getStatistics(parseResult, { debug: currentOptions.debug })
  }

  return CurtainsParserInterfaceSchema.parse(curtainsParser)
}
