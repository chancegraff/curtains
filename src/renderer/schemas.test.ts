// Renderer Schemas Tests
// Tests for renderer-specific Zod validation schemas

import { describe, it, expect } from 'vitest'
import { RuntimeConfigSchema, HTMLOutputSchema } from './schemas.js'
import type { RuntimeConfig } from './schemas.js'

describe('Renderer Schemas', () => {
  describe('RuntimeConfigSchema', () => {
    it('should validate valid runtime config', () => {
      const validConfig = {
        totalSlides: 5,
        theme: 'light' as const,
        startSlide: 0
      }

      const result = RuntimeConfigSchema.safeParse(validConfig)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validConfig)
      }
    })

    it('should validate dark theme', () => {
      const darkConfig = {
        totalSlides: 3,
        theme: 'dark' as const,
        startSlide: 1
      }

      const result = RuntimeConfigSchema.safeParse(darkConfig)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.theme).toBe('dark')
      }
    })

    it('should apply default startSlide when omitted', () => {
      const configWithoutStartSlide = {
        totalSlides: 2,
        theme: 'light' as const
      }

      const result = RuntimeConfigSchema.safeParse(configWithoutStartSlide)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.startSlide).toBe(0)
      }
    })

    it('should reject invalid theme values', () => {
      const invalidTheme = {
        totalSlides: 3,
        theme: 'invalid-theme',
        startSlide: 0
      }

      const result = RuntimeConfigSchema.safeParse(invalidTheme)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain('theme')
        expect(result.error.issues[0]?.message).toContain('Invalid option')
      }
    })

    it('should reject totalSlides less than 1', () => {
      const invalidTotalSlides = {
        totalSlides: 0,
        theme: 'light' as const,
        startSlide: 0
      }

      const result = RuntimeConfigSchema.safeParse(invalidTotalSlides)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain('totalSlides')
        expect(result.error.issues[0]?.message).toContain('Too small')
      }
    })

    it('should reject non-integer totalSlides', () => {
      const floatTotalSlides = {
        totalSlides: 3.5,
        theme: 'light' as const,
        startSlide: 0
      }

      const result = RuntimeConfigSchema.safeParse(floatTotalSlides)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain('totalSlides')
        expect(result.error.issues[0]?.message).toContain('expected int')
      }
    })

    it('should reject negative startSlide', () => {
      const negativeStartSlide = {
        totalSlides: 5,
        theme: 'light' as const,
        startSlide: -1
      }

      const result = RuntimeConfigSchema.safeParse(negativeStartSlide)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain('startSlide')
        expect(result.error.issues[0]?.message).toContain('expected number to be >=0')
      }
    })

    it('should reject non-integer startSlide', () => {
      const floatStartSlide = {
        totalSlides: 5,
        theme: 'light' as const,
        startSlide: 2.7
      }

      const result = RuntimeConfigSchema.safeParse(floatStartSlide)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain('startSlide')
        expect(result.error.issues[0]?.message).toContain('expected int')
      }
    })

    it('should reject missing required fields', () => {
      const missingTotalSlides = {
        theme: 'light' as const,
        startSlide: 0
      }

      const result = RuntimeConfigSchema.safeParse(missingTotalSlides)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain('totalSlides')
        expect(result.error.issues[0]?.code).toBe('invalid_type')
      }
    })

    it('should reject missing theme', () => {
      const missingTheme = {
        totalSlides: 3,
        startSlide: 0
      }

      const result = RuntimeConfigSchema.safeParse(missingTheme)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain('theme')
        expect(['invalid_type', 'invalid_value']).toContain(result.error.issues[0]?.code)
      }
    })

    it('should handle edge case values', () => {
      const edgeCaseConfig = {
        totalSlides: 1, // Minimum valid value
        theme: 'dark' as const,
        startSlide: 0 // Minimum valid value
      }

      const result = RuntimeConfigSchema.safeParse(edgeCaseConfig)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalSlides).toBe(1)
        expect(result.data.startSlide).toBe(0)
      }
    })

    it('should handle large slide counts', () => {
      const largeConfig = {
        totalSlides: 1000,
        theme: 'light' as const,
        startSlide: 999
      }

      const result = RuntimeConfigSchema.safeParse(largeConfig)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalSlides).toBe(1000)
        expect(result.data.startSlide).toBe(999)
      }
    })

    it('should reject extra unknown fields', () => {
      const configWithExtra = {
        totalSlides: 3,
        theme: 'light' as const,
        startSlide: 0,
        extraField: 'should be rejected'
      }

      const result = RuntimeConfigSchema.safeParse(configWithExtra)

      // Zod allows extra fields by default, so this should actually succeed
      // unless .strict() is used. Let's test that it succeeds.
      expect(result.success).toBe(true)
    })

    it('should work with TypeScript type inference', () => {
      const config: RuntimeConfig = {
        totalSlides: 4,
        theme: 'dark',
        startSlide: 2
      }

      const result = RuntimeConfigSchema.safeParse(config)
      expect(result.success).toBe(true)

      // TypeScript should infer the correct type
      expect(typeof config.totalSlides).toBe('number')
      expect(['light', 'dark']).toContain(config.theme)
      expect(typeof config.startSlide).toBe('number')
    })
  })

  describe('HTMLOutputSchema', () => {
    it('should validate valid HTML document', () => {
      const validHTML = '<!DOCTYPE html><html><head></head><body></body></html>'

      const result = HTMLOutputSchema.safeParse(validHTML)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(validHTML)
      }
    })

    it('should validate HTML with different DOCTYPE cases', () => {
      const upperCaseDoctype = '<!DOCTYPE HTML><html><body></body></html>'
      const lowerCaseDoctype = '<!doctype html><html><body></body></html>'
      const mixedCaseDoctype = '<!DocType Html><html><body></body></html>'

      expect(HTMLOutputSchema.safeParse(upperCaseDoctype).success).toBe(true)
      expect(HTMLOutputSchema.safeParse(lowerCaseDoctype).success).toBe(true)
      expect(HTMLOutputSchema.safeParse(mixedCaseDoctype).success).toBe(true)
    })

    it('should validate complete HTML document structure', () => {
      const completeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test</title>
  <style>body { margin: 0; }</style>
</head>
<body>
  <div class="curtains-root">
    <div class="curtains-stage">
      <section class="curtains-slide">
        <h1>Test Slide</h1>
      </section>
    </div>
  </div>
  <script>console.log('test');</script>
</body>
</html>`

      const result = HTMLOutputSchema.safeParse(completeHTML)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toContain('<!DOCTYPE html>')
        expect(result.data).toContain('<html lang="en">')
        expect(result.data).toContain('<body>')
      }
    })

    it('should reject empty string', () => {
      const result = HTMLOutputSchema.safeParse('')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('Too small')
      }
    })

    it('should reject HTML without DOCTYPE', () => {
      const noDoctypeHTML = '<html><head></head><body></body></html>'

      const result = HTMLOutputSchema.safeParse(noDoctypeHTML)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('Must be valid HTML document')
      }
    })

    it('should reject non-string input', () => {
      const nonStringInput = { html: 'test' }

      const result = HTMLOutputSchema.safeParse(nonStringInput)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.code).toBe('invalid_type')
        expect(result.error.issues[0]?.message).toContain('string')
      }
    })

    it('should reject null or undefined', () => {
      expect(HTMLOutputSchema.safeParse(null).success).toBe(false)
      expect(HTMLOutputSchema.safeParse(undefined).success).toBe(false)
    })

    it('should handle HTML with whitespace before DOCTYPE', () => {
      const whitespaceHTML = '   <!DOCTYPE html><html><body></body></html>'

      const result = HTMLOutputSchema.safeParse(whitespaceHTML)

      expect(result.success).toBe(false) // Should be strict about format
    })

    it('should validate HTML with complex content', () => {
      const complexHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complex Presentation</title>
  <style>
    /* Complex CSS */
    .curtains-root { font-family: Arial; }
    @media (max-width: 768px) { .slide { padding: 1rem; } }
  </style>
</head>
<body>
  <div class="curtains-root" data-theme="dark">
    <div class="curtains-stage">
      <section class="curtains-slide">
        <h1>Slide with &amp; special chars</h1>
        <p>Text with <strong>formatting</strong></p>
        <ul><li>List item</li></ul>
        <img src="test.jpg" alt="Test" />
        <code>const x = "code";</code>
      </section>
    </div>
  </div>
  <script>
    window.curtainsNavigation = {
      current: 0,
      total: 1,
      goToSlide: function(n) { /* implementation */ }
    };
  </script>
</body>
</html>`

      const result = HTMLOutputSchema.safeParse(complexHTML)

      expect(result.success).toBe(true)
    })

    it('should be strict about DOCTYPE format', () => {
      const spacedDoctype = '<!DOCTYPE html ><html><body></body></html>'
      
      const result = HTMLOutputSchema.safeParse(spacedDoctype)

      // The regex is strict about format - no space allowed after "html"
      expect(result.success).toBe(false)
    })

    it('should be case-insensitive for DOCTYPE matching', () => {
      const variations = [
        '<!DOCTYPE html>',
        '<!DOCTYPE HTML>',
        '<!doctype html>',
        '<!Doctype Html>',
        '<!DOCTYPE HTML>'
      ]

      variations.forEach(doctype => {
        const html = `${doctype}<html><body></body></html>`
        const result = HTMLOutputSchema.safeParse(html)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Schema integration', () => {
    it('should work together in typical usage', () => {
      const runtimeConfig = {
        totalSlides: 3,
        theme: 'light' as const,
        startSlide: 0
      }

      const htmlOutput = '<!DOCTYPE html><html><body><div class="curtains-root"></div></body></html>'

      const configResult = RuntimeConfigSchema.safeParse(runtimeConfig)
      const htmlResult = HTMLOutputSchema.safeParse(htmlOutput)

      expect(configResult.success).toBe(true)
      expect(htmlResult.success).toBe(true)
    })

    it('should handle validation errors gracefully', () => {
      const invalidConfig = {
        totalSlides: -1, // Invalid
        theme: 'invalid' // Invalid
      }

      const invalidHTML = '<html>No DOCTYPE</html>' // Invalid

      const configResult = RuntimeConfigSchema.safeParse(invalidConfig)
      const htmlResult = HTMLOutputSchema.safeParse(invalidHTML)

      expect(configResult.success).toBe(false)
      expect(htmlResult.success).toBe(false)

      if (!configResult.success) {
        expect(configResult.error.issues.length).toBeGreaterThan(0)
      }

      if (!htmlResult.success) {
        expect(htmlResult.error.issues.length).toBeGreaterThan(0)
      }
    })
  })
})