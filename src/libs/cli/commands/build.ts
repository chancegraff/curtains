import { randomUUID } from 'crypto';
import { z } from 'zod';

import { emit, save, setConfig } from '../../registry/registry';
import { BuildOptionsSchema, OperationSchema, RuntimeConfigSchema, ThemeSchema } from '../../schemas/cli';
import { Registry } from '../../schemas/store';
import { readInputFile } from '../utils/io';
import { validateExtensions } from '../utils/validation';
import { waitForPipeline } from '../utils/wait';

/**
 * Generate default output path from input path
 */
export function generateOutputPath(inputPath: string): string {
  return inputPath.replace(/\.curtain$/, '.html');
}

/**
 * Create runtime configuration from options
 */
export function createRuntimeConfig(options: {
  input: string;
  output: string;
  theme: z.infer<typeof ThemeSchema>;
}): z.infer<typeof RuntimeConfigSchema> {
  return {
    input: options.input,
    output: options.output,
    theme: options.theme,
    timestamp: Date.now(),
    processId: randomUUID(),
  };
}

/**
 * Execute the build command with validated options
 * This is a pure function that takes validated BuildOptions and executes the build
 */
export async function executeBuild(
  options: z.infer<typeof BuildOptionsSchema>,
  registry: Registry
): Promise<void> {
  // Validate file extensions
  const validation = validateExtensions(options.input, options.output);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Read input file content
  const content = await readInputFile(options.input);

  // Create runtime configuration
  const config = createRuntimeConfig({
    input: options.input,
    output: options.output,
    theme: options.theme,
  });

  // Save config to registry
  setConfig(registry, config);

  // Create operations queue with proper structure
  // Note: ast, transformed, and html will be populated by the pipeline stages
  const operations: z.infer<typeof OperationSchema>[] = [
    {
      id: randomUUID(),
      type: 'parse',
      input: { type: 'parse', content },
      timestamp: Date.now(),
    },
    {
      id: randomUUID(),
      type: 'transform',
      input: { type: 'transform', ast: { type: 'curtains-document', version: '0.1', slides: [], globalCSS: '' } },
      timestamp: Date.now(),
    },
    {
      id: randomUUID(),
      type: 'render',
      input: { type: 'render', transformed: { slides: [], globalCSS: '' } },
      timestamp: Date.now(),
    },
    {
      id: randomUUID(),
      type: 'write',
      input: { type: 'write', html: '', path: options.output },
      timestamp: Date.now(),
    },
  ];

  // Save operations to registry queue
  save(registry, 'queue', operations);

  // Emit start-pipeline event to trigger coordinator
  emit(registry, 'start-pipeline', { timestamp: Date.now() });

  // Wait for pipeline completion
  await waitForPipeline(registry);

  // Success message
  console.log(`✓ Successfully converted ${options.input} to ${options.output}`);
}