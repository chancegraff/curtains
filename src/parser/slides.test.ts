import { splitIntoSlides, processSlide, processSlides } from './slides.js'
import type { ContainerNode } from '../ast/types.js'

// Type guards for better type safety in tests
function isContainerNode(node: unknown): node is ContainerNode {
  return typeof node === 'object' && node !== null && 'type' in node && 
    'children' in node && 'classes' in node && 
    typeof (node.type) === 'string' && node.type === 'container'
}

describe('Parser - Slide Processing', () => {
  describe('splitIntoSlides', () => {
    it('should split content with single slide', () => {
      // Arrange
      const source = `
Global content here
===
# Slide Content
`

      // Act
      const result = splitIntoSlides(source)

      // Assert
      expect(result.globalContent).toContain('Global content here')
      expect(result.slideContents).toHaveLength(1)
      expect(result.slideContents[0]).toContain('# Slide Content')
    })

    it('should split content with multiple slides', () => {
      // Arrange
      const source = `
Global styles and content
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
      const result = splitIntoSlides(source)

      // Assert
      expect(result.globalContent).toContain('Global styles and content')
      expect(result.slideContents).toHaveLength(3)
      expect(result.slideContents[0]).toContain('# First Slide')
      expect(result.slideContents[1]).toContain('# Second Slide')
      expect(result.slideContents[2]).toContain('# Third Slide')
    })

    it('should handle content with no global section', () => {
      // Arrange
      const source = `===
# Only Slide
Content here
`

      // Act
      const result = splitIntoSlides(source)

      // Assert
      expect(result.globalContent).toBe('')
      expect(result.slideContents).toHaveLength(1)
      expect(result.slideContents[0]).toContain('# Only Slide')
    })

    it('should handle empty global content', () => {
      // Arrange
      const source = `===
# Slide 1
===
# Slide 2
`

      // Act
      const result = splitIntoSlides(source)

      // Assert
      expect(result.globalContent).toBe('')
      expect(result.slideContents).toHaveLength(2)
    })
  })

  describe('processSlide', () => {
    it('should process simple slide', () => {
      // Arrange
      const slideInput = {
        content: `
# Test Slide
This is test content.
`,
        index: 0
      }

      // Act
      const result = processSlide(slideInput)

      // Assert
      expect(result.type).toBe('curtains-slide')
      expect(result.index).toBe(0)
      expect(result.ast.type).toBe('root')
      expect(result.ast.children).toHaveLength(2) // heading + paragraph
      expect(result.slideCSS).toBe('')
    })

    it('should process slide with styles', () => {
      // Arrange
      const slideInput = {
        content: `
<style>
.hero { min-height: 100vh; }
</style>

# Hero Slide
Welcome to the presentation.
`,
        index: 1
      }

      // Act
      const result = processSlide(slideInput)

      // Assert
      expect(result.type).toBe('curtains-slide')
      expect(result.index).toBe(1)
      expect(result.slideCSS).toContain('.hero { min-height: 100vh; }')
      expect(result.ast.children).toHaveLength(2) // heading + paragraph (styles removed from content)
    })

    it('should process slide with container', () => {
      // Arrange
      const slideInput = {
        content: `
# Slide with Container

<container class="highlight">
## Container Content
Important information here.
</container>
`,
        index: 2
      }

      // Act
      const result = processSlide(slideInput)

      // Assert
      expect(result.type).toBe('curtains-slide')
      expect(result.index).toBe(2)
      expect(result.ast.children).toHaveLength(2) // heading + container
      
      const containerNode = result.ast.children.find(child => child.type === 'container')
      expect(containerNode).toBeDefined()
      if (isContainerNode(containerNode)) {
        expect(containerNode.classes).toEqual(['highlight'])
      }
    })

    it('should process slide with multiple styles', () => {
      // Arrange
      const slideInput = {
        content: `
<style>
.style1 { color: red; }
</style>

# Multi-Style Slide

<style>
.style2 { background: blue; }
</style>

Content here.
`,
        index: 0
      }

      // Act
      const result = processSlide(slideInput)

      // Assert
      expect(result.slideCSS).toContain('.style1 { color: red; }')
      expect(result.slideCSS).toContain('.style2 { background: blue; }')
    })

    it('should handle slide with only whitespace', () => {
      // Arrange
      const slideInput = {
        content: '   \n   \n   ',
        index: 0
      }

      // Act
      const result = processSlide(slideInput)

      // Assert
      expect(result.type).toBe('curtains-slide')
      expect(result.index).toBe(0)
      expect(result.ast.children).toHaveLength(0)
      expect(result.slideCSS).toBe('')
    })
  })

  describe('processSlides', () => {
    it('should process multiple slides', () => {
      // Arrange
      const slideContents = [
        '# First Slide\nContent 1',
        '# Second Slide\nContent 2', 
        '# Third Slide\nContent 3'
      ]

      // Act
      const result = processSlides(slideContents)

      // Assert
      expect(result).toHaveLength(3)
      expect(result[0]?.index).toBe(0)
      expect(result[1]?.index).toBe(1)
      expect(result[2]?.index).toBe(2)
      
      result.forEach((slide, index) => {
        expect(slide.type).toBe('curtains-slide')
        expect(slide.index).toBe(index)
        expect(slide.ast.type).toBe('root')
      })
    })

    it('should process slides with varying content complexity', () => {
      // Arrange
      const slideContents = [
        '# Simple Slide',
        `
<style>.styled { color: red; }</style>
# Styled Slide
`,
        `
# Container Slide
<container class="test">
## Inside Container
</container>
`
      ]

      // Act
      const result = processSlides(slideContents)

      // Assert
      expect(result).toHaveLength(3)
      
      // Simple slide
      expect(result[0]?.slideCSS).toBe('')
      
      // Styled slide  
      expect(result[1]?.slideCSS).toContain('.styled { color: red; }')
      
      // Container slide
      const containerSlide = result[2]
      const hasContainer = containerSlide?.ast.children.some(child => child.type === 'container')
      expect(hasContainer).toBe(true)
    })

    it('should handle empty slides array', () => {
      // Arrange
      const slideContents: string[] = []

      // Act
      const result = processSlides(slideContents)

      // Assert
      expect(result).toHaveLength(0)
    })
  })
})