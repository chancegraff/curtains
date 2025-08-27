# Technical Specification: CLI Integration with Abstraction Layer

## Overview

Complete replacement of the existing CLI (`src/cli.ts`) to use only the abstraction layer, eliminating all direct module imports and enabling full pipeline configuration through the registry system.

## Current CLI Analysis

### Existing Implementation
```typescript
// Current direct imports
import { parse } from './parser/index.js'
import { transform } from './transformer/index.js'
import { render } from './renderer/index.js'

// Direct function calls
const document = parse(source)
const transformed = await transform(document)
const html = await render(transformed, options)
```

### Issues with Current Approach
- Direct coupling to implementation modules
- No adapter selection capability
- No plugin loading support
- Limited extensibility
- Hard-coded pipeline sequence

## New CLI Architecture

### Core Structure

```
FUNCTION main(argv)
  // Initialize abstraction layer
  LET pipeline = createIntegratedPipeline()
  
  // Setup adapters and plugins
  initializePipeline(pipeline)
  
  // Parse CLI arguments
  LET cliOptions = parseArguments(argv)
  
  // Execute command
  executeCommand(pipeline, cliOptions)
```

### Updated CLI Implementation

```
#!/usr/bin/env node

// Import only abstraction layer
import { createIntegratedPipeline } from './abstractions/integration/coordinator.js'
import { createParserAdapter } from './abstractions/parsers/adapter.js'
import { createTransformerAdapter } from './abstractions/transformers/adapter.js'
import { createRendererAdapter } from './abstractions/rendering/adapter.js'
import { z } from 'zod'

// CLI Options Schema
const CLIOptionsSchema = z.object({
  command: z.enum(['build', 'watch', 'serve', 'validate']),
  input: z.string().min(1),
  output: z.string().optional(),
  parser: z.string().default('curtains'),
  transformer: z.string().default('html'),
  renderer: z.string().default('html'),
  theme: z.enum(['light', 'dark', 'auto']).default('light'),
  plugins: z.array(z.string()).optional(),
  watch: z.boolean().default(false),
  serve: z.boolean().default(false),
  port: z.number().default(3000),
  verbose: z.boolean().default(false),
  debug: z.boolean().default(false)
})

FUNCTION initializePipeline(pipeline)
  // Register core adapters
  registerCoreAdapters(pipeline.registry)
  
  // Load configuration
  LET config = loadConfiguration()
  
  // Load plugins
  IF config.plugins THEN
    loadPlugins(pipeline.registry, config.plugins)
  
  // Setup middleware
  IF config.middleware THEN
    configureMiddleware(pipeline.registry, config.middleware)
  
  RETURN pipeline
```

### Adapter Registration

```
FUNCTION registerCoreAdapters(registry)
  // Parser adapters
  LET curtainsParser = createCurtainsParserAdapter()
  registry.registerParser('curtains', curtainsParser)
  registry.registerParser('default', curtainsParser)
  
  LET markdownParser = createMarkdownParserAdapter()
  registry.registerParser('markdown', markdownParser)
  registry.registerParser('md', markdownParser)
  registry.registerParser('commonmark', markdownParser)
  
  LET gfmParser = createGFMParserAdapter()
  registry.registerParser('gfm', gfmParser)
  
  // Transformer adapters
  LET htmlTransformer = createHTMLTransformerAdapter()
  registry.registerTransformer('html', htmlTransformer)
  registry.registerTransformer('default', htmlTransformer)
  
  LET jsonTransformer = createJSONTransformerAdapter()
  registry.registerTransformer('json', jsonTransformer)
  
  // Renderer adapters
  LET htmlRenderer = createHTMLRendererAdapter()
  registry.registerRenderer('html', htmlRenderer)
  registry.registerRenderer('default', htmlRenderer)
  
  LET pdfRenderer = createPDFRendererAdapter()
  registry.registerRenderer('pdf', pdfRenderer)
```

### Command Implementation

```
FUNCTION executeCommand(pipeline, options)
  SWITCH options.command
    CASE 'build':
      executeBuild(pipeline, options)
    CASE 'watch':
      executeWatch(pipeline, options)
    CASE 'serve':
      executeServe(pipeline, options)
    CASE 'validate':
      executeValidate(pipeline, options)
    DEFAULT:
      THROW Error(`Unknown command: ${options.command}`)

FUNCTION executeBuild(pipeline, options)
  TRY
    // Read input file
    LET input = readFile(options.input)
    
    // Configure pipeline options
    LET pipelineOptions = {
      parser: options.parser,
      transformer: options.transformer,
      renderer: options.renderer,
      theme: options.theme,
      startSlide: 0,
      features: ['navigation', 'keyboard', 'touch', 'fullscreen']
    }
    
    // Process through pipeline
    LET result = pipeline.process(input, pipelineOptions)
    
    IF result.success THEN
      // Write output
      LET outputPath = options.output || deriveOutputPath(options.input)
      writeFile(outputPath, result.output)
      
      IF options.verbose THEN
        displayBuildStats(result.timing)
      
      console.log(`✓ Built ${outputPath}`)
      
      // Start watcher if requested
      IF options.watch THEN
        startWatcher(pipeline, options, pipelineOptions)
      
      // Start server if requested
      IF options.serve THEN
        startServer(outputPath, options.port)
    ELSE
      handleBuildError(result.error, options.debug)
  
  CATCH error
    handleFatalError(error, options.debug)
```

