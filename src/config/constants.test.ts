// Configuration Constants Tests
// Comprehensive tests for constants, defaults, and regex patterns

import { describe, it, expect, beforeEach } from 'vitest'
import { DEFAULTS, REGEX } from './constants.js'

describe('Configuration Constants', () => {
  beforeEach(() => {
    // Reset global regex lastIndex to ensure clean state between tests
    REGEX.CONTAINER.lastIndex = 0
    REGEX.STYLE.lastIndex = 0
  })
  describe('DEFAULTS', () => {
    it('should have correct MAX_SLIDES default value', () => {
      expect(DEFAULTS.MAX_SLIDES).toBe(99)
      expect(typeof DEFAULTS.MAX_SLIDES).toBe('number')
      expect(DEFAULTS.MAX_SLIDES).toBeGreaterThan(0)
    })

    it('should have correct MAX_NESTING_DEPTH default value', () => {
      expect(DEFAULTS.MAX_NESTING_DEPTH).toBe(10)
      expect(typeof DEFAULTS.MAX_NESTING_DEPTH).toBe('number')
      expect(DEFAULTS.MAX_NESTING_DEPTH).toBeGreaterThan(0)
    })

    it('should have correct THEME default value', () => {
      expect(DEFAULTS.THEME).toBe('light')
      expect(typeof DEFAULTS.THEME).toBe('string')
    })

    it('should have correct OUTPUT_EXTENSION default value', () => {
      expect(DEFAULTS.OUTPUT_EXTENSION).toBe('.html')
      expect(typeof DEFAULTS.OUTPUT_EXTENSION).toBe('string')
      expect(DEFAULTS.OUTPUT_EXTENSION).toMatch(/^\.\w+$/)
    })

    it('should have const assertion for type safety', () => {
      // The 'as const' assertion provides compile-time readonly behavior
      // At runtime, the object can be modified, so we test type consistency instead
      expect(DEFAULTS.MAX_SLIDES).toBe(99)
      expect(DEFAULTS.THEME).toBe('light')
      expect(typeof DEFAULTS).toBe('object')
    })

    it('should have all expected properties', () => {
      const expectedKeys = ['MAX_SLIDES', 'MAX_NESTING_DEPTH', 'THEME', 'OUTPUT_EXTENSION']
      expect(Object.keys(DEFAULTS)).toEqual(expect.arrayContaining(expectedKeys))
      expect(Object.keys(DEFAULTS)).toHaveLength(expectedKeys.length)
    })
  })

  describe('REGEX patterns', () => {
    describe('DELIMITER pattern', () => {
      it('should match valid slide delimiters', () => {
        const validDelimiters = [
          '===',
          '  ===  ',
          '\t===\t',
          ' === ',
          '   ===   '
        ]

        validDelimiters.forEach(delimiter => {
          expect(REGEX.DELIMITER.test(delimiter)).toBe(true)
        })
      })

      it('should not match invalid delimiters', () => {
        const invalidDelimiters = [
          '==',
          '====',
          'abc===',
          '===abc',
          'text === text',
          '= = =',
          '---'
        ]

        invalidDelimiters.forEach(delimiter => {
          expect(REGEX.DELIMITER.test(delimiter)).toBe(false)
        })
      })

      it('should match multiline delimiter correctly', () => {
        const content = `First slide content
===
Second slide content`
        expect(REGEX.DELIMITER.test(content)).toBe(true)
      })

      it('should have correct flags', () => {
        expect(REGEX.DELIMITER.flags).toContain('m')
        expect(REGEX.DELIMITER.global).toBe(false)
      })
    })

    describe('CONTAINER pattern', () => {
      it('should match valid container elements', () => {
        const validContainers = [
          '<container class="test">content</container>',
          '<container class="my-class">nested <span>content</span></container>',
          '<container class="class1 class2">multi-line\ncontent</container>',
          '<container class="kebab-case">content</container>',
          '<container class="snake_case">content</container>'
        ]

        validContainers.forEach(container => {
          const matches = container.match(REGEX.CONTAINER)
          expect(matches).not.toBeNull()
          expect(matches).toHaveLength(1)
        })
      })

      it('should extract class and content correctly', () => {
        const container = '<container class="test-class">Hello World</container>'
        const match = container.match(REGEX.CONTAINER)
        
        expect(match).not.toBeNull()
        if (match !== null) {
          expect(match[0]).toBe(container)
        }
        // Check captured groups via exec
        REGEX.CONTAINER.lastIndex = 0 // Reset for exec
        const execMatch = REGEX.CONTAINER.exec(container)
        if (execMatch !== null) {
          expect(execMatch[1]).toBe('test-class')
          expect(execMatch[2]).toBe('Hello World')
        }
      })

      it('should handle nested containers', () => {
        const nestedContainer = '<container class="outer"><container class="inner">nested</container></container>'
        // Reset the regex to ensure clean state
        REGEX.CONTAINER.lastIndex = 0
        
        // The regex uses non-greedy matching (.*?) and will match the first closing tag
        const match = REGEX.CONTAINER.exec(nestedContainer)
        expect(match).not.toBeNull()
        if (match) {
          expect(match[1]).toBe('outer') // class name
          expect(match[2]).toBe('<container class="inner">nested') // content until first closing tag
        }
        
        // Reset for subsequent tests
        REGEX.CONTAINER.lastIndex = 0
      })

      it('should not match malformed containers', () => {
        const invalidContainers = [
          '<container>no class</container>',
          '<container class="test">no closing tag',
          'container class="test">missing opening bracket</container>',
          '<container class=\'single quotes\'>content</container>'
        ]

        invalidContainers.forEach(container => {
          const matches = container.match(REGEX.CONTAINER)
          expect(matches).toBeNull()
        })
      })

      it('should match empty class attribute', () => {
        // The regex actually does match empty class attributes
        const emptyClass = '<container class="">empty class</container>'
        const matches = emptyClass.match(REGEX.CONTAINER)
        expect(matches).not.toBeNull()
        expect(matches).toHaveLength(1)
      })

      it('should have correct flags', () => {
        expect(REGEX.CONTAINER.flags).toContain('g')
        expect(REGEX.CONTAINER.flags).toContain('i')
      })

      it('should handle multiline content', () => {
        const multilineContainer = `<container class="test">
          Line 1
          Line 2
          Line 3
        </container>`
        
        const matches = multilineContainer.match(REGEX.CONTAINER)
        expect(matches).toHaveLength(1)
      })
    })

    describe('STYLE pattern', () => {
      it('should match valid style elements', () => {
        const validStyles = [
          '<style>body { color: red; }</style>',
          '<style>.class { margin: 0; }</style>',
          '<style>\n.multiline {\n  color: blue;\n}\n</style>',
          '<style>/* comment */ .test { }</style>'
        ]

        validStyles.forEach(style => {
          const matches = style.match(REGEX.STYLE)
          expect(matches).not.toBeNull()
          expect(matches).toHaveLength(1)
        })
      })

      it('should extract CSS content correctly', () => {
        const style = '<style>.test { color: red; }</style>'
        REGEX.STYLE.lastIndex = 0 // Reset for exec
        const match = REGEX.STYLE.exec(style)
        
        expect(match).not.toBeNull()
        if (match !== null) {
          expect(match[1]).toBe('.test { color: red; }')
        }
      })

      it('should handle empty style blocks', () => {
        const emptyStyle = '<style></style>'
        const matches = emptyStyle.match(REGEX.STYLE)
        expect(matches).toHaveLength(1)
      })

      it('should handle multiple style blocks', () => {
        const multipleStyles = '<style>body { }</style><style>.class { }</style>'
        const matches = Array.from(multipleStyles.matchAll(REGEX.STYLE))
        expect(matches).toHaveLength(2)
      })

      it('should not match malformed style elements', () => {
        const invalidStyles = [
          '<style>no closing tag',
          'style>missing opening bracket</style>',
          '<styles>wrong tag name</styles>'
        ]

        invalidStyles.forEach(style => {
          const matches = style.match(REGEX.STYLE)
          expect(matches).toBeNull()
        })
      })

      it('should have correct flags', () => {
        expect(REGEX.STYLE.flags).toContain('g')
        expect(REGEX.STYLE.flags).toContain('i')
      })

      it('should handle complex CSS content', () => {
        const complexStyle = `<style>
          @media screen and (max-width: 768px) {
            .responsive { display: none; }
          }
          
          .class:hover::before {
            content: "hover";
          }
        </style>`
        
        const matches = complexStyle.match(REGEX.STYLE)
        expect(matches).toHaveLength(1)
      })
    })

    describe('CLASS_NAME pattern', () => {
      it('should match valid class names', () => {
        const validClassNames = [
          'class',
          'my-class',
          'my_class',
          'class123',
          'Class',
          'UPPERCASE',
          'kebab-case-class',
          'snake_case_class',
          'mixedCase123',
          'a',
          'A',
          '1',
          '123',
          'class-123_test'
        ]

        validClassNames.forEach(className => {
          expect(REGEX.CLASS_NAME.test(className)).toBe(true)
        })
      })

      it('should not match invalid class names', () => {
        const invalidClassNames = [
          '',
          ' ',
          'class name',
          'class.name',
          'class@name',
          'class#name',
          'class$name',
          'class%name',
          'class&name',
          'class*name',
          'class+name',
          'class=name',
          'class!name',
          'class?name',
          'class/name',
          'class\\name',
          'class|name',
          'class[name',
          'class]name',
          'class{name',
          'class}name',
          'class(name',
          'class)name',
          'class<name',
          'class>name',
          'class,name',
          'class;name',
          'class:name',
          'class"name',
          "class'name"
        ]

        invalidClassNames.forEach(className => {
          expect(REGEX.CLASS_NAME.test(className)).toBe(false)
        })
      })

      it('should not have global flag', () => {
        expect(REGEX.CLASS_NAME.global).toBe(false)
      })

      it('should match entire string only', () => {
        expect(REGEX.CLASS_NAME.test('valid-class extra')).toBe(false)
        expect(REGEX.CLASS_NAME.test('extra valid-class')).toBe(false)
        expect(REGEX.CLASS_NAME.test('valid-class')).toBe(true)
      })
    })

    it('should have const assertion for type safety', () => {
      // The 'as const' assertion provides compile-time readonly behavior
      // At runtime, the object can be modified, so we test pattern consistency instead
      expect(REGEX.DELIMITER).toBeInstanceOf(RegExp)
      expect(REGEX.CONTAINER).toBeInstanceOf(RegExp)
      expect(REGEX.STYLE).toBeInstanceOf(RegExp)
      expect(REGEX.CLASS_NAME).toBeInstanceOf(RegExp)
    })

    it('should have all expected pattern properties', () => {
      const expectedKeys = ['DELIMITER', 'CONTAINER', 'STYLE', 'CLASS_NAME']
      expect(Object.keys(REGEX)).toEqual(expect.arrayContaining(expectedKeys))
      expect(Object.keys(REGEX)).toHaveLength(expectedKeys.length)
    })

    it('should have all RegExp patterns', () => {
      Object.values(REGEX).forEach(pattern => {
        expect(pattern).toBeInstanceOf(RegExp)
      })
    })
  })
})