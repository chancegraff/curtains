import { z } from 'zod'
import {
  NodeVisitorSchema,
  VisitorRegistrySchema,
  HTMLGeneratorSchema,
  TransformerOptionsSchema
} from '../schemas/transformers'
import { ASTNodeSchema } from '../schemas/parsers'

// Infer types from schemas
type NodeVisitor = z.infer<typeof NodeVisitorSchema>
type VisitorRegistry = z.infer<typeof VisitorRegistrySchema>
type HTMLGenerator = z.infer<typeof HTMLGeneratorSchema>
type TransformerOptions = z.infer<typeof TransformerOptionsSchema>

// HTML escaping utility
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// HTML attribute escaping utility
function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Serialize attributes to HTML string
function serializeAttributes(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .map(([key, value]) => `${key}="${escapeAttribute(value)}"`)
    .join(' ')
}

// Generate HTML element with attributes and content
function generateElement(tag: string, attributes: Record<string, string>, content: string): string {
  const attrString = Object.keys(attributes).length > 0 ? ` ${serializeAttributes(attributes)}` : ''
  return `<${tag}${attrString}>${content}</${tag}>`
}

// Generate self-closing HTML element
function generateSelfClosingElement(tag: string, attributes: Record<string, string>): string {
  const attrString = Object.keys(attributes).length > 0 ? ` ${serializeAttributes(attributes)}` : ''
  return `<${tag}${attrString}>`
}

// Check if URL is external
function isExternal(url: string): boolean {
  return /^(https?:)?\/\//i.test(url)
}

// HTML Generator implementation
function createHTMLGenerator(): HTMLGenerator {
  return {
    generateElement,
    generateSelfClosingElement,
    escapeHtml,
    escapeAttribute,
    serializeAttributes,
    wrapWithTag: (content: string, tag: string, attributes: Record<string, string> = {}): string => {
      return generateElement(tag, attributes, content)
    },
    joinElements: (elements: string[], separator = '\n'): string => {
      return elements.join(separator)
    },
    isExternal,
    sanitize: (html: string): string => {
      // Basic HTML sanitization - remove script tags and dangerous attributes
      return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/\s*javascript\s*:\s*/gi, '')
    },
    optimize: (html: string): string => {
      // Basic HTML optimization - remove extra whitespace
      return html
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .trim()
    }
  }
}

// Default visitor implementations
function createTextVisitor(): NodeVisitor {
  return (node: unknown, _visitNode: (node: unknown) => string): string => {
    const validatedNode = ASTNodeSchema.parse(node)
    if (validatedNode.type !== 'text') {
      throw new Error(`Text visitor received non-text node: ${validatedNode.type}`)
    }

    let text = validatedNode.value ?? ''

    // Apply formatting if present
    if (validatedNode.bold === true) {
      text = `<strong>${escapeHtml(text)}</strong>`
    } else if (validatedNode.italic === true) {
      text = `<em>${escapeHtml(text)}</em>`
    } else {
      text = escapeHtml(text)
    }

    return text
  }
}

function createHeadingVisitor(): NodeVisitor {
  return (node: unknown, visitNode: (node: unknown) => string): string => {
    const validatedNode = ASTNodeSchema.parse(node)
    if (validatedNode.type !== 'heading') {
      throw new Error(`Heading visitor received non-heading node: ${validatedNode.type}`)
    }

    const depth = validatedNode.depth ?? 1
    const content = (validatedNode.children ?? [])
      .map(child => visitNode(child))
      .join('')

    return generateElement(`h${depth}`, {}, content)
  }
}

function createParagraphVisitor(): NodeVisitor {
  return (node: unknown, visitNode: (node: unknown) => string): string => {
    const validatedNode = ASTNodeSchema.parse(node)
    if (validatedNode.type !== 'paragraph') {
      throw new Error(`Paragraph visitor received non-paragraph node: ${validatedNode.type}`)
    }

    const content = (validatedNode.children ?? [])
      .map(child => visitNode(child))
      .join('')

    return generateElement('p', {}, content)
  }
}

function createListVisitor(): NodeVisitor {
  return (node: unknown, visitNode: (node: unknown) => string): string => {
    const validatedNode = ASTNodeSchema.parse(node)
    if (validatedNode.type !== 'list') {
      throw new Error(`List visitor received non-list node: ${validatedNode.type}`)
    }

    const tag = validatedNode.ordered === true ? 'ol' : 'ul'
    const content = (validatedNode.children ?? [])
      .map(child => visitNode(child))
      .join('\n')

    return generateElement(tag, {}, content)
  }
}

function createListItemVisitor(): NodeVisitor {
  return (node: unknown, visitNode: (node: unknown) => string): string => {
    const validatedNode = ASTNodeSchema.parse(node)
    if (validatedNode.type !== 'listItem') {
      throw new Error(`ListItem visitor received non-listItem node: ${validatedNode.type}`)
    }

    const content = (validatedNode.children ?? [])
      .map(child => visitNode(child))
      .join('')

    return generateElement('li', {}, content)
  }
}

