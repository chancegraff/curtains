import z from 'zod';

import { QueueSchema, RuntimeConfigSchema, ThemeSchema } from './cli';
import {
  ExecutionContextDataSchema,
  StageInputSchema,
  StageOutputSchema,
  StageSchema,
  StageStatusSchema,
} from './stages';
import { Registry } from './store';

// === CLI → Registry ===
export const CLIToRegistrySchema = z.object({
  type: z.literal('cli-config'),
  config: RuntimeConfigSchema,
  queue: QueueSchema,
  timestamp: z.number(),
});

// === Registry → Coordinator ===
export const RegistryToCoordinatorDataSchema = z.object({
  type: z.literal('execution-request'),
  config: RuntimeConfigSchema,
  queue: QueueSchema,
});

// Registry to Coordinator with registry reference
export interface RegistryToCoordinator extends z.infer<typeof RegistryToCoordinatorDataSchema> {
  registry: Registry;
}

// === Coordinator → Pipeline ===
export const CoordinatorToPipelineSchema = z.object({
  type: z.literal('stage-execution'),
  stage: StageSchema,
  input: StageInputSchema,
  context: ExecutionContextDataSchema,
});

// === Pipeline → Registry ===
export const PipelineToRegistrySchema = z.object({
  type: z.literal('stage-result'),
  stageId: z.uuid(),
  output: StageOutputSchema,
  status: StageStatusSchema,
  duration: z.number(),
});

// Output metadata
export const OutputMetadataSchema = z.object({
  totalSlides: z.number(),
  theme: ThemeSchema,
  generatedAt: z.number(),
});

// === Registry → Output ===
export const RegistryToOutputSchema = z.object({
  type: z.literal('final-output'),
  html: z.string(),
  outputPath: z.string(),
  metadata: OutputMetadataSchema,
});
