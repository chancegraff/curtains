# CLI

## Command
```bash
curtains build <input.curtain> -o <output.html> [--theme light|dark]
```

## Parameters
- `<input>`: Path to .curtain file (required)
- `-o, --output`: Output HTML path (required)
- `--theme`: "light" or "dark" (default: light)

## Examples
```bash
# Basic
curtains build deck.curtain -o deck.html

# With dark theme
curtains build deck.curtain -o deck.html --theme dark

# With paths
curtains build slides/talk.curtain -o dist/talk.html
```

## Exit Codes
- 0: Success
- 1: Invalid arguments
- 2: File access error
- 3: Parse error
- 4: No slides found
- 5: Output write error

## Implementation
```typescript
// Main entry point
async function main(argv: string[]) {
  const options = parseArgs(argv)
  
  if (!options.input || !options.output) {
    console.error('Missing required arguments')
    process.exit(1)
  }
  
  try {
    // Read input
    const source = await readFile(options.input)
    
    // Parse
    const document = parse(source)
    if (!document.slides.length) {
      console.error('No slides found')
      process.exit(4)
    }
    
    // Transform
    const transformed = transform(document)
    
    // Render
    const html = render(transformed, options)
    
    // Write output
    await writeFile(options.output, html)
    
    console.log(`✓ Built ${options.output}`)
  } catch (error) {
    console.error(error.message)
    process.exit(error.code || 5)
  }
}
```