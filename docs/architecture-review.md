# Architectural Review: Curtains Markdown Rendering System

## Architectural Impact Assessment: **HIGH**

The markdown rendering system demonstrates a well-structured pipeline architecture with clear separation of concerns, though there are several architectural issues that need attention for long-term maintainability and extensibility.

---

## Pattern Compliance Checklist

✅ **Single Responsibility Principle**: Each module has clear, focused responsibilities
✅ **Dependency Injection**: Good use of functional composition
✅ **Immutability**: Proper use of pure functions throughout the pipeline
✅ **Schema Validation**: Excellent use of Zod for runtime type safety
⚠️ **Open/Closed Principle**: Limited extensibility for new markdown elements
⚠️ **Interface Segregation**: Some modules have unnecessarily broad interfaces
❌ **Liskov Substitution**: Custom markdown parser violates standard markdown parser interface expectations
❌ **Dependency Inversion**: Direct coupling to concrete implementations

---

## Architecture Overview

The system follows a **4-phase pipeline architecture**:

```
Input (.curtain) → Parser → Transformer → Renderer → Output (HTML)
                     ↓          ↓            ↓
                    AST    TransformedDoc  Complete HTML
```

### Strengths

1. **Clear Pipeline Architecture**
   - Well-defined phases with distinct responsibilities
   - Unidirectional data flow
   - Each phase produces validated, typed output

2. **Strong Type Safety**
   - Zod schemas provide runtime validation
   - TypeScript types inferred from schemas ensure consistency
   - Proper error boundaries at phase transitions

3. **Good Separation of Concerns**
   - Parser handles markdown and container parsing
   - Transformer handles AST-to-HTML conversion
   - Renderer handles final assembly and styling

---

## Critical Architectural Issues

### 1. **Custom Markdown Parser Implementation** 🔴

The system implements its own markdown parser (`parseBasicMarkdown`) instead of using established libraries like remark/rehype (which are dependencies but unused).

**Problems:**
- **Reinventing the wheel** with 500+ lines of custom parsing logic
- **Incomplete markdown spec compliance** (missing features like inline code, strikethrough, etc.)
- **Maintenance burden** for edge cases and spec updates
- **Security concerns** with HTML sanitization (only partial implementation)

**Example of problematic code:**
```typescript
// src/parser/markdown.ts lines 53-168
function parseBasicMarkdown(content: string): MarkdownNode {
  // Custom parsing logic with nested complexity
  // Multiple regex patterns and string manipulations
  // Potential for edge case bugs
}
```

**Recommendation:**
Replace with remark/rehype pipeline already in dependencies:
```typescript
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'

export function parseMarkdown(content: string) {
  return unified()
    .use(remarkParse)
    .use(remarkRehype)
    .processSync(content)
}
```

---

### 2. **Container Placeholder System Complexity** 🔴

The container parsing uses a complex placeholder replacement system that violates clean architecture principles.

**Problems:**
- **String manipulation instead of AST transformation**
- **Complex brace counting logic** prone to errors
- **Nested container handling** through string replacement
- **Tight coupling** between container and markdown parsing

**Example:**
```typescript
// src/parser/containers.ts lines 119-137
const placeholder = `{{CONTAINER:${container.id}:${innerProcessed}}}`
// Later needs complex extraction logic to parse these placeholders
```

**Recommendation:**
Use proper AST node injection:
```typescript
interface ContainerNode extends ASTNode {
  type: 'container'
  classes: string[]
  children: ASTNode[]
  // No string placeholders needed
}
```

---

### 3. **Missing Abstraction Layer** 🟡

No interface abstraction between parser and transformer phases.

**Problems:**
- **Direct coupling** to specific AST structure
- **Difficult to swap** parser implementations
- **No adapter pattern** for different markdown flavors

**Recommendation:**
Introduce parser interface:
```typescript
interface IMarkdownParser {
  parse(content: string): ASTNode
  supports(format: string): boolean
}

interface ITransformer {
  transform(ast: ASTNode): TransformedDocument
}
```

---

### 4. **Style Scoping Implementation** 🟡

The CSS scoping uses string manipulation instead of proper CSS AST parsing.

**Problems:**
- **Regex-based CSS parsing** is fragile
- **No support for CSS nesting** or modern features
- **Potential for selector conflicts** with complex CSS

