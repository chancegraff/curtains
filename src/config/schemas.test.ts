// Configuration Schemas Tests  
// Comprehensive tests for Zod schema validation

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { 
  ThemeSchema, 
  BuildOptionsSchema, 
  ErrorCodeSchema, 
  CurtainsErrorSchema,
  ParsedArgsSchema 
} from './schemas.js'

describe('Configuration Schemas', () => {
  describe('ThemeSchema', () => {
    it('should validate valid theme values', () => {
      const validThemes = ['light', 'dark']
      
      validThemes.forEach(theme => {
        const result = ThemeSchema.safeParse(theme)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(theme)
        }
      })
    })

    it('should reject invalid theme values', () => {
      const invalidThemes = [
        'medium',
        'bright',
        'auto',
        'system',
        '',
        null,
        undefined,
        123,
        true,
        {},
        [],
        'LIGHT',
        'DARK',
        'Light',
        'Dark'
      ]

      invalidThemes.forEach(theme => {
        const result = ThemeSchema.safeParse(theme)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues).toHaveLength(1)
        }
      })
    })

    it('should be an enum schema', () => {
      // Check if it's an enum by testing the options property
      expect(ThemeSchema.options).toEqual(['light', 'dark'])
    })

    it('should provide correct error message for invalid values', () => {
      const result = ThemeSchema.safeParse('invalid')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid option')
      }
    })
  })

  describe('BuildOptionsSchema', () => {
    it('should validate valid build options', () => {
      const validOptions = [
        {
          input: 'slides.curtain',
          output: 'output.html',
          theme: 'light'
        },
        {
          input: 'presentation.curtain', 
          output: 'result.html',
          theme: 'dark'
        },
        {
          input: 'test.curtain',
          output: 'test.html'
          // theme should default to 'light'
        }
      ]

      validOptions.forEach(options => {
        const result = BuildOptionsSchema.safeParse(options)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.input).toBe(options.input)
          expect(result.data.output).toBe(options.output)
          expect(result.data.theme).toBe(options.theme || 'light')
        }
      })
    })

    it('should apply default theme when not provided', () => {
      const options = {
        input: 'test.curtain',
        output: 'test.html'
      }

      const result = BuildOptionsSchema.safeParse(options)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.theme).toBe('light')
      }
    })

    it('should reject invalid input file extensions', () => {
      const invalidInputs = [
        { input: 'file.txt', output: 'output.html', theme: 'light' },
        { input: 'file.md', output: 'output.html', theme: 'light' },
        { input: 'file.html', output: 'output.html', theme: 'light' },
        { input: 'file', output: 'output.html', theme: 'light' },
        { input: 'file.curtains', output: 'output.html', theme: 'light' }
      ]

      invalidInputs.forEach(options => {
        const result = BuildOptionsSchema.safeParse(options)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some(issue => 
            issue.message.includes('Input must be a .curtain file')
          )).toBe(true)
        }
      })
    })

    it('should reject invalid output file extensions', () => {
      const invalidOutputs = [
        { input: 'file.curtain', output: 'output.txt', theme: 'light' },
        { input: 'file.curtain', output: 'output.md', theme: 'light' },
        { input: 'file.curtain', output: 'output.curtain', theme: 'light' },
        { input: 'file.curtain', output: 'output', theme: 'light' },
        { input: 'file.curtain', output: 'output.htm', theme: 'light' }
      ]

      invalidOutputs.forEach(options => {
        const result = BuildOptionsSchema.safeParse(options)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some(issue => 
            issue.message.includes('Output must be a .html file')
          )).toBe(true)
        }
      })
    })

    it('should reject empty or missing required fields', () => {
      const invalidOptions = [
        { output: 'output.html', theme: 'light' }, // missing input
        { input: 'file.curtain', theme: 'light' }, // missing output
        { input: '', output: 'output.html', theme: 'light' }, // empty input
        { input: 'file.curtain', output: '', theme: 'light' }, // empty output
        {}, // empty object
        { input: null, output: 'output.html', theme: 'light' },
        { input: 'file.curtain', output: null, theme: 'light' }
      ]

      invalidOptions.forEach(options => {
        const result = BuildOptionsSchema.safeParse(options)
        expect(result.success).toBe(false)
      })
    })

    it('should reject invalid theme values', () => {
      const invalidThemes = [
        { input: 'file.curtain', output: 'output.html', theme: 'invalid' },
        { input: 'file.curtain', output: 'output.html', theme: 'auto' },
        { input: 'file.curtain', output: 'output.html', theme: null },
        { input: 'file.curtain', output: 'output.html', theme: 123 }
      ]

      invalidThemes.forEach(options => {
        const result = BuildOptionsSchema.safeParse(options)
        expect(result.success).toBe(false)
      })
    })

    it('should handle file paths with directories', () => {
      const optionsWithPaths = {
        input: 'src/presentations/slides.curtain',
        output: 'dist/output.html',
        theme: 'dark'
      }

      const result = BuildOptionsSchema.safeParse(optionsWithPaths)
      expect(result.success).toBe(true)
    })

    it('should be an object schema with correct properties', () => {
      // Test that it's an object schema by checking shape keys exist
      expect(BuildOptionsSchema.shape).toBeDefined()
      expect(Object.keys(BuildOptionsSchema.shape)).toEqual(['input', 'output', 'theme'])
    })
  })

  describe('ErrorCodeSchema', () => {
    it('should validate valid error codes', () => {
      const validErrorCodes = [
        'INVALID_ARGS',
        'FILE_ACCESS', 
        'PARSE_ERROR',
        'NO_SLIDES',
        'OUTPUT_ERROR'
      ]

      validErrorCodes.forEach(code => {
        const result = ErrorCodeSchema.safeParse(code)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(code)
        }
      })
    })

    it('should reject invalid error codes', () => {
      const invalidErrorCodes = [
        'INVALID_ERROR',
        'FILE_NOT_FOUND',
        'NETWORK_ERROR', 
        'UNKNOWN_ERROR',
        '',
        null,
        undefined,
        123,
        true,
        {},
        [],
        'invalid_args', // wrong case
        'Invalid_Args',
        'file_access'
      ]

      invalidErrorCodes.forEach(code => {
        const result = ErrorCodeSchema.safeParse(code)
        expect(result.success).toBe(false)
      })
    })

    it('should be an enum schema with correct values', () => {
      expect(ErrorCodeSchema.options).toEqual([
        'INVALID_ARGS',
        'FILE_ACCESS', 
        'PARSE_ERROR',
        'NO_SLIDES',
        'OUTPUT_ERROR'
      ])
    })

    it('should provide descriptive error messages', () => {
      const result = ErrorCodeSchema.safeParse('UNKNOWN')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid option')
      }
    })
  })

  describe('CurtainsErrorSchema', () => {
    it('should validate valid curtains error objects', () => {
      const validErrors = [
        {
          code: 'INVALID_ARGS',
          message: 'Invalid command line arguments',
          exitCode: 1
        },
        {
          code: 'FILE_ACCESS',
          message: 'Cannot access file',
          exitCode: 2
        },
        {
          code: 'PARSE_ERROR',
          message: 'Failed to parse curtain file',
          exitCode: 3
        },
        {
          code: 'NO_SLIDES',
          message: 'No slides found in presentation',
          exitCode: 4
        },
        {
          code: 'OUTPUT_ERROR', 
          message: 'Failed to write output file',
          exitCode: 5
        }
      ]

      validErrors.forEach(error => {
        const result = CurtainsErrorSchema.safeParse(error)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.code).toBe(error.code)
          expect(result.data.message).toBe(error.message)
          expect(result.data.exitCode).toBe(error.exitCode)
        }
      })
    })

    it('should reject invalid error codes', () => {
      const errorWithInvalidCode = {
        code: 'UNKNOWN_ERROR',
        message: 'Some error',
        exitCode: 1
      }

      const result = CurtainsErrorSchema.safeParse(errorWithInvalidCode)
      expect(result.success).toBe(false)
    })

    it('should reject invalid exit codes', () => {
      const invalidExitCodes = [
        { code: 'INVALID_ARGS', message: 'Error', exitCode: 0 }, // below min
        { code: 'INVALID_ARGS', message: 'Error', exitCode: 6 }, // above max
        { code: 'INVALID_ARGS', message: 'Error', exitCode: -1 }, // negative
        { code: 'INVALID_ARGS', message: 'Error', exitCode: 1.5 }, // non-integer
        { code: 'INVALID_ARGS', message: 'Error', exitCode: '1' }, // string
        { code: 'INVALID_ARGS', message: 'Error', exitCode: null }
      ]

      invalidExitCodes.forEach(error => {
        const result = CurtainsErrorSchema.safeParse(error)
        expect(result.success).toBe(false)
      })
    })

    it('should require non-empty message', () => {
      const invalidMessages = [
        { code: 'INVALID_ARGS', message: null, exitCode: 1 }, // null
        { code: 'INVALID_ARGS', message: undefined, exitCode: 1 }, // undefined
        { code: 'INVALID_ARGS', exitCode: 1 } // missing message
      ]

      invalidMessages.forEach(error => {
        const result = CurtainsErrorSchema.safeParse(error)
        expect(result.success).toBe(false)
      })
    })

    it('should allow empty string message', () => {
      // Zod string schema allows empty strings by default
      const errorWithEmptyMessage = { code: 'INVALID_ARGS', message: '', exitCode: 1 }
      const result = CurtainsErrorSchema.safeParse(errorWithEmptyMessage)
      expect(result.success).toBe(true)
    })

    it('should require all fields', () => {
      const incompleteErrors = [
        { message: 'Error', exitCode: 1 }, // missing code
        { code: 'INVALID_ARGS', exitCode: 1 }, // missing message
        { code: 'INVALID_ARGS', message: 'Error' }, // missing exitCode
        {} // empty object
      ]

      incompleteErrors.forEach(error => {
        const result = CurtainsErrorSchema.safeParse(error)
        expect(result.success).toBe(false)
      })
    })

    it('should be an object schema with correct properties', () => {
      expect(CurtainsErrorSchema.shape).toBeDefined()
      expect(Object.keys(CurtainsErrorSchema.shape)).toEqual(['code', 'message', 'exitCode'])
    })

    it('should validate exit code constraints', () => {
      // Test boundary values
      const boundaryTests = [
        { code: 'INVALID_ARGS', message: 'Error', exitCode: 1 }, // min valid
        { code: 'INVALID_ARGS', message: 'Error', exitCode: 5 } // max valid
      ]

      boundaryTests.forEach(error => {
        const result = CurtainsErrorSchema.safeParse(error)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('ParsedArgsSchema', () => {
    it('should validate valid parsed args', () => {
      const validArgs = [
        {
          command: 'build',
          input: 'slides.curtain'
        },
        {
          command: 'build', 
          input: 'presentation.curtain',
          output: 'output.html'
        },
        {
          command: 'build',
          input: 'test.curtain',
          output: 'result.html',
          theme: 'dark'
        },
        {
          command: 'build',
          input: 'src/slides.curtain',
          theme: 'light'
        }
      ]

      validArgs.forEach(args => {
        const result = ParsedArgsSchema.safeParse(args)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.command).toBe('build')
          expect(result.data.input).toBe(args.input)
          if (args.output) {
            expect(result.data.output).toBe(args.output)
          }
          if (args.theme) {
            expect(result.data.theme).toBe(args.theme)
          }
        }
      })
    })

    it('should reject invalid commands', () => {
      const invalidCommands = [
        { command: 'serve', input: 'file.curtain' },
        { command: 'watch', input: 'file.curtain' },
        { command: 'init', input: 'file.curtain' },
        { command: 'help', input: 'file.curtain' },
        { command: '', input: 'file.curtain' },
        { command: null, input: 'file.curtain' },
        { command: 123, input: 'file.curtain' },
        { command: 'BUILD', input: 'file.curtain' } // wrong case
      ]

      invalidCommands.forEach(args => {
        const result = ParsedArgsSchema.safeParse(args)
        expect(result.success).toBe(false)
      })
    })

    it('should require input field', () => {
      const missingInput = [
        { command: 'build' },
        { command: 'build', input: null },
        { command: 'build', input: undefined }
      ]

      missingInput.forEach(args => {
        const result = ParsedArgsSchema.safeParse(args)
        expect(result.success).toBe(false)
      })
    })

    it('should allow empty string input', () => {
      // Zod string schema allows empty strings by default
      const argsWithEmptyInput = { command: 'build', input: '' }
      const result = ParsedArgsSchema.safeParse(argsWithEmptyInput)
      expect(result.success).toBe(true)
    })

    it('should allow optional output field', () => {
      const argsWithoutOutput = {
        command: 'build',
        input: 'slides.curtain'
      }

      const result = ParsedArgsSchema.safeParse(argsWithoutOutput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.output).toBeUndefined()
      }
    })

    it('should allow optional theme field', () => {
      const argsWithoutTheme = {
        command: 'build',
        input: 'slides.curtain',
        output: 'output.html'
      }

      const result = ParsedArgsSchema.safeParse(argsWithoutTheme)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.theme).toBeUndefined()
      }
    })

    it('should reject invalid types for optional fields', () => {
      const invalidOptionalFields = [
        { command: 'build', input: 'file.curtain', output: 123 },
        { command: 'build', input: 'file.curtain', output: true },
        { command: 'build', input: 'file.curtain', theme: 123 },
        { command: 'build', input: 'file.curtain', theme: true },
        { command: 'build', input: 'file.curtain', output: [] },
        { command: 'build', input: 'file.curtain', theme: {} }
      ]

      invalidOptionalFields.forEach(args => {
        const result = ParsedArgsSchema.safeParse(args)
        expect(result.success).toBe(false)
      })
    })

    it('should be an object schema with correct properties', () => {
      expect(ParsedArgsSchema.shape).toBeDefined()
      expect(Object.keys(ParsedArgsSchema.shape)).toEqual(['command', 'input', 'output', 'theme'])
    })

    it('should handle extra properties', () => {
      const argsWithExtra = {
        command: 'build',
        input: 'slides.curtain',
        extraProp: 'should be ignored'
      }

      const result = ParsedArgsSchema.safeParse(argsWithExtra)
      expect(result.success).toBe(true)
      if (result.success) {
        // Zod strips unknown properties by default
        expect(result.data).not.toHaveProperty('extraProp')
      }
    })
  })

  describe('Schema Integration', () => {
    it('should work together in realistic scenarios', () => {
      // Theme used in BuildOptions
      const buildOptions = {
        input: 'presentation.curtain',
        output: 'slides.html',
        theme: 'dark'
      }

      const buildResult = BuildOptionsSchema.safeParse(buildOptions)
      expect(buildResult.success).toBe(true)

      if (buildResult.success) {
        const themeResult = ThemeSchema.safeParse(buildResult.data.theme)
        expect(themeResult.success).toBe(true)
      }
    })

    it('should maintain consistency between error handling schemas', () => {
      const errorCode = 'PARSE_ERROR'
      const codeResult = ErrorCodeSchema.safeParse(errorCode)
      expect(codeResult.success).toBe(true)

      const fullError = {
        code: errorCode,
        message: 'Failed to parse curtain file',
        exitCode: 3
      }

      const errorResult = CurtainsErrorSchema.safeParse(fullError)
      expect(errorResult.success).toBe(true)
    })

    it('should validate complete workflow data', () => {
      // Simulate a complete CLI workflow
      const parsedArgs = {
        command: 'build',
        input: 'slides.curtain',
        output: 'presentation.html',
        theme: 'light'
      }

      const argsResult = ParsedArgsSchema.safeParse(parsedArgs)
      expect(argsResult.success).toBe(true)

      if (argsResult.success) {
        const buildOptions = {
          input: argsResult.data.input,
          output: argsResult.data.output || 'default.html',
          theme: argsResult.data.theme || 'light'
        }

        const buildResult = BuildOptionsSchema.safeParse(buildOptions)
        expect(buildResult.success).toBe(true)
      }
    })
  })
})