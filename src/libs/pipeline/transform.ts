import type { Element, Root as HastRoot, Text as HastText } from 'hast';
import { h } from 'hastscript';
import rehypeStringify from 'rehype-stringify';
import { unified } from 'unified';
import { z } from 'zod';

import type {
  ASTNode,
  ASTRootNode,
  ASTSlide,
  CurtainsDocument,
} from '../schemas/ast';
import { TransformedDocumentSchema, TransformedSlideSchema } from '../schemas/transformers';

/**
 * Convert custom AST node to hast element(s)
 */
export function astNodeToHast(node: ASTNode): Element | HastText | Array<Element | HastText> {
  switch (node.type) {
    case 'text': {
      // Handle text with optional bold/italic formatting
      if ('bold' in node && 'italic' in node && node.bold && node.italic) {
        return h('strong', [h('em', node.value)]);
      } else if ('bold' in node && node.bold) {
        return h('strong', node.value);
      } else if ('italic' in node && node.italic) {
        return h('em', node.value);
      } else {
        // Return plain text node
        const textHastNode: HastText = {
          type: 'text',
          value: node.value,
        };
        return textHastNode;
      }
    }

    case 'heading': {
      if (node.type !== 'heading') break;
      const tagName = `h${node.depth}`;
      const children = processChildren(node.children);
      if (tagName === 'h1') return h('h1', children);
      if (tagName === 'h2') return h('h2', children);
      if (tagName === 'h3') return h('h3', children);
      if (tagName === 'h4') return h('h4', children);
      if (tagName === 'h5') return h('h5', children);
      if (tagName === 'h6') return h('h6', children);
      return h('div', children);
    }

    case 'paragraph': {
      if (node.type !== 'paragraph') break;
      const children = processChildren(node.children);
      return h('p', children);
    }

    case 'list': {
      if (node.type !== 'list') break;
      const tagName = 'ordered' in node && node.ordered ? 'ol' : 'ul';
      const children = processChildren(node.children);
      return h(tagName, children);
    }

    case 'listItem': {
      if (node.type !== 'listItem') break;
      const children = processChildren(node.children);
      return h('li', children);
    }

    case 'link': {
      if (node.type !== 'link') break;
      const children = processChildren(node.children);
      const linkProps = processLink(node.url);
      return h('a', { href: node.url, ...linkProps }, children);
    }

    case 'image': {
      if (node.type !== 'image') break;
      const props: Record<string, string> = { 
        src: node.url,
        alt: 'alt' in node && node.alt ? node.alt : ''
      };
      return h('img', props);
    }

    case 'code': {
      if (node.type !== 'code') break;
      const codeProps: Record<string, string> = {};
      if ('lang' in node && node.lang) {
        codeProps.className = `language-${node.lang}`;
      }
      const codeElement = h('code', codeProps, node.value);
      return h('pre', codeElement);
    }

    case 'container': {
      if (node.type !== 'container') break;
      return buildContainerHast(node.classes, node.children);
    }

    case 'table': {
      if (node.type !== 'table') break;
      return transformTable(node);
    }

    case 'tableRow': {
      if (node.type !== 'tableRow') break;
      // Table rows are handled in transformTable
      const children = processChildren(node.children);
      return h('tr', children);
    }

    case 'tableCell': {
      if (node.type !== 'tableCell') break;
      // Table cells are handled based on context in transformTable
      const children = processChildren(node.children);
      return h('td', children);
    }
  }
  
  // Default case for unknown types or break statements
  const emptyText: HastText = {
    type: 'text',
    value: '',
  };
  return emptyText;
}

/**
 * Process children nodes and flatten results
 */
function processChildren(nodes: ASTNode[]): Array<Element | HastText | string> {
  const results: Array<Element | HastText | string> = [];
  
  for (const node of nodes) {
    const converted = astNodeToHast(node);
    if (Array.isArray(converted)) {
      results.push(...converted);
    } else {
      results.push(converted);
    }
  }
  
  return results;
}

/**
 * Convert AST root to hast root
 */
export function astToHast(ast: ASTRootNode): HastRoot {
  const children: Array<Element | HastText> = [];
  
  for (const node of ast.children) {
    const converted = astNodeToHast(node);
    if (Array.isArray(converted)) {
      children.push(...converted);
    } else {
      children.push(converted);
    }
  }

  const hastRoot: HastRoot = {
    type: 'root',
    children,
  };

  return hastRoot;
}

