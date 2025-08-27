import { z } from 'zod'
import { ValidationResultSchema, AbstractionErrorSchema } from './common'

// CLI Command Schema
export const CLICommandSchema = z.enum([
  'build',
  'serve',
  'watch',
  'export',
  'validate'
])

// Base CLI Options Schema
export const CLIOptionsSchema = z.object({
  command: CLICommandSchema,
  input: z.string().min(1),
  output: z.string().optional(),
  parser: z.string().default('curtains'),
  transformer: z.string().default('html'),
  renderer: z.string().default('html'),
  theme: z.enum(['light', 'dark', 'auto']).default('light'),
  plugins: z.array(z.string()).default([]),
  verbose: z.boolean().default(false),
  debug: z.boolean().default(false),
  help: z.boolean().default(false),
  version: z.boolean().default(false)
})

// Build Command Options Schema
export const BuildOptionsSchema = CLIOptionsSchema.extend({
  command: z.literal('build'),
  minify: z.boolean().default(false),
  sourceMaps: z.boolean().default(false),
  watch: z.boolean().default(false),
  serve: z.boolean().default(false)
})

// Serve Command Options Schema
export const ServeOptionsSchema = CLIOptionsSchema.extend({
  command: z.literal('serve'),
  port: z.number().min(1).max(65535).default(3000),
  host: z.string().default('localhost'),
  open: z.boolean().default(true),
  liveReload: z.boolean().default(true),
  cors: z.boolean().default(true),
  https: z.boolean().default(false),
  cert: z.string().optional(),
  key: z.string().optional()
})

// Watch Command Options Schema
export const WatchOptionsSchema = CLIOptionsSchema.extend({
  command: z.literal('watch'),
  pattern: z.string().default('**/*.{curtain,md}'),
  ignore: z.array(z.string()).default(['node_modules/**', 'dist/**']),
  debounce: z.number().nonnegative().default(250),
  recursive: z.boolean().default(true)
})

// Export Command Options Schema
export const ExportOptionsSchema = CLIOptionsSchema.extend({
  command: z.literal('export'),
  format: z.enum(['pdf', 'images', 'static']).default('pdf'),
  quality: z.number().min(1).max(100).default(90),
  width: z.number().positive().default(1920),
  height: z.number().positive().default(1080),
  outputDir: z.string().optional()
})

// Validate Command Options Schema
export const ValidateOptionsSchema = CLIOptionsSchema.extend({
  command: z.literal('validate'),
  strict: z.boolean().default(false),
  checkLinks: z.boolean().default(true),
  checkImages: z.boolean().default(true),
  format: z.enum(['text', 'json', 'junit']).default('text')
})

// CLI Configuration Schema
export const CLIConfigSchema = z.object({
  defaultParser: z.string().default('curtains'),
  defaultTransformer: z.string().default('html'),
  defaultRenderer: z.string().default('html'),
  defaultTheme: z.enum(['light', 'dark', 'auto']).default('light'),
  plugins: z.array(z.string()).default([]),
  middleware: z.array(z.unknown()).default([]),
  features: z.array(z.string()).default(['navigation', 'keyboard', 'touch', 'fullscreen']),
  build: z.object({
    outputDir: z.string().default('./dist'),
    minify: z.boolean().default(false),
    sourceMaps: z.boolean().default(false),
    clean: z.boolean().default(true)
  }).default({
    outputDir: './dist',
    minify: false,
    sourceMaps: false,
    clean: true
  }),
  serve: z.object({
    port: z.number().default(3000),
    host: z.string().default('localhost'),
    open: z.boolean().default(true),
    liveReload: z.boolean().default(true),
    cors: z.boolean().default(true)
  }).default({
    port: 3000,
    host: 'localhost',
    open: true,
    liveReload: true,
    cors: true
  }),
  watch: z.object({
    pattern: z.string().default('**/*.{curtain,md}'),
    ignore: z.array(z.string()).default(['node_modules/**', 'dist/**']),
    debounce: z.number().default(250)
  }).default({
    pattern: '**/*.{curtain,md}',
    ignore: ['node_modules/**', 'dist/**'],
    debounce: 250
  })
})

