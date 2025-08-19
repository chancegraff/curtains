# Renderer

## Input
TransformedDocument (HTML slides + CSS)

## Output
Complete HTML file string

## Process

### 1. Transform AST to HTML
```typescript
function astToHTML(ast: CurtainsAST): string {
  // Use rehype to convert Markdown nodes
  // Transform container nodes to divs
  // Add target="_blank" to external links
}

function transformContainer(node: ContainerNode): string {
  const classes = node.classes.join(' ')
  const children = node.children.map(astToHTML).join('')
  return `<div class="${classes}">${children}</div>`
}
```

### 2. Scope Slide Styles
```typescript
function scopeStyles(css: string, slideIndex: number): string {
  // Prefix selectors with .curtains-slide:nth-child(n)
  // Don't scope @keyframes or @media
  return css.replace(/([^{]+){/g, (match, selector) => {
    if (selector.includes('@')) return match
    return `.curtains-slide:nth-child(${slideIndex + 1}) ${selector}{`
  })
}
```

### 3. Merge Styles
```typescript
function mergeStyles(base, theme, global, slideStyles) {
  // Order matters for cascade:
  return [
    base,           // Framework CSS
    theme,          // Theme variables
    global,         // User global
    ...slideStyles  // Per-slide (already scoped)
  ].join('\n\n')
}
```

### 4. Build HTML Template
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presentation</title>
  <style>{{STYLES}}</style>
</head>
<body>
  <div class="curtains-root" data-theme="{{THEME}}">
    <div class="curtains-stage">
      {{SLIDES}}
    </div>
    <div class="curtains-counter">
      <span class="current">1</span>/<span class="total">{{COUNT}}</span>
    </div>
  </div>
  <script>{{RUNTIME}}</script>
</body>
</html>
```

### 5. Runtime JavaScript
```javascript
// Embedded inline (not external file)
const nav = {
  current: 0,
  total: document.querySelectorAll('.curtains-slide').length,
  go(n) {
    this.current = (n + this.total) % this.total
    document.querySelector('.curtains-stage').style.transform = 
      `translateX(-${this.current * 100}%)`
    document.querySelector('.current').textContent = this.current + 1
  }
}

// Keyboard: arrows, space, F
// Click: next slide
// Auto-init on load
```