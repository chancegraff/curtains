import { build } from 'esbuild'

const config = {
  entryPoints: ['src/libs/cli/main.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',  // Changed from 'esm' to 'cjs' to better handle Commander's CommonJS internals
  outfile: 'dist/curtains-cli.cjs',  // Changed extension to .cjs so Node treats it as CommonJS
  banner: {
    js: '#!/usr/bin/env node'
  },
  loader: {
    '.css': 'text'  // Load CSS files as text strings
  },
  minify: true,  // Enable minification
  sourcemap: true,  // Keep sourcemap for debugging
  metafile: true,
  treeShaking: true,  // Remove unused code
  logLevel: 'info',
  // Additional optimization options
  legalComments: 'none',  // Remove all comments
  drop: ['debugger'],  // Remove debugger statements
  keepNames: true,  // Keep function/class names for better error messages
  // Additional safe optimizations
  splitting: false,  // Don't split code for Node.js
  chunkNames: 'chunks/[name]-[hash]',
  assetNames: 'assets/[name]-[hash]',
  charset: 'utf8',
  define: {
    'process.env.NODE_ENV': '"production"'  // Set production mode
  }
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
