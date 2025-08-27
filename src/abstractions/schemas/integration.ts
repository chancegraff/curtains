import { z } from 'zod'
import { MiddlewareSchema, ValidationResultSchema } from './common'
import { RendererInterfaceSchema } from './rendering'
import { EventCoordinatorSchema } from './events'
import { PresentationStateSchema } from './state'
import { ContainerQuerySchema } from './containers'
import {
  BaseParserInterfaceSchema,
  ParserPluginManagerSchema,
  ParserValidatorSchema
} from './parsers'
import {
  BaseTransformerSchema,
  TransformationPipelineSchema,
  VisitorRegistrySchema
} from './transformers'
import {
  CLICommandHandlerSchema
} from './cli'
import { PluginInterfaceSchema } from './plugins'

// Enhanced Parser Interface Schema - uses comprehensive parsers.ts schemas
export const ParserInterfaceSchema = BaseParserInterfaceSchema.extend({
  pluginManager: ParserPluginManagerSchema.optional(),
  validator: ParserValidatorSchema.optional()
})

// Enhanced Transformer Interface Schema - uses comprehensive transformers.ts schemas
export const TransformerInterfaceSchema = BaseTransformerSchema.extend({
  pipeline: TransformationPipelineSchema.optional(),
  visitors: VisitorRegistrySchema.optional()
})

// Enhanced Adapter Registry Schema with plugin support
export const AdapterRegistrySchema = z.object({
  parsers: z.record(z.string(), ParserInterfaceSchema),
  transformers: z.record(z.string(), TransformerInterfaceSchema),
  renderers: z.record(z.string(), RendererInterfaceSchema),
  middleware: z.array(MiddlewareSchema),
  plugins: z.record(z.string(), z.unknown()).optional(), // Use unknown to avoid circular reference
  cli: z.record(z.string(), CLICommandHandlerSchema).optional()
})

// Enhanced Global Registry Schema with comprehensive plugin and CLI support
export const GlobalRegistrySchema = z.object({
  registerParser: z.function({
    input: [z.string(), z.unknown()], // (name, parser)
    output: z.boolean() // success
  }),
  registerTransformer: z.function({
    input: [z.string(), z.unknown()], // (name, transformer)
    output: z.boolean() // success
  }),
  registerRenderer: z.function({
    input: [z.string(), z.unknown()], // (name, renderer)
    output: z.boolean() // success
  }),
  registerPlugin: z.function({
    input: [z.string(), z.unknown()], // (name, plugin)
    output: z.boolean() // success
  }),
  registerCLICommand: z.function({
    input: [z.string(), z.function()], // (command, handler)
    output: z.boolean() // success
  }),
  getAdapter: z.function({
    input: [z.string(), z.string()], // (type, name)
    output: z.unknown() // adapter or null
  }),
  getPlugin: z.function({
    input: [z.string()], // plugin name
    output: z.unknown() // plugin or null
  }),
  getCLICommand: z.function({
    input: [z.string()], // command name
    output: z.function().optional() // command handler or null
  }),
  addMiddleware: z.function({
    input: [z.unknown()], // middleware
    output: z.void()
  }),
  getMiddleware: z.function({
    input: [],
    output: z.array(z.unknown()) // middleware array
  }),
  listAdapters: z.function({
    input: [z.string().optional()], // type filter
    output: z.array(z.string()) // adapter names
  }),
  listPlugins: z.function({
    input: [],
    output: z.array(z.string()) // plugin names
  }),
  listCLICommands: z.function({
    input: [],
    output: z.array(z.string()) // command names
  }),
  validateRegistration: z.function({
    input: [z.string(), z.unknown()], // (type, adapter)
    output: ValidationResultSchema
  })
})

// Pipeline Phase Schema
export const PipelinePhaseSchema = z.enum([
  'parse',
  'transform',
  'render',
  'finalize'
])

// Pipeline Coordinator Schema
export const PipelineCoordinatorSchema = z.object({
  registry: GlobalRegistrySchema,
  stateManager: PresentationStateSchema,
  eventCoordinator: EventCoordinatorSchema,
  containerSystem: ContainerQuerySchema,
  process: z.function({
    input: [z.string(), z.unknown().optional()], // (input, options?)
    output: z.unknown() // pipeline result
  }),
  parsePhase: z.function({
    input: [z.unknown(), z.unknown()], // (context, registry)
    output: z.unknown() // updated context
  }),
  transformPhase: z.function({
    input: [z.unknown(), z.unknown()], // (context, registry)
    output: z.unknown() // updated context
  }),
  renderPhase: z.function({
    input: [z.unknown(), z.unknown()], // (context, registry)
    output: z.unknown() // updated context
  }),
  finalizePhase: z.function({
    input: [z.unknown()], // context
    output: z.unknown() // finalized context
  }),
})

