// AST Types Tests
// Tests for type exports and interfaces to ensure type consistency and proper inference

import { describe, it, expect } from 'vitest'
import type {
  NodeType,
  TextNode,
  HeadingNode,
  ParagraphNode,
  ListNode,
  ListItemNode,
  LinkNode,
  ImageNode,
  CodeNode,
  ContainerNode,
  ASTNode,
  CurtainsAST,
  CurtainsSlide,
  CurtainsDocument,
  TransformedSlide,
  TransformedDocument
} from './types.js'

// Type guard functions to help TypeScript with union type discrimination
function isTextNode(node: unknown): node is TextNode {
  return typeof node === 'object' && node !== null && 'type' in node && (node as {type: string}).type === 'text'
}

function isHeadingNode(node: unknown): node is HeadingNode {
  return typeof node === 'object' && node !== null && 'type' in node && (node as {type: string}).type === 'heading'
}

function isContainerNode(node: unknown): node is ContainerNode {
  return typeof node === 'object' && node !== null && 'type' in node && (node as {type: string}).type === 'container'
}

function isParagraphNode(node: unknown): node is ParagraphNode {
  return typeof node === 'object' && node !== null && 'type' in node && (node as {type: string}).type === 'paragraph'
}

function hasChildren(node: unknown): node is HeadingNode | ParagraphNode | ListNode | ListItemNode | ContainerNode | LinkNode {
  return typeof node === 'object' && node !== null && 'children' in node && Array.isArray((node as {children: unknown[]}).children)
}
import {
  NodeTypeSchema,
  TextNodeSchema,
  HeadingNodeSchema,
  ParagraphNodeSchema,
  ListNodeSchema,
  ListItemNodeSchema,
  LinkNodeSchema,
  ImageNodeSchema,
  CodeNodeSchema,
  ContainerNodeSchema,
  ASTNodeSchema,
  CurtainsASTSchema,
  CurtainsSlideSchema,
  CurtainsDocumentSchema,
  TransformedSlideSchema,
  TransformedDocumentSchema
} from './schemas.js'

