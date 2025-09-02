# CLI Entrypoint Specification

Component: Parses user input, initializes system, orchestrates pipeline execution

**Types Reference:** See [types-spec.md](./types-spec.md) for all type definitions

## Module Imports

```typescript
// src/cli/main.ts
import { createRegistry, setConfig, save, emit, subscribe } from '../libs/registry/registry'
import { initializeCoordinator } from '../libs/coordinator/coordinator'
import { readFile, writeFile } from 'fs/promises'
import { Command } from 'commander'
```

## Pure Functions

```typescript
// Parse CLI arguments into options
export function parseArgs(
  args: z.infer<typeof CLIArgsSchema>
): z.infer<typeof BuildOptionsSchema> {
  // Pure transformation using Commander.js
  // Returns validated options or throws
}

// Create runtime configuration
export function createRuntimeConfig(
  options: z.infer<typeof BuildOptionsSchema>
): z.infer<typeof RuntimeConfigSchema> {
  // Pure factory, generates immutable config
  return {
    inputPath: options.input,
    outputPath: options.output || generateOutputPath(options.input),
    theme: options.theme || 'default',
    debug: options.debug || false,
    strict: options.strict || false
  }
}

// Generate default output path
export function generateOutputPath(
  inputPath: string
): string {
  // Replace .curtain with .html
  return inputPath.replace(/\.curtain$/, '.html')
}

// Validate file extensions
export function validateExtensions(
  input: string,
  output: string
): { valid: boolean; error?: string } {
  if (!input.endsWith('.curtain')) {
    return { valid: false, error: 'Input must be .curtain file' }
  }
  if (!output.endsWith('.html')) {
    return { valid: false, error: 'Output must be .html file' }
  }
  return { valid: true }
}

// Format validation errors
export function formatValidationError(
  error: z.ZodError
): string {
  return error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n')
}

// Map error codes to exit codes
export function mapErrorCode(
  code: z.infer<typeof ErrorCodeSchema>
): number {
  const mapping = {
    'INVALID_INPUT': 1,
    'PARSE_ERROR': 2,
    'TRANSFORM_ERROR': 3,
    'RENDER_ERROR': 4,
    'IO_ERROR': 5,
    'UNKNOWN': 99
  }
  return mapping[code] || 99
}
```

## Main Entry Point

```typescript
// src/cli/main.ts
export async function main(argv: string[]): Promise<void> {
  // 1. Create registry with initial state
  const registry = createRegistry({ debug: false })
  
  // 2. Initialize coordinator subscription to start-pipeline event
  const unsubscribe = initializeCoordinator(registry)
  
  try {
    // 3. Parse arguments
    const options = parseArgs(argv)
    
    // 4. Validate file extensions
    const validation = validateExtensions(options.input, options.output)
    if (!validation.valid) {
      throw new Error(validation.error)
    }
    
    // 5. Read input file
    const content = await readFile(options.input, 'utf-8')
    
    // 6. Create runtime config
    const config = createRuntimeConfig(options)
    
    // 7. Save config to registry
    setConfig(registry, config)
    
    // 8. Queue all operations
    save(registry, 'queue', [
      { type: 'parse', input: { type: 'parse', content } },
      { type: 'transform', input: { type: 'transform', ast: null } },
      { type: 'render', input: { type: 'render', transformed: null } },
      { type: 'write', input: { type: 'write', html: null, path: config.outputPath } }
    ])
    
    // 9. Start pipeline
    emit(registry, 'start-pipeline', { timestamp: Date.now() })
    
    // 10. Wait for completion
    await waitForPipeline(registry)
    
    console.log(`✓ Built ${config.outputPath}`)
    process.exit(0)
    
  } catch (error) {
    console.error('Build failed:', error.message)
    process.exit(1)
  } finally {
    unsubscribe()
  }
}
```

## Pipeline Completion Handler

```typescript
// src/cli/utils/wait.ts
export function waitForPipeline(registry: Registry): Promise<void> {
  return new Promise((resolve, reject) => {
    // Subscribe to completion event
    const unsubComplete = subscribe(registry, 'coordinator-complete', () => {
      unsubComplete()
      unsubFailed()
      resolve()
    })
    
    // Subscribe to failure event
    const unsubFailed = subscribe(registry, 'coordinator-failed', (event) => {
      unsubComplete()
      unsubFailed()
      reject(new Error(event.error))
    })
  })
}
```

## Build Command Implementation

