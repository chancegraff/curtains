import z from 'zod';

import {
  CacheEntrySchema,
  EventSchema,
  EventTypeSchema,
  StateEntrySchema,
  StateErrorEntrySchema,
  StateKeySchema,
  StateSnapshotSchema,
} from './registry';

// Complete listener schema with handler
export const ListenerSchema = z.object({
  id: z.string().uuid(),
  event: EventTypeSchema,
  // handler is a function, stored separately in implementation
});

// Registry State (complete state structure)
export const RegistryStateSchema = z.object({
  // Core state data
  entries: z.map(StateKeySchema, StateEntrySchema),
  history: z.array(StateSnapshotSchema),
  version: z.number().int().min(0),

  // Event system
  listeners: z.map(z.string().uuid(), ListenerSchema),
  eventQueue: z.array(EventSchema),

  // Cache management
  cache: z.map(z.string(), CacheEntrySchema),

  // Lock management
  lockHolder: z.string().uuid().nullable(),
  lockQueue: z.array(z.string().uuid()),

  // Error tracking
  errors: z.array(StateErrorEntrySchema),

  // Metadata
  lastModified: z.number(),
  checksum: z.string(),
});

export type RegistryState = z.infer<typeof RegistryStateSchema>;

// Initial state factory
export const createInitialStateSchema = (): RegistryState =>
  RegistryStateSchema.parse({
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
    checksum: '',
  });