// CLI Context Schema
export const CLIContextSchema = z.object({
  command: CLICommandSchema,
  options: CLIOptionsSchema,
  config: CLIConfigSchema,
  pipeline: z.unknown(),
  startTime: z.number().positive(),
  errors: z.array(AbstractionErrorSchema).default([]),
  warnings: z.array(z.string()).default([]),
  stats: z.object({
    filesProcessed: z.number().nonnegative().default(0),
    totalTime: z.number().nonnegative().optional(),
    buildTime: z.number().nonnegative().optional(),
    outputSize: z.number().nonnegative().optional()
  }).default({
    filesProcessed: 0
  })
})

// CLI Result Schema
export const CLIResultSchema = z.object({
  success: z.boolean(),
  exitCode: z.number().nonnegative().default(0),
  output: z.string().optional(),
  errors: z.array(AbstractionErrorSchema).default([]),
  warnings: z.array(z.string()).default([]),
  stats: z.object({
    totalTime: z.number().nonnegative(),
    filesProcessed: z.number().nonnegative(),
    outputFiles: z.array(z.string()).default([])
  })
})

// File Handler Schema
export const FileHandlerSchema = z.object({
  read: z.function({
    input: [z.string()], // file path
    output: z.promise(z.string()) // file content
  }),
  write: z.function({
    input: [z.string(), z.string()], // (file path, content)
    output: z.promise(z.void())
  }),
  exists: z.function({
    input: [z.string()], // file path
    output: z.promise(z.boolean())
  }),
  resolve: z.function({
    input: [z.string()], // file path
    output: z.string() // absolute path
  }),
  isDirectory: z.function({
    input: [z.string()], // path
    output: z.promise(z.boolean())
  }),
  listFiles: z.function({
    input: [z.string(), z.string().optional()], // (directory, pattern?)
    output: z.promise(z.array(z.string())) // file paths
  }),
  createDirectory: z.function({
    input: [z.string()], // directory path
    output: z.promise(z.void())
  }),
  copyFile: z.function({
    input: [z.string(), z.string()], // (source, destination)
    output: z.promise(z.void())
  }),
  deleteFile: z.function({
    input: [z.string()], // file path
    output: z.promise(z.void())
  }),
  watchFile: z.function({
    input: [z.string(), z.function({
      input: [z.string()], // changed file path
      output: z.void()
    })], // (file path, callback)
    output: z.unknown() // watcher instance
  })
})

// Server Configuration Schema
export const ServerConfigSchema = z.object({
  port: z.number().min(1).max(65535).default(3000),
  host: z.string().default('localhost'),
  https: z.boolean().default(false),
  cert: z.string().optional(),
  key: z.string().optional(),
  cors: z.boolean().default(true),
  compression: z.boolean().default(true),
  staticPaths: z.array(z.string()).default([]),
  middleware: z.array(z.unknown()).default([]),
  routes: z.record(z.string(), z.function({
    input: [z.unknown(), z.unknown()], // (request, response)
    output: z.void()
  })).default({}),
  errorHandler: z.function({
    input: [z.unknown(), z.unknown(), z.unknown()], // (error, request, response)
    output: z.void()
  }).optional(),
  webSocketEnabled: z.boolean().default(true),
  liveReload: z.boolean().default(true)
})

// Plugin Loader Schema
export const PluginLoaderSchema = z.object({
  load: z.function({
    input: [z.string()], // plugin path or name
    output: z.promise(z.unknown()) // plugin instance
  }),
  resolve: z.function({
    input: [z.string()], // plugin identifier
    output: z.string() // resolved path
  }),
  validate: z.function({
    input: [z.unknown()], // plugin instance
    output: ValidationResultSchema
  }),
  register: z.function({
    input: [z.unknown(), z.unknown()], // (plugin, registry)
    output: z.boolean() // success
  }),
  unregister: z.function({
    input: [z.string()], // plugin name
    output: z.boolean() // success
  }),
  list: z.function({
    input: [],
    output: z.array(z.object({
      name: z.string(),
      version: z.string(),
      path: z.string(),
      active: z.boolean()
    }))
  }),
  getPlugin: z.function({
    input: [z.string()], // plugin name
    output: z.unknown() // plugin instance or null
  }),
  enablePlugin: z.function({
    input: [z.string()], // plugin name
    output: z.boolean() // success
  }),
  disablePlugin: z.function({
    input: [z.string()], // plugin name
    output: z.boolean() // success
  })
})

