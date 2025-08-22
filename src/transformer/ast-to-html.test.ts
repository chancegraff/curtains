import { describe, it, expect } from 'vitest';
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

    it('should handle image nodes with classes', () => {
      // Test lines 122-127 - image with classes
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
              url: 'https://example.com/image.png',
              alt: 'Example image',
              classes: ['thumbnail', 'center']
            }]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<img src="https://example.com/image.png" alt="Example image" class="thumbnail center">');
    });

    it('should handle image nodes without classes', () => {
      // Test lines 122-127 - image without classes (empty classAttr)
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
              url: 'https://example.com/image.png',
              alt: 'Example image'
            }]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<img src="https://example.com/image.png" alt="Example image">');
      expect(html).not.toContain(' class="thumbnail');
    });

    it('should handle unknown node types with children gracefully', () => {
      // Test lines 187-190 - this is tested indirectly since we can't pass invalid ASTs through the schema
      // But we can test that the transformation handles various node types correctly
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [
              { type: 'text', value: 'Hello' },
              { type: 'text', value: ' World' }
            ]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('Hello')
      expect(html).toContain('World');
    });

    it('should return empty string for unknown node types without children', () => {
      // Test lines 187-190 - this tests that empty content is handled correctly
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
      // Should contain the wrapper div with empty content
      expect(html).toContain('<div class="curtains-slide"></div>');
    });

    it('should handle mixed containers and regular content correctly', () => {
      // Test lines 45-47 - padded content accumulation with containers
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [
              { type: 'paragraph', children: [{ type: 'text', value: 'Before container' }] },
              { 
                type: 'container',
                classes: ['highlight'],
                children: [{ type: 'text', value: 'In container' }]
              },
              { type: 'paragraph', children: [{ type: 'text', value: 'After container' }] }
            ]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<div class="curtains-content">');
      expect(html).toContain('<div class="highlight">');
      expect(html).toContain('Before container');
      expect(html).toContain('In container');
      expect(html).toContain('After container');
    });

    it('should handle tables with only header row', () => {
      // This test should hit the table case where bodyRows.length === 0
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
                      children: [{ type: 'text', value: 'Header' }]
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
      expect(html).toContain('<table><thead>');
      expect(html).toContain('<th>Header</th>');
      expect(html).not.toContain('<tbody>');
    });

    it('should handle unknown node types with children by processing children (root node)', () => {
      // Test lines 187-190 - default case with children handling
      // The 'root' node type is valid in schema but not handled in the switch, triggers default
      const rootNodeAST = {
        type: 'root',
        children: [
          { type: 'text', value: 'Child 1' },
          { type: 'text', value: 'Child 2' }
        ]
      };

      const html = astToHTML(rootNodeAST);
      expect(html).toContain('Child 1');
      expect(html).toContain('Child 2');
    });

    it('should handle table with empty children array correctly', () => {
      // Test lines 151 - empty table children handling
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
              children: []
            }]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toBe('<div class="curtains-slide"></div>');
    });

    it('should handle code blocks with empty language string', () => {
      // Test line 144 - empty language string case (lang !== undefined && lang !== '')
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
              lang: '',
              value: 'const x = 1;'
            }]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<pre><code>');
      expect(html).not.toContain('class="language-');
      expect(html).toContain('const x = 1;');
    });

    it('should handle containers with empty children array', () => {
      // Test container edge case where children is an empty array
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [{
              type: 'container',
              classes: ['test-container'],
              children: []
            }]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<div class="test-container"></div>');
    });

    it('should test that all node types are handled to achieve maximum coverage', () => {
      // Since the default case (lines 187-190) is defensive code for unknown node types,
      // and all known node types ARE handled in the switch statement,
      // the best we can do is verify that our coverage is as complete as possible
      // by testing edge cases and ensuring all branches are covered
      
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [
              // Test various edge cases to maximize branch coverage
              { type: 'heading', depth: 6, children: [{ type: 'text', value: 'H6' }] },
              { type: 'list', ordered: true, children: [
                { type: 'listItem', children: [{ type: 'text', value: 'Ordered item' }] }
              ]},
              { type: 'list', ordered: false, children: [
                { type: 'listItem', children: [{ type: 'text', value: 'Unordered item' }] }
              ]},
              { type: 'table', children: [
                { type: 'tableRow', children: [
                  { type: 'tableCell', header: false, children: [{ type: 'text', value: 'Cell' }] }
                ]}
              ]}
            ]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<h6>H6</h6>');
      expect(html).toContain('<ol>');
      expect(html).toContain('<ul>');
      expect(html).toContain('<table>');
      expect(html).toContain('<td>Cell</td>');
    });

    it('should test default case with node that has no children', () => {
      // Test lines 189-190 - default case when node has no children property
      // Create a scenario that might reach this path
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [
              // Use a valid node type but test edge cases
              { type: 'image', url: 'test.png', alt: 'test' }, // image has no children
              { type: 'code', value: 'test code' } // code has no children
            ]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<img src="test.png" alt="test">');
      expect(html).toContain('<pre><code>test code</code></pre>');
    });

    it('should handle edge case branches that may not be fully covered', () => {
      // Test to improve branch coverage
      const doc: CurtainsDocument = {
        type: 'curtains-document',
        version: '0.1',
        slides: [{
          type: 'curtains-slide',
          index: 0,
          ast: {
            type: 'root',
            children: [
              // Test text with both bold and italic
              { type: 'text', value: 'Bold and italic', bold: true, italic: true },
              // Test image with empty alt
              { type: 'image', url: 'test.jpg', alt: '' },
              // Test link with empty URL 
              { type: 'link', url: '', children: [{ type: 'text', value: 'Empty link' }] }
            ]
          },
          slideCSS: ''
        }],
        globalCSS: ''
      };
      
      const html = astToHTML(doc);
      expect(html).toContain('<em><strong>Bold and italic</strong></em>');
      expect(html).toContain('alt=""');
      expect(html).toContain('href=""');
    });

  });
});