import { 
  validateInput, 
  validateSlideCount, 
  validateSlideIndex, 
  validateClassName, 
  validateNestingDepth 
} from './validate.js'
import { DEFAULTS } from '../config/constants.js'

describe('Parser - Validation', () => {
  describe('validateInput', () => {
    it('should accept valid string input', () => {
      // Arrange & Act & Assert
      expect(() => validateInput('valid input')).not.toThrow()
      expect(validateInput('===\ntest')).toBe('===\ntest')
    })

    it('should throw error for empty input', () => {
      // Arrange & Act & Assert
      expect(() => validateInput('')).toThrow('Input cannot be empty')
    })

    it('should throw error for non-string input', () => {
      // Arrange & Act & Assert
      expect(() => validateInput(null)).toThrow()
      expect(() => validateInput(undefined)).toThrow()
      expect(() => validateInput(123)).toThrow()
      expect(() => validateInput({})).toThrow()
      expect(() => validateInput([])).toThrow()
    })
  })

  describe('validateSlideCount', () => {
    it('should accept valid slide counts', () => {
      // Arrange & Act & Assert
      expect(() => validateSlideCount(1)).not.toThrow()
      expect(() => validateSlideCount(5)).not.toThrow()
      expect(() => validateSlideCount(DEFAULTS.MAX_SLIDES)).not.toThrow()
    })

    it('should throw error for zero slides', () => {
      // Arrange & Act & Assert
      expect(() => validateSlideCount(0)).toThrow('Document must have at least one slide')
    })

    it('should throw error for too many slides', () => {
      // Arrange & Act & Assert
      expect(() => validateSlideCount(DEFAULTS.MAX_SLIDES + 1))
        .toThrow(`Too many slides (max ${DEFAULTS.MAX_SLIDES})`)
    })
  })

  describe('validateSlideIndex', () => {
    it('should accept valid slide indices', () => {
      // Arrange & Act & Assert
      expect(() => validateSlideIndex(0)).not.toThrow()
      expect(() => validateSlideIndex(5)).not.toThrow()
      expect(() => validateSlideIndex(DEFAULTS.MAX_SLIDES - 1)).not.toThrow()
    })

    it('should throw error for invalid slide index', () => {
      // Arrange & Act & Assert
      expect(() => validateSlideIndex(DEFAULTS.MAX_SLIDES))
        .toThrow(`Too many slides (max ${DEFAULTS.MAX_SLIDES})`)
      expect(() => validateSlideIndex(DEFAULTS.MAX_SLIDES + 10))
        .toThrow(`Too many slides (max ${DEFAULTS.MAX_SLIDES})`)
    })
  })

  describe('validateClassName', () => {
    it('should accept valid class names', () => {
      // Arrange & Act & Assert
      expect(() => validateClassName('valid')).not.toThrow()
      expect(() => validateClassName('class-name')).not.toThrow()
      expect(() => validateClassName('class_name')).not.toThrow()
      expect(() => validateClassName('Class123')).not.toThrow()
      expect(() => validateClassName('')).not.toThrow() // Empty class names are allowed
    })

    it('should throw error for invalid class names', () => {
      // Arrange & Act & Assert
      expect(() => validateClassName('invalid@class')).toThrow('Invalid class name: invalid@class')
      expect(() => validateClassName('class with spaces')).toThrow('Invalid class name: class with spaces')
      expect(() => validateClassName('class.with.dots')).toThrow('Invalid class name: class.with.dots')
      expect(() => validateClassName('class#with#hash')).toThrow('Invalid class name: class#with#hash')
    })
  })

  describe('validateNestingDepth', () => {
    it('should accept valid nesting depths', () => {
      // Arrange & Act & Assert
      expect(() => validateNestingDepth(1)).not.toThrow()
      expect(() => validateNestingDepth(5)).not.toThrow()
      expect(() => validateNestingDepth(DEFAULTS.MAX_NESTING_DEPTH)).not.toThrow()
    })

    it('should throw error for too deep nesting', () => {
      // Arrange & Act & Assert
      expect(() => validateNestingDepth(DEFAULTS.MAX_NESTING_DEPTH + 1))
        .toThrow(`Container nesting too deep (max ${DEFAULTS.MAX_NESTING_DEPTH})`)
      expect(() => validateNestingDepth(DEFAULTS.MAX_NESTING_DEPTH + 5))
        .toThrow(`Container nesting too deep (max ${DEFAULTS.MAX_NESTING_DEPTH})`)
    })
  })
})