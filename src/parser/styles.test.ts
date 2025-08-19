import { extractStyles, extractGlobalStyles, extractSlideStyles } from './styles.js'

describe('Parser - Style Extraction', () => {
  describe('extractStyles', () => {
    it('should extract global styles correctly', () => {
      // Arrange
      const content = `
<style>
/* Global styles */
.centered { text-align: center; }
.highlight { color: #007acc; }
</style>

Some content here
`

      // Act
      const result = extractStyles(content, 'global')

      // Assert
      expect(result.content).toBe('Some content here')
      expect(result.styles).toHaveLength(1)
      expect(result.styles[0]?.css).toContain('.centered { text-align: center; }')
      expect(result.styles[0]?.css).toContain('.highlight { color: #007acc; }')
      expect(result.styles[0]?.scope).toBe('global')
    })

    it('should extract slide-specific styles correctly', () => {
      // Arrange
      const content = `
# Test Slide

<style>
.hero { min-height: 100vh; }
</style>

Content here
`

      // Act
      const result = extractStyles(content, 'slide')

      // Assert
      expect(result.content).toContain('# Test Slide')
      expect(result.content).toContain('Content here')
      expect(result.content).not.toContain('<style>')
      expect(result.styles).toHaveLength(1)
      expect(result.styles[0]?.css).toContain('.hero { min-height: 100vh; }')
      expect(result.styles[0]?.scope).toBe('slide')
    })

    it('should handle multiple style blocks in same scope', () => {
      // Arrange
      const content = `
<style>
.style1 { color: red; }
</style>

Some content

<style>
.style2 { color: blue; }
</style>

More content
`

      // Act
      const result = extractStyles(content, 'global')

      // Assert
      expect(result.content).toContain('Some content')
      expect(result.content).toContain('More content')
      expect(result.content).not.toContain('<style>')
      expect(result.styles).toHaveLength(2)
      expect(result.styles[0]?.css).toContain('.style1 { color: red; }')
      expect(result.styles[1]?.css).toContain('.style2 { color: blue; }')
    })

    it('should handle content without styles', () => {
      // Arrange
      const content = 'Just some content without styles'

      // Act
      const result = extractStyles(content, 'global')

      // Assert
      expect(result.content).toBe('Just some content without styles')
      expect(result.styles).toHaveLength(0)
    })

    it('should handle empty style blocks', () => {
      // Arrange
      const content = `
<style>
</style>

Content here
`

      // Act
      const result = extractStyles(content, 'slide')

      // Assert
      expect(result.content).toBe('Content here')
      expect(result.styles).toHaveLength(1)
      expect(result.styles[0]?.css).toBe('')
      expect(result.styles[0]?.scope).toBe('slide')
    })
  })

  describe('extractGlobalStyles', () => {
    it('should extract and combine global styles', () => {
      // Arrange
      const content = `
<style>
.global1 { color: red; }
</style>

<style>
.global2 { color: blue; }
</style>

Content here
`

      // Act
      const result = extractGlobalStyles(content)

      // Assert
      expect(result).toContain('.global1 { color: red; }')
      expect(result).toContain('.global2 { color: blue; }')
    })

    it('should return empty string when no styles present', () => {
      // Arrange
      const content = 'No styles here'

      // Act
      const result = extractGlobalStyles(content)

      // Assert
      expect(result).toBe('')
    })
  })

  describe('extractSlideStyles', () => {
    it('should extract and combine slide styles', () => {
      // Arrange
      const content = `
<style>
.slide1 { background: yellow; }
</style>

<style>
.slide2 { border: solid; }
</style>

Content
`

      // Act
      const result = extractSlideStyles(content)

      // Assert
      expect(result).toContain('.slide1 { background: yellow; }')
      expect(result).toContain('.slide2 { border: solid; }')
    })

    it('should return empty string when no styles present', () => {
      // Arrange
      const content = 'No styles here'

      // Act
      const result = extractSlideStyles(content)

      // Assert
      expect(result).toBe('')
    })
  })
})