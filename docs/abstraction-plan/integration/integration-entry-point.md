# Integration - Entry Point Modifications

## CLI Entry Point Update

The CLI needs to be modified to use the new abstraction layer instead of directly calling parser, transformer, and renderer modules.

## Current CLI Structure

The existing CLI directly imports and calls:
- `parse()` from parser/index
- `transform()` from transformer/index  
- `render()` from renderer/index

## New CLI Structure

FUNCTION update_cli_entry_point()
  // Import abstraction layer
  LET { createIntegratedPipeline } = require('./abstractions/integration/coordinator')
  LET { createParserAdapter } = require('./abstractions/integration/adapters/parserAdapter')
  LET { createTransformerAdapter } = require('./abstractions/integration/adapters/transformerAdapter')
  LET { createRendererAdapter } = require('./abstractions/integration/adapters/rendererAdapter')
  
  // Create and configure pipeline
  LET pipeline = setup_pipeline()
  
  // Process command line arguments
  LET options = parse_cli_arguments(process.argv)
  
  // Execute pipeline
  execute_with_pipeline(pipeline, options)

## Pipeline Setup

FUNCTION setup_pipeline()
  // Create integrated pipeline
  LET pipeline = createIntegratedPipeline()
  
  // Register default adapters
  register_all_adapters(pipeline.registry)
  
  // Setup middleware
  configure_middleware(pipeline.registry)
  
  // Initialize plugins if configured
  load_configured_plugins(pipeline.registry)
  
  RETURN pipeline

FUNCTION register_all_adapters(registry)
  // Register parser adapters
  LET curtains_parser = createParserAdapter()
  registry.registerParser('default', curtains_parser)
  registry.registerParser('curtains', curtains_parser)
  
  // Register standard markdown parser
  LET standard_parser = createStandardMarkdownAdapter()
  registry.registerParser('markdown', standard_parser)
  registry.registerParser('commonmark', standard_parser)
  registry.registerParser('gfm', standard_parser)
  
  // Register transformer adapter
  LET transformer = createTransformerAdapter()
  registry.registerTransformer('default', transformer)
  registry.registerTransformer('curtains', transformer)
  
  // Register renderer adapters
  LET html_renderer = createRendererAdapter()
  registry.registerRenderer('default', html_renderer)
  registry.registerRenderer('html', html_renderer)
  
  // Register experimental renderers
  LET pdf_renderer = createPDFRendererAdapter()
  registry.registerRenderer('pdf', pdf_renderer)

## CLI Argument Processing

FUNCTION parse_cli_arguments(argv)
  LET commander = require('commander')
  
  LET program = commander
    .version('1.0.0')
    .description('Curtains - Markdown presentation tool')
  
  program
    .command('build <input>')
    .description('Build presentation from markdown file')
    .option('-o, --output <path>', 'Output file path', 'presentation.html')
    .option('-t, --theme <name>', 'Theme name', 'default')
    .option('-p, --parser <type>', 'Parser type (curtains|markdown|gfm)', 'curtains')
    .option('--transformer <type>', 'Transformer type', 'default')
    .option('-r, --renderer <type>', 'Renderer type (html|pdf)', 'html')
    .option('-w, --watch', 'Watch for changes')
    .option('-s, --serve', 'Start local server')
    .option('--port <number>', 'Server port', '3000')
    .option('--plugins <list>', 'Comma-separated plugin list')
    .option('--debug', 'Enable debug mode')
    .option('--validate', 'Validate output only')
    .action(handle_build_command)
  
  program
    .command('serve <input>')
    .description('Build and serve presentation')
    .option('-p, --port <number>', 'Server port', '3000')
    .option('-t, --theme <name>', 'Theme name', 'default')
    .option('--open', 'Open in browser')
    .action(handle_serve_command)
  
  program
    .command('export <input>')
    .description('Export presentation to different formats')
    .option('-f, --format <type>', 'Export format (pdf|pptx|images)', 'pdf')
    .option('-o, --output <path>', 'Output path')
    .action(handle_export_command)
  
  program
    .command('validate <input>')
    .description('Validate markdown syntax')
    .option('--parser <type>', 'Parser type', 'curtains')
    .action(handle_validate_command)
  
  program.parse(argv)
  
  RETURN program.opts()

