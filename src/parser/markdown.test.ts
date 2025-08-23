import { parseMarkdown } from './markdown.js'

// Type for the raw markdown AST node from parseMarkdown (before conversion to our AST)
interface RawMarkdownNode {
  type: string
  children?: RawMarkdownNode[]
  depth?: number
  value?: string
  url?: string
  alt?: string
  classes?: string[]
  ordered?: boolean
  header?: boolean
  align?: 'left' | 'center' | 'right'
  bold?: boolean
  lang?: string
}

// Type guards for better type safety in tests
function isParagraphNode(node: RawMarkdownNode): node is RawMarkdownNode & { type: 'paragraph'; children: RawMarkdownNode[] } {
  return node.type === 'paragraph'
}

function isHeadingNode(node: RawMarkdownNode): node is RawMarkdownNode & { type: 'heading'; depth: number; children: RawMarkdownNode[] } {
  return node.type === 'heading'
}

function isListNode(node: RawMarkdownNode): node is RawMarkdownNode & { type: 'list'; ordered?: boolean; children: RawMarkdownNode[] } {
  return node.type === 'list'
}

function isLinkNode(node: RawMarkdownNode): node is RawMarkdownNode & { type: 'link'; url: string; children: RawMarkdownNode[] } {
  return node.type === 'link'
}

function isImageNode(node: RawMarkdownNode): node is RawMarkdownNode & { type: 'image'; url: string; alt?: string; classes?: string[] } {
  return node.type === 'image'
}

function isCodeNode(node: RawMarkdownNode): node is RawMarkdownNode & { type: 'code'; value: string; lang?: string } {
  return node.type === 'code'
}

function isTableNode(node: RawMarkdownNode): node is RawMarkdownNode & { type: 'table'; children: RawMarkdownNode[] } {
  return node.type === 'table'
}

function isTableRowNode(node: RawMarkdownNode): node is RawMarkdownNode & { type: 'tableRow'; children: RawMarkdownNode[] } {
  return node.type === 'tableRow'
}

function isTableCellNode(node: RawMarkdownNode): node is RawMarkdownNode & { type: 'tableCell'; children: RawMarkdownNode[]; header?: boolean; align?: 'left' | 'center' | 'right' } {
  return node.type === 'tableCell'
}

