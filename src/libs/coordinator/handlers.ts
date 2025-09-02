import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';
import { z } from 'zod';

import { buildAST } from '../pipeline/ast';
import { parseStage as parse } from '../pipeline/parse';
import { renderStage as render } from '../pipeline/render';
import { transformStage as transform } from '../pipeline/transform';
import { emit, getConfig, save } from '../registry/registry';
import { CurtainsDocumentSchema } from '../schemas/ast';
import {
  StageHandler,
  StageInputSchema,
  StageOutputSchema,
  StageTypeSchema,
} from '../schemas/stages';
import { Registry } from '../schemas/store';

/**
 * Create handler map for stage execution
 */
export function createStageHandlers(): Map<
  z.infer<typeof StageTypeSchema>,
  StageHandler
> {
  const handlers = new Map<z.infer<typeof StageTypeSchema>, StageHandler>();

  handlers.set('parse', {
    type: 'parse',
    handler: parseStage,
  });

  handlers.set('transform', {
    type: 'transform',
    handler: transformStage,
  });

  handlers.set('render', {
    type: 'render',
    handler: renderStage,
  });

  handlers.set('write', {
    type: 'write',
    handler: writeStage,
  });

  return handlers;
}

/**
 * Parse stage handler
 */
export async function parseStage(
  input: z.infer<typeof StageInputSchema>,
  registry: Registry
): Promise<z.infer<typeof StageOutputSchema>> {
  try {
    // Validate input type and extract content
    if (input.type !== 'parse') {
      throw new Error(`Invalid input type for parse stage: ${input.type}`);
    }

    // Parse the markdown content
    const parserOutput = parse(input.content);

    // Build AST slides from parsed slides
    const astSlides = parserOutput.slides.map(slide => {
      // Handle the optional mdast field properly
      const slideData = {
        index: slide.index,
        content: slide.content,
        containers: slide.containers,
        styles: slide.styles,
        metadata: slide.metadata,
        ...(slide.mdast && { mdast: slide.mdast })
      };
      return buildAST(slideData);
    });

    // Combine global styles into a single CSS string
    // Global styles are those extracted from the global content section (before first ===)
    const globalCSS = parserOutput.globalStyles
      .map(style => style.content)
      .join('\n');

    // Create the CurtainsDocument
    const curtainsDocument = CurtainsDocumentSchema.parse({
      type: 'curtains-document',
      version: '0.1',
      slides: astSlides,
      globalCSS,
    });

    // Save AST to registry
    save(registry, 'ast', curtainsDocument);

    // Also save the parser output for compatibility with the output schema
    save(registry, 'cache', {
      'parser-output': {
        key: 'parser-output',
        value: JSON.stringify(parserOutput),
        timestamp: Date.now()
      }
    });

    // Emit completion event
    emit(registry, 'stage-complete', { stage: 'parse' });

    // Return the parser output as expected by the schema
    return {
      type: 'parse',
      result: parserOutput,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parse error';
    save(registry, 'errors', [{ code: 'PARSE_ERROR', message }]);
    throw new Error(`Parse stage failed: ${message}`);
  }
}

/**
 * Transform stage handler
 */
export async function transformStage(
  input: z.infer<typeof StageInputSchema>,
  registry: Registry
): Promise<z.infer<typeof StageOutputSchema>> {
  try {
    // Validate input type and extract AST
    if (input.type !== 'transform') {
      throw new Error(`Invalid input type for transform stage: ${input.type}`);
    }
    const transformed = transform(input.ast);

    // Save to registry
    save(registry, 'transformed', transformed);

    // Emit completion event
    emit(registry, 'stage-complete', { stage: 'transform' });

    return {
      type: 'transform',
      result: transformed,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown transform error';
    save(registry, 'errors', [{ code: 'TRANSFORM_ERROR', message }]);
    throw new Error(`Transform stage failed: ${message}`);
  }
}

/**
 * Render stage handler
 */
export async function renderStage(
  input: z.infer<typeof StageInputSchema>,
  registry: Registry
): Promise<z.infer<typeof StageOutputSchema>> {
  try {
    // Validate input type and extract transformed document
    if (input.type !== 'render') {
      throw new Error(`Invalid input type for render stage: ${input.type}`);
    }

    // Get config from registry to pass theme and other settings
    const config = getConfig(registry);
    const html = render(input.transformed, config);

    // Save to registry
    save(registry, 'rendered', html);

    // Emit completion event
    emit(registry, 'stage-complete', { stage: 'render' });

    return {
      type: 'render',
      html,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown render error';
    save(registry, 'errors', [{ code: 'RENDER_ERROR', message }]);
    throw new Error(`Render stage failed: ${message}`);
  }
}

/**
 * Write stage handler
 */
export async function writeStage(
  input: z.infer<typeof StageInputSchema>,
  registry: Registry
): Promise<z.infer<typeof StageOutputSchema>> {
  try {
    // Validate input type and extract data
    if (input.type !== 'write') {
      throw new Error(`Invalid input type for write stage: ${input.type}`);
    }
    const { html, path: outputPath } = input;

    // Ensure parent directory exists
    const parentDir = dirname(outputPath);
    try {
      await mkdir(parentDir, { recursive: true });
    } catch (error) {
      // If directory can't be created (e.g., invalid path), throw error
      const message = error instanceof Error ? error.message : 'Failed to create output directory';
      throw new Error(`Cannot create output directory: ${message}`);
    }

    // Write file
    await writeFile(outputPath, html, 'utf-8');

    // Save success to registry
    save(registry, 'output', { path: outputPath, written: true });

    // Emit completion event
    emit(registry, 'stage-complete', { stage: 'write', outputPath });

    return {
      type: 'write',
      success: true,
      path: outputPath,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown write error';
    save(registry, 'errors', [{ code: 'WRITE_ERROR', message }]);
    throw new Error(`Write stage failed: ${message}`);
  }
}

/**
 * Report pipeline progress to registry
 */
export function reportProgress(
  pipeline: { stages: Array<{ status: string }> },
  registry: Registry
): void {
  const completed = pipeline.stages.filter(
    (s) => s.status === 'complete' || s.status === 'skipped'
  ).length;
  const total = pipeline.stages.length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  emit(registry, 'pipeline-progress', {
    progress,
    completed,
    total,
  });
}
