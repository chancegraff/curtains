import { TimestampSchema } from '../schemas/common'
import {
  StateStoreSchema,
  StateChangeSchema,
  StateListenerSchema,
  StateHistoryEntrySchema,
  StateValue,
  StateListener,
  StateStore,
  StateHistoryEntry,
} from '../schemas/state'
import { deepClone } from '../utils/deepClone'

// Internal state type using Maps for better performance
export type InternalState = {
  readonly values: Map<string, StateValue>
  readonly listeners: Map<string, StateListener[]>
  readonly history: readonly StateHistoryEntry[]
  readonly maxHistory: number
}

// Create initial state
const createInitialState = (): InternalState => ({
  values: new Map<string, StateValue>(),
  listeners: new Map<string, StateListener[]>(),
  history: [],
  maxHistory: 50,
})

// Create state store implementation
export const createStateStore = (): StateStore => {
  let state = createInitialState()

  const getState = (key?: string): StateValue => {
    if (key === undefined) {
      // Return complete snapshot
      const snapshot: Record<string, StateValue> = {}
      for (const [stateKey, value] of state.values) {
        snapshot[stateKey] = deepClone(value)
      }
      return snapshot
    } else {
      // Return specific key value
      return state.values.get(key)
    }
  }

  const setState = (key: string, value: StateValue): void => {
    const oldValue = state.values.get(key)

    // Only update if value has changed
    if (value !== oldValue) {
      // Create new state with updated value
      const newValues = new Map(state.values)
      newValues.set(key, value)

      // Create history entry
      const historyEntry = StateHistoryEntrySchema.parse({
        action: 'set',
        key,
        oldValue,
        newValue: value,
        timestamp: TimestampSchema.parse(Date.now()),
      })

      // Update history with size limit
      const newHistory = [...state.history, historyEntry]
      if (newHistory.length > state.maxHistory) {
        newHistory.shift()
      }

      // Update state immutably
      state = {
        ...state,
        values: newValues,
        history: newHistory,
      }

      // Notify listeners
      notifyListeners(key, value, oldValue)
    }
  }

  const updateState = (key: string, updater: unknown): void => {
    const currentValue = state.values.get(key)
    // Trust that updater is a function - Zod schema validates this at the interface level
    if (typeof updater === 'function') {
      const newValue = updater(currentValue)
      setState(key, newValue)
    }
  }

  const subscribe = (key: string, listener: unknown): (() => void) => {
    // Validate the listener
    const validatedListener = StateListenerSchema.parse(listener)

    // Get current listeners for this key
    const currentListeners = state.listeners.get(key) ?? []

    // Create new listeners map with added listener
    const newListeners = new Map(state.listeners)
    newListeners.set(key, [...currentListeners, validatedListener])

    // Update state immutably
    state = {
      ...state,
      listeners: newListeners,
    }

    // Return unsubscribe function
    return (): void => {
      const listeners = state.listeners.get(key) ?? []
      const filteredListeners = listeners.filter(l => l !== listener)

      const updatedListeners = new Map(state.listeners)
      if (filteredListeners.length === 0) {
        updatedListeners.delete(key)
      } else {
        updatedListeners.set(key, filteredListeners)
      }

      state = {
        ...state,
        listeners: updatedListeners,
      }
    }
  }

  const getSnapshot = (): Record<string, StateValue> => {
    const snapshot: Record<string, StateValue> = {}
    for (const [key, value] of state.values) {
      snapshot[key] = deepClone(value)
    }
    return snapshot
  }

  const reset = (): void => {
    // Store old values for notifications
    const oldValues = new Map(state.values)

    // Clear values and history but keep listeners
    state = {
      ...state,
      values: new Map<string, StateValue>(),
      history: [],
    }

    // Notify all listeners of reset
    for (const [key, oldValue] of oldValues) {
      notifyListeners(key, undefined, oldValue)
    }
  }

  const notifyListeners = (key: string, newValue: StateValue, oldValue: StateValue): void => {
    const listeners = state.listeners.get(key)
    if (!listeners) return

    const change = StateChangeSchema.parse({
      key,
      newValue,
      oldValue,
      timestamp: TimestampSchema.parse(Date.now()),
    })

    // Notify each listener, catching errors to prevent one failing listener from affecting others
    for (const listener of listeners) {
      try {
        if (typeof listener === 'function') {
          listener(change)
        }
      } catch (error) {
        console.error(`Listener error for key "${key}":`, error)
      }
    }
  }

  // Create store implementation
  const store: StateStore = {
    getState,
    setState,
    updateState,
    subscribe,
    getSnapshot,
    reset,
  }

  // Validate the complete store against schema
  StateStoreSchema.parse(store)

  return store
}