function isTextNode(node: RawMarkdownNode): node is RawMarkdownNode & { type: 'text'; value: string; bold?: boolean } {
  return node.type === 'text'
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
      
      const child0 = result.children[0]
      const child1 = result.children[1]
      const child2 = result.children[2]
      
      expect(child0?.type).toBe('heading')
      expect(child1?.type).toBe('heading')
      expect(child2?.type).toBe('heading')
      
      if (child0 && isHeadingNode(child0)) {
        expect(child0.depth).toBe(1)
      }
      if (child1 && isHeadingNode(child1)) {
        expect(child1.depth).toBe(2)
      }
      if (child2 && isHeadingNode(child2)) {
        expect(child2.depth).toBe(3)
      }
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
      
      const paragraph = result.children[0]
      expect(paragraph?.type).toBe('paragraph')
      if (paragraph && isParagraphNode(paragraph)) {
        expect(paragraph.children.length).toBeGreaterThan(0)
      }
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
      
      const list = result.children.find((child: RawMarkdownNode) => 
        child.type === 'list' && child.ordered !== true
      )
      expect(list).toBeDefined()
      
      if (list && isListNode(list)) {
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
      
      const orderedList = result.children.find((child: RawMarkdownNode) => 
        child.type === 'list' && child.ordered === true
      )
      expect(orderedList).toBeDefined()
      
      if (orderedList && isListNode(orderedList)) {
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
      
      const paragraph = result.children[0]
      expect(paragraph?.type).toBe('paragraph')
      
      if (paragraph && isParagraphNode(paragraph)) {
        const linkNode = paragraph.children.find((child: RawMarkdownNode) => child.type === 'link')
        expect(linkNode).toBeDefined()
        
        if (linkNode && isLinkNode(linkNode)) {
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
      
      const imageNode = result.children.find((child: RawMarkdownNode) => child.type === 'image')
      expect(imageNode).toBeDefined()
      
      if (imageNode && isImageNode(imageNode)) {
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
      
      const paragraph = result.children[0]
      expect(paragraph?.type).toBe('paragraph')
      if (paragraph && isParagraphNode(paragraph)) {
        const firstChild = paragraph.children[0]
        if (firstChild && isTextNode(firstChild)) {
          expect(firstChild.value).toContain('{{CONTAINER:')
        }
      }
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
      
      expect(result.children[0]?.type).toBe('heading')
      expect(result.children[1]?.type).toBe('paragraph')
      expect(result.children[2]?.type).toBe('heading')
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
      expect(result.children[0]?.type).toBe('paragraph')
      
      // Verify the content contains the placeholder text
      const paragraph = result.children[0]
      if (paragraph && isParagraphNode(paragraph)) {
        const firstChild = paragraph.children[0]
        if (firstChild && isTextNode(firstChild)) {
          expect(firstChild.value).toContain('{{CONTAINER:container_0:## First Container}}')
        }
      }
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
      
      expect(result.children[0]?.type).toBe('heading')
      expect(result.children[1]?.type).toBe('paragraph')
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
      
      const imageNode = result.children.find((child: RawMarkdownNode) => child.type === 'image')
      expect(imageNode).toBeDefined()
      
      if (imageNode && isImageNode(imageNode)) {
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
      
      const imageNode = result.children.find((child: RawMarkdownNode) => child.type === 'image')
      expect(imageNode).toBeDefined()
      
      if (imageNode && isImageNode(imageNode)) {
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
      
      const imageNode = result.children.find((child: RawMarkdownNode) => child.type === 'image')
      expect(imageNode).toBeDefined()
      
      if (imageNode && isImageNode(imageNode)) {
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
      
      const imageNode = result.children.find((child: RawMarkdownNode) => child.type === 'image')
      expect(imageNode).toBeDefined()
      
      if (imageNode && isImageNode(imageNode)) {
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
      
      const paragraph = result.children[0]
      expect(paragraph?.type).toBe('paragraph')
      
      if (paragraph && isParagraphNode(paragraph)) {
        const imageNode = paragraph.children.find((child: RawMarkdownNode) => child.type === 'image')
        expect(imageNode).toBeDefined()
        
        if (imageNode && isImageNode(imageNode)) {
          expect(imageNode.url).toBe('./logo.svg')
          expect(imageNode.alt).toBe('Logo')
          expect(imageNode.classes).toEqual(['inline-img'])
        }
        
        // Should have text nodes before and after the image
        const textNodes = paragraph.children.filter((child: RawMarkdownNode) => child.type === 'text')
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
      
      const imageNode = result.children.find((child: RawMarkdownNode) => child.type === 'image')
      expect(imageNode).toBeDefined()
      
      if (imageNode && isImageNode(imageNode)) {
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
      
      const imageNode = result.children.find((child: RawMarkdownNode) => child.type === 'image')
      expect(imageNode).toBeDefined()
      
      if (imageNode && isImageNode(imageNode)) {
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
      
      const paragraph = result.children[0]
      expect(paragraph?.type).toBe('paragraph')
      if (paragraph && isParagraphNode(paragraph)) {
        const firstChild = paragraph.children[0]
        if (firstChild && isTextNode(firstChild)) {
          expect(firstChild.value).toContain('<img')
        }
      }
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

        const codeNode = result.children.find((child: RawMarkdownNode) => child.type === 'code')
        expect(codeNode).toBeDefined()

        if (codeNode && isCodeNode(codeNode)) {
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

        const codeNode = result.children.find((child: RawMarkdownNode) => child.type === 'code')
        expect(codeNode).toBeDefined()

        if (codeNode && isCodeNode(codeNode)) {
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

        const codeNode = result.children.find((child: RawMarkdownNode) => child.type === 'code')
        expect(codeNode).toBeDefined()

        if (codeNode && isCodeNode(codeNode)) {
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

        const codeNode = result.children.find((child: RawMarkdownNode) => child.type === 'code')
        expect(codeNode).toBeDefined()

        if (codeNode && isCodeNode(codeNode)) {
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

        const codeNode = result.children.find((child: RawMarkdownNode) => child.type === 'code')
        expect(codeNode).toBeDefined()

        if (codeNode && isCodeNode(codeNode)) {
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

        const codeNode = result.children.find((child: RawMarkdownNode) => child.type === 'code')
        expect(codeNode).toBeDefined()

        if (codeNode?.type === 'code' && codeNode.value !== undefined) {
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

        const tableNode = result.children.find((child: RawMarkdownNode) => child.type === 'table')
        expect(tableNode).toBeDefined()

        if (tableNode && isTableNode(tableNode)) {
          expect(tableNode.children).toHaveLength(3) // 1 header + 2 data rows

          // Check header row
          const headerRow = tableNode.children[0]
          expect(headerRow?.type).toBe('tableRow')
          if (headerRow && isTableRowNode(headerRow)) {
            expect(headerRow.children).toHaveLength(3)

            const firstCell = headerRow.children[0]
            expect(firstCell?.type).toBe('tableCell')
            if (firstCell && isTableCellNode(firstCell)) {
              expect(firstCell.header).toBe(true)
              const firstTextChild = firstCell.children[0]
              if (firstTextChild && isTextNode(firstTextChild)) {
                expect(firstTextChild.value).toBe('Name')
              }
            }
          }
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

        const tableNode = result.children.find((child: RawMarkdownNode) => child.type === 'table')
        expect(tableNode).toBeDefined()

        if (tableNode && isTableNode(tableNode)) {
          expect(tableNode.children).toHaveLength(2) // 1 header + 1 data row

          // Check data row alignment
          const dataRow = tableNode.children[1]
          if (dataRow && isTableRowNode(dataRow)) {
            const cell0 = dataRow.children[0]
            const cell1 = dataRow.children[1]
            const cell2 = dataRow.children[2]
            
            if (cell0 && isTableCellNode(cell0)) expect(cell0.align).toBe('left')
            if (cell1 && isTableCellNode(cell1)) expect(cell1.align).toBe('center')
            if (cell2 && isTableCellNode(cell2)) expect(cell2.align).toBe('right')
          }
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

        const tableNode = result.children.find((child: RawMarkdownNode) => child.type === 'table')
        expect(tableNode).toBeDefined()

        if (tableNode && isTableNode(tableNode)) {
          const dataRow = tableNode.children[1]
          if (dataRow && isTableRowNode(dataRow)) {
            const firstCell = dataRow.children[0]
            const secondCell = dataRow.children[1]
            
            // Check bold formatting in first cell
            if (firstCell && isTableCellNode(firstCell)) {
              const firstTextNode = firstCell.children[0]
              expect(firstTextNode?.type).toBe('text')
              if (firstTextNode && isTextNode(firstTextNode)) {
                expect(firstTextNode.bold).toBe(true)
              }
            }
            
            // Check link in second cell
            if (secondCell && isTableCellNode(secondCell)) {
              const linkNode = secondCell.children.find((child: RawMarkdownNode) => child.type === 'link')
              expect(linkNode).toBeDefined()
              if (linkNode && isLinkNode(linkNode)) {
                expect(linkNode.url).toBe('https://example.com')
              }
            }
          }
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

        const tableNode = result.children.find((child: RawMarkdownNode) => child.type === 'table')
        expect(tableNode).toBeDefined()

        if (tableNode && isTableNode(tableNode)) {
          expect(tableNode.children).toHaveLength(3) // 1 header + 2 data rows
          
          const headerRow = tableNode.children[0]
          if (headerRow && isTableRowNode(headerRow)) {
            expect(headerRow.children).toHaveLength(3)
          }
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

        const tableNode = result.children.find((child: RawMarkdownNode) => child.type === 'table')
        expect(tableNode).toBeDefined()

        if (tableNode && isTableNode(tableNode)) {
          const dataRow1 = tableNode.children[1]
          const dataRow2 = tableNode.children[2]
          
          // Check empty cell content
          if (dataRow1 && isTableRowNode(dataRow1)) {
            const middleCell = dataRow1.children[1]
            if (middleCell && isTableCellNode(middleCell)) {
              const firstTextNode = middleCell.children[0]
              if (firstTextNode && isTextNode(firstTextNode)) {
                expect(firstTextNode.value).toBe('')
              }
            }
          }
          
          if (dataRow2 && isTableRowNode(dataRow2)) {
            const firstCell = dataRow2.children[0]
            if (firstCell && isTableCellNode(firstCell)) {
              const firstTextNode = firstCell.children[0]
              if (firstTextNode && isTextNode(firstTextNode)) {
                expect(firstTextNode.value).toBe('')
              }
            }
            const lastCell = dataRow2.children[2]
            if (lastCell && isTableCellNode(lastCell)) {
              const firstTextNode = lastCell.children[0]
              if (firstTextNode && isTextNode(firstTextNode)) {
                expect(firstTextNode.value).toBe('')
              }
            }
          }
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

        const tableNode = result.children.find((child: RawMarkdownNode) => child.type === 'table')
        expect(tableNode).toBeDefined()

        if (tableNode && isTableNode(tableNode)) {
          expect(tableNode.children).toHaveLength(1) // Just header row
          
          const headerRow = tableNode.children[0]
          if (headerRow && isTableRowNode(headerRow)) {
            const firstHeaderCell = headerRow.children[0]
            if (firstHeaderCell && isTableCellNode(firstHeaderCell)) {
              expect(firstHeaderCell.header).toBe(true)
              const firstTextNode = firstHeaderCell.children[0]
              if (firstTextNode && isTextNode(firstTextNode)) {
                expect(firstTextNode.value).toBe('Column 1')
              }
            }
          }
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
        const paragraphNode = result.children.find((child: RawMarkdownNode) => child.type === 'paragraph')
        expect(paragraphNode).toBeDefined()
        
        if (paragraphNode?.children?.[0]) {
          const textNode = paragraphNode.children[0]
          expect(textNode?.type).toBe('text')
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
        const paragraphNode = result.children.find((child: RawMarkdownNode) => child.type === 'paragraph')
        expect(paragraphNode).toBeDefined()
        
        if (paragraphNode?.children?.[0]) {
          const textNode = paragraphNode.children[0]
          expect(textNode?.type).toBe('text')
          expect(textNode.value).toBe('| Column 1 | Column 2\n| Data 1 | Data 2 | Data 3 |')
        }
      })
    })
  })
})