function createCodeVisitor(): NodeVisitor {
  return (node: unknown, _visitNode: (node: unknown) => string): string => {
    const validatedNode = ASTNodeSchema.parse(node)
    if (validatedNode.type !== 'code') {
      throw new Error(`Code visitor received non-code node: ${validatedNode.type}`)
    }

    const value = validatedNode.value ?? ''
    const lang = validatedNode.lang

    const codeAttributes: Record<string, string> = {}
    if (lang !== undefined && lang !== '') {
      codeAttributes.class = `language-${lang}`
    }

    const codeElement = generateElement('code', codeAttributes, escapeHtml(value))
    return generateElement('pre', {}, codeElement)
  }
}

function createBlockquoteVisitor(): NodeVisitor {
  return (node: unknown, visitNode: (node: unknown) => string): string => {
    const validatedNode = ASTNodeSchema.parse(node)
    if (validatedNode.type !== 'blockquote') {
      throw new Error(`Blockquote visitor received non-blockquote node: ${validatedNode.type}`)
    }

    const content = (validatedNode.children ?? [])
      .map(child => visitNode(child))
      .join('\n')

    return generateElement('blockquote', {}, content)
  }
}

function createLinkVisitor(): NodeVisitor {
  return (node: unknown, visitNode: (node: unknown) => string): string => {
    const validatedNode = ASTNodeSchema.parse(node)
    if (validatedNode.type !== 'link') {
      throw new Error(`Link visitor received non-link node: ${validatedNode.type}`)
    }

    const url = validatedNode.url ?? '#'
    const title = validatedNode.title
    const content = (validatedNode.children ?? [])
      .map(child => visitNode(child))
      .join('')

    const attributes: Record<string, string> = { href: url }

    if (title !== undefined && title !== '') {
      attributes.title = title
    }

    // Add external link attributes
    if (isExternal(url)) {
      attributes.target = '_blank'
      attributes.rel = 'noopener noreferrer'
    }

    return generateElement('a', attributes, content)
  }
}

function createImageVisitor(): NodeVisitor {
  return (node: unknown, _visitNode: (node: unknown) => string): string => {
    const validatedNode = ASTNodeSchema.parse(node)
    if (validatedNode.type !== 'image') {
      throw new Error(`Image visitor received non-image node: ${validatedNode.type}`)
    }

    const src = validatedNode.url ?? ''
    const alt = validatedNode.alt ?? ''
    const title = validatedNode.title
    const classes = validatedNode.classes

    const attributes: Record<string, string> = { src, alt }

    if (title !== undefined && title !== '') {
      attributes.title = title
    }

    if (classes !== undefined && classes.length > 0) {
      attributes.class = classes.join(' ')
    }

    return generateSelfClosingElement('img', attributes)
  }
}

function createTableVisitor(): NodeVisitor {
  return (node: unknown, visitNode: (node: unknown) => string): string => {
    const validatedNode = ASTNodeSchema.parse(node)
    if (validatedNode.type !== 'table') {
      throw new Error(`Table visitor received non-table node: ${validatedNode.type}`)
    }

    if (!validatedNode.children || validatedNode.children.length === 0) {
      return ''
    }

    const rows = validatedNode.children.map(child => visitNode(child))

    // Check if first row contains header cells
    const firstRow = validatedNode.children[0]
    const hasHeader = firstRow?.type === 'tableRow' &&
      firstRow.children?.some(cell =>
        cell.type === 'tableCell' && cell.header === true
      )

    if (hasHeader && rows.length > 0) {
      const headerRow = rows[0]
      if (headerRow !== undefined) {
        const bodyRows = rows.slice(1)
        const thead = generateElement('thead', {}, headerRow)
        const tbody = bodyRows.length > 0 ? generateElement('tbody', {}, bodyRows.join('')) : ''
        return generateElement('table', {}, `${thead}${tbody}`)
      }
    }

    const tbody = generateElement('tbody', {}, rows.join(''))
    return generateElement('table', {}, tbody)
  }
}

function createTableRowVisitor(): NodeVisitor {
  return (node: unknown, visitNode: (node: unknown) => string): string => {
    const validatedNode = ASTNodeSchema.parse(node)
    if (validatedNode.type !== 'tableRow') {
      throw new Error(`TableRow visitor received non-tableRow node: ${validatedNode.type}`)
    }

    const content = (validatedNode.children ?? [])
      .map(child => visitNode(child))
      .join('')

    return generateElement('tr', {}, content)
  }
}

