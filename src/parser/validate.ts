import { z } from 'zod'
import { REGEX, DEFAULTS } from '../config/constants.js'

// Input validation schema
const ParseInputSchema = z.string().min(1, 'Input cannot be empty')

/**
 * Validates input and returns the validated string
 * @param input - The raw input to validate
 * @returns Validated string input
 * @throws Error if input is invalid
 */
export function validateInput(input: unknown): string {
  return ParseInputSchema.parse(input)
}

/**
 * Validates that the slide count doesn't exceed the maximum allowed
 * @param slideCount - Number of slides to validate
 * @throws Error if too many slides
 */
export function validateSlideCount(slideCount: number): void {
  if (slideCount === 0) {
    throw new Error('Document must have at least one slide')
  }
  if (slideCount > DEFAULTS.MAX_SLIDES) {
    throw new Error(`Too many slides (max ${DEFAULTS.MAX_SLIDES})`)
  }
}

/**
 * Validates slide index is within bounds
 * @param index - The slide index to validate
 * @throws Error if index is out of bounds
 */
export function validateSlideIndex(index: number): void {
  if (index >= DEFAULTS.MAX_SLIDES) {
    throw new Error(`Too many slides (max ${DEFAULTS.MAX_SLIDES})`)
  }
}

/**
 * Validates a CSS class name
 * @param className - The class name to validate
 * @throws Error if class name is invalid
 */
export function validateClassName(className: string): void {
  if (className && !REGEX.CLASS_NAME.test(className)) {
    throw new Error(`Invalid class name: ${className}`)
  }
}

/**
 * Validates container nesting depth
 * @param depth - The current nesting depth
 * @throws Error if nesting is too deep
 */
export function validateNestingDepth(depth: number): void {
  if (depth > DEFAULTS.MAX_NESTING_DEPTH) {
    throw new Error(`Container nesting too deep (max ${DEFAULTS.MAX_NESTING_DEPTH})`)
  }
}