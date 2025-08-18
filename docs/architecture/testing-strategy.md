# Testing Strategy

## Test Structure

### Unit Tests

Each module has corresponding test file:
```
/test
├── /parser
│   ├── document-splitter.test.ts
│   ├── style-extractor.test.ts
│   ├── container-parser.test.ts
│   └── markdown-parser.test.ts
├── /transformer
│   ├── ast-to-html.test.ts
│   ├── style-scoper.test.ts
│   └── link-sanitizer.test.ts
└── /renderer
    ├── style-merger.test.ts
    └── html-builder.test.ts
```

### Integration Tests

End-to-end pipeline tests:
```typescript
// test/integration/pipeline.test.ts
test('complete build pipeline', async () => {
  const input = readFixture('complete.curtain')
  const expected = readFixture('complete.html')
  
  const document = parse(input)
  const transformed = transform(document)
  const output = render(transformed, { theme: 'light' })
  
  expect(output).toBe(expected)
})
```

## Test Categories

### Unit Tests

**Parser Tests**
- Container directive parsing
- Global CSS block extraction (before first `===`)
- Slide-scoped CSS block extraction (after `===`)
- CSS selector prefixing for slide scopes
- AST transformation
- `===` delimiter splitting with position tracking
- Nested container handling

**Transformer Tests**
- AST to HTML conversion
- Container to div transformation
- Link sanitization (external links)
- Style scoping with `.curtains-slide:nth-child(n)`
- Complex selector handling
- Media query preservation

**Renderer Tests**
- Style merging order
- HTML structure building
- Template injection
- Placeholder replacement

### Integration Tests

**Full Pipeline**
- .curtain → HTML conversion
- Global vs slide-scoped CSS separation
- CSS merging order: base → theme → global → slide-scoped
- Slide-scoped CSS prefixing with `.curtains-slide:nth-child(n)`
- Theme variable substitution
- Multiple style blocks per slide

### Golden Tests

**Fixture-based Testing**
- Deterministic HTML output
- Container preservation
- Global CSS injection
- Slide-scoped CSS injection with proper prefixing
- CSS specificity cascade

### Manual Tests

**Browser Testing**
- Navigation (keyboard, mouse)
- Theme switching
- Global styles applying to all slides
- Slide-scoped styles affecting only their slide
- Style override behavior
- Container layouts
- Fullscreen mode
- Counter display
- Wrap-around navigation

## Test Coverage Goals

- **Unit tests**: 90%+ coverage
- **Integration tests**: All major workflows
- **Golden tests**: Representative examples
- **Manual tests**: User experience validation

## Testing Tools

- **Jest**: Test runner and assertion library
- **Fixtures**: Sample .curtain files for testing
- **Snapshots**: Golden output comparison
- **Coverage**: Istanbul for code coverage

## Example Test Cases

### Parser: Style Extraction
```typescript
test('extracts global styles before first delimiter', () => {
  const input = `
    <style>.global { color: red; }</style>
    ===
    Content
  `
  const result = extractStyles(input, true)
  expect(result.styles[0].position).toBe('global')
  expect(result.styles[0].css).toContain('.global')
})

test('extracts slide-scoped styles after delimiter', () => {
  const input = `
    ===
    Content
    <style>.local { color: blue; }</style>
  `
  const result = extractStyles(input, false)
  expect(result.styles[0].position).toBe('slide')
})
```

### Transformer: Style Scoping
```typescript
test('prefixes slide-scoped selectors', () => {
  const css = '.my-class { color: red; }'
  const scoped = scopeStyles(css, 1)
  expect(scoped).toBe('.curtains-slide:nth-child(1) .my-class { color: red; }')
})

test('preserves media queries', () => {
  const css = '@media (max-width: 768px) { .class { display: none; } }'
  const scoped = scopeStyles(css, 1)
  expect(scoped).toContain('@media')
  expect(scoped).toContain('.curtains-slide:nth-child(1) .class')
})
```

### Integration: Complete Pipeline
```typescript
test('processes complete presentation', async () => {
  const input = `
    <style>.global { font-size: 16px; }</style>
    ===
    # Title
    <container class="hero">Content</container>
    <style>.hero { background: blue; }</style>
    ===
    ## Slide 2
  `
  
  const document = parse(input)
  expect(document.slides).toHaveLength(2)
  expect(document.globalCSS).toContain('.global')
  
  const transformed = transform(document)
  expect(transformed.slides[0].html).toContain('<div class="hero">')
  expect(transformed.slides[0].scopedCSS).toContain('.curtains-slide:nth-child(1) .hero')
  
  const output = render(transformed, { theme: 'light' })
  expect(output).toContain('<!DOCTYPE html>')
  expect(output).toContain('.global { font-size: 16px; }')
  expect(output).toContain('.curtains-slide:nth-child(1) .hero')
})
```

## Continuous Integration

- Run tests on every commit
- Block merges if tests fail
- Generate coverage reports
- Performance benchmarks for large files

## Related Documentation

- [Directory Structure](./directory-structure.md) - Test file organization
- [Modules](./modules.md) - Module-specific test requirements
- [Data Flow](./data-flow.md) - Integration test scenarios