import { z } from 'zod'
import {
  AdapterOptionsSchema,
  MiddlewareSchema,
  PipelineResultSchema,
  PipelineContextSchema,
  PipelineErrorSchema,
  ValidationErrorSchema,
  AbstractionErrorSchema,
  PipelineTimingSchema,
} from '../schemas/common'
import {
  GlobalRegistry,
  ParserInterfaceSchema,
  TransformerInterfaceSchema,
  Pipeline,
  PipelineSchema,
  PipelineCoordinator,
  PipelineCoordinatorSchema,
} from '../schemas/integration'
import {
  RendererInterfaceSchema,
} from '../schemas/rendering'
import {
  PresentationState,
  PresentationStateSchema,
} from '../schemas/state'
import {
  EventCoordinator,
  EventCoordinatorSchema,
} from '../schemas/events'
import {
  ContainerQuery,
} from '../schemas/containers'

import { createGlobalRegistry } from '../core/registry'
import { createStateStore } from '../state/store'
import { createEventBus } from '../events/eventBus'
import { createContainerQuery } from '../containers/factory'

// Type inference from schemas - no type casting
type PipelineContextType = z.infer<typeof PipelineContextSchema>
type PipelineResultType = z.infer<typeof PipelineResultSchema>
type AdapterOptionsType = z.infer<typeof AdapterOptionsSchema>
type MiddlewareType = z.infer<typeof MiddlewareSchema>
type PipelineTimingType = z.infer<typeof PipelineTimingSchema>
type PipelineErrorType = z.infer<typeof PipelineErrorSchema>
type ValidationErrorType = z.infer<typeof ValidationErrorSchema>
type AbstractionErrorType = z.infer<typeof AbstractionErrorSchema>

// Validation helpers using Zod parse
export const validateAdapterOptions = (options: unknown): AdapterOptionsType => {
  return AdapterOptionsSchema.parse(options ?? {})
}

export const validatePipelineContext = (context: unknown): PipelineContextType => {
  return PipelineContextSchema.parse(context)
}

export const validateMiddleware = (middleware: unknown): MiddlewareType => {
  return MiddlewareSchema.parse(middleware)
}

// Error creation helpers
export const createPipelineError = (
  phase: 'parse' | 'transform' | 'render' | 'finalize',
  message: string,
  cause?: unknown,
  partialOutput?: unknown
): PipelineErrorType => {
  const errorData = {
    message,
    code: 'PIPELINE_ERROR' as const,
    phase,
    partialOutput,
    timestamp: Date.now(),
    cause,
  }
  return PipelineErrorSchema.parse(errorData)
}

export const createValidationError = (
  message: string,
  validationErrors: Array<{path: string, message: string, value: unknown}>,
  cause?: unknown
): ValidationErrorType => {
  const errorData = {
    message,
    code: 'VALIDATION_ERROR' as const,
    validationErrors,
    timestamp: Date.now(),
    cause,
  }
  return ValidationErrorSchema.parse(errorData)
}

export const wrapPipelineError = (error: unknown, context: PipelineContextType): AbstractionErrorType => {
  if (error && typeof error === 'object' && 'code' in error) {
    return AbstractionErrorSchema.parse(error)
  }

  const errorData = {
    message: error instanceof Error ? error.message : 'Unknown pipeline error',
    code: 'PIPELINE_ERROR' as const,
    phase: 'unknown',
    context: {
      input: context.input,
      options: context.options,
      errors: context.errors,
    },
    timestamp: Date.now(),
    cause: error,
  }
  return AbstractionErrorSchema.parse(errorData)
}

// Safe performance timing helper
export const getCurrentTime = (): number => {
  // Use performance.now() if available, otherwise fall back to Date.now()
  if (typeof globalThis !== 'undefined' && globalThis.performance && typeof globalThis.performance.now === 'function') {
    return globalThis.performance.now()
  }
  return Date.now()
}

// Calculate timing helper
export const calculateTiming = (timing: PipelineTimingType): PipelineTimingType => {
  const totalTime = Object.values(timing.phases).reduce((sum, phaseTime) => {
    return (sum ?? 0) + (phaseTime ?? 0)
  }, 0)

  return PipelineTimingSchema.parse({
    ...timing,
    total: totalTime,
  })
}