/**
 * Build container hast element using hastscript
 */
export function buildContainerHast(classes: string[], children: ASTNode[]): Element {
  // Convert children to hast nodes
  const hastChildren = processChildren(children);
  
  // Build container div with classes
  return h('div', { className: classes }, hastChildren);
}

/**
 * Convert hast to HTML string using rehype-stringify
 */
export function hastToHTML(hast: HastRoot): string {
  const processor = unified().use(rehypeStringify, {
    // Disable pretty-printing to preserve code block formatting
    allowDangerousHtml: false,
    closeSelfClosing: true,
    closeEmptyElements: true,
    tightSelfClosing: true,
    entities: { useNamedReferences: true },
    // Most importantly: don't add extra whitespace/indentation
    indent: '',
    newline: ''
  });
  return processor.stringify(hast);
}

/**
 * Convert slide AST to hast and then to HTML
 */
export function convertSlideToHast(slide: ASTSlide): { html: string; css: string } {
  // Convert AST to hast
  const hast = astToHast(slide.ast);
  
  // Convert hast to HTML
  const html = hastToHTML(hast);
  
  
  // Apply CSS scoping
  const css = applyStyles(slide.slideCSS, slide.index);
  
  return { html, css };
}

/**
 * Apply CSS scoping to slide styles
 */
export function applyStyles(css: string, slideIndex: number): string {
  if (!css || css.trim().length === 0) {
    return '';
  }

  // Scope CSS to specific slide using nth-child selector
  return scopeStyles(css, slideIndex);
}

/**
 * Scope CSS rules to a specific slide
 */
