import { parseContainers, buildAST } from './containers.js'
import { DEFAULTS } from '../config/constants.js'
import type { ASTNode, ContainerNode, ParagraphNode, TextNode } from '../ast/types.js'

// Type guards for better type safety in tests
function isContainerNode(node: unknown): node is ContainerNode {
  return typeof node === 'object' && node !== null && 'type' in node && 
    'children' in node && 'classes' in node && 
    typeof (node.type) === 'string' && node.type === 'container'
}

function isParagraphNode(node: unknown): node is ParagraphNode {
  return typeof node === 'object' && node !== null && 'type' in node && 
    'children' in node &&
    typeof (node.type) === 'string' && node.type === 'paragraph'
}

function isTextNode(node: unknown): node is TextNode {
  return typeof node === 'object' && node !== null && 'type' in node && 
    'value' in node &&
    typeof (node.type) === 'string' && node.type === 'text'
}

describe('Parser - Container Parsing', () => {
  describe('parseContainers', () => {
    it('should parse simple container', () => {
      // Arrange
      const content = `
<container class="test">
# Container Content
</container>
`

      // Act
      const result = parseContainers(content)

      // Assert
      expect(result.ast).toHaveLength(1)
      
      const containerNode = result.ast[0]
      expect(containerNode?.type).toBe('container')
      if (isContainerNode(containerNode)) {
        expect(containerNode.classes).toEqual(['test'])
        expect(containerNode.children).toHaveLength(1)
        const firstChild = containerNode.children[0]
        expect(firstChild?.type).toBe('heading')
      }
    })

    it('should parse nested containers', () => {
      // Arrange
      const content = `
<container class="outer">
  # Outer Container
  
  <container class="inner">
    ## Inner Container
    Some content here
  </container>
</container>
`

      // Act
      const result = parseContainers(content)

      // Assert
      expect(result.ast).toHaveLength(1)
      
      const outerContainer = result.ast[0]
      expect(outerContainer?.type).toBe('container')
      if (isContainerNode(outerContainer)) {
        expect(outerContainer.classes).toEqual(['outer'])
        
        // Find the inner container among children
        const innerContainer = outerContainer.children.find((child: ASTNode) => child.type === 'container')
        expect(innerContainer).toBeDefined()
        if (isContainerNode(innerContainer)) {
          expect(innerContainer.classes).toEqual(['inner'])
        }
      }
    })

    it('should parse container with multiple classes', () => {
      // Arrange
      const content = `
<container class="class1 class-2 class_3">
# Multiple classes
</container>
`

      // Act
      const result = parseContainers(content)

      // Assert
      expect(result.ast).toHaveLength(1)
      const containerNode = result.ast[0]
      if (isContainerNode(containerNode)) {
        expect(containerNode.classes).toEqual(['class1', 'class-2', 'class_3'])
      }
    })

    it('should handle container with empty class attribute', () => {
      // Arrange
      const content = `
<container class="">
# Empty class
</container>
`

      // Act
      const result = parseContainers(content)

      // Assert
      expect(result.ast).toHaveLength(1)
      const containerNode = result.ast[0]
      if (isContainerNode(containerNode)) {
        expect(containerNode.classes).toEqual([])
      }
    })

    it('should parse container without class attribute', () => {
      // Arrange
      const content = `
<container>
# Container Content
</container>
`

      // Act
      const result = parseContainers(content)

      // Assert
      expect(result.ast).toHaveLength(1)
      
      const containerNode = result.ast[0]
      expect(containerNode?.type).toBe('container')
      if (isContainerNode(containerNode)) {
        expect(containerNode.classes).toEqual([])
      }
    })

    it('should parse nested containers without class attributes', () => {
      // Arrange
      const content = `
<container class="columns">
  <container>
    ### Tables in Containers
    | Language | Type | Year |
    |:---------|:-----|-----:|
    | JavaScript | Dynamic | 1995 |
  </container>

  <container>
    ### Code in Containers
    \`\`\`bash
    npm install
    \`\`\`
  </container>
</container>
`

      // Act
      const result = parseContainers(content)

      // Assert
      expect(result.ast).toHaveLength(1)
      
      const outerContainer = result.ast[0]
      expect(outerContainer?.type).toBe('container')
      if (isContainerNode(outerContainer)) {
        expect(outerContainer.classes).toEqual(['columns'])
        
        const innerContainers = outerContainer.children.filter((child: ASTNode) => child.type === 'container')
        expect(innerContainers).toHaveLength(2)
        if (isContainerNode(innerContainers[0])) {
          expect(innerContainers[0].classes).toEqual([])
        }
        if (isContainerNode(innerContainers[1])) {
          expect(innerContainers[1].classes).toEqual([])
        }
      }
    })

    it('should throw error for invalid class names', () => {
      // Arrange
      const content = `
<container class="invalid@class">
# Invalid class name
</container>
`

      // Act & Assert
      expect(() => parseContainers(content)).toThrow('Invalid class name: invalid@class')
    })

    it('should throw error for deep container nesting', () => {
      // Arrange
      let deepNesting = ''
      for (let i = 1; i <= DEFAULTS.MAX_NESTING_DEPTH + 1; i++) {
        deepNesting += `<container class="level${i}">`
      }
      deepNesting += '# Deep content'
      for (let i = 1; i <= DEFAULTS.MAX_NESTING_DEPTH + 1; i++) {
        deepNesting += '</container>'
      }

      // Act & Assert
      expect(() => parseContainers(deepNesting)).toThrow(`Container nesting too deep (max ${DEFAULTS.MAX_NESTING_DEPTH})`)
    })

    it('should handle orphaned closing tags', () => {
      // Arrange
      const content = `
Some content
</container>
More content
`

      // Act
      const result = parseContainers(content)

      // Assert
      expect(result.ast.length).toBeGreaterThan(0)
      // Orphaned closing tag should be filtered out (as it's empty), 
      // but we should have the other content
      expect(result.ast).toHaveLength(2)
      const firstNode = result.ast[0]
      const secondNode = result.ast[1]
      expect(firstNode?.type).toBe('paragraph')
      expect(secondNode?.type).toBe('paragraph')
      
      // Check content is preserved  
      const firstNodeTyped = result.ast[0]
      const secondNodeTyped = result.ast[1]
      if (isParagraphNode(firstNodeTyped) && isTextNode(firstNodeTyped.children[0])) {
        expect(firstNodeTyped.children[0].value).toBe('Some content')
      }
      if (isParagraphNode(secondNodeTyped) && isTextNode(secondNodeTyped.children[0])) {
        expect(secondNodeTyped.children[0].value).toBe('More content')
      }
    })

    it('should handle unclosed containers', () => {
      // Arrange
      const content = `
<container class="unclosed">
# Some content
More content without closing tag
`

      // Act
      const result = parseContainers(content)

      // Assert
      expect(result.ast.length).toBeGreaterThan(0)
      // Unclosed container should be treated as regular content
      // The opening tag should appear as a text node
      const firstNodeUnclosed = result.ast[0]
      const secondNodeUnclosed = result.ast[1]
      const thirdNodeUnclosed = result.ast[2]
      expect(firstNodeUnclosed?.type).toBe('text')
      if (isTextNode(firstNodeUnclosed)) {
        expect(firstNodeUnclosed.value).toBe('<container class="unclosed">')
      }
      
      // And the content should be parsed normally
      expect(secondNodeUnclosed?.type).toBe('heading')
      expect(thirdNodeUnclosed?.type).toBe('paragraph')
    })

    it('should handle unclosed containers without class attribute', () => {
      // Arrange
      const content = `
<container>
# Some content
More content without closing tag
`

      // Act
      const result = parseContainers(content)

      // Assert
      expect(result.ast.length).toBeGreaterThan(0)
      // Unclosed container should be treated as regular content
      // The opening tag should appear as a text node
      const firstNodeNoClass = result.ast[0]
      const secondNodeNoClass = result.ast[1]
      const thirdNodeNoClass = result.ast[2]
      expect(firstNodeNoClass?.type).toBe('text')
      if (isTextNode(firstNodeNoClass)) {
        expect(firstNodeNoClass.value).toBe('<container>')
      }
      
      // And the content should be parsed normally
      expect(secondNodeNoClass?.type).toBe('heading')
      expect(thirdNodeNoClass?.type).toBe('paragraph')
    })
  })

  describe('buildAST', () => {
    it('should build AST with container nodes', () => {
      // Arrange
      const content = `
<container class="test">
# Container Content
</container>
`
      const containerResult = parseContainers(content)

      // Act
      const result = buildAST(containerResult)

      // Assert
      expect(result.type).toBe('root')
      expect(result.children).toHaveLength(1)
      
      const container = result.children[0]
      expect(container?.type).toBe('container')
      if (isContainerNode(container)) {
        expect(container.classes).toEqual(['test'])
        expect(container.children).toHaveLength(1)
        const containerFirstChild = container.children[0]
        expect(containerFirstChild?.type).toBe('heading')
      }
    })

    it('should handle nested containers in AST', () => {
      // Arrange
      const content = `
<container class="outer">
  # Outer Container
  
  <container class="inner">
    ## Inner Container
  </container>
</container>
`
      const containerResult = parseContainers(content)

      // Act
      const result = buildAST(containerResult)

      // Assert
      expect(result.children).toHaveLength(1)
      
      const outerContainer = result.children[0]
      expect(outerContainer?.type).toBe('container')
      if (isContainerNode(outerContainer)) {
        expect(outerContainer.classes).toEqual(['outer'])
        
        // Find the inner container among children
        const innerContainer = outerContainer.children.find((child: ASTNode) => child.type === 'container')
        expect(innerContainer).toBeDefined()
        
        if (isContainerNode(innerContainer)) {
          expect(innerContainer.classes).toEqual(['inner'])
        }
      }
    })

    it('should handle mixed content and containers', () => {
      // Arrange
      const content = `
# Before Container

<container class="middle">
  ## Inside Container
</container>

# After Container
`
      const containerResult = parseContainers(content)

      // Act
      const result = buildAST(containerResult)

      // Assert
      expect(result.children).toHaveLength(3)
      const firstChild = result.children[0]
      const secondChild = result.children[1]
      const thirdChild = result.children[2]
      expect(firstChild?.type).toBe('heading')
      expect(secondChild?.type).toBe('container')
      expect(thirdChild?.type).toBe('heading')
    })

    it('should handle various markdown node types', () => {
      // Arrange
      const content = `
# Heading
This is a paragraph with **bold** text.
- List item 1
- List item 2
![Image](https://example.com/image.png)
[Link](https://example.com)
`
      const containerResult = parseContainers(content)

      // Act
      const result = buildAST(containerResult)

      // Assert
      expect(result.children.length).toBeGreaterThan(0)
      const types = result.children.map((child: ASTNode) => child.type)
      expect(types).toContain('heading')
      expect(types).toContain('paragraph')
    })

    it('should handle container with only empty lines', () => {
      // Arrange - this will test lines 63-64 in dedentContent function
      const content = `
<container class="empty-lines">


   

</container>
`

      // Act
      const result = parseContainers(content)

      // Assert
      expect(result.ast).toHaveLength(1)
      const containerNode = result.ast[0]
      if (isContainerNode(containerNode)) {
        expect(containerNode.classes).toEqual(['empty-lines'])
        expect(containerNode.children).toHaveLength(0) // Empty content should result in no children
      }
    })

    it('should handle container with mixed empty and content lines', () => {
      // Arrange - this will test lines 77-78 in dedentContent function
      const content = `
<container class="mixed-lines">
    # Heading

    
    Content with empty lines
    
    More content
</container>
`

      // Act
      const result = parseContainers(content)

      // Assert
      expect(result.ast).toHaveLength(1)
      const containerNode = result.ast[0]
      if (isContainerNode(containerNode)) {
        expect(containerNode.classes).toEqual(['mixed-lines'])
        expect(containerNode.children.length).toBeGreaterThan(0)
        // Should have heading and paragraph nodes
        const types = containerNode.children.map((child: ASTNode) => child.type)
        expect(types).toContain('heading')
        expect(types).toContain('paragraph')
      }
    })

    it('should handle content with strikethrough and inline code (unknown node types)', () => {
      // Arrange - this will test line 416 in convertMarkdownNode function
      // Using strikethrough and inline code which may produce 'delete' and 'inlineCode' nodes
      const content = `
<container class="unknown-test">
This text has ~~strikethrough~~ and \`inline code\` in it.
Regular text continues here.
</container>
`

      // Act
      const result = parseContainers(content)

      // Assert
      expect(result.ast).toHaveLength(1)
      const containerNode = result.ast[0]
      if (isContainerNode(containerNode)) {
        expect(containerNode.classes).toEqual(['unknown-test'])
        // The container should still process the text content it can handle
        expect(containerNode.children.length).toBeGreaterThan(0)
        // Should contain paragraph with text
        const types = containerNode.children.map((child: ASTNode) => child.type)
        expect(types).toContain('paragraph')
      }
    })
  })
})