**Example:**
```typescript
// src/transformer/style-scoping.ts line 86
const scopedSelector = scopeSelector(selector, slideIndex)
// Simple string concatenation, not CSS-aware
```

**Recommendation:**
Use a CSS parser like PostCSS:
```typescript
import postcss from 'postcss'

export function scopeStyles(css: string, slideIndex: number) {
  return postcss()
    .use(slideScopingPlugin(slideIndex))
    .process(css)
    .css
}
```

---

### 5. **Error Handling Strategy** 🟡

Error handling is inconsistent across modules.

**Problems:**
- **Mixed error types** (Zod errors, custom errors, string errors)
- **Lost error context** during phase transitions
- **No error recovery** mechanisms

**Recommendation:**
Implement consistent error hierarchy:
```typescript
abstract class CurtainsError extends Error {
  constructor(
    public code: ErrorCode,
    public phase: 'parse' | 'transform' | 'render',
    public context: unknown,
    message: string
  ) {
    super(message)
  }
}
```

---

## Performance Considerations

### Current Issues:
1. **Multiple AST traversals** in transformation phase
2. **String concatenation** for large HTML output
3. **No streaming support** for large presentations
4. **Synchronous processing** blocks on large files

### Recommendations:
```typescript
// Use string builder pattern
class HTMLBuilder {
  private chunks: string[] = []
  
  append(html: string): this {
    this.chunks.push(html)
    return this
  }
  
  toString(): string {
    return this.chunks.join('')
  }
}

// Support streaming for large files
async function* streamTransform(ast: ASTNode) {
  for (const node of ast.children) {
    yield transformNode(node)
  }
}
```

---

## Extensibility Issues

### Current Limitations:
1. **Hard-coded markdown elements** in switch statements
2. **No plugin system** for custom elements
3. **Fixed transformation pipeline**
4. **No middleware support**

### Recommended Plugin Architecture:
```typescript
interface MarkdownPlugin {
  name: string
  nodeType: string
  parse?: (content: string) => ASTNode
  transform?: (node: ASTNode) => string
  validate?: (node: ASTNode) => boolean
}

class PluginRegistry {
  private plugins = new Map<string, MarkdownPlugin>()
  
  register(plugin: MarkdownPlugin): void {
    this.plugins.set(plugin.nodeType, plugin)
  }
  
  transform(node: ASTNode): string {
    const plugin = this.plugins.get(node.type)
    return plugin?.transform?.(node) ?? defaultTransform(node)
  }
}
```

---

## Recommended Refactoring Priority

### High Priority:
1. **Replace custom markdown parser** with remark/unified pipeline
2. **Remove container placeholder system** in favor of proper AST nodes
3. **Implement consistent error handling**

### Medium Priority:
1. **Add abstraction interfaces** between phases
2. **Replace string-based CSS scoping** with PostCSS
3. **Implement plugin architecture**

### Low Priority:
1. **Add streaming support** for large presentations
2. **Optimize AST traversal** with visitor pattern
3. **Add caching layer** for repeated transformations

---

## Long-term Implications

### If Not Addressed:
- **Technical debt** will compound with each new markdown feature
- **Security vulnerabilities** from improper HTML/CSS handling
- **Performance degradation** as presentations grow larger
- **Difficult migration path** to standard markdown parsers
- **Limited community adoption** due to non-standard markdown support

### Benefits of Refactoring:
- **Reduced maintenance** by leveraging battle-tested libraries
- **Better markdown compatibility** with CommonMark spec
- **Easier testing** with clear interfaces
- **Plugin ecosystem** potential
- **Performance improvements** from optimized libraries

---

## Conclusion

The Curtains project demonstrates solid architectural thinking with its pipeline approach and type safety. However, the custom markdown parser implementation and string-based transformation approach create significant technical debt. The recommended refactoring to use established markdown parsing libraries (already in dependencies) would dramatically improve maintainability, security, and extensibility while reducing code complexity by approximately 40%.

The architecture would benefit most from embracing established patterns in the markdown ecosystem rather than reimplementing core functionality. This would allow the team to focus on the unique value proposition of Curtains (the presentation layer) rather than maintaining a custom markdown parser.