/**
 * Logger interface and factory for consistent logging across the application
 * Enables conditional logging without branching in client code
 */

export interface Logger {
  debug(message: string, ...args: string[]): void
  warn(message: string, ...args: string[]): void
  error(message: string, ...args: string[]): void
  info(message: string, ...args: string[]): void
}

/**
 * Creates a logger instance with conditional output
 * @param enabled - Whether logging is enabled
 * @returns Logger instance that either outputs or no-ops
 */
export function createLogger(enabled: boolean): Logger {
  const noop = (): void => {}
  
  return {
    debug: enabled ? console.debug.bind(console) : noop,
    warn: enabled ? console.warn.bind(console) : noop,
    error: enabled ? console.error.bind(console) : noop,
    info: enabled ? console.info.bind(console) : noop
  }
}

/**
 * Creates a debug-specific logger
 * @param debugMode - Whether debug mode is enabled
 * @returns Logger that only outputs in debug mode
 */
export function createDebugLogger(debugMode: boolean): Logger {
  return createLogger(debugMode)
}

/**
 * Creates a verbose logger
 * @param verboseMode - Whether verbose mode is enabled
 * @returns Logger that only outputs in verbose mode
 */
export function createVerboseLogger(verboseMode: boolean): Logger {
  return createLogger(verboseMode)
}