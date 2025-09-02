import { z } from 'zod';

import { QueueSchema, RuntimeConfigSchema } from '../schemas/cli';
import {
  PipelineConfigSchema,
  RecoveryStrategySchema,
  StageOutputSchema,
  StageSchema,
  StageStatusSchema,
  StageTypeSchema,
} from '../schemas/stages';

/**
 * Create pipeline configuration from operation queue
 */
export function createPipeline(
  queue: z.infer<typeof QueueSchema>,
  _config: z.infer<typeof RuntimeConfigSchema>
): z.infer<typeof PipelineConfigSchema> {
  const stages: z.infer<typeof StageSchema>[] = [];
  let previousStageId: string | null = null;

  queue.forEach((operation) => {
    const stageId = crypto.randomUUID();
    const stage: z.infer<typeof StageSchema> = {
      id: stageId,
      type: operation.type,
      input: operation.input,
      status: 'pending',
      dependencies: previousStageId ? [previousStageId] : [],
    };
    stages.push(stage);
    previousStageId = stageId;
  });

  return {
    id: crypto.randomUUID(),
    stages,
    parallel: false,
    retryLimit: 1,
    timeout: 30000,
  };
}

/**
 * Plan execution order based on dependencies
 */
export function planExecution(
  pipeline: z.infer<typeof PipelineConfigSchema>
): z.infer<typeof StageSchema>[] {
  const stages = [...pipeline.stages];
  const executed = new Set<string>();
  const result: z.infer<typeof StageSchema>[] = [];

  while (result.length < stages.length) {
    let foundReady = false;

    for (const stage of stages) {
      if (!executed.has(stage.id) && isStageReady(stage, executed)) {
        result.push(stage);
        executed.add(stage.id);
        foundReady = true;
      }
    }

    if (!foundReady) {
      // Circular dependency or invalid pipeline
      throw new Error('Unable to plan execution: circular dependencies detected');
    }
  }

  return result;
}

/**
 * Check if stage is ready to execute
 */
export function isStageReady(
  stage: z.infer<typeof StageSchema>,
  completed: Set<string>
): boolean {
  return stage.dependencies.every((dep) => completed.has(dep));
}

/**
 * Get next stages ready for execution
 */
export function getNextStages(
  pipeline: z.infer<typeof PipelineConfigSchema>,
  completed: Set<string>
): z.infer<typeof StageSchema>[] {
  return pipeline.stages.filter(
    (stage) =>
      stage.status === 'pending' &&
      !completed.has(stage.id) &&
      isStageReady(stage, completed)
  );
}

/**
 * Update stage status immutably
 */
export function updateStageStatus(
  stage: z.infer<typeof StageSchema>,
  status: z.infer<typeof StageStatusSchema>,
  output?: z.infer<typeof StageOutputSchema>,
  error?: string
): z.infer<typeof StageSchema> {
  return {
    ...stage,
    status,
    output,
    error,
    endTime: status === 'complete' || status === 'failed' ? Date.now() : stage.endTime,
  };
}

/**
 * Calculate pipeline progress percentage
 */
export function calculateProgress(
  pipeline: z.infer<typeof PipelineConfigSchema>
): number {
  const completed = pipeline.stages.filter(
    (s) => s.status === 'complete' || s.status === 'skipped'
  ).length;
  const total = pipeline.stages.length;
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

/**
 * Validate stage status transition
 */
export function validateTransition(
  from: z.infer<typeof StageStatusSchema>,
  to: z.infer<typeof StageStatusSchema>
): boolean {
  const validTransitions: Record<
    z.infer<typeof StageStatusSchema>,
    z.infer<typeof StageStatusSchema>[]
  > = {
    pending: ['running', 'skipped'],
    running: ['complete', 'failed'],
    complete: [],
    failed: ['pending'], // Can retry
    skipped: [],
  };

  return validTransitions[from]?.includes(to) ?? false;
}

/**
 * Handle stage failure based on recovery strategy
 */
export function handleStageFailure(
  stage: z.infer<typeof StageSchema>,
  error: Error,
  strategy: z.infer<typeof RecoveryStrategySchema>
): z.infer<typeof StageSchema> {
  if (strategy === 'retry') {
    return updateStageStatus(stage, 'pending', undefined, error.message);
  } else if (strategy === 'skip') {
    return updateStageStatus(stage, 'skipped', undefined, error.message);
  } else if (strategy === 'fallback') {
    return createFallbackStage(stage);
  } else {
    // fail-fast
    return updateStageStatus(stage, 'failed', undefined, error.message);
  }
}

/**
 * Create fallback stage for recovery
 */
export function createFallbackStage(
  failedStage: z.infer<typeof StageSchema>
): z.infer<typeof StageSchema> {
  return {
    ...failedStage,
    id: crypto.randomUUID(),
    status: 'pending',
    error: undefined,
    output: undefined,
    startTime: undefined,
    endTime: undefined,
  };
}

/**
 * Optimize pipeline for parallel execution
 */
export function optimizePipeline(
  pipeline: z.infer<typeof PipelineConfigSchema>
): z.infer<typeof PipelineConfigSchema> {
  // Identify stages that can run in parallel
  const parallelGroups: z.infer<typeof StageSchema>[][] = [];
  const processed = new Set<string>();

  while (processed.size < pipeline.stages.length) {
    const group = pipeline.stages.filter(
      (stage) => !processed.has(stage.id) && isStageReady(stage, processed)
    );

    if (group.length === 0) {
      break;
    }

    parallelGroups.push(group);
    group.forEach((stage) => processed.add(stage.id));
  }

  // If we have multiple stages that can run in parallel, enable it
  const hasParallelStages = parallelGroups.some((group) => group.length > 1);

  return {
    ...pipeline,
    parallel: hasParallelStages,
  };
}

/**
 * Merge compatible stages for optimization
 */
export function mergeStages(
  stages: z.infer<typeof StageSchema>[]
): z.infer<typeof StageSchema>[] {
  // For now, don't merge - each stage is distinct
  // Future optimization could merge compatible operations
  return stages;
}

/**
 * Estimate execution time based on history
 */
export function estimateExecutionTime(
  pipeline: z.infer<typeof PipelineConfigSchema>,
  history: Array<{ stageType: z.infer<typeof StageTypeSchema>; duration: number }>
): number {
  if (history.length === 0) {
    // Default estimate: 500ms per stage
    return pipeline.stages.length * 500;
  }

  // Calculate average duration per stage type
  const avgDurations = new Map<z.infer<typeof StageTypeSchema>, number>();
  const typeCounts = new Map<z.infer<typeof StageTypeSchema>, number>();

  history.forEach(({ stageType, duration }) => {
    const current = avgDurations.get(stageType) ?? 0;
    const count = typeCounts.get(stageType) ?? 0;
    avgDurations.set(stageType, current + duration);
    typeCounts.set(stageType, count + 1);
  });

  // Calculate averages
  avgDurations.forEach((total, type) => {
    const count = typeCounts.get(type) ?? 1;
    avgDurations.set(type, total / count);
  });

  // Estimate total time
  return pipeline.stages.reduce((total, stage) => {
    const avgDuration = avgDurations.get(stage.type) ?? 500;
    return total + avgDuration;
  }, 0);
}