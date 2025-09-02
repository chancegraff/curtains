import z from 'zod';

import { CLIErrorSchema } from './cli';
import { StateSnapshotSchema } from './registry';
import { RecoveryStrategySchema, StageSchema, StageTypeSchema } from './stages';

// Error details for context
export const ErrorDetailsSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
});

// Error context value types
export const ErrorContextValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  ErrorDetailsSchema,
]);

// Error flow through system
export const ErrorPropagationSchema = z.object({
  source: z.enum(['cli', 'registry', 'coordinator', 'pipeline']),
  stage: StageTypeSchema.optional(),
  error: CLIErrorSchema,
  context: z.record(z.string(), ErrorContextValueSchema),
  timestamp: z.number(),
});

// Error recovery data
export const ErrorRecoverySchema = z.object({
  failedStage: StageSchema,
  lastGoodState: StateSnapshotSchema,
  retryCount: z.number(),
  strategy: RecoveryStrategySchema,
});
