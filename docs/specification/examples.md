# Examples

## Complete Example Presentation

This comprehensive example demonstrates all major Curtains features:

```curtain
<!-- Global styles that apply to ALL slides -->
<style>
/* Base layout classes available throughout the presentation */
.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.centered {
  text-align: center;
}

/* Default container styling */
.content-slide {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
</style>

===

<!-- Slide 1: Title slide with its own unique styling -->
<container class="title-slide">
# My Presentation
*By Author Name*
</container>

<!-- These styles apply ONLY to slide 1 -->
<!-- Automatically scoped: .curtains-slide:nth-child(1) .title-slide -->
<style>
.title-slide {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.title-slide h1 {
  font-size: 4rem;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.title-slide em {
  font-size: 1.5rem;
  opacity: 0.9;
}
</style>

===

<!-- Slide 2: Content slide with different styling -->
<container class="content-slide">
## Main Content

<container class="columns">
  <container class="column">
  ### Key Points
  - Point 1
  - Point 2
  - Point 3
  </container>

  <container class="column">
  ![diagram](./diagram.png)
  </container>
</container>
</container>

<!-- These styles apply ONLY to slide 2 -->
<!-- Automatically scoped: .curtains-slide:nth-child(2) .column -->
<style>
.column {
  padding: 1rem;
}

.column:first-child {
  border-right: 2px solid var(--curtains-accent-primary);
}

.column img {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
</style>

===

<!-- Slide 3: Closing slide with minimal custom styling -->
<container class="content-slide centered">
## Thank You!

Questions?
</container>

<!-- These styles apply ONLY to slide 3 -->
<!-- Demonstrates that slide-scoped styles can override global styles -->
<style>
.content-slide {
  /* Overrides the global .content-slide padding */
  padding: 4rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
  background: var(--curtains-bg-secondary);
}

.content-slide h2 {
  color: var(--curtains-accent-primary);
  font-size: 3rem;
  margin-bottom: 2rem;
}
</style>
```

## How the Scoping Works

### Global Styles (before first `===`)
Applied as-is to all slides:
```css
.columns { /* Available on all slides */ }
.centered { /* Available on all slides */ }
.content-slide { /* Base styling for all slides */ }
```

### Slide 1 Styles
Automatically prefixed:
```css
/* Input */
.title-slide { background: linear-gradient(...); }

/* Output */
.curtains-slide:nth-child(1) .title-slide { background: linear-gradient(...); }
```

### Slide 2 Styles
Automatically prefixed:
```css
/* Input */
.column { padding: 1rem; }

/* Output */
.curtains-slide:nth-child(2) .column { padding: 1rem; }
```

### Slide 3 Styles
Override global with higher specificity:
```css
/* Global */
.content-slide { padding: 2rem; }

/* Slide 3 (higher specificity) */
.curtains-slide:nth-child(3) .content-slide { padding: 4rem; }
```

## Common Patterns

### Hero/Title Slide
```curtain
===

<container class="hero">
# Big Title
## Subtitle
*Date and Author*
</container>

<style>
.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: var(--curtains-accent-primary);
  color: white;
}
</style>
```

### Two-Column Layout
```curtain
===

<container class="two-col">
  <container class="left">
  ## Left Content
  - Item 1
  - Item 2
  </container>
  
  <container class="right">
  ## Right Content
  ![image](./image.png)
  </container>
</container>

<style>
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  height: 100%;
}
</style>
```

### Code Showcase
```curtain
===

## Code Example

<container class="code-showcase">
  <container class="description">
  This function calculates the factorial of a number recursively.
  </container>
  
  <container class="code">
  
```javascript
function factorial(n) {
  if (n <= 1) return 1
  return n * factorial(n - 1)
}
```
  
  </container>
</container>

<style>
.code-showcase {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.description {
  padding: 1rem;
  background: var(--curtains-bg-secondary);
  border-radius: 8px;
}

.code pre {
  font-size: 1.2rem;
}
</style>
```

### Image Gallery
```curtain
===

## Image Gallery

<container class="gallery">
  <container class="image-item">
  ![First](./img1.jpg)
  *Caption 1*
  </container>
  
  <container class="image-item">
  ![Second](./img2.jpg)
  *Caption 2*
  </container>
  
  <container class="image-item">
  ![Third](./img3.jpg)
  *Caption 3*
  </container>
</container>

<style>
.gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.image-item {
  text-align: center;
}

.image-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.image-item em {
  display: block;
  margin-top: 0.5rem;
  color: var(--curtains-text-secondary);
}
</style>
```

### Quote Slide
```curtain
===

<container class="quote-slide">
> "The best way to predict the future is to invent it."

*— Alan Kay*
</container>

<style>
.quote-slide {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.quote-slide blockquote {
  font-size: 2rem;
  font-style: italic;
  text-align: center;
  max-width: 800px;
  margin: 0 0 1rem 0;
}

.quote-slide em {
  font-size: 1.2rem;
  color: var(--curtains-text-secondary);
}
</style>
```

## CLI Usage Examples

### Basic Build
```bash
# Build with default light theme
curtains build presentation.curtain -o presentation.html

# Build with dark theme
curtains build presentation.curtain -o presentation.html --theme dark
```

### Different File Paths
```bash
# Relative paths
curtains build ./slides/talk.curtain -o ./dist/talk.html

# Absolute paths
curtains build /home/user/deck.curtain -o /var/www/deck.html

# Current directory
curtains build deck.curtain -o deck.html
```

### npm Scripts Integration
```json
{
  "scripts": {
    "build": "curtains build src/slides.curtain -o dist/index.html",
    "build:dark": "curtains build src/slides.curtain -o dist/dark.html --theme dark",
    "build:both": "npm run build && npm run build:dark"
  }
}
```

## Theme Variable Usage

### Using Theme Variables
```css
.custom-element {
  /* Colors adapt to theme automatically */
  background: var(--curtains-bg-secondary);
  color: var(--curtains-text-primary);
  border: 2px solid var(--curtains-accent-primary);
}

.custom-link {
  color: var(--curtains-link);
}

.custom-code {
  background: var(--curtains-code-bg);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
}
```

### Custom Color Schemes
```css
/* Override theme variables for specific slides */
.special-slide {
  --curtains-bg-primary: #ff6b6b;
  --curtains-text-primary: white;
}
```

## Advanced Layouts

### Grid-Based Dashboard
```curtain
===

<container class="dashboard">
  <container class="header">
  # Dashboard
  </container>
  
  <container class="stat">
  ## 150K
  Users
  </container>
  
  <container class="stat">
  ## 98%
  Uptime
  </container>
  
  <container class="chart">
  ![Chart](./chart.png)
  </container>
  
  <container class="details">
  ### Details
  Additional information here...
  </container>
</container>

<style>
.dashboard {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto 1fr 1fr;
  gap: 1rem;
  height: 100%;
  padding: 1rem;
}

.header {
  grid-column: 1 / -1;
}

.stat {
  background: var(--curtains-bg-secondary);
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.chart {
  grid-column: 1 / 3;
  grid-row: 3;
}

.details {
  grid-column: 3;
  grid-row: 2 / 4;
  background: var(--curtains-bg-secondary);
  padding: 1rem;
  border-radius: 8px;
}
</style>
```

## Related Documentation

- [Source Format](./source-format.md) - Complete syntax reference
- [User Workflow](./user-workflow.md) - How to create presentations
- [CLI Contract](./cli-contract.md) - Command-line usage