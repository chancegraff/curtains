import type { Node as MdastNode, Root as MdastRoot } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { z } from 'zod';

import {
  type ASTNode,
  type ASTRootNode,
  type ASTSlide,
  ASTSlideSchema,
  ContainerNodeSchema,
} from '../schemas/ast';
import { type ContainerSchema, type ParsedSlide } from '../schemas/parsers';
import { dedentContent, parseMarkdownToMdast } from './parse';

// Type guards for mdast nodes
function hasDepth(node: MdastNode): node is MdastNode & { depth: number } {
  return 'depth' in node && typeof node.depth === 'number';
}

function hasChildren(node: MdastNode): node is MdastNode & { children: MdastNode[] } {
  return 'children' in node && Array.isArray(node.children);
}

function hasValue(node: MdastNode): node is MdastNode & { value: string } {
  return 'value' in node && typeof node.value === 'string';
}

function hasUrl(node: MdastNode): node is MdastNode & { url: string } {
  return 'url' in node && typeof node.url === 'string';
}

function hasLang(node: MdastNode): node is MdastNode & { value: string; lang?: string } {
  return node.type === 'code' && 'value' in node;
}

function hasAlt(node: MdastNode): node is MdastNode & { url: string; alt?: string } {
  return node.type === 'image' && 'url' in node;
}

/**
 * Build AST from parsed slide
 */
export function buildAST(slide: ParsedSlide): ASTSlide {
  // Convert mdast to custom AST nodes
  const customNodes = slide.mdast ? mdastToCustomAST(slide.mdast) : [];

  // Wrap nodes in containers if present
  const wrappedNodes = slide.containers.length > 0
    ? wrapInContainers(customNodes, slide.containers)
    : customNodes;

  // Create AST structure
  const ast: ASTRootNode = {
    type: 'root',
    children: wrappedNodes,
  };

  // Combine styles into slide CSS
  const slideCSS = slide.styles.map(s => s.content).join('\n');

  return ASTSlideSchema.parse({
    index: slide.index,
    ast,
    slideCSS,
  });
}

/**
 * Convert mdast to custom AST using unified utilities
 */
export function mdastToCustomAST(mdast: MdastRoot): ASTNode[] {
  const nodes: ASTNode[] = [];

  // Process top-level nodes
  mdast.children.forEach(child => {
    const astNode = convertMdastNode(child);
    if (astNode) {
      if (Array.isArray(astNode)) {
        nodes.push(...astNode);
      } else {
        nodes.push(astNode);
      }
    }
  });

  return nodes;
}

/**
 * Convert a single mdast node to custom AST node(s)
 */
