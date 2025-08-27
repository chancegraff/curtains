import { z } from 'zod'
import { TimestampSchema, DurationSchema } from './common'

// Base Event Schemas
export const EventTypeSchema = z.enum([
  'navigation:next',
  'navigation:previous',
  'navigation:goto',
  'slide:before-change',
  'slide:after-change',
  'fullscreen:enter',
  'fullscreen:exit',
  'fullscreen:toggle',
  'touch:start',
  'touch:move',
  'touch:end',
  'mouse:click',
  'mouse:drag',
  'keyboard:press',
  'resize',
  'scroll',
])

export const BaseEventSchema = z.object({
  type: EventTypeSchema,
  data: z.record(z.string(), z.unknown()).optional(),
  timestamp: TimestampSchema,
  propagationStopped: z.boolean().default(false),
})

export const EventHandlerSchema = z.function({
  input: [z.object({
    type: EventTypeSchema,
    data: z.record(z.string(), z.unknown()).optional(),
    timestamp: TimestampSchema,
    propagationStopped: z.boolean().default(false)
  })], // event
  output: z.void()
})

export const EventUnsubscribeSchema = z.function({
  input: [],
  output: z.void()
})

// Event Bus Schema
export const EventBusSchema = z.object({
  on: z.function({
    input: [z.string(), z.unknown()], // (eventType, handler)
    output: z.unknown() // unsubscribe function
  }),
  emit: z.function({
    input: [z.string(), z.record(z.string(), z.unknown()).optional()], // (eventType, data?)
    output: z.void()
  }),
  once: z.function({
    input: [z.string(), z.unknown()], // (eventType, handler)
    output: z.unknown() // unsubscribe function
  }),
  off: z.function({
    input: [z.string(), z.unknown()], // (eventType, handler)
    output: z.void()
  }),
})

// Navigation Handler Schemas
export const NavigationStateSchema = z.object({
  currentSlide: z.number().nonnegative(),
  totalSlides: z.number().positive(),
  isTransitioning: z.boolean().default(false),
})

export const NavigationConfigSchema = z.object({
  totalSlides: z.number().positive(),
  startSlide: z.number().nonnegative().default(0),
  wrapAround: z.boolean().default(true),
})

export const SlideChangeEventSchema = z.object({
  from: z.number().nonnegative(),
  to: z.number().nonnegative(),
})

export const NavigationHandlerSchema = z.object({
  initialize: z.function({
    input: [z.unknown()], // config
    output: z.void()
  }),
  navigateNext: z.function({
    input: [],
    output: z.void()
  }),
  navigatePrevious: z.function({
    input: [],
    output: z.void()
  }),
  navigateToSlide: z.function({
    input: [z.number().nonnegative()], // slideIndex
    output: z.boolean() // success
  }),
  getState: z.function({
    input: [],
    output: z.unknown() // NavigationState
  }),
})

// Touch Event Handler Schemas
export const TouchPointSchema = z.object({
  clientX: z.number(),
  clientY: z.number(),
  identifier: z.number().optional(),
})

export const TouchStateSchema = z.object({
  startX: z.number().nullable(),
  startY: z.number().nullable(),
  startTime: TimestampSchema.nullable(),
  isSwiping: z.boolean().default(false),
})

export const TouchEventDataSchema = z.object({
  touches: z.array(TouchPointSchema),
  changedTouches: z.array(TouchPointSchema),
})

export const SwipeDirectionSchema = z.enum(['left', 'right', 'up', 'down'])

export const SwipeEventSchema = z.object({
  direction: SwipeDirectionSchema,
  distance: z.number().nonnegative(),
  duration: DurationSchema,
  velocity: z.number().nonnegative(),
})

export const TouchHandlerSchema = z.object({
  handleTouchStart: z.function({
    input: [z.unknown()], // touch event
    output: z.void()
  }),
  handleTouchMove: z.function({
    input: [z.unknown()], // touch event
    output: z.void()
  }),
  handleTouchEnd: z.function({
    input: [z.unknown()], // touch event
    output: z.void()
  }),
  getState: z.function({
    input: [],
    output: z.unknown() // TouchState
  }),
})

