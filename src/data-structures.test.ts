import {
  CurtainsDocumentSchema,
  CurtainsSlideSchema,
  CurtainsASTSchema,
  ContainerNodeSchema,
  TextNodeSchema,
  HeadingNodeSchema,
  ListNodeSchema,
  LinkNodeSchema,
  ImageNodeSchema,
  CodeNodeSchema,
  NodeTypeSchema
} from './ast/schemas.js'
import { BuildOptionsSchema, ThemeSchema } from './config/schemas.js'
import { DEFAULTS, REGEX } from './config/constants.js'
import type {
  CurtainsDocument,
  CurtainsSlide,
  CurtainsAST,
  ContainerNode,
  TextNode,
  HeadingNode,
  ASTNode
} from './ast/types.js'

// Type helpers for tests
type TestASTNode = {
  type: string
  [key: string]: any
}

describe('Data Structures', () => {
  describe('Node Type Schema', () => {
    it('should validate all supported node types', () => {
      // Arrange
      const validTypes = ['root', 'container', 'heading', 'paragraph', 'list', 'listItem', 'link', 'image', 'code', 'text']

      // Act & Assert
      validTypes.forEach(type => {
        expect(() => NodeTypeSchema.parse(type)).not.toThrow()
      })
    })

    it('should reject invalid node types', () => {
      // Arrange
      const invalidTypes = ['invalid', 'unknown', 'div', 'span']

      // Act & Assert
      invalidTypes.forEach(type => {
        expect(() => NodeTypeSchema.parse(type)).toThrow()
      })
    })
  })

  describe('Text Node Schema', () => {
    it('should validate valid text node', () => {
      // Arrange
      const validTextNode = {
        type: 'text',
        value: 'Hello world'
      }

      // Act
      const result = TextNodeSchema.parse(validTextNode)

      // Assert
      expect(result.type).toBe('text')
      expect(result.value).toBe('Hello world')
    })

    it('should reject text node with missing value', () => {
      // Arrange
      const invalidNode = {
        type: 'text'
      }

      // Act & Assert
      expect(() => TextNodeSchema.parse(invalidNode)).toThrow()
    })

    it('should reject text node with wrong type', () => {
      // Arrange
      const invalidNode = {
        type: 'heading',
        value: 'Hello world'
      }

      // Act & Assert
      expect(() => TextNodeSchema.parse(invalidNode)).toThrow()
    })
  })

  describe('Heading Node Schema', () => {
    it('should validate valid heading nodes', () => {
      // Arrange
      const validDepths = [1, 2, 3, 4, 5, 6]
      
      validDepths.forEach(depth => {
        const headingNode = {
          type: 'heading',
          depth,
          children: []
        }

        // Act
        const result = HeadingNodeSchema.parse(headingNode)

        // Assert
        expect(result.type).toBe('heading')
        expect(result.depth).toBe(depth)
        expect(result.children).toEqual([])
      })
    })

    it('should reject heading with invalid depth', () => {
      // Arrange
      const invalidDepths = [0, 7, -1, 10]
      
      invalidDepths.forEach(depth => {
        const invalidNode = {
          type: 'heading',
          depth,
          children: []
        }

        // Act & Assert
        expect(() => HeadingNodeSchema.parse(invalidNode)).toThrow()
      })
    })

    it('should validate heading with text children', () => {
      // Arrange
      const headingWithChildren = {
        type: 'heading',
        depth: 1,
        children: [
          { type: 'text', value: 'Hello ' },
          { type: 'text', value: 'World' }
        ]
      }

      // Act
      const result = HeadingNodeSchema.parse(headingWithChildren)

      // Assert
      expect(result.children).toHaveLength(2)
      const child0 = result.children[0] as TestASTNode
      const child1 = result.children[1] as TestASTNode
      expect(child0?.type).toBe('text')
      expect(child1?.type).toBe('text')
    })
  })

  describe('Container Node Schema', () => {
    it('should validate container with valid class names', () => {
      // Arrange
      const validClassNames = ['test', 'test-class', 'test_class', 'TestClass123']
      
      validClassNames.forEach(className => {
        const containerNode = {
          type: 'container',
          classes: [className],
          children: []
        }

        // Act
        const result = ContainerNodeSchema.parse(containerNode)

        // Assert
        expect(result.type).toBe('container')
        expect(result.classes).toEqual([className])
      })
    })

    it('should reject container with invalid class names', () => {
      // Arrange
      const invalidClassNames = ['test@class', 'test class', 'test.class', 'test/class', 'test+class']
      
      invalidClassNames.forEach(className => {
        const invalidNode = {
          type: 'container',
          classes: [className],
          children: []
        }

        // Act & Assert
        expect(() => ContainerNodeSchema.parse(invalidNode)).toThrow()
      })
    })

    it('should validate container with multiple valid classes', () => {
      // Arrange
      const containerNode = {
        type: 'container',
        classes: ['class1', 'class-2', 'class_3'],
        children: []
      }

      // Act
      const result = ContainerNodeSchema.parse(containerNode)

      // Assert
      expect(result.classes).toEqual(['class1', 'class-2', 'class_3'])
    })

    it('should validate container with nested children', () => {
      // Arrange
      const containerNode = {
        type: 'container',
        classes: ['outer'],
        children: [
          {
            type: 'heading',
            depth: 1,
            children: [{ type: 'text', value: 'Title' }]
          },
          {
            type: 'container',
            classes: ['inner'],
            children: []
          }
        ]
      }

      // Act
      const result = ContainerNodeSchema.parse(containerNode)

      // Assert
      expect(result.children).toHaveLength(2)
      const child0 = result.children[0] as TestASTNode
      const child1 = result.children[1] as TestASTNode
      expect(child0?.type).toBe('heading')
      expect(child1?.type).toBe('container')
    })
  })

  describe('List Node Schema', () => {
    it('should validate unordered list', () => {
      // Arrange
      const listNode = {
        type: 'list',
        ordered: false,
        children: [
          {
            type: 'listItem',
            children: [{ type: 'text', value: 'Item 1' }]
          }
        ]
      }

      // Act
      const result = ListNodeSchema.parse(listNode)

      // Assert
      expect(result.type).toBe('list')
      expect(result.ordered).toBe(false)
      expect(result.children).toHaveLength(1)
    })

    it('should validate ordered list', () => {
      // Arrange
      const listNode = {
        type: 'list',
        ordered: true,
        children: []
      }

      // Act
      const result = ListNodeSchema.parse(listNode)

      // Assert
      expect(result.ordered).toBe(true)
    })

    it('should default ordered to undefined when not specified', () => {
      // Arrange
      const listNode = {
        type: 'list',
        children: []
      }

      // Act
      const result = ListNodeSchema.parse(listNode)

      // Assert
      expect(result.ordered).toBeUndefined()
    })
  })

  describe('Link Node Schema', () => {
    it('should validate link with valid URL', () => {
      // Arrange
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://subdomain.example.com/path?query=value',
        'ftp://files.example.com'
      ]

      validUrls.forEach(url => {
        const linkNode = {
          type: 'link',
          url,
          children: [{ type: 'text', value: 'Link text' }]
        }

        // Act
        const result = LinkNodeSchema.parse(linkNode)

        // Assert
        expect(result.url).toBe(url)
        expect(result.children).toHaveLength(1)
      })
    })

    it('should reject link with invalid URL', () => {
      // Arrange
      const invalidUrls = ['not-a-url', 'invalid-url', 'just-text']

      invalidUrls.forEach(url => {
        const invalidNode = {
          type: 'link',
          url,
          children: []
        }

        // Act & Assert
        expect(() => LinkNodeSchema.parse(invalidNode)).toThrow()
      })
    })
  })

  describe('Image Node Schema', () => {
    it('should validate image with required fields', () => {
      // Arrange
      const imageNode = {
        type: 'image',
        url: 'https://example.com/image.png',
        alt: 'Alt text',
        title: 'Image title'
      }

      // Act
      const result = ImageNodeSchema.parse(imageNode)

      // Assert
      expect(result.type).toBe('image')
      expect(result.url).toBe('https://example.com/image.png')
      expect(result.alt).toBe('Alt text')
      expect(result.title).toBe('Image title')
    })

    it('should validate image with only required fields', () => {
      // Arrange
      const imageNode = {
        type: 'image',
        url: 'https://example.com/image.png'
      }

      // Act
      const result = ImageNodeSchema.parse(imageNode)

      // Assert
      expect(result.url).toBe('https://example.com/image.png')
      expect(result.alt).toBeUndefined()
      expect(result.title).toBeUndefined()
    })

    it('should reject image with invalid URL', () => {
      // Arrange
      const invalidNode = {
        type: 'image',
        url: 'not-a-url'
      }

      // Act & Assert
      expect(() => ImageNodeSchema.parse(invalidNode)).toThrow()
    })
  })

  describe('Code Node Schema', () => {
    it('should validate code node with language', () => {
      // Arrange
      const codeNode = {
        type: 'code',
        value: 'console.log("hello")',
        lang: 'javascript'
      }

      // Act
      const result = CodeNodeSchema.parse(codeNode)

      // Assert
      expect(result.type).toBe('code')
      expect(result.value).toBe('console.log("hello")')
      expect(result.lang).toBe('javascript')
    })

    it('should validate code node without language', () => {
      // Arrange
      const codeNode = {
        type: 'code',
        value: 'some code'
      }

      // Act
      const result = CodeNodeSchema.parse(codeNode)

      // Assert
      expect(result.value).toBe('some code')
      expect(result.lang).toBeUndefined()
    })
  })

  describe('AST Schema', () => {
    it('should validate complete AST structure', () => {
      // Arrange
      const ast = {
        type: 'root',
        children: [
          {
            type: 'heading',
            depth: 1,
            children: [{ type: 'text', value: 'Title' }]
          },
          {
            type: 'paragraph',
            children: [
              { type: 'text', value: 'This is ' },
              {
                type: 'link',
                url: 'https://example.com',
                children: [{ type: 'text', value: 'a link' }]
              }
            ]
          },
          {
            type: 'container',
            classes: ['highlight'],
            children: [
              { type: 'text', value: 'Container content' }
            ]
          }
        ]
      }

      // Act
      const result = CurtainsASTSchema.parse(ast)

      // Assert
      expect(result.type).toBe('root')
      expect(result.children).toHaveLength(3)
      const child0 = result.children[0] as TestASTNode
      const child1 = result.children[1] as TestASTNode
      const child2 = result.children[2] as TestASTNode
      expect(child0?.type).toBe('heading')
      expect(child1?.type).toBe('paragraph')
      expect(child2?.type).toBe('container')
    })
  })

  describe('Slide Schema', () => {
    it('should validate valid slide', () => {
      // Arrange
      const slide = {
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

      // Act
      const result = CurtainsSlideSchema.parse(slide)

      // Assert
      expect(result.type).toBe('curtains-slide')
      expect(result.index).toBe(0)
      expect(result.slideCSS).toBe('.slide { background: blue; }')
    })

    it('should reject slide with invalid index', () => {
      // Arrange
      const invalidSlides = [
        { index: -1 },
        { index: 99 }, // MAX_SLIDES = 99, so max index is 98
        { index: 100 }
      ]

      invalidSlides.forEach(({ index }) => {
        const slide = {
          type: 'curtains-slide',
          index,
          ast: { type: 'root', children: [] },
          slideCSS: ''
        }

        // Act & Assert
        expect(() => CurtainsSlideSchema.parse(slide)).toThrow()
      })
    })

    it('should validate slide at maximum index', () => {
      // Arrange
      const slide = {
        type: 'curtains-slide',
        index: 98, // MAX_SLIDES - 1
        ast: { type: 'root', children: [] },
        slideCSS: ''
      }

      // Act
      const result = CurtainsSlideSchema.parse(slide)

      // Assert
      expect(result.index).toBe(98)
    })
  })

  describe('Document Schema', () => {
    it('should validate valid document', () => {
      // Arrange
      const document = {
        type: 'curtains-document',
        version: '0.1',
        slides: [
          {
            type: 'curtains-slide',
            index: 0,
            ast: {
              type: 'root',
              children: [{ type: 'text', value: 'Content' }]
            },
            slideCSS: ''
          }
        ],
        globalCSS: '.global { color: red; }'
      }

      // Act
      const result = CurtainsDocumentSchema.parse(document)

      // Assert
      expect(result.type).toBe('curtains-document')
      expect(result.version).toBe('0.1')
      expect(result.slides).toHaveLength(1)
      expect(result.globalCSS).toBe('.global { color: red; }')
    })

    it('should reject document with no slides', () => {
      // Arrange
      const document = {
        type: 'curtains-document',
        version: '0.1',
        slides: [],
        globalCSS: ''
      }

      // Act & Assert
      expect(() => CurtainsDocumentSchema.parse(document)).toThrow('Document must have at least one slide')
    })

    it('should reject document with invalid version', () => {
      // Arrange
      const document = {
        type: 'curtains-document',
        version: '1.0',
        slides: [
          {
            type: 'curtains-slide',
            index: 0,
            ast: { type: 'root', children: [] },
            slideCSS: ''
          }
        ],
        globalCSS: ''
      }

      // Act & Assert
      expect(() => CurtainsDocumentSchema.parse(document)).toThrow()
    })
  })

  describe('Build Options Schema', () => {
    it('should validate valid build options', () => {
      // Arrange
      const options = {
        input: 'presentation.curtain',
        output: 'output.html',
        theme: 'dark'
      }

      // Act
      const result = BuildOptionsSchema.parse(options)

      // Assert
      expect(result.input).toBe('presentation.curtain')
      expect(result.output).toBe('output.html')
      expect(result.theme).toBe('dark')
    })

    it('should default theme to light', () => {
      // Arrange
      const options = {
        input: 'presentation.curtain',
        output: 'output.html'
      }

      // Act
      const result = BuildOptionsSchema.parse(options)

      // Assert
      expect(result.theme).toBe('light')
    })

    it('should reject invalid file extensions', () => {
      // Arrange
      const invalidOptions = [
        { input: 'file.txt', output: 'output.html' },
        { input: 'presentation.curtain', output: 'output.txt' }
      ]

      invalidOptions.forEach(options => {
        // Act & Assert
        expect(() => BuildOptionsSchema.parse(options)).toThrow()
      })
    })
  })

  describe('Theme Schema', () => {
    it('should validate valid themes', () => {
      // Arrange
      const validThemes = ['light', 'dark']

      validThemes.forEach(theme => {
        // Act
        const result = ThemeSchema.parse(theme)

        // Assert
        expect(result).toBe(theme)
      })
    })

    it('should reject invalid themes', () => {
      // Arrange
      const invalidThemes = ['blue', 'custom', 'auto']

      invalidThemes.forEach(theme => {
        // Act & Assert
        expect(() => ThemeSchema.parse(theme)).toThrow()
      })
    })
  })

  describe('Constants', () => {
    it('should have expected default values', () => {
      // Assert
      expect(DEFAULTS.MAX_SLIDES).toBe(99)
      expect(DEFAULTS.MAX_NESTING_DEPTH).toBe(10)
      expect(DEFAULTS.THEME).toBe('light')
      expect(DEFAULTS.OUTPUT_EXTENSION).toBe('.html')
    })

    it('should have valid regex patterns', () => {
      // Assert
      expect(REGEX.DELIMITER).toBeInstanceOf(RegExp)
      expect(REGEX.CONTAINER).toBeInstanceOf(RegExp)
      expect(REGEX.STYLE).toBeInstanceOf(RegExp)
      expect(REGEX.CLASS_NAME).toBeInstanceOf(RegExp)
    })

    it('should validate class names with regex', () => {
      // Arrange
      const validClasses = ['test', 'test-class', 'test_class', 'TestClass123']
      const invalidClasses = ['test@class', 'test class', 'test.class']

      // Act & Assert
      validClasses.forEach(className => {
        expect(REGEX.CLASS_NAME.test(className)).toBe(true)
      })

      invalidClasses.forEach(className => {
        expect(REGEX.CLASS_NAME.test(className)).toBe(false)
      })
    })
  })

  describe('Type exports', () => {
    it('should export all expected types', () => {
      // This test ensures TypeScript compilation succeeds with all type exports
      // Arrange
      const document: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [],
        globalCSS: ''
      }

      const slide: CurtainsSlide = {
        type: 'curtains-slide',
        index: 0,
        ast: { type: 'root', children: [] },
        slideCSS: ''
      }

      const ast: CurtainsAST = {
        type: 'root',
        children: []
      }

      const containerNode: ContainerNode = {
        type: 'container',
        classes: ['test'],
        children: []
      }

      const textNode: TextNode = {
        type: 'text',
        value: 'test'
      }

      const headingNode: HeadingNode = {
        type: 'heading',
        depth: 1,
        children: []
      }

      const astNode: ASTNode = textNode

      // Assert
      expect(document.type).toBe('curtains-document')
      expect(slide.type).toBe('curtains-slide')
      expect(ast.type).toBe('root')
      expect(containerNode.type).toBe('container')
      expect(textNode.type).toBe('text')
      expect(headingNode.type).toBe('heading')
      const typedASTNode = astNode as TestASTNode
      expect(typedASTNode?.type).toBe('text')
    })
  })
})