## Command Handlers

FUNCTION handle_build_command(input_file, options, pipeline)
  TRY
    // Read input file
    LET input_content = read_file(input_file)
    
    // Configure pipeline options
    LET pipeline_options = {
      parser: options.parser,
      transformer: options.transformer,
      renderer: options.renderer,
      theme: options.theme,
      debug: options.debug,
      plugins: parse_plugins(options.plugins)
    }
    
    // Process through pipeline
    LET result = pipeline.process(input_content, pipeline_options)
    
    IF result.success THEN
      // Write output
      write_file(options.output, result.output)
      
      console.log(`✓ Presentation built: ${options.output}`)
      
      // Start watcher if requested
      IF options.watch THEN
        start_file_watcher(input_file, pipeline, pipeline_options, options.output)
      
      // Start server if requested
      IF options.serve THEN
        start_dev_server(options.output, options.port)
    ELSE
      handle_pipeline_error(result.error)
      process.exit(1)
    
  CATCH error
    console.error('Build failed:', error.message)
    IF options.debug THEN
      console.error(error.stack)
    process.exit(1)

FUNCTION handle_serve_command(input_file, options, pipeline)
  // Build the presentation
  LET build_options = {
    ...options,
    output: '.curtains/presentation.html',
    watch: true,
    serve: true
  }
  
  handle_build_command(input_file, build_options, pipeline)
  
  // Open in browser if requested
  IF options.open THEN
    open_in_browser(`http://localhost:${options.port}`)

FUNCTION handle_export_command(input_file, options, pipeline)
  // First build as HTML
  LET temp_html = '.curtains/temp.html'
  
  LET build_result = pipeline.process(
    read_file(input_file),
    { renderer: 'html' }
  )
  
  IF NOT build_result.success THEN
    handle_pipeline_error(build_result.error)
    process.exit(1)
  
  write_file(temp_html, build_result.output)
  
  // Export to requested format
  SWITCH options.format
    CASE 'pdf':
      export_to_pdf(temp_html, options.output || 'presentation.pdf')
    
    CASE 'pptx':
      export_to_pptx(temp_html, options.output || 'presentation.pptx')
    
    CASE 'images':
      export_to_images(temp_html, options.output || './slides')
    
    DEFAULT:
      console.error(`Unknown export format: ${options.format}`)
      process.exit(1)

FUNCTION handle_validate_command(input_file, options, pipeline)
  LET input_content = read_file(input_file)
  
  // Get parser from registry
  LET parser = pipeline.registry.getAdapter('parser', options.parser)
  
  IF parser.validate(input_content) THEN
    console.log('✓ Markdown syntax is valid')
    
    // Parse to check structure
    TRY
      LET ast = parser.parse(input_content)
      console.log(`✓ Parsed successfully: ${count_nodes(ast)} nodes`)
      
      IF options.debug THEN
        console.log('AST structure:', JSON.stringify(ast, null, 2))
    CATCH error
      console.error('✗ Parse error:', error.message)
      process.exit(1)
  ELSE
    console.error('✗ Invalid markdown syntax')
    process.exit(1)

## File Watching

FUNCTION start_file_watcher(input_file, pipeline, options, output_file)
  LET chokidar = require('chokidar')
  LET debounce_timeout = null
  
  console.log(`Watching ${input_file} for changes...`)
  
  LET watcher = chokidar.watch(input_file, {
    persistent: true,
    ignoreInitial: true
  })
  
  watcher.on('change', FUNCTION()
    // Debounce rapid changes
    clearTimeout(debounce_timeout)
    debounce_timeout = setTimeout(FUNCTION()
      console.log('File changed, rebuilding...')
      
      TRY
        LET input_content = read_file(input_file)
        LET result = pipeline.process(input_content, options)
        
        IF result.success THEN
          write_file(output_file, result.output)
          console.log('✓ Rebuilt successfully')
          
          // Notify connected browsers to reload
          notify_browser_reload()
        ELSE
          console.error('✗ Build failed:', result.error.message)
      CATCH error
        console.error('✗ Watch error:', error.message)
    , 250)
  )
  
  watcher.on('error', FUNCTION(error)
    console.error('Watch error:', error)
  )

