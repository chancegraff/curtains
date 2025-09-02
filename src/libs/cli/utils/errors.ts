import { z } from 'zod';

import { CLIErrorSchema, ErrorCodeSchema } from '../../schemas/cli';

/**
 * Map error codes to exit codes
 */
export function mapErrorCode(
  code: z.infer<typeof ErrorCodeSchema>
): number {
  const mapping: Record<z.infer<typeof ErrorCodeSchema>, number> = {
    'INVALID_ARGS': 1,
    'FILE_ACCESS': 2,
    'PARSE_ERROR': 3,
    'NO_SLIDES': 4,
    'OUTPUT_ERROR': 5,
  };

  return mapping[code];
}

/**
 * Create a structured CLI error
 */
export function createError(
  code: z.infer<typeof ErrorCodeSchema>,
  message: string
): z.infer<typeof CLIErrorSchema> {
  return {
    code,
    message,
    exitCode: mapErrorCode(code),
  };
}

/**
 * Handle error and exit process
 */
export function handleError(
  error: Error | z.infer<typeof CLIErrorSchema>
): never {
  if ('code' in error && 'exitCode' in error) {
    // Structured CLI error
    console.error(`Error [${error.code}]: ${error.message}`);
    process.exit(error.exitCode);
  } else if (error instanceof Error) {
    // Regular Error object
    console.error('Unexpected error:', error.message);
    process.exit(99);
  } else {
    // Unknown error type
    console.error('Unknown error occurred');
    process.exit(99);
  }
}
