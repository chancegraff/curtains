import z from 'zod';

import { CurtainsDocumentSchema } from './ast';
import { ParserOutputSchema } from './parsers';
import { Registry } from './store';
import { TransformedDocumentSchema } from './transformers';

// Parse operation input
export const ParseOperationInputSchema = z.object({
  type: z.literal('parse'),
  content: z.string(),
});

// Transform operation input
export const TransformOperationInputSchema = z.object({
  type: z.literal('transform'),
  ast: CurtainsDocumentSchema,
});

// Render operation input
export const RenderOperationInputSchema = z.object({
  type: z.literal('render'),
  transformed: TransformedDocumentSchema,
});

// Write operation input
export const WriteOperationInputSchema = z.object({
  type: z.literal('write'),
  html: z.string(),
  path: z.string(),
});

// Operation input types based on operation type
export const OperationInputSchema = z.union([
  ParseOperationInputSchema,
  TransformOperationInputSchema,
  RenderOperationInputSchema,
  WriteOperationInputSchema,
]);

// Parse stage input
export const ParseStageInputSchema = z.object({
  type: z.literal('parse'),
  content: z.string(),
});

// Transform stage input
export const TransformStageInputSchema = z.object({
  type: z.literal('transform'),
  ast: CurtainsDocumentSchema,
});

// Render stage input
export const RenderStageInputSchema = z.object({
  type: z.literal('render'),
  transformed: TransformedDocumentSchema,
});

// Write stage input
export const WriteStageInputSchema = z.object({
  type: z.literal('write'),
  html: z.string(),
  path: z.string(),
});

// Stage IO types based on stage type
export const StageInputSchema = z.union([
  ParseStageInputSchema,
  TransformStageInputSchema,
  RenderStageInputSchema,
  WriteStageInputSchema,
]);

// Parse stage output
export const ParseStageOutputSchema = z.object({
  type: z.literal('parse'),
  result: ParserOutputSchema,
});

// Transform stage output
export const TransformStageOutputSchema = z.object({
  type: z.literal('transform'),
  result: TransformedDocumentSchema,
});

// Render stage output
export const RenderStageOutputSchema = z.object({
  type: z.literal('render'),
  html: z.string(),
});

// Write stage output
export const WriteStageOutputSchema = z.object({
  type: z.literal('write'),
  success: z.boolean(),
  path: z.string(),
});

export const StageOutputSchema = z.union([
  ParseStageOutputSchema,
  TransformStageOutputSchema,
  RenderStageOutputSchema,
  WriteStageOutputSchema,
]);

// Pipeline stages
export const StageTypeSchema = z.enum(['parse', 'transform', 'render', 'write']);

// Stage status
export const StageStatusSchema = z.enum(['pending', 'running', 'complete', 'failed', 'skipped']);

// Stage definition
export const StageSchema = z.object({
  id: z.string().uuid(),
  type: StageTypeSchema,
  input: StageInputSchema,
  output: StageOutputSchema.optional(),
  status: StageStatusSchema,
  error: z.string().optional(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  dependencies: z.array(z.string().uuid()),
});

// Pipeline configuration
export const PipelineConfigSchema = z.object({
  id: z.string().uuid(),
  stages: z.array(StageSchema),
  parallel: z.boolean().default(false),
  retryLimit: z.number().int().min(0).max(3).default(1),
  timeout: z.number().int().min(1000).default(30000),
});

// Execution context data schema (no functions)
export const ExecutionContextDataSchema = z.object({
  pipeline: PipelineConfigSchema,
  startTime: z.number(),
  endTime: z.number().optional(),
  status: z.enum(['running', 'complete', 'failed']),
});

// Stage result
export const StageResultSchema = z.object({
  stageId: z.string().uuid(),
  success: z.boolean(),
  output: z.lazy(() => StageOutputSchema).optional(),
  error: z.string().optional(),
  duration: z.number(),
});

// Pipeline result
export const PipelineResultSchema = z.object({
  pipelineId: z.string().uuid(),
  stages: z.array(StageResultSchema),
  success: z.boolean(),
  duration: z.number(),
});

// Execution strategy
export const ExecutionStrategySchema = z.enum(['sequential', 'parallel', 'waterfall']);

// Error recovery strategies
export const RecoveryStrategySchema = z.enum(['retry', 'skip', 'fail-fast', 'fallback']);

// Full execution context type with registry interface
export interface ExecutionContext extends z.infer<typeof ExecutionContextDataSchema> {
  registry: Registry;
}

// Stage handler interface
export interface StageHandler {
  type: z.infer<typeof StageTypeSchema>;
  handler(
    input: z.infer<typeof StageInputSchema>,
    registry: Registry
  ): Promise<z.infer<typeof StageOutputSchema>>;
  validator?(output: z.infer<typeof StageOutputSchema>): boolean;
}
