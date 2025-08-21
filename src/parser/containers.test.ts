import { parseContainers, buildAST } from './containers.js'
import { DEFAULTS } from '../config/constants.js'

// Type helpers for tests
type TestASTNode = {
  type: string
  [key: string]: any
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
      
      const containerNode = result.ast[0] as TestASTNode
      expect(containerNode?.type).toBe('container')
      expect(containerNode?.classes).toEqual(['test'])
      expect(containerNode?.children).toHaveLength(1)
      expect(containerNode?.children[0]?.type).toBe('heading')
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
      
      const outerContainer = result.ast[0] as TestASTNode
      expect(outerContainer.type).toBe('container')
      expect(outerContainer.classes).toEqual(['outer'])
      
      // Find the inner container among children
      const innerContainer = outerContainer.children.find((child: TestASTNode) => child.type === 'container')
      expect(innerContainer).toBeDefined()
      expect(innerContainer.classes).toEqual(['inner'])
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
      const containerNode = result.ast[0] as TestASTNode
      expect(containerNode?.classes).toEqual(['class1', 'class-2', 'class_3'])
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
      const containerNode = result.ast[0] as TestASTNode
      expect(containerNode?.classes).toEqual([])
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
      
      const containerNode = result.ast[0] as TestASTNode
      expect(containerNode?.type).toBe('container')
      expect(containerNode?.classes).toEqual([])
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
      
      const outerContainer = result.ast[0] as TestASTNode
      expect(outerContainer.type).toBe('container')
      expect(outerContainer.classes).toEqual(['columns'])
      
      const innerContainers = outerContainer.children.filter((child: TestASTNode) => child.type === 'container')
      expect(innerContainers).toHaveLength(2)
      expect(innerContainers[0]?.classes).toEqual([])
      expect(innerContainers[1]?.classes).toEqual([])
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
      expect((result.ast[0] as any)?.type).toBe('paragraph')
      expect((result.ast[1] as any)?.type).toBe('paragraph')
      
      // Check content is preserved  
      expect((result.ast[0] as any)?.children[0]?.value).toBe('Some content')
      expect((result.ast[1] as any)?.children[0]?.value).toBe('More content')
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
      expect((result.ast[0] as any)?.type).toBe('text')
      expect((result.ast[0] as any)?.value).toBe('<container class="unclosed">')
      
      // And the content should be parsed normally
      expect((result.ast[1] as any)?.type).toBe('heading')
      expect((result.ast[2] as any)?.type).toBe('paragraph')
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
      expect((result.ast[0] as any)?.type).toBe('text')
      expect((result.ast[0] as any)?.value).toBe('<container>')
      
      // And the content should be parsed normally
      expect((result.ast[1] as any)?.type).toBe('heading')
      expect((result.ast[2] as any)?.type).toBe('paragraph')
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
      
      const container = result.children[0] as TestASTNode
      expect(container.type).toBe('container')
      expect(container.classes).toEqual(['test'])
      expect(container.children).toHaveLength(1)
      expect(container.children[0]?.type).toBe('heading')
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
      
      const outerContainer = result.children[0] as TestASTNode
      expect(outerContainer.type).toBe('container')
      expect(outerContainer.classes).toEqual(['outer'])
      
      // Find the inner container among children
      const innerContainer = outerContainer.children.find((child: TestASTNode) => child.type === 'container')
      expect(innerContainer).toBeDefined()
      
      if (innerContainer !== undefined && innerContainer.type === 'container') {
        expect(innerContainer.classes).toEqual(['inner'])
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
      expect((result.children[0] as TestASTNode)?.type).toBe('heading')
      expect((result.children[1] as TestASTNode)?.type).toBe('container')
      expect((result.children[2] as TestASTNode)?.type).toBe('heading')
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
      const types = result.children.map((child: any) => child.type)
      expect(types).toContain('heading')
      expect(types).toContain('paragraph')
    })
  })
})