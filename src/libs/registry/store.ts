import { z } from 'zod';

import { RegistryActionSchema } from '../schemas/actions';
import { CurtainsDocumentSchema } from '../schemas/ast';
import { RuntimeConfigSchema } from '../schemas/cli';
import {
  ASTStateValueSchema,
  CacheStateValueSchema,
  ErrorsStateValueSchema,
  QueueStateValueSchema,
  RenderedStateValueSchema,
  RuntimeStateValueSchema,
  StateEntrySchema,
  StateKeySchema,
  StateSnapshotSchema,
  StateValueSchema,
  TransformedStateValueSchema,
} from '../schemas/registry';
import { createInitialStateSchema, RegistryStateSchema } from '../schemas/state';
import { Middleware, StateChangeListener, Store } from '../schemas/store';
import { TransformedDocumentSchema } from '../schemas/transformers';
import { createImmutableCopy } from './helpers';
import { registryReducer } from './reducer';

/**
 * Create a new store with initial state and middleware
 */
export function createStore(
  initialState?: Partial<z.infer<typeof RegistryStateSchema>>,
  middleware: Middleware[] = []
): Store {
  // Create default state
  const defaultState = createInitialStateSchema();

  // Merge with provided initial state if any
  let state: z.infer<typeof RegistryStateSchema>;
  if (initialState) {
    state = RegistryStateSchema.parse({
      ...defaultState,
      ...initialState,
    });
  } else {
    state = defaultState;
  }

  return {
    state,
    subscribers: new Set(),
    middleware,
  };
}

/**
 * Get current state (immutable copy)
 */
export function getState(store: Store): Readonly<z.infer<typeof RegistryStateSchema>> {
  // Return immutable copy to prevent external mutations
  return createImmutableCopy(store.state);
}

/**
 * Dispatch an action to update state (mutates store)
 */
export function dispatch(
  store: Store,
  action: z.infer<typeof RegistryActionSchema>
): void {
  // Validate action
  const validatedAction = RegistryActionSchema.parse(action);
  
  // Base dispatch that applies the reducer
  const baseDispatch = (act: z.infer<typeof RegistryActionSchema>): void => {
    const oldState = store.state;
    const newState = registryReducer(oldState, act);

    // Only update if state actually changed
    if (newState !== oldState) {
      // Update store state directly (mutable)
      store.state = newState;

      // Notify all subscribers with the new state
      store.subscribers.forEach((listener) => {
        try {
          listener(newState, act);
        } catch (error) {
          // Log but don't throw - one listener failing shouldn't break others
          console.error('Listener error:', error);
        }
      });
    }
  };

  // Apply middleware in reverse order (rightmost runs first)
  const dispatchWithMiddleware = store.middleware.reduceRight(
    (next, middlewareFn) => {
      return middlewareFn(store)(next);
    },
    baseDispatch
  );

  // Execute the action through the middleware chain
  dispatchWithMiddleware(validatedAction);
}

/**
 * Subscribe to state changes
 * Returns updated Store and unsubscribe function
 */
export function subscribe(
  store: Store,
  listener: StateChangeListener
): { store: Store; unsubscribe: () => Store } {
  // Create new Set with the listener added
  const newSubscribers = new Set(store.subscribers);
  newSubscribers.add(listener);

  // Create new Store with updated subscribers
  const newStore: Store = {
    ...store,
    subscribers: newSubscribers,
  };

  // Return new Store and unsubscribe function
  return {
    store: newStore,
    unsubscribe: (): Store => {
      // Create new Set without the listener
      const updatedSubscribers = new Set(newStore.subscribers);
      updatedSubscribers.delete(listener);

      // Return new Store without the listener
      return {
        ...newStore,
        subscribers: updatedSubscribers,
      };
    },
  };
}

/**
 * Get value from state by key
 */
export function getValue(
  store: Store,
  key: z.infer<typeof StateKeySchema>
): z.infer<typeof StateValueSchema> | undefined {
  const entry = store.state.entries.get(key);
  if (entry) {
    return entry.value;
  }
  return undefined;
}

/**
 * Get current state snapshot
 */
export function getSnapshot(store: Store): z.infer<typeof StateSnapshotSchema> {
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

  const entriesRecord: Partial<Record<
    z.infer<typeof StateKeySchema>,
    z.infer<typeof StateEntrySchema>
  >> = {};

  // Add all existing entries from the store
  store.state.entries.forEach((value, key) => {
    entriesRecord[key] = value;
  });

  // Provide default empty entries for missing keys
  allKeys.forEach((key) => {
    if (!entriesRecord[key]) {
      // Create a default empty entry for this key
      const timestamp = Date.now();
      
      // Create proper empty values that match the schemas
      if (key === 'runtime') {
        // Runtime expects a RuntimeConfigSchema object
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
        // AST expects a CurtainsDocumentSchema object
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
        // Transformed expects a TransformedDocumentSchema object
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

  // Ensure version is at least 1 for proper validation
  const version = store.state.version === 0 ? 1 : store.state.version;

  // At this point, all keys are guaranteed to be present because we filled in defaults
  // Build the complete entries object
  const completeEntries: Record<string, z.infer<typeof StateEntrySchema>> = {};
  
  allKeys.forEach((key) => {
    const entry = entriesRecord[key];
    if (entry) {
      completeEntries[key] = entry;
    }
  });

  return StateSnapshotSchema.parse({
    entries: completeEntries,
    version,
    timestamp: Date.now(),
  });
}

/**
 * Get history with optional limit
 */
export function getHistory(
  store: Store,
  limit?: number
): z.infer<typeof StateSnapshotSchema>[] {
  if (limit && limit > 0) {
    // Return last N snapshots
    return store.state.history.slice(-limit);
  }
  // Return all history
  return [...store.state.history];
}