## Development Server

FUNCTION start_dev_server(html_file, port)
  LET express = require('express')
  LET path = require('path')
  LET ws = require('ws')
  
  LET app = express()
  LET server = require('http').createServer(app)
  LET wss = new ws.Server({ server })
  
  // Serve static files
  app.use(express.static(path.dirname(html_file)))
  
  // Serve presentation
  app.get('/', FUNCTION(req, res)
    res.sendFile(path.resolve(html_file))
  )
  
  // WebSocket for live reload
  wss.on('connection', FUNCTION(socket)
    socket.on('message', FUNCTION(message)
      // Handle client messages
    )
  )
  
  // Store WebSocket server for reload notifications
  global.devServer = { wss }
  
  server.listen(port, FUNCTION()
    console.log(`Server running at http://localhost:${port}`)
  )

FUNCTION notify_browser_reload()
  IF global.devServer AND global.devServer.wss THEN
    global.devServer.wss.clients.forEach(FUNCTION(client)
      IF client.readyState === ws.OPEN THEN
        client.send(JSON.stringify({ type: 'reload' }))
    )

## Plugin Loading

FUNCTION load_configured_plugins(registry)
  LET plugin_dir = path.join(process.cwd(), 'curtains-plugins')
  
  IF NOT fs.existsSync(plugin_dir) THEN
    RETURN
  
  LET plugin_files = fs.readdirSync(plugin_dir)
    .filter(file => file.endsWith('.js'))
  
  FOR EACH plugin_file IN plugin_files DO
    TRY
      LET plugin = require(path.join(plugin_dir, plugin_file))
      
      IF plugin.register AND typeof plugin.register === 'function' THEN
        plugin.register(registry)
        console.log(`✓ Loaded plugin: ${plugin.name || plugin_file}`)
    CATCH error
      console.warn(`Failed to load plugin ${plugin_file}:`, error.message)

FUNCTION parse_plugins(plugin_string)
  IF NOT plugin_string THEN
    RETURN []
  
  RETURN plugin_string.split(',').map(p => p.trim())

## Error Handling

FUNCTION handle_pipeline_error(error)
  console.error('\n✗ Pipeline Error\n')
  console.error(`Phase: ${error.phase}`)
  console.error(`Message: ${error.message}`)
  
  IF error.context THEN
    console.error('\nContext:')
    console.error(JSON.stringify(error.context, null, 2))
  
  IF error.suggestions AND error.suggestions.length > 0 THEN
    console.error('\nSuggestions:')
    error.suggestions.forEach(s => console.error(`  - ${s}`))
  
  IF error.stack AND process.env.DEBUG THEN
    console.error('\nStack trace:')
    console.error(error.stack)

## Utility Functions

FUNCTION read_file(file_path)
  LET fs = require('fs')
  
  IF NOT fs.existsSync(file_path) THEN
    THROW new Error(`File not found: ${file_path}`)
  
  RETURN fs.readFileSync(file_path, 'utf8')

FUNCTION write_file(file_path, content)
  LET fs = require('fs')
  LET path = require('path')
  
  // Ensure directory exists
  LET dir = path.dirname(file_path)
  IF NOT fs.existsSync(dir) THEN
    fs.mkdirSync(dir, { recursive: true })
  
  fs.writeFileSync(file_path, content, 'utf8')

FUNCTION open_in_browser(url)
  LET open = require('open')
  open(url)

FUNCTION count_nodes(ast)
  LET count = 1
  
  IF ast.children AND Array.isArray(ast.children) THEN
    FOR EACH child IN ast.children DO
      count += count_nodes(child)
  
  RETURN count

## Main Entry Point

FUNCTION main()
  TRY
    // Setup pipeline
    LET pipeline = setup_pipeline()
    
    // Parse arguments
    LET options = parse_cli_arguments(process.argv)
    
    // Execute appropriate command
    // (Command handlers are called by commander based on parsed args)
    
  CATCH error
    console.error('Fatal error:', error.message)
    process.exit(1)

// Execute main function
main()