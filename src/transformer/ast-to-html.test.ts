import { describe, it, expect } from 'vitest';
import { astToHTML } from './ast-to-html';
import { CurtainsDocument, ContainerNode } from '../ast/types';

describe('astToHTML', () => {
  describe('basic conversion', () => {
    it('should convert single AST to HTML', () => {
      const ast = {
        type: 'root',
        children: [
          {
            type: 'heading',
            depth: 1,
            children: [{ type: 'text', value: 'Single AST Test' }]
          },
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'This tests direct AST input.' }]
          }
        ]
      };
      
      const html = astToHTML(ast);
      expect(html).toContain('<h1>Single AST Test</h1>');
      expect(html).toContain('<p>This tests direct AST input.</p>');
      expect(html).toContain('<div class="curtains-content">');
      // Should not contain slide wrapper when passing AST directly
      expect(html).not.toContain('<div class="curtains-slide">');
    });

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

  describe('table transformation', () => {
    it('should convert table with headers to HTML', () => {
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{
              type: 'table',
              children: [
                {
                  type: 'tableRow',
                  children: [
                    {
                      type: 'tableCell',
                      header: true,
                      children: [{ type: 'text', value: 'Name' }]
                    },
                    {
                      type: 'tableCell',
                      header: true,
                      children: [{ type: 'text', value: 'Age' }]
                    }
                  ]
                },
                {
                  type: 'tableRow',
                  children: [
                    {
                      type: 'tableCell',
                      children: [{ type: 'text', value: 'John' }]
                    },
                    {
                      type: 'tableCell',
                      children: [{ type: 'text', value: '30' }]
                    }
                  ]
                }
              ]
            }]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<table>');
      expect(html).toContain('<thead>');
      expect(html).toContain('<tbody>');
      expect(html).toContain('<th>Name</th>');
      expect(html).toContain('<th>Age</th>');
      expect(html).toContain('<td>John</td>');
      expect(html).toContain('<td>30</td>');
    });

    it('should convert table without headers to HTML', () => {
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{
              type: 'table',
              children: [
                {
                  type: 'tableRow',
                  children: [
                    {
                      type: 'tableCell',
                      children: [{ type: 'text', value: 'Data 1' }]
                    },
                    {
                      type: 'tableCell',
                      children: [{ type: 'text', value: 'Data 2' }]
                    }
                  ]
                },
                {
                  type: 'tableRow',
                  children: [
                    {
                      type: 'tableCell',
                      children: [{ type: 'text', value: 'More 1' }]
                    },
                    {
                      type: 'tableCell',
                      children: [{ type: 'text', value: 'More 2' }]
                    }
                  ]
                }
              ]
            }]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<table>');
      expect(html).toContain('<tbody>');
      expect(html).not.toContain('<thead>');
      expect(html).not.toContain('<th>');
      expect(html).toContain('<td>Data 1</td>');
      expect(html).toContain('<td>Data 2</td>');
    });

    it('should handle table cell alignment', () => {
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{
              type: 'table',
              children: [{
                type: 'tableRow',
                children: [
                  {
                    type: 'tableCell',
                    align: 'left',
                    children: [{ type: 'text', value: 'Left' }]
                  },
                  {
                    type: 'tableCell',
                    align: 'center',
                    children: [{ type: 'text', value: 'Center' }]
                  },
                  {
                    type: 'tableCell',
                    align: 'right',
                    children: [{ type: 'text', value: 'Right' }]
                  }
                ]
              }]
            }]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).not.toContain('style="text-align: left"'); // Left alignment is default, no style needed
      expect(html).toContain('style="text-align: center"');
      expect(html).toContain('style="text-align: right"');
    });

    it('should handle tables with inline formatting in cells', () => {
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{
              type: 'table',
              children: [{
                type: 'tableRow',
                children: [
                  {
                    type: 'tableCell',
                    children: [
                      { type: 'text', value: 'bold', bold: true }
                    ]
                  },
                  {
                    type: 'tableCell',
                    children: [{
                      type: 'link',
                      url: 'https://example.com',
                      children: [{ type: 'text', value: 'link' }]
                    }]
                  }
                ]
              }]
            }]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<strong>bold</strong>');
      expect(html).toContain('<a href="https://example.com"');
      expect(html).toContain('target="_blank"');
    });
  });

  describe('image transformation', () => {
    it('should convert image with classes to HTML', () => {
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{
              type: 'image',
              url: 'https://example.com/image.jpg',
              alt: 'Example image',
              classes: ['responsive', 'rounded']
            }]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<img src="https://example.com/image.jpg"');
      expect(html).toContain('alt="Example image"');
      expect(html).toContain('class="responsive rounded"');
    });

    it('should convert image without alt text to HTML', () => {
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{
              type: 'image',
              url: 'https://example.com/image.jpg'
            }]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<img src="https://example.com/image.jpg"');
      expect(html).toContain('alt=""');
      // The img tag itself should not have a class attribute
      expect(html).not.toMatch(/<img[^>]*class=/);
    });

    it('should convert image without classes to HTML', () => {
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{
              type: 'image',
              url: 'local/path.png',
              alt: 'Local image'
            }]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<img src="local/path.png"');
      expect(html).toContain('alt="Local image"');
      // The img tag itself should not have a class attribute
      expect(html).not.toMatch(/<img[^>]*class=/);
    });
  });

  describe('code block transformation', () => {
    it('should convert code blocks with language to HTML', () => {
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{
              type: 'code',
              lang: 'typescript',
              value: 'interface User {\n  name: string;\n  age: number;\n}'
            }]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<pre><code class="language-typescript">');
      expect(html).toContain('interface User {');
      expect(html).toContain('name: string;');
      expect(html).toContain('age: number;');
    });

    it('should convert code blocks without language to HTML', () => {
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{
              type: 'code',
              value: 'plain text code'
            }]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<pre><code>');
      expect(html).not.toContain('class="language-');
      expect(html).toContain('plain text code');
    });

    it('should escape HTML in code blocks', () => {
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{
              type: 'code',
              lang: 'html',
              value: '<div class="example">Hello & Goodbye</div>'
            }]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('&lt;div class=&quot;example&quot;&gt;');
      expect(html).toContain('Hello &amp; Goodbye');
      expect(html).toContain('&lt;/div&gt;');
    });
  });

  describe('content padding wrapper', () => {
    it('should handle mixed container and non-container content', () => {
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [
              // Non-container content first
              {
                type: 'heading',
                depth: 1,
                children: [{ type: 'text', value: 'Title' }]
              },
              {
                type: 'paragraph',
                children: [{ type: 'text', value: 'Regular paragraph' }]
              },
              // Container in the middle
              {
                type: 'container',
                classes: ['special'],
                children: [{
                  type: 'paragraph',
                  children: [{ type: 'text', value: 'Container content' }]
                }]
              },
              // More non-container content after
              {
                type: 'paragraph',
                children: [{ type: 'text', value: 'Another paragraph' }]
              }
            ]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<div class="curtains-content">');
      expect(html).toContain('<div class="special">');
      expect(html).toContain('<h1>Title</h1>');
      expect(html).toContain('<p>Regular paragraph</p>');
      expect(html).toContain('<p>Container content</p>');
      expect(html).toContain('<p>Another paragraph</p>');
      
      // Should have two curtains-content divs (before and after container)
      const contentWrapperCount = (html.match(/<div class="curtains-content">/g) ?? []).length;
      expect(contentWrapperCount).toBe(2);
    });
  });

  describe('empty content handling', () => {
    it('should handle empty tables gracefully', () => {
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{
              type: 'table',
              children: [] // Empty table
            }]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      // Empty table should return empty string and not create any table HTML
      expect(html).not.toContain('<table>');
      expect(html).not.toContain('<thead>');
      expect(html).not.toContain('<tbody>');
    });
  });
});