// Middleware application
export const applyMiddleware = (
  context: PipelineContextType,
  middlewares: readonly unknown[],
  phase: 'beforeParse' | 'afterParse' | 'beforeTransform' | 'afterTransform' | 'beforeRender' | 'afterRender' | 'finalize'
): PipelineContextType => {
  let currentContext = context

  for (const middleware of middlewares) {
    const validatedMiddleware = validateMiddleware(middleware)

    if (validatedMiddleware.phases.includes(phase) || validatedMiddleware.phases.includes('*')) {
      try {
        // Trust that process is a function - Zod validates this at schema level
        if (typeof validatedMiddleware.process === 'function') {
          const result = validatedMiddleware.process(currentContext, phase)
          if (result && typeof result === 'object') {
            currentContext = validatePipelineContext(result)
          }
        }
      } catch (error) {
        // Log but don't fail pipeline
        console.warn(`Middleware error in ${phase}:`, error)
        const errorEntry = AbstractionErrorSchema.parse({
          message: `Middleware ${validatedMiddleware.name} failed in ${phase}`,
          code: 'PIPELINE_ERROR',
          phase,
          timestamp: Date.now(),
          cause: error,
        })
        currentContext = {
          ...currentContext,
          errors: [...currentContext.errors, errorEntry],
        }
      }
    }
  }

  return currentContext
}

// AST validation helper
export const validateAST = (ast: unknown): boolean => {
  // Basic AST validation - should have type and could have children
  if (!ast || typeof ast !== 'object') {
    return false
  }

  if (!('type' in ast)) {
    return false
  }

  return true
}

// Container processing helper
export const processContainers = (transformed: unknown): unknown => {
  // Basic container processing - in a full implementation this would
  // apply container transformations, validation, etc.
  return transformed
}

