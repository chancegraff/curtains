// Parser Abstraction Layer Tests
// Comprehensive tests for the parser abstraction that wraps Zod implementation

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  CurtainsParser,
  createParser,
  parseContent,
  isValidContent
} from './parser.js'
import type { Document, ParseError, MarkdownParser } from './interfaces.js'
import * as zodParser from '../parser/index.js'
import type { CurtainsDocument } from '../ast/types.js'

// Mock the underlying Zod parser
vi.mock('../parser/index.js', () => ({
  parse: vi.fn()
}))

const mockZodParse = vi.mocked(zodParser.parse)

describe('Parser Abstraction Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('CurtainsParser class', () => {
    let parser: CurtainsParser

    beforeEach(() => {
      parser = new CurtainsParser()
    })

    describe('parse method', () => {
      it('should parse valid content and return clean Document interface', () => {
        const content = '===\n# Test Slide\nContent here.'
        const mockZodDocument: CurtainsDocument = {
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
                  },
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        value: 'Content here.'
                      }
                    ]
                  }
                ]
              },
              slideCSS: ''
            }
          ],
          globalCSS: ''
        }

        mockZodParse.mockReturnValue(mockZodDocument)

        const result = parser.parse(content)

        expect(mockZodParse).toHaveBeenCalledWith(content)
        expect(result).toEqual({
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
                  },
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        value: 'Content here.'
                      }
                    ]
                  }
                ]
              },
              slideCSS: ''
            }
          ],
          globalCSS: ''
        })
      })

      it('should handle multiple slides with complex AST structures', () => {
        const content = '===\n# Slide 1\n===\n# Slide 2'
        const mockZodDocument: CurtainsDocument = {
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
              slideCSS: ''
            },
            {
              type: 'curtains-slide',
              index: 1,
              ast: {
                type: 'root',
                children: [
                  {
                    type: 'heading',
                    depth: 1,
                    children: [{ type: 'text', value: 'Slide 2' }]
                  }
                ]
              },
              slideCSS: 'custom-css'
            }
          ],
          globalCSS: 'global-styles'
        }

        mockZodParse.mockReturnValue(mockZodDocument)

        const result = parser.parse(content)

        expect(result.slides).toHaveLength(2)
        expect(result.slides[0]?.index).toBe(0)
        expect(result.slides[1]?.index).toBe(1)
        expect(result.slides[1]?.slideCSS).toBe('custom-css')
        expect(result.globalCSS).toBe('global-styles')
      })

      it('should handle content with different node types', () => {
        const content = '===\n# Heading\n**bold** *italic*\n- List item\n[Link](url)'
        const mockZodDocument: CurtainsDocument = {
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
                    children: [{ type: 'text', value: 'Heading' }]
                  },
                  {
                    type: 'paragraph',
                    children: [
                      { type: 'text', value: 'bold', bold: true },
                      { type: 'text', value: ' ' },
                      { type: 'text', value: 'italic', italic: true }
                    ]
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
                  },
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'link',
                        url: 'url',
                        children: [{ type: 'text', value: 'Link' }]
                      }
                    ]
                  }
                ]
              },
              slideCSS: ''
            }
          ],
          globalCSS: ''
        }

        mockZodParse.mockReturnValue(mockZodDocument)

        const result = parser.parse(content)

        expect(result.slides[0]?.ast.children).toHaveLength(4)
        expect(result.slides[0]?.ast.children[0]?.type).toBe('heading')
        expect(result.slides[0]?.ast.children[1]?.type).toBe('paragraph')
        expect(result.slides[0]?.ast.children[2]?.type).toBe('list')
        expect(result.slides[0]?.ast.children[3]?.type).toBe('paragraph')
      })

      it('should wrap Zod parse errors as clean ParseError', () => {
        const content = 'invalid content'
        const zodError = new Error('Zod validation failed')
        mockZodParse.mockImplementation(() => {
          throw zodError
        })

        expect(() => parser.parse(content)).toThrow()

        try {
          parser.parse(content)
        } catch (error) {
          const parseError = error as ParseError
          expect(parseError.code).toBe('PARSE_ERROR')
          expect(parseError.phase).toBe('parse')
          expect(parseError.context).toBe(zodError)
          expect(parseError.message).toBe('Zod validation failed')
        }
      })

      it('should handle non-Error objects thrown by Zod parser', () => {
        const content = 'invalid content'
        const stringError = 'String error message'
        mockZodParse.mockImplementation(() => {
          throw stringError
        })

        try {
          parser.parse(content)
        } catch (error) {
          const parseError = error as ParseError
          expect(parseError.code).toBe('PARSE_ERROR')
          expect(parseError.phase).toBe('parse')
          expect(parseError.context).toBe(stringError)
          expect(parseError.message).toBe('String error message')
        }
      })

      it('should handle unknown error types', () => {
        const content = 'invalid content'
        const unknownError = { foo: 'bar' }
        mockZodParse.mockImplementation(() => {
          throw unknownError
        })

        try {
          parser.parse(content)
        } catch (error) {
          const parseError = error as ParseError
          expect(parseError.code).toBe('PARSE_ERROR')
          expect(parseError.phase).toBe('parse')
          expect(parseError.context).toBe(unknownError)
          expect(parseError.message).toBe('[object Object]')
        }
      })
    })

    describe('supports method', () => {
      it('should return true for curtains format', () => {
        expect(parser.supports('curtains')).toBe(true)
      })

      it('should return true for .curtain extension', () => {
        expect(parser.supports('.curtain')).toBe(true)
      })

      it('should return false for unsupported formats', () => {
        expect(parser.supports('markdown')).toBe(false)
        expect(parser.supports('.md')).toBe(false)
        expect(parser.supports('html')).toBe(false)
        expect(parser.supports('')).toBe(false)
        expect(parser.supports('unknown')).toBe(false)
      })

      it('should be case sensitive', () => {
        expect(parser.supports('CURTAINS')).toBe(false)
        expect(parser.supports('.CURTAIN')).toBe(false)
        expect(parser.supports('Curtains')).toBe(false)
      })
    })
  })

  describe('createParser function', () => {
    it('should return a CurtainsParser instance', () => {
      const parser = createParser()
      expect(parser).toBeInstanceOf(CurtainsParser)
    })

    it('should return a parser that implements MarkdownParser interface', () => {
      const parser = createParser()
      expect(typeof parser.parse).toBe('function')
      expect(typeof parser.supports).toBe('function')
    })

    it('should create independent parser instances', () => {
      const parser1 = createParser()
      const parser2 = createParser()
      expect(parser1).not.toBe(parser2)
    })
  })

  describe('parseContent function', () => {
    it('should parse content with default format', () => {
      const content = '===\n# Test'
      const mockZodDocument: CurtainsDocument = {
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

      mockZodParse.mockReturnValue(mockZodDocument)

      const result = parseContent(content)

      expect(mockZodParse).toHaveBeenCalledWith(content)
      expect(result.type).toBe('curtains-document')
    })

    it('should parse content with explicit curtains format', () => {
      const content = '===\n# Test'
      const mockZodDocument: CurtainsDocument = {
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

      mockZodParse.mockReturnValue(mockZodDocument)

      const result = parseContent(content, 'curtains')

      expect(result.type).toBe('curtains-document')
    })

    it('should parse content with .curtain format', () => {
      const content = '===\n# Test'
      const mockZodDocument: CurtainsDocument = {
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

      mockZodParse.mockReturnValue(mockZodDocument)

      const result = parseContent(content, '.curtain')

      expect(result.type).toBe('curtains-document')
    })

    it('should throw ParseError for unsupported format', () => {
      const content = '# Markdown content'

      expect(() => parseContent(content, 'markdown')).toThrow()

      try {
        parseContent(content, 'markdown')
      } catch (error) {
        const parseError = error as ParseError
        expect(parseError.code).toBe('PARSE_ERROR')
        expect(parseError.phase).toBe('parse')
        expect(parseError.message).toBe('Unsupported format: markdown')
        expect(parseError.context).toEqual({
          format: 'markdown',
          supportedFormats: ['curtains', '.curtain']
        })
      }
    })

    it('should throw ParseError for various unsupported formats', () => {
      const testFormats = ['html', '.md', 'text', 'xml', '']

      testFormats.forEach(format => {
        expect(() => parseContent('content', format)).toThrow(`Unsupported format: ${format}`)
      })
    })

    it('should propagate parsing errors from the underlying parser', () => {
      const content = 'invalid'
      const zodError = new Error('Invalid slide structure')
      mockZodParse.mockImplementation(() => {
        throw zodError
      })

      expect(() => parseContent(content, 'curtains')).toThrow()

      try {
        parseContent(content, 'curtains')
      } catch (error) {
        const parseError = error as ParseError
        expect(parseError.code).toBe('PARSE_ERROR')
        expect(parseError.phase).toBe('parse')
        expect(parseError.context).toBe(zodError)
        expect(parseError.message).toBe('Invalid slide structure')
      }
    })
  })

  describe('isValidContent function', () => {
    it('should return true for valid content', () => {
      const content = '===\n# Valid slide'
      const mockZodDocument: CurtainsDocument = {
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

      mockZodParse.mockReturnValue(mockZodDocument)

      expect(isValidContent(content)).toBe(true)
    })

    it('should return false for invalid content that throws parsing error', () => {
      const content = 'invalid content'
      mockZodParse.mockImplementation(() => {
        throw new Error('Parse error')
      })

      expect(isValidContent(content)).toBe(false)
    })

    it('should return false for content that causes format error', () => {
      // This would fail during format checking before even reaching the parser
      // But since isValidContent uses parseContent with default format,
      // it should work for curtains format
      const content = 'some content'
      mockZodParse.mockImplementation(() => {
        throw new Error('Parse error')
      })

      expect(isValidContent(content)).toBe(false)
    })

    it('should handle various error types gracefully', () => {
      const content = 'error content'

      // Test with Error object
      mockZodParse.mockImplementationOnce(() => {
        throw new Error('Parse failed')
      })
      expect(isValidContent(content)).toBe(false)

      // Test with string error
      mockZodParse.mockImplementationOnce(() => {
        throw 'String error'
      })
      expect(isValidContent(content)).toBe(false)

      // Test with object error
      mockZodParse.mockImplementationOnce(() => {
        throw { error: 'Object error' }
      })
      expect(isValidContent(content)).toBe(false)
    })

    it('should not throw even when parseContent would throw', () => {
      const content = 'invalid'
      mockZodParse.mockImplementation(() => {
        throw new Error('Critical parse error')
      })

      // Should not throw, should return false
      expect(() => isValidContent(content)).not.toThrow()
      expect(isValidContent(content)).toBe(false)
    })
  })

  describe('Error handling and edge cases', () => {
    it('should preserve original error context in ParseError', () => {
      const content = 'invalid'
      const originalError = new Error('Original message')
      originalError.stack = 'original stack trace'
      
      mockZodParse.mockImplementation(() => {
        throw originalError
      })

      try {
        parseContent(content)
      } catch (error) {
        const parseError = error as ParseError
        expect(parseError.context).toBe(originalError)
        expect(parseError.message).toBe('Original message')
      }
    })

    it('should handle empty string content', () => {
      mockZodParse.mockImplementation(() => {
        throw new Error('Empty content error')
      })

      expect(() => parseContent('')).toThrow()
      expect(isValidContent('')).toBe(false)
    })

    it('should handle whitespace-only content', () => {
      mockZodParse.mockImplementation(() => {
        throw new Error('Whitespace only error')
      })

      expect(() => parseContent('   \n\t  ')).toThrow()
      expect(isValidContent('   \n\t  ')).toBe(false)
    })

    it('should handle very large content', () => {
      const largeContent = '===\n# Large slide\n' + 'Content '.repeat(10000)
      const mockZodDocument: CurtainsDocument = {
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
                  children: [{ type: 'text', value: 'Large slide' }]
                }
              ]
            },
            slideCSS: ''
          }
        ],
        globalCSS: ''
      }

      mockZodParse.mockReturnValue(mockZodDocument)

      expect(() => parseContent(largeContent)).not.toThrow()
      expect(isValidContent(largeContent)).toBe(true)
    })
  })

  describe('Integration with MarkdownParser interface', () => {
    it('should properly implement MarkdownParser interface', () => {
      const parser: MarkdownParser = createParser()
      
      expect(typeof parser.parse).toBe('function')
      expect(typeof parser.supports).toBe('function')
      
      // Test that it can be used through the interface
      expect(parser.supports('curtains')).toBe(true)
      expect(parser.supports('markdown')).toBe(false)
    })

    it('should work with custom parser implementations', () => {
      class CustomParser implements MarkdownParser {
        parse(_content: string): Document {
          return {
            type: 'curtains-document',
            version: '0.1',
            slides: [],
            globalCSS: ''
          }
        }

        supports(format: string): boolean {
          return format === 'custom'
        }
      }

      const customParser = new CustomParser()
      expect(customParser.supports('custom')).toBe(true)
      expect(customParser.supports('curtains')).toBe(false)
      
      const doc = customParser.parse('test')
      expect(doc.type).toBe('curtains-document')
      expect(doc.slides).toEqual([])
    })
  })
})