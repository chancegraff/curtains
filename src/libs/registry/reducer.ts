import { z } from 'zod';

import { RegistryActionSchema } from '../schemas/actions';
import { CurtainsDocumentSchema } from '../schemas/ast';
import { RuntimeConfigSchema } from '../schemas/cli';
import {
  ASTStateValueSchema,
  CacheEntrySchema,
  CacheStateValueSchema,
  ErrorsStateValueSchema,
  QueueStateValueSchema,
  RenderedStateValueSchema,
  RuntimeStateValueSchema,
  StateEntrySchema,
  StateKeySchema,
  StateSnapshotSchema,
  TransformedStateValueSchema,
} from '../schemas/registry';
import { RegistryStateSchema } from '../schemas/state';
import { TransformedDocumentSchema } from '../schemas/transformers';
import { calculateChecksum } from './helpers';

/**
 * Pure reducer function - handles all state transitions
 * No side effects allowed in this function
 */
export function registryReducer(
  state: z.infer<typeof RegistryStateSchema>,
  action: z.infer<typeof RegistryActionSchema>
): z.infer<typeof RegistryStateSchema> {
  // Validate inputs
  const validatedState = RegistryStateSchema.parse(state);
  const validatedAction = RegistryActionSchema.parse(action);

  if (validatedAction.type === 'SET_CONFIG') {
    const newEntries = new Map(validatedState.entries);
    const entry: z.infer<typeof StateEntrySchema> = {
      key: 'runtime',
      value: {
        type: 'runtime',
        config: validatedAction.payload.config,
      },
      version: validatedState.version + 1,
      timestamp: Date.now(),
      checksum: calculateChecksum({
        type: 'runtime',
        config: validatedAction.payload.config,
      }),
    };
    newEntries.set('runtime', entry);

    return {
      ...validatedState,
      entries: newEntries,
      version: validatedState.version + 1,
      lastModified: Date.now(),
    };
  }

  if (validatedAction.type === 'SAVE_STATE') {
    const newEntries = new Map(validatedState.entries);
    const entry: z.infer<typeof StateEntrySchema> = {
      key: validatedAction.payload.key,
      value: validatedAction.payload.value,
      version: validatedState.version + 1,
      timestamp: Date.now(),
      checksum: calculateChecksum(validatedAction.payload.value),
    };
    newEntries.set(validatedAction.payload.key, entry);

    return {
      ...validatedState,
      entries: newEntries,
      version: validatedState.version + 1,
      lastModified: Date.now(),
    };
  }

  if (validatedAction.type === 'CREATE_SNAPSHOT') {
    // Convert Map entries to record for snapshot
    // StateSnapshotSchema requires ALL keys to be present
    const allKeys: z.infer<typeof StateKeySchema>[] = [
      'runtime',
      'queue',
      'ast',
      'transformed',
      'rendered',
      'errors',
      'cache',
    ];

    const entriesRecord: Record<string, z.infer<typeof StateEntrySchema>> = {};
    
    // Add existing entries from state
    validatedState.entries.forEach((value, key) => {
      entriesRecord[key] = value;
    });

    // Provide default empty entries for missing keys
    const timestamp = validatedAction.payload.timestamp;
    allKeys.forEach((key) => {
      if (!entriesRecord[key]) {
        // Create proper empty values that match the schemas
        if (key === 'runtime') {
          const emptyConfig = RuntimeConfigSchema.parse({
            input: '',
            output: '',
            theme: 'light',
            timestamp: Date.now(),
            processId: crypto.randomUUID(),
          });
          entriesRecord[key] = StateEntrySchema.parse({
            key,
            value: RuntimeStateValueSchema.parse({
              type: 'runtime',
              config: emptyConfig,
            }),
            version: 1,
            timestamp,
            checksum: '',
          });
        } else if (key === 'queue') {
          entriesRecord[key] = StateEntrySchema.parse({
            key,
            value: QueueStateValueSchema.parse({
              type: 'queue',
              operations: [],
            }),
            version: 1,
            timestamp,
            checksum: '',
          });
        } else if (key === 'ast') {
          const emptyDoc = CurtainsDocumentSchema.parse({
            type: 'curtains-document',
            version: '0.1',
            slides: [],
            globalCSS: '',
          });
          entriesRecord[key] = StateEntrySchema.parse({
            key,
            value: ASTStateValueSchema.parse({
              type: 'ast',
              document: emptyDoc,
            }),
            version: 1,
            timestamp,
            checksum: '',
          });
        } else if (key === 'transformed') {
          const emptyTransformed = TransformedDocumentSchema.parse({
            slides: [],
            globalCSS: '',
          });
          entriesRecord[key] = StateEntrySchema.parse({
            key,
            value: TransformedStateValueSchema.parse({
              type: 'transformed',
              document: emptyTransformed,
            }),
            version: 1,
            timestamp,
            checksum: '',
          });
        } else if (key === 'rendered') {
          entriesRecord[key] = StateEntrySchema.parse({
            key,
            value: RenderedStateValueSchema.parse({
              type: 'rendered',
              html: '',
            }),
            version: 1,
            timestamp,
            checksum: '',
          });
        } else if (key === 'errors') {
          entriesRecord[key] = StateEntrySchema.parse({
            key,
            value: ErrorsStateValueSchema.parse({
              type: 'errors',
              errors: [],
            }),
            version: 1,
            timestamp,
            checksum: '',
          });
        } else if (key === 'cache') {
          entriesRecord[key] = StateEntrySchema.parse({
            key,
            value: CacheStateValueSchema.parse({
              type: 'cache',
              entries: {},
            }),
            version: 1,
            timestamp,
            checksum: '',
          });
        }
      }
    });

    const snapshot: z.infer<typeof StateSnapshotSchema> = {
      entries: entriesRecord,
      version: validatedState.version,
      timestamp: validatedAction.payload.timestamp,
    };

    return {
      ...validatedState,
      history: [...validatedState.history, snapshot],
    };
  }

  if (validatedAction.type === 'RESTORE_SNAPSHOT') {
    // Convert record entries back to Map
    const entriesMap = new Map<
      z.infer<typeof StateKeySchema>,
      z.infer<typeof StateEntrySchema>
    >();
    const snapshotEntries = validatedAction.payload.snapshot.entries;
    
    // Type-safe iteration over state keys
    const stateKeys = Object.keys(snapshotEntries);
    stateKeys.forEach((keyStr) => {
      // Validate the key is a valid StateKey
      const parseResult = StateKeySchema.safeParse(keyStr);
      if (parseResult.success) {
        const key = parseResult.data;
        const entry = snapshotEntries[key];
        if (entry) {
          entriesMap.set(key, entry);
        }
      }
    });

    return {
      ...validatedState,
      entries: entriesMap,
      version: validatedAction.payload.snapshot.version,
      lastModified: Date.now(),
    };
  }

  if (validatedAction.type === 'ADD_LISTENER') {
    const newListeners = new Map(validatedState.listeners);
    const listener = validatedAction.payload.listener;
    newListeners.set(listener.id, listener);

    return {
      ...validatedState,
      listeners: newListeners,
    };
  }

  if (validatedAction.type === 'REMOVE_LISTENER') {
    const newListeners = new Map(validatedState.listeners);
    newListeners.delete(validatedAction.payload.listenerId);

    return {
      ...validatedState,
      listeners: newListeners,
    };
  }

  if (validatedAction.type === 'EMIT_EVENT') {
    const event = validatedAction.payload.event;
    return {
      ...validatedState,
      eventQueue: [...validatedState.eventQueue, event],
    };
  }

  if (validatedAction.type === 'UPDATE_CACHE') {
    const newCache = new Map(validatedState.cache);
    const entry: z.infer<typeof CacheEntrySchema> = {
      key: validatedAction.payload.key,
      value: validatedAction.payload.value,
      ttl: validatedAction.payload.ttl,
      created: Date.now(),
    };
    newCache.set(validatedAction.payload.key, entry);

    return {
      ...validatedState,
      cache: newCache,
    };
  }

  if (validatedAction.type === 'INVALIDATE_CACHE') {
    if (validatedAction.payload.all) {
      return {
        ...validatedState,
        cache: new Map(),
      };
    }

    const newCache = new Map(validatedState.cache);
    if (validatedAction.payload.pattern) {
      // Convert glob pattern to regex
      const globPattern = validatedAction.payload.pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
        .replace(/\*/g, '.*') // Convert * to .*
        .replace(/\?/g, '.'); // Convert ? to .
      const regex = new RegExp(`^${globPattern}$`);
      const keysToDelete: string[] = [];
      
      newCache.forEach((_, key) => {
        if (regex.test(key)) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        newCache.delete(key);
      });
    }

    return {
      ...validatedState,
      cache: newCache,
    };
  }

  if (validatedAction.type === 'ACQUIRE_LOCK') {
    if (validatedState.lockHolder === null) {
      return {
        ...validatedState,
        lockHolder: validatedAction.payload.requestId,
      };
    }

    return {
      ...validatedState,
      lockQueue: [...validatedState.lockQueue, validatedAction.payload.requestId],
    };
  }

  if (validatedAction.type === 'RELEASE_LOCK') {
    if (validatedState.lockHolder === validatedAction.payload.requestId) {
      const nextHolder = validatedState.lockQueue[0] ?? null;
      return {
        ...validatedState,
        lockHolder: nextHolder,
        lockQueue: validatedState.lockQueue.slice(1),
      };
    }

    return {
      ...validatedState,
      lockQueue: validatedState.lockQueue.filter(
        (id) => id !== validatedAction.payload.requestId
      ),
    };
  }

  if (validatedAction.type === 'ADD_ERROR') {
    return {
      ...validatedState,
      errors: [...validatedState.errors, validatedAction.payload.error],
    };
  }

  if (validatedAction.type === 'CLEAR_ERRORS') {
    return {
      ...validatedState,
      errors: [],
    };
  }

  if (validatedAction.type === 'ADD_TO_HISTORY') {
    const maxHistory = 100; // Configurable limit
    const newHistory = [...validatedState.history, validatedAction.payload.snapshot];
    
    if (newHistory.length > maxHistory) {
      // Remove oldest entry
      newHistory.shift();
    }

    return {
      ...validatedState,
      history: newHistory,
    };
  }

  // If we get here, it's an unhandled action type
  // Return state unchanged (Redux pattern)
  return validatedState;
}