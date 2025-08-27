import { z } from 'zod'
import { ValidationResultSchema, AbstractionErrorSchema } from './common'
import { ASTNodeTypeSchema } from './parsers'
import { TransformResultSchema } from './transformers'

// Plugin Version Schema
export const PluginVersionSchema = z.object({
  major: z.number().nonnegative(),
  minor: z.number().nonnegative(),
  patch: z.number().nonnegative(),
  prerelease: z.string().optional(),
  build: z.string().optional(),
  version: z.string(),
  satisfies: z.function({
    input: [z.string()], // semver range
    output: z.boolean() // matches range
  }),
  compare: z.function({
    input: [z.unknown()], // other version
    output: z.number() // -1, 0, 1
  }),
  isStable: z.function({
    input: [],
    output: z.boolean()
  })
})

// Plugin Dependency Schema
export const PluginDependencySchema = z.object({
  name: z.string(),
  version: z.string(), // semver range
  required: z.boolean().default(true),
  optional: z.boolean().default(false),
  development: z.boolean().default(false),
  peer: z.boolean().default(false),
  type: z.enum(['plugin', 'npm', 'system']).default('plugin'),
  source: z.string().optional(),
  constraints: z.record(z.string(), z.unknown()).default({})
})

// Plugin Capabilities Schema
export const PluginCapabilitiesSchema = z.object({
  parsers: z.boolean().default(false),
  transformers: z.boolean().default(false),
  renderers: z.boolean().default(false),
  cli: z.boolean().default(false),
  hooks: z.boolean().default(false),
  middleware: z.boolean().default(false),
  events: z.boolean().default(false),
  lifecycle: z.boolean().default(false),
  configuration: z.boolean().default(false),
  themes: z.boolean().default(false),
  custom: z.record(z.string(), z.boolean()).default({})
})

// Plugin Configuration Schema
export const PluginConfigSchema = z.object({
  enabled: z.boolean().default(true),
  priority: z.number().default(0),
  options: z.record(z.string(), z.unknown()).default({}),
  environment: z.enum(['development', 'production', 'test']).optional(),
  conditions: z.object({
    nodeVersion: z.string().optional(),
    platforms: z.array(z.string()).optional(),
    features: z.array(z.string()).optional()
  }).optional(),
  overrides: z.record(z.string(), z.unknown()).default({})
})

// Plugin Manifest Schema
export const PluginManifestSchema = z.object({
  name: z.string(),
  version: PluginVersionSchema,
  description: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  author: z.object({
    name: z.string(),
    email: z.string().optional(),
    url: z.string().optional()
  }).optional(),
  contributors: z.array(z.object({
    name: z.string(),
    email: z.string().optional(),
    url: z.string().optional()
  })).default([]),
  license: z.string().optional(),
  homepage: z.string().optional(),
  repository: z.object({
    type: z.string(),
    url: z.string(),
    directory: z.string().optional()
  }).optional(),
  bugs: z.string().optional(),
  main: z.string(),
  types: z.string().optional(),
  exports: z.record(z.string(), z.string()).optional(),
  dependencies: z.array(PluginDependencySchema).default([]),
  peerDependencies: z.array(PluginDependencySchema).default([]),
  optionalDependencies: z.array(PluginDependencySchema).default([]),
  devDependencies: z.array(PluginDependencySchema).default([]),
  capabilities: PluginCapabilitiesSchema,
  configuration: PluginConfigSchema.optional(),
  engines: z.object({
    node: z.string().optional(),
    curtains: z.string().optional()
  }).optional(),
  os: z.array(z.string()).optional(),
  cpu: z.array(z.string()).optional(),
  publishConfig: z.record(z.string(), z.unknown()).optional(),
  private: z.boolean().default(false)
})

// Plugin Event Schema
export const PluginEventSchema = z.object({
  name: z.string(),
  phase: z.enum(['before', 'after', 'error', 'complete']),
  target: z.enum(['parser', 'transformer', 'renderer', 'cli', 'system', 'plugin']),
  data: z.unknown(),
  timestamp: z.number(),
  source: z.string(), // plugin name
  propagate: z.boolean().default(true),
  cancellable: z.boolean().default(false),
  cancelled: z.boolean().default(false),
  preventDefault: z.function({
    input: [],
    output: z.void()
  }),
  stopPropagation: z.function({
    input: [],
    output: z.void()
  })
})

