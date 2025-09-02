import { z } from 'zod';

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate file extensions for input and output
 */
export function validateExtensions(
  input: string,
  output: string
): ValidationResult {
  if (!input.endsWith('.curtain')) {
    return {
      valid: false,
      error: 'Input file must have .curtain extension',
    };
  }
  
  if (!output.endsWith('.html')) {
    return {
      valid: false,
      error: 'Output file must have .html extension',
    };
  }
  
  return { valid: true };
}

/**
 * Format Zod validation errors for user display
 */
export function formatValidationError(error: z.ZodError<unknown>): string {
  const issues = error.issues;
  const messages = issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
    return `${path}${issue.message}`;
  });
  
  return messages.join('\n');
}

/**
 * Validate file path is not empty
 */
export function validateFilePath(path: string, type: 'input' | 'output'): ValidationResult {
  if (!path || path.trim().length === 0) {
    return {
      valid: false,
      error: `${type === 'input' ? 'Input' : 'Output'} file path cannot be empty`,
    };
  }
  
  return { valid: true };
}