// CLI Middleware Schema
export const CLIMiddlewareSchema = z.object({
  name: z.string(),
  phase: z.enum(['before', 'after', 'error']),
  priority: z.number().default(0),
  process: z.function({
    input: [CLIContextSchema], // context
    output: z.promise(CLIContextSchema) // modified context
  }),
  condition: z.function({
    input: [CLIContextSchema], // context
    output: z.boolean() // should run
  }).optional(),
  enabled: z.boolean().default(true)
})

// Error Handler Schema
export const ErrorHandlerSchema = z.object({
  handle: z.function({
    input: [z.unknown(), CLIContextSchema], // (error, context)
    output: CLIResultSchema
  }),
  formatError: z.function({
    input: [z.unknown()], // error
    output: z.string() // formatted message
  }),
  getExitCode: z.function({
    input: [z.unknown()], // error
    output: z.number() // exit code
  }),
  isRecoverable: z.function({
    input: [z.unknown()], // error
    output: z.boolean()
  }),
  createFallbackResult: z.function({
    input: [z.unknown(), CLIContextSchema], // (error, context)
    output: CLIResultSchema
  }),
  logError: z.function({
    input: [z.unknown(), z.boolean().optional()], // (error, verbose?)
    output: z.void()
  })
})

// Output Formatter Schema
export const OutputFormatterSchema = z.object({
  formatSuccess: z.function({
    input: [CLIResultSchema], // result
    output: z.string() // formatted output
  }),
  formatError: z.function({
    input: [CLIResultSchema], // result
    output: z.string() // formatted error
  }),
  formatWarning: z.function({
    input: [z.string()], // warning message
    output: z.string() // formatted warning
  }),
  formatStats: z.function({
    input: [z.object({
      totalTime: z.number(),
      filesProcessed: z.number(),
      outputFiles: z.array(z.string())
    })], // stats
    output: z.string() // formatted stats
  }),
  formatProgress: z.function({
    input: [z.number(), z.number(), z.string().optional()], // (current, total, message?)
    output: z.string() // progress indicator
  }),
  formatValidationResult: z.function({
    input: [ValidationResultSchema], // validation result
    output: z.string() // formatted validation
  }),
  setVerbose: z.function({
    input: [z.boolean()], // verbose mode
    output: z.void()
  }),
  enableColors: z.function({
    input: [z.boolean()], // enable colors
    output: z.void()
  })
})

// CLI Command Handler Schema
export const CLICommandHandlerSchema = z.object({
  build: z.function({
    input: [CLIContextSchema], // context
    output: z.promise(CLIResultSchema) // result
  }),
  serve: z.function({
    input: [CLIContextSchema], // context
    output: z.promise(CLIResultSchema) // result
  }),
  watch: z.function({
    input: [CLIContextSchema], // context
    output: z.promise(CLIResultSchema) // result
  }),
  export: z.function({
    input: [CLIContextSchema], // context
    output: z.promise(CLIResultSchema) // result
  }),
  validate: z.function({
    input: [CLIContextSchema], // context
    output: z.promise(CLIResultSchema) // result
  })
})

// Argument Parser Schema
export const ArgumentParserSchema = z.object({
  parse: z.function({
    input: [z.array(z.string())], // argv
    output: CLIOptionsSchema
  }),
  parseCommand: z.function({
    input: [z.array(z.string())], // argv
    output: CLICommandSchema
  }),
  parseOptions: z.function({
    input: [z.array(z.string()), CLICommandSchema], // (argv, command)
    output: CLIOptionsSchema
  }),
  showHelp: z.function({
    input: [CLICommandSchema.optional()], // command?
    output: z.string() // help text
  }),
  showVersion: z.function({
    input: [],
    output: z.string() // version info
  }),
  validateArgs: z.function({
    input: [CLIOptionsSchema], // options
    output: ValidationResultSchema
  })
})

