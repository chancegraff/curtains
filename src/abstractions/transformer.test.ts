// Transformer Abstraction Layer Tests
// Comprehensive tests for the transformer abstraction that wraps Zod implementation

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  CurtainsTransformer,
  createTransformer,
  transformDocument,
  canTransform
} from './transformer.js'
import type { Document, TransformedDocument, TransformError, DocumentTransformer } from './interfaces.js'
import * as zodTransformer from '../transformer/index.js'
import type { TransformedDocument as ZodTransformedDocument } from '../ast/types.js'

// Mock the underlying Zod transformer
vi.mock('../transformer/index.js', () => ({
  transform: vi.fn()
}))

const mockZodTransform = vi.mocked(zodTransformer.transform)

describe('Transformer Abstraction Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('CurtainsTransformer class', () => {
    let transformer: CurtainsTransformer

    beforeEach(() => {
      transformer = new CurtainsTransformer()
    })

    describe('transform method', () => {
      it('should transform valid document and return clean TransformedDocument interface', () => {
        const document: Document = {
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
                    children: [
                      {
                        type: 'text',
                        value: 'Test Slide'
                      }
                    ]
                  }
                ]
              },
              slideCSS: '.slide { color: red; }'
            }
          ],
          globalCSS: '.global { background: blue; }'
        }

        const mockZodTransformed: ZodTransformedDocument = {
          slides: [
            {
              html: '<h1>Test Slide</h1>',
              css: '.slide-0 .slide { color: red; }'
            }
          ],
          globalCSS: '.global { background: blue; }'
        }

        mockZodTransform.mockReturnValue(mockZodTransformed)

        const result = transformer.transform(document)

        expect(mockZodTransform).toHaveBeenCalledWith({
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
                    children: [
                      {
                        type: 'text',
                        value: 'Test Slide'
                      }
                    ]
                  }
                ]
              },
              slideCSS: '.slide { color: red; }'
            }
          ],
          globalCSS: '.global { background: blue; }'
        })

        expect(result).toEqual({
          slides: [
            {
              html: '<h1>Test Slide</h1>',
              css: '.slide-0 .slide { color: red; }'
            }
          ],
          globalCSS: '.global { background: blue; }'
        })
      })

      it('should handle multiple slides with different content types', () => {
        const document: Document = {
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
                    children: [{ type: 'text', value: 'Slide 1' }]
                  }
                ]
              },
              slideCSS: '.slide1 { color: red; }'
            },
            {
              type: 'curtains-slide',
              index: 1,
              ast: {
                type: 'root',
                children: [
                  {
                    type: 'paragraph',
                    children: [{ type: 'text', value: 'Paragraph content' }]
                  },
                  {
                    type: 'list',
                    children: [
                      {
                        type: 'listItem',
                        children: [
                          {
                            type: 'paragraph',
                            children: [{ type: 'text', value: 'List item' }]
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              slideCSS: '.slide2 { background: yellow; }'
            }
          ],
          globalCSS: '.global { font-family: Arial; }'
        }

        const mockZodTransformed: ZodTransformedDocument = {
          slides: [
            {
              html: '<h1>Slide 1</h1>',
              css: '.slide-0 .slide1 { color: red; }'
            },
            {
              html: '<p>Paragraph content</p><ul><li>List item</li></ul>',
              css: '.slide-1 .slide2 { background: yellow; }'
            }
          ],
          globalCSS: '.global { font-family: Arial; }'
        }

        mockZodTransform.mockReturnValue(mockZodTransformed)

        const result = transformer.transform(document)

        expect(result.slides).toHaveLength(2)
        expect(result.slides[0]?.html).toBe('<h1>Slide 1</h1>')
        expect(result.slides[0]?.css).toBe('.slide-0 .slide1 { color: red; }')
        expect(result.slides[1]?.html).toBe('<p>Paragraph content</p><ul><li>List item</li></ul>')
        expect(result.slides[1]?.css).toBe('.slide-1 .slide2 { background: yellow; }')
        expect(result.globalCSS).toBe('.global { font-family: Arial; }')
      })

      it('should handle complex AST structures with nested elements', () => {
        const document: Document = {
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
                    depth: 2,
                    children: [{ type: 'text', value: 'Complex Slide' }]
                  },
                  {
                    type: 'paragraph',
                    children: [
                      { type: 'text', value: 'Text with ' },
                      { type: 'text', value: 'bold', bold: true },
                      { type: 'text', value: ' and ' },
                      { type: 'text', value: 'italic', italic: true },
                      { type: 'text', value: ' formatting.' }
                    ]
                  },
                  {
                    type: 'container',
                    classes: ['highlight', 'center'],
                    children: [
                      {
                        type: 'paragraph',
                        children: [{ type: 'text', value: 'Container content' }]
                      }
                    ]
                  },
                  {
                    type: 'code',
                    value: 'console.log("Hello World");',
                    lang: 'javascript'
                  }
                ]
              },
              slideCSS: '.complex { border: 1px solid black; }'
            }
          ],
          globalCSS: ''
        }

        const mockZodTransformed: ZodTransformedDocument = {
          slides: [
            {
              html: '<h2>Complex Slide</h2><p>Text with <strong>bold</strong> and <em>italic</em> formatting.</p><div class="highlight center"><p>Container content</p></div><pre><code class="language-javascript">console.log("Hello World");</code></pre>',
              css: '.slide-0 .complex { border: 1px solid black; }'
            }
          ],
          globalCSS: ''
        }

        mockZodTransform.mockReturnValue(mockZodTransformed)

        const result = transformer.transform(document)

        expect(result.slides[0]?.html).toContain('<h2>Complex Slide</h2>')
        expect(result.slides[0]?.html).toContain('<strong>bold</strong>')
        expect(result.slides[0]?.html).toContain('<em>italic</em>')
        expect(result.slides[0]?.html).toContain('<div class="highlight center">')
        expect(result.slides[0]?.html).toContain('<code class="language-javascript">')
      })

      it('should handle documents with empty slides', () => {
        const document: Document = {
          type: 'curtains-document',
          version: '0.1',
          slides: [
            {
              type: 'curtains-slide',
              index: 0,
              ast: {
                type: 'root',
                children: []
              },
              slideCSS: ''
            }
          ],
          globalCSS: ''
        }

        const mockZodTransformed: ZodTransformedDocument = {
          slides: [
            {
              html: '',
              css: ''
            }
          ],
          globalCSS: ''
        }

        mockZodTransform.mockReturnValue(mockZodTransformed)

        const result = transformer.transform(document)

        expect(result.slides).toHaveLength(1)
        expect(result.slides[0]?.html).toBe('')
        expect(result.slides[0]?.css).toBe('')
        expect(result.globalCSS).toBe('')
      })

      it('should wrap Zod transform errors as clean TransformError', () => {
        const document: Document = {
          type: 'curtains-document',
          version: '0.1',
          slides: [],
          globalCSS: ''
        }

        const zodError = new Error('Zod transformation failed')
        mockZodTransform.mockImplementation(() => {
          throw zodError
        })

        expect(() => transformer.transform(document)).toThrow()

        try {
          transformer.transform(document)
        } catch (error) {
          const transformError = error as TransformError
          expect(transformError.code).toBe('TRANSFORM_ERROR')
          expect(transformError.phase).toBe('transform')
          expect(transformError.context).toBe(zodError)
          expect(transformError.message).toBe('Zod transformation failed')
        }
      })

      it('should handle non-Error objects thrown by Zod transformer', () => {
        const document: Document = {
          type: 'curtains-document',
          version: '0.1',
          slides: [],
          globalCSS: ''
        }

        const stringError = 'String error message'
        mockZodTransform.mockImplementation(() => {
          throw stringError
        })

        try {
          transformer.transform(document)
        } catch (error) {
          const transformError = error as TransformError
          expect(transformError.code).toBe('TRANSFORM_ERROR')
          expect(transformError.phase).toBe('transform')
          expect(transformError.context).toBe(stringError)
          expect(transformError.message).toBe('String error message')
        }
      })

      it('should handle unknown error types', () => {
        const document: Document = {
          type: 'curtains-document',
          version: '0.1',
          slides: [],
          globalCSS: ''
        }

        const unknownError = { foo: 'bar', nested: { value: 123 } }
        mockZodTransform.mockImplementation(() => {
          throw unknownError
        })

        try {
          transformer.transform(document)
        } catch (error) {
          const transformError = error as TransformError
          expect(transformError.code).toBe('TRANSFORM_ERROR')
          expect(transformError.phase).toBe('transform')
          expect(transformError.context).toBe(unknownError)
          expect(transformError.message).toBe('[object Object]')
        }
      })
    })
  })

  describe('createTransformer function', () => {
    it('should return a CurtainsTransformer instance', () => {
      const transformer = createTransformer()
      expect(transformer).toBeInstanceOf(CurtainsTransformer)
    })

    it('should return a transformer that implements DocumentTransformer interface', () => {
      const transformer = createTransformer()
      expect(typeof transformer.transform).toBe('function')
    })

    it('should create independent transformer instances', () => {
      const transformer1 = createTransformer()
      const transformer2 = createTransformer()
      expect(transformer1).not.toBe(transformer2)
    })
  })

  describe('transformDocument function', () => {
    it('should transform document using clean API', () => {
      const document: Document = {
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
                  children: [{ type: 'text', value: 'Test' }]
                }
              ]
            },
            slideCSS: ''
          }
        ],
        globalCSS: ''
      }

      const mockZodTransformed: ZodTransformedDocument = {
        slides: [
          {
            html: '<h1>Test</h1>',
            css: ''
          }
        ],
        globalCSS: ''
      }

      mockZodTransform.mockReturnValue(mockZodTransformed)

      const result = transformDocument(document)

      expect(mockZodTransform).toHaveBeenCalledWith({
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
                  children: [{ type: 'text', value: 'Test' }]
                }
              ]
            },
            slideCSS: ''
          }
        ],
        globalCSS: ''
      })
      expect(result.slides[0]?.html).toBe('<h1>Test</h1>')
    })

    it('should propagate transformation errors from the underlying transformer', () => {
      const document: Document = {
        type: 'curtains-document',
        version: '0.1',
        slides: [],
        globalCSS: ''
      }

      const zodError = new Error('Invalid document structure')
      mockZodTransform.mockImplementation(() => {
        throw zodError
      })

      expect(() => transformDocument(document)).toThrow()

      try {
        transformDocument(document)
      } catch (error) {
        const transformError = error as TransformError
        expect(transformError.code).toBe('TRANSFORM_ERROR')
        expect(transformError.phase).toBe('transform')
        expect(transformError.context).toBe(zodError)
        expect(transformError.message).toBe('Invalid document structure')
      }
    })
  })

  describe('canTransform function', () => {
    it('should return true for valid document that can be transformed', () => {
      const document: Document = {
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
                  children: [{ type: 'text', value: 'Valid slide' }]
                }
              ]
            },
            slideCSS: ''
          }
        ],
        globalCSS: ''
      }

      const mockZodTransformed: ZodTransformedDocument = {
        slides: [
          {
            html: '<h1>Valid slide</h1>',
            css: ''
          }
        ],
        globalCSS: ''
      }

      mockZodTransform.mockReturnValue(mockZodTransformed)

      expect(canTransform(document)).toBe(true)
    })

    it('should return false for document that throws transformation error', () => {
      const document: Document = {
        type: 'curtains-document',
        version: '0.1',
        slides: [],
        globalCSS: ''
      }

      mockZodTransform.mockImplementation(() => {
        throw new Error('Transform error')
      })

      expect(canTransform(document)).toBe(false)
    })

    it('should handle various error types gracefully', () => {
      const document: Document = {
        type: 'curtains-document',
        version: '0.1',
        slides: [],
        globalCSS: ''
      }

      // Test with Error object
      mockZodTransform.mockImplementationOnce(() => {
        throw new Error('Transform failed')
      })
      expect(canTransform(document)).toBe(false)

      // Test with string error
      mockZodTransform.mockImplementationOnce(() => {
        throw 'String error'
      })
      expect(canTransform(document)).toBe(false)

      // Test with object error
      mockZodTransform.mockImplementationOnce(() => {
        throw { error: 'Object error' }
      })
      expect(canTransform(document)).toBe(false)
    })

    it('should not throw even when transformDocument would throw', () => {
      const document: Document = {
        type: 'curtains-document',
        version: '0.1',
        slides: [],
        globalCSS: ''
      }

      mockZodTransform.mockImplementation(() => {
        throw new Error('Critical transform error')
      })

      // Should not throw, should return false
      expect(() => canTransform(document)).not.toThrow()
      expect(canTransform(document)).toBe(false)
    })
  })

  describe('Error handling and edge cases', () => {
    it('should preserve original error context in TransformError', () => {
      const document: Document = {
        type: 'curtains-document',
        version: '0.1',
        slides: [],
        globalCSS: ''
      }

      const originalError = new Error('Original message')
      originalError.stack = 'original stack trace'
      
      mockZodTransform.mockImplementation(() => {
        throw originalError
      })

      try {
        transformDocument(document)
      } catch (error) {
        const transformError = error as TransformError
        expect(transformError.context).toBe(originalError)
        expect(transformError.message).toBe('Original message')
      }
    })

    it('should handle documents with large number of slides', () => {
      const slides = Array.from({ length: 100 }, (_, i) => ({
        type: 'curtains-slide' as const,
        index: i,
        ast: {
          type: 'root' as const,
          children: [
            {
              type: 'heading' as const,
              depth: 1,
              children: [{ type: 'text' as const, value: `Slide ${i + 1}` }]
            }
          ]
        },
        slideCSS: `.slide-${i} { color: blue; }`
      }))

      const document: Document = {
        type: 'curtains-document',
        version: '0.1',
        slides,
        globalCSS: '.global { font-size: 16px; }'
      }

      const mockZodTransformed: ZodTransformedDocument = {
        slides: slides.map((_, i) => ({
          html: `<h1>Slide ${i + 1}</h1>`,
          css: `.slide-${i} .slide-${i} { color: blue; }`
        })),
        globalCSS: '.global { font-size: 16px; }'
      }

      mockZodTransform.mockReturnValue(mockZodTransformed)

      expect(() => transformDocument(document)).not.toThrow()
      const result = transformDocument(document)
      expect(result.slides).toHaveLength(100)
      expect(canTransform(document)).toBe(true)
    })

    it('should handle documents with complex nested structures', () => {
      const document: Document = {
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
                  classes: ['outer'],
                  children: [
                    {
                      type: 'container',
                      classes: ['inner'],
                      children: [
                        {
                          type: 'heading',
                          depth: 3,
                          children: [{ type: 'text', value: 'Nested heading' }]
                        },
                        {
                          type: 'paragraph',
                          children: [
                            { type: 'text', value: 'Text with ' },
                            {
                              type: 'link',
                              url: 'https://example.com',
                              children: [{ type: 'text', value: 'link' }]
                            },
                            { type: 'text', value: ' inside nested containers.' }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            slideCSS: '.nested { margin: 10px; }'
          }
        ],
        globalCSS: ''
      }

      const mockZodTransformed: ZodTransformedDocument = {
        slides: [
          {
            html: '<div class="outer"><div class="inner"><h3>Nested heading</h3><p>Text with <a href="https://example.com">link</a> inside nested containers.</p></div></div>',
            css: '.slide-0 .nested { margin: 10px; }'
          }
        ],
        globalCSS: ''
      }

      mockZodTransform.mockReturnValue(mockZodTransformed)

      const result = transformDocument(document)
      expect(result.slides[0]?.html).toContain('<div class="outer">')
      expect(result.slides[0]?.html).toContain('<div class="inner">')
      expect(result.slides[0]?.html).toContain('<h3>Nested heading</h3>')
      expect(result.slides[0]?.html).toContain('<a href="https://example.com">link</a>')
    })
  })

  describe('Integration with DocumentTransformer interface', () => {
    it('should properly implement DocumentTransformer interface', () => {
      const transformer: DocumentTransformer = createTransformer()
      
      expect(typeof transformer.transform).toBe('function')
      
      // Test that it can be used through the interface
      const document: Document = {
        type: 'curtains-document',
        version: '0.1',
        slides: [],
        globalCSS: ''
      }

      const mockZodTransformed: ZodTransformedDocument = {
        slides: [],
        globalCSS: ''
      }

      mockZodTransform.mockReturnValue(mockZodTransformed)

      const result = transformer.transform(document)
      expect(result.slides).toEqual([])
      expect(result.globalCSS).toBe('')
    })

    it('should work with custom transformer implementations', () => {
      class CustomTransformer implements DocumentTransformer {
        transform(document: Document): TransformedDocument {
          return {
            slides: document.slides.map(() => ({
              html: '<div>Custom HTML</div>',
              css: '.custom { color: green; }'
            })),
            globalCSS: document.globalCSS
          }
        }
      }

      const customTransformer = new CustomTransformer()
      
      const document: Document = {
        type: 'curtains-document',
        version: '0.1',
        slides: [
          {
            type: 'curtains-slide',
            index: 0,
            ast: {
              type: 'root',
              children: []
            },
            slideCSS: ''
          }
        ],
        globalCSS: '.global-custom { background: purple; }'
      }

      const result = customTransformer.transform(document)
      expect(result.slides).toHaveLength(1)
      expect(result.slides[0]?.html).toBe('<div>Custom HTML</div>')
      expect(result.slides[0]?.css).toBe('.custom { color: green; }')
      expect(result.globalCSS).toBe('.global-custom { background: purple; }')
    })
  })
})