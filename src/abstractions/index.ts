// Abstraction Layer API
// Clean, functional API that hides implementation details

import { parseContent } from './parser.js'
import { transformDocument } from './transformer.js'
import type { MarkdownParser, DocumentTransformer } from './interfaces.js'

// Re-export clean interfaces
export type {
  Document,
  Slide,
  AST,
  ASTNode,
  TransformedDocument,
  TransformedSlide,
  MarkdownParser,
  DocumentTransformer,
  ParseError,
  TransformError,
  CurtainsError
} from './interfaces.js'

// Re-export parser functions
export {
  parseContent,
  isValidContent,
  createParser
} from './parser.js'

// Re-export transformer functions  
export {
  transformDocument,
  canTransform,
  createTransformer
} from './transformer.js'

/**
 * Parse and transform content in one step
 * @param content - Raw content to process
 * @param format - Format hint (defaults to 'curtains')
 * @returns Transformed document ready for rendering
 */
export function processContent(content: string, format = 'curtains'): import('./interfaces.js').TransformedDocument {
  const document = parseContent(content, format)
  return transformDocument(document)
}

/**
 * Check if content can be fully processed (parsed and transformed)
 * @param content - Content to check
 * @param format - Format hint (defaults to 'curtains')
 * @returns True if content can be processed
 */
export function canProcessContent(content: string, format = 'curtains'): boolean {
  try {
    processContent(content, format)
    return true
  } catch {
    return false
  }
}

/**
 * Get supported formats
 * @returns Array of supported format identifiers
 */
export function getSupportedFormats(): string[] {
  return ['curtains', '.curtain']
}

/**
 * Create a processing pipeline with custom parser and transformer
 * @param parser - Custom parser implementation
 * @param transformer - Custom transformer implementation
 * @returns Processing function
 */
export function createPipeline(
  parser: MarkdownParser,
  transformer: DocumentTransformer
) {
  return function process(content: string, format = 'curtains'): import('./interfaces.js').TransformedDocument {
    if (!parser.supports(format)) {
      throw new Error(`Parser does not support format: ${format}`)
    }
    
    const document = parser.parse(content)
    return transformer.transform(document)
  }
}