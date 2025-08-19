# Parser

## Input
Raw `.curtain` file content

## Output
CurtainsDocument AST

## Process

### 1. Split Document
```typescript
function splitDocument(source: string) {
  const parts = source.split(/^\s*===\s*$/m)
  return {
    globalContent: parts[0] || '',
    slideContents: parts.slice(1).filter(s => s.trim())
  }
}
```

### 2. Extract Styles
```typescript
function extractStyles(content: string, isGlobal: boolean) {
  const styles = []
  const clean = content.replace(/<style>([\s\S]*?)<\/style>/gi, 
    (match, css) => {
      styles.push({
        css,
        position: isGlobal ? 'global' : 'slide'
      })
      return ''  // Remove from content
    })
  return { content: clean, styles }
}
```

### 3. Parse Containers
```typescript
function parseContainers(content: string) {
  // Replace <container> with placeholder markers
  // Recursively parse nested containers
  // Return content with markers + container map
  const containers = new Map()
  const marked = content.replace(
    /<container\s+class="([^"]*)">([\s\S]*?)<\/container>/gi,
    (match, classes, inner) => {
      const id = generateId()
      // Recursive parse for nested containers
      const parsed = parseContainers(inner)
      containers.set(id, {
        type: 'container',
        classes: classes.split(/\s+/),
        children: parseMarkdown(parsed.content)
      })
      return `{{CONTAINER:${id}}}`
    })
  return { content: marked, containers }
}
```

### 4. Parse Markdown
```typescript
function parseMarkdown(content: string) {
  // Use remark with CommonMark
  // HTML is escaped by default
  return remark().parse(content)
}
```

### 5. Build AST
```typescript
function buildAST(markdownAST, containers) {
  // Walk tree and replace container markers
  // with actual container nodes
  // Return complete AST
}
```

## Edge Cases
- No delimiters → entire document is one slide
- Empty slides → filtered out
- Unclosed containers → auto-close at slide boundary
- Malformed styles → skip block, log warning