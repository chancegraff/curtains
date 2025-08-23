import { CurtainsASTSchema, CurtainsDocumentSchema } from '../ast/schemas.js'
import type {
  CurtainsAST,
  ASTNode
} from '../ast/types.js'

/**
 * Converts a slide AST or CurtainsDocument to HTML string
 * @param input - Either a CurtainsAST for a single slide or a CurtainsDocument
 * @returns HTML string for the slide(s) content
 */
export function astToHTML(input: unknown): string {
  // Check if input is a CurtainsDocument
  const docResult = CurtainsDocumentSchema.safeParse(input)
  if (docResult.success) {
    // Convert each slide and join them
    const slidesHtml = docResult.data.slides
      .map(slide => {
        const slideHtml = convertASTToHTML(slide.ast)
        return `<div class="curtains-slide">${slideHtml}</div>`
      })
      .join('\n')
    return slidesHtml
  }
  
  // Otherwise, treat as single AST
  const validatedAST = CurtainsASTSchema.parse(input)
  return convertASTToHTML(validatedAST)
}

/**
 * Converts AST to HTML
 */
function convertASTToHTML(ast: CurtainsAST): string {
  // Process AST nodes
  const htmlParts: string[] = []
  const paddedContent: string[] = []
  
  for (const node of ast.children) {
    if (node.type === 'container') {
      // If we have accumulated padded content, wrap it first
      if (paddedContent.length > 0) {
        htmlParts.push(`<div class="curtains-content">${paddedContent.join('\n')}</div>`)
        paddedContent.length = 0
      }
      // Add container directly without padding wrapper
      const html = convertNodeToHTML(node)
      if (html) {
        htmlParts.push(html)
      }
    } else {
      // Accumulate non-container content for padding wrapper
      const html = convertNodeToHTML(node)
      if (html) {
        paddedContent.push(html)
      }
    }
  }
  
  // Wrap any remaining padded content
  if (paddedContent.length > 0) {
    htmlParts.push(`<div class="curtains-content">${paddedContent.join('\n')}</div>`)
  }

  return htmlParts.join('\n')
}

/**
 * Converts AST node to HTML
 */
function convertNodeToHTML(node: ASTNode): string {
  switch (node.type) {
    case 'container': {
      const classes = node.classes.length > 0 ? ` class="${node.classes.join(' ')}"` : ''
      const childrenHtml = node.children.map(convertNodeToHTML).join('\n')
      return `<div${classes}>${childrenHtml}</div>`
    }

    case 'heading': {
      const depth = node.depth
      const content = node.children.map(convertNodeToHTML).join('')
      return `<h${depth}>${content}</h${depth}>`
    }

    case 'paragraph': {
      const content = node.children.map(convertNodeToHTML).join('')
      return `<p>${content}</p>`
    }

    case 'text': {
      let text = node.value
      // Apply formatting if present
      if (node.bold === true) text = `<strong>${text}</strong>`
      if (node.italic === true) text = `<em>${text}</em>`
      return text
    }

    case 'link': {
      const url = node.url
      const content = node.children.map(convertNodeToHTML).join('')

      // Check if external link
      const isExternal = /^(https?:)?\/\//i.test(url)
      const attrs = isExternal
        ? ` target="_blank" rel="noopener noreferrer"`
        : ''

      return `<a href="${url}"${attrs}>${content}</a>`
    }

    case 'image': {
      const src = node.url
      const alt = node.alt ?? ''
      const classes = node.classes
      const classAttr = classes && classes.length > 0 ? ` class="${classes.join(' ')}"` : ''
      return `<img src="${src}" alt="${alt}"${classAttr}>`
    }

    case 'list': {
      const tag = node.ordered === true ? 'ol' : 'ul'
      const items = node.children.map(convertNodeToHTML).join('\n')
      return `<${tag}>${items}</${tag}>`
    }

    case 'listItem': {
      const content = node.children.map(convertNodeToHTML).join('')
      return `<li>${content}</li>`
    }

    case 'code': {
      const lang = node.lang
      const langClass = lang !== undefined && lang !== '' ? ` class="language-${lang}"` : ''
      const value = node.value
      return `<pre><code${langClass}>${escapeHtml(value)}</code></pre>`
    }

    case 'table': {
      if (node.children.length === 0) return ''
      
      const rows = node.children.map(convertNodeToHTML)
      
      // Check if first row contains header cells
      const firstRow = node.children[0]
      const hasHeader = firstRow && firstRow.type === 'tableRow' && 
        firstRow.children.some(cell => cell.type === 'tableCell' && cell.header === true)
      
      if (hasHeader === true) {
        const headerRow = rows[0]
        const bodyRows = rows.slice(1)
        return `<table><thead>${headerRow}</thead>${bodyRows.length > 0 ? `<tbody>${bodyRows.join('')}</tbody>` : ''}</table>`
      } else {
        return `<table><tbody>${rows.join('')}</tbody></table>`
      }
    }

    case 'tableRow': {
      const cells = node.children.map(convertNodeToHTML).join('')
      return `<tr>${cells}</tr>`
    }

    case 'tableCell': {
      const content = node.children.map(convertNodeToHTML).join('')
      const isHeader = node.header === true
      const align = node.align
      const tag = isHeader ? 'th' : 'td'
      const alignStyle = align !== undefined && align !== 'left' ? ` style="text-align: ${align}"` : ''
      return `<${tag}${alignStyle}>${content}</${tag}>`
    }

    default:
      return ''
  }
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
