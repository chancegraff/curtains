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

        const tableNode = result.children.find((child: TestASTNode) => child.type === 'table')
        expect(tableNode).toBeDefined()

        if (tableNode?.type === 'table' && tableNode.children) {
          expect(tableNode.children).toHaveLength(2)
          
          // When no separator, first row should be treated as header
          const firstRow = tableNode.children[0] as TestASTNode
          const firstRowCells = firstRow.children as TestASTNode[]
          
          expect(firstRowCells[0]?.header).toBe(true)
          expect(firstRowCells[0]?.children[0]?.value).toBe('Data 1')
        }
      })

      it('should handle malformed table gracefully', () => {
        // Arrange
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

        const tableNode = result.children.find((child: TestASTNode) => child.type === 'table')
        expect(tableNode).toBeDefined()

        if (tableNode?.type === 'table' && tableNode.children) {
          expect(tableNode.children).toHaveLength(2)
          
          // Should still parse each row independently
          const firstRow = tableNode.children[0] as TestASTNode
          expect(firstRow.children).toHaveLength(2)
          
          const secondRow = tableNode.children[1] as TestASTNode
          expect(secondRow.children).toHaveLength(3)
        }
      })
    })
  })
})