function convertMdastNode(node: MdastNode): ASTNode | ASTNode[] | null {
  switch (node.type) {
    case 'heading':
      if (hasDepth(node) && hasChildren(node)) {
        return {
          type: 'heading',
          depth: node.depth,
          children: processInlineContent(node.children),
        };
      }
      break;

    case 'paragraph':
      if (hasChildren(node)) {
        // Check if paragraph contains only a single image (standalone image)
        if (node.children.length === 1) {
          const child = node.children[0];
          // Check for markdown image
          if (child && child.type === 'image') {
            return convertMdastNode(child);
          }
          // Check for HTML image
          if (child && child.type === 'html' && 'value' in child && typeof child.value === 'string') {
            const imgMatch = child.value.match(/<img\s+src="([^"]*)"(?:\s+[^>]*)?\s*\/?>/);
            if (imgMatch) {
              // Return image directly without paragraph wrapper
              return {
                type: 'image',
                url: imgMatch[1] ?? '',
                alt: '',
              };
            }
          }
        }
        // For all other cases, return paragraph with children
        return {
          type: 'paragraph',
          children: processInlineContent(node.children),
        };
      }
      break;

    case 'list':
      if (hasChildren(node)) {
        const listChildren: ASTNode[] = [];
        node.children.forEach(child => {
          const converted = convertMdastNode(child);
          if (converted) {
            if (Array.isArray(converted)) {
              listChildren.push(...converted);
            } else {
              listChildren.push(converted);
            }
          }
        });
        return {
          type: 'list',
          children: listChildren,
        };
      }
      break;

    case 'listItem':
      if (hasChildren(node)) {
        const itemChildren: ASTNode[] = [];
        node.children.forEach(child => {
          const converted = convertMdastNode(child);
          if (converted) {
            if (Array.isArray(converted)) {
              itemChildren.push(...converted);
            } else {
              itemChildren.push(converted);
            }
          }
        });
        return {
          type: 'listItem',
          children: itemChildren,
        };
      }
      break;

    case 'code':
      if (hasLang(node)) {
        const codeNode: ASTNode = {
          type: 'code',
          value: dedentContent(node.value),
        };
        if (node.lang) {
          codeNode.lang = node.lang;
        }
        return codeNode;
      } else if (hasValue(node)) {
        return {
          type: 'code',
          value: dedentContent(node.value),
        };
      }
      break;

    case 'text':
      if (hasValue(node)) {
        return {
          type: 'text',
          value: node.value,
        };
      }
      break;

    case 'emphasis':
      if (hasChildren(node)) {
        const textContent = toString(node);
        return {
          type: 'text',
          value: textContent,
          italic: true,
        };
      }
      break;

    case 'strong':
      if (hasChildren(node)) {
        const textContent = toString(node);
        return {
          type: 'text',
          value: textContent,
          bold: true,
        };
      }
      break;

    case 'link':
      if (hasUrl(node) && hasChildren(node)) {
        return {
          type: 'link',
          url: node.url,
          children: processInlineContent(node.children),
        };
      }
      break;

    case 'image':
      if (hasAlt(node)) {
        const imageNode: ASTNode = {
          type: 'image',
          url: node.url,
        };
        if (node.alt) {
          imageNode.alt = node.alt;
        }
        return imageNode;
      } else if (hasUrl(node)) {
        return {
          type: 'image',
          url: node.url,
        };
      }
      break;

    case 'table':
      if (hasChildren(node)) {
        return processTable(node);
      }
      break;

    case 'thematicBreak':
      return null; // Skip thematic breaks for now

    case 'blockquote':
      if (hasChildren(node)) {
        // Process blockquote children
        const children: ASTNode[] = [];
        node.children.forEach(child => {
          const converted = convertMdastNode(child);
          if (converted) {
            if (Array.isArray(converted)) {
              children.push(...converted);
            } else {
              children.push(converted);
            }
          }
        });
        return children;
      }
      break;

    case 'html':
      // Handle HTML nodes - parse container tags
      if ('value' in node && typeof node.value === 'string') {
        const html = node.value;
        
        // Check if it's a container tag
        const containerMatch = html.match(/<container(?:\s+class="([^"]*)")?>$/);
        if (containerMatch) {
          // This is an opening container tag - we'll handle it specially
          // For now, return null and let the container processing handle it
          return null;
        }
        
        // Check for closing container tag
        if (html === '</container>') {
          return null;
        }
        
        // For other HTML like img tags, parse and handle appropriately
        const imgMatch = html.match(/<img\s+src="([^"]*)"(?:\s+width="([^"]*)")?(?:\s+[^>]*)?\s*\/?>/);
        if (imgMatch) {
          // Return image directly without paragraph wrapper
          const imageNode: ASTNode = {
            type: 'image',
            url: imgMatch[1] ?? '',
            alt: '',
          };
          
          return imageNode;
        }
        
        // For other HTML, return null to skip it
        return null;
      }
      break;

    default: {
      // For unknown node types, try to extract text content
      const textContent = toString(node);
      if (textContent) {
        return {
          type: 'text',
          value: textContent,
        };
      }
      break;
    }
  }
  
  return null;
}

/**
 * Process inline content (text, emphasis, strong, etc.)
 */
export function processInlineContent(nodes: MdastNode[]): ASTNode[] {
  const result: ASTNode[] = [];

  nodes.forEach(node => {
    if (node.type === 'text' && hasValue(node)) {
      result.push({
        type: 'text',
        value: node.value,
      });
    } else if (node.type === 'emphasis' && hasChildren(node)) {
      const textContent = toString(node);
      result.push({
        type: 'text',
        value: textContent,
        italic: true,
      });
    } else if (node.type === 'strong' && hasChildren(node)) {
      const textContent = toString(node);
      result.push({
        type: 'text',
        value: textContent,
        bold: true,
      });
    } else if (node.type === 'inlineCode' && hasValue(node)) {
      result.push({
        type: 'text',
        value: node.value,
        // Could add a 'code' property to distinguish inline code
      });
    } else {
      // For other inline types, convert and add
      const converted = convertMdastNode(node);
      if (converted) {
        if (Array.isArray(converted)) {
          result.push(...converted);
        } else {
          result.push(converted);
        }
      }
    }
  });

  return result;
}

/**
 * Wrap nodes in containers
 */
export function wrapInContainers(
  nodes: ASTNode[],
  containers: z.infer<typeof ContainerSchema>[]
): ASTNode[] {
  // If no containers, return nodes as-is
  if (containers.length === 0) return nodes;

  // Process each container and parse its content
  const containerNodes: ASTNode[] = [];
  
  for (const container of containers) {
    // First, check if the container content has nested containers
    const { containers: nestedContainers, cleaned: cleanedContent } = extractNestedContainers(container.content);
    
    // Parse the cleaned markdown content (without nested containers) to mdast
    const containerMdast = parseMarkdownToMdast(cleanedContent);
    
    // Convert mdast to custom AST nodes
    let containerChildren = mdastToCustomAST(containerMdast);
    
    // If there are nested containers, process them recursively
    if (nestedContainers.length > 0) {
      const nestedNodes = wrapInContainers([], nestedContainers);
      // Combine nested container nodes with other children  
      // Place nested containers first, then other content
      containerChildren = [...nestedNodes, ...containerChildren];
    }
    
    // Create container node with parsed children
    containerNodes.push(
      ContainerNodeSchema.parse({
        type: 'container',
        classes: container.classes,
        children: containerChildren,
      })
    );
  }
  
  // If there are both containers and regular nodes, combine them
  // Containers typically wrap all content, so return just containers if present
  if (containerNodes.length > 0 && nodes.length === 0) {
    return containerNodes;
  }
  
  // If we have both containers and nodes, containers should come after regular content
  // (e.g., heading followed by columns container)
  return [...nodes, ...containerNodes];
}

