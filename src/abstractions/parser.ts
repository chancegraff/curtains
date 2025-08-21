// Parser Abstraction Layer
// Provides clean API that hides Zod schema implementation

import type { 
  MarkdownParser, 
  Document,
  ParseError
} from './interfaces.js'
import { parse as zodParse } from '../parser/index.js'
import type { CurtainsDocument, ASTNode as ZodASTNode } from '../ast/types.js'
import type { ASTNode } from './interfaces.js'

/**
 * Convert Zod AST nodes to clean interface nodes
 * @param zodNode - Zod AST node
 * @returns Clean interface AST node
 */
function mapZodNodeToInterface(zodNode: ZodASTNode): ASTNode {
  // Return as-is since the structures are compatible
  // TypeScript will validate the types match
  return zodNode as ASTNode
}

/**
 * Convert Zod-parsed document to clean interface
 * @param zodDoc - Document from Zod parser
 * @returns Clean document interface
 */
function mapZodDocumentToInterface(zodDoc: CurtainsDocument): Document {
  return {
    type: zodDoc.type,
    version: zodDoc.version,
    slides: zodDoc.slides.map(slide => ({
      type: slide.type,
      index: slide.index,
      ast: {
        type: slide.ast.type,
        children: slide.ast.children.map(mapZodNodeToInterface)
      },
      slideCSS: slide.slideCSS
    })),
    globalCSS: zodDoc.globalCSS
  }
}

/**
 * Create a clean parse error without exposing Zod
 * @param originalError - Original error from parser
 * @returns Clean ParseError
 */
function createParseError(originalError: unknown): ParseError {
  const message = originalError instanceof Error 
    ? originalError.message 
    : String(originalError)

  const error = new Error(message) as ParseError
  error.code = 'PARSE_ERROR'
  error.phase = 'parse'
  error.context = originalError
  return error
}

/**
 * Default Curtains parser implementation
 * Wraps the existing Zod-based parser with clean interface
 */
export class CurtainsParser implements MarkdownParser {
  /**
   * Parse curtains content into structured document
   * @param content - Raw curtains content
   * @returns Structured document
   * @throws ParseError if parsing fails
   */
  parse(content: string): Document {
    try {
      const zodDocument = zodParse(content)
      return mapZodDocumentToInterface(zodDocument)
    } catch (error) {
      throw createParseError(error)
    }
  }

  /**
   * Check if parser supports given format
   * @param format - Format identifier
   * @returns True if format is supported
   */
  supports(format: string): boolean {
    return format === 'curtains' || format === '.curtain'
  }
}

/**
 * Create a curtains parser instance
 * @returns MarkdownParser implementation
 */
export function createParser(): MarkdownParser {
  return new CurtainsParser()
}

/**
 * Parse curtains content with format detection
 * @param content - Content to parse
 * @param format - Optional format hint (defaults to 'curtains')
 * @returns Structured document
 * @throws ParseError if parsing fails or format unsupported
 */
export function parseContent(content: string, format = 'curtains'): Document {
  const parser = createParser()
  
  if (!parser.supports(format)) {
    const error = new Error(`Unsupported format: ${format}`) as ParseError
    error.code = 'PARSE_ERROR'
    error.phase = 'parse'
    error.context = { format, supportedFormats: ['curtains', '.curtain'] }
    throw error
  }

  return parser.parse(content)
}

/**
 * Check if content is valid curtains format
 * @param content - Content to validate
 * @returns True if content is valid
 */
export function isValidContent(content: string): boolean {
  try {
    parseContent(content)
    return true
  } catch {
    return false
  }
}