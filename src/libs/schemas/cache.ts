import z from 'zod';

import { CacheValueSchema } from './registry';

// Cache lookup result
export const CacheLookupSchema = z.object({
  hit: z.boolean(),
  value: CacheValueSchema.optional(),
  age: z.number().optional(),
});

// Cache update operation
export const CacheUpdateSchema = z.object({
  key: z.string(),
  value: CacheValueSchema,
  ttl: z.number(),
});

// Cache invalidation operation
export const CacheInvalidateSchema = z.object({
  pattern: z.string().optional(),
  all: z.boolean().optional(),
});

// Cache data flow
export const CacheFlowSchema = z.object({
  key: z.string(),
  lookup: CacheLookupSchema,
  update: CacheUpdateSchema,
  invalidate: CacheInvalidateSchema,
});
