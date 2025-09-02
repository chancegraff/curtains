# CLI Integration Spec

## Entry Flow
`CLI main → parseArgs → createRegistry → initializeCoordinator → dispatch operations → wait for completion`

## Initialization Sequence
1. Parse CLI args with Commander.js
2. Create Registry with initial state
3. Subscribe Coordinator to `start-pipeline` event
4. Set runtime config in Registry
5. Queue operations in Registry
6. Emit `start-pipeline` event
7. Await `coordinator-complete` or `coordinator-failed` event

## Component Connections

### CLI → Registry
```typescript
// src/cli/main.ts
import { createRegistry, setConfig, save, emit, subscribe } from '../libs/registry/registry'
import { initializeCoordinator } from '../libs/coordinator/coordinator'

async function main(argv: string[]): Promise<void> {
  // Create registry
  const registry = createRegistry({ debug: false })
  
  // Initialize coordinator subscription
  const unsubscribe = initializeCoordinator(registry)
  
  // Parse args
  const options = parseArgs(argv)
  const config = createRuntimeConfig(options)
  
  // Save to registry
  setConfig(registry, config)
  save(registry, 'queue', [
    { type: 'parse', input: { type: 'parse', content: inputContent } },
    { type: 'transform', input: { type: 'transform', ast: null } },
    { type: 'render', input: { type: 'render', transformed: null } },
    { type: 'write', input: { type: 'write', html: null, path: outputPath } }
  ])
  
  // Start pipeline
  emit(registry, 'start-pipeline', { timestamp: Date.now() })
  
  // Wait for completion
  await waitForCompletion(registry)
}
```

### Registry → Coordinator
```typescript
// Coordinator subscribes in initializeCoordinator()
registry.subscribe('start-pipeline', async () => {
  const config = registry.get('runtime')
  const queue = registry.get('queue')
  // Execute pipeline...
})
```

### Coordinator → Pipeline
```typescript
// src/libs/coordinator/handlers.ts
import { parseStage } from '../pipeline/parse'
import { transformStage } from '../pipeline/transform'
import { renderStage } from '../pipeline/render'

// Direct function imports, no classes
handlers.set('parse', { handler: parseStage })
handlers.set('transform', { handler: transformStage })
handlers.set('render', { handler: renderStage })
```

## Data Flow
`input.curtain → [parse] → ast → [transform] → transformed → [render] → html → [write] → output.html`

### State Keys
- `runtime`: RuntimeConfig
- `queue`: Operation[]
- `ast`: ParsedDocument
- `transformed`: TransformedDocument
- `rendered`: string (HTML)
- `errors`: Error[]
- `output`: { path: string, written: boolean }

## Error Handling
```typescript
CLI catches → Registry stores → Coordinator emits → CLI exits
```

## Implementation Steps

### 1. Create CLI entry module
```typescript
// src/cli/main.ts
export async function main(argv: string[]): Promise<void> {
  const registry = createRegistry()
  const unsubscribe = initializeCoordinator(registry)
  
  try {
    await executeBuild(argv, registry)
  } catch (error) {
    process.exit(1)
  } finally {
    unsubscribe()
  }
}
```

### 2. Build command handler
```typescript
// src/cli/commands/build.ts
export async function executeBuild(
  argv: string[],
  registry: Registry
): Promise<void> {
  const { input, output, theme } = parseArgs(argv)
  const content = await readFile(input, 'utf-8')
  
  // Queue all operations
  const operations = [
    { type: 'parse', input: { type: 'parse', content } },
    { type: 'transform', input: { type: 'transform', ast: null } },
    { type: 'render', input: { type: 'render', transformed: null } },
    { type: 'write', input: { type: 'write', html: null, path: output } }
  ]
  
  save(registry, 'queue', operations)
  emit(registry, 'start-pipeline', {})
  
  return waitForPipeline(registry)
}
```

### 3. Completion handler
```typescript
// src/cli/utils/wait.ts
export function waitForPipeline(registry: Registry): Promise<void> {
  return new Promise((resolve, reject) => {
    const unsub1 = subscribe(registry, 'coordinator-complete', () => {
      unsub1(); unsub2()
      resolve()
    })
    const unsub2 = subscribe(registry, 'coordinator-failed', (e) => {
      unsub1(); unsub2()
      reject(new Error(e.error))
    })
  })
}
```

### 4. File I/O boundaries
```typescript
// src/cli/io.ts
export async function readInputFile(path: string): Promise<string> {
  return readFile(path, 'utf-8')
}

export async function writeOutputFile(
  path: string,
  html: string
): Promise<void> {
  return writeFile(path, html, 'utf-8')
}
```

## Critical Integration Points

1. **No direct pipeline calls** - CLI only talks to Registry
2. **Coordinator handles execution** - Imported via side effect
3. **Registry is event bus** - All communication through events
4. **Pure pipeline functions** - No side effects in parse/transform/render
5. **File I/O at boundaries** - Only in CLI and write handler

## Execution Order
1. CLI: Parse args, read file
2. CLI: Initialize Registry + Coordinator
3. CLI: Queue operations
4. CLI: Emit start event
5. Coordinator: Process queue
6. Pipeline: Execute stages
7. Coordinator: Emit complete
8. CLI: Exit with code

## Module Structure
```
src/
  cli/
    main.ts         # Entry point
    commands/
      build.ts      # Build command
    utils/
      args.ts       # Argument parsing
      wait.ts       # Event waiting
      io.ts         # File I/O
  libs/
    registry/       # State management
    coordinator/    # Pipeline orchestration
    pipeline/       # Stage implementations
```

## Environment Setup
```typescript
// bin/curtains
#!/usr/bin/env node
require('../dist/cli/main').main(process.argv)
```

## Package.json Scripts
```json
{
  "bin": {
    "curtains": "./bin/curtains"
  },
  "scripts": {
    "build": "tsc",
    "cli": "node ./dist/cli/main.js"
  }
}
```