# Module Dependencies

## Dependency Graph

```
cli
├── parser
├── transformer
├── renderer
├── types
├── utils
└── constants

parser
├── types
├── constants
└── utils

transformer
├── types
├── constants
└── utils

renderer
├── templates
├── runtime (bundled)
├── types
├── constants
└── utils

runtime
└── (self-contained, no imports)

types
└── (no dependencies)

utils
├── types
└── constants

constants
└── (no dependencies)

templates
└── (static files)
```

## Dependency Flow

### Layered Architecture

Dependencies flow downward through the layers. Higher-level modules orchestrate lower-level modules:

1. **CLI** → Parser, Transformer, Renderer
2. **Parser** → Types, Utils, Constants
3. **Transformer** → Types, Utils, Constants
4. **Renderer** → Types, Utils, Constants, Templates, Runtime

### Core Dependencies

**Types** - Shared by all modules for type safety
- No dependencies of its own
- Provides interfaces and type definitions
- Central source of truth for data structures

**Constants** - Configuration and shared values
- No dependencies
- Regular expressions
- CSS variable names
- Default values

**Utils** - Cross-cutting concerns
- Depends on Types and Constants
- File I/O operations
- Error handling
- Validation
- Logging

## Module Relationships

### CLI Module
The CLI is the orchestrator that ties everything together:

```typescript
// src/cli/commands.ts
import { parse } from '../parser'
import { transform } from '../transformer'
import { render } from '../renderer'
import { readFile, writeFile } from '../utils/file-system'
import { handleError } from '../utils/error-handler'
import type { BuildOptions } from '../types'
```

### Parser Module
Self-contained parsing logic with minimal dependencies:

```typescript
// src/parser/index.ts
import { splitDocument } from './document-splitter'
import { extractStyles } from './style-extractor'
import { parseContainers } from './container-parser'
import { parseMarkdown } from './markdown-parser'
import { buildAST } from './ast-builder'
import type { CurtainsDocument } from '../types'
```

### Transformer Module
Depends on parser output types:

```typescript
// src/transformer/index.ts
import type { CurtainsDocument, TransformedDocument } from '../types'
import { astToHTML } from './ast-to-html'
import { scopeStyles } from './style-scoper'
import { sanitizeLinks } from './link-sanitizer'
import { transformContainer } from './container-transformer'
```

### Renderer Module
Depends on transformer output and static assets:

```typescript
// src/renderer/index.ts
import type { TransformedDocument, RenderOptions } from '../types'
import { mergeStyles } from './style-merger'
import { buildHTML } from './html-builder'
import { injectIntoTemplate } from './template-injector'
import { readTemplate } from '../utils/file-system'
```

### Runtime Module
Completely self-contained for browser execution:

```typescript
// src/runtime/index.ts
// No imports - bundled as IIFE
class NavigationController { /* ... */ }
class KeyboardHandler { /* ... */ }
class FullscreenManager { /* ... */ }
class CounterDisplay { /* ... */ }
```

## External Dependencies

### Production Dependencies
- **remark**: Markdown parsing
- **rehype**: HTML generation
- **mdast**: Markdown AST types

### Development Dependencies
- **typescript**: Type checking
- **esbuild**: Bundling
- **jest**: Testing
- **eslint**: Linting

## Dependency Principles

1. **Minimize Dependencies**: Each module depends only on what it needs
2. **No Circular Dependencies**: Strict layering prevents cycles
3. **Type-Only Imports**: Use `import type` where possible
4. **Self-Contained Runtime**: Browser code has no dependencies
5. **Clear Interfaces**: Well-defined contracts between modules

## Bundle Considerations

### CLI Bundle
- Includes all parser, transformer, renderer code
- External npm dependencies bundled
- Node.js built-ins excluded

### Runtime Bundle
- Completely self-contained
- No external dependencies
- Minified for size
- IIFE format for compatibility

## Testing Dependencies

Test files can import from any module:

```typescript
// test/integration/pipeline.test.ts
import { parse } from '../src/parser'
import { transform } from '../src/transformer'
import { render } from '../src/renderer'
```

## Related Documentation

- [Directory Structure](./directory-structure.md) - Physical organization
- [Modules](./modules.md) - Module descriptions
- [Build Process](./build-process.md) - Bundle generation