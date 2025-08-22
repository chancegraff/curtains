// Configuration Types Tests
// Comprehensive tests for type inference and compatibility

import { describe, it, expect, expectTypeOf } from 'vitest'
import type { 
  Theme, 
  BuildOptions, 
  ErrorCode, 
  CurtainsError,
  ParsedArgs 
} from './types.js'
import { 
  ThemeSchema, 
  BuildOptionsSchema, 
  ErrorCodeSchema, 
  CurtainsErrorSchema,
  ParsedArgsSchema 
} from './schemas.js'

describe('Configuration Types', () => {
  describe('Theme type inference', () => {
    it('should infer correct Theme type from ThemeSchema', () => {
      // Test that Theme type matches schema inference
      const lightTheme: Theme = 'light'
      const darkTheme: Theme = 'dark'
      
      expect(typeof lightTheme).toBe('string')
      expect(typeof darkTheme).toBe('string')
      
      // Compile-time type checks
      expectTypeOf<Theme>().toEqualTypeOf<'light' | 'dark'>()
    })

    it('should work with schema validation', () => {
      const theme: Theme = 'light'
      const result = ThemeSchema.safeParse(theme)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expectTypeOf(result.data).toEqualTypeOf<Theme>()
      }
    })

    it('should not allow invalid theme values at compile time', () => {
      // These should cause TypeScript errors if uncommented:
      // const invalidTheme: Theme = 'medium'
      // const invalidTheme2: Theme = 'auto'
      // const invalidTheme3: Theme = 'system'
      
      // But we can test that they're correctly typed
      expectTypeOf<Theme>().not.toEqualTypeOf<string>()
      expectTypeOf<Theme>().not.toEqualTypeOf<'medium'>()
    })

    it('should be assignable to valid values', () => {
      const themes: Theme[] = ['light', 'dark']
      
      themes.forEach(theme => {
        expectTypeOf(theme).toEqualTypeOf<Theme>()
      })
    })
  })

  describe('BuildOptions type inference', () => {
    it('should infer correct BuildOptions type from BuildOptionsSchema', () => {
      const validOptions: BuildOptions = {
        input: 'slides.curtain',
        output: 'presentation.html',
        theme: 'light'
      }

      expect(typeof validOptions.input).toBe('string')
      expect(typeof validOptions.output).toBe('string')
      expect(typeof validOptions.theme).toBe('string')

      // Compile-time type checks
      expectTypeOf<BuildOptions>().toHaveProperty('input')
      expectTypeOf<BuildOptions>().toHaveProperty('output')
      expectTypeOf<BuildOptions>().toHaveProperty('theme')
    })

    it('should work with schema validation', () => {
      const options: BuildOptions = {
        input: 'test.curtain',
        output: 'result.html',
        theme: 'dark'
      }

      const result = BuildOptionsSchema.safeParse(options)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expectTypeOf(result.data).toEqualTypeOf<BuildOptions>()
      }
    })

    it('should have correct property types', () => {
      expectTypeOf<BuildOptions['input']>().toBeString()
      expectTypeOf<BuildOptions['output']>().toBeString()
      expectTypeOf<BuildOptions['theme']>().toEqualTypeOf<Theme>()
    })

    it('should require all properties', () => {
      // These should cause TypeScript errors if uncommented:
      // const incomplete1: BuildOptions = { input: 'file.curtain' }
      // const incomplete2: BuildOptions = { output: 'file.html', theme: 'light' }
      
      expectTypeOf<BuildOptions>().not.toEqualTypeOf<{ input: string }>()
      expectTypeOf<BuildOptions>().not.toEqualTypeOf<{ output: string }>()
    })

    it('should work with theme defaults', () => {
      const optionsWithoutTheme = {
        input: 'slides.curtain',
        output: 'output.html'
      }

      const result = BuildOptionsSchema.safeParse(optionsWithoutTheme)
      expect(result.success).toBe(true)

      if (result.success) {
        // Schema should apply default theme
        expect(result.data.theme).toBe('light')
        expectTypeOf(result.data).toEqualTypeOf<BuildOptions>()
      }
    })
  })

  describe('ErrorCode type inference', () => {
    it('should infer correct ErrorCode type from ErrorCodeSchema', () => {
      const validCodes: ErrorCode[] = [
        'INVALID_ARGS',
        'FILE_ACCESS',
        'PARSE_ERROR', 
        'NO_SLIDES',
        'OUTPUT_ERROR'
      ]

      validCodes.forEach(code => {
        expectTypeOf(code).toEqualTypeOf<ErrorCode>()
      })

      // Compile-time type check
      expectTypeOf<ErrorCode>().toEqualTypeOf<
        'INVALID_ARGS' | 'FILE_ACCESS' | 'PARSE_ERROR' | 'NO_SLIDES' | 'OUTPUT_ERROR'
      >()
    })

    it('should work with schema validation', () => {
      const code: ErrorCode = 'PARSE_ERROR'
      const result = ErrorCodeSchema.safeParse(code)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expectTypeOf(result.data).toEqualTypeOf<ErrorCode>()
      }
    })

    it('should not allow invalid error codes at compile time', () => {
      // These should cause TypeScript errors if uncommented:
      // const invalid: ErrorCode = 'UNKNOWN_ERROR'
      // const invalid2: ErrorCode = 'NETWORK_ERROR'
      
      expectTypeOf<ErrorCode>().not.toEqualTypeOf<string>()
      expectTypeOf<ErrorCode>().not.toEqualTypeOf<'UNKNOWN_ERROR'>()
    })

    it('should be usable in switch statements', () => {
      const codes: ErrorCode[] = ['INVALID_ARGS', 'FILE_ACCESS', 'PARSE_ERROR', 'NO_SLIDES', 'OUTPUT_ERROR']
      const code = codes[0]
      let message = ''

      switch (code) {
        case 'INVALID_ARGS':
          message = 'Invalid arguments'
          break
        case 'FILE_ACCESS':
          message = 'File access error'
          break
        case 'PARSE_ERROR':
          message = 'Parse error'
          break
        case 'NO_SLIDES':
          message = 'No slides found'
          break
        case 'OUTPUT_ERROR':
          message = 'Output error'
          break
        default:
          // This should never be reached with proper typing
          message = `Unexpected code: ${code}`
      }

      expect(message).toBe('Invalid arguments')
    })
  })

  describe('CurtainsError type inference', () => {
    it('should infer correct CurtainsError type from CurtainsErrorSchema', () => {
      const error: CurtainsError = {
        code: 'PARSE_ERROR',
        message: 'Failed to parse presentation',
        exitCode: 3
      }

      expect(typeof error.code).toBe('string')
      expect(typeof error.message).toBe('string')
      expect(typeof error.exitCode).toBe('number')

      // Compile-time type checks
      expectTypeOf<CurtainsError>().toHaveProperty('code')
      expectTypeOf<CurtainsError>().toHaveProperty('message')
      expectTypeOf<CurtainsError>().toHaveProperty('exitCode')
    })

    it('should work with schema validation', () => {
      const error: CurtainsError = {
        code: 'FILE_ACCESS',
        message: 'Cannot read input file',
        exitCode: 2
      }

      const result = CurtainsErrorSchema.safeParse(error)
      expect(result.success).toBe(true)

      if (result.success) {
        expectTypeOf(result.data).toEqualTypeOf<CurtainsError>()
      }
    })

    it('should have correct property types', () => {
      expectTypeOf<CurtainsError['code']>().toEqualTypeOf<ErrorCode>()
      expectTypeOf<CurtainsError['message']>().toBeString()
      expectTypeOf<CurtainsError['exitCode']>().toBeNumber()
    })

    it('should require all properties', () => {
      // These should cause TypeScript errors if uncommented:
      // const incomplete: CurtainsError = { code: 'INVALID_ARGS' }
      // const incomplete2: CurtainsError = { message: 'Error', exitCode: 1 }
      
      expectTypeOf<CurtainsError>().not.toEqualTypeOf<{ code: ErrorCode }>()
      expectTypeOf<CurtainsError>().not.toEqualTypeOf<{ message: string }>()
    })

    it('should work with error factory functions', () => {
      function createError(code: ErrorCode, message: string, exitCode: number): CurtainsError {
        return { code, message, exitCode }
      }

      const error = createError('NO_SLIDES', 'No slides found in presentation', 4)
      expectTypeOf(error).toEqualTypeOf<CurtainsError>()
      
      expect(error.code).toBe('NO_SLIDES')
      expect(error.message).toBe('No slides found in presentation')
      expect(error.exitCode).toBe(4)
    })
  })

  describe('ParsedArgs type inference', () => {
    it('should infer correct ParsedArgs type from ParsedArgsSchema', () => {
      const args: ParsedArgs = {
        command: 'build',
        input: 'slides.curtain',
        output: 'presentation.html',
        theme: 'light'
      }

      expect(typeof args.command).toBe('string')
      expect(typeof args.input).toBe('string')
      expect(typeof args.output).toBe('string')
      expect(typeof args.theme).toBe('string')

      // Compile-time type checks
      expectTypeOf<ParsedArgs>().toHaveProperty('command')
      expectTypeOf<ParsedArgs>().toHaveProperty('input')
      expectTypeOf<ParsedArgs>().toHaveProperty('output')
      expectTypeOf<ParsedArgs>().toHaveProperty('theme')
    })

    it('should work with schema validation', () => {
      const args: ParsedArgs = {
        command: 'build',
        input: 'test.curtain'
      }

      const result = ParsedArgsSchema.safeParse(args)
      expect(result.success).toBe(true)

      if (result.success) {
        expectTypeOf(result.data).toEqualTypeOf<ParsedArgs>()
      }
    })

    it('should have correct property types', () => {
      expectTypeOf<ParsedArgs['command']>().toEqualTypeOf<'build'>()
      expectTypeOf<ParsedArgs['input']>().toBeString()
      expectTypeOf<ParsedArgs['output']>().toEqualTypeOf<string | undefined>()
      expectTypeOf<ParsedArgs['theme']>().toEqualTypeOf<string | undefined>()
    })

    it('should allow optional properties', () => {
      const minimalArgs: ParsedArgs = {
        command: 'build',
        input: 'slides.curtain'
      }

      expectTypeOf(minimalArgs).toEqualTypeOf<ParsedArgs>()
      expect(minimalArgs.output).toBeUndefined()
      expect(minimalArgs.theme).toBeUndefined()
    })

    it('should work with command validation', () => {
      // command should only accept 'build'
      const validCommand: ParsedArgs['command'] = 'build'
      expectTypeOf(validCommand).toEqualTypeOf<'build'>()
      
      // These should cause TypeScript errors if uncommented:
      // const invalid: ParsedArgs['command'] = 'serve'
      // const invalid2: ParsedArgs['command'] = 'watch'
    })
  })

  describe('Type compatibility and integration', () => {
    it('should maintain consistency between related types', () => {
      // Theme should be compatible across types
      const buildOptions: BuildOptions = {
        input: 'slides.curtain',
        output: 'output.html',
        theme: 'dark'
      }

      const theme: Theme = buildOptions.theme
      expectTypeOf(theme).toEqualTypeOf<Theme>()
    })

    it('should work in error handling scenarios', () => {
      function handleError(error: CurtainsError): void {
        const code: ErrorCode = error.code
        expectTypeOf(code).toEqualTypeOf<ErrorCode>()
        
        console.error(`Error ${code}: ${error.message} (exit ${error.exitCode})`)
      }

      const error: CurtainsError = {
        code: 'OUTPUT_ERROR',
        message: 'Failed to write output file',
        exitCode: 5
      }

      expect(() => handleError(error)).not.toThrow()
    })

    it('should work in CLI workflow scenarios', () => {
      function processArgs(args: ParsedArgs): BuildOptions {
        return {
          input: args.input,
          output: (args.output !== null && args.output !== undefined && args.output !== '') ? args.output : 'default.html',
          theme: (args.theme as Theme) ?? 'light'
        }
      }

      const args: ParsedArgs = {
        command: 'build',
        input: 'presentation.curtain',
        theme: 'dark'
      }

      const options = processArgs(args)
      expectTypeOf(options).toEqualTypeOf<BuildOptions>()
      
      expect(options.input).toBe('presentation.curtain')
      expect(options.output).toBe('default.html')
      expect(options.theme).toBe('dark')
    })

    it('should maintain runtime-compile time consistency', () => {
      // Test that runtime validation and compile-time types are consistent
      const testData = [
        { schema: ThemeSchema, value: 'light' as Theme },
        { 
          schema: BuildOptionsSchema, 
          value: { 
            input: 'test.curtain', 
            output: 'test.html', 
            theme: 'dark' as Theme 
          } as BuildOptions 
        },
        { schema: ErrorCodeSchema, value: 'PARSE_ERROR' as ErrorCode },
        { 
          schema: CurtainsErrorSchema, 
          value: { 
            code: 'INVALID_ARGS' as ErrorCode, 
            message: 'Invalid', 
            exitCode: 1 
          } as CurtainsError 
        },
        { 
          schema: ParsedArgsSchema, 
          value: { 
            command: 'build' as const, 
            input: 'slides.curtain' 
          } as ParsedArgs 
        }
      ]

      testData.forEach(({ schema, value }) => {
        const result = schema.safeParse(value)
        expect(result.success).toBe(true)
      })
    })

    it('should support proper type narrowing', () => {
      function processErrorCode(code: string): ErrorCode | null {
        const result = ErrorCodeSchema.safeParse(code)
        if (result.success) {
          return result.data // This should be properly typed as ErrorCode
        }
        return null
      }

      const validCode = processErrorCode('PARSE_ERROR')
      const invalidCode = processErrorCode('UNKNOWN')

      expect(validCode).toBe('PARSE_ERROR')
      expect(invalidCode).toBeNull()

      if (validCode) {
        expectTypeOf(validCode).toEqualTypeOf<ErrorCode>()
      }
    })
  })

  describe('Type utility and helper compatibility', () => {
    it('should work with generic utility functions', () => {
      // eslint-disable-next-line no-unused-vars
      function validateAndTransform<T>(schema: { safeParse: (input: unknown) => { success: boolean; data?: T } }, value: unknown): T | null {
        const result = schema.safeParse(value)
        return result.success && result.data !== undefined ? result.data : null
      }

      const theme = validateAndTransform(ThemeSchema, 'light')
      const buildOptions = validateAndTransform(BuildOptionsSchema, {
        input: 'test.curtain',
        output: 'test.html', 
        theme: 'dark'
      })

      if (theme) {
        expectTypeOf(theme).toEqualTypeOf<Theme>()
      }
      if (buildOptions) {
        expectTypeOf(buildOptions).toEqualTypeOf<BuildOptions>()
      }
    })

    it('should support partial type operations', () => {
      type PartialBuildOptions = Partial<BuildOptions>
      type RequiredBuildOptions = Required<BuildOptions>
      type BuildOptionsKeys = keyof BuildOptions

      const partial: PartialBuildOptions = { input: 'test.curtain' }
      const required: RequiredBuildOptions = { 
        input: 'test.curtain', 
        output: 'test.html', 
        theme: 'light' 
      }

      expectTypeOf<BuildOptionsKeys>().toEqualTypeOf<'input' | 'output' | 'theme'>()
      expectTypeOf(partial.input).toEqualTypeOf<string | undefined>()
      expectTypeOf(required.theme).toEqualTypeOf<Theme>()
    })

    it('should work with discriminated unions', () => {
      type Result<T> = 
        | { success: true; data: T }
        | { success: false; error: CurtainsError }

      function processResult<T>(result: Result<T>): T | never {
        if (result.success) {
          return result.data
        } else {
          throw new Error(`${result.error.code}: ${result.error.message}`)
        }
      }

      const successResult: Result<BuildOptions> = {
        success: true,
        data: {
          input: 'test.curtain',
          output: 'test.html',
          theme: 'light'
        }
      }

      const errorResult: Result<BuildOptions> = {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse',
          exitCode: 3
        }
      }

      const data = processResult(successResult)
      expectTypeOf(data).toEqualTypeOf<BuildOptions>()

      expect(() => processResult(errorResult)).toThrow('PARSE_ERROR: Failed to parse')
    })
  })
})