// Plugin Context Schema
export const PluginContextSchema = z.object({
  plugin: PluginManifestSchema,
  registry: z.unknown(), // plugin registry
  config: z.record(z.string(), z.unknown()),
  environment: z.enum(['development', 'production', 'test']),
  logger: z.object({
    debug: z.function({
      input: [z.string(), z.unknown().optional()],
      output: z.void()
    }),
    info: z.function({
      input: [z.string(), z.unknown().optional()],
      output: z.void()
    }),
    warn: z.function({
      input: [z.string(), z.unknown().optional()],
      output: z.void()
    }),
    error: z.function({
      input: [z.string(), z.unknown().optional()],
      output: z.void()
    })
  }),
  emit: z.function({
    input: [z.string(), z.unknown()], // (event name, data)
    output: z.void()
  }),
  on: z.function({
    input: [z.string(), z.function()], // (event name, handler)
    output: z.function() // unsubscribe
  }),
  off: z.function({
    input: [z.string(), z.function().optional()], // (event name, handler?)
    output: z.void()
  }),
  getPlugin: z.function({
    input: [z.string()], // plugin name
    output: z.unknown() // plugin instance or null
  }),
  hasPlugin: z.function({
    input: [z.string()], // plugin name
    output: z.boolean()
  }),
  getDependency: z.function({
    input: [z.string()], // dependency name
    output: z.unknown() // dependency or null
  }),
  storage: z.object({
    get: z.function({
      input: [z.string()], // key
      output: z.unknown() // value or null
    }),
    set: z.function({
      input: [z.string(), z.unknown()], // (key, value)
      output: z.void()
    }),
    delete: z.function({
      input: [z.string()], // key
      output: z.boolean() // existed
    }),
    clear: z.function({
      input: [],
      output: z.void()
    })
  })
})

// Plugin API Schema
export const PluginAPISchema = z.object({
  version: z.string(),
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
  registerMiddleware: z.function({
    input: [z.unknown()], // middleware
    output: z.boolean() // success
  }),
  registerHook: z.function({
    input: [z.string(), z.function()], // (hook name, handler)
    output: z.boolean() // success
  }),
  unregisterHook: z.function({
    input: [z.string(), z.function()], // (hook name, handler)
    output: z.boolean() // success
  }),
  emit: z.function({
    input: [z.string(), z.unknown()], // (event name, data)
    output: z.void()
  }),
  on: z.function({
    input: [z.string(), z.function()], // (event name, handler)
    output: z.function() // unsubscribe
  }),
  getConfig: z.function({
    input: [z.string()], // key path
    output: z.unknown() // config value
  }),
  setConfig: z.function({
    input: [z.string(), z.unknown()], // (key path, value)
    output: z.void()
  }),
  getLogger: z.function({
    input: [z.string()], // namespace
    output: z.object({
      debug: z.function({
        input: [z.string(), z.unknown().optional()],
        output: z.void()
      }),
      info: z.function({
        input: [z.string(), z.unknown().optional()],
        output: z.void()
      }),
      warn: z.function({
        input: [z.string(), z.unknown().optional()],
        output: z.void()
      }),
      error: z.function({
        input: [z.string(), z.unknown().optional()],
        output: z.void()
      })
    })
  }),
  addTheme: z.function({
    input: [z.string(), z.object({
      name: z.string(),
      css: z.string(),
      variables: z.record(z.string(), z.string()).optional()
    })], // (theme name, theme data)
    output: z.boolean() // success
  }),
  getTheme: z.function({
    input: [z.string()], // theme name
    output: z.unknown() // theme data or null
  }),
  listThemes: z.function({
    input: [],
    output: z.array(z.string()) // theme names
  })
})

// Plugin Lifecycle Schema
export const PluginLifecycleSchema = z.object({
  initialize: z.function({
    input: [PluginContextSchema], // context
    output: z.promise(z.void())
  }),
  activate: z.function({
    input: [PluginContextSchema], // context
    output: z.promise(z.void())
  }),
  deactivate: z.function({
    input: [PluginContextSchema], // context
    output: z.promise(z.void())
  }),
  cleanup: z.function({
    input: [PluginContextSchema], // context
    output: z.promise(z.void())
  }),
  configure: z.function({
    input: [z.unknown(), PluginContextSchema], // (config, context)
    output: z.promise(z.void())
  }).optional(),
  validate: z.function({
    input: [PluginContextSchema], // context
    output: z.promise(ValidationResultSchema)
  }).optional(),
  healthCheck: z.function({
    input: [PluginContextSchema], // context
    output: z.promise(z.object({
      healthy: z.boolean(),
      message: z.string().optional(),
      details: z.record(z.string(), z.unknown()).optional()
    }))
  }).optional()
})

