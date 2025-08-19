#!/usr/bin/env node

// CLI Implementation
// Command-line interface for the Curtains presentation builder

import { Command } from 'commander'
import { readFile, writeFile } from 'fs/promises'
import { parse } from './parser/index.js'
import { transform } from './transformer/index.js'
import { render } from './renderer/index.js'
import { BuildOptionsSchema } from './config/schemas.js'

const program = new Command()

program
  .name('curtains')
  .description('CLI for building presentations from .curtain files')
  .version('1.0.0')

program
  .command('build')
  .description('Build a .curtain file into an HTML presentation')
  .argument('<input>', 'Input .curtain file')
  .option('-o, --output <file>', 'Output HTML file')
  .option('--theme <theme>', 'Theme (light or dark)', 'light')
  .action(async (input: string, options: { output?: string; theme: string }) => {
    try {
      // 1. Validate arguments
      const buildOptions = BuildOptionsSchema.parse({
        input,
        output: options.output || input.replace(/\.curtain$/, '.html'),
        theme: options.theme
      })

      console.log(`Building ${buildOptions.input}...`)

      // 2. Read input file
      const source = await readFile(buildOptions.input, 'utf-8')
        .catch(() => {
          throw new Error(`Cannot read ${buildOptions.input}`)
        })

      // 3. Parse source to AST
      const document = await parse(source)

      // 4. Transform AST to HTML
      const transformed = await transform(document)

      // 5. Render final HTML
      const html = await render(transformed, buildOptions)

      // 6. Write output
      await writeFile(buildOptions.output, html, 'utf-8')
        .catch(() => {
          throw new Error(`Cannot write ${buildOptions.output}`)
        })

      console.log(`✓ Built ${buildOptions.output} (${document.slides.length} slides)`)

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error))
      process.exit(1)
    }
  })

program.parse()