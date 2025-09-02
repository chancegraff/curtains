import z from 'zod';

// VFile message schema matching vfile-message
export const VFileMessageSchema = z.object({
  reason: z.string(),
  fatal: z.boolean().nullable().optional(),
  line: z.number().optional(),
  column: z.number().optional(),
  position: z
    .object({
      start: z
        .object({
          line: z.number(),
          column: z.number(),
          offset: z.number().optional(),
        })
        .optional(),
      end: z
        .object({
          line: z.number(),
          column: z.number(),
          offset: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
  source: z.string().optional(),
  ruleId: z.string().optional(),
  file: z.string().optional(),
  note: z.string().optional(),
  url: z.string().optional(),
  actual: z.string().optional(),
  expected: z.array(z.string()).optional(),
  ancestors: z.array(z.object({})).optional(), // Node type - using empty object for now
  place: z
    .union([
      z.object({
        line: z.number(),
        column: z.number(),
        offset: z.number().optional(),
      }),
      z.object({
        start: z.object({
          line: z.number(),
          column: z.number(),
          offset: z.number().optional(),
        }),
        end: z.object({
          line: z.number(),
          column: z.number(),
          offset: z.number().optional(),
        }),
      }),
    ])
    .optional(),
});

// Processor settings schema - common unified settings
export const ProcessorSettingsSchema = z.object({
  fragment: z.boolean().optional(),
  commonmark: z.boolean().optional(),
  gfm: z.boolean().optional(),
  footnotes: z.boolean().optional(),
  pedantic: z.boolean().optional(),
  allowDangerousHtml: z.boolean().optional(),
  allowDangerousProtocol: z.boolean().optional(),
});

// Unified processor configuration using actual plugin types
export const ProcessorConfigSchema = z.object({
  remarkPlugins: z.array(z.function()), // Array of Plugin functions
  rehypePlugins: z.array(z.function()), // Array of Plugin functions
  settings: ProcessorSettingsSchema,
});

// VFile data schema - flexible data storage
export const VFileDataSchema = z.object({
  matter: z
    .object({
      content: z.string(),
      data: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
    })
    .optional(),
  frontmatter: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  meta: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

// VFile schema matching unified's VFile type
export const VFileSchema = z.object({
  contents: z.union([z.string(), z.instanceof(Uint8Array)]),
  path: z.string().optional(),
  basename: z.string().optional(),
  stem: z.string().optional(),
  extname: z.string().optional(),
  dirname: z.string().optional(),
  data: VFileDataSchema,
  messages: z.array(VFileMessageSchema),
  history: z.array(z.string()),
  cwd: z.string(),
});

// Processing result using VFile
export const ProcessingResultSchema = VFileSchema;

// Unified processor instance type (for runtime validation)
export const ProcessorInstanceSchema = z.object({
  use: z.function(),
  parse: z.function(),
  stringify: z.function(),
  run: z.function(),
  runSync: z.function(),
  process: z.function(),
  processSync: z.function(),
});
