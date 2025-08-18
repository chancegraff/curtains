# Directory Structure

## Project Layout

```
/src
├── /cli                    # Command-line interface
│   ├── index.ts           # CLI entry point and argument parsing
│   └── commands.ts        # Command implementations (build, etc.)
│
├── /parser                 # Parsing phase - Extract and structure content
│   ├── index.ts           # Main parser orchestrator
│   ├── document-splitter.ts    # Split document on === delimiters
│   ├── style-extractor.ts      # Extract <style> blocks with position tracking
│   ├── container-parser.ts     # Parse <container> elements into AST nodes
│   ├── markdown-parser.ts      # Parse Markdown content via remark
│   └── ast-builder.ts          # Build enhanced Curtains AST
│
├── /transformer            # Transform phase - Convert AST to renderable format
│   ├── index.ts           # Main transformer orchestrator
│   ├── ast-to-html.ts     # Convert AST nodes to HTML
│   ├── style-scoper.ts    # Prefix slide-scoped CSS selectors
│   ├── link-sanitizer.ts  # Add target="_blank" to external links
│   └── container-transformer.ts # Transform container nodes to div elements
│
├── /renderer              # Render phase - Generate final HTML
│   ├── index.ts          # Main renderer orchestrator
│   ├── style-merger.ts   # Merge and order all CSS sources
│   ├── html-builder.ts   # Build final HTML structure
│   └── template-injector.ts # Inject content into HTML template
│
├── /runtime              # Browser runtime (injected into output)
│   ├── index.ts         # Main runtime entry
│   ├── navigation.ts    # Slide navigation logic
│   ├── keyboard.ts      # Keyboard event handlers
│   ├── fullscreen.ts    # Fullscreen API wrapper
│   └── counter.ts       # Slide counter management
│
├── /templates            # Static templates and assets
│   ├── base.html        # HTML template structure
│   ├── base.css         # Base presentation styles
│   ├── theme-light.css  # Light theme variables
│   └── theme-dark.css   # Dark theme variables
│
├── /types               # TypeScript type definitions
│   ├── index.ts        # Re-export all types
│   ├── ast.ts          # AST node types
│   ├── document.ts     # Document structure types
│   ├── options.ts      # Configuration option types
│   └── errors.ts       # Error types and codes
│
├── /utils              # Shared utilities
│   ├── file-system.ts  # File I/O operations
│   ├── error-handler.ts # Error handling and reporting
│   ├── validator.ts    # Input validation
│   └── logger.ts       # Logging utilities
│
├── /constants          # Shared constants
│   ├── index.ts       # All constants
│   ├── regex.ts       # Regular expressions
│   ├── css-vars.ts    # CSS variable names
│   └── defaults.ts    # Default values
│
└── index.ts           # Main library export
```

## Test Structure

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
├── /renderer
│   ├── style-merger.test.ts
│   └── html-builder.test.ts
└── /integration
    └── pipeline.test.ts
```

## Module Organization Philosophy

### Layered Architecture
The directory structure mirrors the data flow through the system. Each major directory represents a distinct phase in the processing pipeline, making it easy to understand where functionality lives and how data flows through the system.

### Single Responsibility
Each file has a single, well-defined responsibility. This makes the codebase easier to understand, test, and maintain.

### Clear Dependencies
Dependencies flow downward through the layers. Higher-level modules orchestrate lower-level modules, but never the reverse.

### Separation of Concerns
- **CLI**: User interface and command handling
- **Parser**: Input processing and AST generation
- **Transformer**: AST manipulation and HTML generation
- **Renderer**: Final output assembly
- **Runtime**: Browser-side functionality
- **Templates**: Static assets
- **Types**: Shared type definitions
- **Utils**: Cross-cutting concerns
- **Constants**: Shared configuration

## File Naming Conventions

- **Kebab case** for all file names: `document-splitter.ts`
- **Descriptive names** that indicate purpose: `style-extractor.ts` not `styles.ts`
- **Test files** mirror source files with `.test.ts` suffix
- **Index files** serve as module entry points and orchestrators

## Related Documentation

- [Modules](./modules.md) - Detailed descriptions of each module
- [Dependencies](./dependencies.md) - Module dependency relationships
- [Build Process](./build-process.md) - How the project is built and bundled