/**
 * Extract nested containers from content
 * This is a helper function for handling nested containers within containers
 */
function extractNestedContainers(content: string): {
  containers: z.infer<typeof ContainerSchema>[];
  cleaned: string;
} {
  const containers: z.infer<typeof ContainerSchema>[] = [];
  let cleaned = content;
  
  // Keep extracting containers until none are left
  while (true) {
    const containerStartRegex = /<container(?:\s+class="([^"]+)")?>/i;
    const containerMatch = containerStartRegex.exec(cleaned);
    
    if (!containerMatch) {
      break; // No more containers
    }
    
    const startIndex = containerMatch.index;
    const classesStr = containerMatch[1];
    
    // Find the matching closing tag by counting open/close tags
    let depth = 1;
    let currentIndex = startIndex + containerMatch[0].length;
    let endIndex = -1;
    
    while (depth > 0 && currentIndex < cleaned.length) {
      const remainingContent = cleaned.substring(currentIndex);
      const openMatch = /<container(?:\s+[^>]*)?>/.exec(remainingContent);
      const closeMatch = /<\/container>/.exec(remainingContent);
      
      // Find which comes first
      const openIndex = openMatch ? openMatch.index : cleaned.length;
      const closeIndex = closeMatch ? closeMatch.index : cleaned.length;
      
      if (closeIndex < openIndex) {
        // Found a closing tag first
        depth--;
        currentIndex += closeIndex + (closeMatch ? closeMatch[0].length : 0);
        if (depth === 0) {
          endIndex = currentIndex;
        }
      } else if (openIndex < cleaned.length) {
        // Found an opening tag first
        depth++;
        currentIndex += openIndex + (openMatch ? openMatch[0].length : 0);
      } else {
        // No more tags found
        break;
      }
    }
    
    if (endIndex > 0) {
      // Extract the content between the matched tags
      const containerContent = cleaned.substring(startIndex + containerMatch[0].length, endIndex - '</container>'.length);
      
      const classes = classesStr ? classesStr.trim().split(/\s+/).filter(c => c.length > 0) : [];
      // Dedent and trim the content to handle indentation issues
      const dedentedContent = dedentContent(containerContent);
      const trimmedContent = dedentedContent ? dedentedContent.trim() : '';
      
      containers.push({
        tag: 'container',
        classes,
        content: trimmedContent,
      });
      
      // Remove this container from cleaned content
      cleaned = cleaned.substring(0, startIndex) + cleaned.substring(endIndex);
    } else {
      // Couldn't find matching closing tag, break to avoid infinite loop
      break;
    }
  }
  
  return {
    containers,
    cleaned,
  };
}

/**
 * Process table structure
 */
export function processTable(tableNodeParam: MdastNode & { children: MdastNode[] }): ASTNode {
  const rows: ASTNode[] = [];
  
  // Extract alignment information if present
  const alignments: (('left' | 'center' | 'right') | null)[] = [];
  if ('align' in tableNodeParam && Array.isArray(tableNodeParam.align)) {
    alignments.push(...tableNodeParam.align);
  }

  tableNodeParam.children.forEach(child => {
    if (child.type === 'tableRow' && hasChildren(child)) {
      const cells: ASTNode[] = [];

      child.children.forEach((cell, cellIndex) => {
        if (cell.type === 'tableCell' && hasChildren(cell)) {
          const cellAlign = alignments[cellIndex] ?? null;
          cells.push({
            type: 'tableCell',
            children: processInlineContent(cell.children),
            align: cellAlign,
          });
        }
      });

      rows.push({
        type: 'tableRow',
        children: cells,
      });
    }
  });

  const table: ASTNode = {
    type: 'table',
    children: rows,
    align: alignments.length > 0 ? alignments : undefined,
  };
  
  return table;
}

/**
 * Process text formatting - extract bold/italic from nested structures
 */
export function processTextFormatting(node: ASTNode): ASTNode {
  // This is primarily for text nodes that might have formatting
  if (node.type === 'text') {
    return node; // Already processed
  }

  // For other nodes with children, recursively process
  if ('children' in node && Array.isArray(node.children)) {
    return {
      ...node,
      children: node.children.map(child => processTextFormatting(child)),
    };
  }

  return node;
}

/**
 * Sanitize HTML attributes
 */
export function sanitizeAttributes(
  attributes: Record<string, string | number | boolean>
): Record<string, string> {
  const allowed = ['class', 'id', 'href', 'src', 'alt', 'title', 'target', 'rel'];
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (allowed.includes(key.toLowerCase())) {
      sanitized[key] = String(value);
    }
  }

  return sanitized;
}