/**
 * Scopes CSS styles for individual slides using nth-child selectors
 * Ensures slide-specific styles don't leak to other slides
 */

/**
 * Scopes slide CSS with nth-child prefixes to isolate styles per slide
 * @param css - CSS string to scope
 * @param slideIndex - 0-based index of the slide
 * @returns Scoped CSS string with nth-child prefixes
 */
export function scopeStyles(css: string, slideIndex: number): string {
  if (!css || css.trim() === '') {
    return ''
  }
  
  // CSS rules that should NOT be scoped (global CSS features)
  const globalRulePatterns = [
    /^@keyframes\s+/,
    /^@media\s+/,
    /^@import\s+/,
    /^@charset\s+/,
    /^@namespace\s+/,
    /^@supports\s+/,
    /^@page\s+/,
    /^@font-face\s+/
  ]
  
  // Split CSS into lines for processing
  const lines = css.split('\n')
  const scopedLines: string[] = []
  
  let inGlobalRule = false
  let braceDepth = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line === undefined) continue
    
    const trimmedLine = line.trim()
    
    // Track brace depth to handle nested rules
    const openBraces = (line.match(/\{/g) ?? []).length
    const closeBraces = (line.match(/\}/g) ?? []).length
    braceDepth += openBraces - closeBraces
    
    // Check if we're starting a global rule
    const startsGlobalRule = globalRulePatterns.some(pattern => 
      pattern.test(trimmedLine)
    )
    
    if (startsGlobalRule) {
      inGlobalRule = true
      scopedLines.push(line)
      continue
    }
    
    // If we're in a global rule, don't scope until it ends
    if (inGlobalRule) {
      scopedLines.push(line)
      if (braceDepth === 0 && closeBraces > 0) {
        inGlobalRule = false
      }
      continue
    }
    
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
      scopedLines.push(line)
      continue
    }
    
    // Check if this line contains a CSS selector (looks for opening brace)
    const hasOpenBrace = line.includes('{')
    
    if (hasOpenBrace) {
      // Extract selector and rules
      const [selectorPart, ...ruleParts] = line.split('{')
      const rules = ruleParts.join('{')
      
      if (selectorPart !== undefined) {
        const selector = selectorPart.trim()
        
        if (selector) {
          // Apply nth-child scoping to the selector
          const scopedSelector = scopeSelector(selector, slideIndex)
          scopedLines.push(`${getIndentation(line)}${scopedSelector} {${rules}`)
        } else {
          // No selector, just pass through
          scopedLines.push(line)
        }
      } else {
        // No selector part found, just pass through
        scopedLines.push(line)
      }
    } else {
      // No selector on this line, just pass through
      scopedLines.push(line)
    }
  }
  
  return scopedLines.join('\n')
}

/**
 * Scopes a single CSS selector with nth-child prefix
 * @param selector - CSS selector to scope
 * @param slideIndex - 0-based slide index
 * @returns Scoped selector string
 */
function scopeSelector(selector: string, slideIndex: number): string {
  // The nth-child is 1-based, so add 1 to slideIndex
  const nthChildIndex = slideIndex + 1
  const slideScope = `.curtains-slide:nth-child(${nthChildIndex})`
  
  // Handle multiple selectors separated by commas
  const selectors = selector.split(',').map(s => s.trim())
  
  const scopedSelectors = selectors.map(singleSelector => {
    const trimmed = singleSelector.trim()
    
    // Skip empty selectors
    if (!trimmed) {
      return trimmed
    }
    
    // If selector already starts with slide scope, don't double-scope
    if (trimmed.startsWith('.curtains-slide')) {
      return trimmed
    }
    
    // Special handling for pseudo-selectors and combinators
    if (trimmed.startsWith(':') || trimmed.startsWith('>') || trimmed.startsWith('+') || trimmed.startsWith('~')) {
      return `${slideScope}${trimmed}`
    }
    
    // Regular selector - add slide scope as ancestor
    return `${slideScope} ${trimmed}`
  })
  
  return scopedSelectors.join(', ')
}

/**
 * Extracts the indentation (leading whitespace) from a line
 * @param line - Line to extract indentation from
 * @returns Indentation string (spaces/tabs)
 */
function getIndentation(line: string): string {
  const match = line.match(/^(\s*)/);
  return match?.[1] ?? '';
}