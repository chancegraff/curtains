# CLI Contract

## Command Syntax

```
curtains build <input.curtain> -o <output.html> [--theme light|dark]
```

## Parameters

### Required Parameters

#### `<input>`
- Path to source `.curtain` file
- Can be relative or absolute path
- File must exist and be readable
- Example: `presentation.curtain`, `./slides/deck.curtain`, `/home/user/talk.curtain`

#### `-o, --output`
- Path for output HTML file
- Can be relative or absolute path
- Directory must exist (file will be created/overwritten)
- Example: `-o presentation.html`, `--output dist/slides.html`

### Optional Parameters

#### `--theme`
- Visual theme for presentation
- Values: `"light"` (default) or `"dark"`
- Affects color scheme and variables
- Example: `--theme dark`

## Exit Codes

The CLI uses specific exit codes to indicate different error conditions:

| Code | Meaning | Description |
|------|---------|-------------|
| 0 | Success | Build completed successfully |
| 1 | Invalid arguments | Missing required args, unknown flags, invalid values |
| 2 | File access error | Input file not found, can't read input, can't write output |
| 3 | Parse error | Invalid Markdown, malformed containers, syntax errors |
| 4 | No slides found | Input file has no content or no slide delimiters |
| 5 | Output write error | Can't write to output path, disk full, permissions |

## Usage Examples

### Basic Usage
```bash
# Build with default theme (light)
curtains build presentation.curtain -o presentation.html

# Build with dark theme
curtains build presentation.curtain -o presentation.html --theme dark
```

### With Paths
```bash
# Relative paths
curtains build slides/talk.curtain -o dist/talk.html

# Absolute paths
curtains build /home/user/deck.curtain -o /var/www/deck.html

# Mixed paths
curtains build ./source.curtain -o /tmp/output.html
```

### Error Scenarios
```bash
# Missing output flag (exit code 1)
curtains build input.curtain
# Error: Missing required flag: -o, --output

# Input file not found (exit code 2)
curtains build missing.curtain -o out.html
# Error: Input file not found: missing.curtain

# Invalid theme (exit code 1)
curtains build in.curtain -o out.html --theme blue
# Error: Invalid theme: blue. Must be 'light' or 'dark'

# Parse error (exit code 3)
curtains build invalid.curtain -o out.html
# Error: Parse error at line 10: Unclosed container tag

# No slides (exit code 4)
curtains build empty.curtain -o out.html
# Error: No slides found in input file

# Can't write output (exit code 5)
curtains build in.curtain -o /root/protected.html
# Error: Cannot write to output path: Permission denied
```

## Help and Version

### Help Command
```bash
curtains --help
curtains -h

# Output:
Curtains - Convert Markdown to HTML presentations

Usage:
  curtains build <input> -o <output> [options]

Options:
  -o, --output <path>  Output HTML file path (required)
  --theme <theme>      Theme: light or dark (default: light)
  -h, --help          Show help
  -v, --version       Show version

Examples:
  curtains build deck.curtain -o deck.html
  curtains build talk.curtain -o talk.html --theme dark
```

### Version Command
```bash
curtains --version
curtains -v

# Output:
curtains version 0.1.0
```

## Environment Variables

While not required, these environment variables can affect behavior:

- `NO_COLOR`: Disable colored output in terminal
- `DEBUG`: Enable debug logging when set
- `NODE_ENV`: Set to `production` for optimized output

## Configuration Files

Currently, Curtains does not use configuration files. All options are provided via command-line flags.

## Future CLI Extensions

Planned additions (not in MVP):

```bash
# Watch mode (future)
curtains build input.curtain -o output.html --watch

# Multiple themes (future)
curtains build input.curtain -o output.html --theme corporate

# PDF export (future)
curtains export input.curtain -o output.pdf

# Development server (future)
curtains serve input.curtain --port 3000

# Init command (future)
curtains init my-presentation
```

## Integration with npm Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "build": "curtains build presentation.curtain -o dist/index.html",
    "build:dark": "curtains build presentation.curtain -o dist/index.html --theme dark",
    "build:all": "npm run build && npm run build:dark"
  }
}
```

## Shell Completions

Bash completion script (future):

```bash
_curtains_completions() {
  local cur="${COMP_WORDS[COMP_CWORD]}"
  local commands="build --help --version"
  local themes="light dark"
  
  case "${COMP_WORDS[1]}" in
    build)
      COMPREPLY=($(compgen -W "-o --output --theme" -- ${cur}))
      ;;
    --theme)
      COMPREPLY=($(compgen -W "${themes}" -- ${cur}))
      ;;
    *)
      COMPREPLY=($(compgen -W "${commands}" -- ${cur}))
      ;;
  esac
}

complete -F _curtains_completions curtains
```

## Related Documentation

- [User Workflow](./user-workflow.md) - Complete usage guide
- [Source Format](./source-format.md) - Input file format
- [Examples](./examples.md) - Example commands