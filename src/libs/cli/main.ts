import { Command } from 'commander';
import { z } from 'zod';

import { initializeCoordinator } from '../coordinator/coordinator';
import { createRegistry } from '../registry/registry';
import { BuildOptionsSchema, ParsedOptionsSchema } from '../schemas/cli';
import { executeBuild } from './commands/build';
import { generateOutputPath } from './commands/build';

/**
 * Set up the Commander CLI program
 */
export function setupCLI(): Command {
  const program = new Command();

  program
    .name('curtains')
    .description('Convert Curtain markup to HTML presentations')
    .version('2.0.0')
    .argument('<input>', 'Input .curtain file')
    .option('-o, --output <path>', 'Output HTML file')
    .option('-t, --theme <name>', 'Theme name', 'light')
    .option('-d, --debug', 'Enable debug mode', false)
    .option('-s, --strict', 'Enable strict mode', false);

  return program;
}

/**
 * Parse CLI arguments and return validated options
 */
export function parseCLI(argv: string[]): z.infer<typeof ParsedOptionsSchema> {
  const program = setupCLI();

  // Check for help or version flags before parsing
  if (argv.includes('-h') || argv.includes('--help')) {
    console.log(program.helpInformation());
    process.exit(0);
  }
  if (argv.includes('-V') || argv.includes('--version')) {
    console.log('2.0.1');
    process.exit(0);
  }

  // Parse the arguments
  program.parse(['node', 'curtains', ...argv]);

  const opts = program.opts();
  const [input] = program.args;

  // Build the parsed options object
  const parsed = {
    command: 'build' as const,
    input,
    output: opts.output,
    theme: opts.theme,
    debug: Boolean(opts.debug),
    strict: Boolean(opts.strict),
  };

  // Validate with Zod
  const result = ParsedOptionsSchema.safeParse(parsed);
  if (!result.success) {
    console.error(`✗ Invalid options: ${result.error.message}`);
    process.exit(1);
  }

  return result.data;
}

/**
 * Main CLI entry point
 */
export async function main(argv: string[]): Promise<void> {
  const registry = createRegistry({ debug: false });
  const unsubscribe = initializeCoordinator(registry);

  try {
    // Parse and validate CLI arguments
    const options = parseCLI(argv);

    // Handle build command
    if (options.command === 'build') {
      // Generate output path if not provided
      const outputPath = options.output ?? generateOutputPath(options.input);

      // Create build options with validated data
      const buildOptions = BuildOptionsSchema.parse({
        command: 'build',
        input: options.input,
        output: outputPath,
        theme: options.theme,
      });

      // Execute the build
      await executeBuild(buildOptions, registry);
    }
  } catch (error) {
    unsubscribe();

    // Check if it's a general error
    if (error instanceof Error) {
      console.error(`✗ Error: ${error.message}`);
    } else {
      console.error('✗ Error: Unknown error occurred');
    }

    // Exit with appropriate code for non-test environments
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }

    // Re-throw for tests to handle
    throw error;
  }

  // Clean up subscriptions on success
  unsubscribe();
}

// Run if called directly
// Check if this is CommonJS environment (for CLI usage)
if (typeof require !== 'undefined' && require.main === module) {
  main(process.argv.slice(2)).catch(() => {
    // Error was already displayed in main(), just exit with code
    process.exit(1);
  });
}
