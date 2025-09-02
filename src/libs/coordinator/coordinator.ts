import { z } from 'zod';

import { emit, get, save, subscribe } from '../registry/registry';
import { QueueSchema, RuntimeConfigSchema } from '../schemas/cli';
import { Registry } from '../schemas/store';
import { executePipeline } from './execution';
import { createStageHandlers } from './handlers';
import { createPipeline } from './helpers';

/**
 * Initialize coordinator with registry subscription
 */
export function initializeCoordinator(registry: Registry): () => void {
  // Subscribe to the start-pipeline event
  const unsubscribe = subscribe(registry, 'start-pipeline', async () => {
    try {
      // Get config and queue from registry
      const configValue = get(registry, 'runtime');
      const config = configValue?.type === 'runtime' ? configValue.config : undefined;
      const queueValue = get(registry, 'queue');
      const queue = queueValue?.type === 'queue' ? queueValue.operations : undefined;

      if (!config) {
        save(registry, 'errors', [{
          code: 'NO_CONFIG',
          message: 'No runtime configuration found in registry'
        }]);
        return;
      }

      if (!queue || queue.length === 0) {
        save(registry, 'errors', [{
          code: 'NO_QUEUE',
          message: 'No queue operations found in registry'
        }]);
        return;
      }

      // Create stage handlers
      const handlers = createStageHandlers();

      // Create pipeline from queue
      const pipeline = createPipeline(queue, config);

      // Save pipeline to registry
      save(registry, 'pipeline', pipeline);

      // Execute pipeline
      const result = await executePipeline(pipeline, registry, handlers);

      // Save result to registry
      save(registry, 'pipeline-result', result);

      // Check if pipeline was successful
      if (result.success) {
        // Emit completion event
        emit(registry, 'coordinator-complete', {
          pipelineId: result.pipelineId,
          success: result.success,
          duration: result.duration,
        });
      } else {
        // Pipeline failed - emit failure event
        const failedStage = result.stages.find(r => !r.success);
        const errorMessage = failedStage?.error ?? 'Pipeline execution failed';
        
        // Save error to registry
        save(registry, 'errors', [{
          code: 'PIPELINE_FAILED',
          message: errorMessage
        }]);
        
        // Emit failure event
        emit(registry, 'coordinator-failed', {
          error: errorMessage,
        });
      }
    } catch (error) {
      // Save error to registry
      save(registry, 'errors', [{
        code: 'COORDINATOR_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }]);

      // Emit failure event
      emit(registry, 'coordinator-failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return unsubscribe;
}

/**
 * Start the coordinator by emitting the start event
 */
export function startCoordinator(
  registry: Registry,
  config: z.infer<typeof RuntimeConfigSchema>,
  queue: z.infer<typeof QueueSchema>
): void {
  // Save config and queue to registry
  save(registry, 'runtime', config);
  save(registry, 'queue', queue);

  // Emit start event to trigger pipeline
  emit(registry, 'start-pipeline', {
    timestamp: Date.now(),
  });
}