// Plugin Hooks Schema
export const PluginHooksSchema = z.object({
  beforeParse: z.function({
    input: [z.string(), z.unknown()], // (input, context)
    output: z.promise(z.string()) // modified input
  }).optional(),
  afterParse: z.function({
    input: [z.unknown(), z.unknown()], // (ast, context)
    output: z.promise(z.unknown()) // modified ast
  }).optional(),
  beforeTransform: z.function({
    input: [z.unknown(), z.unknown()], // (ast, context)
    output: z.promise(z.unknown()) // modified ast
  }).optional(),
  afterTransform: z.function({
    input: [z.unknown(), z.unknown()], // (document, context)
    output: z.promise(z.unknown()) // modified document
  }).optional(),
  beforeRender: z.function({
    input: [z.unknown(), z.unknown()], // (document, context)
    output: z.promise(z.unknown()) // modified document
  }).optional(),
  afterRender: z.function({
    input: [z.string(), z.unknown()], // (html, context)
    output: z.promise(z.string()) // modified html
  }).optional(),
  onError: z.function({
    input: [AbstractionErrorSchema, z.unknown()], // (error, context)
    output: z.promise(z.boolean()) // handled
  }).optional(),
  onWarning: z.function({
    input: [z.string(), z.unknown()], // (warning, context)
    output: z.promise(z.void())
  }).optional()
})

// Parser Plugin Hooks Schema
export const ParserPluginHooksSchema = z.object({
  beforeTokenize: z.function({
    input: [z.string(), z.unknown()], // (input, context)
    output: z.promise(z.string()) // modified input
  }).optional(),
  afterTokenize: z.function({
    input: [z.array(z.unknown()), z.unknown()], // (tokens, context)
    output: z.promise(z.array(z.unknown())) // modified tokens
  }).optional(),
  beforeParseNode: z.function({
    input: [z.unknown(), z.unknown()], // (token, context)
    output: z.promise(z.unknown()) // modified token
  }).optional(),
  afterParseNode: z.function({
    input: [z.unknown(), z.unknown()], // (node, context)
    output: z.promise(z.unknown()) // modified node
  }).optional(),
  beforeValidate: z.function({
    input: [z.unknown(), z.unknown()], // (ast, context)
    output: z.promise(z.unknown()) // modified ast
  }).optional(),
  afterValidate: z.function({
    input: [ValidationResultSchema, z.unknown()], // (result, context)
    output: z.promise(ValidationResultSchema) // modified result
  }).optional(),
  onParseError: z.function({
    input: [AbstractionErrorSchema, z.unknown()], // (error, context)
    output: z.promise(z.boolean()) // handled
  }).optional(),
  customNodeHandler: z.function({
    input: [z.string(), z.unknown(), z.unknown()], // (nodeType, data, context)
    output: z.promise(z.unknown()) // parsed node
  }).optional()
})

// Transformer Plugin Hooks Schema
export const TransformerPluginHooksSchema = z.object({
  beforeVisitNode: z.function({
    input: [z.unknown(), z.unknown()], // (node, context)
    output: z.promise(z.unknown()) // modified node
  }).optional(),
  afterVisitNode: z.function({
    input: [z.string(), z.unknown(), z.unknown()], // (html, node, context)
    output: z.promise(z.string()) // modified html
  }).optional(),
  beforeProcessSlide: z.function({
    input: [z.unknown(), z.unknown()], // (slide, context)
    output: z.promise(z.unknown()) // modified slide
  }).optional(),
  afterProcessSlide: z.function({
    input: [TransformResultSchema, z.unknown()], // (result, context)
    output: z.promise(TransformResultSchema) // modified result
  }).optional(),
  beforeStyleProcessing: z.function({
    input: [z.string(), z.unknown()], // (css, context)
    output: z.promise(z.string()) // modified css
  }).optional(),
  afterStyleProcessing: z.function({
    input: [z.string(), z.unknown()], // (css, context)
    output: z.promise(z.string()) // modified css
  }).optional(),
  customVisitor: z.function({
    input: [ASTNodeTypeSchema, z.unknown(), z.unknown()], // (nodeType, node, context)
    output: z.promise(z.string()) // html output
  }).optional(),
  onTransformError: z.function({
    input: [AbstractionErrorSchema, z.unknown()], // (error, context)
    output: z.promise(z.boolean()) // handled
  }).optional()
})