// Mouse Event Handler Schemas
export const MousePositionSchema = z.object({
  clientX: z.number(),
  clientY: z.number(),
})

export const MouseStateSchema = z.object({
  isDragging: z.boolean().default(false),
  startX: z.number().nullable(),
  dragThreshold: z.number().positive().default(5),
})

export const MouseEventDataSchema = z.object({
  clientX: z.number(),
  clientY: z.number(),
  button: z.number(),
  target: z.unknown(),
})

export const DragEventSchema = z.object({
  startPosition: MousePositionSchema,
  currentPosition: MousePositionSchema,
  deltaX: z.number(),
  deltaY: z.number(),
})

export const MouseHandlerSchema = z.object({
  handleClick: z.function({
    input: [z.unknown()], // mouse event
    output: z.void()
  }),
  handleMouseDown: z.function({
    input: [z.unknown()], // mouse event
    output: z.void()
  }),
  handleMouseMove: z.function({
    input: [z.unknown()], // mouse event
    output: z.void()
  }),
  handleMouseUp: z.function({
    input: [z.unknown()], // mouse event
    output: z.void()
  }),
  getState: z.function({
    input: [],
    output: z.unknown() // MouseState
  }),
})

// Keyboard Event Handler Schemas
export const KeyEventSchema = z.object({
  key: z.string(),
  code: z.string(),
  shiftKey: z.boolean(),
  ctrlKey: z.boolean(),
  altKey: z.boolean(),
  metaKey: z.boolean(),
})

export const KeyMappingSchema = z.record(
  z.string(),
  z.enum(['navigateNext', 'navigatePrevious', 'navigateFirst', 'navigateLast', 'toggleFullscreen'])
)

export const KeyboardHandlerSchema = z.object({
  handleKeydown: z.function({
    input: [z.unknown()], // key event
    output: z.void()
  }),
  handleKeyup: z.function({
    input: [z.unknown()], // key event
    output: z.void()
  }),
  setKeyMapping: z.function({
    input: [z.unknown()], // key mapping
    output: z.void()
  }),
})

// Fullscreen Handler Schemas
export const FullscreenStateSchema = z.object({
  isFullscreen: z.boolean().default(false),
  previousScroll: z.number().nullable(),
  supportsFullscreen: z.boolean(),
})

export const FullscreenHandlerSchema = z.object({
  toggleFullscreen: z.function({
    input: [],
    output: z.void()
  }),
  enterFullscreen: z.function({
    input: [],
    output: z.void()
  }),
  exitFullscreen: z.function({
    input: [],
    output: z.void()
  }),
  getState: z.function({
    input: [],
    output: z.unknown() // FullscreenState
  }),
})

// Accessibility Handler Schemas
export const AccessibilityStateSchema = z.object({
  announcer: z.unknown().nullable(), // DOM element
  focusTrap: z.unknown().nullable(), // DOM element
})

export const FocusableElementSchema = z.object({
  element: z.unknown(), // DOM element
  tabIndex: z.number(),
})

export const AccessibilityHandlerSchema = z.object({
  initialize: z.function({
    input: [],
    output: z.void()
  }),
  announce: z.function({
    input: [z.string()], // message
    output: z.void()
  }),
  setupFocusManagement: z.function({
    input: [z.unknown()], // container element
    output: z.void()
  }),
  getState: z.function({
    input: [],
    output: z.unknown() // AccessibilityState
  }),
})

// Event Coordinator Schema
export const EventCoordinatorConfigSchema = z.object({
  totalSlides: z.number().positive(),
  startSlide: z.number().nonnegative().default(0),
  enableKeyboard: z.boolean().default(true),
  enableTouch: z.boolean().default(true),
  enableMouse: z.boolean().default(true),
  enableFullscreen: z.boolean().default(true),
  enableAccessibility: z.boolean().default(true),
})

export const EventCoordinatorSchema = z.object({
  initialize: z.function({
    input: [z.unknown()], // config
    output: z.void()
  }),
  on: z.function({
    input: [z.string(), z.unknown()], // (eventType, handler)
    output: z.unknown() // unsubscribe function
  }),
  off: z.function({
    input: [z.string(), z.unknown()], // (eventType, handler)
    output: z.void()
  }),
  emit: z.function({
    input: [z.string(), z.record(z.string(), z.unknown()).optional()], // (eventType, data?)
    output: z.void()
  }),
  navigateTo: z.function({
    input: [z.number().nonnegative()], // slideIndex
    output: z.boolean() // success
  }),
  toggleFullscreen: z.function({
    input: [],
    output: z.void()
  }),
})

