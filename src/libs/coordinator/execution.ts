import { z } from 'zod';

import { emit, get } from '../registry/registry';
import {
  PipelineConfigSchema,
  PipelineResultSchema,
  StageHandler,
  StageInputSchema,
  StageResultSchema,
  StageSchema,
  StageTypeSchema,
} from '../schemas/stages';
import { Registry } from '../schemas/store';
import { reportProgress } from './handlers';
import { getNextStages, updateStageStatus } from './helpers';

/**
 * Execution context for pipeline
 */
export interface ExecutionContext {
  pipeline: z.infer<typeof PipelineConfigSchema>;
  registry: Registry;
  handlers: Map<z.infer<typeof StageTypeSchema>, StageHandler>;
  startTime: number;
  endTime?: number;
  status: 'running' | 'complete' | 'failed';
}

/**
 * Create execution context for pipeline
 */
export function createExecutionContext(
  pipeline: z.infer<typeof PipelineConfigSchema>,
  registry: Registry,
  handlers: Map<z.infer<typeof StageTypeSchema>, StageHandler>
): ExecutionContext {
  return {
    pipeline,
    registry,
    handlers,
    startTime: Date.now(),
    status: 'running',
  };
}

/**
 * Update execution context with stage result
 */
export function updateExecutionContext(
  context: ExecutionContext,
  stageResult: z.infer<typeof StageResultSchema>
): ExecutionContext {
  const updatedStages = context.pipeline.stages.map((stage) => {
    if (stage.id === stageResult.stageId) {
      return updateStageStatus(
        stage,
        stageResult.success ? 'complete' : 'failed',
        stageResult.output,
        stageResult.error
      );
    }
    return stage;
  });

  return {
    ...context,
    pipeline: {
      ...context.pipeline,
      stages: updatedStages,
    },
  };
}

/**
 * Execute entire pipeline
 */
export async function executePipeline(
  pipeline: z.infer<typeof PipelineConfigSchema>,
  registry: Registry,
  handlers: Map<z.infer<typeof StageTypeSchema>, StageHandler>
): Promise<z.infer<typeof PipelineResultSchema>> {
  const startTime = Date.now();
  const context = createExecutionContext(pipeline, registry, handlers);
  const completed = new Set<string>();
  const results: z.infer<typeof StageResultSchema>[] = [];

  // Emit pipeline start event
  emit(registry, 'pipeline-started', {
    pipelineId: pipeline.id,
    stageCount: pipeline.stages.length,
  });

  try {
    // Execute stages based on parallel flag
    if (pipeline.parallel) {
      // Execute stages in parallel when dependencies are met
      while (completed.size < pipeline.stages.length) {
        const readyStages = getNextStages(pipeline, completed);

        if (readyStages.length === 0) {
          // No more stages ready - check if we're stuck
          const pendingStages = pipeline.stages.filter(
            (s) => !completed.has(s.id) && s.status !== 'failed' && s.status !== 'skipped'
          );
          if (pendingStages.length > 0) {
            throw new Error('Pipeline execution stuck: unmet dependencies');
          }
          break;
        }

        // Execute ready stages in parallel
        const stagePromises = readyStages.map((stage) =>
          executeStageWithRetry(stage, context, pipeline.retryLimit)
        );

        const stageResults = await Promise.allSettled(stagePromises);

        // Process results
        for (let i = 0; i < stageResults.length; i++) {
          const stageResult = stageResults[i];
          const stage = readyStages[i];

          if (stageResult && stage) {
            if (stageResult.status === 'fulfilled') {
              results.push(stageResult.value);
              completed.add(stage.id);
            } else {
              // Stage failed
              const errorResult: z.infer<typeof StageResultSchema> = {
                stageId: stage.id,
                success: false,
                error: stageResult.reason?.message ?? 'Unknown error',
                duration: 0,
              };
              results.push(errorResult);
              // Mark as completed to avoid stuck pipeline
              completed.add(stage.id);
            }
          }
        }

        // Report progress
        reportProgress(pipeline, registry);
      }
    } else {
      // Sequential execution
      for (const stage of pipeline.stages) {
        try {
          const result = await executeStageWithRetry(stage, context, pipeline.retryLimit);
          results.push(result);
          completed.add(stage.id);
          reportProgress(pipeline, registry);
        } catch (error) {
          // Stage failed
          const errorResult: z.infer<typeof StageResultSchema> = {
            stageId: stage.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: 0,
          };
          results.push(errorResult);

          // In sequential mode, fail fast
          break;
        }
      }
    }

    const endTime = Date.now();
    const success = results.every((r) => r.success);

    // Emit pipeline complete event
    emit(registry, 'pipeline-complete', {
      pipelineId: pipeline.id,
      success,
      duration: endTime - startTime,
    });

    return {
      pipelineId: pipeline.id,
      stages: results,
      success,
      duration: endTime - startTime,
    };
  } catch (error) {
    const endTime = Date.now();

    // Emit pipeline failed event
    emit(registry, 'pipeline-failed', {
      pipelineId: pipeline.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: endTime - startTime,
    });

    return {
      pipelineId: pipeline.id,
      stages: results,
      success: false,
      duration: endTime - startTime,
    };
  }
}

