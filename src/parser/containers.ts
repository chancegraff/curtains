import { z } from 'zod'
import {
  CurtainsASTSchema,
  ContainerNodeSchema,
  TextNodeSchema,
  HeadingNodeSchema,
  ParagraphNodeSchema,
  ListNodeSchema,
  ListItemNodeSchema,
  LinkNodeSchema,
  ImageNodeSchema,
  CodeNodeSchema,
  TableNodeSchema,
  TableRowNodeSchema,
  TableCellNodeSchema
} from '../ast/schemas.js'
import type { ContainerNode, ASTNode } from '../ast/types.js'
import { validateClassName, validateNestingDepth } from './validate.js'
import { parseMarkdown } from './markdown.js'

// Type for markdown nodes from the parser
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
  classes?: string[]
  start?: number
  spread?: boolean
  bold?: boolean
  header?: boolean
  align?: 'left' | 'center' | 'right'
}

export interface ContainerParseResult {
  marked: string
  containers: Map<string, ContainerNode>
}

/**
 * Dedents content by removing common leading whitespace and cleans HTML div tags
 * @param content - The content to dedent and clean
 * @returns Cleaned and dedented content
 */
function dedentContent(content: string): string {
  // First, remove HTML div tags that interfere with markdown parsing
  let cleanedContent = content
    .replace(/<\/?div[^>]*>/gi, '') // Remove all div tags (opening and closing)
    .replace(/^\s*\n/, '') // Remove leading empty line
    .replace(/\n\s*$/, '') // Remove trailing empty line
  
  const lines = cleanedContent.split('\n')
  
  // Find non-empty lines to determine minimum indentation
  const nonEmptyLines = lines.filter(line => line.trim().length > 0)
  if (nonEmptyLines.length === 0) {
    return cleanedContent
  }
  
  // Find minimum indentation level
  const minIndent = Math.min(...nonEmptyLines.map(line => {
    const match = line.match(/^(\s*)/)
    return match && match[1] ? match[1].length : 0
  }))
  
  // Remove the minimum indentation from all lines
  if (minIndent > 0) {
    cleanedContent = lines.map(line => {
      if (line.trim().length === 0) {
        return line // Keep empty lines as-is
      }
      return line.substring(minIndent)
    }).join('\n')
  }
  
  return cleanedContent
}

/**
 * Parses container tags in content and returns marked content with container placeholders
 * @param content - The content containing container tags
 * @returns Object with marked content and container map
 */
export function parseContainers(content: string): ContainerParseResult {
  const containers = new Map<string, ContainerNode>()
  let counter = 0
  
  // Expand inline nested containers to multi-line format for easier processing
  function expandInlineContainers(text: string): string {
    // Convert <container> tags to separate lines for proper nesting detection
    return text
      .replace(/<container\s+class="([^"]*)">(?!\s*$)/g, '<container class="$1">\n')
      .replace(/<\/container>/g, '\n</container>')
  }
  
  // First, expand any inline containers to multi-line format
  const expandedContent = expandInlineContainers(content)
  
  // Now, handle all containers using line-by-line parsing
  const lines = expandedContent.split('\n')
  const result: string[] = []
  const multiLineContainerStack: Array<{
    id: string
    classes: string[]
    contentLines: string[]
    depth: number
  }> = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    const trimmedLine = line.trim()
    
    // Check for container opening tag (standalone line)
    const openMatch = trimmedLine.match(/^<container\s+class="([^"]*)">\s*$/)
    if (openMatch) {
      const classesStr = openMatch[1] ?? ''
      const classArray = classesStr.split(/\s+/).filter(Boolean)
      
      // Validate classes
      classArray.forEach((cls: string) => {
        validateClassName(cls)
      })
      
      const depth = multiLineContainerStack.length + 1
      
      // Check nesting depth
      validateNestingDepth(depth)
      
      const id = `container_${counter++}`
      multiLineContainerStack.push({
        id,
        classes: classArray,
        contentLines: [],
        depth
      })
      continue
    }
    
    // Check for container closing tag (standalone line)
    if (trimmedLine === '</container>') {
      if (multiLineContainerStack.length === 0) {
        // Orphaned closing tag, treat as regular content
        result.push(line)
        continue
      }
      
      const container = multiLineContainerStack.pop()
      if (!container) continue
      
      // Process the container content recursively
      const innerContent = dedentContent(container.contentLines.join('\n'))
      const { marked: innerProcessed } = parseContainers(innerContent)
      
      // Create container node
      const node = ContainerNodeSchema.parse({
        type: 'container',
        classes: container.classes,
        children: [] // Will be populated in buildAST
      })
      
      containers.set(container.id, node)
      
      // Create placeholder for this container
      const placeholder = `{{CONTAINER:${container.id}:${innerProcessed}}}`
      
      if (multiLineContainerStack.length === 0) {
        result.push(placeholder)
      } else {
        multiLineContainerStack[multiLineContainerStack.length - 1]?.contentLines.push(placeholder)
      }
      continue
    }
    
    // Regular content line
    if (multiLineContainerStack.length === 0) {
      result.push(line)
    } else {
      multiLineContainerStack[multiLineContainerStack.length - 1]?.contentLines.push(line)
    }
  }
  
  // Handle any unclosed containers by treating their content as regular text
  while (multiLineContainerStack.length > 0) {
    const container = multiLineContainerStack.pop()
    if (container) {
      // Add the opening tag back as text
      result.push(`<container class="${container.classes.join(' ')}">`)
      result.push(...container.contentLines)
    }
  }
  
  const marked = result.join('\n')
  
  return { marked, containers }
}