// Create Pipeline Coordinator
export const createPipelineCoordinator = (
  registry: GlobalRegistry,
  stateManager: PresentationState,
  eventCoordinator: EventCoordinator,
  containerSystem: ContainerQuery
): PipelineCoordinator => {

  const parsePhase = (context: unknown, registryParam: unknown): unknown => {
    const phaseStart = getCurrentTime()

    // Validate and type the context
    const typedContext = PipelineContextSchema.parse(context)
    // Type guard for registry parameter
    if (!registryParam || typeof registryParam !== 'object' || !('getAdapter' in registryParam) || !('getMiddleware' in registryParam)) {
      throw createPipelineError('parse', 'Invalid registry parameter')
    }
    const registry = registryParam

    // Select parser
    const parserName = typedContext.options.parser ?? 'default'
    let parser: unknown = null
    if (registry && typeof registry.getAdapter === 'function') {
      parser = registry.getAdapter('parser', parserName)
    }

    if (!parser) {
      throw createPipelineError('parse', `Parser not found: ${parserName}`)
    }

    const validatedParser = ParserInterfaceSchema.parse(parser)

    // Apply middleware
    let middleware: readonly unknown[] = []
    if (registry && typeof registry.getMiddleware === 'function') {
      middleware = registry.getMiddleware()
    }
    let currentContext = applyMiddleware(typedContext, middleware, 'beforeParse')

    // Parse input - trust that parse is a function from schema validation
    let ast: unknown = null
    if (typeof validatedParser.parse === 'function') {
      ast = validatedParser.parse(currentContext.input)
    }

    // Validate AST
    if (!validateAST(ast)) {
      throw createValidationError('Invalid AST structure', [
        { path: 'ast', message: 'AST must be a valid object with type property', value: ast }
      ])
    }

    currentContext = {
      ...currentContext,
      ast,
    }

    // Apply middleware
    let afterMiddleware: readonly unknown[] = []
    if (registry && typeof registry.getMiddleware === 'function') {
      afterMiddleware = registry.getMiddleware()
    }
    currentContext = applyMiddleware(currentContext, afterMiddleware, 'afterParse')

    const phaseEnd = getCurrentTime()
    const updatedTiming = {
      ...currentContext.timing,
      phases: {
        ...currentContext.timing.phases,
        parse: phaseEnd - phaseStart,
      },
    }

    return validatePipelineContext({
      ...currentContext,
      timing: updatedTiming,
    })
  }

  const transformPhase = (context: unknown, registryParam: unknown): unknown => {
    const phaseStart = getCurrentTime()

    // Validate and type the context
    const typedContext = PipelineContextSchema.parse(context)
    // Type guard for registry parameter
    if (!registryParam || typeof registryParam !== 'object' || !('getAdapter' in registryParam) || !('getMiddleware' in registryParam)) {
      throw createPipelineError('transform', 'Invalid registry parameter')
    }
    const registry = registryParam

    if (!typedContext.ast) {
      throw createPipelineError('transform', 'No AST available for transformation')
    }

    // Select transformer
    const transformerName = typedContext.options.transformer ?? 'default'
    let transformer: unknown = null
    if (registry && typeof registry.getAdapter === 'function') {
      transformer = registry.getAdapter('transformer', transformerName)
    }

    if (!transformer) {
      throw createPipelineError('transform', `Transformer not found: ${transformerName}`)
    }

    const validatedTransformer = TransformerInterfaceSchema.parse(transformer)

    // Apply middleware
    let middleware: readonly unknown[] = []
    if (registry && typeof registry.getMiddleware === 'function') {
      middleware = registry.getMiddleware()
    }
    let currentContext = applyMiddleware(typedContext, middleware, 'beforeTransform')

    // Transform AST - trust that transform is a function from schema validation
    let transformed: unknown = null
    if (typeof validatedTransformer.transform === 'function') {
      transformed = validatedTransformer.transform(currentContext.ast)
    }

    // Process containers
    const processedTransformed = processContainers(transformed)

    currentContext = {
      ...currentContext,
      transformed: processedTransformed,
    }

    // Apply middleware
    let afterMiddleware: readonly unknown[] = []
    if (registry && typeof registry.getMiddleware === 'function') {
      afterMiddleware = registry.getMiddleware()
    }
    currentContext = applyMiddleware(currentContext, afterMiddleware, 'afterTransform')

    const phaseEnd = getCurrentTime()
    const updatedTiming = {
      ...currentContext.timing,
      phases: {
        ...currentContext.timing.phases,
        transform: phaseEnd - phaseStart,
      },
    }

    return validatePipelineContext({
      ...currentContext,
      timing: updatedTiming,
    })
  }

  const renderPhase = (context: unknown, registryParam: unknown): unknown => {
    const phaseStart = getCurrentTime()

    // Validate and type the context
    const typedContext = PipelineContextSchema.parse(context)
    // Type guard for registry parameter
    if (!registryParam || typeof registryParam !== 'object' || !('getAdapter' in registryParam) || !('getMiddleware' in registryParam)) {
      throw createPipelineError('render', 'Invalid registry parameter')
    }
    const registry = registryParam

    if (!typedContext.transformed) {
      throw createPipelineError('render', 'No transformed document available for rendering')
    }

    // Select renderer
    const rendererName = typedContext.options.renderer ?? 'default'
    let renderer: unknown = null
    if (registry && typeof registry.getAdapter === 'function') {
      renderer = registry.getAdapter('renderer', rendererName)
    }

    if (!renderer) {
      throw createPipelineError('render', `Renderer not found: ${rendererName}`)
    }

    const validatedRenderer = RendererInterfaceSchema.parse(renderer)

    // Apply middleware
    let middleware: readonly unknown[] = []
    if (registry && typeof registry.getMiddleware === 'function') {
      middleware = registry.getMiddleware()
    }
    let currentContext = applyMiddleware(typedContext, middleware, 'beforeRender')

    // Render to output - trust that render is a function from schema validation
    let output: unknown = null
    if (typeof validatedRenderer.render === 'function') {
      output = validatedRenderer.render(currentContext.transformed, currentContext.options)
    }

    if (typeof output !== 'string') {
      throw createPipelineError('render', 'Renderer must return a string')
    }

    currentContext = {
      ...currentContext,
      output,
    }

    // Apply middleware
    let afterMiddleware: readonly unknown[] = []
    if (registry && typeof registry.getMiddleware === 'function') {
      afterMiddleware = registry.getMiddleware()
    }
    currentContext = applyMiddleware(currentContext, afterMiddleware, 'afterRender')

    const phaseEnd = getCurrentTime()
    const updatedTiming = {
      ...currentContext.timing,
      phases: {
        ...currentContext.timing.phases,
        render: phaseEnd - phaseStart,
      },
    }

    return validatePipelineContext({
      ...currentContext,
      timing: updatedTiming,
    })
  }

  const finalizePhase = (context: unknown): unknown => {
    const phaseStart = getCurrentTime()

    // Validate and type the context
    const typedContext = PipelineContextSchema.parse(context)

    if (!typedContext.transformed) {
      throw createPipelineError('finalize', 'No transformed document available for finalization')
    }

    // Update state - safely handle state updates
    if (typedContext.transformed && typeof typedContext.transformed === 'object' && 'slides' in typedContext.transformed) {
      const transformedData = typedContext.transformed
      const slides = transformedData.slides
      if (Array.isArray(slides) && typeof stateManager.set === 'function') {
        stateManager.set('total_slides', slides.length)
        stateManager.set('current_slide', 0)
      }
    }

    // Initialize event handlers - safely handle event initialization
    let totalSlides: unknown = null
    if (typeof stateManager.get === 'function') {
      totalSlides = stateManager.get('total_slides')
    }

    if (typeof totalSlides === 'number' && totalSlides > 0 && typeof eventCoordinator.initialize === 'function') {
      // Create options with extended type to include startSlide
      const baseOptions = typedContext.options
      const extendedOptions = {
        ...baseOptions,
        startSlide: (baseOptions && typeof baseOptions === 'object' && 'startSlide' in baseOptions && typeof baseOptions.startSlide === 'number') ? baseOptions.startSlide : 0
      }
      eventCoordinator.initialize({
        totalSlides,
        startSlide: extendedOptions.startSlide ?? 0,
        enableKeyboard: true,
        enableTouch: true,
        enableMouse: true,
        enableFullscreen: true,
        enableAccessibility: true,
      })
    }

    // Apply final middleware (no registry in finalize phase)
    const middleware: readonly unknown[] = []
    const currentContext = applyMiddleware(typedContext, middleware, 'finalize')

    const phaseEnd = getCurrentTime()
    const updatedTiming = calculateTiming({
      ...currentContext.timing,
      phases: {
        ...currentContext.timing.phases,
        finalize: phaseEnd - phaseStart,
      },
      total: getCurrentTime() - currentContext.timing.start,
    })

    return validatePipelineContext({
      ...currentContext,
      timing: updatedTiming,
    })
  }

  const process = (input: string, options?: unknown): PipelineResultType => {
    const validatedOptions = validateAdapterOptions(options)

    // Initialize pipeline context
    const context: PipelineContextType = {
      input,
      options: validatedOptions,
      errors: [],
      timing: {
        start: getCurrentTime(),
        phases: {},
      },
    }

    try {
      // Phase 1: Parse
      const parsedContext = parsePhase(context, registry)

      // Phase 2: Transform
      const transformedContext = transformPhase(parsedContext, registry)

      // Phase 3: Render
      const renderedContext = renderPhase(transformedContext, registry)

      // Phase 4: Finalize
      const finalizedContext = finalizePhase(renderedContext)
      const typedFinalContext = PipelineContextSchema.parse(finalizedContext)

      if (!typedFinalContext.output) {
        throw createPipelineError('finalize', 'No output generated')
      }

      const successResult = {
        success: true as const,
        output: typedFinalContext.output,
        timing: typedFinalContext.timing,
      }

      return PipelineResultSchema.parse(successResult)

    } catch (error) {
      const errorResult = {
        success: false as const,
        error: wrapPipelineError(error, context),
        partialOutput: context.output,
      }

      return PipelineResultSchema.parse(errorResult)
    }
  }

  const coordinator: PipelineCoordinator = {
    registry,
    stateManager,
    eventCoordinator,
    containerSystem,
    process,
    parsePhase,
    transformPhase,
    renderPhase,
    finalizePhase,
  }

  // Validate the complete coordinator against schema
  PipelineCoordinatorSchema.parse(coordinator)

  return coordinator
}

