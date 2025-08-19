import { parseMarkdown } from './markdown.js'

// Type helpers for tests
type TestASTNode = {
  type: string
  [key: string]: any
}

describe('Parser - Markdown Parsing', () => {
  describe('parseMarkdown', () => {
    it('should parse headings correctly', () => {
      // Arrange
      const content = `
# Heading 1
## Heading 2
### Heading 3
`

      // Act
      const result = parseMarkdown(content)

      // Assert
      expect(result.children).toHaveLength(3)
      
      if (!result.children) {
        throw new Error('Expected children to be defined')
      }
      
      const child0 = result.children[0] as TestASTNode
      const child1 = result.children[1] as TestASTNode
      const child2 = result.children[2] as TestASTNode
      
      expect(child0.type).toBe('heading')
      expect(child1.type).toBe('heading')
      expect(child2.type).toBe('heading')
      
      expect(child0.depth).toBe(1)
      expect(child1.depth).toBe(2)
      expect(child2.depth).toBe(3)
    })

    it('should parse paragraphs with inline formatting', () => {
      // Arrange
      const content = 'This is **bold text** and this is *italic text*.'

      // Act
      const result = parseMarkdown(content)

      // Assert
      if (!result.children) {
        throw new Error('Expected children to be defined')
      }
      
      const paragraph = result.children[0] as TestASTNode
      expect(paragraph?.type).toBe('paragraph')
      expect(paragraph.children.length).toBeGreaterThan(0)
    })

    it('should parse unordered lists correctly', () => {
      // Arrange
      const content = `
- First item
- Second item
- Third item
`

      // Act
      const result = parseMarkdown(content)

      // Assert
      if (!result.children) {
        throw new Error('Expected children to be defined')
      }
      
      const list = result.children.find((child: TestASTNode) => 
        child.type === 'list' && child.ordered !== true
      )
      expect(list).toBeDefined()
      
      if (list) {
        if (!list.children) {
          throw new Error('Expected list children to be defined')
        }
        expect(list.children).toHaveLength(3)
        expect(list.children[0]?.type).toBe('listItem')
      }
    })

    it('should parse ordered lists correctly', () => {
      // Arrange
      const content = `
1. Ordered item 1
2. Ordered item 2
3. Ordered item 3
`

      // Act
      const result = parseMarkdown(content)

      // Assert
      if (!result.children) {
        throw new Error('Expected children to be defined')
      }
      
      const orderedList = result.children.find((child: TestASTNode) => 
        child.type === 'list' && child.ordered === true
      )
      expect(orderedList).toBeDefined()
      
      if (orderedList) {
        if (!orderedList.children) {
          throw new Error('Expected orderedList children to be defined')
        }
        expect(orderedList.children).toHaveLength(3)
        expect(orderedList.children[0]?.type).toBe('listItem')
      }
    })

    it('should parse links correctly', () => {
      // Arrange
      const content = 'Here is [a link](https://example.com) in text.'

      // Act
      const result = parseMarkdown(content)

      // Assert
      if (!result.children) {
        throw new Error('Expected children to be defined')
      }
      
      const paragraph = result.children[0] as TestASTNode
      expect(paragraph?.type).toBe('paragraph')
      
      if (paragraph?.type === 'paragraph') {
        const linkNode = paragraph.children.find((child: TestASTNode) => child.type === 'link')
        expect(linkNode).toBeDefined()
        
        if (linkNode !== undefined && linkNode.type === 'link') {
          expect(linkNode.url).toBe('https://example.com')
        }
      }
    })

    it('should parse images correctly', () => {
      // Arrange
      const content = '![Alt text](https://example.com/image.png)'

      // Act
      const result = parseMarkdown(content)

      // Assert
      if (!result.children) {
        throw new Error('Expected children to be defined')
      }
      
      const imageNode = result.children.find((child: TestASTNode) => child.type === 'image')
      expect(imageNode).toBeDefined()
      
      if (imageNode?.type === 'image') {
        expect(imageNode.url).toBe('https://example.com/image.png')
        expect(imageNode.alt).toBe('Alt text')
      }
    })

    it('should handle container placeholders', () => {
      // Arrange
      const content = '{{CONTAINER:container_0:# Test Content}}'

      // Act
      const result = parseMarkdown(content)

      // Assert
      expect(result.children).toHaveLength(1)
      
      if (!result.children) {
        throw new Error('Expected children to be defined')
      }
      
      const paragraph = result.children[0] as TestASTNode
      expect(paragraph.type).toBe('paragraph')
      expect(paragraph.children[0]?.value).toContain('{{CONTAINER:')
    })

    it('should handle mixed content with container placeholders', () => {
      // Arrange
      const content = `
# Before Container
{{CONTAINER:container_0:## Inside Container}}
# After Container
`

      // Act
      const result = parseMarkdown(content)

      // Assert
      expect(result.children).toHaveLength(3)
      
      if (!result.children) {
        throw new Error('Expected children to be defined')
      }
      
      expect((result.children[0] as TestASTNode).type).toBe('heading')
      expect((result.children[1] as TestASTNode).type).toBe('paragraph')
      expect((result.children[2] as TestASTNode).type).toBe('heading')
    })

    it('should skip container closing tags', () => {
      // Arrange
      const content = `
# Heading
</container>
Paragraph content
`

      // Act
      const result = parseMarkdown(content)

      // Assert
      expect(result.children).toHaveLength(2)
      
      if (!result.children) {
        throw new Error('Expected children to be defined')
      }
      
      expect((result.children[0] as TestASTNode).type).toBe('heading')
      expect((result.children[1] as TestASTNode).type).toBe('paragraph')
    })

    it('should handle empty content', () => {
      // Arrange
      const content = ''

      // Act
      const result = parseMarkdown(content)

      // Assert
      expect(result.type).toBe('root')
      expect(result.children).toHaveLength(0)
    })

    it('should handle content with only whitespace', () => {
      // Arrange
      const content = '   \n   \n   '

      // Act
      const result = parseMarkdown(content)

      // Assert
      expect(result.type).toBe('root')
      expect(result.children).toHaveLength(0)
    })
  })
})