// Pipeline Schema
export const PipelineSchema = z.object({
  process: z.function({
    input: [z.string(), z.unknown().optional()], // (input, options?)
    output: z.unknown() // pipeline result
  }),
  registry: GlobalRegistrySchema,
  state: PresentationStateSchema,
  events: EventCoordinatorSchema,
})

// Adapter Wrapper Schema - using imported schemas from their proper domain files

// System Initialization Schema
export const SystemConfigSchema = z.object({
  defaultParser: z.string().default('default'),
  defaultTransformer: z.string().default('default'),
  defaultRenderer: z.string().default('default'),
  enableMiddlewareLogging: z.boolean().default(false),
  enablePerformanceMonitoring: z.boolean().default(false),
  maxPipelineTimeout: z.number().default(30000),
})

export const SystemInitializationSchema = z.object({
  pipeline: PipelineSchema,
  config: SystemConfigSchema,
  initialize: z.function({
    input: [z.unknown()], // pipeline
    output: z.void()
  }),
  registerDefaults: z.function({
    input: [z.unknown()], // registry
    output: z.void()
  }),
  setupErrorHandling: z.function({
    input: [z.unknown()], // pipeline
    output: z.void()
  }),
  loadPlugins: z.function({
    input: [z.unknown()], // pipeline
    output: z.void()
  }),
})

// Migration Wrapper Schema
export const MigrationWrapperSchema = z.object({
  legacyParse: z.function({
    input: [z.string()], // input
    output: z.string() // output HTML
  }),
  modernProcess: z.function({
    input: [z.string(), z.unknown().optional()], // (input, options?)
    output: z.unknown() // pipeline result
  }),
  registry: GlobalRegistrySchema,
  state: PresentationStateSchema,
  events: EventCoordinatorSchema,
})

// Performance Monitor Schema
export const PerformanceMetricsSchema = z.object({
  parseTimes: z.array(z.number()),
  transformTimes: z.array(z.number()),
  renderTimes: z.array(z.number()),
  totalTimes: z.array(z.number()),
})

export const PerformanceMonitorSchema = z.object({
  metrics: PerformanceMetricsSchema,
  record: z.function({
    input: [z.string(), z.number()], // (phase, duration)
    output: z.void()
  }),
  getAverage: z.function({
    input: [z.string()], // phase
    output: z.number()
  }),
  getP50: z.function({
    input: [z.string()], // phase
    output: z.number()
  }),
  getP95: z.function({
    input: [z.string()], // phase
    output: z.number()
  }),
  getP99: z.function({
    input: [z.string()], // phase
    output: z.number()
  }),
})

// Error Recovery Schema
export const ErrorRecoverySchema = z.object({
  parse: z.function({
    input: [z.unknown(), z.string()], // (error, input)
    output: z.unknown() // recovered AST
  }),
  transform: z.function({
    input: [z.unknown(), z.unknown()], // (error, AST)
    output: z.unknown() // recovered document
  }),
  render: z.function({
    input: [z.unknown(), z.unknown()], // (error, document)
    output: z.string() // fallback HTML
  }),
  createFallbackOutput: z.function({
    input: [z.string()], // error message
    output: z.string() // fallback HTML
  }),
})

// Plugin System Schema
export const PluginMetadataSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  dependencies: z.array(z.string()).default([]),
  entryPoint: z.string(),
})


export const PluginManagerSchema = z.object({
  plugins: z.array(PluginInterfaceSchema),
  loadPlugin: z.function({
    input: [z.string()], // plugin path
    output: z.boolean() // success
  }),
  unloadPlugin: z.function({
    input: [z.string()], // plugin name
    output: z.boolean() // success
  }),
  listPlugins: z.function({
    input: [],
    output: z.array(z.string()) // plugin names
  }),
  getPlugin: z.function({
    input: [z.string()], // plugin name
    output: z.unknown() // plugin or null
  }),
})