// Performance Optimization Schemas
export const DebounceConfigSchema = z.object({
  delay: DurationSchema,
})

export const ThrottleConfigSchema = z.object({
  limit: DurationSchema,
})

export const OptimizedHandlerSchema = z.object({
  original: z.function(),
  optimized: z.function(),
  type: z.enum(['debounce', 'throttle']),
  config: z.union([DebounceConfigSchema, ThrottleConfigSchema]),
})

export const PerformanceOptimizerSchema = z.object({
  debounce: z.function({
    input: [z.unknown(), z.number()], // (func, delay)
    output: z.unknown() // optimized function
  }),
  throttle: z.function({
    input: [z.unknown(), z.number()], // (func, limit)
    output: z.unknown() // optimized function
  }),
  optimizeResize: z.function({
    input: [z.unknown()], // handler
    output: z.unknown() // optimized handler
  }),
  optimizeScroll: z.function({
    input: [z.unknown()], // handler
    output: z.unknown() // optimized handler
  }),
})

// Event Error Schemas
export const EventErrorSchema = z.object({
  eventType: EventTypeSchema,
  handlerName: z.string().optional(),
  error: z.unknown(),
  timestamp: TimestampSchema,
})

// Type Exports
export type EventType = z.infer<typeof EventTypeSchema>
export type BaseEvent = z.infer<typeof BaseEventSchema>
export type EventHandler = z.infer<typeof EventHandlerSchema>
export type EventUnsubscribe = z.infer<typeof EventUnsubscribeSchema>
export type EventBus = z.infer<typeof EventBusSchema>
export type NavigationState = z.infer<typeof NavigationStateSchema>
export type NavigationConfig = z.infer<typeof NavigationConfigSchema>
export type SlideChangeEvent = z.infer<typeof SlideChangeEventSchema>
export type NavigationHandler = z.infer<typeof NavigationHandlerSchema>
export type TouchPoint = z.infer<typeof TouchPointSchema>
export type TouchState = z.infer<typeof TouchStateSchema>
export type TouchEventData = z.infer<typeof TouchEventDataSchema>
export type SwipeDirection = z.infer<typeof SwipeDirectionSchema>
export type SwipeEvent = z.infer<typeof SwipeEventSchema>
export type TouchHandler = z.infer<typeof TouchHandlerSchema>
export type MousePosition = z.infer<typeof MousePositionSchema>
export type MouseState = z.infer<typeof MouseStateSchema>
export type MouseEventData = z.infer<typeof MouseEventDataSchema>
export type DragEvent = z.infer<typeof DragEventSchema>
export type MouseHandler = z.infer<typeof MouseHandlerSchema>
export type KeyEvent = z.infer<typeof KeyEventSchema>
export type KeyMapping = z.infer<typeof KeyMappingSchema>
export type KeyboardHandler = z.infer<typeof KeyboardHandlerSchema>
export type FullscreenState = z.infer<typeof FullscreenStateSchema>
export type FullscreenHandler = z.infer<typeof FullscreenHandlerSchema>
export type AccessibilityState = z.infer<typeof AccessibilityStateSchema>
export type FocusableElement = z.infer<typeof FocusableElementSchema>
export type AccessibilityHandler = z.infer<typeof AccessibilityHandlerSchema>
export type EventCoordinatorConfig = z.infer<typeof EventCoordinatorConfigSchema>
export type EventCoordinator = z.infer<typeof EventCoordinatorSchema>
export type DebounceConfig = z.infer<typeof DebounceConfigSchema>
export type ThrottleConfig = z.infer<typeof ThrottleConfigSchema>
export type OptimizedHandler = z.infer<typeof OptimizedHandlerSchema>
export type PerformanceOptimizer = z.infer<typeof PerformanceOptimizerSchema>
export type EventError = z.infer<typeof EventErrorSchema>