### Plugin Loading

```
FUNCTION loadPlugins(registry, pluginList)
  FOR EACH pluginPath IN pluginList DO
    TRY
      LET plugin = loadPlugin(pluginPath)
      registerPlugin(registry, plugin)
      console.log(`✓ Loaded plugin: ${plugin.name}`)
    CATCH error
      console.warn(`Failed to load plugin ${pluginPath}:`, error.message)

FUNCTION loadPlugin(pluginPath)
  // Resolve plugin path
  LET resolvedPath = resolvePluginPath(pluginPath)
  
  // Load plugin module
  LET pluginModule = require(resolvedPath)
  
  // Validate plugin interface
  validatePlugin(pluginModule)
  
  RETURN pluginModule

FUNCTION registerPlugin(registry, plugin)
  // Register parser components
  IF plugin.parsers THEN
    FOR EACH parser IN plugin.parsers DO
      registry.registerParser(parser.name, parser.adapter)
  
  // Register transformer components
  IF plugin.transformers THEN
    FOR EACH transformer IN plugin.transformers DO
      registry.registerTransformer(transformer.name, transformer.adapter)
  
  // Register renderer components
  IF plugin.renderers THEN
    FOR EACH renderer IN plugin.renderers DO
      registry.registerRenderer(renderer.name, renderer.adapter)
  
  // Register middleware
  IF plugin.middleware THEN
    FOR EACH mw IN plugin.middleware DO
      registry.addMiddleware(mw)
```

### Configuration Loading

```
FUNCTION loadConfiguration()
  LET configPaths = [
    './curtains.config.js',
    './curtains.config.json',
    './.curtainsrc',
    './package.json'
  ]
  
  FOR EACH configPath IN configPaths DO
    IF fileExists(configPath) THEN
      RETURN loadConfigFile(configPath)
  
  // Return default configuration
  RETURN getDefaultConfiguration()

FUNCTION loadConfigFile(path)
  LET extension = getFileExtension(path)
  
  SWITCH extension
    CASE '.js':
      RETURN require(path)
    CASE '.json':
      LET content = readFile(path)
      RETURN JSON.parse(content)
    CASE 'package.json':
      LET pkg = JSON.parse(readFile(path))
      RETURN pkg.curtains || {}
    DEFAULT:
      LET content = readFile(path)
      RETURN parseConfigContent(content)

FUNCTION getDefaultConfiguration()
  RETURN {
    parser: 'curtains',
    transformer: 'html',
    renderer: 'html',
    theme: 'light',
    plugins: [],
    middleware: [],
    features: ['navigation', 'keyboard', 'touch', 'fullscreen']
  }
```

### Watch Mode Implementation

```
FUNCTION startWatcher(pipeline, cliOptions, pipelineOptions)
  LET watcher = createFileWatcher(cliOptions.input)
  LET debounceTimer = null
  
  console.log(`Watching ${cliOptions.input} for changes...`)
  
  watcher.on('change', () => {
    // Debounce rapid changes
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      rebuild(pipeline, cliOptions, pipelineOptions)
    }, 250)
  })

FUNCTION rebuild(pipeline, cliOptions, pipelineOptions)
  console.log('Rebuilding...')
  
  TRY
    LET input = readFile(cliOptions.input)
    LET result = pipeline.process(input, pipelineOptions)
    
    IF result.success THEN
      LET outputPath = cliOptions.output || deriveOutputPath(cliOptions.input)
      writeFile(outputPath, result.output)
      console.log('✓ Rebuild complete')
      
      // Notify browser if server is running
      IF serverInstance THEN
        notifyBrowserReload()
    ELSE
      console.error('✗ Rebuild failed:', result.error.message)
  
  CATCH error
    console.error('✗ Watch error:', error.message)
```

### Server Mode Implementation

