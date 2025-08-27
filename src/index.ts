// CLI Implementation using only abstraction layer
// Command-line interface for the Curtains presentation builder

// Import only from abstraction layer
import { main, runCLIIfDirect } from './abstractions/cli'

// Re-export the main function for compatibility
export { main }

/**
 * Determines if CLI should execute based on environment and arguments
 * @param metaUrl - import.meta.url from the calling module
 * @param argv - process.argv array
 * @returns true if CLI should execute
 */
export function shouldExecuteCLI(metaUrl: string, argv: string[]): boolean {
  return process.env.NODE_ENV !== 'test' && metaUrl === `file://${argv[1]}`
}

/**
 * CLI execution logic - extracted for testing
 * @param importMetaUrl - import.meta.url from the calling module
 * @param processArgv - process.argv array
 */
export const executeCLI = async (importMetaUrl: string, processArgv: string[]): Promise<void> => {
  await runCLIIfDirect(importMetaUrl, processArgv)
}

/**
 * Bootstrap CLI with default arguments
 * @param metaUrl - Optional meta URL (defaults to import.meta.url)
 * @param argv - Optional argv array (defaults to process.argv)
 */
export function bootstrapCLI(
  metaUrl: string = import.meta.url,
  argv: string[] = process.argv
): void {
  if (shouldExecuteCLI(metaUrl, argv)) {
    executeCLI(metaUrl, argv).catch((error) => {
      console.error('CLI execution failed:', error)
      try {
        process.exit(1)
      } catch {
        // Catch any errors from mocked process.exit in tests
        // In production, process.exit doesn't throw, but mocks might
      }
    })
  }
}

// Single module call - only run if not in test environment
if (process.env.NODE_ENV !== 'test') {
  bootstrapCLI()
}
