# Registry State Specification (Reducer Pattern)

Component: State management using Redux-like Reducer pattern with Actions, Store, and immutable state

**Types Reference:** See [types-spec.md](./types-spec.md) for all type definitions

## Architecture Overview

The Registry uses a Redux-like architecture with:
1. **Actions**: Event objects describing state changes
2. **Reducer**: Pure function that applies actions to state
3. **Store**: Holds state and provides dispatch mechanism
4. **Middleware**: Handles side effects after state changes

## Core Reducer Function

```typescript
// Pure reducer function - no side effects
export function registryReducer(
  state: z.infer<typeof RegistryStateSchema>,
  action: z.infer<typeof RegistryActionSchema>
): z.infer<typeof RegistryStateSchema> {
  switch (action.type) {
    case 'SET_CONFIG': {
      const newEntries = new Map(state.entries);
      const entry: z.infer<typeof StateEntrySchema> = {
        key: 'runtime',
        value: {
          type: 'runtime',
          config: action.payload.config
        },
        version: state.version + 1,
        timestamp: Date.now(),
        checksum: calculateChecksum(action.payload.config)
      };
      newEntries.set('runtime', entry);
      
      return {
        ...state,
        entries: newEntries,
        version: state.version + 1,
        lastModified: Date.now()
      };
    }
    
    case 'SAVE_STATE': {
      const newEntries = new Map(state.entries);
      const entry: z.infer<typeof StateEntrySchema> = {
        key: action.payload.key,
        value: action.payload.value,
        version: state.version + 1,
        timestamp: Date.now(),
        checksum: calculateChecksum(action.payload.value)
      };
      newEntries.set(action.payload.key, entry);
      
      return {
        ...state,
        entries: newEntries,
        version: state.version + 1,
        lastModified: Date.now()
      };
    }
    
    case 'CREATE_SNAPSHOT': {
      const snapshot: z.infer<typeof StateSnapshotSchema> = {
        entries: new Map(state.entries),
        version: state.version,
        timestamp: action.payload.timestamp
      };
      
      return {
        ...state,
        history: [...state.history, snapshot]
      };
    }
    
    case 'RESTORE_SNAPSHOT': {
      return {
        ...state,
        entries: new Map(action.payload.snapshot.entries),
        version: action.payload.snapshot.version,
        lastModified: Date.now()
      };
    }
    
    case 'ADD_LISTENER': {
      const newListeners = new Map(state.listeners);
      newListeners.set(action.payload.listener.id, action.payload.listener);
      
      return {
        ...state,
        listeners: newListeners
      };
    }
    
    case 'REMOVE_LISTENER': {
      const newListeners = new Map(state.listeners);
      newListeners.delete(action.payload.listenerId);
      
      return {
        ...state,
        listeners: newListeners
      };
    }
    
    case 'EMIT_EVENT': {
      return {
        ...state,
        eventQueue: [...state.eventQueue, action.payload.event]
      };
    }
    
    case 'UPDATE_CACHE': {
      const newCache = new Map(state.cache);
      const entry: z.infer<typeof CacheEntrySchema> = {
        key: action.payload.key,
        value: action.payload.value,
        ttl: action.payload.ttl,
        created: Date.now()
      };
      newCache.set(action.payload.key, entry);
      
      return {
        ...state,
        cache: newCache
      };
    }
    
    case 'INVALIDATE_CACHE': {
      if (action.payload.all) {
        return {
          ...state,
          cache: new Map()
        };
      }
      
      const newCache = new Map(state.cache);
      if (action.payload.pattern) {
        const regex = new RegExp(action.payload.pattern);
        Array.from(newCache.keys()).forEach(key => {
          if (regex.test(key)) {
            newCache.delete(key);
          }
        });
      }
      
      return {
        ...state,
        cache: newCache
      };
    }
    
    case 'ACQUIRE_LOCK': {
      if (state.lockHolder === null) {
        return {
          ...state,
          lockHolder: action.payload.requestId
        };
      }
      
      return {
        ...state,
        lockQueue: [...state.lockQueue, action.payload.requestId]
      };
    }
    
    case 'RELEASE_LOCK': {
      if (state.lockHolder === action.payload.requestId) {
        const nextHolder = state.lockQueue[0] || null;
        return {
          ...state,
          lockHolder: nextHolder,
          lockQueue: state.lockQueue.slice(1)
        };
      }
      
      return {
        ...state,
        lockQueue: state.lockQueue.filter(id => id !== action.payload.requestId)
      };
    }
    
    case 'ADD_ERROR': {
      return {
        ...state,
        errors: [...state.errors, action.payload.error]
      };
    }
    
    case 'CLEAR_ERRORS': {
      return {
        ...state,
        errors: []
      };
    }
    
    case 'ADD_TO_HISTORY': {
      const maxHistory = 100; // Configurable limit
      const newHistory = [...state.history, action.payload.snapshot];
      if (newHistory.length > maxHistory) {
        newHistory.shift(); // Remove oldest
      }
      
      return {
        ...state,
        history: newHistory
      };
    }
    
    default:
      return state;
  }
}
```

