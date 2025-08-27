/**
 * Result type and utilities for functional error handling
 * Replaces try-catch with explicit error handling
 */

export type Result<T, E = Error> = 
  | { success: true; value: T }
  | { success: false; error: E }

/**
 * Creates a successful result
 * @param value - The success value
 * @returns Success result containing the value
 */
export function ok<T>(value: T): Result<T, never> {
  return { success: true, value }
}

/**
 * Creates an error result
 * @param error - The error value
 * @returns Error result containing the error
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error }
}

/**
 * Wraps a function that may throw in a Result
 * @param fn - Function that may throw
 * @returns Function that returns Result instead of throwing
 */
export function trySync<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn())
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Wraps an async function that may throw in a Result
 * @param fn - Async function that may throw
 * @returns Function that returns Result instead of throwing
 */
export async function tryAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
  try {
    const value = await fn()
    return ok(value)
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Maps a successful result to a new value
 * @param result - Result to map
 * @param fn - Mapping function
 * @returns New result with mapped value or original error
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.success ? ok(fn(result.value)) : result
}

/**
 * Maps an error result to a new error
 * @param result - Result to map
 * @param fn - Error mapping function
 * @returns New result with mapped error or original value
 */
export function mapError<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return result.success ? result : err(fn(result.error))
}

/**
 * Chains two Result-returning functions
 * @param result - Result to chain from
 * @param fn - Function that takes success value and returns Result
 * @returns Chained result
 */
export function chain<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  return result.success ? fn(result.value) : result
}

/**
 * Combines multiple results into one
 * @param results - Array of results to combine
 * @returns Success with array of values if all succeed, or first error
 */
export function combine<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = []
  for (const result of results) {
    if (!result.success) {
      return result
    }
    values.push(result.value)
  }
  return ok(values)
}

/**
 * Returns the value if successful, or a default value if error
 * @param result - Result to unwrap
 * @param defaultValue - Default value to return on error
 * @returns The success value or default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.success ? result.value : defaultValue
}

/**
 * Returns the value if successful, or throws the error
 * @param result - Result to unwrap
 * @returns The success value
 * @throws The error if result is failure
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (!result.success) {
    throw result.error
  }
  return result.value
}