```
FUNCTION startServer(htmlPath, port)
  LET server = createServer(htmlPath)
  
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
    console.log('Press Ctrl+C to stop')
  })
  
  // Store server instance for reload notifications
  serverInstance = server

FUNCTION createServer(htmlPath)
  LET express = require('express')
  LET app = express()
  
  // Serve static files
  app.use(express.static(path.dirname(htmlPath)))
  
  // Serve the presentation
  app.get('/', (req, res) => {
    res.sendFile(path.resolve(htmlPath))
  })
  
  // WebSocket for live reload
  LET wss = createWebSocketServer(app)
  
  RETURN app

FUNCTION notifyBrowserReload()
  IF serverInstance AND serverInstance.wss THEN
    serverInstance.wss.broadcast({
      type: 'reload'
    })
```

### Validation Command

```
FUNCTION executeValidate(pipeline, options)
  TRY
    // Read input
    LET input = readFile(options.input)
    
    // Get parser adapter
    LET parser = pipeline.registry.getAdapter('parser', options.parser)
    
    // Validate input
    IF parser.validate(input) THEN
      console.log('✓ Input validation passed')
      
      // Try parsing for deeper validation
      TRY
        LET ast = parser.parse(input)
        console.log('✓ Successfully parsed')
        
        IF options.verbose THEN
          displayASTStats(ast)
      
      CATCH parseError
        console.error('✗ Parse error:', parseError.message)
        process.exit(1)
    ELSE
      console.error('✗ Input validation failed')
      process.exit(1)
  
  CATCH error
    handleFatalError(error, options.debug)
```

### Error Handling

```
FUNCTION handleBuildError(error, debug)
  console.error('\n✗ Build Error\n')
  
  IF error.phase THEN
    console.error(`Phase: ${error.phase}`)
  
  console.error(`Message: ${error.message}`)
  
  IF error.context AND debug THEN
    console.error('\nContext:')
    console.error(JSON.stringify(error.context, null, 2))
  
  IF error.cause AND debug THEN
    console.error('\nCause:')
    console.error(error.cause)
  
  process.exit(1)

FUNCTION handleFatalError(error, debug)
  console.error('\n✗ Fatal Error\n')
  console.error(error.message)
  
  IF debug AND error.stack THEN
    console.error('\nStack trace:')
    console.error(error.stack)
  
  process.exit(1)
```

### Help and Version

```
FUNCTION showHelp()
  console.log(`
curtains - Extensible presentation builder

USAGE:
  curtains <command> [options]

COMMANDS:
  build <input>    Build presentation from input file
  watch <input>    Build and watch for changes
  serve <input>    Build, watch, and serve presentation
  validate <input> Validate input file syntax

OPTIONS:
  -o, --output <file>       Output file path
  -p, --parser <name>       Parser adapter (curtains|markdown|gfm)
  -t, --transformer <name>  Transformer adapter (html|json)
  -r, --renderer <name>     Renderer adapter (html|pdf)
  --theme <name>            Theme (light|dark|auto)
  --plugins <list>          Comma-separated plugin list
  --port <number>           Server port (default: 3000)
  -w, --watch              Watch for changes
  -s, --serve              Start development server
  -v, --verbose            Verbose output
  -d, --debug              Debug mode
  -h, --help               Show help
  --version                Show version

EXAMPLES:
  curtains build presentation.curtain -o output.html
  curtains serve slides.md --parser markdown --port 8080
  curtains build deck.curtain --theme dark --plugins custom-elements,syntax-highlight
`)

FUNCTION showVersion()
  LET pkg = JSON.parse(readFile('./package.json'))
  console.log(`curtains v${pkg.version}`)
```

## Testing Requirements

TEST_COVERAGE:
  - Pipeline initialization
  - Adapter registration
  - Plugin loading
  - Build command execution
  - Watch mode functionality
  - Server mode functionality
  - Validation command
  - Error handling
  - Configuration loading
  - CLI argument parsing

## Files to Update/Create

UPDATE_FILES:
  - src/cli.ts (complete rewrite)

CREATE_FILES:
  - src/abstractions/cli/commands.ts
  - src/abstractions/cli/config.ts
  - src/abstractions/cli/plugins.ts
  - src/abstractions/cli/server.ts
  - src/abstractions/cli/watcher.ts

## Dependencies to Add

NEW_DEPENDENCIES:
  - chokidar (file watching)
  - express (dev server)
  - ws (websockets for live reload)
  - commander (improved CLI parsing)

## Configuration File Format

```javascript
// curtains.config.js
module.exports = {
  parser: 'curtains',
  transformer: 'html',
  renderer: 'html',
  theme: 'dark',
  
  plugins: [
    'curtains-plugin-mermaid',
    './local-plugin.js'
  ],
  
  middleware: [
    {
      name: 'custom-processor',
      phases: ['afterParse'],
      process: (context) => {
        // Custom processing
        return context
      }
    }
  ],
  
  features: [
    'navigation',
    'keyboard',
    'touch',
    'fullscreen',
    'presenter-notes'
  ],
  
  build: {
    outputDir: './dist',
    minify: true,
    sourceMaps: false
  }
}
```