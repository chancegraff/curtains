import z from 'zod';

import { CLIArgsSchema } from './cli';
import { StateKeySchema } from './registry';

// CLI start event
export const CLIStartEventSchema = z.object({
  args: CLIArgsSchema,
  timestamp: z.number(),
});

// Registry state saved event
export const RegistryStateSavedEventSchema = z.object({
  key: StateKeySchema,
  version: z.number(),
});

// Coordinator pipeline started event
export const CoordinatorPipelineStartedEventSchema = z.object({
  pipelineId: z.string().uuid(),
  stageCount: z.number(),
});

// Pipeline initialization event
export const PipelineInitEventSchema = z.object({
  type: z.literal('start-pipeline'),
  timestamp: z.number()
})

// Pipeline stage complete event
export const PipelineStageCompleteEventSchema = z.object({
  stageId: z.string().uuid(),
  duration: z.number(),
});

// Progress event
export const PipelineProgressEventSchema = z.object({
  progress: z.number(),
  completed: z.number(),
  total: z.number()
})

// Output file written event
export const OutputFileWrittenEventSchema = z.object({
  path: z.string(),
  size: z.number(),
});

// System events flow
export const SystemEventFlowSchema = z.object({
  'cli:start': CLIStartEventSchema,
  'registry:state-saved': RegistryStateSavedEventSchema,
  'coordinator:pipeline-started': CoordinatorPipelineStartedEventSchema,
  'pipeline:stage-complete': PipelineStageCompleteEventSchema,
  'output:file-written': OutputFileWrittenEventSchema,
});
