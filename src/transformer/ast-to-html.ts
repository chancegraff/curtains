import { CurtainsASTSchema } from '../ast/schemas.js'
import type {
  CurtainsAST,
  ASTNode
} from '../ast/types.js'

/**
 * Converts a slide AST to HTML string
 * @param ast - Validated CurtainsAST for a single slide
 * @returns HTML string for the slide content
 */
export function astToHTML(ast: unknown): string {
  // Validate AST
  const validatedAST = CurtainsASTSchema.parse(ast)

  // Convert AST to HTML
  return convertASTToHTML(validatedAST)
}

/**
 * Converts AST to HTML
 */
function convertASTToHTML(ast: CurtainsAST): string {
  // Process AST nodes
  const htmlParts: string[] = []

  for (const node of ast.children) {
    const html = convertNodeToHTML(node as ASTNode)
    if (html) {
      htmlParts.push(html)
    }
  }

  return htmlParts.join('\n')
}

/**
 * Converts AST node to HTML
 */
function convertNodeToHTML(node: ASTNode): string {
  const typedNode = node as Record<string, unknown>

  switch (typedNode.type) {
    case 'container': {
      const classes = (typedNode.classes as string[])?.length
        ? ` class="${(typedNode.classes as string[]).join(' ')}"`
        : ''
      const children = typedNode.children as ASTNode[] | undefined
      const childrenHtml = children?.map(convertNodeToHTML).join('\n') ?? ''
      return `<div${classes}>${childrenHtml}</div>`
    }

    case 'heading': {
      const depth = (typedNode.depth as number) ?? 1
      const children = typedNode.children as ASTNode[] | undefined
      const content = children?.map(convertNodeToHTML).join('') ?? ''
      return `<h${depth}>${content}</h${depth}>`
    }

    case 'paragraph': {
      const children = typedNode.children as ASTNode[] | undefined
      const content = children?.map(convertNodeToHTML).join('') ?? ''
      return `<p>${content}</p>`
    }

    case 'text': {
      let text = (typedNode.value as string) ?? ''
      // Apply formatting if present
      if (typedNode.bold === true) text = `<strong>${text}</strong>`
      if (typedNode.italic === true) text = `<em>${text}</em>`
      return text
    }

    case 'link': {
      const url = (typedNode.url as string) ?? '#'
      const children = typedNode.children as ASTNode[] | undefined
      const content = children?.map(convertNodeToHTML).join('') ?? ''

      // Check if external link
      const isExternal = /^(https?:)?\/\//i.test(url)
      const attrs = isExternal
        ? ` target="_blank" rel="noopener noreferrer"`
        : ''

      return `<a href="${url}"${attrs}>${content}</a>`
    }

    case 'image': {
      const src = (typedNode.url as string) ?? ''
      const alt = (typedNode.alt as string) ?? ''
      return `<img src="${src}" alt="${alt}">`
    }

    case 'list': {
      const tag = typedNode.ordered === true ? 'ol' : 'ul'
      const children = typedNode.children as ASTNode[] | undefined
      const items = children?.map(convertNodeToHTML).join('\n') ?? ''
      return `<${tag}>${items}</${tag}>`
    }

    case 'listItem': {
      const children = typedNode.children as ASTNode[] | undefined
      const content = children?.map(convertNodeToHTML).join('') ?? ''
      return `<li>${content}</li>`
    }

    case 'code': {
      const lang = typedNode.lang as string | undefined
      const langClass = lang !== undefined && lang !== '' ? ` class="language-${lang}"` : ''
      const value = (typedNode.value as string) ?? ''
      return `<pre><code${langClass}>${escapeHtml(value)}</code></pre>`
    }

    default:
      // For any unhandled node types, try to process children
      if ('children' in typedNode && Array.isArray(typedNode.children)) {
        return (typedNode.children as ASTNode[]).map(convertNodeToHTML).join('')
      }
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