// Adapter Discovery Schema
export const AdapterDiscoverySchema = z.object({
  scanDirectory: z.function({
    input: [z.string()], // directory path
    output: z.array(z.string()) // found adapter paths
  }),
  autoRegister: z.function({
    input: [z.unknown(), z.array(z.string())], // (registry, adapterPaths)
    output: z.number() // number registered
  }),
  validateAdapter: z.function({
    input: [z.unknown()], // adapter
    output: z.boolean() // is valid
  }),
  loadAdapter: z.function({
    input: [z.string()], // adapter path
    output: z.unknown() // loaded adapter
  }),
})

// Configuration Validation Schema
export const ConfigValidationSchema = z.object({
  validatePipelineConfig: z.function({
    input: [z.unknown()], // config
    output: z.boolean() // is valid
  }),
  validateAdapterConfig: z.function({
    input: [z.unknown()], // config
    output: z.boolean() // is valid
  }),
  validateSystemConfig: z.function({
    input: [z.unknown()], // config
    output: z.boolean() // is valid
  }),
  getConfigSchema: z.function({
    input: [z.string()], // config type
    output: z.unknown() // schema
  }),
})

// Health Check Schema
export const HealthCheckSchema = z.object({
  checkAdapters: z.function({
    input: [z.unknown()], // registry
    output: z.unknown() // adapter status
  }),
  checkMiddleware: z.function({
    input: [z.array(z.unknown())], // middleware
    output: z.unknown() // middleware status
  }),
  checkSystem: z.function({
    input: [],
    output: z.unknown() // system status
  }),
  getHealthReport: z.function({
    input: [],
    output: z.unknown() // health report
  }),
})

export const HealthReportSchema = z.object({
  overallStatus: z.enum(['healthy', 'warning', 'error']),
  adapters: z.record(z.string(), z.object({
    status: z.enum(['available', 'error', 'missing']),
    message: z.string().optional(),
  })),
  middleware: z.array(z.object({
    name: z.string(),
    status: z.enum(['active', 'error', 'disabled']),
    message: z.string().optional(),
  })),
  system: z.object({
    memoryUsage: z.number(),
    cpuUsage: z.number().optional(),
    uptime: z.number(),
  }),
})

// Debugging and Diagnostics Schema
export const DiagnosticsSchema = z.object({
  enableDebugMode: z.function({
    input: [z.boolean()], // enabled
    output: z.void()
  }),
  capturePipelineState: z.function({
    input: [z.unknown()], // pipeline
    output: z.unknown() // state snapshot
  }),
  generateDebugReport: z.function({
    input: [],
    output: z.unknown() // debug report
  }),
  traceExecution: z.function({
    input: [z.unknown()], // pipeline
    output: z.unknown() // execution trace
  }),
})

export const DebugReportSchema = z.object({
  pipelineConfig: z.record(z.string(), z.unknown()),
  adapterStates: z.record(z.string(), z.unknown()),
  middlewareChain: z.array(z.string()),
  performanceMetrics: PerformanceMetricsSchema,
  errorHistory: z.array(z.unknown()),
  timestamp: z.number(),
})

// Type Exports
export type ParserInterface = z.infer<typeof ParserInterfaceSchema>
export type TransformerInterface = z.infer<typeof TransformerInterfaceSchema>
export type AdapterRegistry = z.infer<typeof AdapterRegistrySchema>
export type GlobalRegistry = z.infer<typeof GlobalRegistrySchema>
export type PipelinePhase = z.infer<typeof PipelinePhaseSchema>
export type PipelineCoordinator = z.infer<typeof PipelineCoordinatorSchema>
export type Pipeline = z.infer<typeof PipelineSchema>
export type SystemConfig = z.infer<typeof SystemConfigSchema>
export type SystemInitialization = z.infer<typeof SystemInitializationSchema>
export type MigrationWrapper = z.infer<typeof MigrationWrapperSchema>
export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>
export type PerformanceMonitor = z.infer<typeof PerformanceMonitorSchema>
export type ErrorRecovery = z.infer<typeof ErrorRecoverySchema>
export type PluginMetadata = z.infer<typeof PluginMetadataSchema>
export type PluginManager = z.infer<typeof PluginManagerSchema>
export type AdapterDiscovery = z.infer<typeof AdapterDiscoverySchema>
export type ConfigValidation = z.infer<typeof ConfigValidationSchema>
export type HealthCheck = z.infer<typeof HealthCheckSchema>
export type HealthReport = z.infer<typeof HealthReportSchema>
export type Diagnostics = z.infer<typeof DiagnosticsSchema>
export type DebugReport = z.infer<typeof DebugReportSchema>
