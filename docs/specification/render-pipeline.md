# Render Pipeline

## Overview

The render pipeline transforms the parsed AST into a self-contained HTML presentation with embedded CSS and JavaScript.

## Pipeline Stages

### Stage 0: AST to HTML Transformation

Transform AST nodes to HTML:
- Process container nodes → `<div>` elements with classes
- Convert Markdown nodes → HTML via rehype
- Add `target="_blank" rel="noopener noreferrer"` to external links
- Preserve container nesting structure
- All other HTML remains escaped

### Stage 1: Style Processing

Process and scope CSS styles:
- Global styles: Applied as-is
- Slide-scoped styles: Prefixed with `.curtains-slide:nth-child(n)`
- Merge order: base → theme → global → slide-scoped

### Stage 2: HTML Structure Building

Create the presentation structure:
```html
<div class="curtains-root" data-theme="light">
  <div class="curtains-stage">
    <section class="curtains-slide">
      <!-- Slide content -->
    </section>
    <!-- More slides -->
  </div>
  <div class="curtains-counter">1/10</div>
</div>
```

### Stage 3: Template Injection

Inject content into HTML template with placeholders:
- `{{STYLES}}` → Merged CSS
- `{{CONTENT}}` → HTML slides
- `{{RUNTIME}}` → JavaScript
- `{{THEME}}` → Theme name

## Detailed Process

### AST to HTML Transformation

```typescript
function astToHTML(ast: CurtainsAST): string {
  // Use rehype to convert Markdown AST to HTML
  const processor = unified()
    .use(rehypeStringify)
    .use(rehypeSanitize) // Ensure HTML safety
    
  // Walk AST and handle special nodes
  walk(ast, (node) => {
    if (node.type === 'container') {
      return transformContainer(node)
    }
    if (node.type === 'link' && isExternal(node.url)) {
      node.properties = {
        ...node.properties,
        target: '_blank',
        rel: 'noopener noreferrer'
      }
    }
  })
  
  return processor.stringify(ast)
}
```

### Container Transformation

```typescript
function transformContainer(node: ContainerNode): string {
  const classes = node.classes.join(' ')
  const children = node.children.map(astToHTML).join('')
  
  return `<div class="${classes}">${children}</div>`
}
```

### Style Scoping

```typescript
function scopeStyles(css: string, slideIndex: number): string {
  // Parse CSS and prefix selectors
  const ast = parseCSS(css)
  
  walk(ast, (node) => {
    if (node.type === 'selector') {
      // Don't scope keyframes, media queries, etc.
      if (!isSpecialSelector(node)) {
        node.value = `.curtains-slide:nth-child(${slideIndex}) ${node.value}`
      }
    }
  })
  
  return stringifyCSS(ast)
}
```

Example transformation:
```css
/* Input */
.hero { color: red; }

/* Output for slide 2 */
.curtains-slide:nth-child(2) .hero { color: red; }
```

### Style Merging

```typescript
function mergeStyles(
  baseCSS: string,
  themeCSS: string,
  globalCSS: string,
  slideStyles: string[]
): string {
  // Merge in specific order for proper cascade
  const parts = [
    baseCSS,           // Framework styles
    themeCSS,          // Theme variables
    globalCSS,         // User global styles
    ...slideStyles     // Scoped slide styles
  ]
  
  return parts.filter(Boolean).join('\n\n')
}
```

CSS application order:
1. **Base styles**: Framework defaults
2. **Theme styles**: Color variables
3. **Global custom**: User's global styles
4. **Slide-scoped**: Per-slide styles (highest specificity)

### HTML Building

```typescript
function buildHTML(slides: TransformedSlide[]): string {
  const slideHTML = slides
    .map((slide, index) => `
      <section class="curtains-slide" data-slide="${index + 1}">
        ${slide.html}
      </section>
    `)
    .join('\n')
    
  return `
    <div class="curtains-stage">
      ${slideHTML}
    </div>
  `
}
```

### Template Structure

The base HTML template:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presentation</title>
  <style>
    {{STYLES}}
  </style>
</head>
<body>
  <div class="curtains-root" data-theme="{{THEME}}">
    {{CONTENT}}
    <div class="curtains-counter">
      <span class="current">1</span>/<span class="total">{{SLIDE_COUNT}}</span>
    </div>
  </div>
  <script>
    {{RUNTIME}}
  </script>
</body>
</html>
```

## Runtime JavaScript

### Embedded Runtime

The runtime is bundled and minified, then embedded inline:

```javascript
// Runtime provides:
class NavigationController {
  next() { /* ... */ }
  previous() { /* ... */ }
  goToSlide(n) { /* ... */ }
}

class KeyboardHandler {
  // Arrow keys, space, F for fullscreen
}

class FullscreenManager {
  toggle() { /* ... */ }
}

class CounterDisplay {
  update(current, total) { /* ... */ }
}

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', initRuntime)
```

### Navigation Logic

```javascript
function navigateToSlide(index) {
  // Apply transform to slide container
  const offset = -100 * index
  stageElement.style.transform = `translateX(${offset}%)`
  
  // Update counter
  counter.update(index + 1, totalSlides)
  
  // Update active state
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index)
  })
}
```

## CSS Architecture

### Base Styles

Framework styles for presentation structure:
```css
.curtains-root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.curtains-stage {
  display: flex;
  height: 100%;
  transition: transform 0.3s ease;
}

.curtains-slide {
  flex: 0 0 100%;
  height: 100%;
  overflow: auto;
  padding: 2rem;
}
```

### Theme Variables

Light theme example:
```css
[data-theme="light"] {
  --curtains-bg-primary: #ffffff;
  --curtains-bg-secondary: #f5f5f5;
  --curtains-text-primary: #333333;
  --curtains-text-secondary: #666666;
  --curtains-accent-primary: #0066cc;
  --curtains-link: #0066cc;
  --curtains-code-bg: #f0f0f0;
}
```

Dark theme example:
```css
[data-theme="dark"] {
  --curtains-bg-primary: #1a1a1a;
  --curtains-bg-secondary: #2a2a2a;
  --curtains-text-primary: #e0e0e0;
  --curtains-text-secondary: #a0a0a0;
  --curtains-accent-primary: #4499ff;
  --curtains-link: #4499ff;
  --curtains-code-bg: #2a2a2a;
}
```

## Output Characteristics

### File Size
- Base CSS: ~2KB
- Theme CSS: ~1KB per theme
- Runtime JS: ~5KB minified
- Typical presentation: 20-50KB total

### Performance
- Single file, no network requests
- CSS transforms for smooth animations
- Minimal DOM manipulation
- Hardware-accelerated transitions

### Compatibility
- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- Graceful degradation for missing features
- Mobile-friendly touch navigation

## Security Considerations

### CSS Injection
- User CSS not sanitized (user owns output)
- Scoped to prevent global pollution
- No external resource loading

### JavaScript
- No user JavaScript execution
- Runtime is pre-compiled and safe
- No eval() or dynamic code execution

### HTML
- All user HTML escaped
- Only `<container>` elements processed
- External links marked with security attributes

## Related Documentation

- [Parsing Pipeline](./parsing-pipeline.md) - AST generation
- [Source Format](./source-format.md) - Input syntax
- [Examples](./examples.md) - Complete examples