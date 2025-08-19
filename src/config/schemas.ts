// Configuration Zod Schemas
// Contains Zod schemas for configuration validation

import { z } from 'zod'

// Theme schema
export const ThemeSchema = z.enum(['light', 'dark'])

// CLI Options schema
export const BuildOptionsSchema = z.object({
  input: z.string().refine(val => val.endsWith('.curtain'), {
    message: 'Input must be a .curtain file'
  }),
  output: z.string().refine(val => val.endsWith('.html'), {
    message: 'Output must be a .html file'
  }),
  theme: ThemeSchema.default('light')
})