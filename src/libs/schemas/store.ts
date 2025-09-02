import z from 'zod';

import { RegistryActionSchema } from './actions';
import { StateKeySchema } from './registry';
import { RegistryStateSchema } from './state';

// Store configuration
export const StoreConfigSchema = z.object({
  initialState: RegistryStateSchema.optional(),
  middleware: z.array(z.function()).optional(),
});

// Store methods return types
export const StoreGetStateResultSchema = RegistryStateSchema;

export const StoreDispatchParamsSchema = z.object({
  action: RegistryActionSchema,
});

export const StoreSubscribeParamsSchema = z.object({
  listener: z.function(),
});

export const StoreGetValueParamsSchema = z.object({
  key: StateKeySchema,
});

// Middleware type
export const MiddlewareTypeSchema = z.function();

/**
 * State change listener type - extracted from store.ts
 */
export type StateChangeListener = (
  state: z.infer<typeof RegistryStateSchema>,
  action: z.infer<typeof RegistryActionSchema>
) => void;

/**
 * Store type - pure data, no methods - extracted from store.ts
 */
export type Store = {
  state: z.infer<typeof RegistryStateSchema>;
  subscribers: Set<StateChangeListener>;
  middleware: Middleware[];
};

/**
 * Middleware type - intercepts actions before they reach the reducer - extracted from store.ts
 */
export type Middleware = (store: Store) =>
  (next: (action: z.infer<typeof RegistryActionSchema>) => void) =>
  (action: z.infer<typeof RegistryActionSchema>) => void;

/**
 * Type for event handler functions - extracted from middleware.ts
 */
export type EventHandler = (payload: Record<string, unknown>) => void;

/**
 * Registry configuration options - extracted from registry.ts
 */
export const RegistryConfigSchema = z.object({
  initialState: RegistryStateSchema.partial().optional(),
  debug: z.boolean().optional(),
  customMiddleware: z.array(z.function()).optional(),
});

export interface RegistryConfig {
  initialState?: Partial<z.infer<typeof RegistryStateSchema>>;
  debug?: boolean;
  customMiddleware?: Middleware[];
}

/**
 * Registry type - wraps Store and adds event handlers - extracted from registry.ts
 */
export type Registry = {
  store: Store;
  eventHandlers: Map<string, Set<EventHandler>>;
  debug: boolean;
};
