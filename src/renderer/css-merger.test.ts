// CSS Merger Tests
// Tests for CSS merging functionality with proper cascade order

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { readFile } from 'fs/promises'
import { mergeCSS, getBaseLayoutCSS } from './css-merger.js'

// Mock fs/promises
jest.mock('fs/promises')
const mockedReadFile = readFile as jest.MockedFunction<typeof readFile>

describe('CSS Merger', () => {
  const mockTemplateCSS = `
:root {
  --curtains-bg-primary: #ffffff;
  --curtains-text-primary: #0f172a;
}

[data-theme="dark"] {
  --curtains-bg-primary: #0f172a;
  --curtains-text-primary: #f8fafc;
}

.curtains-root {
  background-color: var(--curtains-bg-primary);
  color: var(--curtains-text-primary);
}
  `.trim()

  beforeEach(() => {
    mockedReadFile.mockResolvedValue(mockTemplateCSS)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('mergeCSS function', () => {
    it('should merge CSS in correct cascade order', async () => {
      const params = {
        globalCSS: '.global { font-family: Arial; }',
        slidesCSS: ['.slide1 { color: blue; }', '.slide2 { color: red; }'],
        theme: 'light' as const
      }

      const result = await mergeCSS(params)

      // Check for proper section headers in order
      const baseLayoutIndex = result.indexOf('/* Base Layout Styles */')
      const themeVariablesIndex = result.indexOf('/* Theme Variables and Base Styles */')
      const globalStylesIndex = result.indexOf('/* Global User Styles */')
      const slideStylesIndex = result.indexOf('/* Slide-specific Scoped Styles */')

      expect(baseLayoutIndex).toBeGreaterThan(-1)
      expect(themeVariablesIndex).toBeGreaterThan(baseLayoutIndex)
      expect(globalStylesIndex).toBeGreaterThan(themeVariablesIndex)
      expect(slideStylesIndex).toBeGreaterThan(globalStylesIndex)
    })

    it('should include base layout CSS first', async () => {
      const result = await mergeCSS({
        globalCSS: '',
        slidesCSS: [],
        theme: 'light'
      })

      expect(result).toContain('/* Base Layout Styles */')
      expect(result).toContain('.curtains-root {')
      expect(result).toContain('.curtains-slide {')
      expect(result).toContain('box-sizing: border-box')
    })

    it('should include template CSS after base layout', async () => {
      const result = await mergeCSS({
        globalCSS: '',
        slidesCSS: [],
        theme: 'light'
      })

      expect(result).toContain('/* Theme Variables and Base Styles */')
      expect(result).toContain('--curtains-bg-primary: #ffffff')
      expect(result).toContain('[data-theme="dark"]')
    })

    it('should include global CSS in proper position', async () => {
      const globalCSS = '.custom-global { font-weight: bold; }'
      const result = await mergeCSS({
        globalCSS,
        slidesCSS: [],
        theme: 'light'
      })

      expect(result).toContain('/* Global User Styles */')
      expect(result).toContain(globalCSS)

      // Ensure global CSS comes after theme variables
      const themeIndex = result.indexOf('/* Theme Variables and Base Styles */')
      const globalIndex = result.indexOf(globalCSS)
      expect(globalIndex).toBeGreaterThan(themeIndex)
    })

    it('should include slide-specific CSS last', async () => {
      const slidesCSS = [
        '.slide-1 { background: blue; }',
        '.slide-2 { background: red; }'
      ]
      const result = await mergeCSS({
        globalCSS: '',
        slidesCSS,
        theme: 'light'
      })

      expect(result).toContain('/* Slide-specific Scoped Styles */')
      expect(result).toContain('.slide-1 { background: blue; }')
      expect(result).toContain('.slide-2 { background: red; }')

      // Ensure slide CSS comes last
      const globalIndex = result.indexOf('/* Global User Styles */')
      const slideIndex = result.indexOf('.slide-1 { background: blue; }')
      expect(slideIndex).toBeGreaterThan(globalIndex)
    })

    it('should filter out empty slide CSS', async () => {
      const slidesCSS = [
        '.slide-1 { color: blue; }',
        '',
        '   ',
        '.slide-3 { color: green; }'
      ]
      const result = await mergeCSS({
        globalCSS: '',
        slidesCSS,
        theme: 'light'
      })

      expect(result).toContain('.slide-1 { color: blue; }')
      expect(result).toContain('.slide-3 { color: green; }')
      // Should not contain multiple consecutive empty lines due to empty CSS
      const emptyLineSequences = result.match(/\n\s*\n\s*\n/g)
      expect(emptyLineSequences?.length || 0).toBeLessThan(3)
    })

    it('should handle empty global CSS', async () => {
      const result = await mergeCSS({
        globalCSS: '',
        slidesCSS: ['.slide { color: red; }'],
        theme: 'light'
      })

      expect(result).toContain('/* Global User Styles */')
      expect(result).toContain('/* Slide-specific Scoped Styles */')
      expect(result).toContain('.slide { color: red; }')
    })

    it('should handle theme parameter correctly', async () => {
      await mergeCSS({
        globalCSS: '',
        slidesCSS: [],
        theme: 'dark'
      })

      // Theme doesn't directly affect CSS merging logic,
      // but should be accepted without error
      expect(mockedReadFile).toHaveBeenCalledTimes(1)
    })

    it('should read template from correct path', async () => {
      await mergeCSS({
        globalCSS: '',
        slidesCSS: [],
        theme: 'light'
      })

      expect(mockedReadFile).toHaveBeenCalledWith(
        expect.stringMatching(/src[/\\]templates[/\\]style\.css$/),
        'utf-8'
      )
    })

    it('should handle file read errors gracefully', async () => {
      mockedReadFile.mockRejectedValueOnce(new Error('File not found'))

      await expect(mergeCSS({
        globalCSS: '',
        slidesCSS: [],
        theme: 'light'
      })).rejects.toThrow('File not found')
    })
  })

  describe('getBaseLayoutCSS function', () => {
    it('should return base layout styles', () => {
      const result = getBaseLayoutCSS()

      expect(result).toContain('/* Reset and Box Model */')
      expect(result).toContain('* {')
      expect(result).toContain('box-sizing: border-box')
      expect(result).toContain('margin: 0')
      expect(result).toContain('padding: 0')
    })

    it('should include core presentation structure', () => {
      const result = getBaseLayoutCSS()

      expect(result).toContain('/* Core Presentation Structure */')
      expect(result).toContain('.curtains-root {')
      expect(result).toContain('.curtains-stage {')
      expect(result).toContain('.curtains-slide {')
    })

    it('should include typography scale', () => {
      const result = getBaseLayoutCSS()

      expect(result).toContain('/* Typography Scale */')
      expect(result).toContain('.curtains-slide h1 {')
      expect(result).toContain('.curtains-slide h2 {')
      expect(result).toContain('.curtains-slide p {')
      expect(result).toContain('.curtains-slide ul,')
      expect(result).toContain('.curtains-slide ol {')
    })

    it('should have proper CSS structure', () => {
      const result = getBaseLayoutCSS()

      // Should start and end properly
      expect(result.trim()).toBeTruthy()
      expect(result).not.toMatch(/^\s/)
      expect(result).not.toMatch(/\s$/)

      // Should have balanced braces
      const openBraces = (result.match(/{/g) || []).length
      const closeBraces = (result.match(/}/g) || []).length
      expect(openBraces).toBe(closeBraces)
    })

    it('should include viewport and layout properties', () => {
      const result = getBaseLayoutCSS()

      expect(result).toContain('width: 100vw')
      expect(result).toContain('height: 100vh')
      expect(result).toContain('overflow: hidden')
      expect(result).toContain('display: flex')
      expect(result).toContain('transition:')
    })

    it('should define consistent font properties', () => {
      const result = getBaseLayoutCSS()

      expect(result).toContain('font-family:')
      expect(result).toContain('font-size:')
      expect(result).toContain('line-height:')
      expect(result).toContain('font-weight:')
    })
  })

  describe('CSS structure validation', () => {
    it('should produce valid CSS structure', async () => {
      const result = await mergeCSS({
        globalCSS: '.test { color: blue; }',
        slidesCSS: ['.slide { margin: 1rem; }'],
        theme: 'light'
      })

      // Should not have syntax errors
      expect(result).not.toContain('undefined')
      expect(result).not.toContain('[object Object]')

      // Should have proper CSS formatting
      const lines = result.split('\n')
      expect(lines.length).toBeGreaterThan(10)

      // Should contain all expected sections
      expect(result).toContain('/* Base Layout Styles */')
      expect(result).toContain('/* Theme Variables and Base Styles */')
      expect(result).toContain('/* Global User Styles */')
      expect(result).toContain('/* Slide-specific Scoped Styles */')
    })

    it('should handle complex CSS content', async () => {
      const complexGlobalCSS = `
        @media screen and (min-width: 1024px) {
          .container {
            max-width: 1200px;
            margin: 0 auto;
          }
        }

        .fancy-button:hover::before {
          content: "→";
          position: absolute;
        }
      `

      const complexSlideCSS = [
        `
        .slide-animation {
          animation: fadeIn 0.5s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        `
      ]

      const result = await mergeCSS({
        globalCSS: complexGlobalCSS,
        slidesCSS: complexSlideCSS,
        theme: 'dark'
      })

      expect(result).toContain('@media screen and (min-width: 1024px)')
      expect(result).toContain('.fancy-button:hover::before')
      expect(result).toContain('@keyframes fadeIn')
      expect(result).toContain('.slide-animation')
    })
  })
})