describe('AST Types', () => {
  describe('Type Inference Consistency', () => {
    it('should have NodeType consistent with schema', () => {
      // Test that the type accepts all valid node types
      const validTypes: NodeType[] = [
        'root', 'container', 'heading', 'paragraph', 'list', 'listItem', 
        'link', 'image', 'code', 'text', 'table', 'tableRow', 'tableCell'
      ]

      validTypes.forEach(type => {
        const result = NodeTypeSchema.safeParse(type)
        expect(result.success).toBe(true)
        if (result.success) {
          // Type should be inferred correctly
          const inferredType: NodeType = result.data
          expect(inferredType).toBe(type)
        }
      })
    })

    it('should have TextNode type consistent with schema', () => {
      const validTextNode: TextNode = {
        type: 'text',
        value: 'Hello world'
      }

      const result = TextNodeSchema.safeParse(validTextNode)
      expect(result.success).toBe(true)
      if (result.success) {
        const parsedNode: TextNode = result.data
        expect(parsedNode.type).toBe('text')
        expect(parsedNode.value).toBe('Hello world')
      }
    })

    it('should have TextNode type with optional formatting', () => {
      const formattedTextNode: TextNode = {
        type: 'text',
        value: 'Formatted text',
        bold: true,
        italic: true
      }

      const result = TextNodeSchema.safeParse(formattedTextNode)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.bold).toBe(true)
        expect(result.data.italic).toBe(true)
      }
    })

    it('should have HeadingNode type consistent with schema', () => {
      const validHeadingNode: HeadingNode = {
        type: 'heading',
        depth: 2,
        children: [
          { type: 'text', value: 'Heading text' }
        ]
      }

      const result = HeadingNodeSchema.safeParse(validHeadingNode)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.depth).toBe(2)
        expect(result.data.children).toHaveLength(1)
      }
    })

    it('should have ParagraphNode type consistent with schema', () => {
      const validParagraphNode: ParagraphNode = {
        type: 'paragraph',
        children: [
          { type: 'text', value: 'Paragraph content' }
        ]
      }

      const result = ParagraphNodeSchema.safeParse(validParagraphNode)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.children).toHaveLength(1)
      }
    })

    it('should have ListNode type consistent with schema', () => {
      const validListNode: ListNode = {
        type: 'list',
        ordered: true,
        children: [
          {
            type: 'listItem',
            children: [{ type: 'text', value: 'Item 1' }]
          }
        ]
      }

      const result = ListNodeSchema.safeParse(validListNode)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.ordered).toBe(true)
      }
    })

    it('should have ListItemNode type consistent with schema', () => {
      const validListItemNode: ListItemNode = {
        type: 'listItem',
        children: [
          { type: 'text', value: 'List item content' }
        ]
      }

      const result = ListItemNodeSchema.safeParse(validListItemNode)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.type).toBe('listItem')
      }
    })

    it('should have LinkNode type consistent with schema', () => {
      const validLinkNode: LinkNode = {
        type: 'link',
        url: 'https://example.com',
        children: [
          { type: 'text', value: 'Link text' }
        ]
      }

      const result = LinkNodeSchema.safeParse(validLinkNode)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.url).toBe('https://example.com')
      }
    })

    it('should have ImageNode type consistent with schema', () => {
      const validImageNode: ImageNode = {
        type: 'image',
        url: 'image.jpg',
        alt: 'Alt text',
        title: 'Image title',
        classes: ['responsive']
      }

      const result = ImageNodeSchema.safeParse(validImageNode)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.alt).toBe('Alt text')
        expect(result.data.title).toBe('Image title')
        expect(result.data.classes).toEqual(['responsive'])
      }
    })

    it('should have CodeNode type consistent with schema', () => {
      const validCodeNode: CodeNode = {
        type: 'code',
        value: 'console.log("Hello");',
        lang: 'javascript'
      }

      const result = CodeNodeSchema.safeParse(validCodeNode)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.value).toBe('console.log("Hello");')
        expect(result.data.lang).toBe('javascript')
      }
    })

    it('should have ContainerNode type consistent with schema', () => {
      const validContainerNode: ContainerNode = {
        type: 'container',
        classes: ['slide-center', 'highlight'],
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'Container content' }]
          }
        ]
      }

      const result = ContainerNodeSchema.safeParse(validContainerNode)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.classes).toEqual(['slide-center', 'highlight'])
      }
    })
  })

  describe('ASTNode Union Type', () => {
    it('should accept all valid node types in union', () => {
      const validNodes: ASTNode[] = [
        { type: 'text', value: 'Text' },
        { type: 'heading', depth: 1, children: [] },
        { type: 'paragraph', children: [] },
        { type: 'list', children: [] },
        { type: 'listItem', children: [] },
        { type: 'link', url: 'http://example.com', children: [] },
        { type: 'image', url: 'image.jpg' },
        { type: 'code', value: 'code' },
        { type: 'container', classes: ['test'], children: [] },
        { type: 'table', children: [] },
        { type: 'tableRow', children: [] },
        { type: 'tableCell', children: [] }
      ]

      validNodes.forEach(node => {
        const result = ASTNodeSchema.safeParse(node)
        expect(result.success).toBe(true)
      })
    })

    it('should provide proper type discrimination', () => {
      const testNode: TextNode = { type: 'text', value: 'Hello' }

      // TypeScript should provide proper type narrowing
      if (testNode.type === 'text') {
        // Now TypeScript knows this is a TextNode
        expect(testNode.value).toBe('Hello')
        // TypeScript should know that 'depth' doesn't exist on TextNode
        expect('depth' in testNode).toBe(false)
      }

      const headingNode: HeadingNode = { type: 'heading', depth: 2, children: [] }
      if (headingNode.type === 'heading') {
        // Now TypeScript knows this is a HeadingNode
        expect(headingNode.depth).toBe(2)
        // TypeScript should know that 'value' doesn't exist on HeadingNode
        expect('value' in headingNode).toBe(false)
      }
    })
  })

  describe('Document Structure Types', () => {
    it('should have CurtainsAST type consistent with schema', () => {
      const validAST: CurtainsAST = {
        type: 'root',
        children: [
          {
            type: 'heading',
            depth: 1,
            children: [{ type: 'text', value: 'Title' }]
          },
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'Content' }]
          }
        ]
      }

      const result = CurtainsASTSchema.safeParse(validAST)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.type).toBe('root')
        expect(result.data.children).toHaveLength(2)
      }
    })

    it('should have CurtainsSlide type consistent with schema', () => {
      const validSlide: CurtainsSlide = {
        type: 'curtains-slide',
        index: 0,
        ast: {
          type: 'root',
          children: [
            {
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'Slide Title' }]
            }
          ]
        },
        slideCSS: '.slide { background: blue; }'
      }

      const result = CurtainsSlideSchema.safeParse(validSlide)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.index).toBe(0)
        expect(result.data.slideCSS).toBe('.slide { background: blue; }')
        expect(result.data.ast.type).toBe('root')
      }
    })

    it('should have CurtainsDocument type consistent with schema', () => {
      const validDocument: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [
          {
            type: 'curtains-slide',
            index: 0,
            ast: {
              type: 'root',
              children: [
                {
                  type: 'heading',
                  depth: 1,
                  children: [{ type: 'text', value: 'Document Title' }]
                }
              ]
            },
            slideCSS: '.title { font-size: 2em; }'
          }
        ],
        globalCSS: 'body { font-family: Arial; }'
      }

      const result = CurtainsDocumentSchema.safeParse(validDocument)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.version).toBe('0.1')
        expect(result.data.slides).toHaveLength(1)
        expect(result.data.globalCSS).toBe('body { font-family: Arial; }')
      }
    })
  })

  describe('Transformer Output Types', () => {
    it('should have TransformedSlide type consistent with schema', () => {
      const validTransformedSlide: TransformedSlide = {
        html: '<h1>Slide Title</h1><p>Content</p>',
        css: '.slide:nth-child(1) { background: blue; }'
      }

      const result = TransformedSlideSchema.safeParse(validTransformedSlide)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.html).toBe('<h1>Slide Title</h1><p>Content</p>')
        expect(result.data.css).toBe('.slide:nth-child(1) { background: blue; }')
      }
    })

    it('should have TransformedDocument type consistent with schema', () => {
      const validTransformedDocument: TransformedDocument = {
        slides: [
          {
            html: '<h1>Slide 1</h1>',
            css: '.slide:nth-child(1) { color: red; }'
          },
          {
            html: '<h1>Slide 2</h1>',
            css: '.slide:nth-child(2) { color: blue; }'
          }
        ],
        globalCSS: 'body { font-family: Arial; }'
      }

      const result = TransformedDocumentSchema.safeParse(validTransformedDocument)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.slides).toHaveLength(2)
        expect(result.data.globalCSS).toBe('body { font-family: Arial; }')
      }
    })
  })

  describe('Type Safety and Inference', () => {
    it('should enforce type safety at compile time', () => {
      // These should pass TypeScript compilation
      const textNode: TextNode = {
        type: 'text',
        value: 'Hello'
      }

      const headingNode: HeadingNode = {
        type: 'heading',
        depth: 1,
        children: [textNode]
      }

      const containerNode: ContainerNode = {
        type: 'container',
        classes: ['test'],
        children: [headingNode]
      }

      // Verify the types are properly structured
      expect(textNode.type).toBe('text')
      expect(headingNode.type).toBe('heading')
      expect(containerNode.type).toBe('container')
      expect(headingNode.children[0]).toBe(textNode)
      expect(containerNode.children[0]).toBe(headingNode)
    })

    it('should properly type complex nested structures', () => {
      const complexStructure: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [
          {
            type: 'curtains-slide',
            index: 0,
            ast: {
              type: 'root',
              children: [
                {
                  type: 'container',
                  classes: ['slide-center'],
                  children: [
                    {
                      type: 'heading',
                      depth: 1,
                      children: [
                        { type: 'text', value: 'Welcome to ' },
                        { type: 'text', value: 'Curtains', bold: true }
                      ]
                    },
                    {
                      type: 'paragraph',
                      children: [
                        { type: 'text', value: 'Visit ' },
                        {
                          type: 'link',
                          url: 'https://github.com',
                          children: [{ type: 'text', value: 'GitHub', italic: true }]
                        }
                      ]
                    },
                    {
                      type: 'image',
                      url: './logo.png',
                      alt: 'Logo',
                      classes: ['logo']
                    },
                    {
                      type: 'code',
                      value: 'npm install curtains',
                      lang: 'bash'
                    }
                  ]
                }
              ]
            },
            slideCSS: '.slide-center { text-align: center; }'
          }
        ],
        globalCSS: 'body { margin: 0; }'
      }

      // Verify deep property access works
      const firstSlide = complexStructure.slides[0]
      expect(firstSlide).toBeDefined()
      if (!firstSlide) return

      const firstChild = firstSlide.ast.children[0] as unknown
      expect(firstChild).toBeDefined()
      if (typeof firstChild === 'object' && firstChild !== null && 'type' in firstChild) {
        expect((firstChild as {type: string}).type).toBe('container')
      }
      if (firstChild === null) return
      
      const container = firstChild
      if (isContainerNode(container)) {
        expect(container.classes).toEqual(['slide-center'])
        
        const heading = container.children[0]
        if (heading !== null && isHeadingNode(heading)) {
          expect(heading.depth).toBe(1)
          
          const firstText = heading.children[0]
          if (firstText !== null && isTextNode(firstText)) {
            expect(firstText.value).toBe('Welcome to ')
          }
        }
      }
    })

    it('should handle optional properties correctly', () => {
      // TextNode with minimal properties
      const minimalText: TextNode = {
        type: 'text',
        value: 'Hello'
      }
      expect(minimalText.bold).toBeUndefined()
      expect(minimalText.italic).toBeUndefined()

      // ImageNode with all optional properties
      const fullImage: ImageNode = {
        type: 'image',
        url: 'image.jpg',
        alt: 'Alt text',
        title: 'Title',
        classes: ['responsive']
      }
      expect(fullImage.alt).toBeDefined()
      expect(fullImage.title).toBeDefined()
      expect(fullImage.classes).toBeDefined()

      // ImageNode with minimal properties
      const minimalImage: ImageNode = {
        type: 'image',
        url: 'image.jpg'
      }
      expect(minimalImage.alt).toBeUndefined()
      expect(minimalImage.title).toBeUndefined()
      expect(minimalImage.classes).toBeUndefined()
    })

    it('should support array types correctly', () => {
      const slides: CurtainsSlide[] = [
        {
          type: 'curtains-slide',
          index: 0,
          ast: { type: 'root', children: [] },
          slideCSS: ''
        },
        {
          type: 'curtains-slide',
          index: 1,
          ast: { type: 'root', children: [] },
          slideCSS: ''
        }
      ]

      expect(slides).toHaveLength(2)
      expect(slides[0]?.index).toBe(0)
      expect(slides[1]?.index).toBe(1)

      const transformedSlides: TransformedSlide[] = [
        { html: '<h1>Slide 1</h1>', css: '.slide1 {}' },
        { html: '<h1>Slide 2</h1>', css: '.slide2 {}' }
      ]

      expect(transformedSlides).toHaveLength(2)
      expect(transformedSlides[0]?.html).toBe('<h1>Slide 1</h1>')
    })
  })

  describe('Type Compatibility', () => {
    it('should be compatible with Zod inference', () => {
      // Test that our manually defined types match Zod inference
      const zodInferredText = TextNodeSchema.parse({
        type: 'text',
        value: 'Hello'
      })

      const manuallyTypedText: TextNode = {
        type: 'text',
        value: 'Hello'
      }

      // These should have the same structure
      expect(zodInferredText.type).toBe(manuallyTypedText.type)
      expect(zodInferredText.value).toBe(manuallyTypedText.value)
    })

    it('should maintain type consistency across the pipeline', () => {
      // Create a document that flows through the type system
      const originalDocument: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [
          {
            type: 'curtains-slide',
            index: 0,
            ast: {
              type: 'root',
              children: [
                {
                  type: 'heading',
                  depth: 1,
                  children: [{ type: 'text', value: 'Title' }]
                }
              ]
            },
            slideCSS: '.title { color: blue; }'
          }
        ],
        globalCSS: 'body { margin: 0; }'
      }

      // Transform to output format
      const transformedDocument: TransformedDocument = {
        slides: [
          {
            html: '<h1>Title</h1>',
            css: '.slide:nth-child(1) .title { color: blue; }'
          }
        ],
        globalCSS: originalDocument.globalCSS
      }

      // Verify transformation maintains data integrity
      expect(transformedDocument.slides).toHaveLength(originalDocument.slides.length)
      expect(transformedDocument.globalCSS).toBe(originalDocument.globalCSS)
    })

    it('should work with generic functions', () => {
      // Function that works with any AST node
      function getNodeType(node: unknown): NodeType {
        if (typeof node === 'object' && node !== null && 'type' in node) {
          const typedNode = node as {type: unknown}
          if (typeof typedNode.type === 'string') {
            return typedNode.type as NodeType
          }
        }
        throw new Error('Invalid node type')
      }

      const textNode: TextNode = { type: 'text', value: 'Hello' }
      const headingNode: HeadingNode = { type: 'heading', depth: 1, children: [] }
      const containerNode: ContainerNode = { type: 'container', classes: [], children: [] }

      expect(getNodeType(textNode)).toBe('text')
      expect(getNodeType(headingNode)).toBe('heading')
      expect(getNodeType(containerNode)).toBe('container')
    })

    it('should support type guards', () => {
      // Use the type guards defined above

      const mixedNodes: ASTNode[] = [
        { type: 'text', value: 'Hello' },
        { type: 'heading', depth: 1, children: [] },
        { type: 'paragraph', children: [] }
      ]

      const textNodes = mixedNodes.filter((node): node is TextNode => isTextNode(node))
      const headingNodes = mixedNodes.filter((node): node is HeadingNode => isHeadingNode(node))

      expect(textNodes).toHaveLength(1)
      expect(headingNodes).toHaveLength(1)

      // TypeScript should know these are properly typed
      if (textNodes[0]) {
        expect(textNodes[0].value).toBe('Hello')
      }

      if (headingNodes[0]) {
        expect(headingNodes[0].depth).toBe(1)
      }
    })
  })

  describe('Real-world Usage Patterns', () => {
    it('should support common document manipulation patterns', () => {
      const document: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [
          {
            type: 'curtains-slide',
            index: 0,
            ast: {
              type: 'root',
              children: [
                { type: 'heading', depth: 1, children: [{ type: 'text', value: 'Title' }] },
                { type: 'paragraph', children: [{ type: 'text', value: 'Content' }] }
              ]
            },
            slideCSS: ''
          }
        ],
        globalCSS: ''
      }

      // Extract all text content
      function extractTextContent(node: unknown): string {
        if (isTextNode(node)) {
          return node.value
        }

        if (hasChildren(node)) {
          return node.children.map(child => extractTextContent(child)).join(' ')
        }

        return ''
      }

      const slide = document.slides[0]
      if (slide) {
        const textContent = slide.ast.children.map((child: unknown) => extractTextContent(child)).join(' ')
        expect(textContent).toBe('Title Content')
      }
    })

    it('should support tree traversal patterns', () => {
      const ast: CurtainsAST = {
        type: 'root',
        children: [
          {
            type: 'container',
            classes: ['slide'],
            children: [
              {
                type: 'heading',
                depth: 1,
                children: [{ type: 'text', value: 'Main Title' }]
              },
              {
                type: 'list',
                children: [
                  {
                    type: 'listItem',
                    children: [{ type: 'text', value: 'Item 1' }]
                  },
                  {
                    type: 'listItem',
                    children: [{ type: 'text', value: 'Item 2' }]
                  }
                ]
              }
            ]
          }
        ]
      }

      // Count nodes by type
      function countNodesByType(node: object): Record<string, number> {
        const counts: Record<string, number> = {}
        
        function traverse(n: object): void {
          if ('type' in n && typeof (n as {type: string}).type === 'string') {
            const nodeType = (n as {type: string}).type
            counts[nodeType] = (counts[nodeType] ?? 0) + 1
          }
          
          if ('children' in n && Array.isArray((n as {children: object[]}).children)) {
            (n as {children: object[]}).children.forEach(child => traverse(child))
          }
        }
        
        traverse(node)
        return counts
      }

      const counts = countNodesByType(ast)
      expect(counts['root']).toBe(1)
      expect(counts['container']).toBe(1)
      expect(counts['heading']).toBe(1)
      expect(counts['list']).toBe(1)
      expect(counts['listItem']).toBe(2)
      expect(counts['text']).toBe(3)
    })

    it('should support transformation patterns', () => {
      // Transform a document by modifying all text nodes
      function transformTextNodes(
        node: unknown,
        // eslint-disable-next-line no-unused-vars
        transformer: (text: string) => string
      ): unknown {
        if (isTextNode(node)) {
          return {
            ...node,
            value: transformer(node.value)
          }
        }

        if (hasChildren(node)) {
          return {
            ...node,
            children: node.children.map(child => transformTextNodes(child, transformer))
          }
        }

        return node
      }

      const originalNode: ASTNode = {
        type: 'paragraph',
        children: [
          { type: 'text', value: 'hello world' },
          { type: 'text', value: 'curtains rocks' }
        ]
      }

      const transformedNode = transformTextNodes(originalNode, (text: string) => text.toUpperCase())

      if (isParagraphNode(transformedNode)) {
        const firstChild = transformedNode.children[0]
        const secondChild = transformedNode.children[1]
        
        if (firstChild !== null && isTextNode(firstChild)) {
          expect(firstChild.value).toBe('HELLO WORLD')
        }
        
        if (secondChild !== null && isTextNode(secondChild)) {
          expect(secondChild.value).toBe('CURTAINS ROCKS')
        }
      }
    })
  })
})