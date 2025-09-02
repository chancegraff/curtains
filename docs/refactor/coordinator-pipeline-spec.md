# Coordinator Pipeline Specification

Component: Takes config, sets up pipeline, executes operations

import { parse } from '../pipeline/parse'
import { transform } from '../pipeline/transform'
import { render } from '../pipeline/render'
import { writeFile } from 'fs/promises'

**Types Reference:** See [types-spec.md](./types-spec.md) for all type definitions

## Pure Functions

```typescript
// Initialize coordinator with registry subscription
export function initializeCoordinator(registry: Registry): void {
  subscribe(registry, 'start-pipeline', async () => {
    const config = get(registry, 'config')
    const queue = get(registry, 'queue')
    if (config && queue) {
      const handlers = createStageHandlers()
      const pipeline = createPipeline(queue, config)
      await executePipeline(pipeline, registry, handlers)
    }
  })
}

// Create handler map for stage execution
export function createStageHandlers(): Map<z.infer<typeof StageTypeSchema>, StageHandler> {
  const handlers = new Map<z.infer<typeof StageTypeSchema>, StageHandler>()
  handlers.set('parse', { type: 'parse', handler: parseStage })
  handlers.set('transform', { type: 'transform', handler: transformStage })
  handlers.set('render', { type: 'render', handler: renderStage })
  handlers.set('write', { type: 'write', handler: writeStage })
  return handlers
}

// Create pipeline from queue
export function createPipeline(
  queue: z.infer<typeof QueueSchema>,
  config: z.infer<typeof RuntimeConfigSchema>
): z.infer<typeof PipelineConfigSchema> {
  const stages: z.infer<typeof StageSchema>[] = []
  let previousStageId: string | null = null
  
  queue.forEach((operation) => {
    const stage: z.infer<typeof StageSchema> = {
      id: crypto.randomUUID(),
      type: operation.type,
      input: operation.input,
      status: 'pending',
      dependencies: previousStageId ? [previousStageId] : []
    }
    stages.push(stage)
    previousStageId = stage.id
  })
  
  return {
    id: crypto.randomUUID(),
    stages,
    parallel: false,
    retryLimit: 1,
    timeout: 30000
  }
}

// Plan execution order
export function planExecution(
  pipeline: z.infer<typeof PipelineConfigSchema>
): z.infer<typeof StageSchema>[] {
  // Topological sort for dependencies
}

// Update stage status
export function updateStageStatus(
  stage: z.infer<typeof StageSchema>,
  status: z.infer<typeof StageStatusSchema>,
  output?: z.infer<typeof StageOutputSchema>,
  error?: string
): z.infer<typeof StageSchema> {
  // Returns new stage with updated status
}

// Check stage readiness
export function isStageReady(
  stage: z.infer<typeof StageSchema>,
  completed: Set<string>
): boolean {
  // Pure dependency check
}

// Get next stages
export function getNextStages(
  pipeline: z.infer<typeof PipelineConfigSchema>,
  completed: Set<string>
): z.infer<typeof StageSchema>[] {
  // Returns ready stages
}

// Calculate pipeline progress
export function calculateProgress(
  pipeline: z.infer<typeof PipelineConfigSchema>
): number {
  // Returns percentage complete
}

// Report pipeline progress
export async function reportProgress(
  pipeline: z.infer<typeof PipelineConfigSchema>,
  registry: Registry
): Promise<void> {
  const completed = pipeline.stages.filter(s => s.status === 'complete').length
  const total = pipeline.stages.length
  const progress = Math.round((completed / total) * 100)
  await emit(registry, 'pipeline-progress', { progress, completed, total })
}

// Validate stage transition
export function validateTransition(
  from: z.infer<typeof StageStatusSchema>,
  to: z.infer<typeof StageStatusSchema>
): boolean {
  // Pure validation
}
```

## Stage Handlers

```typescript
// Parse stage handler
export async function parseStage(
  input: string,
  registry: Registry
): Promise<z.infer<typeof CurtainsDocumentSchema>> {
  try {
    const ast = parse(input)
    await save(registry, 'ast', ast)
    await emit(registry, 'stage-complete', { stage: 'parse' })
    return ast
  } catch (error) {
    await save(registry, 'error', { stage: 'parse', message: error.message })
    throw error
  }
}

// Transform stage handler
export async function transformStage(
  ast: z.infer<typeof CurtainsDocumentSchema>,
  registry: Registry
): Promise<z.infer<typeof TransformedDocumentSchema>> {
  try {
    const transformed = transform(ast)
    await save(registry, 'transformed', transformed)
    await emit(registry, 'stage-complete', { stage: 'transform' })
    return transformed
  } catch (error) {
    await save(registry, 'error', { stage: 'transform', message: error.message })
    throw error
  }
}

// Render stage handler
export async function renderStage(
  transformed: z.infer<typeof TransformedDocumentSchema>,
  options: z.infer<typeof BuildOptionsSchema>,
  registry: Registry
): Promise<string> {
  try {
    const html = await render(transformed, options)
    await save(registry, 'rendered', html)
    await emit(registry, 'stage-complete', { stage: 'render' })
    return html
  } catch (error) {
    await save(registry, 'error', { stage: 'render', message: error.message })
    throw error
  }
}

// Write stage handler
export async function writeStage(
  html: string,
  outputPath: string,
  registry: Registry
): Promise<void> {
  try {
    await writeFile(outputPath, html, 'utf-8')
    await emit(registry, 'stage-complete', { stage: 'write', outputPath })
  } catch (error) {
    await save(registry, 'error', { stage: 'write', message: error.message })
    throw error
  }
}
```

