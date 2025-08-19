# CLI

Command-line interface for the Curtains presentation builder.

## Usage

```bash
curtains build <input.curtain> -o <output.html> [--theme light|dark]
```

## Implementation

```typescript
import { readFile, writeFile } from 'fs/promises'
import { z } from 'zod'
import { parse } from './parser'
import { transform } from './transformer'
import { render } from './renderer'

// Zod Schemas
const ThemeSchema = z.enum(['light', 'dark'])

const CLIOptionsSchema = z.object({
  input: z.string().min(1).refine(val => val.endsWith('.curtain'), {
    message: 'Input must be a .curtain file'
  }),
  output: z.string().min(1).refine(val => val.endsWith('.html'), {
    message: 'Output must be a .html file'
  }),
  theme: ThemeSchema.default('light')
})

const ErrorCodeSchema = z.enum([
  'INVALID_ARGS',
  'FILE_ACCESS', 
  'PARSE_ERROR',
  'NO_SLIDES',
  'OUTPUT_ERROR'
])

const CurtainsErrorSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string(),
  exitCode: z.number().int().min(1).max(5)
})

const ParsedArgsSchema = z.object({
  command: z.literal('build'),
  input: z.string(),
  output: z.string().optional(),
  theme: z.string().optional()
})

// Parse command line arguments
export function parseArgs(argv: unknown): z.infer<typeof CLIOptionsSchema> {
  // Validate argv is string array
  const argvSchema = z.array(z.string())
  const validatedArgv = argvSchema.parse(argv)
  
  // Skip 'node' and script name
  const args = validatedArgv.slice(2)
  
  if (args[0] !== 'build') {
    throw createError('INVALID_ARGS', 'Use: curtains build <input> -o <output>')
  }
  
  const raw = {
    input: args[1],
    output: args[args.indexOf('-o') + 1] || args[args.indexOf('--output') + 1],
    theme: args[args.indexOf('--theme') + 1]
  }
  
  // Validate with Zod
  const result = CLIOptionsSchema.safeParse(raw)
  if (!result.success) {
    throw createError('INVALID_ARGS', formatZodError(result.error))
  }
  
  return result.data
}

// Main entry point
export async function main(argv: unknown): Promise<void> {
  try {
    // 1. Parse and validate arguments
    const options = parseArgs(argv)
    
    // 2. Read input file
    const source = await readFile(options.input, 'utf-8')
      .catch(() => {
        throw createError('FILE_ACCESS', `Cannot read ${options.input}`)
      })
    
    // 3. Parse source to AST (parse validates its input)
    const document = parse(source)
    
    // 4. Transform AST to HTML (transform validates its input)
    const transformed = transform(document)
    
    // 5. Render final HTML (render validates its input)
    const html = render(transformed, options)
    
    // 6. Write output
    await writeFile(options.output, html, 'utf-8')
      .catch(() => {
        throw createError('OUTPUT_ERROR', `Cannot write ${options.output}`)
      })
    
    console.log(`✓ Built ${options.output} (${document.slides.length} slides)`)
    
  } catch (error) {
    handleError(error)
  }
}

// Error handling
function createError(
  code: z.infer<typeof ErrorCodeSchema>,
  message: string
): z.infer<typeof CurtainsErrorSchema> {
  const exitCodes: Record<z.infer<typeof ErrorCodeSchema>, number> = {
    INVALID_ARGS: 1,
    FILE_ACCESS: 2,
    PARSE_ERROR: 3,
    NO_SLIDES: 4,
    OUTPUT_ERROR: 5
  }
  
  return CurtainsErrorSchema.parse({
    code,
    message,
    exitCode: exitCodes[code]
  })
}

function handleError(error: unknown): never {
  // Validate error structure
  const result = CurtainsErrorSchema.safeParse(error)
  
  if (result.success) {
    console.error(`Error: ${result.data.message}`)
    process.exit(result.data.exitCode)
  } else {
    // Unexpected error - try to get message
    const fallbackSchema = z.object({ message: z.string() })
    const fallback = fallbackSchema.safeParse(error)
    
    if (fallback.success) {
      console.error('Error:', fallback.data.message)
    } else {
      console.error('Unexpected error:', String(error))
    }
    process.exit(5)
  }
}

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map(issue => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ')
}

// CLI runner
if (require.main === module) {
  main(process.argv)
}
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Invalid arguments |
| 2 | File access error |
| 3 | Parse error |
| 4 | No slides found |
| 5 | Output write error |