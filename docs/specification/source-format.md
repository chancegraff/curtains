# Source Format

## File Extension

Curtains source files use the `.curtain` extension by convention.

## Document Structure

A Curtains document consists of:
1. Optional global content (before first `===`)
2. One or more slides (separated by `===`)

## Slide Delimiter

### Syntax
A line containing exactly `===` separates slides.

### Rules
- Must be on its own line
- Can have whitespace before/after
- Regex pattern: `/^\s*===\s*$/`

### Example
```markdown
Global content here

===

Slide 1 content

===

Slide 2 content
```

## Markdown Support

### Scope
- **Full CommonMark** specification via `remark`
- **Raw HTML is disallowed** and will be escaped
- Standard Markdown features work as expected

### Supported Elements
- Headers (`#`, `##`, `###`, etc.)
- Paragraphs
- Lists (ordered and unordered)
- Links
- Images
- Code blocks and inline code
- Blockquotes
- Horizontal rules
- Emphasis (bold, italic)
- Tables (with extension)

### HTML Escaping
All HTML tags in Markdown content are escaped:
```markdown
<!-- This will be displayed as text, not rendered -->
<div>This is escaped</div>
<script>alert('Also escaped')</script>
```

## Container Elements

### Purpose
Containers provide layout control and styling hooks for content.

### Syntax
```markdown
<container class="class-name">
  Content goes here
</container>
```

### Features
- **Curtains-specific element:** ONLY `<container>` tags are processed
- **Attributes:** `class` only (other attributes ignored)
- **Multiple classes:** Supported with space separation
- **Nesting:** Full support with proper matching
- **HTML output:** Renders as `<div>` with specified classes

### Examples

#### Single Class
```markdown
<container class="centered">
  # Centered Content
</container>
```

#### Multiple Classes
```markdown
<container class="card shadow-lg rounded">
  Content with multiple style classes
</container>
```

#### Nested Containers
```markdown
<container class="outer">
  <container class="inner">
    Nested content
  </container>
</container>
```

### Important Notes
- Only `<container>` elements are processed
- All other HTML remains escaped
- Containers must have matching open/close tags
- Maximum nesting depth: 10 levels

## Style Blocks

### Purpose
Custom CSS can be embedded directly in presentations using `<style>` tags.

### Position-Based Scoping

#### Global Styles
`<style>` blocks **BEFORE** the first `===` apply to all slides:

```markdown
<style>
/* These styles apply to ALL slides */
.my-class {
  color: blue;
  font-size: 1.2rem;
}
</style>

===

First slide content
```

#### Slide-Scoped Styles
`<style>` blocks **AFTER** a `===` are automatically scoped to that slide:

```markdown
===

## Slide Content

<style>
/* These styles apply ONLY to this slide */
/* Automatically prefixed as: .curtains-slide:nth-child(1) .my-class */
.my-class {
  font-size: 2rem;
}
</style>
```

### Features
- **No scoped attribute needed:** Position determines scope
- **Multiple blocks:** Allowed and concatenated
- **Automatic prefixing:** Slide styles get `.curtains-slide:nth-child(n)` prefix
- **Override capability:** Slide styles override global styles
- **IDE support:** Most editors provide CSS syntax highlighting

### Scope Examples

#### Global Style Block
```html
<!-- Before first === -->
<style>
.hero {
  min-height: 100vh;
  display: flex;
}
</style>
```

#### Slide-Scoped Style Block
```html
<!-- After === delimiter -->
<style>
/* Becomes: .curtains-slide:nth-child(2) .hero */
.hero {
  background: linear-gradient(45deg, #000, #333);
}
</style>
```

### CSS Code Examples
To show CSS as code (not apply as styles), use code blocks:

````markdown
```css
/* This is displayed as code, not applied */
.example {
  color: red;
}
```
````

## Theme Variables

Curtains provides CSS variables for consistent theming:

### Color Variables
- `--curtains-bg-primary`: Primary background
- `--curtains-bg-secondary`: Secondary background
- `--curtains-text-primary`: Primary text color
- `--curtains-text-secondary`: Secondary text color
- `--curtains-accent-primary`: Primary accent color
- `--curtains-link`: Link color
- `--curtains-code-bg`: Code block background

### Usage in Styles
```css
.my-element {
  background: var(--curtains-bg-secondary);
  color: var(--curtains-text-primary);
  border: 2px solid var(--curtains-accent-primary);
}
```

### Theme Switching
Variables automatically update based on `--theme` flag:
- Light theme: Light backgrounds, dark text
- Dark theme: Dark backgrounds, light text

## Empty Slides

Slides that produce no visible content are automatically filtered out:
- Empty strings after trimming
- Only whitespace
- Only HTML comments

## Images

### Relative Paths
```markdown
![Alt text](./images/diagram.png)
![Logo](../assets/logo.svg)
```

### Absolute URLs
```markdown
![External image](https://example.com/image.jpg)
```

### Best Practices
- Use relative paths for local images
- Place images near source file
- Keep HTML output in same directory as source

## Links

### External Links
Automatically get `target="_blank" rel="noopener noreferrer"`:
```markdown
[External site](https://example.com)
```

### Internal Links
Hash links for same-page navigation:
```markdown
[Jump to section](#section-id)
```

## Code Blocks

### Fenced Code Blocks
````markdown
```javascript
function hello() {
  console.log('Hello, World!')
}
```
````

### Inline Code
```markdown
Use the `curtains build` command to compile.
```

## Complete Example

```curtain
<!-- Global styles -->
<style>
.slide {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}
</style>

===

<!-- Slide 1: Title -->
<container class="title-slide">
# My Presentation
*By Author Name*
</container>

<style>
.title-slide {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: var(--curtains-accent-primary);
  color: white;
}
</style>

===

<!-- Slide 2: Content -->
<container class="slide">
## Main Points

<container class="columns">
  <container class="column">
  ### Left Column
  - Point 1
  - Point 2
  - Point 3
  </container>
  
  <container class="column">
  ### Right Column
  ![Diagram](./diagram.png)
  </container>
</container>
</container>

<style>
.column {
  padding: 1rem;
}
</style>

===

<!-- Slide 3: Code -->
## Code Example

```javascript
// Example code
const curtains = require('curtains')
curtains.build('input.curtain', 'output.html')
```

Thank you!
```

## Related Documentation

- [Parsing Pipeline](./parsing-pipeline.md) - How source is processed
- [Examples](./examples.md) - Complete examples
- [User Workflow](./user-workflow.md) - How to write presentations