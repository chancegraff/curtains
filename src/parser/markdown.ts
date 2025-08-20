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
  bold?: boolean
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
    // Need to verify this is actually a single placeholder, not multiple
    // Count the number of container placeholders to be sure
    if (placeholders.length === 1) {
      // This is truly a single container placeholder
      // Return it as a paragraph so buildAST can process it
      return {
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{ type: 'text', value: trimmedContent }]
        }]
      }
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
  
  const lines = content.split('\n')
  const children: MarkdownNode[] = []
  
  let i = 0
  while (i < lines.length) {
    const line = lines[i] ?? ''
    const trimmed = line.trim()
    
    // Skip empty lines except in code blocks
    if (trimmed === '') {
      i++
      continue
    }
    
    // Parse code blocks (triple backticks)
    if (trimmed.startsWith('```')) {
      const langMatch = trimmed.match(/^```(.*)$/)
      const lang = langMatch?.[1]?.trim() || undefined
      const codeLines: string[] = []
      i++ // Move past opening ```
      
      // Collect code lines until closing ``` (preserve exact formatting)
      while (i < lines.length) {
        const codeLine = lines[i] ?? ''
        if (codeLine.trim() === '```') {
          break // Found closing ```
        }
        codeLines.push(codeLine)
        i++
      }
      
      // Add code block node
      children.push({
        type: 'code',
        value: codeLines.join('\n'),
        ...(lang && { lang })
      })
      
      i++ // Move past closing ```
      continue
    }
    
    // Parse tables (pipe syntax)
    if (trimmed.includes('|')) {
      const tableRows: MarkdownNode[] = []
      let currentIndex = i
      let alignments: ('left' | 'center' | 'right')[] = []
      
      // Collect consecutive table rows
      while (currentIndex < lines.length) {
        const tableLine = lines[currentIndex]?.trim() ?? ''
        if (!tableLine.includes('|')) break
        
        // Check if this is a separator row (|---|---|)
        const separatorMatch = tableLine.match(/^\|?[\s\-:]+\|[\s\-:|]*\|?$/)
        if (separatorMatch) {
          // Parse alignment from separator row
          alignments = tableLine.split('|')
            .filter(cell => cell.trim())
            .map(cell => {
              const trimmed = cell.trim()
              if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center'
              if (trimmed.endsWith(':')) return 'right'
              return 'left'
            })
          currentIndex++
          continue
        }
        
        // Parse table row
        const cells = tableLine.split('|')
          .filter((cell, index) => {
            // Filter out empty cells at start/end that are just from leading/trailing |
            if (index === 0 || index === tableLine.split('|').length - 1) {
              return cell.trim() !== ''
            }
            return true
          })
          .map((cell, cellIndex) => {
            const cellContent = cell.trim()
            const isHeader = tableRows.length === 0 && alignments.length === 0
            const align = alignments[cellIndex]
            
            return {
              type: 'tableCell' as const,
              ...(isHeader && { header: true }),
              ...(align && { align }),
              children: cellContent ? parseInlineText(cellContent) : [{ type: 'text' as const, value: '' }]
            }
          })
        
        if (cells.length > 0) {
          tableRows.push({
            type: 'tableRow',
            children: cells
          })
        }
        
        currentIndex++
      }
      
      if (tableRows.length > 0) {
        children.push({
          type: 'table',
          children: tableRows
        })
        i = currentIndex
        continue
      }
    }
    
    // Parse headings
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      children.push({
        type: 'heading',
        depth: headingMatch[1]?.length ?? 1,
        children: [{ type: 'text', value: headingMatch[2] ?? '' }]
      })
      i++
      continue
    }
    
    // Parse unordered lists
    if (trimmed.startsWith('- ')) {
      const listItems = []
      let currentIndex = i
      
      while (currentIndex < lines.length && (lines[currentIndex]?.trim().startsWith('- ') === true)) {
        const listItemText = lines[currentIndex]?.trim().substring(2) ?? ''
        listItems.push({
          type: 'listItem',
          children: [
            {
              type: 'paragraph',
              children: parseInlineText(listItemText)
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
      
      // Update i to point to the next unprocessed line
      i = currentIndex
      continue
    }
    
    // Parse ordered lists
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/)
    if (orderedMatch) {
      const listItems = []
      let currentIndex = i
      
      while (currentIndex < lines.length && lines[currentIndex]?.trim().match(/^\d+\.\s+/)) {
        const itemMatch = lines[currentIndex]?.trim().match(/^\d+\.\s+(.+)$/)
        if (itemMatch) {
          listItems.push({
            type: 'listItem',
            children: [
              {
                type: 'paragraph',
                children: parseInlineText(itemMatch[1] ?? '')
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
      
      // Update i to point to the next unprocessed line
      i = currentIndex
      continue
    }
    
    // Parse standard markdown images: ![alt](url)
    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imageMatch) {
      const alt = imageMatch[1] ?? ''
      const url = imageMatch[2] ?? ''
      
      children.push({
        type: 'image',
        alt,
        url
      })
      i++
      continue
    }
    
    // Parse HTML img tags on their own line
    const htmlImgMatch = trimmed.match(/^<img[^>]*>$/i)
    if (htmlImgMatch) {
      const sanitized = sanitizeImgAttributes(htmlImgMatch[0])
      children.push({
        type: 'image',
        url: sanitized.src,
        alt: sanitized.alt,
        ...(sanitized.classes && sanitized.classes.length > 0 && { classes: sanitized.classes })
      })
      i++
      continue
    }
    
    // Skip container closing tags
    if (trimmed === '</container>') {
      i++
      continue
    }
    
    // Parse regular paragraphs (including those with links and formatting)
    if (trimmed !== '' && !trimmed.startsWith('#') && !trimmed.startsWith('- ') && orderedMatch === null && imageMatch === null && htmlImgMatch === null) {
      children.push({
        type: 'paragraph',
        children: parseInlineText(trimmed)
      })
    }
    
    i++
  }
  
  const result = {
    type: 'root',
    children
  }
  
  
  return result
}

/**
 * Parses inline text with formatting (bold, links, HTML img tags, etc.)
 * @param text - The text to parse inline formatting
 * @returns Array of MarkdownNode children
 */
function parseInlineText(text: string): MarkdownNode[] {
  const children: MarkdownNode[] = []
  let currentIndex = 0
  
  // Combined regex for bold, links, and HTML img tags
  const formatRegex = /(\*\*([^*]+)\*\*)|(\[([^\]]+)\]\(([^)]+)\))|(<img[^>]*>)/gi
  let match
  
  while ((match = formatRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > currentIndex) {
      const beforeText = text.substring(currentIndex, match.index)
      if (beforeText) {
        children.push({
          type: 'text',
          value: beforeText
        })
      }
    }
    
    // Check if it's bold (**text**)
    if (match[1] && match[2]) {
      children.push({
        type: 'text',
        value: match[2],
        bold: true
      })
    }
    // Check if it's a link [text](url)
    else if (match[3] && match[4] && match[5]) {
      children.push({
        type: 'link',
        url: match[5],
        children: [{ type: 'text', value: match[4] }]
      })
    }
    // Check if it's an HTML img tag
    else if (match[6]) {
      const imgTagMatch = match[6]
      const sanitized = sanitizeImgAttributes(imgTagMatch)
      children.push({
        type: 'image',
        url: sanitized.src,
        alt: sanitized.alt,
        ...(sanitized.classes && sanitized.classes.length > 0 && { classes: sanitized.classes })
      })
    }
    
    currentIndex = match.index + match[0].length
  }
  
  // Add remaining text
  if (currentIndex < text.length) {
    const remainingText = text.substring(currentIndex)
    if (remainingText) {
      children.push({
        type: 'text',
        value: remainingText
      })
    }
  }
  
  // If no formatting found, just return as text
  if (children.length === 0) {
    children.push({ type: 'text', value: text })
  }
  
  return children
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