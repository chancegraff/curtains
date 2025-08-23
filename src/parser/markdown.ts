// Markdown parser implementation using remark/unified ecosystem
// Provides clean markdown parsing without container handling (containers are handled separately)

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'

// Type for markdown nodes
interface MarkdownNode {
  type: string
  value?: string
  depth?: number
  children?: MarkdownNode[]
  url?: string
  alt?: string
  title?: string
  lang?: string
  meta?: string
  ordered?: boolean
  italic?: boolean
  bold?: boolean
  start?: number
  spread?: boolean
  classes?: string[]
}

/**
 * Sanitizes HTML img tag attributes, allowing only src, alt, and class attributes
 * @param imgTagMatch - The full img tag match from regex
 * @returns Object with sanitized attributes
 */
function sanitizeImgAttributes(imgTagMatch: string): { src: string; alt: string; classes?: string[] } {
  const result: { src: string; alt: string; classes?: string[] } = { src: '', alt: '' }
  
  // Extract src attribute
  const srcMatch = imgTagMatch.match(/\bsrc\s*=\s*["']([^"']*)["']/i)
  if (srcMatch) {
    result.src = srcMatch[1] ?? ''
  }
  
  // Extract alt attribute
  const altMatch = imgTagMatch.match(/\balt\s*=\s*["']([^"']*)["']/i)
  if (altMatch) {
    result.alt = altMatch[1] ?? ''
  }
  
  // Extract class attribute
  const classMatch = imgTagMatch.match(/\bclass\s*=\s*["']([^"']*)["']/i)
  if (classMatch) {
    const classStr = classMatch[1] ?? ''
    const classes = classStr.split(/\s+/).filter(Boolean)
    if (classes.length > 0) {
      result.classes = classes
    }
  }
  
  return result
}

/**
 * Custom remark plugin to handle HTML img tags
 */
function remarkCurtainsPlugin() {
  return function transformer(tree: any) {
    visit(tree, handleNode)
  }

  function visit(node: any, handler: (node: any, parent?: any) => void) {
    handler(node)
    if (node.children) {
      for (const child of node.children) {
        child.parent = node // Set parent reference
        visit(child, handler)
      }
    }
  }

  function handleNode(node: any) {
    // Handle HTML img tags in both text and html nodes
    if ((node.type === 'text' || node.type === 'html') && node.value) {
      const htmlImgPattern = /<img[^>]*>/gi
      let match
      let lastIndex = 0
      const newNodes: any[] = []
      
      while ((match = htmlImgPattern.exec(node.value)) !== null) {
        // Add text before img tag
        if (match.index > lastIndex) {
          const beforeText = node.value.substring(lastIndex, match.index)
          if (beforeText.trim()) {
            newNodes.push({ type: 'text', value: beforeText })
          }
        }
        
        // Add img node
        const sanitized = sanitizeImgAttributes(match[0])
        const imgNode: any = {
          type: 'image',
          url: sanitized.src,
          alt: sanitized.alt
        }
        if (sanitized.classes && sanitized.classes.length > 0) {
          imgNode.classes = sanitized.classes
        }
        newNodes.push(imgNode)
        
        lastIndex = match.index + match[0].length
      }
      
      // If we found HTML img tags, replace the text node
      if (newNodes.length > 0) {
        // Add remaining text
        if (lastIndex < node.value.length) {
          const remainingText = node.value.substring(lastIndex)
          if (remainingText.trim()) {
            newNodes.push({ type: 'text', value: remainingText })
          }
        }
        
        // Replace in parent
        if (node.parent?.children) {
          const nodeIndex = node.parent.children.indexOf(node)
          if (nodeIndex !== -1) {
            node.parent.children.splice(nodeIndex, 1, ...newNodes)
          }
        }
      }
    }
  }
}

/**
 * Converts mdast node to our MarkdownNode format
 */
