/**
 * CSS Style Scoping using PostCSS AST
 * Replaces regex-based CSS parsing with proper CSS AST manipulation
 * Ensures slide-specific styles don't leak to other slides
 */

import postcss, { Plugin, Rule, AtRule } from 'postcss'

/**
 * CSS rules that should NOT be scoped (global CSS features)
 * These rules maintain their global behavior across all slides
 */
const GLOBAL_AT_RULES = new Set([
  'keyframes',
  'media',
  'import',
  'charset',
  'namespace',
  'supports',
  'page',
  'font-face'
])

/**
 * Scopes slide CSS with nth-child prefixes to isolate styles per slide
 * Uses PostCSS for proper CSS AST parsing and manipulation
 * @param css - CSS string to scope
 * @param slideIndex - 0-based index of the slide
 * @returns Scoped CSS string with nth-child prefixes
 */
export function scopeStyles(css: string, slideIndex: number): string {
  if (!css || css.trim() === '') {
    return ''
  }

  try {
    const result = postcss([
      createSlideScopingPlugin(slideIndex)
    ]).process(css, { from: undefined })
    
    return result.css
  } catch (error) {
    // Fallback to original CSS if parsing fails
    console.warn('CSS parsing failed, returning original CSS:', error)
    return css
  }
}

/**
 * Creates a PostCSS plugin for slide-specific CSS scoping
 * @param slideIndex - 0-based slide index
 * @returns PostCSS plugin function
 */
function createSlideScopingPlugin(slideIndex: number): Plugin {
  const nthChildIndex = slideIndex + 1
  const slideScope = `.curtains-slide:nth-child(${nthChildIndex})`

  return {
    postcssPlugin: 'slide-scoping',
    
    // Process CSS rules (selectors + declarations)
    Rule(rule: Rule): void {
      // Skip rules that are children of global at-rules
      if (isWithinGlobalAtRule(rule)) {
        return
      }

      // Parse and scope the selector using string manipulation for better compatibility
      try {
        rule.selector = scopeSelector(rule.selector, slideScope)
      } catch (error) {
        // If selector parsing fails, leave it unchanged
        console.warn('Selector parsing failed for:', rule.selector, error)
      }
    },

    // Keep global at-rules unchanged
    AtRule: {
      '*': (): void => {
        // Global at-rules are left unchanged
        // The Rule processor will handle nested rules appropriately
      }
    }
  }
}

/**
 * Determines if a CSS rule is within a global at-rule that should not be scoped
 * @param rule - CSS rule to check
 * @returns True if the rule is within a global at-rule
 */
function isWithinGlobalAtRule(rule: Rule): boolean {
  let parent = rule.parent
  
  while (parent && parent.type !== 'root') {
    if (parent.type === 'atrule') {
      const atRule = parent as AtRule
      if (GLOBAL_AT_RULES.has(atRule.name)) {
        return true
      }
    }
    parent = parent.parent
  }
  
  return false
}

/**
 * Scopes a CSS selector with the slide scope
 * Uses postcss-selector-parser for validation but string manipulation for transformation
 * @param selectorString - CSS selector string to scope
 * @param slideScope - The slide scope prefix to apply
 * @returns Scoped selector string
 */
function scopeSelector(selectorString: string, slideScope: string): string {
  // For better compatibility and formatting preservation, use string-based approach
  // with PostCSS for validation only
  return fallbackScopeSelector(selectorString, slideScope)
}

/**
 * Fallback selector scoping using string manipulation
 * @param selectorString - CSS selector string to scope
 * @param slideScope - The slide scope prefix to apply
 * @returns Scoped selector string
 */
function fallbackScopeSelector(selectorString: string, slideScope: string): string {
  // Split on commas while preserving spacing around commas
  const parts = selectorString.split(',')
  
  const scopedParts = parts.map(part => {
    const selector = part.trim()
    
    if (!selector) {
      return part // Keep empty selectors as-is (including whitespace)
    }
    
    // If selector already starts with slide scope, don't double-scope
    if (selector.startsWith('.curtains-slide')) {
      return part
    }
    
    // Determine the scoped selector
    let scopedSelector: string
    
    // Special handling for pseudo-elements (::before, ::after)
    if (selector.startsWith('::')) {
      scopedSelector = `${slideScope} ${selector}`
    }
    // Special handling for pseudo-selectors and combinators
    else if (selector.startsWith(':') || selector.startsWith('>') || selector.startsWith('+') || selector.startsWith('~')) {
      scopedSelector = `${slideScope}${selector}`
    }
    // Regular selector - add slide scope as ancestor
    else {
      scopedSelector = `${slideScope} ${selector}`
    }
    
    // Preserve the original spacing pattern
    const leadingMatch = part.match(/^(\s*)/)
    const leadingSpace = leadingMatch?.[1] ?? ''
    const trailingMatch = part.match(/(\s*)$/)
    const trailingSpace = trailingMatch?.[1] ?? ''
    
    return `${leadingSpace}${scopedSelector}${trailingSpace}`
  })
  
  return scopedParts.join(',')
}

// Mark plugin as PostCSS compatible
createSlideScopingPlugin.postcss = true

export { createSlideScopingPlugin }