export function scopeStyles(css: string, slideIndex: number): string {
  // Simple CSS scoping - prepend slide selector to each rule
  // This is a basic implementation that handles common cases
  const slideSelector = `.curtains-slide:nth-child(${slideIndex + 1})`;
  
  // First, preserve comments by removing them and storing separately
  const comments: string[] = [];
  let commentIndex = 0;
  const cssWithoutComments = css.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    comments.push(match);
    return `___COMMENT_${commentIndex++}___`;
  });
  
  // Handle @-rules separately (they can contain nested braces)
  const globalRuleRegex = /(@[^{]+\{[^{}]*(?:\{[^}]*\}[^{}]*)*\})/g;
  const globalRules: string[] = [];
  const cssWithoutGlobals = cssWithoutComments.replace(globalRuleRegex, (match) => {
    globalRules.push(match);
    return '___GLOBAL_RULE___';
  });
  
  // Split remaining CSS into rules
  const rules = cssWithoutGlobals.split('}').filter(rule => rule.trim());
  
  let globalRuleIndex = 0;
  const scopedRules = rules.map(rule => {
    const trimmedRule = rule.trim();
    if (!trimmedRule) return '';
    
    // Check if this is a placeholder for a global rule
    if (trimmedRule === '___GLOBAL_RULE___') {
      const globalRule = globalRules[globalRuleIndex];
      globalRuleIndex++;
      return globalRule ?? '';
    }
    
    // Restore comments in the rule
    let restoredRule = trimmedRule;
    for (let i = 0; i < comments.length; i++) {
      restoredRule = restoredRule.replace(`___COMMENT_${i}___`, comments[i] ?? '');
    }
    
    // Find the selector and body (after restoring comments)
    const selectorMatch = restoredRule.match(/^([^{]+)\{(.*)$/s);
    if (!selectorMatch) return restoredRule + '}';
    
    const selector = selectorMatch[1]?.trim();
    const body = selectorMatch[2]?.trim();
    
    if (!selector || !body) return restoredRule + '}';
    
    // Remove comments from selector for processing
    const cleanSelector = selector.replace(/\/\*[\s\S]*?\*\//g, '').trim();
    
    // Scope the selector
    const scopedSelector = cleanSelector
      .split(',')
      .map(s => {
        const trimmed = s.trim();
        // Don't scope :root or html/body selectors
        if (trimmed === ':root' || trimmed === 'html' || trimmed === 'body') {
          return `${slideSelector}`;
        }
        return `${slideSelector} ${trimmed}`;
      })
      .join(', ');
    
    return `${scopedSelector} {\n  ${body}\n}`;
  });
  
  return scopedRules.join('\n');
}

/**
 * Check if a CSS rule is global (shouldn't be scoped)
 */
export function isGlobalRule(rule: string): boolean {
  const globalPrefixes = ['@keyframes', '@media', '@supports', '@font-face', '@import'];
  return globalPrefixes.some(prefix => rule.startsWith(prefix));
}

/**
 * Process link attributes for external links
 */
export function processLink(url: string): { target?: string; rel?: string } {
  // Check if external link
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return {
      target: '_blank',
      rel: 'noopener noreferrer',
    };
  }
  return {};
}

/**
 * Transform table with proper thead/tbody structure
 * Pure function that creates proper table HTML structure
 */
export function transformTable(node: ASTNode): Element {
  if (node.type !== 'table' || !('children' in node)) {
    return h('table');
  }

  const rows = node.children.filter(child => child.type === 'tableRow');
  if (rows.length === 0) {
    return h('table');
  }
  
  // Extract alignment information from table node
  const alignments: (('left' | 'center' | 'right') | null)[] = [];
  if ('align' in node && Array.isArray(node.align)) {
    alignments.push(...node.align);
  }

  // First row is typically the header
  const headerRow = rows[0];
  const bodyRows = rows.slice(1);

  const thead = createTableHeader(headerRow, alignments);
  const tbody = createTableBody(bodyRows, alignments);

  return h('table', [thead, tbody]);
}

/**
 * Create table header with th elements
 * Pure function that transforms header row
 */
export function createTableHeader(
  headerRow: ASTNode | undefined, 
  alignments: (('left' | 'center' | 'right') | null)[]
): Element {
  if (!headerRow || headerRow.type !== 'tableRow' || !('children' in headerRow)) {
    return h('thead');
  }

  const headerCells = headerRow.children.map((cell, index) => {
    if (cell.type === 'tableCell' && 'children' in cell) {
      const children = processChildren(cell.children);
      const alignment = alignments[index];
      const props: Record<string, string> = {};
      
      if (alignment) {
        props.style = `text-align: ${alignment}`;
      }
      
      return h('th', props, children);
    }
    return h('th');
  });

  const tr = h('tr', headerCells);
  return h('thead', [tr]);
}

/**
 * Create table body with td elements
 * Pure function that transforms body rows
 */
export function createTableBody(
  bodyRows: ASTNode[], 
  alignments: (('left' | 'center' | 'right') | null)[]
): Element {
  const rows = bodyRows
    .filter(row => row.type === 'tableRow' && 'children' in row)
    .map(row => {
      const cells = ('children' in row ? row.children : [])
        .filter(cell => cell.type === 'tableCell')
        .map((cell, index) => {
          if ('children' in cell) {
            const children = processChildren(cell.children);
            const alignment = alignments[index];
            const props: Record<string, string> = {};
            
            if (alignment) {
              props.style = `text-align: ${alignment}`;
            }
            
            return h('td', props, children);
          }
          return h('td');
        });
      return h('tr', cells);
    });

  return h('tbody', rows);
}

/**
 * Conditionally wrap content in .curtains-content div
 * Skip wrapping if the content starts with a hero container
 * For columns containers, wrap everything together in a single curtains-content div
 */
export function wrapInContentDiv(html: string): string {
  // Check if the HTML starts with a hero div
  const heroPattern = /^\s*<div class="[^"]*\bhero\b[^"]*">/;
  if (heroPattern.test(html)) {
    // Don't wrap hero containers
    return html;
  }
  
  // For all other content (including columns), wrap in a single curtains-content div
  // This ensures proper nesting and prevents broken HTML structure
  return `<div class="curtains-content">${html}</div>`;
}

/**
 * Main transform stage function
 */
export function transformStage(doc: CurtainsDocument): z.infer<typeof TransformedDocumentSchema> {
  // Transform each slide
  const transformedSlides = doc.slides.map(slide => {
    const { html, css } = convertSlideToHast(slide);
    const wrappedHtml = wrapInContentDiv(html);
    
    return TransformedSlideSchema.parse({
      html: wrappedHtml,
      css,
    });
  });
  
  // Return transformed document
  return TransformedDocumentSchema.parse({
    slides: transformedSlides,
    globalCSS: doc.globalCSS ?? '',
  });
}