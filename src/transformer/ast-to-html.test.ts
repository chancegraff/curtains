import { describe, it, expect } from '@jest/globals';
import { astToHTML } from './ast-to-html';
import { CurtainsDocument, ContainerNode } from '../ast/types';

describe('astToHTML', () => {
  describe('basic conversion', () => {
    it('should convert empty slide to HTML', () => {
      const doc: CurtainsDocument = {
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
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<div class="curtains-slide">');
      expect(html).toContain('</div>');
    });

    it('should convert markdown content to HTML', () => {
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [
              {
                type: 'heading',
                depth: 1,
                children: [{ type: 'text', value: 'Hello World' }]
              },
              {
                type: 'paragraph',
                children: [{ type: 'text', value: 'This is a test.' }]
              }
            ]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<h1>Hello World</h1>');
      expect(html).toContain('<p>This is a test.</p>');
    });
  });

  describe('container transformation', () => {
    it('should transform containers to divs with classes', () => {
      const container: ContainerNode = {
        type: 'container',
        classes: ['custom-container'],
        children: [{
          type: 'paragraph',
          children: [{ type: 'text', value: 'Container content' }]
        }]
      };

      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [container]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<div class="custom-container">');
      expect(html).toContain('<p>Container content</p>');
      expect(html).toContain('</div>');
    });

    it('should handle nested containers', () => {
      const nestedContainer: ContainerNode = {
        type: 'container',
        classes: ['outer'],
        children: [{
          type: 'container',
          classes: ['inner'],
          children: [{
            type: 'paragraph',
            children: [{ type: 'text', value: 'Nested content' }]
          }]
        }]
      };

      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [nestedContainer]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<div class="outer">');
      expect(html).toContain('<div class="inner">');
      expect(html).toContain('<p>Nested content</p>');
    });

    it('should handle containers without classes', () => {
      const container: ContainerNode = {
        type: 'container',
        classes: [],
        children: [{
          type: 'paragraph',
          children: [{ type: 'text', value: 'No class' }]
        }]
      };

      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [container]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<div>');
      expect(html).toContain('<p>No class</p>');
    });
  });

  describe('external link handling', () => {
    it('should add target="_blank" to external links', () => {
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{
              type: 'paragraph',
              children: [{
                type: 'link',
                url: 'https://example.com',
                children: [{ type: 'text', value: 'External Link' }]
              }]
            }]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
    });

    it('should not add target="_blank" to internal links', () => {
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{
              type: 'paragraph',
              children: [
                {
                  type: 'link',
                  url: '#section',
                  children: [{ type: 'text', value: 'Hash Link' }]
                },
                { type: 'text', value: ' ' },
                {
                  type: 'link',
                  url: '/page',
                  children: [{ type: 'text', value: 'Relative Link' }]
                }
              ]
            }]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('href="#section"');
      expect(html).toContain('href="/page"');
      expect(html).not.toContain('target="_blank"');
    });

    it('should handle various external URL formats', () => {
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{
              type: 'paragraph',
              children: [
                {
                  type: 'link',
                  url: 'http://example.com',
                  children: [{ type: 'text', value: 'HTTP' }]
                },
                { type: 'text', value: ' ' },
                {
                  type: 'link',
                  url: 'https://example.com',
                  children: [{ type: 'text', value: 'HTTPS' }]
                },
                { type: 'text', value: ' ' },
                {
                  type: 'link',
                  url: '//example.com',
                  children: [{ type: 'text', value: 'Protocol-relative' }]
                }
              ]
            }]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      
      // All external links should have target="_blank"
      const targetBlankCount = (html.match(/target="_blank"/g) ?? []).length;
      expect(targetBlankCount).toBe(3);
      
      const relCount = (html.match(/rel="noopener noreferrer"/g) ?? []).length;
      expect(relCount).toBe(3);
    });
  });

  describe('multiple slides', () => {
    it('should handle multiple slides', () => {
      const doc: CurtainsDocument = {
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
            slideCSS: ''
          },
          {
            type: 'curtains-slide',
            index: 1,
            ast: {
              type: 'root',
              children: [{
                type: 'heading',
                depth: 1,
                children: [{ type: 'text', value: 'Slide 2' }]
              }]
            },
            slideCSS: ''
          }
        ],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<h1>Slide 1</h1>');
      expect(html).toContain('<h1>Slide 2</h1>');
      
      // Should have two slide divs
      const slideCount = (html.match(/<div class="curtains-slide">/g) ?? []).length;
      expect(slideCount).toBe(2);
    });
  });

  describe('complex markdown structures', () => {
    it('should handle lists, code blocks, and emphasis', () => {
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [
              {
                type: 'list',
                ordered: false,
                children: [
                  {
                    type: 'listitem',
                    children: [{
                      type: 'paragraph',
                      children: [{ type: 'text', value: 'Item 1' }]
                    }]
                  },
                  {
                    type: 'listitem',
                    children: [{
                      type: 'paragraph',
                      children: [{ type: 'text', value: 'Item 2' }]
                    }]
                  }
                ]
              },
              {
                type: 'code',
                lang: 'javascript',
                value: 'const x = 42;'
              },
              {
                type: 'paragraph',
                children: [
                  { type: 'text', value: 'Text with ' },
                  {
                    type: 'text',
                    value: 'bold',
                    bold: true
                  },
                  { type: 'text', value: ' and ' },
                  {
                    type: 'text',
                    value: 'italic',
                    italic: true
                  }
                ]
              }
            ]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>');
      expect(html).toContain('Item 1');
      expect(html).toContain('Item 2');
      expect(html).toContain('<pre><code');
      expect(html).toContain('const x = 42;');
      expect(html).toContain('bold');
      expect(html).toContain('italic');
    });
  });
});