import { TimestampSchema } from '../schemas/common'
import { EventHandler, EventUnsubscribe } from '../schemas/events';
import {
  EventTypeSchema,
  BaseEventSchema,
  EventBusSchema,
  EventErrorSchema,
  BaseEvent,
  EventType,
  EventError,
  EventBus,
} from '../schemas/events'

// Internal state type using Maps for better performance
type InternalEventBusState = {
  readonly listeners: Map<string, unknown[]>
  readonly eventQueue: readonly BaseEvent[]
  readonly isProcessing: boolean
}

// Create initial state
export const createInitialState = (): InternalEventBusState => ({
  listeners: new Map<string, unknown[]>(),
  eventQueue: [],
  isProcessing: false,
})

export const validateEventHandler = (handler: unknown): unknown => {
  // For function schemas, we check if it's a function and return it
  if (typeof handler !== 'function') {
    throw new Error('Event handler must be a function')
  }
  return handler
}

// Error creation helper
export const createEventError = (
  eventType: EventType,
  error: unknown,
  handlerName?: string
): EventError => {
  const errorData = {
    eventType,
    error,
    timestamp: TimestampSchema.parse(Date.now()),
    handlerName,
  }
  return EventErrorSchema.parse(errorData)
}

// Pure functions for state transformations
export const addListener = (
  state: InternalEventBusState,
  eventType: string,
  handler: unknown
): InternalEventBusState => {
  const currentListeners = state.listeners.get(eventType) ?? []
  const newListeners = new Map(state.listeners)
  newListeners.set(eventType, [...currentListeners, handler])

  return {
    ...state,
    listeners: newListeners,
  }
}

export const removeListener = (
  state: InternalEventBusState,
  eventType: string,
  handler: unknown
): InternalEventBusState => {
  const listeners = state.listeners.get(eventType) ?? []
  const filteredListeners = listeners.filter(h => h !== handler)

  const updatedListeners = new Map(state.listeners)
  if (filteredListeners.length === 0) {
    updatedListeners.delete(eventType)
  } else {
    updatedListeners.set(eventType, filteredListeners)
  }

  return {
    ...state,
    listeners: updatedListeners,
  }
}

export const addEventToQueue = (
  state: InternalEventBusState,
  event: BaseEvent
): InternalEventBusState => ({
  ...state,
  eventQueue: [...state.eventQueue, event],
})

export const removeFirstEventFromQueue = (
  state: InternalEventBusState
): InternalEventBusState => ({
  ...state,
  eventQueue: state.eventQueue.slice(1),
})

export const setProcessingStatus = (
  state: InternalEventBusState,
  isProcessing: boolean
): InternalEventBusState => ({
  ...state,
  isProcessing,
})

export const createEvent = (
  eventType: string,
  data?: Record<string, unknown>
): BaseEvent => BaseEventSchema.parse({
  type: EventTypeSchema.parse(eventType),
  data,
  timestamp: TimestampSchema.parse(Date.now()),
  propagationStopped: false,
})

export const handleEventErrorDefault = (eventError: EventError): void => {
  console.error(`Event error for type "${eventError.eventType}":`, eventError.error)
}

// Higher-order function to create the on function
export const createOnFunction = (
  getState: () => InternalEventBusState,
  setState: (state: InternalEventBusState) => void
) => (
  eventType: string,
  handler: unknown
): unknown => {
  const validatedEventType = EventTypeSchema.parse(eventType)
  const validatedHandler = validateEventHandler(handler)

  setState(addListener(getState(), validatedEventType, validatedHandler))

  const unsubscribe = (): void => {
    setState(removeListener(getState(), validatedEventType, validatedHandler))
  }

  return unsubscribe
}

// Higher-order function to create the emit function
export const createEmitFunction = (
  getState: () => InternalEventBusState,
  setState: (state: InternalEventBusState) => void,
  processQueue: () => void
) => (
  eventType: string,
  data?: Record<string, unknown>
): void => {
  const event = createEvent(eventType, data)
  setState(addEventToQueue(getState(), event))

  if (!getState().isProcessing) {
    processQueue()
  }
}

// Higher-order function to create the once function
export const createOnceFunction = (
  on: (eventType: string, handler: unknown) => unknown
) => (
  eventType: string,
  handler: unknown
): unknown => {
  const validatedHandler = validateEventHandler(handler)
  let unsubscribe: unknown = undefined;

  const onceHandler = (event: BaseEvent): void => {
    if (typeof validatedHandler === 'function') {
      validatedHandler(event)
    }
    if (typeof unsubscribe === 'function') {
      unsubscribe()
    }
  }

  unsubscribe = on(eventType, onceHandler)
  return unsubscribe
}

// Higher-order function to create the off function
export const createOffFunction = (
  getState: () => InternalEventBusState,
  setState: (state: InternalEventBusState) => void
) => (
  eventType: string,
  handler: unknown
): void => {
  const validatedEventType = EventTypeSchema.parse(eventType)
  const validatedHandler = validateEventHandler(handler)

  setState(removeListener(getState(), validatedEventType, validatedHandler))
}

// Pure function to dispatch a single event
export const dispatchEventToListeners = (
  event: BaseEvent,
  listeners: readonly unknown[],
  handleError: (error: EventError) => void
): void => {
  const currentEvent = { ...event }

  for (const handler of listeners) {
    if (currentEvent.propagationStopped) break

    try {
      if (typeof handler === 'function') {
        handler(currentEvent)
      }
    } catch (error) {
      const eventError = createEventError(event.type, error)
      handleError(eventError)
    }
  }
}

// Higher-order function to create the process queue function
export const createProcessQueueFunction = (
  getState: () => InternalEventBusState,
  setState: (state: InternalEventBusState) => void,
  handleError: (error: EventError) => void
) => (): void => {
  setState(setProcessingStatus(getState(), true))

  while (getState().eventQueue.length > 0) {
    const event = getState().eventQueue[0]
    if (!event) break

    setState(removeFirstEventFromQueue(getState()))

    const listeners = getState().listeners.get(event.type)
    if (listeners) {
      dispatchEventToListeners(event, listeners, handleError)
    }
  }

  setState(setProcessingStatus(getState(), false))
}

// Event bus implementation using functional approach
export const createEventBus = (): EventBus => {
  let state = createInitialState()

  const getState = (): InternalEventBusState => state
  const setState = (newState: InternalEventBusState): void => {
    state = newState
  }

  const processQueue = createProcessQueueFunction(
    getState,
    setState,
    handleEventErrorDefault
  )

  const on = createOnFunction(getState, setState)
  const emit = createEmitFunction(getState, setState, processQueue)
  const once = createOnceFunction(on)
  const off = createOffFunction(getState, setState)

  const eventBus: EventBus = {
    on,
    emit,
    once,
    off,
  }

  EventBusSchema.parse(eventBus)

  return eventBus
}

// Export type for convenience
export type { EventBus, BaseEvent, EventHandler, EventUnsubscribe }