/**
 * Execute stage with retry logic
 */
async function executeStageWithRetry(
  stage: z.infer<typeof StageSchema>,
  context: ExecutionContext,
  maxRetries: number
): Promise<z.infer<typeof StageResultSchema>> {
  let attempt = 0;
  let lastError: Error | undefined;

  while (attempt <= maxRetries) {
    try {
      const result = await executeStage(stage, context);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      attempt++;

      if (attempt <= maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Emit retry event
        emit(context.registry, 'stage-retry', {
          stageId: stage.id,
          attempt,
          error: lastError.message,
        });
      }
    }
  }

  // All retries exhausted
  throw lastError ?? new Error('Stage execution failed after retries');
}

/**
 * Execute a single stage
 */
export async function executeStage(
  stage: z.infer<typeof StageSchema>,
  context: ExecutionContext
): Promise<z.infer<typeof StageResultSchema>> {
  const startTime = Date.now();
  const handler = context.handlers.get(stage.type);

  if (!handler) {
    throw new Error(`No handler found for stage type: ${stage.type}`);
  }

  try {
    // Update stage status to running
    emit(context.registry, 'stage-started', {
      stageId: stage.id,
      type: stage.type,
    });

    // Get input for stage
    const input = await prepareStageInput(stage, context);

    // Execute handler
    const output = await handler.handler(input, context.registry);

    // Validate output if validator provided
    if (handler.validator && !handler.validator(output)) {
      throw new Error(`Stage output validation failed for ${stage.type}`);
    }

    const endTime = Date.now();
    const result: z.infer<typeof StageResultSchema> = {
      stageId: stage.id,
      success: true,
      output,
      duration: endTime - startTime,
    };

    // Update context with result
    const updatedContext = updateExecutionContext(context, result);
    Object.assign(context, updatedContext);

    return result;
  } catch (error) {
    const endTime = Date.now();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    const result: z.infer<typeof StageResultSchema> = {
      stageId: stage.id,
      success: false,
      error: errorMessage,
      duration: endTime - startTime,
    };

    // Update context with failure
    const updatedContext = updateExecutionContext(context, result);
    Object.assign(context, updatedContext);

    throw new Error(`Stage ${stage.type} failed: ${errorMessage}`);
  }
}

/**
 * Prepare input for stage execution
 */
async function prepareStageInput(
  stage: z.infer<typeof StageSchema>,
  context: ExecutionContext
): Promise<z.infer<typeof StageInputSchema>> {
  // Get actual data from registry based on stage type
  const { registry } = context;
  
  if (stage.type === 'transform') {
    // Transform needs the AST from parse stage
    const astValue = get(registry, 'ast');
    if (astValue?.type === 'ast') {
      return {
        type: 'transform',
        ast: astValue.document,
      };
    }
  } else if (stage.type === 'render') {
    // Render needs the transformed output
    const transformedValue = get(registry, 'transformed');
    if (transformedValue?.type === 'transformed') {
      return {
        type: 'render',
        transformed: transformedValue.document,
      };
    }
  } else if (stage.type === 'write') {
    // Write needs the rendered HTML
    const renderedValue = get(registry, 'rendered');
    if (renderedValue?.type === 'rendered') {
      return {
        type: 'write',
        html: renderedValue.html,
        path: stage.input.type === 'write' ? stage.input.path : '',
      };
    }
  }
  
  // For parse or if data not available, use original input
  return stage.input;
}

/**
 * Handle stage completion event
 */
export function handleStageCompletion(
  stage: z.infer<typeof StageSchema>,
  result: z.infer<typeof StageResultSchema>,
  pipeline: z.infer<typeof PipelineConfigSchema>
): z.infer<typeof PipelineConfigSchema> {
  const updatedStages = pipeline.stages.map((s) => {
    if (s.id === stage.id) {
      return updateStageStatus(
        s,
        result.success ? 'complete' : 'failed',
        result.output,
        result.error
      );
    }
    return s;
  });

  return {
    ...pipeline,
    stages: updatedStages,
  };
}

/**
 * Retry a failed stage with backoff
 */
export async function retryFailedStage(
  stage: z.infer<typeof StageSchema>,
  attempt: number,
  maxRetries: number,
  registry: Registry,
  handler: StageHandler
): Promise<z.infer<typeof StageResultSchema>> {
  if (attempt >= maxRetries) {
    throw new Error(`Max retries (${maxRetries}) exceeded for stage ${stage.id}`);
  }

  // Calculate backoff delay
  const delay = Math.pow(2, attempt) * 1000;

  // Wait for backoff period
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Emit retry event
  emit(registry, 'stage-retry', {
    stageId: stage.id,
    attempt: attempt + 1,
    delay,
  });

  // Execute stage again
  const startTime = Date.now();

  try {
    const output = await handler.handler(stage.input, registry);

    return {
      stageId: stage.id,
      success: true,
      output,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      stageId: stage.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}