## Execution Engine

```typescript
// Execute entire pipeline
export async function executePipeline(
  pipeline: z.infer<typeof PipelineConfigSchema>,
  registry: Registry,
  handlers: Map<z.infer<typeof StageTypeSchema>, StageHandler>
): Promise<z.infer<typeof PipelineResultSchema>> {
  // Main execution loop:
  // 1. Initialize execution context
  // 2. Plan execution order based on dependencies
  // 3. Execute stages according to strategy (sequential/parallel)
  // 4. Collect and return results
}

// Execute a single stage
export async function executeStage(
  stage: z.infer<typeof StageSchema>,
  registry: Registry,
  handler: StageHandler
): Promise<z.infer<typeof StageResultSchema>> {
  // Stage execution with error handling:
  // 1. Validate stage is ready (dependencies complete)
  // 2. Load input from registry or previous stage output
  // 3. Execute handler function with input
  // 4. Validate output if validator provided
  // 5. Return result with timing and status
}

// Handle stage completion event
export function handleStageCompletion(
  stage: z.infer<typeof StageSchema>,
  result: z.infer<typeof StageResultSchema>,
  pipeline: z.infer<typeof PipelineConfigSchema>
): z.infer<typeof PipelineConfigSchema> {
  // Process completion and return updated pipeline:
  // 1. Update stage status in pipeline
  // 2. Store result in stage output
  // 3. Mark dependent stages as ready if all dependencies met
  // 4. Return new pipeline state (immutable update)
}

// Retry a failed stage with backoff
export async function retryFailedStage(
  stage: z.infer<typeof StageSchema>,
  attempt: number,
  maxRetries: number,
  registry: Registry,
  handler: StageHandler
): Promise<z.infer<typeof StageResultSchema>> {
  // Exponential backoff retry logic:
  // 1. Check if attempt < maxRetries
  // 2. Calculate backoff delay: Math.pow(2, attempt) * 1000
  // 3. Wait for backoff period
  // 4. Execute stage again with executeStage
  // 5. Return result or throw if max retries exceeded
}

// Create execution context for pipeline
export function createExecutionContext(
  pipeline: z.infer<typeof PipelineConfigSchema>,
  registry: Registry
): ExecutionContext {
  return {
    pipeline,
    registry,
    startTime: Date.now(),
    status: 'running'
  }
}

// Update execution context with stage result
export function updateExecutionContext(
  context: ExecutionContext,
  stageResult: z.infer<typeof StageResultSchema>
): ExecutionContext {
  // Returns new context with updated pipeline state and results
}
```

## Error Recovery

```typescript
// Handle stage failure
export function handleStageFailure(
  stage: z.infer<typeof StageSchema>,
  error: Error,
  strategy: z.infer<typeof RecoveryStrategySchema>
): z.infer<typeof StageSchema> {
  // Returns updated stage based on strategy
}

// Create fallback stage
export function createFallbackStage(
  failedStage: z.infer<typeof StageSchema>
): z.infer<typeof StageSchema> {
  // Pure fallback stage creation
}
```

## Pipeline Optimization

```typescript
// Optimize pipeline execution
export function optimizePipeline(
  pipeline: z.infer<typeof PipelineConfigSchema>
): z.infer<typeof PipelineConfigSchema> {
  // Identify parallelizable stages
}

// Merge compatible stages
export function mergeStages(
  stages: z.infer<typeof StageSchema>[]
): z.infer<typeof StageSchema>[] {
  // Combine stages that can run together
}

// Estimate execution time
export function estimateExecutionTime(
  pipeline: z.infer<typeof PipelineConfigSchema>,
  history: z.infer<typeof StageResultSchema>[]
): number {
  // Based on historical data
}
```

## Integration Points

- **Registry**: Read config, store results
- **Pipeline Stages**: Execute stage handlers
- **CLI**: Triggered by registry event

## Immutability Patterns

- Pipeline config is immutable
- Stage updates create new objects
- Results are append-only
- Context is recreated for each execution
- No shared mutable state between stages