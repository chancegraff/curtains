import { z } from 'zod'
import { TimestampSchema } from './common'

// State Value Schema
export const StateValueSchema = z.unknown()

// State Change Schema
export const StateChangeSchema = z.object({
  key: z.string(),
  newValue: StateValueSchema,
  oldValue: StateValueSchema,
  timestamp: TimestampSchema,
})

// State Listener Schema
export const StateListenerSchema = z.function({
  input: [z.object({
    key: z.string(),
    newValue: z.unknown(),
    oldValue: z.unknown(),
    timestamp: TimestampSchema
  })], // change event
  output: z.void()
})

// State History Entry Schema
export const StateHistoryEntrySchema = z.object({
  action: z.enum(['set', 'update', 'delete', 'clear']),
  key: z.string(),
  oldValue: StateValueSchema,
  newValue: StateValueSchema,
  timestamp: TimestampSchema,
})

// State Store Interface Schema
export const StateStoreSchema = z.object({
  getState: z.function({
    input: [z.string().optional()], // key?
    output: z.unknown() // state value or snapshot
  }),
  setState: z.function({
    input: [z.string(), z.unknown()], // (key, value)
    output: z.void()
  }),
  updateState: z.function({
    input: [z.string(), z.unknown()], // (key, updater function)
    output: z.void()
  }),
  subscribe: z.function({
    input: [z.string(), z.unknown()], // (key, listener)
    output: z.unknown() // unsubscribe function
  }),
  getSnapshot: z.function({
    input: [],
    output: z.record(z.string(), z.unknown()) // state snapshot
  }),
  reset: z.function({
    input: [],
    output: z.void()
  }),
})

// Presentation State Schema
export const PresentationStateDataSchema = z.object({
  currentSlide: z.number().nonnegative().default(0),
  totalSlides: z.number().nonnegative().default(0),
  isFullscreen: z.boolean().default(false),
  isPresenting: z.boolean().default(false),
  theme: z.string().default('default'),
  zoomLevel: z.number().positive().default(1.0),
  notesVisible: z.boolean().default(false),
  navigationHistory: z.array(z.number()).default([]),
})

export const PresentationStateSchema = z.object({
  get: z.function({
    input: [z.string()], // key
    output: z.unknown() // state value
  }),
  set: z.function({
    input: [z.string(), z.unknown()], // (key, value)
    output: z.void()
  }),
  update: z.function({
    input: [z.string(), z.unknown()], // (key, updater)
    output: z.void()
  }),
  subscribe: z.function({
    input: [z.string(), z.unknown()], // (key, listener)
    output: z.unknown() // unsubscribe function
  }),
  navigateToSlide: z.function({
    input: [z.number().nonnegative()], // slideIndex
    output: z.boolean() // success
  }),
  goBack: z.function({
    input: [],
    output: z.boolean() // success
  }),
  toggleFullscreen: z.function({
    input: [],
    output: z.void()
  }),
  setTheme: z.function({
    input: [z.string()], // themeName
    output: z.boolean() // success
  }),
})

// View Synchronization Schema
export const ViewSyncTargetSchema = z.object({
  element: z.unknown(), // DOM element
  selector: z.string(),
  updater: z.function({
    input: [z.unknown(), z.unknown()], // (element, value)
    output: z.void()
  }),
})

export const ViewSynchronizerSchema = z.object({
  registerSyncTarget: z.function({
    input: [z.string(), z.string(), z.unknown()], // (selector, stateKey, updater)
    output: z.boolean() // success
  }),
  syncSlidePosition: z.function({
    input: [z.unknown()], // stateManager
    output: z.void()
  }),
  syncSlideCounter: z.function({
    input: [z.unknown()], // stateManager
    output: z.void()
  }),
  syncFullscreenClass: z.function({
    input: [z.unknown()], // stateManager
    output: z.void()
  }),
  syncThemeClass: z.function({
    input: [z.unknown()], // stateManager
    output: z.void()
  }),
  initialize: z.function({
    input: [],
    output: z.void()
  }),
})

// Persistent State Schema
export const PersistentStateDataSchema = z.object({
  currentSlide: z.number().nonnegative(),
  theme: z.string(),
  zoomLevel: z.number().positive(),
  notesVisible: z.boolean(),
  savedAt: z.string(), // ISO timestamp
})

export const PersistentStateSchema = z.object({
  saveToStorage: z.function({
    input: [z.unknown()], // state
    output: z.boolean() // success
  }),
  loadFromStorage: z.function({
    input: [],
    output: z.unknown() // stored state or null
  }),
  clearStorage: z.function({
    input: [],
    output: z.void()
  }),
})

// Computed State Schema
export const ComputedValueSchema = z.object({
  name: z.string(),
  dependencies: z.array(z.string()),
  computeFunction: z.function({
    input: [], // variable args based on dependencies
    output: z.unknown() // computed value
  }),
  cachedValue: StateValueSchema.optional(),
  lastComputed: TimestampSchema.optional(),
})

