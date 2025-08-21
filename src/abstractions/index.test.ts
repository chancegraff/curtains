// Abstraction Layer Tests
// Tests for the clean API that hides implementation details

import { parseContent, transformDocument, processContent, canProcessContent, getSupportedFormats } from './index.js'

describe('Abstraction Layer API', () => {
  describe('parseContent', () => {
    it('should parse valid curtains content', () => {
      const input = `
===
# Hello World
This is a test slide.
`
      
      const result = parseContent(input, 'curtains')
      
      expect(result.type).toBe('curtains-document')
      expect(result.version).toBe('0.1')
      expect(result.slides).toHaveLength(1)
      expect(result.slides[0]?.type).toBe('curtains-slide')
      expect(result.slides[0]?.index).toBe(0)
    })

    it('should throw ParseError for invalid content', () => {
      expect(() => parseContent('', 'curtains')).toThrow()
      expect(() => parseContent('invalid content', 'curtains')).toThrow()
    })

    it('should throw ParseError for unsupported format', () => {
      const input = '# Hello World'
      expect(() => parseContent(input, 'markdown')).toThrow('Unsupported format: markdown')
    })
  })

  describe('transformDocument', () => {
    it('should transform parsed document to HTML', () => {
      const input = `
===
# Hello World
This is a test slide.
`
      
      const document = parseContent(input, 'curtains')
      const result = transformDocument(document)
      
      expect(result.slides).toHaveLength(1)
      expect(result.slides[0]?.html).toContain('<h1>Hello World</h1>')
      expect(result.slides[0]?.html).toContain('<p>This is a test slide.</p>')
      expect(result.globalCSS).toBe('')
    })
  })

  describe('processContent', () => {
    it('should parse and transform in one step', () => {
      const input = `
===
# Hello World
This is a test slide.
`
      
      const result = processContent(input, 'curtains')
      
      expect(result.slides).toHaveLength(1)
      expect(result.slides[0]?.html).toContain('<h1>Hello World</h1>')
    })
  })

  describe('canProcessContent', () => {
    it('should return true for valid content', () => {
      const input = `
===
# Hello World
This is a test slide.
`
      
      expect(canProcessContent(input, 'curtains')).toBe(true)
    })

    it('should return false for invalid content', () => {
      expect(canProcessContent('', 'curtains')).toBe(false)
      expect(canProcessContent('invalid', 'curtains')).toBe(false)
    })
  })

  describe('getSupportedFormats', () => {
    it('should return supported formats', () => {
      const formats = getSupportedFormats()
      expect(formats).toContain('curtains')
      expect(formats).toContain('.curtain')
    })
  })

  describe('Error handling', () => {
    it('should provide clean error messages without exposing Zod', () => {
      try {
        parseContent('', 'curtains')
      } catch (error) {
        expect(error).toHaveProperty('code', 'PARSE_ERROR')
        expect(error).toHaveProperty('phase', 'parse')
        expect((error as Error).message).not.toContain('ZodError')
        expect((error as Error).message).not.toContain('schema')
      }
    })
  })
})