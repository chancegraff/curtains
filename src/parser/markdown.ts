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
  start?: number
  spread?: boolean
}

// Simple markdown parser for testing - handles basic markdown without external dependencies
function parseBasicMarkdown(content: string): MarkdownNode {
  // Handle container placeholders that might span multiple lines
  // Use a more sophisticated approach to handle nested placeholders
  function extractContainerPlaceholders(text: string): string[] {
    const placeholders: string[] = []
    let index = 0
    
    while (index < text.length) {
      const start = text.indexOf('{{CONTAINER:', index)
      if (start === -1) break
      
      // Find the matching closing }}
      let braceCount = 1 // Start with 1 to account for the opening {{
      let end = start + 12 // length of '{{CONTAINER:'
      
      // Skip to the content part (after the colon following the container ID)
      let colonCount = 0
      while (end < text.length && colonCount < 1) {
        if (text[end] === ':') {
          colonCount++
        }
        end++
      }
      
      
      // Now count braces to find the matching closing }}
      while (end < text.length) {
        if (text.substring(end, end + 2) === '{{') {
          braceCount++
          end += 2
        } else if (text.substring(end, end + 2) === '}}') {
          braceCount--
          if (braceCount === 0) {
            // This is our closing brace
            end += 2
            break
          } else {
            end += 2
          }
        } else {
          end++
        }
      }
      
      placeholders.push(text.substring(start, end))
      index = end
    }
    
    return placeholders
  }
  
  const placeholders = extractContainerPlaceholders(content)
  
  
  // Check if content is just a single container placeholder
  const trimmedContent = content.trim()
  if (trimmedContent.startsWith('{{CONTAINER:') && trimmedContent.endsWith('}}')) {
    // This is likely a complete container placeholder
    // Return it as a paragraph so buildAST can process it
    return {
      type: 'root',
      children: [{
        type: 'paragraph',
        children: [{ type: 'text', value: trimmedContent }]
      }]
    }
  }
  
  // If content contains container placeholders, handle them as single units
  if (placeholders.length > 0) {
    const children: MarkdownNode[] = []
    let remainingContent = content
    
    
    for (const placeholder of placeholders) {
      const index = remainingContent.indexOf(placeholder)
      if (index !== -1) {
        
        // Add content before placeholder
        const beforeContent = remainingContent.substring(0, index).trim()
        if (beforeContent) {
          const beforeAST = parseBasicMarkdown(beforeContent)
          if (beforeAST.children) {
            children.push(...beforeAST.children)
          }
        }
        
        // Add placeholder as paragraph
        children.push({
          type: 'paragraph',
          children: [{ type: 'text', value: placeholder }]
        })
        
        // Continue with remaining content
        remainingContent = remainingContent.substring(index + placeholder.length)
      }
    }
    
    // Add any remaining content
    const afterContent = remainingContent.trim()
    if (afterContent) {
      const afterAST = parseBasicMarkdown(afterContent)
      if (afterAST.children) {
        children.push(...afterAST.children)
      }
    }
    
    return {
      type: 'root',
      children
    }
  }
  
  const lines = content.split('\n').filter(line => line.trim())
  const children: MarkdownNode[] = []
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Parse headings
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      children.push({
        type: 'heading',
        depth: headingMatch[1]?.length ?? 1,
        children: [{ type: 'text', value: headingMatch[2] ?? '' }]
      })
      continue
    }
    
    // Parse unordered lists
    if (trimmed.startsWith('- ')) {
      const listItems = []
      let currentIndex = lines.indexOf(line)
      
      while (currentIndex < lines.length && (lines[currentIndex]?.trim().startsWith('- ') === true)) {
        listItems.push({
          type: 'listItem',
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', value: lines[currentIndex]?.trim().substring(2) ?? '' }]
            }
          ]
        })
        currentIndex++
      }
      
      if (listItems.length > 0) {
        children.push({
          type: 'list',
          ordered: false,
          children: listItems
        })
      }
      continue
    }
    
    // Parse ordered lists
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/)
    if (orderedMatch) {
      const listItems = []
      let currentIndex = lines.indexOf(line)
      
      while (currentIndex < lines.length && lines[currentIndex]?.trim().match(/^\d+\.\s+/)) {
        const itemMatch = lines[currentIndex]?.trim().match(/^\d+\.\s+(.+)$/)
        if (itemMatch) {
          listItems.push({
            type: 'listItem',
            children: [
              {
                type: 'paragraph',
                children: [{ type: 'text', value: itemMatch[1] ?? '' }]
              }
            ]
          })
        }
        currentIndex++
      }
      
      if (listItems.length > 0) {
        children.push({
          type: 'list',
          ordered: true,
          children: listItems
        })
      }
      continue
    }
    
    // Parse images
    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imageMatch) {
      children.push({
        type: 'image',
        alt: imageMatch[1] ?? '',
        url: imageMatch[2] ?? ''
      })
      continue
    }
    
    // Skip container closing tags
    if (trimmed === '</container>') {
      continue
    }
    
    // Parse regular paragraphs (including those with links)
    if (trimmed !== '' && !trimmed.startsWith('#') && !trimmed.startsWith('- ') && orderedMatch === null && imageMatch === null) {
      const paragraphChildren: MarkdownNode[] = []
      
      // Simple link parsing
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
      let lastIndex = 0
      let match
      
      while ((match = linkRegex.exec(trimmed)) !== null) {
        // Add text before link
        if (match.index > lastIndex) {
          paragraphChildren.push({
            type: 'text',
            value: trimmed.substring(lastIndex, match.index)
          })
        }
        
        // Add link
        paragraphChildren.push({
          type: 'link',
          url: match[2] ?? '',
          children: [{ type: 'text', value: match[1] ?? '' }]
        })
        
        lastIndex = match.index + match[0].length
      }
      
      // Add remaining text
      if (lastIndex < trimmed.length) {
        paragraphChildren.push({
          type: 'text',
          value: trimmed.substring(lastIndex)
        })
      }
      
      // If no links found, just add as text
      if (paragraphChildren.length === 0) {
        paragraphChildren.push({ type: 'text', value: trimmed })
      }
      
      children.push({
        type: 'paragraph',
        children: paragraphChildren
      })
    }
  }
  
  const result = {
    type: 'root',
    children
  }
  
  
  return result
}

/**
 * Parses markdown content into an AST structure
 * @param content - The markdown content to parse
 * @returns AST representation of the markdown
 */
export function parseMarkdown(content: string): MarkdownNode {
  // Use basic markdown parser for Jest compatibility
  return parseBasicMarkdown(content)
}