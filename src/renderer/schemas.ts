// Renderer Schemas
// Validation schemas for renderer-specific types

import { z } from 'zod'

// Runtime config schema for embedded JavaScript
export const RuntimeConfigSchema = z.object({
  totalSlides: z.number().int().min(1),
  theme: z.enum(['light', 'dark']),
  startSlide: z.number().int().min(0).default(0)
})

// HTML output schema for validation
export const HTMLOutputSchema = z.string().min(1).regex(/^<!DOCTYPE html>/i, 'Must be valid HTML document')

// Export types for external use
export type RuntimeConfig = z.infer<typeof RuntimeConfigSchema>