// Renderer Plugin Hooks Schema
export const RendererPluginHooksSchema = z.object({
  beforeSetup: z.function({
    input: [z.unknown(), z.unknown()], // (options, context)
    output: z.promise(z.unknown()) // modified options
  }).optional(),
  afterSetup: z.function({
    input: [z.unknown(), z.unknown()], // (renderer, context)
    output: z.promise(z.void())
  }).optional(),
  beforeRenderSlide: z.function({
    input: [z.unknown(), z.number(), z.unknown()], // (slide, index, context)
    output: z.promise(z.unknown()) // modified slide
  }).optional(),
  afterRenderSlide: z.function({
    input: [z.string(), z.number(), z.unknown()], // (html, index, context)
    output: z.promise(z.string()) // modified html
  }).optional(),
  beforeNavigation: z.function({
    input: [z.number(), z.number(), z.unknown()], // (from, to, context)
    output: z.promise(z.boolean()) // allow navigation
  }).optional(),
  afterNavigation: z.function({
    input: [z.number(), z.number(), z.unknown()], // (from, to, context)
    output: z.promise(z.void())
  }).optional(),
  beforeFullscreen: z.function({
    input: [z.boolean(), z.unknown()], // (entering, context)
    output: z.promise(z.boolean()) // allow
  }).optional(),
  afterFullscreen: z.function({
    input: [z.boolean(), z.unknown()], // (entering, context)
    output: z.promise(z.void())
  }).optional(),
  onKeyPress: z.function({
    input: [z.object({
      key: z.string(),
      code: z.string(),
      ctrlKey: z.boolean(),
      shiftKey: z.boolean(),
      altKey: z.boolean(),
      metaKey: z.boolean()
    }), z.unknown()], // (event, context)
    output: z.promise(z.boolean()) // handled
  }).optional(),
  onResize: z.function({
    input: [z.object({
      width: z.number(),
      height: z.number()
    }), z.unknown()], // (size, context)
    output: z.promise(z.void())
  }).optional()
})

// CLI Plugin Hooks Schema
export const CLIPluginHooksSchema = z.object({
  beforeCommand: z.function({
    input: [z.string(), z.unknown(), z.unknown()], // (command, args, context)
    output: z.promise(z.unknown()) // modified args
  }).optional(),
  afterCommand: z.function({
    input: [z.string(), z.unknown(), z.unknown()], // (command, result, context)
    output: z.promise(z.unknown()) // modified result
  }).optional(),
  beforeBuild: z.function({
    input: [z.unknown(), z.unknown()], // (options, context)
    output: z.promise(z.unknown()) // modified options
  }).optional(),
  afterBuild: z.function({
    input: [z.unknown(), z.unknown()], // (result, context)
    output: z.promise(z.void())
  }).optional(),
  beforeServe: z.function({
    input: [z.unknown(), z.unknown()], // (server, context)
    output: z.promise(z.void())
  }).optional(),
  afterServe: z.function({
    input: [z.unknown(), z.unknown()], // (server, context)
    output: z.promise(z.void())
  }).optional(),
  beforeWatch: z.function({
    input: [z.unknown(), z.unknown()], // (watcher, context)
    output: z.promise(z.void())
  }).optional(),
  onFileChange: z.function({
    input: [z.string(), z.unknown()], // (filepath, context)
    output: z.promise(z.void())
  }).optional(),
  customCommand: z.function({
    input: [z.string(), z.unknown(), z.unknown()], // (command, args, context)
    output: z.promise(z.unknown()) // result
  }).optional()
})

// Plugin Sandbox Schema
export const PluginSandboxSchema = z.object({
  isolate: z.boolean().default(true),
  allowedModules: z.array(z.string()).default([]),
  blockedModules: z.array(z.string()).default([]),
  allowFileSystem: z.boolean().default(false),
  allowNetwork: z.boolean().default(false),
  allowChildProcess: z.boolean().default(false),
  memoryLimit: z.number().optional(),
  timeoutLimit: z.number().default(30000),
  permissions: z.object({
    read: z.array(z.string()).default([]),
    write: z.array(z.string()).default([]),
    execute: z.array(z.string()).default([])
  }).optional(),
  enforce: z.function({
    input: [z.unknown()], // plugin
    output: z.unknown() // sandboxed plugin
  }),
  validate: z.function({
    input: [z.unknown(), z.string()], // (plugin, action)
    output: z.boolean() // allowed
  }),
  monitor: z.function({
    input: [z.unknown()], // plugin
    output: z.object({
      memoryUsage: z.number(),
      cpuTime: z.number(),
      violations: z.array(z.string())
    })
  })
})

