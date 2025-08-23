import { beforeEach, describe, expect, it, vi, type MockedFunction } from 'vitest'
import { readFile, writeFile } from 'fs/promises'
import { parseArgs, main } from './cli.js'
import { parse } from './parser/index.js'
import { transform } from './transformer/index.js'
import { render } from './renderer/index.js'
import type { CurtainsDocument, TransformedDocument } from './ast/types.js'

// Mock all external dependencies
vi.mock('fs/promises')
vi.mock('./parser/index.js')
vi.mock('./transformer/index.js')
vi.mock('./renderer/index.js')

// Mock process.exit and console methods
const mockExit = vi.fn() as MockedFunction<typeof process.exit>
const mockConsoleLog = vi.fn()
const mockConsoleError = vi.fn()

// Store original methods
const originalExit = process.exit
const originalConsoleLog = console.log  
const originalConsoleError = console.error

describe('CLI', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Mock process.exit
    process.exit = mockExit.mockImplementation(() => {
      throw new Error('process.exit called')
    }) as never
    
    // Mock console methods
    console.log = mockConsoleLog
    console.error = mockConsoleError
    
    // Setup default mocks
    vi.mocked(readFile).mockResolvedValue('mock file content')
    vi.mocked(writeFile).mockResolvedValue()
    vi.mocked(parse).mockReturnValue({
      type: 'curtains-document',
      version: '0.1',
      slides: [{ type: 'curtains-slide', index: 0, ast: { type: 'root', children: [] }, slideCSS: '' }],
      globalCSS: ''
    } as CurtainsDocument)
    vi.mocked(transform).mockResolvedValue({
      slides: [{ html: '<div>test</div>', css: '.slide-0 {}' }],
      globalCSS: ''
    } as TransformedDocument)
    vi.mocked(render).mockResolvedValue('<html>mock output</html>')
  })

  afterEach(() => {
    // Restore original methods
    process.exit = originalExit
    console.log = originalConsoleLog
    console.error = originalConsoleError
  })

  describe('parseArgs', () => {
    describe('Help and version flags', () => {
      it('should show help and exit with -h flag', () => {
        // Arrange
        const argv = ['node', 'cli.js', '-h']

        // Act & Assert
        expect(() => parseArgs(argv)).toThrow('process.exit called')
        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('curtains - Presentation builder'))
        expect(mockExit).toHaveBeenCalledWith(0)
      })

      it('should show help and exit with --help flag', () => {
        // Arrange  
        const argv = ['node', 'cli.js', '--help']

        // Act & Assert
        expect(() => parseArgs(argv)).toThrow('process.exit called')
        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('curtains - Presentation builder'))
        expect(mockExit).toHaveBeenCalledWith(0)
      })

      it('should show version and exit with -v flag', () => {
        // Arrange
        const argv = ['node', 'cli.js', '-v']

        // Act & Assert
        expect(() => parseArgs(argv)).toThrow('process.exit called')
        expect(mockConsoleLog).toHaveBeenCalledWith('curtains v1.0.0')
        expect(mockExit).toHaveBeenCalledWith(0)
      })

      it('should show version and exit with --version flag', () => {
        // Arrange
        const argv = ['node', 'cli.js', '--version']

        // Act & Assert
        expect(() => parseArgs(argv)).toThrow('process.exit called')
        expect(mockConsoleLog).toHaveBeenCalledWith('curtains v1.0.0')
        expect(mockExit).toHaveBeenCalledWith(0)
      })
    })

    describe('Argument validation', () => {
      it('should throw error for invalid argv input', () => {
        // Arrange
        const invalidArgv = 'not an array'

        // Act & Assert
        expect(() => parseArgs(invalidArgv)).toThrow()
      })

      it('should throw error when no arguments provided', () => {
        // Arrange
        const argv = ['node', 'cli.js']

        // Act & Assert
        expect(() => parseArgs(argv)).toThrow('Use: curtains build <input.curtain> -o <output.html> [--theme light|dark]')
      })

      it('should throw error when command is not build', () => {
        // Arrange
        const argv = ['node', 'cli.js', 'invalid']

        // Act & Assert
        expect(() => parseArgs(argv)).toThrow('Use: curtains build <input.curtain> -o <output.html> [--theme light|dark]')
      })

      it('should throw error when input file is not provided', () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build']

        // Act & Assert
        expect(() => parseArgs(argv)).toThrow('Input file is required')
      })

      it('should throw error for invalid input file extension', () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'input.txt']

        // Act & Assert
        expect(() => parseArgs(argv)).toThrow('Input must be a .curtain file')
      })

      it('should throw error for invalid output file extension', () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'input.curtain', '-o', 'output.txt']

        // Act & Assert
        expect(() => parseArgs(argv)).toThrow('Output must be a .html file')
      })

      it('should throw error for invalid theme', () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'input.curtain', '--theme', 'invalid']

        // Act & Assert
        expect(() => parseArgs(argv)).toThrow()
      })
    })

    describe('Valid arguments', () => {
      it('should parse minimal valid arguments', () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'input.curtain']

        // Act
        const result = parseArgs(argv)

        // Assert
        expect(result).toEqual({
          input: 'input.curtain',
          output: 'input.html',
          theme: 'light'
        })
      })

      it('should parse arguments with -o output flag', () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'slides.curtain', '-o', 'presentation.html']

        // Act
        const result = parseArgs(argv)

        // Assert
        expect(result).toEqual({
          input: 'slides.curtain',
          output: 'presentation.html',
          theme: 'light'
        })
      })

      it('should parse arguments with --output flag', () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'slides.curtain', '--output', 'presentation.html']

        // Act
        const result = parseArgs(argv)

        // Assert
        expect(result).toEqual({
          input: 'slides.curtain',
          output: 'presentation.html',
          theme: 'light'
        })
      })

      it('should parse arguments with light theme', () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'slides.curtain', '--theme', 'light']

        // Act
        const result = parseArgs(argv)

        // Assert
        expect(result).toEqual({
          input: 'slides.curtain',
          output: 'slides.html',
          theme: 'light'
        })
      })

      it('should parse arguments with dark theme', () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'slides.curtain', '--theme', 'dark']

        // Act
        const result = parseArgs(argv)

        // Assert
        expect(result).toEqual({
          input: 'slides.curtain',
          output: 'slides.html',
          theme: 'dark'
        })
      })

      it('should parse complete arguments with all options', () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'presentation.curtain', '-o', 'output.html', '--theme', 'dark']

        // Act
        const result = parseArgs(argv)

        // Assert
        expect(result).toEqual({
          input: 'presentation.curtain',
          output: 'output.html',
          theme: 'dark'
        })
      })
    })
  })

  describe('main', () => {
    describe('Successful execution', () => {
      it('should successfully build presentation', async () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'slides.curtain', '-o', 'output.html']

        // Act
        await main(argv)

        // Assert
        expect(vi.mocked(readFile)).toHaveBeenCalledWith('slides.curtain', 'utf-8')
        expect(vi.mocked(parse)).toHaveBeenCalledWith('mock file content')
        expect(vi.mocked(transform)).toHaveBeenCalled()
        expect(vi.mocked(render)).toHaveBeenCalled()
        expect(vi.mocked(writeFile)).toHaveBeenCalledWith('output.html', '<html>mock output</html>', 'utf-8')
        expect(mockConsoleLog).toHaveBeenCalledWith('✓ Built output.html (1 slides)')
      })

      it('should handle multiple slides in success message', async () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'slides.curtain']
        vi.mocked(parse).mockReturnValueOnce({
          type: 'curtains-document',
          version: '0.1',
          slides: [
            { type: 'curtains-slide', index: 0, ast: { type: 'root', children: [] }, slideCSS: '' },
            { type: 'curtains-slide', index: 1, ast: { type: 'root', children: [] }, slideCSS: '' },
            { type: 'curtains-slide', index: 2, ast: { type: 'root', children: [] }, slideCSS: '' }
          ],
          globalCSS: ''
        } as CurtainsDocument)

        // Act
        await main(argv)

        // Assert
        expect(mockConsoleLog).toHaveBeenCalledWith('✓ Built slides.html (3 slides)')
      })
    })

    describe('File access errors', () => {
      it('should handle file read error', async () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'nonexistent.curtain']
        vi.mocked(readFile).mockRejectedValueOnce(new Error('ENOENT'))

        // Act
        try {
          await main(argv)
        } catch (error) {
          // Expected to throw process.exit error
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('process.exit called')
        }

        // Assert
        expect(mockConsoleError).toHaveBeenCalledWith('Error: Cannot read nonexistent.curtain')
        expect(mockExit).toHaveBeenCalledWith(2)
      })

      it('should handle file write error', async () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'slides.curtain']
        vi.mocked(writeFile).mockRejectedValueOnce(new Error('EACCES'))

        // Act
        try {
          await main(argv)
        } catch (error) {
          // Expected to throw process.exit error
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('process.exit called')
        }

        // Assert
        expect(mockConsoleError).toHaveBeenCalledWith('Error: Cannot write slides.html')
        expect(mockExit).toHaveBeenCalledWith(5)
      })
    })

    describe('Parse errors', () => {
      it('should handle parser error', async () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'slides.curtain']
        vi.mocked(parse).mockImplementationOnce(() => {
          throw new Error('Invalid syntax at line 5')
        })

        // Act
        try {
          await main(argv)
        } catch (error) {
          // Expected to throw process.exit error
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('process.exit called')
        }

        // Assert
        expect(mockConsoleError).toHaveBeenCalledWith('Error: Parse failed: Invalid syntax at line 5')
        expect(mockExit).toHaveBeenCalledWith(3)
      })

      it('should handle transform error', async () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'slides.curtain']
        vi.mocked(transform).mockRejectedValueOnce(new Error('Transform failed'))

        // Act
        try {
          await main(argv)
        } catch (error) {
          // Expected to throw process.exit error
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('process.exit called')
        }

        // Assert
        expect(mockConsoleError).toHaveBeenCalledWith('Error: Transform failed: Transform failed')
        expect(mockExit).toHaveBeenCalledWith(3)
      })

      it('should handle render error', async () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'slides.curtain']
        vi.mocked(render).mockRejectedValueOnce(new Error('Render failed'))

        // Act
        try {
          await main(argv)
        } catch (error) {
          // Expected to throw process.exit error
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('process.exit called')
        }

        // Assert
        expect(mockConsoleError).toHaveBeenCalledWith('Error: Render failed: Render failed')
        expect(mockExit).toHaveBeenCalledWith(5)
      })
    })

    describe('No slides error', () => {
      it('should handle document with no slides', async () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'empty.curtain']
        vi.mocked(parse).mockReturnValueOnce({
          type: 'curtains-document',
          version: '0.1',
          slides: [],
          globalCSS: ''
        } as CurtainsDocument)

        // Act
        try {
          await main(argv)
        } catch (error) {
          // Expected to throw process.exit error
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('process.exit called')
        }

        // Assert
        expect(mockConsoleError).toHaveBeenCalledWith('Error: No slides found in input file')
        expect(mockExit).toHaveBeenCalledWith(4)
      })

      it('should handle document with null slides', async () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'empty.curtain']
        vi.mocked(parse).mockReturnValueOnce({
          type: 'curtains-document',
          version: '0.1',
          slides: null as never,
          globalCSS: ''
        } as CurtainsDocument)

        // Act
        try {
          await main(argv)
        } catch (error) {
          // Expected to throw process.exit error
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('process.exit called')
        }

        // Assert
        expect(mockConsoleError).toHaveBeenCalledWith('Error: No slides found in input file')
        expect(mockExit).toHaveBeenCalledWith(4)
      })
    })

    describe('Argument parsing errors', () => {
      it('should handle invalid arguments in main', async () => {
        // Arrange
        const argv = ['node', 'cli.js', 'invalid']

        // Act
        try {
          await main(argv)
        } catch (error) {
          // Expected to throw process.exit error
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('process.exit called')
        }

        // Assert
        expect(mockConsoleError).toHaveBeenCalledWith('Error: Use: curtains build <input.curtain> -o <output.html> [--theme light|dark]')
        expect(mockExit).toHaveBeenCalledWith(1)
      })
    })

    describe('Unexpected errors', () => {
      it('should handle unexpected error with Error instance', async () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'slides.curtain']
        vi.mocked(parse).mockImplementationOnce(() => {
          throw new Error('Something went wrong')
        })

        // Act
        try {
          await main(argv)
        } catch (error) {
          // Expected to throw process.exit error
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('process.exit called')
        }

        // Assert
        expect(mockConsoleError).toHaveBeenCalledWith('Error: Parse failed: Something went wrong')
        expect(mockExit).toHaveBeenCalledWith(3)
      })

      it('should handle unexpected error with string', async () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'slides.curtain']
        vi.mocked(readFile).mockImplementationOnce(() => {
          throw 'String error'
        })

        // Act
        try {
          await main(argv)
        } catch (error) {
          // Expected to throw process.exit error
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('process.exit called')
        }

        // Assert
        expect(mockConsoleError).toHaveBeenCalledWith('Unexpected error:', 'String error')
        expect(mockExit).toHaveBeenCalledWith(5)
      })

      it('should handle parse-related error fallback', async () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'slides.curtain']
        vi.mocked(readFile).mockImplementationOnce(() => {
          throw new Error('Failed to parse configuration')
        })

        // Act
        try {
          await main(argv)
        } catch (error) {
          // Expected to throw process.exit error
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('process.exit called')
        }

        // Assert
        expect(mockConsoleError).toHaveBeenCalledWith('Parse Error: Failed to parse configuration')
        expect(mockExit).toHaveBeenCalledWith(3)
      })

      it('should handle error with message property', async () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'slides.curtain']
        vi.mocked(readFile).mockImplementationOnce(() => {
          throw { message: 'Object with message' }
        })

        // Act
        try {
          await main(argv)
        } catch (error) {
          // Expected to throw process.exit error
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('process.exit called')
        }

        // Assert
        expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'Object with message')
        expect(mockExit).toHaveBeenCalledWith(5)
      })

      it('should handle completely unknown error type', async () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'slides.curtain']
        vi.mocked(readFile).mockImplementationOnce(() => {
          throw { unknownProperty: 'unknown' }
        })

        // Act
        try {
          await main(argv)
        } catch (error) {
          // Expected to throw process.exit error
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('process.exit called')
        }

        // Assert
        expect(mockConsoleError).toHaveBeenCalledWith('Unexpected error:', '[object Object]')
        expect(mockExit).toHaveBeenCalledWith(5)
      })
    })

    describe('Edge cases and helper functions', () => {
      it('should properly format Zod errors', () => {
        // Arrange
        const invalidArgs = ['node', 'cli.js', 'build', 'input.curtain', '--theme', 'invalid-theme']

        // Act & Assert
        expect(() => parseArgs(invalidArgs)).toThrow()
      })

      it('should handle complex Zod error with multiple issues', () => {
        // Arrange - Create an input that will fail both input and theme validation
        const invalidArgs = ['node', 'cli.js', 'build', 'input.txt', '--theme', 'invalid']

        // Act & Assert  
        expect(() => parseArgs(invalidArgs)).toThrow('Input must be a .curtain file')
      })

      it('should handle empty file extension correctly', () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'input.curtain']

        // Act
        const result = parseArgs(argv)

        // Assert
        expect(result.output).toBe('input.html')
      })

      it('should handle file without curtain extension correctly', () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'input.other.curtain']

        // Act
        const result = parseArgs(argv)

        // Assert
        expect(result.output).toBe('input.other.html')
      })

      it('should handle multiple curtain extensions correctly', () => {
        // Arrange
        const argv = ['node', 'cli.js', 'build', 'input.curtain.curtain']

        // Act
        const result = parseArgs(argv)

        // Assert
        expect(result.output).toBe('input.curtain.html')
      })

      it('should handle arguments with extra spaces and ordering', () => {
        // Arrange - Test different argument ordering
        const argv = ['node', 'cli.js', 'build', 'slides.curtain', '--theme', 'dark', '-o', 'custom.html']

        // Act
        const result = parseArgs(argv)

        // Assert
        expect(result).toEqual({
          input: 'slides.curtain',
          output: 'custom.html',
          theme: 'dark'
        })
      })
    })
  })
})