import { describe, it, expect, vi, beforeEach } from 'vitest'
import { transform, astToHTML, scopeStyles } from './index.js'
import type { CurtainsDocument } from '../ast/types.js'

// Mock the dependencies
vi.mock('./ast-to-html.js', () => ({
  astToHTML: vi.fn()
}))

vi.mock('./style-scoping.js', () => ({
  scopeStyles: vi.fn()
}))

describe('transform', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default mock implementations
    vi.mocked(astToHTML).mockReturnValue('<div>Mock HTML</div>')
    vi.mocked(scopeStyles).mockImplementation((css, index) => `.scoped-${index} { ${css} }`)
  })

  describe('basic transformation', () => {
    it('should transform a valid document with single slide', () => {
      // Arrange
      const input: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'Hello World' }]
            }]
          },
          slideCSS: '.title { color: blue; }'
        }],
        globalCSS: '.global { font-family: Arial; }'
      }

      vi.mocked(astToHTML).mockReturnValue('<h1>Hello World</h1>')
      vi.mocked(scopeStyles).mockReturnValue('.curtains-slide:nth-child(1) .title { color: blue; }')

      // Act
      const result = transform(input)

      // Assert
      expect(result).toEqual({
        slides: [{
          html: '<h1>Hello World</h1>',
          css: '.curtains-slide:nth-child(1) .title { color: blue; }'
        }],
        globalCSS: '.global { font-family: Arial; }'
      })
      expect(astToHTML).toHaveBeenCalledTimes(1)
      expect(astToHTML).toHaveBeenCalledWith(input.slides[0]?.ast)
      expect(scopeStyles).toHaveBeenCalledTimes(1)
      expect(scopeStyles).toHaveBeenCalledWith('.title { color: blue; }', 0)
    })

    it('should transform a document with multiple slides', () => {
      // Arrange
      const input: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [
          {
            type: 'curtains-slide',
            index: 0,
            ast: {
              type: 'root',
              children: [{ type: 'heading', depth: 1, children: [{ type: 'text', value: 'Slide 1' }] }]
            },
            slideCSS: '.slide1 { background: red; }'
          },
          {
            type: 'curtains-slide',
            index: 1,
            ast: {
              type: 'root',
              children: [{ type: 'heading', depth: 1, children: [{ type: 'text', value: 'Slide 2' }] }]
            },
            slideCSS: '.slide2 { background: green; }'
          },
          {
            type: 'curtains-slide',
            index: 2,
            ast: {
              type: 'root',
              children: [{ type: 'heading', depth: 1, children: [{ type: 'text', value: 'Slide 3' }] }]
            },
            slideCSS: '.slide3 { background: blue; }'
          }
        ],
        globalCSS: '.global { margin: 0; }'
      }

      vi.mocked(astToHTML)
        .mockReturnValueOnce('<h1>Slide 1</h1>')
        .mockReturnValueOnce('<h1>Slide 2</h1>')
        .mockReturnValueOnce('<h1>Slide 3</h1>')

      vi.mocked(scopeStyles)
        .mockReturnValueOnce('.curtains-slide:nth-child(1) .slide1 { background: red; }')
        .mockReturnValueOnce('.curtains-slide:nth-child(2) .slide2 { background: green; }')
        .mockReturnValueOnce('.curtains-slide:nth-child(3) .slide3 { background: blue; }')

      // Act
      const result = transform(input)

      // Assert
      expect(result.slides).toHaveLength(3)
      expect(result.slides[0]).toEqual({
        html: '<h1>Slide 1</h1>',
        css: '.curtains-slide:nth-child(1) .slide1 { background: red; }'
      })
      expect(result.slides[1]).toEqual({
        html: '<h1>Slide 2</h1>',
        css: '.curtains-slide:nth-child(2) .slide2 { background: green; }'
      })
      expect(result.slides[2]).toEqual({
        html: '<h1>Slide 3</h1>',
        css: '.curtains-slide:nth-child(3) .slide3 { background: blue; }'
      })
      expect(result.globalCSS).toBe('.global { margin: 0; }')

      expect(astToHTML).toHaveBeenCalledTimes(3)
      expect(scopeStyles).toHaveBeenCalledTimes(3)
      expect(scopeStyles).toHaveBeenNthCalledWith(1, '.slide1 { background: red; }', 0)
      expect(scopeStyles).toHaveBeenNthCalledWith(2, '.slide2 { background: green; }', 1)
      expect(scopeStyles).toHaveBeenNthCalledWith(3, '.slide3 { background: blue; }', 2)
    })
  })

  describe('edge cases', () => {
    it('should handle slides with empty AST', () => {
      // Arrange
      const input: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: []
          },
          slideCSS: ''
        }],
        globalCSS: ''
      }

      vi.mocked(astToHTML).mockReturnValue('')
      vi.mocked(scopeStyles).mockReturnValue('')

      // Act
      const result = transform(input)

      // Assert
      expect(result.slides).toHaveLength(1)
      expect(result.slides[0]).toEqual({
        html: '',
        css: ''
      })
      expect(result.globalCSS).toBe('')
    })

    it('should handle slides with empty CSS', () => {
      // Arrange
      const input: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Simple content' }] }]
          },
          slideCSS: ''
        }],
        globalCSS: '.global { color: #000; }'
      }

      vi.mocked(astToHTML).mockReturnValue('<p>Simple content</p>')
      vi.mocked(scopeStyles).mockReturnValue('')

      // Act
      const result = transform(input)

      // Assert
      expect(result.slides[0]).toEqual({
        html: '<p>Simple content</p>',
        css: ''
      })
      expect(scopeStyles).toHaveBeenCalledWith('', 0)
    })

    it('should handle document with only global CSS', () => {
      // Arrange
      const input: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Content' }] }]
          },
          slideCSS: ''
        }],
        globalCSS: '.global { font-size: 16px; }'
      }

      vi.mocked(astToHTML).mockReturnValue('<p>Content</p>')
      vi.mocked(scopeStyles).mockReturnValue('')

      // Act
      const result = transform(input)

      // Assert
      expect(result.globalCSS).toBe('.global { font-size: 16px; }')
      expect(result.slides[0]?.css).toBe('')
    })

    it('should preserve globalCSS as-is from input document', () => {
      // Arrange
      const complexGlobalCSS = `
        @import url('https://fonts.googleapis.com/css2?family=Inter');
        
        .global-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        @media (max-width: 768px) {
          .global-container { padding: 1rem; }
        }
      `

      const input: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Test' }] }]
          },
          slideCSS: '.local { color: red; }'
        }],
        globalCSS: complexGlobalCSS
      }

      // Act
      const result = transform(input)

      // Assert
      expect(result.globalCSS).toBe(complexGlobalCSS)
    })
  })

  describe('complex AST scenarios', () => {
    it('should handle complex nested AST structures', () => {
      // Arrange
      const input: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [
              {
                type: 'container',
                classes: ['hero-section'],
                children: [
                  {
                    type: 'heading',
                    depth: 1,
                    children: [{ type: 'text', value: 'Welcome' }]
                  },
                  {
                    type: 'paragraph',
                    children: [
                      { type: 'text', value: 'This is ' },
                      { type: 'text', value: 'bold text', bold: true },
                      { type: 'text', value: ' and ' },
                      { type: 'text', value: 'italic text', italic: true }
                    ]
                  }
                ]
              },
              {
                type: 'list',
                ordered: false,
                children: [
                  {
                    type: 'listItem',
                    children: [{
                      type: 'paragraph',
                      children: [{ type: 'text', value: 'Item 1' }]
                    }]
                  },
                  {
                    type: 'listItem',
                    children: [{
                      type: 'paragraph',
                      children: [{ type: 'text', value: 'Item 2' }]
                    }]
                  }
                ]
              }
            ]
          },
          slideCSS: '.hero-section { padding: 2rem; }'
        }],
        globalCSS: ''
      }

      const mockHtml = '<div class="hero-section"><h1>Welcome</h1><p>This is <strong>bold text</strong> and <em>italic text</em></p></div><ul><li>Item 1</li><li>Item 2</li></ul>'
      vi.mocked(astToHTML).mockReturnValue(mockHtml)
      vi.mocked(scopeStyles).mockReturnValue('.curtains-slide:nth-child(1) .hero-section { padding: 2rem; }')

      // Act
      const result = transform(input)

      // Assert
      expect(result.slides[0]?.html).toBe(mockHtml)
      expect(result.slides[0]?.css).toBe('.curtains-slide:nth-child(1) .hero-section { padding: 2rem; }')
      expect(astToHTML).toHaveBeenCalledWith(input.slides[0]?.ast)
    })

    it('should handle AST with tables and code blocks', () => {
      // Arrange
      const input: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [
              {
                type: 'table',
                children: [
                  {
                    type: 'tableRow',
                    children: [
                      {
                        type: 'tableCell',
                        header: true,
                        children: [{ type: 'text', value: 'Language' }]
                      },
                      {
                        type: 'tableCell',
                        header: true,
                        children: [{ type: 'text', value: 'Usage' }]
                      }
                    ]
                  },
                  {
                    type: 'tableRow',
                    children: [
                      {
                        type: 'tableCell',
                        children: [{ type: 'text', value: 'TypeScript' }]
                      },
                      {
                        type: 'tableCell',
                        children: [{ type: 'text', value: 'Frontend' }]
                      }
                    ]
                  }
                ]
              },
              {
                type: 'code',
                lang: 'typescript',
                value: 'const greeting: string = "Hello, World!";'
              }
            ]
          },
          slideCSS: 'table { border-collapse: collapse; } pre { background: #f5f5f5; }'
        }],
        globalCSS: ''
      }

      const mockHtml = '<table><thead><tr><th>Language</th><th>Usage</th></tr></thead><tbody><tr><td>TypeScript</td><td>Frontend</td></tr></tbody></table><pre><code class="language-typescript">const greeting: string = "Hello, World!";</code></pre>'
      vi.mocked(astToHTML).mockReturnValue(mockHtml)
      vi.mocked(scopeStyles).mockReturnValue('.curtains-slide:nth-child(1) table { border-collapse: collapse; } .curtains-slide:nth-child(1) pre { background: #f5f5f5; }')

      // Act
      const result = transform(input)

      // Assert
      expect(result.slides[0]?.html).toBe(mockHtml)
      expect(scopeStyles).toHaveBeenCalledWith('table { border-collapse: collapse; } pre { background: #f5f5f5; }', 0)
    })

    it('should handle AST with links and images', () => {
      // Arrange
      const input: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  { type: 'text', value: 'Check out ' },
                  {
                    type: 'link',
                    url: 'https://example.com',
                    children: [{ type: 'text', value: 'this link' }]
                  },
                  { type: 'text', value: ' for more info.' }
                ]
              },
              {
                type: 'image',
                url: '/images/example.png',
                alt: 'Example image',
                title: 'An example',
                classes: ['responsive-image']
              }
            ]
          },
          slideCSS: '.responsive-image { max-width: 100%; }'
        }],
        globalCSS: ''
      }

      const mockHtml = '<p>Check out <a href="https://example.com" target="_blank" rel="noopener noreferrer">this link</a> for more info.</p><img src="/images/example.png" alt="Example image" title="An example" class="responsive-image" />'
      vi.mocked(astToHTML).mockReturnValue(mockHtml)

      // Act
      const result = transform(input)

      // Assert
      expect(result.slides[0]?.html).toBe(mockHtml)
    })
  })

  describe('input validation', () => {
    it('should throw error for invalid input schema', () => {
      // Arrange
      const invalidInput = {
        type: 'invalid-document',
        slides: []
      }

      // Act & Assert
      expect(() => transform(invalidInput)).toThrow()
    })

    it('should throw error for null input', () => {
      // Act & Assert
      expect(() => transform(null)).toThrow()
    })

    it('should throw error for undefined input', () => {
      // Act & Assert
      expect(() => transform(undefined)).toThrow()
    })

    it('should throw error for non-object input', () => {
      // Act & Assert
      expect(() => transform('invalid')).toThrow()
      expect(() => transform(42)).toThrow()
      expect(() => transform(true)).toThrow()
    })

    it('should throw error for document without slides', () => {
      // Arrange
      const invalidInput = {
        type: 'curtains-document',
        version: '0.1',
        slides: [],
        globalCSS: ''
      }

      // Act & Assert
      expect(() => transform(invalidInput)).toThrow()
    })

    it('should throw error for document with invalid version', () => {
      // Arrange
      const invalidInput = {
        type: 'curtains-document',
        version: '1.0', // Invalid version
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: { type: 'root', children: [] },
          slideCSS: ''
        }],
        globalCSS: ''
      }

      // Act & Assert
      expect(() => transform(invalidInput)).toThrow()
    })

    it('should throw error for slides with invalid AST', () => {
      // Arrange
      const invalidInput = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: { type: 'invalid-ast', children: [] }, // Invalid AST type
          slideCSS: ''
        }],
        globalCSS: ''
      }

      // Act & Assert
      expect(() => transform(invalidInput)).toThrow()
    })

    it('should throw error for slide with invalid index', () => {
      // Arrange
      const invalidInput = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: -1, // Invalid negative index
          ast: { type: 'root', children: [] },
          slideCSS: ''
        }],
        globalCSS: ''
      }

      // Act & Assert
      expect(() => transform(invalidInput)).toThrow()
    })

    it('should throw error for slide with index too high', () => {
      // Arrange
      const invalidInput = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 99, // Index too high (max is 98)
          ast: { type: 'root', children: [] },
          slideCSS: ''
        }],
        globalCSS: ''
      }

      // Act & Assert
      expect(() => transform(invalidInput)).toThrow()
    })
  })

  describe('output validation', () => {
    it('should return a valid TransformedDocument schema', () => {
      // Arrange
      const input: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Test' }] }]
          },
          slideCSS: '.test { color: red; }'
        }],
        globalCSS: '.global { margin: 0; }'
      }

      vi.mocked(astToHTML).mockReturnValue('<p>Test</p>')
      vi.mocked(scopeStyles).mockReturnValue('.curtains-slide:nth-child(1) .test { color: red; }')

      // Act
      const result = transform(input)

      // Assert
      expect(result).toHaveProperty('slides')
      expect(result).toHaveProperty('globalCSS')
      expect(Array.isArray(result.slides)).toBe(true)
      expect(result.slides.length).toBeGreaterThan(0)
      expect(result.slides[0]).toHaveProperty('html')
      expect(result.slides[0]).toHaveProperty('css')
      expect(typeof result.slides[0]?.html).toBe('string')
      expect(typeof result.slides[0]?.css).toBe('string')
      expect(typeof result.globalCSS).toBe('string')
    })

    it('should throw error if transformation produces invalid output', () => {
      // Arrange
      const input: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: []
          },
          slideCSS: ''
        }],
        globalCSS: ''
      }

      // Mock astToHTML to return invalid output
      vi.mocked(astToHTML).mockReturnValue(null as unknown as string)

      // Act & Assert
      expect(() => transform(input)).toThrow()
    })
  })

  describe('dependency integration', () => {
    it('should pass correct parameters to astToHTML', () => {
      // Arrange
      const input: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 5,
          ast: {
            type: 'root',
            children: [{ type: 'heading', depth: 2, children: [{ type: 'text', value: 'Test Heading' }] }]
          },
          slideCSS: '.heading { font-size: 24px; }'
        }],
        globalCSS: ''
      }

      // Act
      transform(input)

      // Assert
      expect(astToHTML).toHaveBeenCalledTimes(1)
      expect(astToHTML).toHaveBeenCalledWith({
        type: 'root',
        children: [{ type: 'heading', depth: 2, children: [{ type: 'text', value: 'Test Heading' }] }]
      })
    })

    it('should pass correct parameters to scopeStyles', () => {
      // Arrange
      const input: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 7,
          ast: {
            type: 'root',
            children: []
          },
          slideCSS: '.custom-style { background: linear-gradient(45deg, #ff6b6b, #4ecdc4); }'
        }],
        globalCSS: ''
      }

      // Act
      transform(input)

      // Assert
      expect(scopeStyles).toHaveBeenCalledTimes(1)
      expect(scopeStyles).toHaveBeenCalledWith('.custom-style { background: linear-gradient(45deg, #ff6b6b, #4ecdc4); }', 7)
    })

    it('should handle when astToHTML throws an error', () => {
      // Arrange
      const input: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: []
          },
          slideCSS: ''
        }],
        globalCSS: ''
      }

      vi.mocked(astToHTML).mockImplementation(() => {
        throw new Error('AST transformation failed')
      })

      // Act & Assert
      expect(() => transform(input)).toThrow('AST transformation failed')
    })

    it('should handle when scopeStyles throws an error', () => {
      // Arrange
      const input: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: []
          },
          slideCSS: '.invalid-css {'
        }],
        globalCSS: ''
      }

      vi.mocked(scopeStyles).mockImplementation(() => {
        throw new Error('CSS scoping failed')
      })

      // Act & Assert
      expect(() => transform(input)).toThrow('CSS scoping failed')
    })
  })

  describe('re-exported utilities', () => {
    it('should re-export astToHTML from ast-to-html module', () => {
      // Assert
      expect(astToHTML).toBeDefined()
      expect(typeof astToHTML).toBe('function')
    })

    it('should re-export scopeStyles from style-scoping module', () => {
      // Assert
      expect(scopeStyles).toBeDefined()
      expect(typeof scopeStyles).toBe('function')
    })
  })
})