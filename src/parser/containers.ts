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
import type { ASTNode, TextNode } from '../ast/types.js'
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
  italic?: boolean
  header?: boolean
  align?: 'left' | 'center' | 'right'
}

export interface ContainerParseResult {
  ast: ASTNode[]
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
    const matchedWhitespace = match?.[1]
    return matchedWhitespace !== undefined ? matchedWhitespace.length : 0
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
 * Parses container tags in content and returns AST nodes directly
 * @param content - The content containing container tags
 * @returns Object with parsed AST nodes
 */
export function parseContainers(content: string): ContainerParseResult {
  // Expand inline nested containers to multi-line format for easier processing
  function expandInlineContainers(text: string): string {
    // Convert <container> tags to separate lines for proper nesting detection
    return text
      .replace(/<container\s+class="([^"]*)">(?!\s*$)/g, '<container class="$1">\n')
      .replace(/<container>(?!\s*$)/g, '<container>\n')
      .replace(/<\/container>/g, '\n</container>')
  }
  
  // First, expand any inline containers to multi-line format
  const expandedContent = expandInlineContainers(content)
  
  // Split content into blocks
  const blocks = parseContentIntoBlocks(expandedContent)
  
  // Process blocks into AST nodes
  return { ast: processBlocks(blocks) }
}

/**
 * Represents different types of content blocks
 */
type ContentBlock = {
  type: 'container'
  classes: string[]
  content: string
  depth: number
} | {
  type: 'content'
  content: string
}

/**
 * Parses content into blocks (containers and regular content)
 */
function parseContentIntoBlocks(content: string): ContentBlock[] {
  const lines = content.split('\n')
  const blocks: ContentBlock[] = []
  const containerStack: Array<{
    classes: string[]
    contentLines: string[]
    depth: number
  }> = []
  
  let currentContentLines: string[] = []
  
  // Helper to flush current content
  const flushCurrentContent = (): void => {
    if (currentContentLines.length > 0) {
      const contentText = currentContentLines.join('\n').trim()
      if (contentText) {
        blocks.push({ type: 'content', content: contentText })
      }
      currentContentLines = []
    }
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    const trimmedLine = line.trim()
    
    // Check for container opening tag
    const openMatchWithClass = trimmedLine.match(/^<container\s+class="([^"]*)">\s*$/)
    const openMatchNoClass = trimmedLine.match(/^<container>\s*$/)
    
    if (openMatchWithClass || openMatchNoClass) {
      const classesStr = openMatchWithClass?.[1] ?? ''
      const classArray = classesStr.split(/\s+/).filter(Boolean)
      
      // Validate classes
      classArray.forEach((cls: string) => {
        validateClassName(cls)
      })
      
      const depth = containerStack.length + 1
      
      // Check nesting depth
      validateNestingDepth(depth)
      
      // If we're not in a container, flush current content first
      if (containerStack.length === 0) {
        flushCurrentContent()
      }
      
      containerStack.push({
        classes: classArray,
        contentLines: [],
        depth
      })
      continue
    }
    
    // Check for container closing tag
    if (trimmedLine === '</container>') {
      if (containerStack.length === 0) {
        // Orphaned closing tag, treat as regular content
        currentContentLines.push(line)
        continue
      }
      
      const container = containerStack.pop()
      if (!container) continue
      
      // Create container block
      const containerContent = dedentContent(container.contentLines.join('\n'))
      
      if (containerStack.length === 0) {
        // This is a root-level container
        blocks.push({
          type: 'container',
          classes: container.classes,
          content: containerContent,
          depth: container.depth
        })
      } else {
        // This container is nested, add it to parent's content
        const containerTag = container.classes.length > 0 
          ? `<container class="${container.classes.join(' ')}">`
          : '<container>'
        containerStack[containerStack.length - 1]?.contentLines.push(
          containerTag,
          ...container.contentLines.map(line => '  ' + line), // Indent nested content
          '</container>'
        )
      }
      continue
    }
    
    // Regular content line
    if (containerStack.length === 0) {
      currentContentLines.push(line)
    } else {
      containerStack[containerStack.length - 1]?.contentLines.push(line)
    }
  }
  
  // Flush any remaining content
  flushCurrentContent()
  
  // Handle any unclosed containers by treating their content as regular text
  while (containerStack.length > 0) {
    const container = containerStack.pop()
    if (container) {
      // Add the opening tag back as text and treat as regular content
      const invalidContent: string[] = []
      if (container.classes.length > 0) {
        invalidContent.push(`<container class="${container.classes.join(' ')}">`)
      } else {
        invalidContent.push('<container>')
      }
      invalidContent.push(...container.contentLines)
      
      const invalidContentText = invalidContent.join('\n').trim()
      if (invalidContentText) {
        blocks.push({ type: 'content', content: invalidContentText })
      }
    }
  }
  
  return blocks
}

/**
 * Processes content blocks into AST nodes
 */
function processBlocks(blocks: ContentBlock[]): ASTNode[] {
  const result: ASTNode[] = []
  
  for (const block of blocks) {
    if (block.type === 'container') {
      // Recursively process container content
      const innerResult = parseContainers(block.content)
      
      const containerNode: ASTNode = ContainerNodeSchema.parse({
        type: 'container',
        classes: block.classes,
        children: innerResult.ast
      })
      
      result.push(containerNode)
    } else {
      // Process regular content as markdown
      const contentNodes: ASTNode[] = parseNonContainerContent(block.content)
      result.push(...contentNodes)
    }
  }
  
  return filterEmptyNodes(result)
}

