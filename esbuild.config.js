import { build } from 'esbuild'

const config = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/curtains-cli.js',
  external: [
    // Keep these as external since they're Node.js built-ins
    'fs',
    'path',
    'url',
    'util',
    'stream',
    'events',
    'crypto',
    'os',
    'child_process'
  ],
  banner: {
    js: '#!/usr/bin/env node'
  },
  minify: false,
  sourcemap: true,
  metafile: true,
  treeShaking: true,
  logLevel: 'info'
}

async function buildCLI() {
  try {
    console.log('Building CLI with esbuild...')
    
    const result = await build(config)
    
    if (result.metafile) {
      console.log('Build completed successfully!')
      console.log(`Output file: ${config.outfile}`)
      
      // Make the output file executable
      const fs = await import('fs')
      await fs.promises.chmod(config.outfile, 0o755)
      
      // Log bundle analysis
      const outputs = result.metafile.outputs
      for (const [file, info] of Object.entries(outputs)) {
        console.log(`${file}: ${(info.bytes / 1024).toFixed(2)}kb`)
      }
    }
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}

// Only run build if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildCLI()
}

export { config, buildCLI }