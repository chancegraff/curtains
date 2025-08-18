# Extension Points

The architecture supports future extensions through well-defined extension points and patterns.

## Plugin System

### Hook into Parser/Transformer/Renderer Phases

Future plugin API could allow intercepting and modifying data at each phase:

```typescript
interface CurtainsPlugin {
  name: string
  version: string
  
  // Parser hooks
  beforeParse?: (source: string) => string
  afterParse?: (document: CurtainsDocument) => CurtainsDocument
  
  // Transformer hooks
  beforeTransform?: (document: CurtainsDocument) => CurtainsDocument
  afterTransform?: (transformed: TransformedDocument) => TransformedDocument
  
  // Renderer hooks
  beforeRender?: (transformed: TransformedDocument) => TransformedDocument
  afterRender?: (html: string) => string
}
```

## Custom Elements

### Add New Element Types Beyond `<container>`

The parser could be extended to recognize additional custom elements:

```typescript
// Future: Register custom element parsers
registerElement('chart', {
  parse: (content: string, attributes: Map<string, string>) => ChartNode,
  transform: (node: ChartNode) => string,
  styles: () => string
})
```

Example usage:
```markdown
<chart type="bar" data="sales.json">
  Sales by Quarter
</chart>
```

## Theme System

### Theme Registry and Custom Themes

Extend beyond light/dark to support custom themes:

```typescript
interface Theme {
  name: string
  variables: Record<string, string>
  baseCSS?: string
  fonts?: string[]
}

// Register custom theme
registerTheme({
  name: 'corporate',
  variables: {
    '--curtains-bg-primary': '#003366',
    '--curtains-text-primary': '#ffffff',
    // ...
  }
})
```

## Export Formats

### Additional Output Formats

The renderer could be extended to support multiple output formats:

#### PDF Export
```typescript
interface PDFRenderer extends Renderer {
  renderToPDF(document: TransformedDocument): Buffer
}
```

#### PowerPoint Export
```typescript
interface PPTXRenderer extends Renderer {
  renderToPPTX(document: TransformedDocument): Buffer
}
```

#### Markdown Export
```typescript
interface MarkdownRenderer extends Renderer {
  renderToMarkdown(document: CurtainsDocument): string
}
```

## Development Features

### Watch Mode

File watcher for automatic rebuilds:

```typescript
interface WatchOptions extends BuildOptions {
  watch: boolean
  onChange?: (event: 'change' | 'add' | 'delete', path: string) => void
}

// Usage
curtains build deck.curtain --watch
```

### Live Reload

WebSocket server for hot reload during development:

```typescript
interface DevServer {
  start(port: number): void
  watch(files: string[]): void
  reload(): void
}

// Inject reload script in development
if (options.liveReload) {
  html += '<script src="ws://localhost:3000/livereload.js"></script>'
}
```

## Syntax Extensions

### Syntax Highlighting

Integrate Prism.js or Shiki for code highlighting:

```typescript
// Parser extension
import { highlight } from 'shiki'

function parseCodeBlock(code: string, language: string): HighlightedCode {
  return highlight(code, { theme: 'github-dark', lang: language })
}
```

### Math Support

Add KaTeX or MathJax for mathematical notation:

```typescript
// Parser extension for math blocks
function parseMathBlock(latex: string): MathNode {
  return {
    type: 'math',
    value: latex,
    html: katex.renderToString(latex)
  }
}
```

Usage:
```markdown
$$
\frac{1}{2} \sum_{i=1}^{n} x_i^2
$$
```

## Interactive Features

### Fragments

Progressive reveal of content:

```markdown
<fragment>
- First point appears
- <fragment>Then this</fragment>
- <fragment>Finally this</fragment>
</fragment>
```

### Speaker Notes

Hidden notes for presenters:

```markdown
<notes>
Remember to mention the quarterly results here.
Emphasize the growth in Q3.
</notes>
```

### Embedded Media

Rich media support:

```markdown
<video src="demo.mp4" autoplay loop />
<audio src="background.mp3" />
<iframe src="https://example.com" />
```

## Advanced Navigation

### Deep Linking

URL-based slide navigation:

```typescript
// Runtime extension
class Router {
  constructor(navigation: NavigationController) {
    window.addEventListener('hashchange', () => {
      const slide = parseInt(location.hash.slice(1))
      navigation.goToSlide(slide)
    })
  }
}
```

### Overview Mode

Grid view of all slides:

```typescript
// Runtime extension
class OverviewMode {
  toggle(): void {
    document.body.classList.toggle('overview-mode')
    // Apply grid layout to slides
  }
}
```

## Collaboration Features

### Remote Control

Control presentation from phone/tablet:

```typescript
interface RemoteControl {
  server: WebSocketServer
  clients: Set<WebSocket>
  
  broadcast(event: NavigationEvent): void
  handleCommand(command: RemoteCommand): void
}
```

### Audience Interaction

Real-time polls and Q&A:

```typescript
interface AudienceFeatures {
  createPoll(options: PollOptions): Poll
  enableQA(): QASession
  showReactions(): ReactionOverlay
}
```

## Implementation Strategy

Extensions would be implemented through:

1. **Core API**: Expose key functions and types
2. **Hook System**: Allow plugins to modify behavior
3. **Registry Pattern**: Register custom elements, themes, etc.
4. **Adapter Pattern**: Support multiple output formats
5. **Strategy Pattern**: Swap implementations (e.g., highlighters)

## Related Documentation

- [Overview](./overview.md) - Architecture principles
- [Modules](./modules.md) - Current module structure
- [Data Flow](./data-flow.md) - Extension points in pipeline