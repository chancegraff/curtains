import { randomUUID } from 'crypto';
import { z } from 'zod';

import { RegistryActionSchema } from '../schemas/actions';
import { CurtainsDocumentSchema } from '../schemas/ast';
import { QueueSchema, RuntimeConfigSchema } from '../schemas/cli';
import {
  CacheValueSchema,
  EventPayloadDataSchema,
  EventTypeSchema,
  StateErrorEntrySchema,
  StateKeySchema,
  StateSnapshotSchema,
  StateValueSchema,
} from '../schemas/registry';
import { PipelineConfigSchema, PipelineResultSchema } from '../schemas/stages';
import { ListenerSchema, RegistryStateSchema } from '../schemas/state';
import { EventHandler, Registry, RegistryConfig } from '../schemas/store';
import { TransformedDocumentSchema } from '../schemas/transformers';
import { createStateValue } from './helpers';
import {
  createDebugMiddleware,
  createDefaultMiddleware,
} from './middleware';
import {
  createStore as createStoreInternal,
  dispatch as dispatchInternal,
  getHistory as getHistoryInternal,
  getSnapshot as getSnapshotInternal,
  getState as getStateInternal,
  getValue as getValueInternal,
  subscribe as subscribeInternal,
} from './store';

/**
 * Create a new Registry with initial state and middleware
 */
export function createRegistry(config: RegistryConfig = {}): Registry {
  const { initialState, debug = false, customMiddleware = [] } = config;

  // Create middleware stack
  const middleware = [
    ...customMiddleware,
    ...(debug ? createDebugMiddleware() : createDefaultMiddleware()),
  ];

  // Create store with middleware
  const store = createStoreInternal(initialState, middleware);

  return {
    store,
    eventHandlers: new Map(),
    debug,
  };
}

// Union type for all possible save values based on key
type SaveValueMap = {
  runtime: z.infer<typeof RuntimeConfigSchema>;
  queue: z.infer<typeof QueueSchema>;
  ast: z.infer<typeof CurtainsDocumentSchema>;
  transformed: z.infer<typeof TransformedDocumentSchema>;
  rendered: string;
  errors: z.infer<typeof StateErrorEntrySchema>[];
  cache: Record<string, { key: string; value: string; timestamp: number }>;
  output: { path: string; written: boolean };
  pipeline: z.infer<typeof PipelineConfigSchema>;
  'pipeline-result': z.infer<typeof PipelineResultSchema>;
};

/**
 * Save value to state
 */
export function save<K extends z.infer<typeof StateKeySchema>>(
  registry: Registry,
  key: K,
  value: SaveValueMap[K]
): void {
  try {
    const stateValue = createStateValue(key, value);
    dispatchInternal(registry.store, {
      type: 'SAVE_STATE',
      payload: { key, value: stateValue },
    });
  } catch (error) {
    if (registry.debug) {
      console.error(`Failed to save state for key ${key}:`, error);
    }
    throw error;
  }
}

/**
 * Get raw state value
 */
export function get(
  registry: Registry,
  key: z.infer<typeof StateKeySchema>
): z.infer<typeof StateValueSchema> | undefined {
  return getValueInternal(registry.store, key);
}

/**
 * Get runtime config
 */
export function getConfig(
  registry: Registry
): z.infer<typeof RuntimeConfigSchema> | undefined {
  const value = getValueInternal(registry.store, 'runtime');
  if (value && value.type === 'runtime' && 'config' in value) {
    return value.config;
  }
  return undefined;
}

/**
 * Get queue operations
 */
export function getQueue(
  registry: Registry
): z.infer<typeof QueueSchema> | undefined {
  const value = getValueInternal(registry.store, 'queue');
  if (value && value.type === 'queue' && 'operations' in value) {
    return value.operations;
  }
  return undefined;
}

/**
 * Get AST document
 */
