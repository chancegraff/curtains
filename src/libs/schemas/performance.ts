import z from 'zod';

import { StageTypeSchema } from './stages';

// Stage performance metric
export const StageMetricSchema = z.object({
  stage: StageTypeSchema,
  duration: z.number(),
  memory: z.number(),
  cacheHit: z.boolean(),
});

// Total performance metrics
export const TotalMetricsSchema = z.object({
  duration: z.number(),
  peakMemory: z.number(),
  cacheHitRate: z.number(),
});

// Performance bottleneck
export const BottleneckSchema = z.object({
  stage: StageTypeSchema,
  impact: z.number(), // percentage
});

// Performance data collection
export const PerformanceMetricsSchema = z.object({
  stageMetrics: z.array(StageMetricSchema),
  totalMetrics: TotalMetricsSchema,
  bottlenecks: z.array(BottleneckSchema),
});
