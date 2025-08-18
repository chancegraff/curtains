# Build Process

## Development Build

### TypeScript Compilation
```bash
# Compile TypeScript with source maps
tsc --watch

# Run tests
npm test

# Lint
npm run lint
```

## Production Build

### 1. Bundle CLI (ESM, Node target)
```bash
esbuild src/cli/index.ts \
  --bundle \
  --platform=node \
  --target=node18 \
  --format=esm \
  --outfile=dist/cli.js
```

The CLI is bundled as an ES module targeting Node.js 18+. This ensures compatibility with modern Node.js features while keeping the bundle size reasonable.

### 2. Bundle Runtime (IIFE, browser target)
```bash
esbuild src/runtime/index.ts \
  --bundle \
  --minify \
  --format=iife \
  --global-name=CurtainsRuntime \
  --outfile=dist/runtime.js
```

The runtime is bundled as an immediately-invoked function expression (IIFE) for browser compatibility. It's minified aggressively since it's embedded in every generated presentation.

### 3. Process CSS Templates
```bash
cat src/templates/base.css > dist/base.css
cat src/templates/theme-light.css > dist/theme-light.css
cat src/templates/theme-dark.css > dist/theme-dark.css
```

CSS templates are copied directly to the distribution folder. These are read at runtime and embedded into generated presentations.

### 4. Generate TypeScript Declarations
```bash
tsc --declaration --emitDeclarationOnly
```

Type declarations are generated for TypeScript consumers of the library.

## Build Pipeline

### Source Layout
```
/src
  /cli                    # Command-line interface
  /parser                # Parsing phase
  /transformer          # Transform phase
  /renderer            # Render phase
  /runtime            # Browser runtime
  /templates         # Static assets
  /types            # TypeScript types
  /utils           # Utilities
  /constants       # Constants
```

### Output Structure
```
/dist
  cli.js              # Bundled CLI (ESM)
  runtime.js          # Bundled runtime (IIFE, minified)
  base.css           # Base styles
  theme-light.css    # Light theme
  theme-dark.css     # Dark theme
  *.d.ts             # TypeScript declarations
```

## Language and Bundler

- **TypeScript** source for type safety
- **esbuild** for fast bundling and minification
- **Node ≥18** requirement for modern JavaScript features

## Bundle Optimization

### CLI Bundle
- Tree shaking to remove unused code
- External dependencies kept external (not bundled)
- Source maps for debugging

### Runtime Bundle
- Aggressive minification
- No external dependencies
- Self-contained IIFE format
- Optimized for size (embedded in every output)

## Build Scripts

Package.json scripts:
```json
{
  "scripts": {
    "build": "npm run build:cli && npm run build:runtime && npm run build:css && npm run build:types",
    "build:cli": "esbuild src/cli/index.ts --bundle --platform=node --target=node18 --format=esm --outfile=dist/cli.js",
    "build:runtime": "esbuild src/runtime/index.ts --bundle --minify --format=iife --global-name=CurtainsRuntime --outfile=dist/runtime.js",
    "build:css": "cp src/templates/*.css dist/",
    "build:types": "tsc --declaration --emitDeclarationOnly",
    "dev": "tsc --watch",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  }
}
```

## Performance Considerations

1. **Bundle Size**
   - Runtime is minified aggressively (target: <10KB)
   - CSS is kept readable for debugging
   - HTML template is minimal

2. **Build Speed**
   - esbuild provides fast compilation
   - Incremental builds in development
   - Parallel processing where possible

3. **Runtime Performance**
   - Pre-compiled runtime loaded once
   - CSS merged efficiently
   - Minimal DOM manipulation

## Caching Strategy

- **Runtime**: Cached between builds (content rarely changes)
- **Templates**: Cached in memory during CLI session
- **Parsed AST**: Can be cached for watch mode (future)

## Related Documentation

- [Directory Structure](./directory-structure.md) - Source organization
- [Dependencies](./dependencies.md) - Module dependencies
- [Testing Strategy](./testing-strategy.md) - Test configuration