export const ComputedStateSchema = z.object({
  define: z.function({
    input: [z.string(), z.array(z.string()), z.unknown()], // (name, deps, computeFunc)
    output: z.void()
  }),
  get: z.function({
    input: [z.string()], // name
    output: z.unknown() // computed value
  }),
})

// State Middleware Schema
export const StateActionSchema = z.object({
  type: z.string(),
  key: z.string(),
  value: StateValueSchema.optional(),
})

export const StateMiddlewareSchema = z.object({
  name: z.string(),
  process: z.function({
    input: [z.unknown(), z.unknown(), z.unknown()], // (action, state, next)
    output: z.unknown() // result
  }),
})

export const StateMiddlewareManagerSchema = z.object({
  use: z.function({
    input: [z.unknown()], // middleware function
    output: z.void()
  }),
  applyMiddleware: z.function({
    input: [z.unknown(), z.unknown(), z.unknown()], // (action, state, next)
    output: z.unknown() // result
  }),
})

// Time Travel Schema
export const TimeTravelStateSchema = z.object({
  history: z.array(z.record(z.string(), StateValueSchema)),
  currentIndex: z.number().int(),
  maxHistory: z.number().positive().default(100),
})

export const TimeTravelSchema = z.object({
  record: z.function({
    input: [],
    output: z.void()
  }),
  undo: z.function({
    input: [],
    output: z.boolean() // success
  }),
  redo: z.function({
    input: [],
    output: z.boolean() // success
  }),
  canUndo: z.function({
    input: [],
    output: z.boolean()
  }),
  canRedo: z.function({
    input: [],
    output: z.boolean()
  }),
  restoreState: z.function({
    input: [z.unknown()], // snapshot
    output: z.void()
  }),
})

// State Validation Schema
export const StateValidatorSchema = z.object({
  validateSlideIndex: z.function({
    input: [z.number()], // index
    output: z.boolean() // is valid
  }),
  validateTheme: z.function({
    input: [z.string()], // theme
    output: z.boolean() // is valid
  }),
  validateZoomLevel: z.function({
    input: [z.number()], // zoom level
    output: z.boolean() // is valid
  }),
  validateState: z.function({
    input: [z.unknown()], // state
    output: z.boolean() // is valid
  }),
})

// State Selector Schema
export const StateSelectorSchema = z.function({
  input: [z.unknown()], // state
  output: z.unknown() // selected value
})

export const StateSubscriptionSchema = z.object({
  selector: StateSelectorSchema,
  listener: StateListenerSchema,
  lastValue: StateValueSchema.optional(),
})

// State Provider Schema
export const StateProviderSchema = z.object({
  store: StateStoreSchema,
  computed: ComputedStateSchema,
  middleware: StateMiddlewareManagerSchema,
  timeTravel: TimeTravelSchema,
  validator: StateValidatorSchema,
  get: z.function({
    input: [z.string()], // key
    output: z.unknown() // value
  }),
  set: z.function({
    input: [z.string(), z.unknown()], // (key, value)
    output: z.void()
  }),
  select: z.function({
    input: [z.unknown()], // selector
    output: z.unknown() // selected value
  }),
  subscribe: z.function({
    input: [z.string(), z.unknown()], // (key, listener) or (selector, listener)
    output: z.unknown() // unsubscribe function
  }),
})

// State Error Schema
export const StateErrorSchema = z.object({
  type: z.enum(['validation', 'notFound', 'typeMismatch', 'computation']),
  key: z.string(),
  value: StateValueSchema.optional(),
  message: z.string(),
  timestamp: TimestampSchema,
})

// Type Exports
export type StateValue = z.infer<typeof StateValueSchema>
export type StateChange = z.infer<typeof StateChangeSchema>
export type StateListener = z.infer<typeof StateListenerSchema>
export type StateHistoryEntry = z.infer<typeof StateHistoryEntrySchema>
export type StateStore = z.infer<typeof StateStoreSchema>
export type PresentationStateData = z.infer<typeof PresentationStateDataSchema>
export type PresentationState = z.infer<typeof PresentationStateSchema>
export type ViewSyncTarget = z.infer<typeof ViewSyncTargetSchema>
export type ViewSynchronizer = z.infer<typeof ViewSynchronizerSchema>
export type PersistentStateData = z.infer<typeof PersistentStateDataSchema>
export type PersistentState = z.infer<typeof PersistentStateSchema>
export type ComputedValue = z.infer<typeof ComputedValueSchema>
export type ComputedState = z.infer<typeof ComputedStateSchema>
export type StateAction = z.infer<typeof StateActionSchema>
export type StateMiddleware = z.infer<typeof StateMiddlewareSchema>
export type StateMiddlewareManager = z.infer<typeof StateMiddlewareManagerSchema>
export type TimeTravelState = z.infer<typeof TimeTravelStateSchema>
export type TimeTravel = z.infer<typeof TimeTravelSchema>
export type StateValidator = z.infer<typeof StateValidatorSchema>
export type StateSelector = z.infer<typeof StateSelectorSchema>
export type StateSubscription = z.infer<typeof StateSubscriptionSchema>
export type StateProvider = z.infer<typeof StateProviderSchema>
export type StateError = z.infer<typeof StateErrorSchema>
