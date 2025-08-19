import { z } from 'zod'
import { REGEX } from '../config/constants.js'

// Style extraction result schema
const ExtractedStyleSchema = z.object({
  content: z.string(),
  styles: z.array(z.object({
    css: z.string(),
    scope: z.enum(['global', 'slide'])
  }))
})

export type ExtractedStyle = z.infer<typeof ExtractedStyleSchema>

/**
 * Extracts style blocks from content and returns cleaned content with extracted styles
 * @param content - The raw content containing style blocks
 * @param scope - Whether styles are 'global' or 'slide' scoped
 * @returns Object containing cleaned content and extracted styles
 */
export function extractStyles(
  content: string,
  scope: 'global' | 'slide'
): ExtractedStyle {
  const styles: Array<{ css: string; scope: 'global' | 'slide' }> = []
  
  const clean = content.replace(REGEX.STYLE, (_, css) => {
    styles.push({ css: String(css).trim(), scope })
    return '' // Remove from content
  })
  
  return ExtractedStyleSchema.parse({
    content: clean.trim(),
    styles
  })
}

/**
 * Extracts global styles from content and returns the CSS string
 * @param content - The content to extract global styles from
 * @returns Combined global CSS string
 */
export function extractGlobalStyles(content: string): string {
  const extracted = extractStyles(content, 'global')
  return extracted.styles
    .map(s => s.css)
    .join('\n')
}

/**
 * Extracts slide-specific styles and returns the CSS string
 * @param content - The content to extract slide styles from
 * @returns Combined slide CSS string
 */
export function extractSlideStyles(content: string): string {
  const extracted = extractStyles(content, 'slide')
  return extracted.styles
    .map(s => s.css)
    .join('\n')
}