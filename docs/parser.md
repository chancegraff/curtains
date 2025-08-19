# Parser

Converts `.curtain` files to validated AST.

## Implementation

```typescript
import { z } from 'zod'
import { remark } from 'remark'
import { 
  CurtainsDocumentSchema,
  CurtainsSlideSchema,
  ContainerNodeSchema,
  REGEX,
  DEFAULTS
} from './data-structures'

// Input validation schema
const ParseInputSchema = z.string().min(1, 'Input cannot be empty')

// Style extraction result
const ExtractedStyleSchema = z.object({
  content: z.string(),
  styles: z.array(z.object({
    css: z.string(),
    scope: z.enum(['global', 'slide'])
  }))
})

// Container info schema
const ContainerInfoSchema = z.object({
  id: z.string().uuid(),
  classes: z.array(z.string().regex(REGEX.CLASS_NAME)),
  innerContent: z.string()
})

export function parse(input: unknown): z.infer<typeof CurtainsDocumentSchema> {
  // 1. Validate input
  const source = ParseInputSchema.parse(input)
  
  // 2. Split on delimiters
  const parts = source.split(REGEX.DELIMITER)
  const globalContent = parts[0] || ''
  const slideContents = parts.slice(1).filter(s => s.trim())
  
  // 3. Extract global styles
  const globalExtracted = extractStyles(globalContent, 'global')
  const globalCSS = globalExtracted.styles
    .map(s => s.css)
    .join('\n')
  
  // 4. Parse slides
  const slides = slideContents.map((content, index) => {
    // Validate slide index
    if (index >= DEFAULTS.MAX_SLIDES) {
      throw new Error(`Too many slides (max ${DEFAULTS.MAX_SLIDES})`)
    }
    
    // Extract slide styles
    const extracted = extractStyles(content, 'slide')
    
    // Parse containers and markdown
    const { marked, containers } = parseContainers(extracted.content)
    const mdast = parseMarkdown(marked)
    const ast = buildAST(mdast, containers)
    
    // Validate and return slide
    return CurtainsSlideSchema.parse({
      type: 'curtains-slide',
      index,
      ast,
      slideCSS: extracted.styles.map(s => s.css).join('\n')
    })
  })
  
  // 5. Validate and return document
  return CurtainsDocumentSchema.parse({
    type: 'curtains-document',
    version: '0.1',
    slides,
    globalCSS
  })
}

function extractStyles(
  content: string,
  scope: 'global' | 'slide'
): z.infer<typeof ExtractedStyleSchema> {
  const styles: Array<{ css: string; scope: 'global' | 'slide' }> = []
  
  const clean = content.replace(REGEX.STYLE, (_, css) => {
    styles.push({ css: String(css), scope })
    return '' // Remove from content
  })
  
  return ExtractedStyleSchema.parse({
    content: clean,
    styles
  })
}

function parseContainers(content: string): {
  marked: string
  containers: Map<string, z.infer<typeof ContainerNodeSchema>>
} {
  const containers = new Map()
  let depth = 0
  
  const marked = content.replace(REGEX.CONTAINER, (_, classes, inner) => {
    // Check nesting depth
    depth++
    if (depth > DEFAULTS.MAX_NESTING_DEPTH) {
      throw new Error(`Container nesting too deep (max ${DEFAULTS.MAX_NESTING_DEPTH})`)
    }
    
    const id = crypto.randomUUID()
    const classArray = String(classes).split(/\s+/).filter(Boolean)
    
    // Validate classes
    classArray.forEach(cls => {
      if (!REGEX.CLASS_NAME.test(cls)) {
        throw new Error(`Invalid class name: ${cls}`)
      }
    })
    
    // Recursively parse inner containers
    const { marked: innerMarked, containers: innerContainers } = 
      parseContainers(inner)
    
    // Merge inner containers
    innerContainers.forEach((value, key) => {
      containers.set(key, value)
    })
    
    // Store this container
    const node = ContainerNodeSchema.parse({
      type: 'container',
      classes: classArray,
      children: [] // Will be populated in buildAST
    })
    
    containers.set(id, node)
    depth--
    
    return `{{CONTAINER:${id}}}`
  })
  
  return { marked, containers }
}

function parseMarkdown(content: string) {
  // Use remark to parse markdown
  // Returns mdast nodes
  return remark().parse(content)
}

function buildAST(
  mdast: unknown,
  containers: Map<string, z.infer<typeof ContainerNodeSchema>>
) {
  // Walk mdast tree and replace container placeholders
  // Implementation depends on mdast structure
  // Return validated CurtainsAST
  return {
    type: 'root' as const,
    children: []
  }
}
```