## Store Implementation

```typescript
// Store interface
export interface RegistryStore {
  getState(): Readonly<z.infer<typeof RegistryStateSchema>>;
  dispatch(action: z.infer<typeof RegistryActionSchema>): void;
  subscribe(listener: StateChangeListener): () => void;
  getValue<T>(key: z.infer<typeof StateKeySchema>): T | undefined;
  getSnapshot(): z.infer<typeof StateSnapshotSchema>;
  getHistory(limit?: number): z.infer<typeof StateSnapshotSchema>[];
}

// State change listener type
type StateChangeListener = (
  state: z.infer<typeof RegistryStateSchema>,
  action: z.infer<typeof RegistryActionSchema>
) => void;

// Store implementation
export class RegistryStoreImpl implements RegistryStore {
  private state: z.infer<typeof RegistryStateSchema>;
  private subscribers: Set<StateChangeListener>;
  private middleware: Middleware[];
  
  constructor(
    initialState?: Partial<z.infer<typeof RegistryStateSchema>>,
    middleware: Middleware[] = []
  ) {
    const defaultState: z.infer<typeof RegistryStateSchema> = {
      entries: new Map(),
      history: [],
      version: 0,
      listeners: new Map(),
      eventQueue: [],
      cache: new Map(),
      lockHolder: null,
      lockQueue: [],
      errors: [],
      lastModified: Date.now(),
      checksum: ''
    };
    
    this.state = RegistryStateSchema.parse({
      ...defaultState,
      ...initialState
    });
    this.subscribers = new Set();
    this.middleware = middleware;
  }
  
  getState(): Readonly<z.infer<typeof RegistryStateSchema>> {
    // Return immutable copy
    return Object.freeze(structuredClone(this.state));
  }
  
  dispatch(action: z.infer<typeof RegistryActionSchema>): void {
    // Validate action
    const validatedAction = RegistryActionSchema.parse(action);
    
    // Apply middleware chain
    const chain = this.createMiddlewareChain();
    chain(validatedAction);
  }
  
  private createMiddlewareChain() {
    const baseDispatch = (action: z.infer<typeof RegistryActionSchema>) => {
      const oldState = this.state;
      const newState = registryReducer(this.state, action);
      
      if (newState !== oldState) {
        this.state = newState;
        // Notify subscribers
        this.subscribers.forEach(listener => {
          listener(newState, action);
        });
      }
    };
    
    // Apply middleware in reverse order
    return this.middleware.reduceRight(
      (next, middleware) => middleware(this)(next),
      baseDispatch
    );
  }
  
  subscribe(listener: StateChangeListener): () => void {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  }
  
  getValue<T>(key: z.infer<typeof StateKeySchema>): T | undefined {
    const entry = this.state.entries.get(key);
    return entry ? (entry.value as T) : undefined;
  }
  
  getSnapshot(): z.infer<typeof StateSnapshotSchema> {
    return {
      entries: new Map(this.state.entries),
      version: this.state.version,
      timestamp: Date.now()
    };
  }
  
  getHistory(limit?: number): z.infer<typeof StateSnapshotSchema>[] {
    if (limit) {
      return this.state.history.slice(-limit);
    }
    return [...this.state.history];
  }
}
```

## Middleware System

