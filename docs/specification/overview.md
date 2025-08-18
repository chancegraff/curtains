# Specification Overview

## Project Overview

**Curtains** is a CLI tool that compiles an extended Markdown DSL with layout containers and custom styling into a **self-contained HTML slideshow**. The generated HTML behaves like a lightweight Google Slides presentation: fullscreen toggle, left-to-right navigation, click/arrow controls, and a slide counter overlay.

## Key Features

* **Input:** Extended Markdown with `===` as slide delimiter, container directives, and CSS blocks
* **Output:** Single HTML file with all JavaScript and CSS (theme + custom) embedded inline
* **MVP scope:** Full Markdown, container directives, custom CSS blocks, light/dark themes, relative image paths

## Core Concepts

### Self-Contained Output
Every generated presentation is a single HTML file with no external dependencies (except optional images). All CSS and JavaScript are embedded inline, making presentations portable and easy to share.

### Extended Markdown
Curtains extends standard Markdown with:
- Slide delimiters (`===`)
- Container elements for layout
- Style blocks for custom CSS
- Position-based style scoping

### Presentation Controls
Generated presentations include:
- Keyboard navigation (arrows, space, enter)
- Mouse click navigation
- Fullscreen mode (F key)
- Slide counter overlay
- Wrap-around navigation

## Design Goals

1. **Simplicity**: Author presentations in plain text
2. **Portability**: Single HTML file output
3. **Flexibility**: Full CSS customization
4. **Performance**: Lightweight runtime
5. **Compatibility**: Works in modern browsers

## Project Scope

### Included (MVP)
- Full CommonMark support
- Container directives for layout
- Custom CSS with automatic scoping
- Light and dark themes
- Relative image support
- Keyboard and mouse navigation
- Fullscreen mode
- Slide counter

### Excluded (MVP)
- Accessibility features (future)
- Fragments/progressive reveal
- Speaker notes
- 3D transitions
- Print/PDF export
- External CSS imports
- Inline/base64 media
- Plugins

## Technical Limits

* **Slides:** Maximum 99 per presentation
* **File size:** ~10MB reasonable limit
* **Container nesting:** Maximum depth of 10
* **CSS blocks:** No limit (concatenated)
* **Memory:** AST kept in memory during processing

## Browser Compatibility

* **Minimum versions:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
* **Required features:** CSS variables, flexbox, grid, transforms
* **Fallbacks:** Graceful degradation for missing Fullscreen API

## Security Model

* **CSS:** Not sanitized (user owns their output)
* **Containers:** Class names validated for basic safety
* **HTML:** Raw HTML in Markdown remains escaped
* **JavaScript:** No user JavaScript execution allowed
* **Scope:** Styles scoped to prevent global pollution
* **Slide isolation:** Slide-scoped styles automatically prefixed

## Related Documentation

- [User Workflow](./user-workflow.md) - How to use Curtains
- [CLI Contract](./cli-contract.md) - Command-line interface
- [Source Format](./source-format.md) - Input file syntax
- [Examples](./examples.md) - Complete usage examples