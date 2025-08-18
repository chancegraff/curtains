# Technical Limits

## Performance Limits

### Slide Count
- **Maximum:** 99 slides per presentation
- **Rationale:** Keep presentations focused and performant
- **Behavior:** Parser will error if more than 99 slides detected

### File Size
- **Recommended:** Under 10MB for source files
- **Hard limit:** None enforced, but performance degrades
- **Considerations:**
  - Large files may cause memory issues during parsing
  - Generated HTML grows with embedded content
  - Browser performance affected by DOM size

### Container Nesting
- **Maximum depth:** 10 levels
- **Rationale:** Prevent stack overflow and maintain readability
- **Behavior:** Parser flattens containers beyond depth 10

### CSS Blocks
- **Limit:** No enforced limit
- **Behavior:** All CSS blocks concatenated
- **Performance:** Large CSS may slow initial render
- **Recommendation:** Keep under 100KB total CSS

### Memory Usage
- **AST Storage:** Entire AST kept in memory during processing
- **Impact:** Large presentations may require significant RAM
- **Mitigation:** Future streaming parser implementation

## Browser Compatibility

### Minimum Browser Versions
| Browser | Minimum Version | Released |
|---------|----------------|----------|
| Chrome | 90+ | May 2021 |
| Firefox | 88+ | April 2021 |
| Safari | 14+ | September 2020 |
| Edge | 90+ | May 2021 |

### Required Browser Features

#### CSS Features
- CSS Variables (Custom Properties)
- Flexbox layout
- CSS Grid
- CSS Transforms
- CSS Transitions
- `nth-child()` selector
- Media queries

#### JavaScript Features
- ES6+ syntax
- Arrow functions
- Classes
- Template literals
- `const`/`let`
- Array methods (map, filter, forEach)
- DOM manipulation APIs

#### HTML Features
- HTML5 semantic elements
- Data attributes
- Meta viewport

### Fallback Behavior

#### Fullscreen API
- **Feature detection:** Check for API availability
- **Fallback:** Gracefully degrade, F key does nothing
- **User impact:** Minimal, navigation still works

#### CSS Grid
- **Fallback:** Flexbox layouts where possible
- **Impact:** Some layouts may not render perfectly
- **Solution:** Use simpler layouts for older browsers

#### CSS Variables
- **No fallback:** Required for theming
- **Impact:** Presentation won't render correctly
- **Solution:** Show browser upgrade message

## Security Considerations

### CSS Injection
- **Policy:** CSS not sanitized
- **Rationale:** User owns their output
- **Risk:** Users can break their own presentations
- **Mitigation:** None needed, intentional design

### Container Classes
- **Validation:** Basic alphanumeric + hyphen/underscore
- **Blocked:** Special characters that could break CSS
- **Examples:**
  - ✅ Valid: `my-class`, `card_style`, `item2`
  - ❌ Invalid: `my.class`, `card>style`, `item[2]`

### HTML Escaping
- **Policy:** All raw HTML in Markdown is escaped
- **Exception:** Only `<container>` and `<style>` tags
- **Implementation:** Via remark's sanitization
- **Result:** No XSS vulnerability from content

### JavaScript Execution
- **Policy:** No user JavaScript allowed
- **Runtime:** Pre-compiled, bundled, safe
- **No eval():** Dynamic code execution blocked
- **Event handlers:** Stripped from HTML

### Style Scoping
- **Global prevention:** Slide styles auto-scoped
- **Prefix format:** `.curtains-slide:nth-child(n)`
- **Isolation:** Styles can't affect other slides
- **Override:** Slide styles override globals

### External Resources
- **Images:** Allowed via relative/absolute URLs
- **Scripts:** Not allowed, stripped
- **Stylesheets:** Not allowed, use `<style>` blocks
- **Iframes:** Not allowed, escaped

## Parsing Limits

### Markdown Parsing
- **Line length:** No hard limit, but >1000 chars may be slow
- **Nesting depth:** CommonMark spec limits (e.g., 6 heading levels)
- **List indentation:** Standard 2-4 spaces
- **Code blocks:** No size limit

### Style Block Parsing
- **CSS syntax:** Must be valid CSS
- **Size:** No limit per block
- **Count:** No limit on number of blocks
- **Selectors:** Standard CSS selector limits

### Container Parsing
- **Attributes:** Only `class` attribute supported
- **Class count:** No limit on classes per container
- **Class length:** Reasonable identifier length (<100 chars)
- **Tag matching:** Must have matching open/close tags

## Runtime Limits

### Navigation
- **Slide index:** 0 to 98 (for 99 slides max)
- **Animation duration:** 300ms transition
- **Keyboard repeat:** Browser-controlled

### Counter Display
- **Format:** Fixed "current/total"
- **Max display:** "99/99"
- **Update frequency:** On navigation only

### Fullscreen
- **API availability:** Feature detection
- **Permission:** User gesture required
- **Exit:** ESC key or F key

## Output Constraints

### HTML File Size
Typical sizes:
- **Minimal (1 slide):** ~15KB
- **Small (10 slides):** ~30KB
- **Medium (30 slides):** ~60KB
- **Large (99 slides):** ~200KB

Factors affecting size:
- Number of slides
- Amount of custom CSS
- Content complexity
- Theme choice (minimal difference)

### DOM Elements
Approximate counts for 30-slide presentation:
- **Total elements:** ~500-1000
- **Slide sections:** 30
- **Text nodes:** ~300-600
- **Container divs:** Varies by usage

### CSS Rules
- **Base styles:** ~50 rules
- **Theme styles:** ~20 rules
- **User global:** No limit
- **Per-slide:** No limit
- **Total typical:** 100-500 rules

## Recommendations

### For Best Performance
1. Keep presentations under 50 slides
2. Limit CSS to essential styles
3. Optimize images before including
4. Use simple container structures
5. Avoid deeply nested layouts

### For Compatibility
1. Test in target browsers
2. Use standard CSS features
3. Provide fallback styles
4. Keep JavaScript features minimal
5. Use semantic HTML

### For Security
1. Don't include sensitive data
2. Validate user-provided CSS
3. Escape all HTML content
4. Avoid external dependencies
5. Review generated output

## Future Considerations

### Potential Increases
- Slide limit to 999 (requires UI changes)
- Streaming parser for large files
- Lazy loading for images
- Progressive rendering

### Potential Optimizations
- CSS rule deduplication
- HTML minification
- Smart bundling
- Compression options

## Related Documentation

- [Overview](./overview.md) - Project scope and goals
- [Security Model](./overview.md#security-model) - Security details
- [Browser Compatibility](./overview.md#browser-compatibility) - Compatibility matrix