```typescript
// Middleware type
type Middleware = (store: RegistryStore) => 
  (next: (action: z.infer<typeof RegistryActionSchema>) => void) => 
  (action: z.infer<typeof RegistryActionSchema>) => void;

// Event emission middleware - handles side effects
export const eventMiddleware: Middleware = (store) => (next) => (action) => {
  // Apply action first (state change)
  next(action);
  
  // Then handle side effects
  if (action.type === 'EMIT_EVENT') {
    const state = store.getState();
    const event = action.payload.event;
    
    // Process event queue asynchronously
    setTimeout(() => {
      state.listeners.forEach(listener => {
        if (listener.event === event.type) {
          // Handler stored separately in implementation
          const handler = getListenerHandler(listener.id);
          if (handler) {
            handler(event.payload);
          }
        }
      });
    }, 0);
  }
};

// Logging middleware
export const loggingMiddleware: Middleware = (store) => (next) => (action) => {
  console.log('Dispatching:', action.type);
  const result = next(action);
  console.log('New state:', store.getState());
  return result;
};

// Validation middleware
export const validationMiddleware: Middleware = (store) => (next) => (action) => {
  // Validate action schema
  try {
    RegistryActionSchema.parse(action);
  } catch (error) {
    console.error('Invalid action:', error);
    return;
  }
  
  next(action);
};
```

## Registry Facade

```typescript
// Registry class - facade over the store
export class Registry {
  private store: RegistryStore;
  private listenerHandlers: Map<string, (payload: z.infer<typeof EventPayloadSchema>) => void>;
  
  constructor(initialState?: Partial<z.infer<typeof RegistryStateSchema>>) {
    // Create store with middleware
    this.store = new RegistryStoreImpl(
      initialState,
      [validationMiddleware, eventMiddleware, loggingMiddleware]
    );
    this.listenerHandlers = new Map();
  }
  
  // Save value to state
  save<T>(key: z.infer<typeof StateKeySchema>, value: T): void {
    const stateValue = this.createStateValue(key, value);
    this.store.dispatch({
      type: 'SAVE_STATE',
      payload: { key, value: stateValue }
    });
  }
  
  // Get value from state
  get<T>(key: z.infer<typeof StateKeySchema>): T | undefined {
    return this.store.getValue<T>(key);
  }
  
  // Emit event
  emit(
    eventType: z.infer<typeof EventTypeSchema>,
    payload: z.infer<typeof EventPayloadSchema>
  ): void {
    const event: z.infer<typeof EventSchema> = {
      type: eventType,
      payload,
      timestamp: Date.now(),
      source: 'registry'
    };
    
    this.store.dispatch({
      type: 'EMIT_EVENT',
      payload: { event }
    });
  }
  
  // Subscribe to events
  subscribe(
    eventType: z.infer<typeof EventTypeSchema>,
    handler: (payload: z.infer<typeof EventPayloadSchema>) => void
  ): () => void {
    const listenerId = crypto.randomUUID();
    const listener: z.infer<typeof ListenerSchema> = {
      id: listenerId,
      event: eventType
    };
    
    // Store handler separately (functions can't be in state)
    this.listenerHandlers.set(listenerId, handler);
    
    this.store.dispatch({
      type: 'ADD_LISTENER',
      payload: { listener }
    });
    
    // Return unsubscribe function
    return () => {
      this.listenerHandlers.delete(listenerId);
      this.store.dispatch({
        type: 'REMOVE_LISTENER',
        payload: { listenerId }
      });
    };
  }
  
  // Create snapshot
  snapshot(): z.infer<typeof StateSnapshotSchema> {
    return this.store.getSnapshot();
  }
  
  // Restore from snapshot
  restore(snapshot: z.infer<typeof StateSnapshotSchema>): void {
    this.store.dispatch({
      type: 'RESTORE_SNAPSHOT',
      payload: { snapshot }
    });
  }
  
  // Get history
  getHistory(limit?: number): z.infer<typeof StateSnapshotSchema>[] {
    return this.store.getHistory(limit);
  }
  
  // Update cache
  updateCache(key: string, value: z.infer<typeof CacheValueSchema>, ttl: number): void {
    this.store.dispatch({
      type: 'UPDATE_CACHE',
      payload: { key, value, ttl }
    });
  }
  
  // Invalidate cache
  invalidateCache(pattern?: string, all?: boolean): void {
    this.store.dispatch({
      type: 'INVALIDATE_CACHE',
      payload: { pattern, all }
    });
  }
  
  // Add error
  addError(code: string, message: string): void {
    this.store.dispatch({
      type: 'ADD_ERROR',
      payload: { error: { code, message } }
    });
  }
  
  // Clear errors
  clearErrors(): void {
    this.store.dispatch({
      type: 'CLEAR_ERRORS'
    });
  }
  
  // Helper to create state value
  private createStateValue(
    key: z.infer<typeof StateKeySchema>,
    value: unknown
  ): z.infer<typeof StateValueSchema> {
    switch (key) {
      case 'runtime':
        return { type: 'runtime', config: value as z.infer<typeof RuntimeConfigSchema> };
      case 'queue':
        return { type: 'queue', operations: value as z.infer<typeof QueueSchema> };
      case 'ast':
        return { type: 'ast', document: value as z.infer<typeof CurtainsDocumentSchema> };
      case 'transformed':
        return { type: 'transformed', document: value as z.infer<typeof TransformedDocumentSchema> };
      case 'rendered':
        return { type: 'rendered', html: value as string };
      case 'errors':
        return { type: 'errors', errors: value as z.infer<typeof StateErrorEntrySchema>[] };
      case 'cache':
        return { type: 'cache', entries: value as Record<string, z.infer<typeof StateCacheItemSchema>> };
      default:
        throw new Error(`Unknown state key: ${key}`);
    }
  }
}
```

