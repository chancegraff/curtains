import z from 'zod';

import { CurtainsDocumentSchema } from './ast';
import { QueueSchema, RuntimeConfigSchema } from './cli';
import { ParserOutputSchema } from './parsers';
import { PipelineConfigSchema, PipelineResultSchema } from './stages';
import { TransformedDocumentSchema } from './transformers';

// State key types
export const StateKeySchema = z.enum([
  'runtime',
  'queue',
  'ast',
  'transformed',
  'rendered',
  'errors',
  'cache',
  'output',
  'pipeline',
  'pipeline-result',
]);

// Error entry for state
export const StateErrorEntrySchema = z.object({
  code: z.string(),
  message: z.string(),
});

// Cache entry item for state
export const StateCacheItemSchema = z.object({
  key: z.string(),
  value: z.string(),
  timestamp: z.number(),
});

// State value schemas for each key type
export const RuntimeStateValueSchema = z.object({
  type: z.literal('runtime'),
  config: RuntimeConfigSchema,
});

export const QueueStateValueSchema = z.object({
  type: z.literal('queue'),
  operations: QueueSchema,
});

export const ASTStateValueSchema = z.object({
  type: z.literal('ast'),
  document: CurtainsDocumentSchema,
});

export const TransformedStateValueSchema = z.object({
  type: z.literal('transformed'),
  document: TransformedDocumentSchema,
});

export const RenderedStateValueSchema = z.object({
  type: z.literal('rendered'),
  html: z.string(),
});

export const ErrorsStateValueSchema = z.object({
  type: z.literal('errors'),
  errors: z.array(StateErrorEntrySchema),
});

export const CacheStateValueSchema = z.object({
  type: z.literal('cache'),
  entries: z.record(z.string(), StateCacheItemSchema),
});

export const OutputStateValueSchema = z.object({
  type: z.literal('output'),
  path: z.string(),
  written: z.boolean(),
});

export const PipelineStateValueSchema = z.object({
  type: z.literal('pipeline'),
  config: PipelineConfigSchema,
});

export const PipelineResultStateValueSchema = z.object({
  type: z.literal('pipeline-result'),
  result: PipelineResultSchema,
});

// State value types for different keys
export const StateValueSchema = z.union([
  RuntimeStateValueSchema,
  QueueStateValueSchema,
  ASTStateValueSchema,
  TransformedStateValueSchema,
  RenderedStateValueSchema,
  ErrorsStateValueSchema,
  CacheStateValueSchema,
  OutputStateValueSchema,
  PipelineStateValueSchema,
  PipelineResultStateValueSchema,
]);

// State entry with version tracking
export const StateEntrySchema = z.object({
  key: StateKeySchema,
  value: StateValueSchema,
  version: z.number().int().positive(),
  timestamp: z.number(),
  checksum: z.string(),
});

// State snapshot
export const StateSnapshotSchema = z.object({
  entries: z.record(StateKeySchema, StateEntrySchema),
  version: z.number().int().positive(),
  timestamp: z.number(),
});

// Event types
export const EventTypeSchema = z.enum([
  'start-pipeline',
  'operation-complete',
  'state-changed',
  'error-occurred',
  'cache-invalidated',
  'stage-complete',
  'coordinator-complete',
  'coordinator-failed',
  'pipeline-started',
  'pipeline-progress',
  'pipeline-complete',
  'pipeline-failed',
  'stage-started',
  'stage-retry',
]);

// Operation result for events
export const OperationResultSchema = z.object({
  success: z.boolean(),
  data: z.string().optional(),
  error: z.string().optional(),
});

// Event error structure
export const EventErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});

// Event payload schemas
export const StartPipelinePayloadSchema = z.object({
  type: z.literal('start-pipeline'),
  pipelineId: z.string().uuid(),
});

export const OperationCompletePayloadSchema = z.object({
  type: z.literal('operation-complete'),
  operationId: z.string().uuid(),
  result: OperationResultSchema,
});

export const StateChangedPayloadSchema = z.object({
  type: z.literal('state-changed'),
  key: StateKeySchema,
  oldVersion: z.number(),
  newVersion: z.number(),
});

export const ErrorOccurredPayloadSchema = z.object({
  type: z.literal('error-occurred'),
  error: EventErrorSchema,
});

export const CacheInvalidatedPayloadSchema = z.object({
  type: z.literal('cache-invalidated'),
  keys: z.array(z.string()),
});

// Event payload types based on event type
export const EventPayloadSchema = z.union([
  StartPipelinePayloadSchema,
  OperationCompletePayloadSchema,
  StateChangedPayloadSchema,
  ErrorOccurredPayloadSchema,
  CacheInvalidatedPayloadSchema,
]);

// Event payload data types - discriminated union of all possible payload values
export const EventPayloadDataSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string()),
  z.object({
    pipelineId: z.string().uuid(),
  }),
  z.object({
    operationId: z.string().uuid(),
    result: OperationResultSchema,
  }),
  z.object({
    key: StateKeySchema,
    oldVersion: z.number(),
    newVersion: z.number(),
  }),
  z.object({
    error: EventErrorSchema,
  }),
  z.object({
    keys: z.array(z.string()),
  }),
  z.object({
    stageId: z.string(),
    success: z.boolean(),
    duration: z.number(),
  }),
  z.object({
    pipelineId: z.string().uuid(),
    success: z.boolean(),
    duration: z.number(),
  }),
  z.object({
    progress: z.number(),
    completed: z.number(),
    total: z.number(),
  }),
  z.object({
    stageId: z.string(),
    attempt: z.number(),
    maxAttempts: z.number(),
  }),
]);

// Event payload
export const EventSchema = z.object({
  type: EventTypeSchema,
  payload: z.record(z.string(), EventPayloadDataSchema),
  timestamp: z.number(),
  source: z.string(),
});

// Listener data schema (without function)
export const ListenerDataSchema = z.object({
  id: z.string().uuid(),
  event: EventTypeSchema,
});

// Full listener interface
export interface Listener extends z.infer<typeof ListenerDataSchema> {
  handler(payload: Record<string, z.infer<typeof EventPayloadDataSchema>>): void;
}

// Registry state data schema
export const RegistryStateDataSchema = z.object({
  current: StateSnapshotSchema,
  history: z.array(StateSnapshotSchema),
  locked: z.boolean(),
});

// Full registry state interface
export interface RegistryState extends z.infer<typeof RegistryStateDataSchema> {
  listeners: Listener[];
}

// Query types
export const QuerySchema = z.object({
  key: StateKeySchema,
  version: z.number().optional(),
  asOf: z.number().optional(),
});

// Parsed cache value
export const ParsedCacheValueSchema = z.object({
  type: z.literal('parsed'),
  data: ParserOutputSchema,
});

// Transformed cache value
export const TransformedCacheValueSchema = z.object({
  type: z.literal('transformed'),
  data: TransformedDocumentSchema,
});

// Rendered cache value
export const RenderedCacheValueSchema = z.object({
  type: z.literal('rendered'),
  html: z.string(),
});

// Cache value types
export const CacheValueSchema = z.union([
  z.string(), // Raw content
  ParsedCacheValueSchema, // Parsed data
  TransformedCacheValueSchema, // Transformed data
  RenderedCacheValueSchema, // Rendered HTML
]);

// Cache entry
export const CacheEntrySchema = z.object({
  key: z.string(),
  value: CacheValueSchema,
  ttl: z.number(),
  created: z.number(),
});

// Event queue
export const EventQueueSchema = z.array(EventSchema);
