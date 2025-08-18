# User Workflow

## Authoring Presentations

Users write presentations in plain text using Curtains' extended Markdown format:

```markdown
<!-- Global styles (before first ===) apply to all slides -->
<style>
.hero-slide {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
.two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}
</style>

===

<!-- Slide 1 -->
<container class="hero-slide centered">
# Welcome
This is _Curtains_.
</container>

<!-- This style block is automatically scoped to slide 1 only -->
<style>
.hero-slide {
  background: linear-gradient(135deg, #667eea, #764ba2);
}
.centered {
  text-align: center;
  color: white;
}
</style>

===

<!-- Slide 2 -->
<container class="two-column">
  <container class="column left">
  ## Agenda
  - Intro
  - Main Idea
  - Q&A
  </container>

  <container class="column right">
  ![diagram](./images/diagram.png)
  </container>
</container>

<!-- This style block is automatically scoped to slide 2 only -->
<style>
.column {
  padding: 1rem;
}
.left {
  border-right: 1px solid #ddd;
}
</style>

===

## Thanks
```

## Building Presentations

### Installation

Install Curtains globally via npm:
```bash
npm install -g curtains
```

Or use directly with npx:
```bash
npx curtains build deck.curtain -o deck.html
```

### Build Command

```bash
curtains build deck.curtain -o deck.html --theme light
```

### File Convention
* **Source files:** Use `.curtain` extension
* **Output files:** Standard `.html` files
* **Images:** Place relative to source file

### Build Options
* `-o, --output`: Output HTML path (required)
* `--theme`: Choose `light` or `dark` theme (default: light)

## Presenting

### Opening Presentations

Simply open the generated HTML file in any modern browser:
- Double-click the file
- Drag into browser window
- Use `file://` URL
- Serve via web server

### Navigation Controls

#### Keyboard
* `→` / `Space` / `Enter`: Next slide
* `←`: Previous slide
* `F`: Toggle fullscreen

#### Mouse
* Click anywhere: Next slide
* Right-click: Browser context menu (not navigation)

#### Touch (Mobile/Tablet)
* Swipe left: Next slide
* Swipe right: Previous slide
* Tap: Next slide

### Presentation Features

#### Slide Counter
- Shows `current/total` format
- Always visible in bottom-right corner
- Example: `3/10` for slide 3 of 10

#### Wrap-Around Navigation
- After last slide, next goes to first
- Before first slide, previous goes to last
- Seamless continuous presentation

#### Fullscreen Mode
- Press `F` to enter/exit fullscreen
- Hides browser chrome
- Focuses attention on content

## File Organization

### Recommended Structure
```
project/
├── presentation.curtain    # Source file
├── presentation.html      # Generated output
├── images/               # Image assets
│   ├── diagram.png
│   ├── chart.svg
│   └── photo.jpg
└── README.md            # Documentation
```

### Image Handling
- Use relative paths in source
- Keep images near source file
- Generated HTML preserves relative paths
- Place HTML in same directory as source for seamless image loading

## Workflow Tips

### Development Workflow
1. Edit `.curtain` file in text editor
2. Run build command
3. Refresh browser to see changes
4. Iterate until satisfied

### Version Control
- Commit `.curtain` source files
- Optionally commit generated `.html` for easy sharing
- Track image assets
- Use `.gitignore` for temporary files

### Sharing Presentations
- Send single HTML file
- Upload to web server
- Share via cloud storage
- Email as attachment
- No special software required for viewing

### Backup Strategy
- Keep source `.curtain` files
- Version control for history
- Generated HTML is reproducible
- Store images separately

## Common Patterns

### Title Slides
```markdown
<container class="title-slide">
# Presentation Title
## Subtitle
*Author Name | Date*
</container>
```

### Content Slides
```markdown
<container class="content-slide">
## Section Title

Main content goes here with full Markdown support.

- Bullet points
- **Bold text**
- *Italic text*
- [Links](https://example.com)
</container>
```

### Two-Column Layouts
```markdown
<container class="columns">
  <container class="left-column">
  Left content
  </container>
  
  <container class="right-column">
  Right content
  </container>
</container>
```

## Related Documentation

- [CLI Contract](./cli-contract.md) - Command-line details
- [Source Format](./source-format.md) - Markdown syntax
- [Examples](./examples.md) - Complete examples