/**
 * Parses content that doesn't contain containers into AST nodes
 */
function parseNonContainerContent(content: string): ASTNode[] {
  if (!content.trim()) return []
  
  const mdast = parseMarkdown(content)
  return convertMarkdownToAST(mdast)
}

/**
 * Converts markdown AST to our AST format
 */
function convertMarkdownToAST(mdast: ReturnType<typeof parseMarkdown>): ASTNode[] {
  if (!mdast.children) return []
  const nodes: ASTNode[] = mdast.children.flatMap((child: MarkdownNode) => convertMarkdownNode(child))
  return nodes
}

/**
 * Converts a single markdown node to our AST format
 */
function convertMarkdownNode(node: MarkdownNode): ASTNode[] {
  switch (node.type) {
    case 'text': {
      const textNode: ASTNode = TextNodeSchema.parse({
        type: 'text',
        value: node.value,
        bold: node.bold,
        italic: node.italic
      })
      return [textNode]
    }
    
    case 'heading': {
      const headingNode: ASTNode = HeadingNodeSchema.parse({
        type: 'heading',
        depth: node.depth,
        children: node.children ? node.children.flatMap((child: MarkdownNode) => convertMarkdownNode(child)) : []
      })
      return [headingNode]
    }
    
    case 'paragraph': {
      const paragraphNode: ASTNode = ParagraphNodeSchema.parse({
        type: 'paragraph',
        children: node.children ? node.children.flatMap((child: MarkdownNode) => convertMarkdownNode(child)) : []
      })
      return [paragraphNode]
    }
    
    case 'list': {
      const listNode: ASTNode = ListNodeSchema.parse({
        type: 'list',
        ordered: node.ordered ?? false,
        children: node.children ? node.children.flatMap((child: MarkdownNode) => convertMarkdownNode(child)) : []
      })
      return [listNode]
    }
    
    case 'listItem': {
      const listItemNode: ASTNode = ListItemNodeSchema.parse({
        type: 'listItem',
        children: node.children ? node.children.flatMap((child: MarkdownNode) => convertMarkdownNode(child)) : []
      })
      return [listItemNode]
    }
    
    case 'link': {
      const linkNode: ASTNode = LinkNodeSchema.parse({
        type: 'link',
        url: node.url,
        children: node.children ? node.children.flatMap((child: MarkdownNode) => convertMarkdownNode(child)) : []
      })
      return [linkNode]
    }
    
    case 'image': {
      const imageNode: ASTNode = ImageNodeSchema.parse({
        type: 'image',
        url: node.url,
        alt: node.alt,
        title: node.title,
        ...(node.classes && { classes: node.classes })
      })
      return [imageNode]
    }
    
    case 'code': {
      const codeNode: ASTNode = CodeNodeSchema.parse({
        type: 'code',
        value: node.value,
        lang: node.lang
      })
      return [codeNode]
    }
    
    case 'table': {
      const tableNode: ASTNode = TableNodeSchema.parse({
        type: 'table',
        children: node.children ? node.children.flatMap((child: MarkdownNode) => convertMarkdownNode(child)) : []
      })
      return [tableNode]
    }
    
    case 'tableRow': {
      const tableRowNode: ASTNode = TableRowNodeSchema.parse({
        type: 'tableRow',
        children: node.children ? node.children.flatMap((child: MarkdownNode) => convertMarkdownNode(child)) : []
      })
      return [tableRowNode]
    }
    
    case 'tableCell': {
      const tableCellNode: ASTNode = TableCellNodeSchema.parse({
        type: 'tableCell',
        ...(node.header !== undefined && { header: node.header }),
        ...(node.align !== undefined && { align: node.align }),
        children: node.children ? node.children.flatMap((child: MarkdownNode) => convertMarkdownNode(child)) : []
      })
      return [tableCellNode]
    }
    
    default:
      // For unknown node types, try to extract text content if available
      if (node.value !== undefined && node.value !== null && node.value !== '') {
        const textNode: ASTNode = TextNodeSchema.parse({
          type: 'text',
          value: String(node.value)
        })
        return [textNode]
      }
      
      // Skip unknown nodes
      return []
  }
}

/**
 * Filters out empty nodes from the AST
 */
function filterEmptyNodes(nodes: ASTNode[]): ASTNode[] {
  const result: ASTNode[] = []
  for (const node of nodes) {
    const astNode = node as ASTNode
    if (astNode.type === 'text') {
      const textNode = astNode as TextNode
      if (textNode.value && textNode.value.trim().length > 0) {
        result.push(astNode)
      }
    } else {
      result.push(astNode)
    }
  }
  return result
}

/**
 * Builds an AST from parsed container result - now a simple wrapper for backwards compatibility
 * @param containerResult - The container parse result containing AST nodes
 * @returns Complete AST with containers resolved
 */
export function buildAST(
  containerResult: ContainerParseResult
): z.infer<typeof CurtainsASTSchema> {
  return CurtainsASTSchema.parse({
    type: 'root',
    children: containerResult.ast
  })
}