## Pure Helper Functions

```typescript
// Calculate checksum for state values
export function calculateChecksum(
  value: z.infer<typeof StateValueSchema>
): string {
  const json = JSON.stringify(value, null, 0);
  // Use crypto.subtle or similar for actual implementation
  return Buffer.from(json).toString('base64').slice(0, 16);
}

// Validate state transition
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
    cache: []   // Can be updated at any time
  };
  
  return validTransitions[from]?.includes(to) ?? false;
}

// Check if cache entry is valid
export function isCacheValid(
  entry: z.infer<typeof CacheEntrySchema>
): boolean {
  const now = Date.now();
  return (now - entry.created) < entry.ttl;
}

// Prune expired cache entries
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

// Get cache key
export function getCacheKey(
  type: string,
  input: z.infer<typeof StateValueSchema>
): string {
  return `${type}:${calculateChecksum(input)}`;
}

// Query state by key and version
export function queryState(
  state: z.infer<typeof RegistryStateSchema>,
  key: z.infer<typeof StateKeySchema>,
  version?: number
): z.infer<typeof StateValueSchema> | undefined {
  if (version !== undefined) {
    // Look in history
    const snapshot = state.history.find(s => s.version === version);
    const entry = snapshot?.entries.get(key);
    return entry?.value;
  }
  
  // Get current value
  const entry = state.entries.get(key);
  return entry?.value;
}

// Get state at specific timestamp
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
```

## Usage Examples

```typescript
import { createRegistry, save, subscribe, emit, get, getSnapshot, restoreSnapshot, updateCache } from '../libs/registry';

// Create registry
const registry = createRegistry({ debug: true });

// Save runtime config
save(registry, 'runtime', {
  input: 'presentation.curtain',
  output: 'output.html',
  theme: 'dark',
  timestamp: Date.now(),
  processId: crypto.randomUUID()
});

// Subscribe to events
const unsubscribe = subscribe(registry, 'state-changed', (payload) => {
  console.log('State changed:', payload);
});

// Emit event
emit(registry, 'state-changed', {
  type: 'state-changed',
  key: 'runtime',
  oldVersion: 0,
  newVersion: 1
});

// Get value
const config = get(registry, 'runtime');

// Create snapshot
const snapshot = getSnapshot(registry);

// Restore from snapshot
restoreSnapshot(registry, snapshot);

// Update cache
updateCache(registry, 'parse:abc123', parsedData, 3600000);

// Invalidate cache
invalidateCache(registry, { pattern: '^parse:.*' }); // Invalidate all parse cache

// Add error
addError(registry, 'PARSE_ERROR', 'Failed to parse input file');

// Clear errors
clearErrors(registry);

// Cleanup
unsubscribe();
```

## Integration Points

- **CLI**: Dispatches SET_CONFIG and initial state
- **Coordinator**: Subscribes to state changes, reads config
- **Pipeline**: Dispatches SAVE_STATE for results
- **Services**: Query state via get() method

## Benefits of Reducer Pattern

1. **Predictable State Updates**: All changes go through reducer
2. **Time Travel Debugging**: History of all state changes
3. **Testability**: Pure reducer function is easy to test
4. **Type Safety**: Actions are fully typed with discriminated unions
5. **Middleware**: Extensible system for side effects
6. **Immutability**: State is never mutated directly
7. **Single Source of Truth**: All state in one place
8. **Atomic Updates**: Complex state changes in single action

## Thread Safety

The reducer pattern naturally provides thread safety:
- State is immutable
- Updates are atomic (single action)
- Lock management built into reducer
- No race conditions in pure functions