// Create Presentation State wrapper
export const createPresentationStateWrapper = (): PresentationState => {
  const store = createStateStore()

  // Initialize default presentation state - check if setState is a function
  if (typeof store.setState === 'function') {
    store.setState('current_slide', 0)
    store.setState('total_slides', 0)
    store.setState('is_fullscreen', false)
    store.setState('is_presenting', false)
    store.setState('theme', 'default')
    store.setState('zoom_level', 1.0)
    store.setState('notes_visible', false)
    store.setState('navigation_history', [])
  }

  const navigateToSlide = (slideIndex: number): boolean => {
    if (typeof store.getState !== 'function' || typeof store.setState !== 'function' || typeof store.updateState !== 'function') {
      return false
    }

    const currentState = store.getState('current_slide')
    const totalState = store.getState('total_slides')

    // Type guard for slide numbers
    if (typeof currentState !== 'number' || typeof totalState !== 'number') {
      return false
    }

    const current = currentState
    const total = totalState

    // Validate slide index
    let validIndex = slideIndex
    if (validIndex < 0) {
      validIndex = 0
    } else if (validIndex >= total) {
      validIndex = total - 1
    }

    if (validIndex !== current && total > 0) {
      // Update navigation history
      store.updateState('navigation_history', (history: number[]) => {
        const newHistory = [...(Array.isArray(history) ? history : []), current]
        if (newHistory.length > 20) {
          newHistory.shift() // Keep only last 20
        }
        return newHistory
      })

      // Update current slide
      store.setState('current_slide', validIndex)
      return true
    }

    return false
  }

  const goBack = (): boolean => {
    if (typeof store.getState !== 'function' || typeof store.setState !== 'function') {
      return false
    }

    const historyState = store.getState('navigation_history')
    if (!Array.isArray(historyState)) {
      return false
    }
    const history = historyState
    if (Array.isArray(history) && history.length > 0) {
      const previousSlide = history.pop()
      if (typeof previousSlide === 'number') {
        store.setState('navigation_history', history)
        store.setState('current_slide', previousSlide)
        return true
      }
    }
    return false
  }

  const toggleFullscreen = (): void => {
    if (typeof store.updateState === 'function') {
      store.updateState('is_fullscreen', (current: boolean) => !current)
    }
  }

  const setTheme = (themeName: string): boolean => {
    const validThemes = ['default', 'dark', 'light', 'high-contrast']
    if (validThemes.includes(themeName) && typeof store.setState === 'function') {
      store.setState('theme', themeName)
      return true
    }
    return false
  }

  const presentationState: PresentationState = {
    get: store.getState,
    set: store.setState,
    update: store.updateState,
    subscribe: store.subscribe,
    navigateToSlide,
    goBack,
    toggleFullscreen,
    setTheme,
  }

  // Validate against schema
  PresentationStateSchema.parse(presentationState)

  return presentationState
}

