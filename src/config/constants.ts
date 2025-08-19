// Configuration Constants and Patterns
// Contains constants, defaults, and regex patterns used throughout the application

// Application defaults
export const DEFAULTS = {
  MAX_SLIDES: 99,
  MAX_NESTING_DEPTH: 10,
  THEME: 'light' as const,
  OUTPUT_EXTENSION: '.html'
} as const

// Regex patterns for parsing and validation
export const REGEX = {
  DELIMITER: /^\s*===\s*$/m,
  CONTAINER: /<container\s+class="([^"]*)">([\s\S]*?)<\/container>/gi,
  STYLE: /<style>([\s\S]*?)<\/style>/gi,
  CLASS_NAME: /^[a-zA-Z0-9_-]+$/
} as const