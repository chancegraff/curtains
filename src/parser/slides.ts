import { CurtainsSlideSchema } from '../ast/schemas.js'
import { REGEX } from '../config/constants.js'
import type { CurtainsSlide } from '../ast/types.js'
import { validateSlideIndex } from './validate.js'
import { extractStyles } from './styles.js'
import { parseContainers, buildAST } from './containers.js'
import { parseMarkdown } from './markdown.js'

export interface SlideParseInput {
  content: string
  index: number
}

/**
 * Splits input content into global content and slide contents
 * @param source - The raw input source
 * @returns Object containing global content and array of slide contents
 */
export function splitIntoSlides(source: string): { globalContent: string; slideContents: string[] } {
  const parts = source.split(REGEX.DELIMITER)
  const globalContent = parts[0] ?? ''
  const slideContents = parts.slice(1)
  
  return { globalContent, slideContents }
}

/**
 * Processes a single slide content into a complete slide object
 * @param slideInput - The slide content and index
 * @returns Complete CurtainsSlide object
 */
export function processSlide(slideInput: SlideParseInput): CurtainsSlide {
  const { content, index } = slideInput
  
  // Validate slide index
  validateSlideIndex(index)
  
  // Extract slide styles
  const extracted = extractStyles(content, 'slide')
  
  // Parse containers and markdown
  const { marked, containers } = parseContainers(extracted.content)
  const mdast = parseMarkdown(marked)
  const ast = buildAST(mdast, containers)
  
  // Validate and return slide
  return CurtainsSlideSchema.parse({
    type: 'curtains-slide',
    index,
    ast,
    slideCSS: extracted.styles.map(s => s.css).join('\n')
  })
}

/**
 * Processes multiple slides from content array
 * @param slideContents - Array of slide content strings
 * @returns Array of processed CurtainsSlide objects
 */
export function processSlides(slideContents: string[]): CurtainsSlide[] {
  return slideContents.map((content, index) => 
    processSlide({ content, index })
  )
}