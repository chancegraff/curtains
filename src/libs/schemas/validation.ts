import z from 'zod';

import { BuildOptionsSchema } from './cli';
import { HTMLOutputSchema } from './renderers';
import { StageTypeSchema } from './stages';

// Input validation point
export const InputValidationPointSchema = z.object({
  location: z.literal('cli'),
  schema: BuildOptionsSchema,
  required: z.boolean(),
});

// Parse stage validation
export const ParseValidationSchema = z.object({
  type: z.literal('parse'),
  schema: z.literal('ParserOutputSchema'),
});

// Transform stage validation
export const TransformValidationSchema = z.object({
  type: z.literal('transform'),
  schema: z.literal('TransformedDocumentSchema'),
});

// Render stage validation
export const RenderValidationSchema = z.object({
  type: z.literal('render'),
  schema: z.literal('HTMLOutputSchema'),
});

// Write stage validation
export const WriteValidationSchema = z.object({
  type: z.literal('write'),
  schema: z.literal('WriteResultSchema'),
});

// Stage validation point
export const StageValidationPointSchema = z.object({
  location: z.literal('coordinator'),
  from: StageTypeSchema,
  to: StageTypeSchema,
  schema: z.union([
    ParseValidationSchema,
    TransformValidationSchema,
    RenderValidationSchema,
    WriteValidationSchema,
  ]),
});

// Output validation point
export const OutputValidationPointSchema = z.object({
  location: z.literal('renderer'),
  schema: HTMLOutputSchema,
  required: z.boolean(),
});

// Validation checkpoints
export const ValidationPointsSchema = z.object({
  inputValidation: InputValidationPointSchema,
  stageValidation: StageValidationPointSchema,
  outputValidation: OutputValidationPointSchema,
});
