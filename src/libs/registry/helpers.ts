import { createHash } from 'crypto';
import { z } from 'zod';

import { CurtainsDocumentSchema } from '../schemas/ast';
import { QueueSchema, RuntimeConfigSchema } from '../schemas/cli';
import {
  ASTStateValueSchema,
  CacheEntrySchema,
  CacheStateValueSchema,
  ErrorsStateValueSchema,
  OutputStateValueSchema,
  PipelineResultStateValueSchema,
  PipelineStateValueSchema,
  QueueStateValueSchema,
  RenderedStateValueSchema,
  RuntimeStateValueSchema,
  StateCacheItemSchema,
  StateErrorEntrySchema,
  StateKeySchema,
  StateSnapshotSchema,
  StateValueSchema,
  TransformedStateValueSchema,
} from '../schemas/registry';
import { RegistryStateSchema } from '../schemas/state';
import { TransformedDocumentSchema } from '../schemas/transformers';

/**
 * Calculate checksum for state values using SHA-256
 */
export function calculateChecksum(
  value: z.infer<typeof StateValueSchema>
): string {
  const json = JSON.stringify(value, null, 0);
  return createHash('sha256').update(json).digest('base64').slice(0, 16);
}

/**
 * Validate state transition between keys
 */
export function validateTransition(
  from: z.infer<typeof StateKeySchema>,
  to: z.infer<typeof StateKeySchema>
): boolean {
  const validTransitions: Record<string, string[]> = {
    runtime: ['queue'],
    queue: ['ast'],
    ast: ['transformed'],
    transformed: ['rendered'],
    rendered: [],
    errors: [], // Can be set at any time
    cache: [], // Can be updated at any time
    output: [], // Can be set at any time
    pipeline: [], // Can be set at any time
    'pipeline-result': [], // Can be set at any time
  };

  const fromTransitions = validTransitions[from];
  if (fromTransitions === undefined) {
    return false;
  }
  return fromTransitions.includes(to);
}

/**
 * Check if cache entry is still valid based on TTL
 */
export function isCacheValid(
  entry: z.infer<typeof CacheEntrySchema>
): boolean {
  const now = Date.now();
  return now - entry.created < entry.ttl;
}

/**
 * Prune expired cache entries and return new map
 */
export function pruneCache(
  cache: Map<string, z.infer<typeof CacheEntrySchema>>
): Map<string, z.infer<typeof CacheEntrySchema>> {
  const newCache = new Map<string, z.infer<typeof CacheEntrySchema>>();

  cache.forEach((entry, key) => {
    if (isCacheValid(entry)) {
      newCache.set(key, entry);
    }
  });

  return newCache;
}

/**
 * Generate cache key for a specific type and input
 */
export function getCacheKey(
  type: string,
  input: z.infer<typeof StateValueSchema>
): string {
  return `${type}:${calculateChecksum(input)}`;
}

/**
 * Query state by key and optionally by version
 */
export function queryState(
  state: z.infer<typeof RegistryStateSchema>,
  key: z.infer<typeof StateKeySchema>,
  version?: number
): z.infer<typeof StateValueSchema> | undefined {
  if (version !== undefined) {
    // Look in history for specific version
    const snapshot = state.history.find((s) => s.version === version);
    if (snapshot) {
      // The snapshot.entries is a record/object according to StateSnapshotSchema
      const entries = snapshot.entries;
      const entry = entries[key];
      return entry?.value;
    }
    return undefined;
  }

  // Get current value
  const entry = state.entries.get(key);
  return entry?.value;
}

/**
 * Get state at specific timestamp from history
 */
export function getStateAtTime(
  history: z.infer<typeof StateSnapshotSchema>[],
  timestamp: number
): z.infer<typeof StateSnapshotSchema> | undefined {
  // Find the snapshot closest to but not after the timestamp
  let closest: z.infer<typeof StateSnapshotSchema> | undefined;

  for (const snapshot of history) {
    if (snapshot.timestamp <= timestamp) {
      closest = snapshot;
    } else {
      break;
    }
  }

  return closest;
}

/**
 * Create state value based on key and value with proper validation
 */
export function createStateValue(
  key: z.infer<typeof StateKeySchema>,
  value: unknown
): z.infer<typeof StateValueSchema> {
  if (key === 'runtime') {
    const config = RuntimeConfigSchema.parse(value);
    return RuntimeStateValueSchema.parse({
      type: 'runtime',
      config,
    });
  }

  if (key === 'queue') {
    const operations = QueueSchema.parse(value);
    return QueueStateValueSchema.parse({
      type: 'queue',
      operations,
    });
  }

  if (key === 'ast') {
    const document = CurtainsDocumentSchema.parse(value);
    return ASTStateValueSchema.parse({
      type: 'ast',
      document,
    });
  }

  if (key === 'transformed') {
    const document = TransformedDocumentSchema.parse(value);
    return TransformedStateValueSchema.parse({
      type: 'transformed',
      document,
    });
  }

  if (key === 'rendered') {
    const html = z.string().parse(value);
    return RenderedStateValueSchema.parse({
      type: 'rendered',
      html,
    });
  }

  if (key === 'errors') {
    const errors = z.array(StateErrorEntrySchema).parse(value);
    return ErrorsStateValueSchema.parse({
      type: 'errors',
      errors,
    });
  }

  if (key === 'cache') {
    // Convert Map to object if necessary
    let entries: Record<string, z.infer<typeof StateCacheItemSchema>>;
    if (value instanceof Map) {
      entries = {};
      value.forEach((v, k) => {
        entries[k] = v;
      });
    } else {
      entries = z.record(z.string(), StateCacheItemSchema).parse(value);
    }
    return CacheStateValueSchema.parse({
      type: 'cache',
      entries,
    });
  }

  if (key === 'output') {
    const parsed = z.object({
      path: z.string(),
      written: z.boolean(),
    }).parse(value);
    return OutputStateValueSchema.parse({
      type: 'output',
      path: parsed.path,
      written: parsed.written,
    });
  }

  if (key === 'pipeline') {
    return PipelineStateValueSchema.parse({
      type: 'pipeline',
      config: value,
    });
  }

  if (key === 'pipeline-result') {
    return PipelineResultStateValueSchema.parse({
      type: 'pipeline-result',
      result: value,
    });
  }

  throw new Error(`Unknown state key: ${key}`);
}

/**
 * Clone a Map deeply (simplified version without type assertions)
 */
export function cloneMap<K, V>(map: Map<K, V>): Map<K, V> {
  const cloned = new Map<K, V>();
  map.forEach((value, key) => {
    // Use JSON serialization for deep cloning complex values
    const clonedValue = JSON.parse(JSON.stringify(value));
    cloned.set(key, clonedValue);
  });
  return cloned;
}

/**
 * Create an immutable copy of the state (simplified without type assertions)
 */
export function createImmutableCopy<T>(obj: T): Readonly<T> {
  const cloned = structuredClone(obj);
  return Object.freeze(cloned);
}