// Plugin Registry Schema
export const PluginRegistrySchema = z.object({
  plugins: z.map(z.string(), z.object({
    manifest: PluginManifestSchema,
    instance: z.unknown(),
    state: z.enum(['loading', 'active', 'inactive', 'error', 'unloading']),
    context: PluginContextSchema,
    sandbox: PluginSandboxSchema.optional(),
    loadTime: z.number(),
    activationTime: z.number().optional(),
    statistics: z.object({
      hooks: z.number().default(0),
      events: z.number().default(0),
      errors: z.number().default(0),
      warnings: z.number().default(0)
    })
  })),
  dependencies: z.map(z.string(), z.array(z.string())), // plugin -> dependencies
  dependents: z.map(z.string(), z.array(z.string())), // plugin -> dependents
  hooks: z.map(z.string(), z.array(z.object({
    plugin: z.string(),
    handler: z.function(),
    priority: z.number().default(0)
  }))),
  register: z.function({
    input: [PluginManifestSchema, z.unknown()], // (manifest, instance)
    output: z.promise(z.boolean()) // success
  }),
  unregister: z.function({
    input: [z.string()], // plugin name
    output: z.promise(z.boolean()) // success
  }),
  load: z.function({
    input: [z.string(), z.unknown().optional()], // (path, options?)
    output: z.promise(z.boolean()) // success
  }),
  unload: z.function({
    input: [z.string()], // plugin name
    output: z.promise(z.boolean()) // success
  }),
  activate: z.function({
    input: [z.string()], // plugin name
    output: z.promise(z.boolean()) // success
  }),
  deactivate: z.function({
    input: [z.string()], // plugin name
    output: z.promise(z.boolean()) // success
  }),
  get: z.function({
    input: [z.string()], // plugin name
    output: z.unknown() // plugin instance or null
  }),
  has: z.function({
    input: [z.string()], // plugin name
    output: z.boolean()
  }),
  list: z.function({
    input: [z.enum(['all', 'active', 'inactive', 'error']).optional()], // filter?
    output: z.array(z.string()) // plugin names
  }),
  getManifest: z.function({
    input: [z.string()], // plugin name
    output: PluginManifestSchema // manifest or null
  }),
  getState: z.function({
    input: [z.string()], // plugin name
    output: z.enum(['loading', 'active', 'inactive', 'error', 'unloading']) // state or null
  }),
  getDependencies: z.function({
    input: [z.string()], // plugin name
    output: z.array(z.string()) // dependency names
  }),
  getDependents: z.function({
    input: [z.string()], // plugin name
    output: z.array(z.string()) // dependent names
  }),
  resolveLoadOrder: z.function({
    input: [z.array(z.string())], // plugin names
    output: z.array(z.string()) // ordered plugin names
  }),
  validateDependencies: z.function({
    input: [z.string()], // plugin name
    output: ValidationResultSchema
  }),
  emit: z.function({
    input: [z.string(), z.unknown()], // (event name, data)
    output: z.promise(z.void())
  }),
  on: z.function({
    input: [z.string(), z.function()], // (event name, handler)
    output: z.function() // unsubscribe
  }),
  registerHook: z.function({
    input: [z.string(), z.string(), z.function(), z.number().optional()], // (hook, plugin, handler, priority?)
    output: z.boolean() // success
  }),
  unregisterHook: z.function({
    input: [z.string(), z.string(), z.function()], // (hook, plugin, handler)
    output: z.boolean() // success
  }),
  callHook: z.function({
    input: [z.string(), z.array(z.unknown())], // (hook name, args)
    output: z.promise(z.array(z.unknown())) // results
  }),
  getHookHandlers: z.function({
    input: [z.string()], // hook name
    output: z.array(z.object({
      plugin: z.string(),
      handler: z.function(),
      priority: z.number()
    }))
  }),
  getStatistics: z.function({
    input: [z.string().optional()], // plugin name?
    output: z.object({
      totalPlugins: z.number(),
      activePlugins: z.number(),
      totalHooks: z.number(),
      totalEvents: z.number(),
      totalErrors: z.number(),
      loadTime: z.number(),
      memoryUsage: z.number().optional()
    })
  }),
  healthCheck: z.function({
    input: [],
    output: z.promise(z.object({
      healthy: z.boolean(),
      plugins: z.record(z.string(), z.object({
        healthy: z.boolean(),
        message: z.string().optional(),
        details: z.record(z.string(), z.unknown()).optional()
      }))
    }))
  }),
  cleanup: z.function({
    input: [],
    output: z.promise(z.void())
  })
})