function createTableCellVisitor(): NodeVisitor {
  return (node: unknown, visitNode: (node: unknown) => string): string => {
    const validatedNode = ASTNodeSchema.parse(node)
    if (validatedNode.type !== 'tableCell') {
      throw new Error(`TableCell visitor received non-tableCell node: ${validatedNode.type}`)
    }

    const content = (validatedNode.children ?? [])
      .map(child => visitNode(child))
      .join('')

    const isHeader = validatedNode.header === true
    const align = validatedNode.align
    const tag = isHeader ? 'th' : 'td'

    const attributes: Record<string, string> = {}
    if (align !== undefined && align !== 'left') {
      attributes.style = `text-align: ${align}`
    }

    return generateElement(tag, attributes, content)
  }
}

function createContainerVisitor(): NodeVisitor {
  return (node: unknown, visitNode: (node: unknown) => string): string => {
    const validatedNode = ASTNodeSchema.parse(node)
    if (validatedNode.type !== 'container') {
      throw new Error(`Container visitor received non-container node: ${validatedNode.type}`)
    }

    const classes = validatedNode.classes ?? []
    const attributes: Record<string, string> = {}

    if (classes.length > 0) {
      attributes.class = classes.join(' ')
    }

    // Merge any additional attributes
    if (validatedNode.attributes) {
      Object.assign(attributes, validatedNode.attributes)
    }

    const content = (validatedNode.children ?? [])
      .map(child => visitNode(child))
      .join('\n')

    return generateElement('div', attributes, content)
  }
}

function createSlideVisitor(): NodeVisitor {
  return (node: unknown, visitNode: (node: unknown) => string): string => {
    const validatedNode = ASTNodeSchema.parse(node)
    if (validatedNode.type !== 'slide') {
      throw new Error(`Slide visitor received non-slide node: ${validatedNode.type}`)
    }

    const attributes: Record<string, string> = { class: 'curtains-slide' }

    // Add slide index as data attribute
    if (validatedNode.index !== undefined) {
      attributes['data-slide-index'] = validatedNode.index.toString()
    }

    const content = (validatedNode.children ?? [])
      .map(child => visitNode(child))
      .join('\n')

    return generateElement('div', attributes, content)
  }
}

function createDocumentVisitor(): NodeVisitor {
  return (node: unknown, visitNode: (node: unknown) => string): string => {
    const validatedNode = ASTNodeSchema.parse(node)
    if (validatedNode.type !== 'document') {
      throw new Error(`Document visitor received non-document node: ${validatedNode.type}`)
    }

    const content = (validatedNode.children ?? [])
      .map(child => visitNode(child))
      .join('\n')

    return generateElement('div', { class: 'curtains-document' }, content)
  }
}

function createThematicBreakVisitor(): NodeVisitor {
  return (node: unknown, _visitNode: (node: unknown) => string): string => {
    const validatedNode = ASTNodeSchema.parse(node)
    if (validatedNode.type !== 'thematicBreak') {
      throw new Error(`ThematicBreak visitor received non-thematicBreak node: ${validatedNode.type}`)
    }

    return generateSelfClosingElement('hr', {})
  }
}

function createStrongVisitor(): NodeVisitor {
  return (node: unknown, visitNode: (node: unknown) => string): string => {
    const validatedNode = ASTNodeSchema.parse(node)
    if (validatedNode.type !== 'strong') {
      throw new Error(`Strong visitor received non-strong node: ${validatedNode.type}`)
    }

    const content = (validatedNode.children ?? [])
      .map(child => visitNode(child))
      .join('')

    return generateElement('strong', {}, content)
  }
}

function createEmphasisVisitor(): NodeVisitor {
  return (node: unknown, visitNode: (node: unknown) => string): string => {
    const validatedNode = ASTNodeSchema.parse(node)
    if (validatedNode.type !== 'emphasis') {
      throw new Error(`Emphasis visitor received non-emphasis node: ${validatedNode.type}`)
    }

    const content = (validatedNode.children ?? [])
      .map(child => visitNode(child))
      .join('')

    return generateElement('em', {}, content)
  }
}

// Fallback visitor for unknown node types
function createFallbackVisitor(): NodeVisitor {
  return (node: unknown, visitNode: (node: unknown) => string): string => {
    const validatedNode = ASTNodeSchema.parse(node)

    // For unknown nodes, try to render children if they exist
    if (validatedNode.children && validatedNode.children.length > 0) {
      return validatedNode.children
        .map(child => visitNode(child))
        .join('')
    }

    // If no children, render any text value
    if (validatedNode.value !== undefined) {
      return escapeHtml(validatedNode.value)
    }

    // Return empty string for completely unknown nodes
    return ''
  }
}

