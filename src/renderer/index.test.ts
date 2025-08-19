// Renderer Tests
// Tests for Phase 4 implementation

import { describe, it, expect, beforeEach } from '@jest/globals'
import { render } from './index.js'
import type { TransformedDocument } from '../ast/types.js'
import type { BuildOptions } from '../config/types.js'

describe('Renderer', () => {
  let mockTransformedDoc: TransformedDocument
  let mockBuildOptions: BuildOptions

  beforeEach(() => {
    mockTransformedDoc = {
      slides: [
        {
          html: '<h1>Title Slide</h1><p>Welcome to my presentation</p>',
          css: '.special { color: blue; }'
        },
        {
          html: '<h2>Content Slide</h2><ul><li>Point 1</li><li>Point 2</li></ul>',
          css: '.highlight { background: yellow; }'
        }
      ],
      globalCSS: '.global-style { font-family: Arial; }'
    }

    mockBuildOptions = {
      input: 'test.curtain',
      output: 'test.html',
      theme: 'light' as const
    }
  })

  describe('render function', () => {
    it('should generate valid HTML document', async () => {
      const result = await render(mockTransformedDoc, mockBuildOptions)
      
      expect(result).toMatch(/^<!DOCTYPE html>/)
      expect(result).toContain('<html lang="en">')
      expect(result).toContain('</html>')
    })

    it('should include proper meta tags', async () => {
      const result = await render(mockTransformedDoc, mockBuildOptions)
      
      expect(result).toContain('<meta charset="UTF-8">')
      expect(result).toContain('<meta name="viewport"')
      expect(result).toContain('<meta name="description"')
      expect(result).toContain('<meta name="generator" content="Curtains Presentation Tool">')
    })

    it('should build HTML slide structure correctly', async () => {
      const result = await render(mockTransformedDoc, mockBuildOptions)
      
      // Check for slide sections
      expect(result).toContain('<section class="curtains-slide">')
      expect(result).toContain('<h1>Title Slide</h1>')
      expect(result).toContain('<h2>Content Slide</h2>')
      expect(result).toContain('<li>Point 1</li>')
      
      // Count slide sections
      const slideMatches = result.match(/<section class="curtains-slide">/g)
      expect(slideMatches).toHaveLength(2)
    })

    it('should merge CSS in correct order', async () => {
      const result = await render(mockTransformedDoc, mockBuildOptions)
      
      // Extract CSS content
      const cssMatch = result.match(/<style>([\s\S]*?)<\/style>/)
      expect(cssMatch).toBeTruthy()
      expect(cssMatch).toHaveLength(2) // Full match + capture group
      
      const css = cssMatch?.[1] ?? ''
      expect(css).toBeDefined()
      expect(typeof css).toBe('string')
      
      // Type assertion since we've verified it exists
      const cssContent = css as string
      
      // Check for proper order: base layout → theme variables → global → slide CSS
      const baseLayoutIndex = cssContent.indexOf('/* Base Layout Styles */')
      const themeVariablesIndex = cssContent.indexOf('/* Theme Variables and Base Styles */')
      const globalStylesIndex = cssContent.indexOf('/* Global User Styles */')
      const slideStylesIndex = cssContent.indexOf('/* Slide-specific Scoped Styles */')
      
      expect(baseLayoutIndex).toBeGreaterThan(-1)
      expect(themeVariablesIndex).toBeGreaterThan(baseLayoutIndex)
      expect(globalStylesIndex).toBeGreaterThan(themeVariablesIndex)
      expect(slideStylesIndex).toBeGreaterThan(globalStylesIndex)
      
      // Check for our custom styles
      expect(cssContent).toContain('.global-style { font-family: Arial; }')
      expect(cssContent).toContain('.special { color: blue; }')
      expect(cssContent).toContain('.highlight { background: yellow; }')
    })

    it('should inject proper template structure', async () => {
      const result = await render(mockTransformedDoc, mockBuildOptions)
      
      // Check core structure
      expect(result).toContain('<div class="curtains-root" data-theme="light">')
      expect(result).toContain('<div class="curtains-stage">')
      expect(result).toContain('<div class="curtains-counter">1/2</div>')
      
      // Check theme attribute matches options
      expect(result).toContain('data-theme="light"')
    })

    it('should embed runtime JavaScript', async () => {
      const result = await render(mockTransformedDoc, mockBuildOptions)
      
      // Check for script tag
      expect(result).toContain('<script>')
      expect(result).toContain('</script>')
      
      // Check for key navigation features
      expect(result).toContain('navigation')
      expect(result).toContain('ArrowRight')
      expect(result).toContain('ArrowLeft')
      expect(result).toContain('goToSlide')
      expect(result).toContain('updateCounter')
      expect(result).toContain('toggleFullscreen')
      expect(result).toContain('window.curtainsNavigation')
    })

    it('should handle dark theme', async () => {
      mockBuildOptions.theme = 'dark'
      
      const result = await render(mockTransformedDoc, mockBuildOptions)
      
      expect(result).toContain('data-theme="dark"')
    })

    it('should handle single slide', async () => {
      const firstSlide = mockTransformedDoc.slides[0]
      if (firstSlide) {
        mockTransformedDoc.slides = [firstSlide]
      }
      
      const result = await render(mockTransformedDoc, mockBuildOptions)
      
      expect(result).toContain('<div class="curtains-counter">1/1</div>')
      const slideMatches = result.match(/<section class="curtains-slide">/g)
      expect(slideMatches).toHaveLength(1)
    })

    it('should validate inputs with Zod', async () => {
      // Test invalid transformed document
      await expect(render({ invalid: 'data' }, mockBuildOptions))
        .rejects.toThrow()
      
      // Test invalid build options
      await expect(render(mockTransformedDoc, { invalid: 'options' }))
        .rejects.toThrow()
    })

    it('should validate HTML output', async () => {
      const result = await render(mockTransformedDoc, mockBuildOptions)
      
      // Should start with DOCTYPE
      expect(result).toMatch(/^<!DOCTYPE html>/)
      
      // Should be a single string (not undefined/null)
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(1000) // Substantial content
    })

    it('should handle empty global CSS', async () => {
      mockTransformedDoc.globalCSS = ''
      
      const result = await render(mockTransformedDoc, mockBuildOptions)
      
      // Should still render without errors
      expect(result).toContain('<!DOCTYPE html>')
      expect(result).toContain('<style>')
    })

    it('should handle slides with empty CSS', async () => {
      if (mockTransformedDoc.slides[0]) {
        mockTransformedDoc.slides[0].css = ''
      }
      if (mockTransformedDoc.slides[1]) {
        mockTransformedDoc.slides[1].css = ''
      }
      
      const result = await render(mockTransformedDoc, mockBuildOptions)
      
      // Should still render without errors
      expect(result).toContain('<!DOCTYPE html>')
      expect(result).toContain('<section class="curtains-slide">')
    })
  })

  describe('accessibility features', () => {
    it('should include proper accessibility attributes', async () => {
      const result = await render(mockTransformedDoc, mockBuildOptions)
      
      // Check for screen reader announcements
      expect(result).toContain('aria-live')
      expect(result).toContain('aria-atomic')
    })

    it('should include keyboard navigation help', async () => {
      const result = await render(mockTransformedDoc, mockBuildOptions)
      
      // Navigation should handle standard keys
      expect(result).toContain('ArrowRight')
      expect(result).toContain('ArrowLeft')
      expect(result).toContain('Home')
      expect(result).toContain('End')
      expect(result).toContain('Space')
    })
  })

  describe('responsive features', () => {
    it('should include responsive CSS', async () => {
      const result = await render(mockTransformedDoc, mockBuildOptions)
      
      // Check for responsive breakpoints
      expect(result).toContain('@media (max-width: 768px)')
      expect(result).toContain('@media (max-width: 480px)')
    })

    it('should include touch navigation', async () => {
      const result = await render(mockTransformedDoc, mockBuildOptions)
      
      // Check for touch event handlers
      expect(result).toContain('touchstart')
      expect(result).toContain('touchend')
    })
  })
})