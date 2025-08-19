// HTML Generator Tests
// Tests for HTML slide structure generation

import { describe, it, expect } from '@jest/globals'
import { buildSlidesHTML } from './html-generator.js'
import type { TransformedDocument } from '../ast/types.js'

describe('HTML Generator', () => {
  describe('buildSlidesHTML function', () => {
    it('should generate HTML for single slide', () => {
      const doc: TransformedDocument = {
        slides: [
          {
            html: '<h1>Test Title</h1><p>Test content</p>',
            css: '.test { color: blue; }'
          }
        ],
        globalCSS: ''
      }

      const result = buildSlidesHTML(doc)

      expect(result).toBe('<section class="curtains-slide"><h1>Test Title</h1><p>Test content</p></section>')
    })

    it('should generate HTML for multiple slides', () => {
      const doc: TransformedDocument = {
        slides: [
          {
            html: '<h1>Slide 1</h1>',
            css: ''
          },
          {
            html: '<h2>Slide 2</h2>',
            css: ''
          },
          {
            html: '<h3>Slide 3</h3>',
            css: ''
          }
        ],
        globalCSS: ''
      }

      const result = buildSlidesHTML(doc)
      const expected = [
        '<section class="curtains-slide"><h1>Slide 1</h1></section>',
        '      <section class="curtains-slide"><h2>Slide 2</h2></section>',
        '      <section class="curtains-slide"><h3>Slide 3</h3></section>'
      ].join('\n')

      expect(result).toBe(expected)
    })

    it('should handle empty slide content', () => {
      const doc: TransformedDocument = {
        slides: [
          {
            html: '',
            css: ''
          }
        ],
        globalCSS: ''
      }

      const result = buildSlidesHTML(doc)

      expect(result).toBe('<section class="curtains-slide"></section>')
    })

    it('should handle complex HTML content', () => {
      const complexHTML = `
        <h1>Complex Slide</h1>
        <div class="content">
          <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
          <ul>
            <li>List item 1</li>
            <li>List item 2 with <a href="#">link</a></li>
          </ul>
          <blockquote>
            <p>This is a quote</p>
          </blockquote>
          <pre><code>const code = "example";</code></pre>
        </div>
      `.trim()

      const doc: TransformedDocument = {
        slides: [
          {
            html: complexHTML,
            css: ''
          }
        ],
        globalCSS: ''
      }

      const result = buildSlidesHTML(doc)

      expect(result).toBe(`<section class="curtains-slide">${complexHTML}</section>`)
      expect(result).toContain('<h1>Complex Slide</h1>')
      expect(result).toContain('<strong>bold</strong>')
      expect(result).toContain('<a href="#">link</a>')
      expect(result).toContain('<blockquote>')
      expect(result).toContain('<pre><code>')
    })

    it('should preserve HTML attributes and structure', () => {
      const htmlWithAttributes = '<div id="custom" class="highlight" data-test="value"><p>Content</p></div>'
      
      const doc: TransformedDocument = {
        slides: [
          {
            html: htmlWithAttributes,
            css: ''
          }
        ],
        globalCSS: ''
      }

      const result = buildSlidesHTML(doc)

      expect(result).toContain('id="custom"')
      expect(result).toContain('class="highlight"')
      expect(result).toContain('data-test="value"')
      expect(result).toBe(`<section class="curtains-slide">${htmlWithAttributes}</section>`)
    })

    it('should handle slides with special characters', () => {
      const specialCharsHTML = '<p>Special chars: &amp; &lt; &gt; &quot; &#39; €</p>'
      
      const doc: TransformedDocument = {
        slides: [
          {
            html: specialCharsHTML,
            css: ''
          }
        ],
        globalCSS: ''
      }

      const result = buildSlidesHTML(doc)

      expect(result).toContain('&amp;')
      expect(result).toContain('&lt;')
      expect(result).toContain('&gt;')
      expect(result).toContain('&quot;')
      expect(result).toContain('&#39;')
      expect(result).toContain('€')
    })

    it('should handle empty slides array', () => {
      const doc: TransformedDocument = {
        slides: [],
        globalCSS: ''
      }

      const result = buildSlidesHTML(doc)

      expect(result).toBe('')
    })

    it('should maintain proper indentation for multiple slides', () => {
      const doc: TransformedDocument = {
        slides: [
          { html: '<h1>First</h1>', css: '' },
          { html: '<h2>Second</h2>', css: '' },
          { html: '<h3>Third</h3>', css: '' }
        ],
        globalCSS: ''
      }

      const result = buildSlidesHTML(doc)
      const lines = result.split('\n')

      expect(lines[0]).toBe('<section class="curtains-slide"><h1>First</h1></section>')
      expect(lines[1]).toBe('      <section class="curtains-slide"><h2>Second</h2></section>')
      expect(lines[2]).toBe('      <section class="curtains-slide"><h3>Third</h3></section>')
    })

    it('should use consistent CSS class names', () => {
      const doc: TransformedDocument = {
        slides: [
          { html: '<p>Slide 1</p>', css: '' },
          { html: '<p>Slide 2</p>', css: '' }
        ],
        globalCSS: ''
      }

      const result = buildSlidesHTML(doc)

      // Count occurrences of the CSS class
      const classMatches = result.match(/class="curtains-slide"/g)
      expect(classMatches).toHaveLength(2)
      
      // Ensure all sections use the same class name
      expect(result).toContain('class="curtains-slide"')
      expect(result).not.toContain('class="slide"')
      expect(result).not.toContain('class="curtain-slide"')
    })

    it('should handle slides with nested HTML structures', () => {
      const nestedHTML = `
        <div class="slide-header">
          <h1>Title</h1>
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
            <p>Content for section 1</p>
          </section>
          <section id="section2">
            <h2>Section 2</h2>
            <p>Content for section 2</p>
          </section>
        </main>
      `.trim()

      const doc: TransformedDocument = {
        slides: [
          {
            html: nestedHTML,
            css: ''
          }
        ],
        globalCSS: ''
      }

      const result = buildSlidesHTML(doc)

      expect(result).toContain('<div class="slide-header">')
      expect(result).toContain('<nav>')
      expect(result).toContain('<main class="slide-content">')
      expect(result).toContain('<section id="section1">')
      expect(result).toContain('<section id="section2">')
      expect(result).toBe(`<section class="curtains-slide">${nestedHTML}</section>`)
    })

    it('should not modify slide HTML content', () => {
      const originalHTML = '<h1>Original Content</h1><p>With <span style="color: red;">inline styles</span></p>'
      
      const doc: TransformedDocument = {
        slides: [
          {
            html: originalHTML,
            css: ''
          }
        ],
        globalCSS: ''
      }

      const result = buildSlidesHTML(doc)

      // The original HTML should be preserved exactly within the section wrapper
      expect(result).toBe(`<section class="curtains-slide">${originalHTML}</section>`)
    })

    it('should handle slides with various content types', () => {
      const mixedContentHTML = `
        <h1>Mixed Content Slide</h1>
        <img src="image.jpg" alt="Test image" />
        <video controls>
          <source src="video.mp4" type="video/mp4">
        </video>
        <table>
          <thead>
            <tr><th>Header 1</th><th>Header 2</th></tr>
          </thead>
          <tbody>
            <tr><td>Cell 1</td><td>Cell 2</td></tr>
          </tbody>
        </table>
        <form>
          <input type="text" name="test" />
          <button type="submit">Submit</button>
        </form>
      `.trim()

      const doc: TransformedDocument = {
        slides: [
          {
            html: mixedContentHTML,
            css: ''
          }
        ],
        globalCSS: ''
      }

      const result = buildSlidesHTML(doc)

      expect(result).toContain('<img src="image.jpg"')
      expect(result).toContain('<video controls>')
      expect(result).toContain('<table>')
      expect(result).toContain('<form>')
      expect(result).toContain('<input type="text"')
      expect(result).toContain('<button type="submit"')
    })
  })
})