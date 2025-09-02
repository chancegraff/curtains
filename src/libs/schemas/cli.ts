import z from 'zod';

import { OperationInputSchema } from './stages';

// Input validation
export const CLIArgsSchema = z.array(z.string());

// Command types
export const CommandSchema = z.enum(['build']);

// Theme options
export const ThemeSchema = z.enum(['light', 'dark']);

// Parsed CLI options (after Commander)
export const ParsedOptionsSchema = z.object({
  command: z.literal('build'),
  input: z.string(),
  output: z.string().optional(),
  theme: ThemeSchema.default('light'),
  debug: z.boolean().default(false),
  strict: z.boolean().default(false),
});

// Build options
export const BuildOptionsSchema = z.object({
  command: CommandSchema,
  input: z.string().refine(val => val.endsWith('.curtain')),
  output: z.string().refine(val => val.endsWith('.html')),
  theme: ThemeSchema.default('light'),
});

// Runtime configuration
export const RuntimeConfigSchema = z.object({
  input: z.string(),
  output: z.string(),
  theme: ThemeSchema,
  timestamp: z.number(),
  processId: z.string().uuid(),
});

// Error codes
export const ErrorCodeSchema = z.enum([
  'INVALID_ARGS',
  'FILE_ACCESS',
  'PARSE_ERROR',
  'NO_SLIDES',
  'OUTPUT_ERROR',
]);

// Error structure
export const CLIErrorSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string(),
  exitCode: z.number().int().min(1).max(5),
});

// Operation queue
export const OperationSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['parse', 'transform', 'render', 'write']),
  input: OperationInputSchema,
  timestamp: z.number(),
});

export const QueueSchema = z.array(OperationSchema);
