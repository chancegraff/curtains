import { z } from 'zod'

// Base Schema Types
export const TimestampSchema = z.number().positive()
export const DurationSchema = z.number().nonnegative()

// Error Schemas
export const AbstractionErrorSchema = z.object({
  message: z.string(),
  code: z.string(),
  phase: z.string().optional(),
  context: z.record(z.string(), z.unknown()).optional(),
  cause: z.unknown().optional(),
  timestamp: TimestampSchema,
})

export const AdapterNotFoundErrorSchema = AbstractionErrorSchema.extend({
  code: z.literal('ADAPTER_NOT_FOUND'),
  adapterType: z.enum(['parser', 'transformer', 'renderer']),
  adapterName: z.string(),
})

export const InterfaceViolationErrorSchema = AbstractionErrorSchema.extend({
  code: z.literal('INTERFACE_VIOLATION'),
  interfaceName: z.string(),
  missingMethods: z.array(z.string()),
})

export const PipelineErrorSchema = AbstractionErrorSchema.extend({
  code: z.literal('PIPELINE_ERROR'),
  phase: z.enum(['parse', 'transform', 'render', 'finalize']),
  partialOutput: z.unknown().optional(),
})

export const ValidationErrorSchema = AbstractionErrorSchema.extend({
  code: z.literal('VALIDATION_ERROR'),
  validationErrors: z.array(z.object({
    path: z.string(),
    message: z.string(),
    value: z.unknown(),
  })),
})

// Performance Timing Schemas
export const PhaseTimingSchema = z.object({
  parse: DurationSchema.optional(),
  transform: DurationSchema.optional(),
  render: DurationSchema.optional(),
  finalize: DurationSchema.optional(),
})

export const PipelineTimingSchema = z.object({
  start: TimestampSchema,
  phases: PhaseTimingSchema,
  total: DurationSchema.optional(),
})

// Configuration Schemas
export const BaseOptionsSchema = z.object({
  debug: z.boolean().default(false),
  strict: z.boolean().default(true),
  timeout: DurationSchema.default(30000), // 30 seconds
})

export const AdapterOptionsSchema = BaseOptionsSchema.extend({
  parser: z.string().default('default'),
  transformer: z.string().default('default'),
  renderer: z.string().default('default'),
})

// Registry Schema
export const AdapterTypeSchema = z.enum(['parser', 'transformer', 'renderer'])

export const AdapterMetadataSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  capabilities: z.record(z.string(), z.unknown()),
})

// Validation Result Schema
export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()).default([]),
})

// Pipeline Context Schema
export const PipelineContextSchema = z.object({
  input: z.string(),
  options: AdapterOptionsSchema,
  errors: z.array(AbstractionErrorSchema),
  timing: PipelineTimingSchema,
  ast: z.unknown().optional(),
  transformed: z.unknown().optional(),
  output: z.string().optional(),
  partialOutput: z.string().optional(),
})

// Middleware Phase Schema
export const MiddlewarePhaseSchema = z.enum([
  'beforeParse',
  'afterParse',
  'beforeTransform',
  'afterTransform',
  'beforeRender',
  'afterRender',
  'finalize',
  '*'
])

// Middleware Schema
export const MiddlewareSchema = z.object({
  name: z.string(),
  phases: z.array(MiddlewarePhaseSchema),
  process: z.function({
    input: [z.unknown(), z.string()], // (context, phase)
    output: z.unknown() // returns modified context
  }),
})

// Result Schemas
export const SuccessResultSchema = z.object({
  success: z.literal(true),
  output: z.string(),
  timing: PipelineTimingSchema,
})

export const ErrorResultSchema = z.object({
  success: z.literal(false),
  error: AbstractionErrorSchema,
  partialOutput: z.string().optional(),
})

export const PipelineResultSchema = z.union([
  SuccessResultSchema,
  ErrorResultSchema,
])

// Type Exports
export type Timestamp = z.infer<typeof TimestampSchema>
export type Duration = z.infer<typeof DurationSchema>
export type AbstractionError = z.infer<typeof AbstractionErrorSchema>
export type AdapterNotFoundError = z.infer<typeof AdapterNotFoundErrorSchema>
export type InterfaceViolationError = z.infer<typeof InterfaceViolationErrorSchema>
export type PipelineError = z.infer<typeof PipelineErrorSchema>
export type ValidationError = z.infer<typeof ValidationErrorSchema>
export type PhaseTiming = z.infer<typeof PhaseTimingSchema>
export type PipelineTiming = z.infer<typeof PipelineTimingSchema>
export type BaseOptions = z.infer<typeof BaseOptionsSchema>
export type AdapterOptions = z.infer<typeof AdapterOptionsSchema>
export type AdapterType = z.infer<typeof AdapterTypeSchema>
export type AdapterMetadata = z.infer<typeof AdapterMetadataSchema>
export type ValidationResult = z.infer<typeof ValidationResultSchema>
export type PipelineContext = z.infer<typeof PipelineContextSchema>
export type MiddlewarePhase = z.infer<typeof MiddlewarePhaseSchema>
export type Middleware = z.infer<typeof MiddlewareSchema>
export type SuccessResult = z.infer<typeof SuccessResultSchema>
export type ErrorResult = z.infer<typeof ErrorResultSchema>
export type PipelineResult = z.infer<typeof PipelineResultSchema>