// Configuration Zod Schemas
// Contains Zod schemas for configuration validation

import { z } from 'zod'

// Theme schema
export const ThemeSchema = z.enum(['light', 'dark'])

// CLI Options schema
export const BuildOptionsSchema = z.object({
  input: z.string().min(1).refine(val => val.endsWith('.curtain'), {
    message: 'Input must be a .curtain file'
  }),
  output: z.string().min(1).refine(val => val.endsWith('.html'), {
    message: 'Output must be a .html file'
  }),
  theme: ThemeSchema.default('light')
})

// Error code schema
export const ErrorCodeSchema = z.enum([
  'INVALID_ARGS',
  'FILE_ACCESS', 
  'PARSE_ERROR',
  'NO_SLIDES',
  'OUTPUT_ERROR'
])

// Curtains error schema
export const CurtainsErrorSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string(),
  exitCode: z.number().int().min(1).max(5)
})

// Parsed args schema for validation
export const ParsedArgsSchema = z.object({
  command: z.literal('build'),
  input: z.string(),
  output: z.string().optional(),
  theme: z.string().optional()
})