// Runtime JavaScript Tests
// Tests for runtime JavaScript generation

import { describe, it, expect } from 'vitest'
import { getRuntimeJS } from './runtime.js'

describe('Runtime JavaScript', () => {
  describe('getRuntimeJS function', () => {
    it('should return JavaScript as string', () => {
      const result = getRuntimeJS()

      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(1000)
    })

    it('should be wrapped in IIFE for isolation', () => {
      const result = getRuntimeJS()

      expect(result).toMatch(/^\(function\(\)\s*\{/)
      expect(result).toMatch(/\}\)\(\);\s*$/)
    })

    it('should use strict mode', () => {
      const result = getRuntimeJS()

      expect(result).toContain("'use strict'")
    })

    it('should define navigation object', () => {
      const result = getRuntimeJS()

      expect(result).toContain('const navigation = {')
      expect(result).toContain('current: 0')
      expect(result).toContain('total: 0')
    })

    it('should include core navigation methods', () => {
      const result = getRuntimeJS()

      expect(result).toContain('init()')
      expect(result).toContain('goToSlide(')
      expect(result).toContain('nextSlide()')
      expect(result).toContain('prevSlide()')
      expect(result).toContain('firstSlide()')
      expect(result).toContain('lastSlide()')
      expect(result).toContain('updateCounter()')
    })

    it('should include keyboard event handling', () => {
      const result = getRuntimeJS()

      expect(result).toContain("addEventListener('keydown'")
      expect(result).toContain("'ArrowRight'")
      expect(result).toContain("'ArrowLeft'")
      expect(result).toContain("'Space'")
      expect(result).toContain("'Home'")
      expect(result).toContain("'End'")
      expect(result).toContain("'f'")
      expect(result).toContain("'F'")
    })

    it('should include mouse click navigation', () => {
      const result = getRuntimeJS()

      expect(result).toContain("addEventListener('click'")
      expect(result).toContain('.closest(')
      expect(result).toContain('getBoundingClientRect()')
      expect(result).toContain('clickX > centerX')
    })

    it('should include touch/swipe navigation', () => {
      const result = getRuntimeJS()

      expect(result).toContain("addEventListener('touchstart'")
      expect(result).toContain("addEventListener('touchend'")
      expect(result).toContain('touchStartX')
      expect(result).toContain('touchStartY')
      expect(result).toContain('deltaX')
      expect(result).toContain('deltaY')
      expect(result).toContain('Math.abs(deltaX) > Math.abs(deltaY)')
    })

    it('should include fullscreen functionality', () => {
      const result = getRuntimeJS()

      expect(result).toContain('toggleFullscreen()')
      expect(result).toContain('requestFullscreen()')
      expect(result).toContain('exitFullscreen()')
      expect(result).toContain('document.fullscreenElement')
    })

    it('should include accessibility features', () => {
      const result = getRuntimeJS()

      expect(result).toContain('announceSlideChange()')
      expect(result).toContain("'aria-live'")
      expect(result).toContain("'aria-atomic'")
      expect(result).toContain('slide-announcer')
    })

    it('should include slide transition logic', () => {
      const result = getRuntimeJS()

      expect(result).toContain('.curtains-stage')
      expect(result).toContain('translateX(')
      expect(result).toContain('this.current * 100')
    })

    it('should include wrap-around navigation logic', () => {
      const result = getRuntimeJS()

      expect(result).toContain('if (newIndex >= this.total)')
      expect(result).toContain('newIndex = 0; // Wrap to first slide')
      expect(result).toContain('else if (newIndex < 0)')
      expect(result).toContain('newIndex = this.total - 1; // Wrap to last slide')
    })

    it('should include counter updates', () => {
      const result = getRuntimeJS()

      expect(result).toContain('.curtains-counter')
      expect(result).toContain('textContent')
      expect(result).toContain('this.current + 1')
      expect(result).toContain('this.total')
      expect(result).toContain('document.title')
    })

    it('should handle DOM initialization', () => {
      const result = getRuntimeJS()

      expect(result).toContain('document.readyState')
      expect(result).toContain("'loading'")
      expect(result).toContain("addEventListener('DOMContentLoaded'")
      expect(result).toContain('navigation.init()')
    })

    it('should export navigation for debugging', () => {
      const result = getRuntimeJS()

      expect(result).toContain('window.curtainsNavigation = navigation')
    })

    it('should handle window resize events', () => {
      const result = getRuntimeJS()

      expect(result).toContain("addEventListener('resize'")
      expect(result).toContain('setTimeout(')
      expect(result).toContain('stage.style.transform')
    })

    it('should prevent default for navigation keys', () => {
      const result = getRuntimeJS()

      expect(result).toContain('preventDefault()')
      expect(result).toContain('navKeys.includes(e.key)')
      expect(result).toContain("['ArrowRight', 'ArrowLeft', 'Space', 'Home', 'End', 'f', 'F']")
    })

    it('should handle error cases gracefully', () => {
      const result = getRuntimeJS()

      expect(result).toContain('.catch(err =>')
      expect(result).toContain('console.warn(')
      expect(result).toContain('Failed to enter fullscreen')
      expect(result).toContain('Failed to exit fullscreen')
    })

    it('should include console logging for debugging', () => {
      const result = getRuntimeJS()

      expect(result).toContain('console.log(')
      expect(result).toContain('Curtains initialized:')
      expect(result).toContain('slides')
    })

    it('should handle slide count detection', () => {
      const result = getRuntimeJS()

      expect(result).toContain("querySelectorAll('.curtains-slide')")
      expect(result).toContain('.length')
      expect(result).toContain('this.total =')
    })

    it('should include proper event listener options', () => {
      const result = getRuntimeJS()

      expect(result).toContain('{ passive: true }')
    })

    it('should handle touch event coordinates', () => {
      const result = getRuntimeJS()

      expect(result).toContain('e.touches[0]')
      expect(result).toContain('e.changedTouches[0]')
      expect(result).toContain('touch.clientX')
      expect(result).toContain('touch.clientY')
    })

    it('should validate swipe direction and distance', () => {
      const result = getRuntimeJS()

      expect(result).toContain('Math.abs(deltaX) > 50')
      expect(result).toContain('if (deltaX > 0)')
      expect(result).toContain('this.prevSlide()')
      expect(result).toContain('this.nextSlide()')
    })

    it('should create screen reader announcements properly', () => {
      const result = getRuntimeJS()

      expect(result).toContain("getElementById('slide-announcer')")
      expect(result).toContain("announcer = document.createElement('div')")
      expect(result).toContain("setAttribute('aria-live', 'polite')")
      expect(result).toContain("setAttribute('aria-atomic', 'true')")
      expect(result).toContain("announcer.style.position = 'absolute'")
      expect(result).toContain("announcer.style.left = '-10000px'")
    })

    it('should avoid interfering with interactive elements', () => {
      const result = getRuntimeJS()

      expect(result).toContain("e.target.closest('a, button, input, textarea, select')")
      expect(result).toContain('return')
    })

    it('should have proper JavaScript syntax', () => {
      const result = getRuntimeJS()

      // Check for balanced braces and parentheses
      const openBraces = (result.match(/{/g) ?? []).length
      const closeBraces = (result.match(/}/g) ?? []).length
      expect(openBraces).toBe(closeBraces)

      const openParens = (result.match(/\(/g) ?? []).length
      const closeParens = (result.match(/\)/g) ?? []).length
      expect(openParens).toBe(closeParens)

      // Should not contain undefined variables
      expect(result).not.toContain('undefined')
      expect(result).not.toContain('[object Object]')
    })

    it('should be properly trimmed', () => {
      const result = getRuntimeJS()

      expect(result).not.toMatch(/^\s/)
      expect(result).not.toMatch(/\s$/)
      expect(result.trim()).toBe(result)
    })
  })

  describe('JavaScript functionality validation', () => {
    it('should contain all required navigation features', () => {
      const result = getRuntimeJS()

      // Core navigation
      expect(result).toContain('goToSlide(')
      expect(result).toContain('nextSlide()')
      expect(result).toContain('prevSlide()')
      expect(result).toContain('firstSlide()')
      expect(result).toContain('lastSlide()')

      // Event handling
      expect(result).toContain('keydown')
      expect(result).toContain('click')
      expect(result).toContain('touchstart')
      expect(result).toContain('touchend')
      expect(result).toContain('resize')

      // Accessibility
      expect(result).toContain('aria-live')
      expect(result).toContain('aria-atomic')

      // Fullscreen
      expect(result).toContain('toggleFullscreen')
      expect(result).toContain('requestFullscreen')
      expect(result).toContain('exitFullscreen')
    })

    it('should validate template literal syntax', () => {
      const result = getRuntimeJS()

      // Should use proper template literals
      expect(result).toContain('`translateX(-${')
      expect(result).toContain('`${this.current + 1}/${')
      expect(result).toContain('`Curtains initialized: ${')
      expect(result).toContain('`Slide ${')
    })
  })
})