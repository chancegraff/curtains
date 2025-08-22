// Template Builder Tests
// Tests for complete HTML document assembly

import { describe, it, expect } from 'vitest'
import { buildCompleteHTML } from './template-builder.js'

describe('Template Builder', () => {
  describe('buildCompleteHTML function', () => {
    const mockParams = {
      slidesHTML: '<section class="curtains-slide"><h1>Test Slide</h1></section>',
      css: '.curtains-root { background: white; }',
      runtimeConfig: {
        totalSlides: 1,
        theme: 'light' as const,
        startSlide: 0
      },
      runtimeJS: 'console.log("test runtime");'
    }

    it('should generate complete HTML document', () => {
      const result = buildCompleteHTML(mockParams)

      expect(result).toMatch(/^<!DOCTYPE html>/)
      expect(result).toContain('<html lang="en">')
      expect(result).toContain('</html>')
    })

    it('should include proper document structure', () => {
      const result = buildCompleteHTML(mockParams)

      expect(result).toContain('<!DOCTYPE html>')
      expect(result).toContain('<html lang="en">')
      expect(result).toContain('<head>')
      expect(result).toContain('</head>')
      expect(result).toContain('<body>')
      expect(result).toContain('</body>')
      expect(result).toContain('</html>')
    })

    it('should include required meta tags', () => {
      const result = buildCompleteHTML(mockParams)

      expect(result).toContain('<meta charset="UTF-8">')
      expect(result).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0">')
      expect(result).toContain('<meta name="generator" content="Curtains Presentation Tool">')
    })

    it('should include description meta tag with slide count', () => {
      const paramsWithMultipleSlides = {
        ...mockParams,
        runtimeConfig: {
          totalSlides: 5,
          theme: 'light' as const,
          startSlide: 0
        }
      }

      const result = buildCompleteHTML(paramsWithMultipleSlides)

      expect(result).toContain('<meta name="description" content="Curtains presentation with 5 slides">')
    })

    it('should include title element', () => {
      const result = buildCompleteHTML(mockParams)

      expect(result).toContain('<title>Presentation</title>')
    })

    it('should embed CSS in style tag', () => {
      const customCSS = '.custom { color: red; background: blue; }'
      const paramsWithCSS = {
        ...mockParams,
        css: customCSS
      }

      const result = buildCompleteHTML(paramsWithCSS)

      expect(result).toContain('<style>')
      expect(result).toContain(customCSS)
      expect(result).toContain('</style>')
    })

    it('should include curtains-root with correct theme', () => {
      const lightThemeResult = buildCompleteHTML({
        ...mockParams,
        runtimeConfig: { ...mockParams.runtimeConfig, theme: 'light' }
      })

      const darkThemeResult = buildCompleteHTML({
        ...mockParams,
        runtimeConfig: { ...mockParams.runtimeConfig, theme: 'dark' }
      })

      expect(lightThemeResult).toContain('<div class="curtains-root" data-theme="light">')
      expect(darkThemeResult).toContain('<div class="curtains-root" data-theme="dark">')
    })

    it('should include curtains-stage container', () => {
      const result = buildCompleteHTML(mockParams)

      expect(result).toContain('<div class="curtains-stage">')
      expect(result).toContain('</div>')
    })

    it('should embed slides HTML correctly', () => {
      const customSlidesHTML = `
        <section class="curtains-slide"><h1>Slide 1</h1></section>
        <section class="curtains-slide"><h2>Slide 2</h2></section>
      `
      const paramsWithSlides = {
        ...mockParams,
        slidesHTML: customSlidesHTML
      }

      const result = buildCompleteHTML(paramsWithSlides)

      expect(result).toContain(customSlidesHTML)
      expect(result).toContain('<h1>Slide 1</h1>')
      expect(result).toContain('<h2>Slide 2</h2>')
    })

    it('should include counter with correct total slides', () => {
      const paramsWithCounter = {
        ...mockParams,
        runtimeConfig: {
          totalSlides: 7,
          theme: 'light' as const,
          startSlide: 0
        }
      }

      const result = buildCompleteHTML(paramsWithCounter)

      expect(result).toContain('<div class="curtains-counter">1/7</div>')
    })

    it('should embed JavaScript in script tag', () => {
      const customJS = 'const navigation = { current: 0, total: 3 };'
      const paramsWithJS = {
        ...mockParams,
        runtimeJS: customJS
      }

      const result = buildCompleteHTML(paramsWithJS)

      expect(result).toContain('<script>')
      expect(result).toContain(customJS)
      expect(result).toContain('</script>')
    })

    it('should handle empty slides HTML', () => {
      const paramsWithEmptySlides = {
        ...mockParams,
        slidesHTML: ''
      }

      const result = buildCompleteHTML(paramsWithEmptySlides)

      expect(result).toContain('<div class="curtains-stage">')
      expect(result).toContain('</div>')
      expect(result).not.toContain('<section class="curtains-slide">')
    })

    it('should handle empty CSS', () => {
      const paramsWithEmptyCSS = {
        ...mockParams,
        css: ''
      }

      const result = buildCompleteHTML(paramsWithEmptyCSS)

      expect(result).toContain('<style>')
      expect(result).toContain('</style>')
    })

    it('should handle empty JavaScript', () => {
      const paramsWithEmptyJS = {
        ...mockParams,
        runtimeJS: ''
      }

      const result = buildCompleteHTML(paramsWithEmptyJS)

      expect(result).toContain('<script>')
      expect(result).toContain('</script>')
    })

    it('should preserve HTML formatting and indentation', () => {
      const result = buildCompleteHTML(mockParams)

      // Check for proper indentation structure
      expect(result).toMatch(/<style>\n.*\n {2}<\/style>/)
      expect(result).toMatch(/<script>\n.*\n {2}<\/script>/)

      // Should have newlines for readability
      expect(result).toContain('\n')
      expect(result.split('\n').length).toBeGreaterThan(10)
    })

    it('should handle complex slide HTML with nested elements', () => {
      const complexSlidesHTML = `
        <section class="curtains-slide">
          <div class="slide-header">
            <h1>Complex Slide</h1>
            <nav>
              <ul>
                <li><a href="#section1">Section 1</a></li>
                <li><a href="#section2">Section 2</a></li>
              </ul>
            </nav>
          </div>
          <main class="slide-content">
            <section id="section1">
              <h2>Section 1</h2>
              <p>Content with <strong>emphasis</strong> and <em>styling</em>.</p>
            </section>
          </main>
        </section>
      `

      const result = buildCompleteHTML({
        ...mockParams,
        slidesHTML: complexSlidesHTML
      })

      expect(result).toContain('<div class="slide-header">')
      expect(result).toContain('<nav>')
      expect(result).toContain('<main class="slide-content">')
      expect(result).toContain('<section id="section1">')
      expect(result).toContain('<strong>emphasis</strong>')
      expect(result).toContain('<em>styling</em>')
    })

    it('should handle complex CSS with media queries and animations', () => {
      const complexCSS = `
        /* Base styles */
        .curtains-root {
          font-family: -apple-system, sans-serif;
        }

        /* Media queries */
        @media (max-width: 768px) {
          .curtains-slide {
            padding: 1rem;
          }
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .slide-enter {
          animation: fadeIn 0.3s ease-in-out;
        }
      `

      const result = buildCompleteHTML({
        ...mockParams,
        css: complexCSS
      })

      expect(result).toContain('/* Base styles */')
      expect(result).toContain('@keyframes fadeIn')
      expect(result).toContain('.slide-enter')
    })

    it('should handle complex JavaScript with functions and event listeners', () => {
      const complexJS = `
        (function() {
          'use strict';

          const navigation = {
            current: 0,
            total: 0,

            init() {
              this.total = document.querySelectorAll('.curtains-slide').length;
              this.setupEventListeners();
            },

            goToSlide(index) {
              this.current = Math.max(0, Math.min(index, this.total - 1));
              const stage = document.querySelector('.curtains-stage');
              if (stage) {
                stage.style.transform = \`translateX(-\${this.current * 100}%)\`;
              }
            },

            setupEventListeners() {
              document.addEventListener('keydown', (e) => {
                switch(e.key) {
                  case 'ArrowRight':
                    this.goToSlide(this.current + 1);
                    break;
                  case 'ArrowLeft':
                    this.goToSlide(this.current - 1);
                    break;
                }
              });
            }
          };

          navigation.init();
          window.curtainsNavigation = navigation;
        })();
      `

      const result = buildCompleteHTML({
        ...mockParams,
        runtimeJS: complexJS
      })

      expect(result).toContain('(function() {')
      expect(result).toContain("'use strict';")
      expect(result).toContain('const navigation = {')
      expect(result).toContain('setupEventListeners()')
      expect(result).toContain('addEventListener(')
      expect(result).toContain('window.curtainsNavigation')
    })

    it('should escape HTML in content properly', () => {
      const slidesWithSpecialChars = '<section class="curtains-slide"><p>Test &amp; more &lt;tags&gt;</p></section>'

      const result = buildCompleteHTML({
        ...mockParams,
        slidesHTML: slidesWithSpecialChars
      })

      expect(result).toContain('&amp;')
      expect(result).toContain('&lt;')
      expect(result).toContain('&gt;')
    })

    it('should handle single slide correctly', () => {
      const singleSlideParams = {
        ...mockParams,
        runtimeConfig: {
          totalSlides: 1,
          theme: 'light' as const,
          startSlide: 0
        }
      }

      const result = buildCompleteHTML(singleSlideParams)

      expect(result).toContain('1 slides">')
      expect(result).toContain('<div class="curtains-counter">1/1</div>')
    })

    it('should handle multiple slides correctly', () => {
      const multiSlideParams = {
        ...mockParams,
        slidesHTML: Array.from({ length: 5 }, (_, i) =>
          `<section class="curtains-slide"><h1>Slide ${i + 1}</h1></section>`
        ).join('\n      '),
        runtimeConfig: {
          totalSlides: 5,
          theme: 'dark' as const,
          startSlide: 0
        }
      }

      const result = buildCompleteHTML(multiSlideParams)

      expect(result).toContain('5 slides">')
      expect(result).toContain('<div class="curtains-counter">1/5</div>')
      expect(result).toContain('data-theme="dark"')
      expect(result).toContain('<h1>Slide 1</h1>')
      expect(result).toContain('<h1>Slide 5</h1>')
    })

    it('should produce valid HTML structure', () => {
      const result = buildCompleteHTML(mockParams)

      // Basic HTML5 validation
      expect(result).toMatch(/<!DOCTYPE html>/i)
      expect(result).toContain('<html lang="en">')
      expect(result).toContain('<head>')
      expect(result).toContain('<meta charset="UTF-8">')
      expect(result).toContain('<title>')
      expect(result).toContain('</head>')
      expect(result).toContain('<body>')
      expect(result).toContain('</body>')
      expect(result).toContain('</html>')

      // Should not have malformed structure
      expect(result).not.toContain('<>')
      expect(result).not.toContain('</>')

      // Should have balanced major structural tags
      expect((result.match(/<html/g) ?? []).length).toBe((result.match(/<\/html>/g) ?? []).length)
      expect((result.match(/<head>/g) ?? []).length).toBe((result.match(/<\/head>/g) ?? []).length)
      expect((result.match(/<body>/g) ?? []).length).toBe((result.match(/<\/body>/g) ?? []).length)
    })

    it('should maintain consistent formatting', () => {
      const result = buildCompleteHTML(mockParams)

      // Should have consistent indentation
      const lines = result.split('\n')
      expect(lines.length).toBeGreaterThan(15)

      // Should not have trailing whitespace
      lines.forEach(line => {
        expect(line).not.toMatch(/\s+$/)
      })
    })
  })
})
