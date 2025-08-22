// Transformer Abstraction Layer
// Provides clean API that hides Zod schema implementation

import type {
  DocumentTransformer,
  Document,
  TransformedDocument,
  TransformError
} from './interfaces.js'
import { transform as zodTransform } from '../transformer/index.js'
import type { TransformedDocument as ZodTransformedDocument } from '../ast/types.js'

/**
 * Convert clean interface document back to Zod format for internal processing
 * @param doc - Clean interface document
 * @returns Zod-compatible document
 */
function mapInterfaceToZodDocument(doc: Document): import('../ast/types.js').Document {
  return {
    type: doc.type,
    version: doc.version,
    slides: doc.slides.map(slide => ({
      type: slide.type,
      index: slide.index,
      ast: {
        type: slide.ast.type,
        children: slide.ast.children
      },
      slideCSS: slide.slideCSS
    })),
    globalCSS: doc.globalCSS
  }
}

/**
 * Convert Zod-transformed document to clean interface
 * @param zodDoc - Document from Zod transformer
 * @returns Clean transformed document interface
 */
function mapZodTransformedToInterface(zodDoc: ZodTransformedDocument): TransformedDocument {
  return {
    slides: zodDoc.slides.map(slide => ({
      html: slide.html,
      css: slide.css
    })),
    globalCSS: zodDoc.globalCSS
  }
}

/**
 * Create a clean transform error without exposing Zod
 * @param originalError - Original error from transformer
 * @returns Clean TransformError
 */
function createTransformError(originalError: unknown): TransformError {
  const message = originalError instanceof Error 
    ? originalError.message 
    : String(originalError)

  const error = new Error(message) as TransformError
  error.code = 'TRANSFORM_ERROR'
  error.phase = 'transform'
  error.context = originalError
  return error
}

/**
 * Default Curtains transformer implementation
 * Wraps the existing Zod-based transformer with clean interface
 */
export class CurtainsTransformer implements DocumentTransformer {
  /**
   * Transform document to HTML representation
   * @param document - Document to transform
   * @returns Transformed document with HTML and CSS
   * @throws TransformError if transformation fails
   */
  transform(document: Document): TransformedDocument {
    try {
      const zodDocument = mapInterfaceToZodDocument(document)
      const zodTransformed = zodTransform(zodDocument)
      return mapZodTransformedToInterface(zodTransformed)
    } catch (error) {
      throw createTransformError(error)
    }
  }
}

/**
 * Create a curtains transformer instance
 * @returns DocumentTransformer implementation
 */
export function createTransformer(): DocumentTransformer {
  return new CurtainsTransformer()
}

/**
 * Transform document to HTML with clean API
 * @param document - Document to transform
 * @returns Transformed document
 * @throws TransformError if transformation fails
 */
export function transformDocument(document: Document): TransformedDocument {
  const transformer = createTransformer()
  return transformer.transform(document)
}

/**
 * Check if document can be transformed
 * @param document - Document to check
 * @returns True if document can be transformed
 */
export function canTransform(document: Document): boolean {
  try {
    transformDocument(document)
    return true
  } catch {
    return false
  }
}