// Configuration Loader Schema
export const ConfigLoaderSchema = z.object({
  load: z.function({
    input: [z.string().optional()], // config path?
    output: z.promise(CLIConfigSchema) // configuration
  }),
  loadFile: z.function({
    input: [z.string()], // file path
    output: z.promise(z.unknown()) // raw config
  }),
  merge: z.function({
    input: [CLIConfigSchema, z.unknown()], // (base, override)
    output: CLIConfigSchema // merged config
  }),
  validate: z.function({
    input: [z.unknown()], // raw config
    output: ValidationResultSchema
  }),
  findConfigFile: z.function({
    input: [z.string().optional()], // start directory?
    output: z.promise(z.string()) // config file path or null
  }),
  getDefaultConfig: z.function({
    input: [],
    output: CLIConfigSchema
  }),
  save: z.function({
    input: [CLIConfigSchema, z.string()], // (config, file path)
    output: z.promise(z.void())
  })
})

// Pipeline Manager Schema
export const PipelineManagerSchema = z.object({
  initialize: z.function({
    input: [CLIConfigSchema], // config
    output: z.promise(z.unknown()) // initialized pipeline
  }),
  process: z.function({
    input: [z.string(), CLIOptionsSchema], // (input, options)
    output: z.promise(z.string()) // output HTML
  }),
  registerAdapters: z.function({
    input: [z.unknown()], // pipeline
    output: z.void()
  }),
  loadPlugins: z.function({
    input: [z.unknown(), z.array(z.string())], // (pipeline, plugin paths)
    output: z.promise(z.number()) // loaded count
  }),
  validatePipeline: z.function({
    input: [z.unknown()], // pipeline
    output: ValidationResultSchema
  }),
  reset: z.function({
    input: [],
    output: z.void()
  })
})

// Watch Manager Schema
export const WatchManagerSchema = z.object({
  start: z.function({
    input: [WatchOptionsSchema, z.function({
      input: [z.string()], // changed file path
      output: z.promise(z.void())
    })], // (options, callback)
    output: z.promise(z.unknown()) // watcher instance
  }),
  stop: z.function({
    input: [z.unknown()], // watcher instance
    output: z.promise(z.void())
  }),
  add: z.function({
    input: [z.unknown(), z.string()], // (watcher, file path)
    output: z.void()
  }),
  remove: z.function({
    input: [z.unknown(), z.string()], // (watcher, file path)
    output: z.void()
  }),
  isWatching: z.function({
    input: [z.unknown(), z.string()], // (watcher, file path)
    output: z.boolean()
  }),
  getWatchedFiles: z.function({
    input: [z.unknown()], // watcher
    output: z.array(z.string()) // file paths
  })
})

// Type Exports
export type CLICommand = z.infer<typeof CLICommandSchema>
export type CLIOptions = z.infer<typeof CLIOptionsSchema>
export type BuildOptions = z.infer<typeof BuildOptionsSchema>
export type ServeOptions = z.infer<typeof ServeOptionsSchema>
export type WatchOptions = z.infer<typeof WatchOptionsSchema>
export type ExportOptions = z.infer<typeof ExportOptionsSchema>
export type ValidateOptions = z.infer<typeof ValidateOptionsSchema>
export type CLIConfig = z.infer<typeof CLIConfigSchema>
export type CLIContext = z.infer<typeof CLIContextSchema>
export type CLIResult = z.infer<typeof CLIResultSchema>
export type FileHandler = z.infer<typeof FileHandlerSchema>
export type ServerConfig = z.infer<typeof ServerConfigSchema>
export type PluginLoader = z.infer<typeof PluginLoaderSchema>
export type CLIMiddleware = z.infer<typeof CLIMiddlewareSchema>
export type ErrorHandler = z.infer<typeof ErrorHandlerSchema>
export type OutputFormatter = z.infer<typeof OutputFormatterSchema>
export type CLICommandHandler = z.infer<typeof CLICommandHandlerSchema>
export type ArgumentParser = z.infer<typeof ArgumentParserSchema>
export type ConfigLoader = z.infer<typeof ConfigLoaderSchema>
export type PipelineManager = z.infer<typeof PipelineManagerSchema>
export type WatchManager = z.infer<typeof WatchManagerSchema>