function convertMdastNode(node: any): MarkdownNode {
  const result: MarkdownNode = {
    type: node.type
  }
  
  // Handle specific node types
  switch (node.type) {
    case 'root':
      result.children = node.children?.map(convertMdastNode).filter(Boolean) ?? []
      break
      
    case 'heading':
      result.depth = node.depth
      result.children = node.children?.map(convertMdastNode) ?? []
      break
      
    case 'paragraph':
      result.children = node.children?.map(convertMdastNode) ?? []
      // If paragraph contains only a single image, return just the image for backwards compatibility
      if (result.children && result.children.length === 1 && result.children[0]?.type === 'image') {
        return result.children[0]
      }
      break
      
    case 'text':
      result.value = node.value
      break
      
    case 'strong':
      // Convert strong to text with bold flag for compatibility
      if (node.children && node.children.length === 1 && node.children[0].type === 'text') {
        result.type = 'text'
        result.value = node.children[0].value
        result.bold = true
      } else {
        result.children = node.children?.map(convertMdastNode) ?? []
      }
      break
      
    case 'emphasis':
      // Handle emphasis by extracting text and marking as italic
      if (node.children && node.children.length === 1 && node.children[0].type === 'text') {
        // Single text child - convert to italic text node
        result.type = 'text'
        result.value = node.children[0].value
        result.italic = true
      } else {
        // Multiple children - need to handle recursively
        result.type = 'paragraph'
        result.children = node.children?.map((child: any) => {
          if (child.type === 'text') {
            return {
              type: 'text',
              value: child.value,
              italic: true
            }
          }
          const converted = convertMdastNode(child)
          // Mark nested text nodes as italic
          if (converted.type === 'text') {
            converted.italic = true
          }
          return converted
        }) ?? []
      }
      break
      
    case 'link':
      result.url = node.url
      result.children = node.children?.map(convertMdastNode) ?? []
      break
      
    case 'image':
      result.url = node.url
      result.alt = node.alt || ''
      if (node.classes) {
        result.classes = node.classes
      }
      break
      
    case 'list':
      result.ordered = node.ordered || false
      result.children = node.children?.map(convertMdastNode) ?? []
      break
      
    case 'listItem':
      result.children = node.children?.map(convertMdastNode) ?? []
      break
      
    case 'code':
      result.value = node.value
      if (node.lang) {
        result.lang = node.lang
      }
      break
      
    case 'table':
      // Transfer alignment from table to cells
      const tableAlign = node.align as ('left' | 'center' | 'right')[] | undefined
      result.children = node.children?.map((rowNode: any) => {
        if (rowNode.type === 'tableRow') {
          const convertedRow = convertMdastNode(rowNode)
          // Apply alignment to cells in this row
          if (convertedRow.children && tableAlign) {
            convertedRow.children = convertedRow.children.map((cell: any, index: number) => {
              if (cell.type === 'tableCell' && tableAlign[index]) {
                cell.align = tableAlign[index]
              }
              return cell
            })
          }
          return convertedRow
        }
        return convertMdastNode(rowNode)
      }) ?? []
      break
      
    case 'tableRow':
      result.children = node.children?.map(convertMdastNode) ?? []
      break
      
    case 'tableCell':
      result.children = node.children?.map(convertMdastNode) ?? []
      // Handle table cell properties from mdast
      if (node.align) {
        (result as any).align = node.align
      }
      // For GFM tables, first row cells are typically headers
      // This is handled by the table processing logic
      break
      
    default:
      // For unknown nodes, try to preserve children
      if (node.children) {
        result.children = node.children.map(convertMdastNode)
      }
      if (node.value !== undefined) {
        result.value = node.value
      }
      break
  }
  
  return result
}

/**
 * Processes markdown with remark and converts to our AST format
 */
function parseWithRemark(content: string): MarkdownNode {
  let processedContent = content
  
  // Skip container closing tags - these are handled by the container parser
  processedContent = processedContent.replace(/^\s*<\/container>\s*$/gm, '')
  
  // Handle standalone HTML img tags on their own lines
  processedContent = processedContent.replace(/^\s*(<img[^>]*>)\s*$/gm, (_match, imgTag) => {
    // Keep as HTML for our plugin to handle instead of converting to markdown
    return imgTag
  })
  
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm) // Add GFM support for tables
    .use(remarkCurtainsPlugin)
  
  const tree = processor.parse(processedContent)
  const transformedTree = processor.runSync(tree)
  
  // Post-process for table headers (GFM tables need special handling)
  const result = convertMdastNode(transformedTree)
  return postProcessTables(result)
}

/**
 * Post-processes tables to ensure proper header detection
 */
function postProcessTables(node: MarkdownNode): MarkdownNode {
  if (node.type === 'table' && node.children && node.children.length > 0) {
    // Mark first row cells as headers if they aren't already
    const firstRow = node.children[0]
    if (firstRow && firstRow.type === 'tableRow' && firstRow.children) {
      for (const cell of firstRow.children) {
        if (cell.type === 'tableCell') {
          (cell as any).header = true
        }
      }
    }
    
    // Process all table cells to ensure empty cells have proper structure
    for (const row of node.children) {
      if (row && row.type === 'tableRow' && row.children) {
        for (const cell of row.children) {
          if (cell && cell.type === 'tableCell') {
            // Ensure empty cells have at least one text node with empty value
            if (!cell.children || cell.children.length === 0) {
              cell.children = [{ type: 'text', value: '' }]
            }
          }
        }
      }
    }
  }
  
  // Recursively process children
  if (node.children) {
    node.children = node.children.map(postProcessTables)
  }
  
  return node
}



/**
 * Legacy function kept for compatibility - now delegates to remark-based parser
 */
export function parseBasicMarkdown(content: string): MarkdownNode {
  return parseWithRemark(content)
}

/**
 * Legacy inline text parser - kept for backwards compatibility only
 * New implementation uses remark's built-in text processing
 */
export function parseInlineText(text: string): MarkdownNode[] {
  // Legacy implementation - kept for backwards compatibility
  // New remark-based parser handles inline formatting automatically
  return [{ type: 'text', value: text }]
}

/**
 * Parses markdown content into an AST structure
 * @param content - The markdown content to parse
 * @returns AST representation of the markdown
 */
export function parseMarkdown(content: string): MarkdownNode {
  // Use remark-based parser
  return parseWithRemark(content)
}