import { parse } from './index.js'
import { DEFAULTS } from '../config/constants.js'

describe('Parser - Main Integration', () => {
  describe('Basic functionality', () => {
    it('should parse valid curtains document with single slide', () => {
      // Arrange
      const input = `
===
# Hello World
This is a test slide.
`

      // Act
      const result = parse(input)

      // Assert
      expect(result.type).toBe('curtains-document')
      expect(result.version).toBe('0.1')
      expect(result.slides).toHaveLength(1)
      expect(result.slides[0]?.type).toBe('curtains-slide')
      expect(result.slides[0]?.index).toBe(0)
      expect(result.globalCSS).toBe('')
    })

    it('should parse document with multiple slides', () => {
      // Arrange
      const input = `
===
# First Slide
Content for first slide.

===
# Second Slide
Content for second slide.

===
# Third Slide
Content for third slide.
`

      // Act
      const result = parse(input)

      // Assert
      expect(result.slides).toHaveLength(3)
      expect(result.slides[0]?.index).toBe(0)
      expect(result.slides[1]?.index).toBe(1)
      expect(result.slides[2]?.index).toBe(2)
    })

    it('should parse complex document with global and slide styles', () => {
      // Arrange
      const input = `
<style>
.global { color: blue; }
</style>

===
# First Slide
<style>
.slide-specific { background: red; }
</style>
Content here
`

      // Act
      const result = parse(input)

      // Assert
      expect(result.globalCSS).toContain('.global { color: blue; }')
      expect(result.slides[0]?.slideCSS).toContain('.slide-specific { background: red; }')
    })
  })

  describe('Error handling', () => {
    it('should throw error for empty input', () => {
      // Arrange & Act & Assert
      expect(() => parse('')).toThrow('Input cannot be empty')
    })

    it('should throw error for non-string input', () => {
      // Arrange & Act & Assert
      expect(() => parse(null)).toThrow()
      expect(() => parse(undefined)).toThrow()
      expect(() => parse(123)).toThrow()
    })

    it('should throw error for document without slides', () => {
      // Arrange
      const input = 'Just some content without slide delimiter'

      // Act & Assert
      expect(() => parse(input)).toThrow('Document must have at least one slide')
    })

    it('should throw error for too many slides', () => {
      // Arrange
      const slides = Array(DEFAULTS.MAX_SLIDES + 1).fill('# Slide').join('\n===\n')
      const input = `===\n${slides}`

      // Act & Assert
      expect(() => parse(input)).toThrow(`Too many slides (max ${DEFAULTS.MAX_SLIDES})`)
    })
  })

  describe('Edge cases', () => {
    it('should handle slides with only whitespace', () => {
      // Arrange
      const input = `
===
   
   
`

      // Act
      const result = parse(input)

      // Assert
      expect(result.slides).toHaveLength(1)
      expect(result.slides[0]?.ast.children).toHaveLength(0)
    })

    it('should handle mixed content and containers', () => {
      // Arrange
      const input = `
===
# Before Container

<container class="middle">
  ## Inside Container
</container>

# After Container
`

      // Act
      const result = parse(input)

      // Assert
      const children = result.slides[0]?.ast.children
      expect(children).toHaveLength(3)
      
      if (children) {
        expect(children[0]?.type).toBe('heading')
        expect(children[1]?.type).toBe('container')
        expect(children[2]?.type).toBe('heading')
      }
    })

    it('should handle container at nesting depth limit', () => {
      // Arrange
      let validNesting = ''
      for (let i = 1; i <= DEFAULTS.MAX_NESTING_DEPTH; i++) {
        validNesting += `<container class="level${i}">`
      }
      validNesting += '# Content at max depth'
      for (let i = 1; i <= DEFAULTS.MAX_NESTING_DEPTH; i++) {
        validNesting += '</container>'
      }
      
      const input = `===\n${validNesting}`

      // Act
      const result = parse(input)

      // Assert
      expect(result.slides).toHaveLength(1)
      expect(result.slides[0]?.ast.children).toHaveLength(1)
    })
  })
})