/**
 * Builds an AST from markdown AST and container information
 * @param mdast - The markdown AST from parseMarkdown
 * @param containers - Map of container nodes
 * @returns Complete AST with containers resolved
 */
export function buildAST(
  mdast: ReturnType<typeof parseMarkdown>,
  containers: Map<string, ContainerNode>
): z.infer<typeof CurtainsASTSchema> {
  
  function convertNode(node: MarkdownNode): ASTNode | ASTNode[] {
    switch (node.type) {
      case 'text':
        return TextNodeSchema.parse({
          type: 'text',
          value: node.value,
          bold: node.bold
        })
      
      case 'heading':
        return HeadingNodeSchema.parse({
          type: 'heading',
          depth: node.depth,
          children: node.children ? node.children.flatMap((child: MarkdownNode) => convertNode(child)) : []
        })
      
      case 'paragraph':
        // Check if this paragraph contains container placeholders
        if (node.children && node.children.length === 1 && node.children[0]) {
          const firstChild = node.children[0]
          if (firstChild.type === 'text' && 
              (firstChild.value?.includes('{{CONTAINER:') === true)) {
          
            const text = firstChild.value
          
          // Use the same sophisticated matching as in parseBasicMarkdown
          function extractSingleContainerPlaceholder(text: string): { id: string; content: string } | null {
            const start = text.indexOf('{{CONTAINER:')
            if (start !== 0) return null // Must start with placeholder
            
            let braceCount = 1 // Start with 1 to account for the opening {{
            let end = start + 12 // length of '{{CONTAINER:'
            
            // Extract container ID (find first colon after CONTAINER:)
            const idStart = end
            while (end < text.length && text[end] !== ':') {
              end++
            }
            if (end >= text.length) return null
            
            const containerId = text.substring(idStart, end)
            end++ // Skip the colon
            
            // Now count braces to find the matching closing }}
            while (end < text.length) {
              if (text.substring(end, end + 2) === '{{') {
                braceCount++
                end += 2
              } else if (text.substring(end, end + 2) === '}}') {
                braceCount--
                if (braceCount === 0) {
                  // This is our closing brace
                  const content = text.substring(idStart + containerId.length + 1, end)
                  return { id: containerId, content }
                } else {
                  end += 2
                }
              } else {
                end++
              }
            }
            
            return null
          }
          
          const containerMatch = extractSingleContainerPlaceholder(text)
          
          if (containerMatch) {
            const { id: containerId, content: innerContent } = containerMatch
            const containerNode = containers.get(containerId)
            
            if (containerNode) {
              // Parse inner content as markdown
              const innerMdast = parseMarkdown(innerContent)
              const innerAST = innerMdast.children ? 
                innerMdast.children.flatMap((child: MarkdownNode) => convertNode(child)) : []
              
              return ContainerNodeSchema.parse({
                type: 'container',
                classes: containerNode.classes,
                children: innerAST
              })
            }
          }
          }
        }
        
        return ParagraphNodeSchema.parse({
          type: 'paragraph',
          children: node.children ? node.children.flatMap((child: MarkdownNode) => convertNode(child)) : []
        })
      
      case 'list':
        return ListNodeSchema.parse({
          type: 'list',
          ordered: node.ordered ?? false,
          children: node.children ? node.children.flatMap((child: MarkdownNode) => convertNode(child)) : []
        })
      
      case 'listItem':
        return ListItemNodeSchema.parse({
          type: 'listItem',
          children: node.children ? node.children.flatMap((child: MarkdownNode) => convertNode(child)) : []
        })
      
      case 'link':
        return LinkNodeSchema.parse({
          type: 'link',
          url: node.url,
          children: node.children ? node.children.flatMap((child: MarkdownNode) => convertNode(child)) : []
        })
      
      case 'image':
        return ImageNodeSchema.parse({
          type: 'image',
          url: node.url,
          alt: node.alt,
          title: node.title,
          ...(node.classes && { classes: node.classes })
        })
      
      case 'code':
        return CodeNodeSchema.parse({
          type: 'code',
          value: node.value,
          lang: node.lang
        })
      
      case 'table':
        return TableNodeSchema.parse({
          type: 'table',
          children: node.children ? node.children.flatMap((child: MarkdownNode) => convertNode(child)) : []
        })
      
      case 'tableRow':
        return TableRowNodeSchema.parse({
          type: 'tableRow',
          children: node.children ? node.children.flatMap((child: MarkdownNode) => convertNode(child)) : []
        })
      
      case 'tableCell':
        return TableCellNodeSchema.parse({
          type: 'tableCell',
          ...(node.header !== undefined && { header: node.header }),
          ...(node.align !== undefined && { align: node.align }),
          children: node.children ? node.children.flatMap((child: MarkdownNode) => convertNode(child)) : []
        })
      
      default:
        // For unknown node types, try to extract text content if available
        if (node.value !== undefined && node.value !== null && node.value !== '') {
          return TextNodeSchema.parse({
            type: 'text',
            value: String(node.value)
          })
        }
        
        // Skip unknown nodes
        return []
    }
  }
  
  const children = mdast.children ? 
    mdast.children.flatMap((child: MarkdownNode) => convertNode(child)) : []
  
  return CurtainsASTSchema.parse({
    type: 'root',
    children
  })
}