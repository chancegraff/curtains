// Configuration Type Definitions
// Contains all TypeScript types for configuration and CLI options
// Note: Types are inferred from Zod schemas to ensure runtime/compile-time consistency

import type { z } from 'zod'
import type { 
  ThemeSchema, 
  BuildOptionsSchema, 
  ErrorCodeSchema, 
  CurtainsErrorSchema,
  ParsedArgsSchema 
} from './schemas.js'

// Theme types - inferred from schema
export type Theme = z.infer<typeof ThemeSchema>

// CLI Build Options - inferred from schema
export type BuildOptions = z.infer<typeof BuildOptionsSchema>

// Error handling types - inferred from schemas
export type ErrorCode = z.infer<typeof ErrorCodeSchema>
export type CurtainsError = z.infer<typeof CurtainsErrorSchema>
export type ParsedArgs = z.infer<typeof ParsedArgsSchema>