import { describe, it, expect, vi, beforeEach } from 'vitest'
import { transform } from './index.js'
import type { CurtainsDocument, CurtainsAST, ASTNode } from '../ast/types.js'
import { astToHTML } from './ast-to-html.js'
import { scopeStyles } from './style-scoping.js'
import { ZodError } from 'zod'

// Mock dependencies
vi.mock('./ast-to-html.js', () => ({
  astToHTML: vi.fn()
}))

vi.mock('./style-scoping.js', () => ({
  scopeStyles: vi.fn()
}))

const mockAstToHTML = vi.mocked(astToHTML)
const mockScopeStyles = vi.mocked(scopeStyles)

describe('transform', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('valid document transformation', () => {
    it('should transform a single slide document', () => {
      const document: CurtainsDocument = {
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
          slideCSS: '.hero { color: blue; }'
        }],
        globalCSS: 'body { margin: 0; }'
      }

      mockAstToHTML.mockReturnValue('<h1>Hello World</h1>')
      mockScopeStyles.mockReturnValue('.curtains-slide:nth-child(1) .hero { color: blue; }')

      const result = transform(document)

      expect(result).toEqual({
        slides: [{
          html: '<h1>Hello World</h1>',
          css: '.curtains-slide:nth-child(1) .hero { color: blue; }'
        }],
        globalCSS: 'body { margin: 0; }'
      })

      expect(mockAstToHTML).toHaveBeenCalledTimes(1)
      expect(mockAstToHTML).toHaveBeenCalledWith(document.slides[0]?.ast)
      expect(mockScopeStyles).toHaveBeenCalledTimes(1)
      expect(mockScopeStyles).toHaveBeenCalledWith('.hero { color: blue; }', 0)
    })

    it('should transform multiple slides document', () => {
      const document: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [
          {
            type: 'curtains-slide',
            index: 0,
            ast: {
              type: 'root',
              children: [{
                type: 'heading',
                depth: 1,
                children: [{ type: 'text', value: 'Slide 1' }]
              }]
            },
            slideCSS: '.slide1 { background: red; }'
          },
          {
            type: 'curtains-slide',
            index: 1,
            ast: {
              type: 'root',
              children: [{
                type: 'heading',
                depth: 2,
                children: [{ type: 'text', value: 'Slide 2' }]
              }]
            },
            slideCSS: '.slide2 { background: blue; }'
          },
          {
            type: 'curtains-slide',
            index: 2,
            ast: {
              type: 'root',
              children: [{
                type: 'paragraph',
                children: [{ type: 'text', value: 'Final slide' }]
              }]
            },
            slideCSS: '.slide3 { background: green; }'
          }
        ],
        globalCSS: '.global { font-family: Arial; }'
      }

      mockAstToHTML
        .mockReturnValueOnce('<h1>Slide 1</h1>')
        .mockReturnValueOnce('<h2>Slide 2</h2>')
        .mockReturnValueOnce('<p>Final slide</p>')

      mockScopeStyles
        .mockReturnValueOnce('.curtains-slide:nth-child(1) .slide1 { background: red; }')
        .mockReturnValueOnce('.curtains-slide:nth-child(2) .slide2 { background: blue; }')
        .mockReturnValueOnce('.curtains-slide:nth-child(3) .slide3 { background: green; }')

      const result = transform(document)

      expect(result).toEqual({
        slides: [
          {
            html: '<h1>Slide 1</h1>',
            css: '.curtains-slide:nth-child(1) .slide1 { background: red; }'
          },
          {
            html: '<h2>Slide 2</h2>',
            css: '.curtains-slide:nth-child(2) .slide2 { background: blue; }'
          },
          {
            html: '<p>Final slide</p>',
            css: '.curtains-slide:nth-child(3) .slide3 { background: green; }'
          }
        ],
        globalCSS: '.global { font-family: Arial; }'
      })

      expect(mockAstToHTML).toHaveBeenCalledTimes(3)
      expect(mockScopeStyles).toHaveBeenCalledTimes(3)
      
      // Verify correct slide indices were passed
      expect(mockScopeStyles).toHaveBeenNthCalledWith(1, '.slide1 { background: red; }', 0)
      expect(mockScopeStyles).toHaveBeenNthCalledWith(2, '.slide2 { background: blue; }', 1)
      expect(mockScopeStyles).toHaveBeenNthCalledWith(3, '.slide3 { background: green; }', 2)
    })

    it('should handle slides with empty CSS', () => {
      const document: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{
              type: 'paragraph',
              children: [{ type: 'text', value: 'No CSS' }]
            }]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      }

      mockAstToHTML.mockReturnValue('<p>No CSS</p>')
      mockScopeStyles.mockReturnValue('')

      const result = transform(document)

      expect(result).toEqual({
        slides: [{
          html: '<p>No CSS</p>',
          css: ''
        }],
        globalCSS: ''
      })

      expect(mockScopeStyles).toHaveBeenCalledWith('', 0)
    })

    it('should handle complex AST structures', () => {
      const complexAST: CurtainsAST = {
        type: 'root',
        children: [
          {
            type: 'container',
            classes: ['hero', 'main'],
            children: [{
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'Complex Slide' }]
            }]
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
          },
          {
            type: 'code',
            lang: 'typescript',
            value: 'const x: number = 42;'
          }
        ]
      }

      const document: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: complexAST,
          slideCSS: '.hero { padding: 2rem; } .list-item { margin: 0.5rem; }'
        }],
        globalCSS: '@import url("fonts.css"); body { font-size: 16px; }'
      }

      const expectedHTML = '<div class="hero main"><h1>Complex Slide</h1></div><ul><li>Item 1</li><li>Item 2</li></ul><pre><code class="language-typescript">const x: number = 42;</code></pre>'
      const expectedCSS = '.curtains-slide:nth-child(1) .hero { padding: 2rem; } .curtains-slide:nth-child(1) .list-item { margin: 0.5rem; }'

      mockAstToHTML.mockReturnValue(expectedHTML)
      mockScopeStyles.mockReturnValue(expectedCSS)

      const result = transform(document)

      expect(result).toEqual({
        slides: [{
          html: expectedHTML,
          css: expectedCSS
        }],
        globalCSS: '@import url("fonts.css"); body { font-size: 16px; }'
      })

      expect(mockAstToHTML).toHaveBeenCalledWith(complexAST)
      expect(mockScopeStyles).toHaveBeenCalledWith('.hero { padding: 2rem; } .list-item { margin: 0.5rem; }', 0)
    })

    it('should preserve slide order by index', () => {
      const document: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [
          {
            type: 'curtains-slide',
            index: 0,
            ast: { type: 'root', children: [] },
            slideCSS: '.slide-0 {}'
          },
          {
            type: 'curtains-slide',
            index: 1,
            ast: { type: 'root', children: [] },
            slideCSS: '.slide-1 {}'
          }
        ],
        globalCSS: ''
      }

      mockAstToHTML.mockReturnValue('<div></div>')
      mockScopeStyles
        .mockReturnValueOnce('.curtains-slide:nth-child(1) .slide-0 {}')
        .mockReturnValueOnce('.curtains-slide:nth-child(2) .slide-1 {}')

      const result = transform(document)

      expect(result.slides).toHaveLength(2)
      expect(mockScopeStyles).toHaveBeenNthCalledWith(1, '.slide-0 {}', 0)
      expect(mockScopeStyles).toHaveBeenNthCalledWith(2, '.slide-1 {}', 1)
    })

    it('should handle maximum slides (99 slides)', () => {
      const slides = Array.from({ length: 99 }, (_, index) => ({
        type: 'curtains-slide' as const,
        index,
        ast: {
          type: 'root' as const,
          children: [{
            type: 'paragraph' as const,
            children: [{ type: 'text' as const, value: `Slide ${index + 1}` }]
          }] as ASTNode[]
        },
        slideCSS: `.slide-${index} { color: hsl(${index * 4}, 70%, 50%); }`
      }))

      const document: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides,
        globalCSS: '.global { margin: 0; }'
      }

      mockAstToHTML.mockImplementation(() => '<p>Slide content</p>')
      mockScopeStyles.mockImplementation((_: string, index: number) => 
        `.curtains-slide:nth-child(${index + 1}) .slide-${index} { color: hsl(${index * 4}, 70%, 50%); }`
      )

      const result = transform(document)

      expect(result.slides).toHaveLength(99)
      expect(mockAstToHTML).toHaveBeenCalledTimes(99)
      expect(mockScopeStyles).toHaveBeenCalledTimes(99)
      
      // Verify last slide is processed correctly
      expect(mockScopeStyles).toHaveBeenLastCalledWith('.slide-98 { color: hsl(392, 70%, 50%); }', 98)
    })
  })

  describe('CSS scoping integration', () => {
    it('should pass correct slide index to scopeStyles', () => {
      const document: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [
          {
            type: 'curtains-slide',
            index: 5, // Non-zero index
            ast: { type: 'root', children: [] },
            slideCSS: '.test { color: red; }'
          }
        ],
        globalCSS: ''
      }

      mockAstToHTML.mockReturnValue('<div></div>')
      mockScopeStyles.mockReturnValue('.curtains-slide:nth-child(6) .test { color: red; }')

      transform(document)

      expect(mockScopeStyles).toHaveBeenCalledWith('.test { color: red; }', 5)
    })

    it('should handle complex CSS with media queries and animations', () => {
      const complexCSS = `
        .hero {
          background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
          animation: fadeIn 1s ease-in;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @media (max-width: 768px) {
          .hero {
            padding: 1rem;
          }
        }
      `

      const document: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: { type: 'root', children: [] },
          slideCSS: complexCSS
        }],
        globalCSS: ''
      }

      const expectedScopedCSS = `
        .curtains-slide:nth-child(1) .hero {
          background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
          animation: fadeIn 1s ease-in;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @media (max-width: 768px) {
          .hero {
            padding: 1rem;
          }
        }
      `

      mockAstToHTML.mockReturnValue('<div></div>')
      mockScopeStyles.mockReturnValue(expectedScopedCSS)

      const result = transform(document)

      expect(result.slides[0]?.css).toBe(expectedScopedCSS)
      expect(mockScopeStyles).toHaveBeenCalledWith(complexCSS, 0)
    })
  })

  describe('schema validation', () => {
    it('should validate input against CurtainsDocumentSchema', () => {
      const invalidDocument = {
        type: 'invalid-document',
        version: '0.1',
        slides: [],
        globalCSS: ''
      }

      expect(() => transform(invalidDocument)).toThrow(ZodError)
      expect(mockAstToHTML).not.toHaveBeenCalled()
      expect(mockScopeStyles).not.toHaveBeenCalled()
    })

    it('should validate output against TransformedDocumentSchema', () => {
      const document: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: { type: 'root', children: [] },
          slideCSS: ''
        }],
        globalCSS: ''
      }

      mockAstToHTML.mockReturnValue('<div></div>')
      mockScopeStyles.mockReturnValue('')

      const result = transform(document)

      // The result should pass TransformedDocumentSchema validation
      expect(result).toHaveProperty('slides')
      expect(result).toHaveProperty('globalCSS')
      expect(Array.isArray(result.slides)).toBe(true)
      expect(result.slides).toHaveLength(1)
      expect(result.slides[0]).toHaveProperty('html')
      expect(result.slides[0]).toHaveProperty('css')
      expect(typeof result.slides[0]?.html).toBe('string')
      expect(typeof result.slides[0]?.css).toBe('string')
      expect(typeof result.globalCSS).toBe('string')
    })

    it('should reject document with invalid version', () => {
      const invalidDocument = {
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

      expect(() => transform(invalidDocument)).toThrow(ZodError)
    })

    it('should reject document with no slides', () => {
      const invalidDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [], // Empty slides array
        globalCSS: ''
      }

      expect(() => transform(invalidDocument)).toThrow(ZodError)
    })

    it('should reject document with invalid slide index', () => {
      const invalidDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 99, // Invalid index (max is 98)
          ast: { type: 'root', children: [] },
          slideCSS: ''
        }],
        globalCSS: ''
      }

      expect(() => transform(invalidDocument)).toThrow(ZodError)
    })

    it('should reject slide with invalid AST', () => {
      const invalidDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'invalid-root', // Invalid AST type
            children: []
          },
          slideCSS: ''
        }],
        globalCSS: ''
      }

      expect(() => transform(invalidDocument)).toThrow(ZodError)
    })

    it('should reject slide with invalid container classes', () => {
      const invalidDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{
              type: 'container',
              classes: ['valid-class', 'invalid class with spaces'], // Invalid class name
              children: []
            }]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      }

      expect(() => transform(invalidDocument)).toThrow(ZodError)
    })
  })

  describe('error handling', () => {
    it('should handle astToHTML throwing an error', () => {
      const document: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: { type: 'root', children: [] },
          slideCSS: ''
        }],
        globalCSS: ''
      }

      mockAstToHTML.mockImplementation(() => {
        throw new Error('AST conversion failed')
      })
      mockScopeStyles.mockReturnValue('')

      expect(() => transform(document)).toThrow('AST conversion failed')
    })

    it('should handle scopeStyles throwing an error', () => {
      const document: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: { type: 'root', children: [] },
          slideCSS: '.test {}'
        }],
        globalCSS: ''
      }

      mockAstToHTML.mockReturnValue('<div></div>')
      mockScopeStyles.mockImplementation(() => {
        throw new Error('CSS scoping failed')
      })

      expect(() => transform(document)).toThrow('CSS scoping failed')
    })

    it('should handle null/undefined input', () => {
      expect(() => transform(null)).toThrow(ZodError)
      expect(() => transform(undefined)).toThrow(ZodError)
    })

    it('should handle empty object input', () => {
      expect(() => transform({})).toThrow(ZodError)
    })

    it('should handle malformed AST nodes', () => {
      const documentWithMalformedAST = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{
              type: 'heading',
              depth: 7, // Invalid depth (max is 6)
              children: [{ type: 'text', value: 'Invalid heading' }]
            }]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      }

      expect(() => transform(documentWithMalformedAST)).toThrow(ZodError)
    })
  })

  describe('edge cases', () => {
    it('should handle empty AST children arrays', () => {
      const document: CurtainsDocument = {
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

      mockAstToHTML.mockReturnValue('')
      mockScopeStyles.mockReturnValue('')

      const result = transform(document)

      expect(result).toEqual({
        slides: [{
          html: '',
          css: ''
        }],
        globalCSS: ''
      })
    })

    it('should handle slides with whitespace-only CSS', () => {
      const document: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: { type: 'root', children: [] },
          slideCSS: '   \n\t   \n   '
        }],
        globalCSS: '   \n\t   \n   '
      }

      mockAstToHTML.mockReturnValue('<div></div>')
      mockScopeStyles.mockReturnValue('')

      const result = transform(document)

      expect(result.slides[0]?.css).toBe('')
      expect(result.globalCSS).toBe('   \n\t   \n   ')
      expect(mockScopeStyles).toHaveBeenCalledWith('   \n\t   \n   ', 0)
    })

    it('should handle single slide document (minimum valid case)', () => {
      const document: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{
              type: 'paragraph',
              children: [{ type: 'text', value: 'Single slide' }]
            }]
          },
          slideCSS: '.single { text-align: center; }'
        }],
        globalCSS: 'html, body { height: 100%; }'
      }

      mockAstToHTML.mockReturnValue('<p>Single slide</p>')
      mockScopeStyles.mockReturnValue('.curtains-slide:nth-child(1) .single { text-align: center; }')

      const result = transform(document)

      expect(result.slides).toHaveLength(1)
      expect(result.slides[0]?.html).toBe('<p>Single slide</p>')
      expect(result.slides[0]?.css).toBe('.curtains-slide:nth-child(1) .single { text-align: center; }')
      expect(result.globalCSS).toBe('html, body { height: 100%; }')
    })

    it('should handle deeply nested AST structures', () => {
      const deeplyNestedAST: CurtainsAST = {
        type: 'root',
        children: [{
          type: 'container',
          classes: ['outer'],
          children: [{
            type: 'container',
            classes: ['middle'],
            children: [{
              type: 'container',
              classes: ['inner'],
              children: [{
                type: 'paragraph',
                children: [{
                  type: 'text',
                  value: 'Deeply nested content'
                }]
              }]
            }]
          }]
        }]
      }

      const document: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: deeplyNestedAST,
          slideCSS: '.outer .middle .inner { padding: 1rem; }'
        }],
        globalCSS: ''
      }

      const expectedHTML = '<div class="outer"><div class="middle"><div class="inner"><p>Deeply nested content</p></div></div></div>'
      const expectedCSS = '.curtains-slide:nth-child(1) .outer .middle .inner { padding: 1rem; }'

      mockAstToHTML.mockReturnValue(expectedHTML)
      mockScopeStyles.mockReturnValue(expectedCSS)

      const result = transform(document)

      expect(result.slides[0]?.html).toBe(expectedHTML)
      expect(result.slides[0]?.css).toBe(expectedCSS)
      expect(mockAstToHTML).toHaveBeenCalledWith(deeplyNestedAST)
    })
  })

  describe('integration with real dependencies (unmocked)', () => {
    it('should work with real astToHTML and scopeStyles functions', async () => {
      // Clear mocks and use real implementations
      vi.doUnmock('./ast-to-html.js')
      vi.doUnmock('./style-scoping.js')
      
      // Re-import the transform function to get fresh module with real dependencies
      vi.resetModules()
      const { transform: realTransform } = await import('./index.js')

      const document: CurtainsDocument = {
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
              children: [{ type: 'text', value: 'Integration Test' }]
            }]
          },
          slideCSS: '.title { font-size: 2rem; }'
        }],
        globalCSS: 'body { margin: 0; }'
      }

      const result = realTransform(document)

      // Verify structure
      expect(result).toHaveProperty('slides')
      expect(result).toHaveProperty('globalCSS')
      expect(result.slides).toHaveLength(1)
      
      // Verify HTML contains expected heading
      expect(result.slides[0]?.html).toContain('<h1>')
      expect(result.slides[0]?.html).toContain('Integration Test')
      
      // Verify CSS was scoped
      expect(result.slides[0]?.css).toContain('.curtains-slide:nth-child(1)')
      expect(result.slides[0]?.css).toContain('.title')
      
      // Verify global CSS is preserved
      expect(result.globalCSS).toBe('body { margin: 0; }')
    })
  })
})