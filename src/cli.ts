#!/usr/bin/env node

// CLI Implementation
// Command-line interface for the Curtains presentation builder

import { readFile, writeFile } from 'fs/promises'
import { z } from 'zod'
import { parse } from './parser/index.js'
import { transform } from './transformer/index.js'
import { render } from './renderer/index.js'
import { 
  BuildOptionsSchema, 
  CurtainsErrorSchema 
} from './config/schemas.js'
import type { ErrorCode, CurtainsError } from './config/types.js'

/**
 * Parse command line arguments with proper validation
 * @param argv - Process argv array
 * @returns Validated build options
 * @throws CurtainsError with INVALID_ARGS code
 */
export function parseArgs(argv: unknown): z.infer<typeof BuildOptionsSchema> {
  // Validate argv is string array
  const argvSchema = z.array(z.string())
  const validatedArgv = argvSchema.parse(argv)
  
  // Skip 'node' and script name
  const args = validatedArgv.slice(2)
  
  // Check for help or version flags first
  if (args.includes('-h') || args.includes('--help')) {
    showHelp()
    process.exit(0)
  }
  
  if (args.includes('-v') || args.includes('--version')) {
    console.log('curtains v1.0.0')
    process.exit(0)
  }
  
  if (args.length === 0 || args[0] !== 'build') {
    throw createError('INVALID_ARGS', 'Use: curtains build <input.curtain> -o <output.html> [--theme light|dark]')
  }
  
  if (!args[1]) {
    throw createError('INVALID_ARGS', 'Input file is required')
  }
  
  const outputIndex = args.indexOf('-o') !== -1 ? args.indexOf('-o') : args.indexOf('--output')
  const themeIndex = args.indexOf('--theme')
  
  const raw = {
    input: args[1],
    output: outputIndex !== -1 ? args[outputIndex + 1] : args[1].replace(/\.curtain$/, '.html'),
    theme: themeIndex !== -1 ? args[themeIndex + 1] : 'light'
  }
  
  // Validate with Zod
  const result = BuildOptionsSchema.safeParse(raw)
  if (!result.success) {
    throw createError('INVALID_ARGS', formatZodError(result.error))
  }
  
  return result.data
}

/**
 * Create structured error with proper exit code
 * @param code - Error code enum
 * @param message - Error message
 * @returns Validated CurtainsError
 */
function createError(code: ErrorCode, message: string): CurtainsError {
  const exitCodes: Record<ErrorCode, number> = {
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

/**
 * Handle errors with proper exit codes
 * @param error - Unknown error to handle
 */
function handleError(error: unknown): never {
  // Validate error structure
  const result = CurtainsErrorSchema.safeParse(error)
  
  if (result.success) {
    console.error(`Error: ${result.data.message}`)
    process.exit(result.data.exitCode)
  } else {
    // Check if it's a parse error from our parser
    if (error instanceof Error && error.message.includes('parse')) {
      console.error(`Parse Error: ${error.message}`)
      process.exit(3)
    }
    
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

/**
 * Format Zod validation errors
 * @param error - ZodError to format
 * @returns Formatted error string
 */
function formatZodError(error: z.ZodError): string {
  return error.issues
    .map(issue => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ')
}

/**
 * Show help text
 */
function showHelp(): void {
  console.log(`
curtains - Presentation builder for .curtain files

USAGE:
  curtains build <input.curtain> -o <output.html> [--theme light|dark]

COMMANDS:
  build          Build a .curtain file into an HTML presentation

OPTIONS:
  -o, --output   Output HTML file (default: input.html)
  --theme        Theme selection: light or dark (default: light)
  -h, --help     Show help
  -v, --version  Show version

EXAMPLES:
  curtains build slides.curtain -o presentation.html
  curtains build slides.curtain -o slides.html --theme dark

EXIT CODES:
  0  Success
  1  Invalid arguments
  2  File access error  
  3  Parse error
  4  No slides found
  5  Output write error
`)
}

/**
 * Main CLI entry point
 * @param argv - Process argv array
 */
export async function main(argv: unknown): Promise<void> {
  try {
    // 1. Parse and validate arguments
    const options = parseArgs(argv)
    
    // 2. Read input file
    const source = await readFile(options.input, 'utf-8')
      .catch(() => {
        throw createError('FILE_ACCESS', `Cannot read ${options.input}`)
      })
    
    // 3. Parse source to AST
    let document
    try {
      document = parse(source)
    } catch (error) {
      throw createError('PARSE_ERROR', `Parse failed: ${error instanceof Error ? error.message : String(error)}`)
    }
    
    // 4. Check for slides
    if (!document.slides || document.slides.length === 0) {
      throw createError('NO_SLIDES', 'No slides found in input file')
    }
    
    // 5. Transform AST to HTML
    let transformed
    try {
      transformed = await transform(document)
    } catch (error) {
      throw createError('PARSE_ERROR', `Transform failed: ${error instanceof Error ? error.message : String(error)}`)
    }
    
    // 6. Render final HTML
    let html
    try {
      html = await render(transformed, options)
    } catch (error) {
      throw createError('OUTPUT_ERROR', `Render failed: ${error instanceof Error ? error.message : String(error)}`)
    }
    
    // 7. Write output
    await writeFile(options.output, html, 'utf-8')
      .catch(() => {
        throw createError('OUTPUT_ERROR', `Cannot write ${options.output}`)
      })
    
    console.log(`✓ Built ${options.output} (${document.slides.length} slides)`)
    
  } catch (error) {
    handleError(error)
  }
}

// CLI runner - only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv)
}