```typescript
// src/cli/commands/build.ts
export async function executeBuild(
  argv: string[],
  registry: Registry
): Promise<void> {
  const program = new Command()
  
  program
    .name('curtains')
    .description('Convert Curtain markup to HTML')
    .argument('<input>', 'Input .curtain file')
    .option('-o, --output <path>', 'Output HTML file')
    .option('-t, --theme <name>', 'Theme name', 'default')
    .option('-d, --debug', 'Enable debug mode', false)
    .option('-s, --strict', 'Enable strict mode', false)
    .parse(argv)
  
  const options = program.opts()
  const [input] = program.args
  
  // Read input file
  const content = await readFile(input, 'utf-8')
  
  // Create operations queue
  const operations = [
    { type: 'parse', input: { type: 'parse', content } },
    { type: 'transform', input: { type: 'transform', ast: null } },
    { type: 'render', input: { type: 'render', transformed: null } },
    { type: 'write', input: { type: 'write', html: null, path: options.output || generateOutputPath(input) } }
  ]
  
  // Save to registry and start
  save(registry, 'queue', operations)
  emit(registry, 'start-pipeline', { timestamp: Date.now() })
  
  // Wait for completion
  return waitForPipeline(registry)
}
```

## File I/O Boundaries

```typescript
// src/cli/io.ts
export async function readInputFile(path: string): Promise<string> {
  try {
    return await readFile(path, 'utf-8')
  } catch (error) {
    throw new Error(`Failed to read ${path}: ${error.message}`)
  }
}

export async function writeOutputFile(
  path: string,
  html: string
): Promise<void> {
  try {
    await writeFile(path, html, 'utf-8')
  } catch (error) {
    throw new Error(`Failed to write ${path}: ${error.message}`)
  }
}
```

## Error Handling

```typescript
// Error factory (pure)
export function createError(
  code: z.infer<typeof ErrorCodeSchema>,
  message: string
): z.infer<typeof CLIErrorSchema> {
  return {
    code,
    message,
    exitCode: mapErrorCode(code)
  }
}

// Error handler (side effect boundary)
export function handleError(
  error: Error | z.infer<typeof CLIErrorSchema>
): never {
  if ('code' in error) {
    console.error(`Error [${error.code}]: ${error.message}`)
    process.exit(error.exitCode)
  } else {
    console.error('Unexpected error:', error.message)
    process.exit(99)
  }
}
```

## Initialization Sequence

1. Parse CLI args with Commander.js
2. Create Registry with initial state
3. Subscribe Coordinator to `start-pipeline` event
4. Read input file content
5. Set runtime config in Registry
6. Queue operations in Registry
7. Emit `start-pipeline` event
8. Await `coordinator-complete` or `coordinator-failed` event
9. Exit with appropriate code

## Component Connections

### CLI → Registry
- CLI creates registry instance
- Saves runtime config via `setConfig()`
- Queues operations via `save()`
- Emits events via `emit()`
- Subscribes to completion via `subscribe()`

### Registry → Coordinator
- Coordinator subscribes during initialization
- Receives `start-pipeline` event
- Accesses queue and config from registry
- Emits completion/failure events back

### Coordinator → Pipeline
- Imports stage functions directly (no classes)
- Executes stages in sequence
- Passes data through registry state

## Data Flow
`input.curtain → [parse] → ast → [transform] → transformed → [render] → html → [write] → output.html`

### Registry State Keys
- `runtime`: RuntimeConfig
- `queue`: Operation[]
- `ast`: ParsedDocument
- `transformed`: TransformedDocument
- `rendered`: string (HTML)
- `errors`: Error[]
- `output`: { path: string, written: boolean }

## Module Structure
```
src/
  cli/
    main.ts         # Entry point with main()
    commands/
      build.ts      # Build command implementation
    utils/
      args.ts       # Argument parsing helpers
      wait.ts       # Event waiting utilities
      io.ts         # File I/O boundaries
```

## Environment Setup

```typescript
// bin/curtains
#!/usr/bin/env node
require('../dist/cli/main').main(process.argv)
```

## Package.json Configuration

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

## Critical Integration Rules

1. **No direct pipeline calls** - CLI only communicates via Registry
2. **Coordinator handles execution** - Imported as side effect via `initializeCoordinator()`
3. **Registry is event bus** - All component communication through events
4. **Pure pipeline functions** - No side effects in parse/transform/render stages
5. **File I/O at boundaries** - Only in CLI main and write handler
6. **Single responsibility** - CLI only handles args, file I/O, and registry setup
7. **Error propagation** - Errors flow through events, not exceptions

## Immutability Patterns

- All functions return new objects
- No mutations of input parameters
- Config objects are frozen after creation
- Queue is append-only structure
- Registry state updates are immutable