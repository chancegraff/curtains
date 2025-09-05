import { z } from 'zod';

import { RegistryActionSchema } from '../schemas/actions';
import { ListenerSchema } from '../schemas/state';
import { EventHandler, Middleware, Store } from '../schemas/store';
import { dispatch, getState } from './store';

/**
 * Global storage for event handlers (since they can't be in state)
 */
const eventHandlers = new Map<string, EventHandler>();

/**
 * Register an event handler
 */
export function registerEventHandler(
  listenerId: string,
  handler: EventHandler
): void {
  eventHandlers.set(listenerId, handler);
}

/**
 * Unregister an event handler
 */
export function unregisterEventHandler(listenerId: string): void {
  eventHandlers.delete(listenerId);
}

/**
 * Get an event handler by listener ID
 */
export function getEventHandler(listenerId: string): EventHandler | undefined {
  return eventHandlers.get(listenerId);
}

/**
 * Event emission middleware - handles side effects for events
 * Processes events after state changes
 */
export const eventMiddleware: Middleware = (store: Store) => (next) => (action) => {
  // Apply action first (state change)
  next(action);

  // Then handle side effects
  if (action.type === 'EMIT_EVENT') {
    const state = getState(store);
    const event = action.payload.event;

    // Process event queue asynchronously to avoid blocking
    setTimeout(() => {
      state.listeners.forEach((listener: z.infer<typeof ListenerSchema>) => {
        if (listener.event === event.type) {
          const handler = getEventHandler(listener.id);
          if (handler) {
            try {
              handler(event.payload);
            } catch (error) {
              console.error(`Error in event handler ${listener.id}:`, error);
            }
          }
        }
      });
    }, 0);
  }

  // Handle listener cleanup
  if (action.type === 'REMOVE_LISTENER') {
    unregisterEventHandler(action.payload.listenerId);
  }
};

/**
 * Logging middleware - logs all actions and state changes
 */
export const loggingMiddleware: Middleware = (store: Store) => (next) => (action) => {
  const prevState = getState(store);
  const timestamp = new Date().toISOString();

  console.group(`[${timestamp}] Action: ${action.type}`);
  console.log('Previous State:', prevState);
  console.log('Action:', action);

  // Execute action
  next(action);

  const nextState = getState(store);
  console.log('Next State:', nextState);
  console.groupEnd();
};

/**
 * Validation middleware - validates actions before processing
 */
export const validationMiddleware: Middleware = (_store: Store) => (next) => (action) => {
  try {
    // Validate action schema
    const validatedAction = RegistryActionSchema.parse(action);

    // Pass validated action to next middleware
    next(validatedAction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid action:', {
        action,
        errors: error.issues,
      });
      // Don't process invalid actions
      return;
    }
    throw error;
  }
};

/**
 * Performance monitoring middleware - tracks action execution time
 */
export const performanceMiddleware: Middleware = (_store: Store) => (next) => (action) => {
  const startTime = performance.now();

  // Execute action
  next(action);

  const endTime = performance.now();
  const duration = endTime - startTime;

  // Log slow actions (> 100ms)
  if (duration > 100) {
    console.warn(`Slow action ${action.type}: ${duration.toFixed(2)}ms`);
  }
};

/**
 * Error handling middleware - catches and logs errors
 */
export const errorMiddleware: Middleware = (store: Store) => (next) => (action) => {
  try {
    next(action);
  } catch (error) {
    console.error('Error processing action:', {
      action,
      error,
    });

    // Dispatch error to state
    dispatch(store, {
      type: 'ADD_ERROR',
      payload: {
        error: {
          code: 'MIDDLEWARE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
    });
  }
};

/**
 * Cache pruning middleware - automatically prunes expired cache entries
 */
export const cachePruningMiddleware: Middleware = (store: Store) => (next) => (action) => {
  // Execute action first
  next(action);

  // After cache updates, check for expired entries
  if (action.type === 'UPDATE_CACHE') {
    const state = getState(store);
    const now = Date.now();
    const expiredKeys: string[] = [];

    state.cache.forEach((entry, key) => {
      if (now - entry.created > entry.ttl) {
        expiredKeys.push(key);
      }
    });

    // Invalidate expired entries
    if (expiredKeys.length > 0) {
      setTimeout(() => {
        dispatch(store, {
          type: 'INVALIDATE_CACHE',
          payload: {
            pattern: `^(${expiredKeys.join('|')})$`,
          },
        });
      }, 0);
    }
  }
};

/**
 * Create default middleware stack
 */
export function createDefaultMiddleware(): Middleware[] {
  return [
    validationMiddleware,
    errorMiddleware,
    performanceMiddleware,
    eventMiddleware,
    cachePruningMiddleware,
  ];
}

/**
 * Create debug middleware stack (includes logging)
 */
export function createDebugMiddleware(): Middleware[] {
  return [
    loggingMiddleware,
    validationMiddleware,
    errorMiddleware,
    performanceMiddleware,
    eventMiddleware,
    cachePruningMiddleware,
  ];
}
