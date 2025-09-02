import z from 'zod';

import { CurtainsDocumentSchema } from './ast';
import { ThemeSchema } from './cli';
import { TransformedDocumentSchema } from './transformers';

// Build input stage
export const BuildInputStageSchema = z.object({
  path: z.string(),
  content: z.string(),
});

// Build parse stage
export const BuildParseStageSchema = z.object({
  ast: CurtainsDocumentSchema,
});

// Build transform stage
export const BuildTransformStageSchema = z.object({
  transformed: TransformedDocumentSchema,
});

// Build render stage
export const BuildRenderStageSchema = z.object({
  html: z.string(),
  theme: ThemeSchema,
});

// Build output stage
export const BuildOutputStageSchema = z.object({
  path: z.string(),
  written: z.boolean(),
});

// Build command flow (the only command)
export const BuildCommandFlowSchema = z.object({
  input: BuildInputStageSchema,
  parse: BuildParseStageSchema,
  transform: BuildTransformStageSchema,
  render: BuildRenderStageSchema,
  output: BuildOutputStageSchema,
});
