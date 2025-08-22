// Interfaces Tests
// Tests for interface compatibility, type safety, and structure validation

import { describe, it, expect } from 'vitest'
import type {
  Document,
  Slide,
  AST,
  TransformedDocument,
  TransformedSlide,
  ASTNode,
  BaseASTNode,
  TextNode,
  HeadingNode,
  ParagraphNode,
  ListNode,
  LinkNode,
  ImageNode,
  CodeNode,
  ContainerNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  MarkdownParser,
  DocumentTransformer,
  ParseError,
  TransformError,
  CurtainsError
} from './interfaces.js'

describe('Abstraction Interfaces', () => {
  describe('Document interface', () => {
    it('should define a valid Document structure', () => {
      const validDocument: Document = {
        type: 'curtains-document',
        version: '0.1',
        slides: [],
        globalCSS: ''
      }

      expect(validDocument.type).toBe('curtains-document')
      expect(validDocument.version).toBe('0.1')
      expect(Array.isArray(validDocument.slides)).toBe(true)
      expect(typeof validDocument.globalCSS).toBe('string')
    })

    it('should handle Document with multiple slides', () => {
      const slide1: Slide = {
        type: 'curtains-slide',
        index: 0,
        ast: {
          type: 'root',
          children: []
        },
        slideCSS: ''
      }

      const slide2: Slide = {
        type: 'curtains-slide',
        index: 1,
        ast: {
          type: 'root',
          children: []
        },
        slideCSS: '.slide2 { color: red; }'
      }

      const document: Document = {
        type: 'curtains-document',
        version: '0.1',
        slides: [slide1, slide2],
        globalCSS: '.global { font-size: 16px; }'
      }

      expect(document.slides).toHaveLength(2)
      expect(document.slides[0]?.index).toBe(0)
      expect(document.slides[1]?.index).toBe(1)
      expect(document.slides[1]?.slideCSS).toBe('.slide2 { color: red; }')
      expect(document.globalCSS).toBe('.global { font-size: 16px; }')
    })

    it('should maintain readonly properties', () => {
      const document: Document = {
        type: 'curtains-document',
        version: '0.1',
        slides: [],
        globalCSS: ''
      }

      // TypeScript should enforce readonly properties
      // These would cause compilation errors if uncommented:
      // document.type = 'other-type'
      // document.version = '0.2'
      // document.slides = [slide]
      // document.globalCSS = 'new css'

      expect(document.type).toBe('curtains-document')
    })
  })

  describe('Slide interface', () => {
    it('should define a valid Slide structure', () => {
      const validSlide: Slide = {
        type: 'curtains-slide',
        index: 0,
        ast: {
          type: 'root',
          children: []
        },
        slideCSS: ''
      }

      expect(validSlide.type).toBe('curtains-slide')
      expect(validSlide.index).toBe(0)
      expect(validSlide.ast.type).toBe('root')
      expect(Array.isArray(validSlide.ast.children)).toBe(true)
      expect(typeof validSlide.slideCSS).toBe('string')
    })

    it('should handle Slide with complex AST', () => {
      const textNode: TextNode = {
        type: 'text',
        value: 'Hello World'
      }

      const headingNode: HeadingNode = {
        type: 'heading',
        depth: 1,
        children: [textNode]
      }

      const slide: Slide = {
        type: 'curtains-slide',
        index: 5,
        ast: {
          type: 'root',
          children: [headingNode]
        },
        slideCSS: '.slide { margin: 10px; }'
      }

      expect(slide.index).toBe(5)
      expect(slide.ast.children).toHaveLength(1)
      expect(slide.ast.children[0]?.type).toBe('heading')
      expect((slide.ast.children[0] as HeadingNode).depth).toBe(1)
      expect((slide.ast.children[0] as HeadingNode).children[0]?.type).toBe('text')
    })
  })

  describe('AST and ASTNode interfaces', () => {
    it('should define a valid AST structure', () => {
      const ast: AST = {
        type: 'root',
        children: []
      }

      expect(ast.type).toBe('root')
      expect(Array.isArray(ast.children)).toBe(true)
    })

    it('should handle TextNode with formatting', () => {
      const plainText: TextNode = {
        type: 'text',
        value: 'Plain text'
      }

      const boldText: TextNode = {
        type: 'text',
        value: 'Bold text',
        bold: true
      }

      const italicText: TextNode = {
        type: 'text',
        value: 'Italic text',
        italic: true
      }

      const boldItalicText: TextNode = {
        type: 'text',
        value: 'Bold italic text',
        bold: true,
        italic: true
      }

      expect(plainText.bold).toBeUndefined()
      expect(plainText.italic).toBeUndefined()
      expect(boldText.bold).toBe(true)
      expect(boldText.italic).toBeUndefined()
      expect(italicText.bold).toBeUndefined()
      expect(italicText.italic).toBe(true)
      expect(boldItalicText.bold).toBe(true)
      expect(boldItalicText.italic).toBe(true)
    })

    it('should handle HeadingNode with different depths', () => {
      const h1: HeadingNode = {
        type: 'heading',
        depth: 1,
        children: [{ type: 'text', value: 'H1 Heading' }]
      }

      const h6: HeadingNode = {
        type: 'heading',
        depth: 6,
        children: [{ type: 'text', value: 'H6 Heading' }]
      }

      expect(h1.depth).toBe(1)
      expect(h6.depth).toBe(6)
      expect(h1.children[0]?.type).toBe('text')
      expect((h1.children[0] as TextNode).value).toBe('H1 Heading')
    })

    it('should handle ParagraphNode with mixed content', () => {
      const paragraph: ParagraphNode = {
        type: 'paragraph',
        children: [
          { type: 'text', value: 'Normal text ' },
          { type: 'text', value: 'bold text', bold: true },
          { type: 'text', value: ' and ' },
          { 
            type: 'link',
            url: 'https://example.com',
            children: [{ type: 'text', value: 'link text' }]
          }
        ]
      }

      expect(paragraph.children).toHaveLength(4)
      expect(paragraph.children[0]?.type).toBe('text')
      expect(paragraph.children[1]?.type).toBe('text')
      expect((paragraph.children[1] as TextNode).bold).toBe(true)
      expect(paragraph.children[3]?.type).toBe('link')
      expect((paragraph.children[3] as LinkNode).url).toBe('https://example.com')
    })

    it('should handle ListNode with ordered and unordered lists', () => {
      const unorderedList: ListNode = {
        type: 'list',
        children: [
          {
            type: 'listItem',
            children: [
              {
                type: 'paragraph',
                children: [{ type: 'text', value: 'First item' }]
              }
            ]
          }
        ]
      }

      const orderedList: ListNode = {
        type: 'list',
        ordered: true,
        children: [
          {
            type: 'listItem',
            children: [
              {
                type: 'paragraph',
                children: [{ type: 'text', value: 'First numbered item' }]
              }
            ]
          }
        ]
      }

      expect(unorderedList.ordered).toBeUndefined()
      expect(orderedList.ordered).toBe(true)
      expect(unorderedList.children[0]?.type).toBe('listItem')
      expect(orderedList.children[0]?.type).toBe('listItem')
    })

    it('should handle LinkNode with URL and children', () => {
      const link: LinkNode = {
        type: 'link',
        url: 'https://example.com/page?param=value#section',
        children: [
          { type: 'text', value: 'Link ' },
          { type: 'text', value: 'text', bold: true }
        ]
      }

      expect(link.url).toBe('https://example.com/page?param=value#section')
      expect(link.children).toHaveLength(2)
      expect((link.children[1] as TextNode).bold).toBe(true)
    })

    it('should handle ImageNode with all optional properties', () => {
      const simpleImage: ImageNode = {
        type: 'image',
        url: 'image.jpg'
      }

      const complexImage: ImageNode = {
        type: 'image',
        url: 'https://example.com/image.png',
        alt: 'Example image',
        title: 'Example title',
        classes: ['responsive', 'centered']
      }

      expect(simpleImage.alt).toBeUndefined()
      expect(simpleImage.title).toBeUndefined()
      expect(simpleImage.classes).toBeUndefined()

      expect(complexImage.alt).toBe('Example image')
      expect(complexImage.title).toBe('Example title')
      expect(complexImage.classes).toEqual(['responsive', 'centered'])
    })

    it('should handle CodeNode with and without language', () => {
      const plainCode: CodeNode = {
        type: 'code',
        value: 'console.log("Hello");'
      }

      const javascriptCode: CodeNode = {
        type: 'code',
        value: 'const x = 42;',
        lang: 'javascript'
      }

      expect(plainCode.lang).toBeUndefined()
      expect(javascriptCode.lang).toBe('javascript')
      expect(javascriptCode.value).toBe('const x = 42;')
    })

    it('should handle ContainerNode with multiple classes', () => {
      const container: ContainerNode = {
        type: 'container',
        classes: ['highlight', 'center', 'large'],
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'Container content' }]
          }
        ]
      }

      expect(container.classes).toEqual(['highlight', 'center', 'large'])
      expect(container.children).toHaveLength(1)
      expect(container.children[0]?.type).toBe('paragraph')
    })

    it('should handle Table nodes with headers and alignment', () => {
      const table: TableNode = {
        type: 'table',
        children: [
          {
            type: 'tableRow',
            children: [
              {
                type: 'tableCell',
                header: true,
                align: 'left',
                children: [{ type: 'text', value: 'Header 1' }]
              },
              {
                type: 'tableCell',
                header: true,
                align: 'center',
                children: [{ type: 'text', value: 'Header 2' }]
              }
            ]
          },
          {
            type: 'tableRow',
            children: [
              {
                type: 'tableCell',
                children: [{ type: 'text', value: 'Cell 1' }]
              },
              {
                type: 'tableCell',
                align: 'right',
                children: [{ type: 'text', value: 'Cell 2' }]
              }
            ]
          }
        ]
      }

      const headerRow = table.children[0] as TableRowNode
      const dataRow = table.children[1] as TableRowNode
      
      expect(headerRow.children).toHaveLength(2)
      expect((headerRow.children[0] as TableCellNode).header).toBe(true)
      expect((headerRow.children[0] as TableCellNode).align).toBe('left')
      expect((headerRow.children[1] as TableCellNode).align).toBe('center')
      
      expect((dataRow.children[0] as TableCellNode).header).toBeUndefined()
      expect((dataRow.children[1] as TableCellNode).align).toBe('right')
    })
  })

  describe('TransformedDocument and TransformedSlide interfaces', () => {
    it('should define valid TransformedDocument structure', () => {
      const transformedDoc: TransformedDocument = {
        slides: [],
        globalCSS: '.global { color: blue; }'
      }

      expect(Array.isArray(transformedDoc.slides)).toBe(true)
      expect(typeof transformedDoc.globalCSS).toBe('string')
    })

    it('should handle TransformedSlide with HTML and CSS', () => {
      const slide1: TransformedSlide = {
        html: '<h1>Title</h1><p>Content</p>',
        css: '.slide-0 h1 { color: red; }'
      }

      const slide2: TransformedSlide = {
        html: '<div class="container"><p>Nested content</p></div>',
        css: ''
      }

      const transformedDoc: TransformedDocument = {
        slides: [slide1, slide2],
        globalCSS: '.global { font-family: Arial; }'
      }

      expect(transformedDoc.slides).toHaveLength(2)
      expect(transformedDoc.slides[0]?.html).toContain('<h1>Title</h1>')
      expect(transformedDoc.slides[0]?.css).toContain('color: red')
      expect(transformedDoc.slides[1]?.css).toBe('')
    })
  })

  describe('MarkdownParser interface', () => {
    it('should define parser contract', () => {
      class TestParser implements MarkdownParser {
        parse(): Document {
          return {
            type: 'curtains-document',
            version: '0.1',
            slides: [],
            globalCSS: ''
          }
        }

        supports(format: string): boolean {
          return format === 'test'
        }
      }

      const parser = new TestParser()
      
      expect(typeof parser.parse).toBe('function')
      expect(typeof parser.supports).toBe('function')
      expect(parser.supports('test')).toBe(true)
      expect(parser.supports('other')).toBe(false)
      
      const doc = parser.parse('test content')
      expect(doc.type).toBe('curtains-document')
    })

    it('should allow different parser implementations', () => {
      class CustomParser implements MarkdownParser {
        private supportedFormats = ['custom', 'special']

        parse(content: string): Document {
          return {
            type: 'curtains-document',
            version: '1.0',
            slides: [
              {
                type: 'curtains-slide',
                index: 0,
                ast: {
                  type: 'root',
                  children: [
                    {
                      type: 'paragraph',
                      children: [{ type: 'text', value: content }]
                    }
                  ]
                },
                slideCSS: ''
              }
            ],
            globalCSS: ''
          }
        }

        supports(format: string): boolean {
          return this.supportedFormats.includes(format)
        }
      }

      const parser = new CustomParser()
      
      expect(parser.supports('custom')).toBe(true)
      expect(parser.supports('special')).toBe(true)
      expect(parser.supports('unsupported')).toBe(false)
      
      const doc = parser.parse('Custom content')
      expect(doc.version).toBe('1.0')
      expect(doc.slides).toHaveLength(1)
    })
  })

  describe('DocumentTransformer interface', () => {
    it('should define transformer contract', () => {
      class TestTransformer implements DocumentTransformer {
        transform(document: Document): TransformedDocument {
          return {
            slides: document.slides.map(() => ({
              html: '<div>Test HTML</div>',
              css: '.test { color: blue; }'
            })),
            globalCSS: document.globalCSS
          }
        }
      }

      const transformer = new TestTransformer()
      
      expect(typeof transformer.transform).toBe('function')
      
      const inputDoc: Document = {
        type: 'curtains-document',
        version: '0.1',
        slides: [
          {
            type: 'curtains-slide',
            index: 0,
            ast: { type: 'root', children: [] },
            slideCSS: ''
          }
        ],
        globalCSS: '.global { margin: 0; }'
      }

      const result = transformer.transform(inputDoc)
      expect(result.slides).toHaveLength(1)
      expect(result.slides[0]?.html).toBe('<div>Test HTML</div>')
      expect(result.globalCSS).toBe('.global { margin: 0; }')
    })

    it('should allow different transformer implementations', () => {
      class AdvancedTransformer implements DocumentTransformer {
        transform(document: Document): TransformedDocument {
          return {
            slides: document.slides.map((slide, index) => ({
              html: `<div class="slide-${index}">Advanced HTML for slide ${index}</div>`,
              css: `.slide-${index} { background: #f0f0f0; } ${slide.slideCSS}`
            })),
            globalCSS: `/* Advanced global styles */ ${document.globalCSS}`
          }
        }
      }

      const transformer = new AdvancedTransformer()
      
      const inputDoc: Document = {
        type: 'curtains-document',
        version: '0.1',
        slides: [
          {
            type: 'curtains-slide',
            index: 0,
            ast: { type: 'root', children: [] },
            slideCSS: '.custom { font-size: 18px; }'
          },
          {
            type: 'curtains-slide',
            index: 1,
            ast: { type: 'root', children: [] },
            slideCSS: ''
          }
        ],
        globalCSS: '.base { padding: 10px; }'
      }

      const result = transformer.transform(inputDoc)
      expect(result.slides).toHaveLength(2)
      expect(result.slides[0]?.html).toBe('<div class="slide-0">Advanced HTML for slide 0</div>')
      expect(result.slides[0]?.css).toContain('.slide-0 { background: #f0f0f0; }')
      expect(result.slides[0]?.css).toContain('.custom { font-size: 18px; }')
      expect(result.globalCSS).toContain('/* Advanced global styles */')
      expect(result.globalCSS).toContain('.base { padding: 10px; }')
    })
  })

  describe('Error interfaces', () => {
    it('should define ParseError structure', () => {
      const parseError: ParseError = new Error('Parse failed') as ParseError
      parseError.code = 'PARSE_ERROR'
      parseError.phase = 'parse'
      parseError.context = { originalError: 'some error' }

      expect(parseError.code).toBe('PARSE_ERROR')
      expect(parseError.phase).toBe('parse')
      expect(parseError.context).toEqual({ originalError: 'some error' })
      expect(parseError.message).toBe('Parse failed')
    })

    it('should define TransformError structure', () => {
      const transformError: TransformError = new Error('Transform failed') as TransformError
      transformError.code = 'TRANSFORM_ERROR'
      transformError.phase = 'transform'
      transformError.context = { step: 'ast-to-html' }

      expect(transformError.code).toBe('TRANSFORM_ERROR')
      expect(transformError.phase).toBe('transform')
      expect(transformError.context).toEqual({ step: 'ast-to-html' })
      expect(transformError.message).toBe('Transform failed')
    })

    it('should allow CurtainsError union type', () => {
      const parseError: CurtainsError = new Error('Parse error') as ParseError
      parseError.code = 'PARSE_ERROR'
      parseError.phase = 'parse'

      const transformError: CurtainsError = new Error('Transform error') as TransformError
      transformError.code = 'TRANSFORM_ERROR'
      transformError.phase = 'transform'

      expect(parseError.code).toBe('PARSE_ERROR')
      expect(transformError.code).toBe('TRANSFORM_ERROR')
    })

    it('should handle error context of different types', () => {
      const errorWithStringContext: ParseError = new Error('Error') as ParseError
      errorWithStringContext.code = 'PARSE_ERROR'
      errorWithStringContext.phase = 'parse'
      errorWithStringContext.context = 'string context'

      const errorWithObjectContext: TransformError = new Error('Error') as TransformError
      errorWithObjectContext.code = 'TRANSFORM_ERROR'
      errorWithObjectContext.phase = 'transform'
      errorWithObjectContext.context = { nested: { value: 123 } }

      const errorWithoutContext: ParseError = new Error('Error') as ParseError
      errorWithoutContext.code = 'PARSE_ERROR'
      errorWithoutContext.phase = 'parse'

      expect(typeof errorWithStringContext.context).toBe('string')
      expect(typeof errorWithObjectContext.context).toBe('object')
      expect(errorWithoutContext.context).toBeUndefined()
    })
  })

  describe('Type safety and constraints', () => {
    it('should enforce readonly constraints on interfaces', () => {
      const document: Document = {
        type: 'curtains-document',
        version: '0.1',
        slides: [],
        globalCSS: ''
      }

      // These would cause TypeScript compilation errors:
      // document.type = 'other-type'  // readonly
      // document.slides.push(slide)   // readonly array
      // document.slides[0] = slide    // readonly array

      expect(document.type).toBe('curtains-document')
    })

    it('should enforce specific literal types', () => {
      // Type constraints should ensure only valid types are allowed
      const textNode: TextNode = {
        type: 'text', // Must be exactly 'text'
        value: 'Test'
      }

      const headingNode: HeadingNode = {
        type: 'heading', // Must be exactly 'heading'
        depth: 2,
        children: []
      }

      expect(textNode.type).toBe('text')
      expect(headingNode.type).toBe('heading')
    })

    it('should allow proper AST node union usage', () => {
      const nodes: ASTNode[] = [
        { type: 'text', value: 'Text' },
        { type: 'heading', depth: 1, children: [] },
        { type: 'paragraph', children: [] },
        { type: 'list', children: [] },
        { type: 'link', url: 'url', children: [] },
        { type: 'image', url: 'image.jpg' },
        { type: 'code', value: 'code' },
        { type: 'container', classes: [], children: [] }
      ]

      expect(nodes).toHaveLength(8)
      expect(nodes.every(node => typeof node.type === 'string')).toBe(true)
    })

    it('should enforce table cell alignment constraints', () => {
      const leftAligned: TableCellNode = {
        type: 'tableCell',
        align: 'left',
        children: []
      }

      const centerAligned: TableCellNode = {
        type: 'tableCell',
        align: 'center',
        children: []
      }

      const rightAligned: TableCellNode = {
        type: 'tableCell',
        align: 'right',
        children: []
      }

      expect(leftAligned.align).toBe('left')
      expect(centerAligned.align).toBe('center')
      expect(rightAligned.align).toBe('right')
    })
  })

  describe('Interface extensibility', () => {
    it('should allow extending base interfaces', () => {
      // Example of how the interfaces could be extended
      interface ExtendedDocument extends Document {
        readonly metadata?: {
          readonly author: string
          readonly created: Date
        }
      }

      const extendedDoc: ExtendedDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [],
        globalCSS: '',
        metadata: {
          author: 'Test Author',
          created: new Date('2023-01-01')
        }
      }

      expect(extendedDoc.metadata?.author).toBe('Test Author')
      expect(extendedDoc.metadata?.created).toBeInstanceOf(Date)
    })

    it('should allow custom AST node types through extension', () => {
      // Example of extending ASTNode types
      interface CustomNode extends BaseASTNode {
        readonly type: 'custom'
        readonly customProperty: string
      }

      const customNode: CustomNode = {
        type: 'custom',
        customProperty: 'custom value'
      }

      expect(customNode.type).toBe('custom')
      expect(customNode.customProperty).toBe('custom value')
    })
  })
})