// Plugin Loader Configuration Schema
export const PluginLoaderConfigSchema = z.object({
  searchPaths: z.array(z.string()).default(['./plugins', './node_modules']),
  autoDiscovery: z.boolean().default(true),
  allowRemote: z.boolean().default(false),
  sandbox: PluginSandboxSchema.optional(),
  concurrent: z.boolean().default(true),
  maxConcurrency: z.number().positive().default(5),
  timeout: z.number().positive().default(30000),
  retries: z.number().nonnegative().default(3),
  cache: z.boolean().default(true),
  validate: z.boolean().default(true),
  strict: z.boolean().default(false),
  registry: z.object({
    url: z.string().optional(),
    auth: z.object({
      token: z.string().optional(),
      username: z.string().optional(),
      password: z.string().optional()
    }).optional(),
    cache: z.boolean().default(true)
  }).optional()
})

// Plugin Interface Schema
export const PluginInterfaceSchema = z.object({
  manifest: PluginManifestSchema,
  lifecycle: PluginLifecycleSchema,
  hooks: PluginHooksSchema,
  parserHooks: ParserPluginHooksSchema.optional(),
  transformerHooks: TransformerPluginHooksSchema.optional(),
  rendererHooks: RendererPluginHooksSchema.optional(),
  cliHooks: CLIPluginHooksSchema.optional(),
  api: PluginAPISchema,
  getCapabilities: z.function({
    input: [],
    output: PluginCapabilitiesSchema
  }),
  getConfiguration: z.function({
    input: [],
    output: PluginConfigSchema
  }),
  getManifest: z.function({
    input: [],
    output: PluginManifestSchema
  }),
  getVersion: z.function({
    input: [],
    output: PluginVersionSchema
  }),
  getDependencies: z.function({
    input: [],
    output: z.array(PluginDependencySchema)
  }),
  isActive: z.function({
    input: [],
    output: z.boolean()
  }),
  getState: z.function({
    input: [],
    output: z.enum(['loading', 'active', 'inactive', 'error', 'unloading'])
  }),
  getStatistics: z.function({
    input: [],
    output: z.object({
      hooks: z.number(),
      events: z.number(),
      errors: z.number(),
      warnings: z.number(),
      uptime: z.number(),
      memoryUsage: z.number().optional()
    })
  }),
  healthCheck: z.function({
    input: [],
    output: z.promise(z.object({
      healthy: z.boolean(),
      message: z.string().optional(),
      details: z.record(z.string(), z.unknown()).optional()
    }))
  })
})

// Type Exports
export type PluginVersion = z.infer<typeof PluginVersionSchema>
export type PluginDependency = z.infer<typeof PluginDependencySchema>
export type PluginCapabilities = z.infer<typeof PluginCapabilitiesSchema>
export type PluginConfig = z.infer<typeof PluginConfigSchema>
export type PluginManifest = z.infer<typeof PluginManifestSchema>
export type PluginEvent = z.infer<typeof PluginEventSchema>
export type PluginContext = z.infer<typeof PluginContextSchema>
export type PluginAPI = z.infer<typeof PluginAPISchema>
export type PluginLifecycle = z.infer<typeof PluginLifecycleSchema>
export type PluginHooks = z.infer<typeof PluginHooksSchema>
export type ParserPluginHooks = z.infer<typeof ParserPluginHooksSchema>
export type TransformerPluginHooks = z.infer<typeof TransformerPluginHooksSchema>
export type RendererPluginHooks = z.infer<typeof RendererPluginHooksSchema>
export type CLIPluginHooks = z.infer<typeof CLIPluginHooksSchema>
export type PluginSandbox = z.infer<typeof PluginSandboxSchema>
export type PluginRegistry = z.infer<typeof PluginRegistrySchema>
export type PluginLoaderConfig = z.infer<typeof PluginLoaderConfigSchema>
export type PluginInterface = z.infer<typeof PluginInterfaceSchema>