// Create Event Coordinator wrapper
export const createEventCoordinatorWrapper = (): EventCoordinator => {
  const eventBus = createEventBus()

  const initialize = (config: unknown): void => {
    // Basic initialization - in a full implementation this would
    // set up all event handlers, navigation, touch, keyboard, etc.
    if (config && typeof config === 'object') {
      console.log('Event coordinator initialized with config:', config)
    }
  }

  const navigateTo = (slideIndex: number): boolean => {
    if (typeof slideIndex === 'number' && slideIndex >= 0 && typeof eventBus.emit === 'function') {
      eventBus.emit('navigation:goto', { slide: slideIndex })
      return true
    }
    return false
  }

  const toggleFullscreen = (): void => {
    if (typeof eventBus.emit === 'function') {
      eventBus.emit('fullscreen:toggle')
    }
  }

  const eventCoordinator: EventCoordinator = {
    initialize,
    on: eventBus.on,
    off: eventBus.off,
    emit: eventBus.emit,
    navigateTo,
    toggleFullscreen,
  }

  // Validate against schema
  EventCoordinatorSchema.parse(eventCoordinator)

  return eventCoordinator
}

// Create Integrated Pipeline
export const createIntegratedPipeline = (): Pipeline => {
  const registry = createGlobalRegistry()
  const state = createPresentationStateWrapper()
  const events = createEventCoordinatorWrapper()
  const containerSystem = createContainerQuery()

  const coordinator = createPipelineCoordinator(registry, state, events, containerSystem)

  const integratedPipeline: Pipeline = {
    process: coordinator.process,
    registry,
    state,
    events,
  }

  // Validate the complete pipeline against schema
  PipelineSchema.parse(integratedPipeline)

  return integratedPipeline
}

// Export types for convenience
export type { PipelineCoordinator, Pipeline }
