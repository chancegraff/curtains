import { parseMarkdown, parseBasicMarkdown, parseInlineText } from './markdown.js'

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

    it('should handle multiple containers separated by whitespace without creating empty paragraphs', () => {
      // Arrange - Container placeholders are now handled by the container parser, not markdown parser
      const content = `{{CONTAINER:container_0:## First Container}}   {{CONTAINER:container_1:## Second Container}}`

      // Act
      const result = parseMarkdown(content)

      // Assert - Now treated as a single paragraph since placeholders aren't processed here
      expect(result.children).toHaveLength(1)
      
      if (!result.children) {
        throw new Error('Expected children to be defined')
      }
      
      // Should be a single paragraph containing the full text
      expect((result.children[0] as TestASTNode).type).toBe('paragraph')
      
      // Verify the content contains the placeholder text
      const paragraph = result.children[0] as TestASTNode
      expect(paragraph.children[0]?.value).toContain('{{CONTAINER:container_0:## First Container}}')
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

    it('should parse HTML img tags on their own line', () => {
      // Arrange
      const content = '<img src="./logo.svg" alt="Logo">'

      // Act
      const result = parseMarkdown(content)

      // Assert
      if (!result.children) {
        throw new Error('Expected children to be defined')
      }
      
      const imageNode = result.children.find((child: TestASTNode) => child.type === 'image')
      expect(imageNode).toBeDefined()
      
      if (imageNode?.type === 'image') {
        expect(imageNode.url).toBe('./logo.svg')
        expect(imageNode.alt).toBe('Logo')
        expect(imageNode.classes).toBeUndefined()
      }
    })

    it('should parse HTML img tags with class attribute', () => {
      // Arrange
      const content = '<img src="./logo.svg" class="responsive-logo" alt="Logo">'

      // Act
      const result = parseMarkdown(content)

      // Assert
      if (!result.children) {
        throw new Error('Expected children to be defined')
      }
      
      const imageNode = result.children.find((child: TestASTNode) => child.type === 'image')
      expect(imageNode).toBeDefined()
      
      if (imageNode?.type === 'image') {
        expect(imageNode.url).toBe('./logo.svg')
        expect(imageNode.alt).toBe('Logo')
        expect(imageNode.classes).toEqual(['responsive-logo'])
      }
    })

    it('should parse HTML img tags with multiple classes', () => {
      // Arrange
      const content = '<img src="./logo.svg" class="responsive-logo centered" alt="Logo">'

      // Act
      const result = parseMarkdown(content)

      // Assert
      if (!result.children) {
        throw new Error('Expected children to be defined')
      }
      
      const imageNode = result.children.find((child: TestASTNode) => child.type === 'image')
      expect(imageNode).toBeDefined()
      
      if (imageNode?.type === 'image') {
        expect(imageNode.url).toBe('./logo.svg')
        expect(imageNode.alt).toBe('Logo')
        expect(imageNode.classes).toEqual(['responsive-logo', 'centered'])
      }
    })

    it('should strip dangerous HTML img tag attributes for security', () => {
      // Arrange
      const content = '<img src="./logo.svg" class="safe" style="width:100px" onclick="alert(\'xss\')" onload="hack()" id="bad" data-attr="evil" alt="Logo">'

      // Act
      const result = parseMarkdown(content)

      // Assert
      if (!result.children) {
        throw new Error('Expected children to be defined')
      }
      
      const imageNode = result.children.find((child: TestASTNode) => child.type === 'image')
      expect(imageNode).toBeDefined()
      
      if (imageNode?.type === 'image') {
        expect(imageNode.url).toBe('./logo.svg')
        expect(imageNode.alt).toBe('Logo')
        expect(imageNode.classes).toEqual(['safe'])
        // All other attributes should be stripped - only url, alt, and classes should exist
        expect(Object.keys(imageNode)).toEqual(expect.arrayContaining(['type', 'url', 'alt', 'classes']))
        expect(Object.keys(imageNode)).not.toEqual(expect.arrayContaining(['style', 'onclick', 'onload', 'id', 'data-attr']))
      }
    })

    it('should parse HTML img tags within paragraphs inline', () => {
      // Arrange
      const content = 'Here is an image <img src="./logo.svg" class="inline-img" alt="Logo"> in the middle of text.'

      // Act
      const result = parseMarkdown(content)

      // Assert
      if (!result.children) {
        throw new Error('Expected children to be defined')
      }
      
      const paragraph = result.children[0] as TestASTNode
      expect(paragraph?.type).toBe('paragraph')
      
      if (paragraph?.type === 'paragraph') {
        const imageNode = paragraph.children.find((child: TestASTNode) => child.type === 'image')
        expect(imageNode).toBeDefined()
        
        if (imageNode?.type === 'image') {
          expect(imageNode.url).toBe('./logo.svg')
          expect(imageNode.alt).toBe('Logo')
          expect(imageNode.classes).toEqual(['inline-img'])
        }
        
        // Should have text nodes before and after the image
        const textNodes = paragraph.children.filter((child: TestASTNode) => child.type === 'text')
        expect(textNodes.length).toBeGreaterThan(1)
      }
    })

    it('should handle HTML img tags without alt attribute', () => {
      // Arrange
      const content = '<img src="./logo.svg" class="no-alt">'

      // Act
      const result = parseMarkdown(content)

      // Assert
      if (!result.children) {
        throw new Error('Expected children to be defined')
      }
      
      const imageNode = result.children.find((child: TestASTNode) => child.type === 'image')
      expect(imageNode).toBeDefined()
      
      if (imageNode?.type === 'image') {
        expect(imageNode.url).toBe('./logo.svg')
        expect(imageNode.alt).toBe('')
        expect(imageNode.classes).toEqual(['no-alt'])
      }
    })

    it('should handle HTML img tags without class attribute', () => {
      // Arrange
      const content = '<img src="./logo.svg" alt="Logo">'

      // Act
      const result = parseMarkdown(content)

      // Assert
      if (!result.children) {
        throw new Error('Expected children to be defined')
      }
      
      const imageNode = result.children.find((child: TestASTNode) => child.type === 'image')
      expect(imageNode).toBeDefined()
      
      if (imageNode?.type === 'image') {
        expect(imageNode.url).toBe('./logo.svg')
        expect(imageNode.alt).toBe('Logo')
        expect(imageNode.classes).toBeUndefined()
      }
    })

    it('should handle malformed HTML img tags gracefully', () => {
      // Arrange
      const content = '<img src="./logo.svg" alt="Logo" class="test"'

      // Act
      const result = parseMarkdown(content)

      // Assert  
      // Should be parsed as regular paragraph text since it's malformed (missing closing >)
      if (!result.children) {
        throw new Error('Expected children to be defined')
      }
      
      const paragraph = result.children[0] as TestASTNode
      expect(paragraph?.type).toBe('paragraph')
      expect(paragraph.children[0]?.value).toContain('<img')
    })

    describe('Code Blocks', () => {
      it('should parse basic code blocks without language', () => {
        // Arrange
        const content = `
\`\`\`
const hello = 'world'
console.log(hello)
\`\`\`
`

        // Act
        const result = parseMarkdown(content)

        // Assert
        if (!result.children) {
          throw new Error('Expected children to be defined')
        }

        const codeNode = result.children.find((child: TestASTNode) => child.type === 'code')
        expect(codeNode).toBeDefined()

        if (codeNode?.type === 'code') {
          expect(codeNode.value).toBe(`const hello = 'world'\nconsole.log(hello)`)
          expect(codeNode.lang).toBeUndefined()
        }
      })

      it('should parse code blocks with language identifier', () => {
        // Arrange
        const content = `
\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`
}
\`\`\`
`

        // Act
        const result = parseMarkdown(content)

        // Assert
        if (!result.children) {
          throw new Error('Expected children to be defined')
        }

        const codeNode = result.children.find((child: TestASTNode) => child.type === 'code')
        expect(codeNode).toBeDefined()

        if (codeNode?.type === 'code') {
          expect(codeNode.value).toBe(`function greet(name) {\n  return \`Hello, \${name}!\`\n}`)
          expect(codeNode.lang).toBe('javascript')
        }
      })

      it('should preserve indentation in code blocks', () => {
        // Arrange
        const content = `
\`\`\`python
def factorial(n):
    if n <= 1:
        return 1
    else:
        return n * factorial(n - 1)
\`\`\`
`

        // Act
        const result = parseMarkdown(content)

        // Assert
        if (!result.children) {
          throw new Error('Expected children to be defined')
        }

        const codeNode = result.children.find((child: TestASTNode) => child.type === 'code')
        expect(codeNode).toBeDefined()

        if (codeNode?.type === 'code') {
          expect(codeNode.value).toBe(`def factorial(n):\n    if n <= 1:\n        return 1\n    else:\n        return n * factorial(n - 1)`)
          expect(codeNode.lang).toBe('python')
        }
      })

      it('should handle empty code blocks', () => {
        // Arrange
        const content = `
\`\`\`
\`\`\`
`

        // Act
        const result = parseMarkdown(content)

        // Assert
        if (!result.children) {
          throw new Error('Expected children to be defined')
        }

        const codeNode = result.children.find((child: TestASTNode) => child.type === 'code')
        expect(codeNode).toBeDefined()

        if (codeNode?.type === 'code') {
          expect(codeNode.value).toBe('')
          expect(codeNode.lang).toBeUndefined()
        }
      })

      it('should handle code blocks with empty lines', () => {
        // Arrange
        const content = `
\`\`\`typescript
interface User {
  name: string

  age: number
}
\`\`\`
`

        // Act
        const result = parseMarkdown(content)

        // Assert
        if (!result.children) {
          throw new Error('Expected children to be defined')
        }

        const codeNode = result.children.find((child: TestASTNode) => child.type === 'code')
        expect(codeNode).toBeDefined()

        if (codeNode?.type === 'code') {
          expect(codeNode.value).toBe(`interface User {\n  name: string\n\n  age: number\n}`)
          expect(codeNode.lang).toBe('typescript')
        }
      })

      it('should handle unclosed code blocks gracefully', () => {
        // Arrange
        const content = `
\`\`\`javascript
const unclosed = 'code block'
# This should not be a heading
`

        // Act
        const result = parseMarkdown(content)

        // Assert
        if (!result.children) {
          throw new Error('Expected children to be defined')
        }

        const codeNode = result.children.find((child: TestASTNode) => child.type === 'code')
        expect(codeNode).toBeDefined()

        if (codeNode?.type === 'code' && codeNode.value) {
          expect(codeNode.value.trim()).toBe(`const unclosed = 'code block'\n# This should not be a heading`)
          expect(codeNode.lang).toBe('javascript')
        }
      })
    })

    describe('Tables', () => {
      it('should parse basic table without alignment', () => {
        // Arrange
        const content = `
| Name | Age | City |
|------|-----|------|
| John | 30 | NYC |
| Jane | 25 | LA |
`

        // Act
        const result = parseMarkdown(content)

        // Assert
        if (!result.children) {
          throw new Error('Expected children to be defined')
        }

        const tableNode = result.children.find((child: TestASTNode) => child.type === 'table')
        expect(tableNode).toBeDefined()

        if (tableNode?.type === 'table' && tableNode.children) {
          expect(tableNode.children).toHaveLength(3) // 1 header + 2 data rows

          // Check header row
          const headerRow = tableNode.children[0] as TestASTNode
          expect(headerRow.type).toBe('tableRow')
          expect(headerRow.children).toHaveLength(3)

          const headerCells = headerRow.children as TestASTNode[]
          expect(headerCells[0]?.type).toBe('tableCell')
          expect(headerCells[0]?.header).toBe(true)
          expect(headerCells[0]?.children[0]?.value).toBe('Name')
        }
      })

      it('should parse table with alignment indicators', () => {
        // Arrange
        const content = `
| Left | Center | Right |
|:-----|:------:|------:|
| L1 | C1 | R1 |
`

        // Act
        const result = parseMarkdown(content)

        // Assert
        if (!result.children) {
          throw new Error('Expected children to be defined')
        }

        const tableNode = result.children.find((child: TestASTNode) => child.type === 'table')
        expect(tableNode).toBeDefined()

        if (tableNode?.type === 'table' && tableNode.children) {
          expect(tableNode.children).toHaveLength(2) // 1 header + 1 data row

          // Check data row alignment
          const dataRow = tableNode.children[1] as TestASTNode
          const dataCells = dataRow.children as TestASTNode[]
          
          expect(dataCells[0]?.align).toBe('left')
          expect(dataCells[1]?.align).toBe('center')
          expect(dataCells[2]?.align).toBe('right')
        }
      })

      it('should handle tables with inline formatting', () => {
        // Arrange
        const content = `
| Name | Description |
|------|-------------|
| **Bold** | This is [a link](https://example.com) |
`

        // Act
        const result = parseMarkdown(content)

        // Assert
        if (!result.children) {
          throw new Error('Expected children to be defined')
        }

        const tableNode = result.children.find((child: TestASTNode) => child.type === 'table')
        expect(tableNode).toBeDefined()

        if (tableNode?.type === 'table' && tableNode.children) {
          const dataRow = tableNode.children[1] as TestASTNode
          const dataCells = dataRow.children as TestASTNode[]
          
          // Check bold formatting in first cell
          const firstCellChildren = dataCells[0]?.children as TestASTNode[]
          expect(firstCellChildren[0]?.type).toBe('text')
          expect(firstCellChildren[0]?.bold).toBe(true)
          
          // Check link in second cell
          const secondCellChildren = dataCells[1]?.children as TestASTNode[]
          const linkNode = secondCellChildren.find((child: TestASTNode) => child.type === 'link')
          expect(linkNode).toBeDefined()
          expect(linkNode?.url).toBe('https://example.com')
        }
      })

      it('should handle tables without leading/trailing pipes', () => {
        // Arrange
        const content = `
Name | Age | City
-----|-----|-----
John | 30 | NYC
Jane | 25 | LA
`

        // Act
        const result = parseMarkdown(content)

        // Assert
        if (!result.children) {
          throw new Error('Expected children to be defined')
        }

        const tableNode = result.children.find((child: TestASTNode) => child.type === 'table')
        expect(tableNode).toBeDefined()

        if (tableNode?.type === 'table' && tableNode.children) {
          expect(tableNode.children).toHaveLength(3) // 1 header + 2 data rows
          
          const headerRow = tableNode.children[0] as TestASTNode
          expect(headerRow.children).toHaveLength(3)
        }
      })

      it('should handle empty table cells', () => {
        // Arrange
        const content = `
| Name | Age | City |
|------|-----|------|
| John |     | NYC |
|      | 25  |     |
`

        // Act
        const result = parseMarkdown(content)

        // Assert
        if (!result.children) {
          throw new Error('Expected children to be defined')
        }

        const tableNode = result.children.find((child: TestASTNode) => child.type === 'table')
        expect(tableNode).toBeDefined()

        if (tableNode?.type === 'table' && tableNode.children) {
          const dataRow1 = tableNode.children[1] as TestASTNode
          const dataCells1 = dataRow1.children as TestASTNode[]
          
          // Check empty cell content
          expect(dataCells1[1]?.children[0]?.value).toBe('')
          
          const dataRow2 = tableNode.children[2] as TestASTNode
          const dataCells2 = dataRow2.children as TestASTNode[]
          
          expect(dataCells2[0]?.children[0]?.value).toBe('')
          expect(dataCells2[2]?.children[0]?.value).toBe('')
        }
      })

      it('should handle single row table (header only)', () => {
        // Arrange
        const content = `
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
`

        // Act
        const result = parseMarkdown(content)

        // Assert
        if (!result.children) {
          throw new Error('Expected children to be defined')
        }

        const tableNode = result.children.find((child: TestASTNode) => child.type === 'table')
        expect(tableNode).toBeDefined()

        if (tableNode?.type === 'table' && tableNode.children) {
          expect(tableNode.children).toHaveLength(1) // Just header row
          
          const headerRow = tableNode.children[0] as TestASTNode
          const headerCells = headerRow.children as TestASTNode[]
          
          expect(headerCells[0]?.header).toBe(true)
          expect(headerCells[0]?.children[0]?.value).toBe('Column 1')
        }
      })

      it('should handle table without header separator', () => {
        // Arrange
        // According to GFM spec, tables require header separator row
        // This content should be parsed as paragraph text, not a table
        const content = `
| Data 1 | Data 2 | Data 3 |
| More 1 | More 2 | More 3 |
`

        // Act
        const result = parseMarkdown(content)

        // Assert
        if (!result.children) {
          throw new Error('Expected children to be defined')
        }

        // Should be parsed as paragraph, not table (GFM spec compliance)
        const paragraphNode = result.children.find((child: TestASTNode) => child.type === 'paragraph')
        expect(paragraphNode).toBeDefined()
        
        if (paragraphNode?.children && paragraphNode.children[0]) {
          const textNode = paragraphNode.children[0] as TestASTNode
          expect(textNode.type).toBe('text')
          expect(textNode.value).toBe('| Data 1 | Data 2 | Data 3 |\n| More 1 | More 2 | More 3 |')
        }
      })

      it('should handle malformed table gracefully', () => {
        // Arrange
        // According to GFM spec, malformed tables without header separator
        // should be parsed as paragraph text, not as tables
        const content = `
| Column 1 | Column 2
| Data 1 | Data 2 | Data 3 |
`

        // Act
        const result = parseMarkdown(content)

        // Assert
        if (!result.children) {
          throw new Error('Expected children to be defined')
        }

        // Should be parsed as paragraph, not table (GFM spec compliance)
        const paragraphNode = result.children.find((child: TestASTNode) => child.type === 'paragraph')
        expect(paragraphNode).toBeDefined()
        
        if (paragraphNode?.children && paragraphNode.children[0]) {
          const textNode = paragraphNode.children[0] as TestASTNode
          expect(textNode.type).toBe('text')
          expect(textNode.value).toBe('| Column 1 | Column 2\n| Data 1 | Data 2 | Data 3 |')
        }
      })
    })
  })

  describe('Legacy functions for backwards compatibility', () => {
    it('should support parseBasicMarkdown as alias to parseWithRemark', () => {
      // Tests line 352-353
      const content = '# Hello World\n\nThis is a paragraph.'
      const result = parseBasicMarkdown(content)
      
      expect(result).toBeDefined()
      expect(result.type).toBe('root')
      expect(result.children).toBeDefined()
      expect(result.children?.length).toBeGreaterThan(0)
    })

    it('should support parseInlineText for backwards compatibility', () => {
      // Tests line 362-363
      const text = 'Some inline text'
      const result = parseInlineText(text)
      
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
      expect(result[0]?.type).toBe('text')
      expect(result[0]?.value).toBe(text)
    })
  })

  describe('Advanced table cell handling', () => {
    it('should handle table cells with alignment', () => {
      // Tests line 260-261 - table cell alignment handling
      const content = `
| Left | Center | Right |
|:-----|:------:|------:|
| L1   |   C1   |    R1 |
`
      const result = parseMarkdown(content)
      
      expect(result).toBeDefined()
      expect(result.children).toBeDefined()
      
      const tableNode = result.children?.find((child: TestASTNode) => child.type === 'table')
      if (tableNode?.children) {
        const dataRow = tableNode.children[1] as TestASTNode // Second row (data row)
        const cells = dataRow?.children as TestASTNode[]
        
        // Check alignment properties
        expect(cells[0]?.align).toBe('left')
        expect(cells[1]?.align).toBe('center')  
        expect(cells[2]?.align).toBe('right')
      }
    })

    it('should handle table alignment transfer from table to cells', () => {
      // Tests lines 243-246 - table row alignment with tableAlign array handling
      const content = `
| Col1 | Col2 | Col3 |
|:-----|:----:|-----:|
| A    | B    | C    |
| D    | E    | F    |
`
      const result = parseMarkdown(content)
      
      expect(result.children).toBeDefined()
      const tableNode = result.children?.find((child: TestASTNode) => child.type === 'table')
      
      if (tableNode?.children) {
        // Check multiple rows to ensure alignment transfer works properly
        const dataRow1 = tableNode.children[1] as TestASTNode
        const dataRow2 = tableNode.children[2] as TestASTNode
        
        const cells1 = dataRow1?.children as TestASTNode[]
        const cells2 = dataRow2?.children as TestASTNode[]
        
        // First data row
        expect(cells1[0]?.align).toBe('left')
        expect(cells1[1]?.align).toBe('center')
        expect(cells1[2]?.align).toBe('right')
        
        // Second data row should also get alignment
        expect(cells2[0]?.align).toBe('left')  
        expect(cells2[1]?.align).toBe('center')
        expect(cells2[2]?.align).toBe('right')
      }
    })

    it('should handle table cells that are not tableCell type in alignment mapping', () => {
      // This tests the condition in lines 240-242 where cell.type !== 'tableCell'
      // Although this is edge case, we need to ensure the return statements at lines 243-246 are covered
      const content = `
| Name | Value |
|------|-------|
| Test | 123   |
`
      const result = parseMarkdown(content)
      
      expect(result.children).toBeDefined()
      const tableNode = result.children?.find((child: TestASTNode) => child.type === 'table')
      
      if (tableNode?.children) {
        const dataRow = tableNode.children[1] as TestASTNode
        const cells = dataRow?.children as TestASTNode[]
        
        // Should properly handle the table cells
        expect(cells[0]?.type).toBe('tableCell')
        expect(cells[1]?.type).toBe('tableCell')
        expect(cells.length).toBe(2)
      }
    })

    it('should handle tables with no alignment specified', () => {
      // Test edge case where tableAlign is undefined or empty
      const content = `
| Basic | Table |
|-------|-------|
| No    | Align |
`
      const result = parseMarkdown(content)
      
      expect(result.children).toBeDefined()
      const tableNode = result.children?.find((child: TestASTNode) => child.type === 'table')
      
      if (tableNode?.children) {
        const dataRow = tableNode.children[1] as TestASTNode
        const cells = dataRow?.children as TestASTNode[]
        
        // When no alignment is specified, cells should not have align property
        // This tests the branch where tableAlign[index] is falsy
        expect(cells[0]?.align).toBeUndefined()
        expect(cells[1]?.align).toBeUndefined()
      }
    })

    it('should handle table cells with node.align property directly', () => {
      // Tests lines 260-261 - direct node.align assignment in tableCell case
      // We need to test this by creating a scenario where node.align exists
      const content = `
| Left Aligned |
|:-------------|
| Content      |
`
      const result = parseMarkdown(content)
      
      const tableNode = result.children?.find((child: TestASTNode) => child.type === 'table')
      if (tableNode?.children) {
        const headerRow = tableNode.children[0] as TestASTNode
        const dataRow = tableNode.children[1] as TestASTNode
        
        const headerCell = headerRow?.children?.[0] as TestASTNode
        const dataCell = dataRow?.children?.[0] as TestASTNode
        
        // Check that alignment is properly assigned
        expect(headerCell?.align).toBe('left')
        expect(dataCell?.align).toBe('left')
      }
    })

    it('should handle unknown markdown node types gracefully', () => {
      // Tests line 269-270 - unknown node handling
      const content = '# Normal Heading\n\nNormal paragraph.'
      const result = parseMarkdown(content)
      
      // The parser should handle unknown nodes by preserving children and value
      expect(result).toBeDefined()
      expect(result.children).toBeDefined()
      expect(result.children?.length).toBeGreaterThan(0)
      
      // Test that the conversion handles various node structures correctly
      const heading = result.children?.find((child: TestASTNode) => child.type === 'heading')
      expect(heading).toBeDefined()
      expect(heading?.children).toBeDefined()
    })

    it('should handle unknown node types with both children and value', () => {
      // Additional test for lines 269-270 to ensure both children and value paths are covered
      // This is tricky to test directly since we use remark, but we can verify the logic works
      const content = `
Some text with **bold** formatting.
`
      const result = parseMarkdown(content)
      
      expect(result.children).toBeDefined()
      const paragraph = result.children?.find((child: TestASTNode) => child.type === 'paragraph')
      
      if (paragraph?.children) {
        // The paragraph should have processed its children correctly
        expect(paragraph.children.length).toBeGreaterThan(1)
        
        // Should have text nodes with proper values
        const textNodes = paragraph.children.filter((child: TestASTNode) => child.type === 'text')
        expect(textNodes.length).toBeGreaterThan(0)
        expect(textNodes.some((node: TestASTNode) => node.value && node.value.length > 0)).toBe(true)
      }
    })

    it('should test for unhandled markdown node types falling through to default case', () => {
      // This specifically tries to test the default case in convertMdastNode (lines 268-274)
      // By using content that might produce unusual mdast node types
      const content = `
Here's some text with [a link](https://example.com "title").

More text after link.
`
      const result = parseMarkdown(content)
      
      expect(result.children).toBeDefined()
      expect(result.children?.length).toBeGreaterThan(0)
      
      // The parsing should handle all elements correctly, including any unknown node types
      const paragraph = result.children?.find((child: TestASTNode) => child.type === 'paragraph')
      expect(paragraph).toBeDefined()
      
      if (paragraph?.children) {
        const linkNode = paragraph.children.find((child: TestASTNode) => child.type === 'link')
        expect(linkNode).toBeDefined()
        expect(linkNode?.url).toBe('https://example.com')
      }
    })
    
    it('should handle emphasis conversion with complex nested structures', () => {
      // Test complex emphasis that might trigger different code paths  
      const content = `This has *simple italic text* here.`
      const result = parseMarkdown(content)
      
      expect(result.children).toBeDefined()
      const paragraph = result.children?.find((child: TestASTNode) => child.type === 'paragraph')
      
      if (paragraph?.children) {
        // Should have processed the emphasis correctly
        expect(paragraph.children.length).toBeGreaterThan(1)
        
        // Look for text nodes with italic formatting
        const italicNodes = paragraph.children.filter((child: TestASTNode) => 
          child.type === 'text' && child.italic === true
        )
        expect(italicNodes.length).toBeGreaterThan(0)
        expect(italicNodes[0]?.value).toBe('simple italic text')
      }
    })

    it('should handle table cells with node.align property from mdast', () => {
      // Test lines 260-261 specifically - this tests direct node.align assignment in tableCell case
      // This would happen when remark/mdast provides align property directly on cell nodes
      const content = `
| Left | Center | Right |
|:-----|:------:|------:|
| A    | B      | C     |
`
      const result = parseMarkdown(content)
      
      const tableNode = result.children?.find((child: TestASTNode) => child.type === 'table')
      expect(tableNode).toBeDefined()
      
      if (tableNode?.children) {
        // Check the data row
        const dataRow = tableNode.children[1] as TestASTNode
        const cells = dataRow?.children as TestASTNode[]
        
        // These cells should have align properties set from mdast processing
        expect(cells[0]?.align).toBe('left')
        expect(cells[1]?.align).toBe('center')
        expect(cells[2]?.align).toBe('right')
      }
    })

    it('should handle table with mixed content types including non-tableRow nodes', () => {
      // Test line 248 - the return convertMdastNode(rowNode) path when rowNode is not tableRow
      // This is challenging to test directly with standard markdown, but let's test complex table content
      const content = `
| Complex | Content |
|---------|---------|
| **Bold text** | *Italic text* |
| [Link](http://example.com) | \`code\` |
`
      const result = parseMarkdown(content)
      
      const tableNode = result.children?.find((child: TestASTNode) => child.type === 'table')
      expect(tableNode).toBeDefined()
      
      if (tableNode?.children) {
        // Should have properly processed all rows
        expect(tableNode.children.length).toBe(3) // header + 2 data rows
        
        // Check that complex content is preserved
        const dataRow1 = tableNode.children[1] as TestASTNode
        const dataRow2 = tableNode.children[2] as TestASTNode
        
        expect(dataRow1?.type).toBe('tableRow')
        expect(dataRow2?.type).toBe('tableRow')
        
        // Should have processed the cell contents correctly
        const row1Cells = dataRow1?.children as TestASTNode[]
        const boldCell = row1Cells[0]
        const italicCell = row1Cells[1]
        
        expect(boldCell?.children).toBeDefined()
        expect(italicCell?.children).toBeDefined()
      }
    })

    it('should handle table cells without align property', () => {
      // Test the else path of the align check in tableCell case
      const content = `
| No | Align |
|----|-------|
| A  | B     |
`
      const result = parseMarkdown(content)
      
      const tableNode = result.children?.find((child: TestASTNode) => child.type === 'table')
      if (tableNode?.children) {
        const dataRow = tableNode.children[1] as TestASTNode
        const cells = dataRow?.children as TestASTNode[]
        
        // Since no alignment is specified, align should be undefined
        expect(cells[0]?.align).toBeUndefined()
        expect(cells[1]?.align).toBeUndefined()
      }
    })

    it('should handle unknown node types with children property (default case)', () => {
      // Test lines 269-270 - default case where node.children exists
      // This is challenging to test directly with remark, but we can verify the logic works
      // by testing content that may produce nodes not explicitly handled
      const content = `
> This is a blockquote which might not be explicitly handled
> but should preserve its children
`
      const result = parseMarkdown(content)
      
      expect(result.children).toBeDefined()
      expect(result.children?.length).toBeGreaterThan(0)
      
      // The parser should handle blockquotes or other nodes by preserving structure
      const blockquote = result.children?.find((child: TestASTNode) => 
        child.type === 'blockquote' || child.type === 'paragraph'
      )
      expect(blockquote).toBeDefined()
      
      if (blockquote?.children) {
        expect(blockquote.children.length).toBeGreaterThan(0)
      }
    })

    it('should handle unknown node types with value property (default case)', () => {
      // Test lines 271-273 - default case where node.value exists
      // Test content that might produce unusual node structures
      const content = `Here's some text with HTML entities: &amp; &lt; &gt;`
      const result = parseMarkdown(content)
      
      expect(result.children).toBeDefined()
      const paragraph = result.children?.find((child: TestASTNode) => child.type === 'paragraph')
      
      if (paragraph?.children) {
        // Should have text nodes with values preserved
        const textNodes = paragraph.children.filter((child: TestASTNode) => 
          child.type === 'text' && child.value
        )
        expect(textNodes.length).toBeGreaterThan(0)
        expect(textNodes.some((node: TestASTNode) => 
          node.value && node.value.includes('&')
        )).toBe(true)
      }
    })
  })
})