export function getAst(
  registry: Registry
): z.infer<typeof CurtainsDocumentSchema> | undefined {
  const value = getValueInternal(registry.store, 'ast');
  if (value && value.type === 'ast' && 'document' in value) {
    return value.document;
  }
  return undefined;
}

/**
 * Get transformed document
 */
export function getTransformed(
  registry: Registry
): z.infer<typeof TransformedDocumentSchema> | undefined {
  const value = getValueInternal(registry.store, 'transformed');
  if (value && value.type === 'transformed' && 'document' in value) {
    return value.document;
  }
  return undefined;
}

/**
 * Get rendered HTML
 */
export function getRendered(
  registry: Registry
): string | undefined {
  const value = getValueInternal(registry.store, 'rendered');
  if (value && value.type === 'rendered' && 'html' in value) {
    return value.html;
  }
  return undefined;
}

/**
 * Set runtime configuration
 */
export function setConfig(
  registry: Registry,
  config: z.infer<typeof RuntimeConfigSchema>
): void {
  dispatchInternal(registry.store, {
    type: 'SET_CONFIG',
    payload: { config },
  });
}

/**
 * Emit an event
 */
export function emit(
  registry: Registry,
  eventType: z.infer<typeof EventTypeSchema>,
  payload: Record<string, z.infer<typeof EventPayloadDataSchema>>
): void {
  const event = {
    type: eventType,
    payload,
    timestamp: Date.now(),
    source: 'registry',
  };

  dispatchInternal(registry.store, {
    type: 'EMIT_EVENT',
    payload: { event },
  });

  // Process event handlers
  const handlers = registry.eventHandlers.get(eventType);
  if (handlers) {
    // Execute handlers asynchronously
    setTimeout(() => {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error);
        }
      });
    }, 0);
  }
}

/**
 * Subscribe to events
 */
export function subscribe(
  registry: Registry,
  eventType: z.infer<typeof EventTypeSchema>,
  handler: EventHandler
): () => void {
  const listenerId = randomUUID();
  const listener: z.infer<typeof ListenerSchema> = {
    id: listenerId,
    event: eventType,
  };

  // Add handler to registry's event handlers
  const handlers = registry.eventHandlers.get(eventType) ?? new Set();
  handlers.add(handler);
  registry.eventHandlers.set(eventType, handlers);

  // Add listener to state
  dispatchInternal(registry.store, {
    type: 'ADD_LISTENER',
    payload: { listener },
  });

  // Return unsubscribe function
  return (): void => {
    unsubscribe(registry, eventType, handler, listenerId);
  };
}

/**
 * Unsubscribe from events
 */
export function unsubscribe(
  registry: Registry,
  eventType: z.infer<typeof EventTypeSchema>,
  handler: EventHandler,
  listenerId: string
): void {
  // Remove handler from registry's event handlers
  const handlers = registry.eventHandlers.get(eventType);
  if (handlers) {
    handlers.delete(handler);
    if (handlers.size === 0) {
      registry.eventHandlers.delete(eventType);
    }
  }

  // Remove listener from state
  dispatchInternal(registry.store, {
    type: 'REMOVE_LISTENER',
    payload: { listenerId },
  });
}

/**
 * Get a snapshot of the current state
 */
export function getSnapshot(
  registry: Registry
): z.infer<typeof StateSnapshotSchema> {
  return getSnapshotInternal(registry.store);
}

/**
 * Create and save a snapshot to history
 */
export function createSnapshot(
  registry: Registry
): void {
  dispatchInternal(registry.store, {
    type: 'CREATE_SNAPSHOT',
    payload: { timestamp: Date.now() },
  });
}

/**
 * Restore from a snapshot
 */
export function restoreSnapshot(
  registry: Registry,
  snapshot: z.infer<typeof StateSnapshotSchema>
): void {
  dispatchInternal(registry.store, {
    type: 'RESTORE_SNAPSHOT',
    payload: { snapshot },
  });
}

/**
 * Get state history
 */