// Create default visitors map
function createDefaultVisitors(): Map<string, NodeVisitor> {
  const visitors = new Map<string, NodeVisitor>()

  // Standard markdown elements
  visitors.set('text', createTextVisitor())
  visitors.set('heading', createHeadingVisitor())
  visitors.set('paragraph', createParagraphVisitor())
  visitors.set('list', createListVisitor())
  visitors.set('listItem', createListItemVisitor())
  visitors.set('code', createCodeVisitor())
  visitors.set('blockquote', createBlockquoteVisitor())
  visitors.set('link', createLinkVisitor())
  visitors.set('image', createImageVisitor())
  visitors.set('table', createTableVisitor())
  visitors.set('tableRow', createTableRowVisitor())
  visitors.set('tableCell', createTableCellVisitor())
  visitors.set('thematicBreak', createThematicBreakVisitor())
  visitors.set('strong', createStrongVisitor())
  visitors.set('emphasis', createEmphasisVisitor())

  // Curtains-specific elements
  visitors.set('container', createContainerVisitor())
  visitors.set('slide', createSlideVisitor())
  visitors.set('document', createDocumentVisitor())

  return visitors
}

// Create visitor registry implementation
export function createVisitorRegistry(options: Partial<TransformerOptions> = {}): VisitorRegistry {
  const visitors = createDefaultVisitors()
  const fallbackVisitor = createFallbackVisitor()

  // Add any custom visitors from options
  if (options.customVisitors) {
    for (const [nodeType, visitor] of Object.entries(options.customVisitors)) {
      visitors.set(nodeType, visitor)
    }
  }

  const registry: VisitorRegistry = {
    visitors,
    fallbackVisitor,

    register: (nodeType: string, visitor: NodeVisitor): void => {
      // Validate visitor
      NodeVisitorSchema.parse(visitor)
      visitors.set(nodeType, visitor)
    },

    unregister: (nodeType: string): boolean => {
      return visitors.delete(nodeType)
    },

    setFallback: (visitor: NodeVisitor): void => {
      // Validate visitor
      NodeVisitorSchema.parse(visitor)
      registry.fallbackVisitor = visitor
    },

    visit: (node: unknown): string => {
      const validatedNode = ASTNodeSchema.parse(node)
      const visitor = visitors.get(validatedNode.type) ?? registry.fallbackVisitor

      if (!visitor) {
        throw new Error(`No visitor found for node type: ${validatedNode.type}`)
      }

      return visitor(node, registry.visit)
    },

    hasVisitor: (nodeType: string): boolean => {
      return visitors.has(nodeType)
    },

    getVisitor: (nodeType: string): NodeVisitor | undefined => {
      return visitors.get(nodeType)
    },

    getSupportedTypes: (): string[] => {
      return Array.from(visitors.keys())
    },

    clear: (): void => {
      visitors.clear()
    }
  }

  return registry
}

// Visitor composition utilities
export function composeVisitors(primary: NodeVisitor, secondary: NodeVisitor): NodeVisitor {
  return (node: unknown, visitNode: (node: unknown) => string): string => {
    try {
      return primary(node, visitNode)
    } catch {
      // If primary visitor fails, try secondary
      return secondary(node, visitNode)
    }
  }
}

export function wrapVisitor(visitor: NodeVisitor, wrapper: (html: string) => string): NodeVisitor {
  return (node: unknown, visitNode: (node: unknown) => string): string => {
    const html = visitor(node, visitNode)
    return wrapper(html)
  }
}

export function conditionalVisitor(
  condition: (node: unknown) => boolean,
  trueVisitor: NodeVisitor,
  falseVisitor: NodeVisitor
): NodeVisitor {
  return (node: unknown, visitNode: (node: unknown) => string): string => {
    if (condition(node)) {
      return trueVisitor(node, visitNode)
    } else {
      return falseVisitor(node, visitNode)
    }
  }
}

// Validation utilities
export function validateVisitor(visitor: NodeVisitor): boolean {
  try {
    NodeVisitorSchema.parse(visitor)
    return true
  } catch {
    return false
  }
}

export function validateVisitorRegistry(registry: VisitorRegistry): boolean {
  try {
    VisitorRegistrySchema.parse(registry)
    return true
  } catch {
    return false
  }
}

// HTML generation utilities
export { createHTMLGenerator, escapeHtml, escapeAttribute, serializeAttributes, generateElement, generateSelfClosingElement, isExternal }

// Export default visitor creators for individual use
export {
  createTextVisitor,
  createHeadingVisitor,
  createParagraphVisitor,
  createListVisitor,
  createListItemVisitor,
  createCodeVisitor,
  createBlockquoteVisitor,
  createLinkVisitor,
  createImageVisitor,
  createTableVisitor,
  createTableRowVisitor,
  createTableCellVisitor,
  createContainerVisitor,
  createSlideVisitor,
  createDocumentVisitor,
  createThematicBreakVisitor,
  createStrongVisitor,
  createEmphasisVisitor,
  createFallbackVisitor
}