export function getHistory(
  registry: Registry,
  limit?: number
): z.infer<typeof StateSnapshotSchema>[] {
  return getHistoryInternal(registry.store, limit);
}

/**
 * Update cache
 */
export function updateCache(
  registry: Registry,
  key: string,
  value: z.infer<typeof CacheValueSchema>,
  ttl: number = 3600000 // Default 1 hour
): void {
  dispatchInternal(registry.store, {
    type: 'UPDATE_CACHE',
    payload: { key, value, ttl },
  });
}

/**
 * Get cache value
 */
export function getCacheValue(
  registry: Registry,
  key: string
): z.infer<typeof CacheValueSchema> | undefined {
  const state = getStateInternal(registry.store);
  const entry = state.cache.get(key);

  if (entry) {
    const now = Date.now();
    if (now - entry.created < entry.ttl) {
      return entry.value;
    }
  }

  return undefined;
}

/**
 * Invalidate cache
 */
export function invalidateCache(
  registry: Registry,
  options?: { pattern?: string; all?: boolean }
): void {
  const payload = options ?? {};
  dispatchInternal(registry.store, {
    type: 'INVALIDATE_CACHE',
    payload,
  });
}

/**
 * Acquire lock
 */
export function acquireLock(
  registry: Registry,
  requestId?: string
): string {
  const id = requestId ?? randomUUID();
  dispatchInternal(registry.store, {
    type: 'ACQUIRE_LOCK',
    payload: { requestId: id },
  });
  return id;
}

/**
 * Release lock
 */
export function releaseLock(
  registry: Registry,
  requestId: string
): void {
  dispatchInternal(registry.store, {
    type: 'RELEASE_LOCK',
    payload: { requestId },
  });
}

/**
 * Check if lock is held by requestId
 */
export function hasLock(
  registry: Registry,
  requestId: string
): boolean {
  const state = getStateInternal(registry.store);
  return state.lockHolder === requestId;
}

/**
 * Add an error to the state
 */
export function addError(
  registry: Registry,
  code: string,
  message: string
): void {
  dispatchInternal(registry.store, {
    type: 'ADD_ERROR',
    payload: {
      error: { code, message },
    },
  });
}

/**
 * Clear all errors
 */
export function clearErrors(
  registry: Registry
): void {
  dispatchInternal(registry.store, {
    type: 'CLEAR_ERRORS',
  });
}

/**
 * Get all errors
 */
export function getErrors(
  registry: Registry
): Array<{ code: string; message: string }> {
  const state = getStateInternal(registry.store);
  return [...state.errors];
}

/**
 * Get the entire state (readonly)
 */
export function getState(
  registry: Registry
): Readonly<z.infer<typeof RegistryStateSchema>> {
  return getStateInternal(registry.store);
}

/**
 * Subscribe to all state changes
 */
export function onStateChange(
  registry: Registry,
  listener: (
    state: z.infer<typeof RegistryStateSchema>,
    action: z.infer<typeof RegistryActionSchema>
  ) => void
): { registry: Registry; unsubscribe: () => Registry } {
  const result = subscribeInternal(registry.store, listener);
  const newRegistry: Registry = {
    ...registry,
    store: result.store,
  };
  
  return {
    registry: newRegistry,
    unsubscribe: (): Registry => {
      const newStore = result.unsubscribe();
      return {
        ...newRegistry,
        store: newStore,
      };
    },
  };
}

/**
 * Get current version
 */
export function getVersion(
  registry: Registry
): number {
  const state = getStateInternal(registry.store);
  return state.version;
}

/**
 * Get last modified timestamp
 */
export function getLastModified(
  registry: Registry
): number {
  const state = getStateInternal(registry.store);
  return state.lastModified;
}

/**
 * Reset registry to initial state
 */
export function reset(
  registry: Registry
): Registry {
  // Create a new store with initial state
  const config: RegistryConfig = {
    debug: registry.debug,
    customMiddleware: [],
  };
  
  // Create fresh registry
  return createRegistry(config);
}
