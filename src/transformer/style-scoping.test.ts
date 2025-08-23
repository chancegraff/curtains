import { scopeStyles } from './style-scoping.js'

describe('scopeStyles', () => {
  describe('basic scoping', () => {
    it('should scope simple CSS selectors with nth-child', () => {
      const css = '.hero { color: red; }'
      const result = scopeStyles(css, 0)
      
      expect(result).toBe('.curtains-slide:nth-child(1) .hero { color: red; }')
    })
    
    it('should scope multiple selectors', () => {
      const css = '.hero, .title { color: red; }'
      const result = scopeStyles(css, 1)
      
      expect(result).toBe('.curtains-slide:nth-child(2) .hero, .curtains-slide:nth-child(2) .title { color: red; }')
    })
    
    it('should handle different slide indices', () => {
      const css = '.content { margin: 20px; }'
      
      expect(scopeStyles(css, 0)).toBe('.curtains-slide:nth-child(1) .content { margin: 20px; }')
      expect(scopeStyles(css, 2)).toBe('.curtains-slide:nth-child(3) .content { margin: 20px; }')
      expect(scopeStyles(css, 9)).toBe('.curtains-slide:nth-child(10) .content { margin: 20px; }')
    })
  })
  
  describe('global rules handling', () => {
    it('should NOT scope @keyframes rules', () => {
      const css = `@keyframes slideIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }`
      const result = scopeStyles(css, 0)
      
      expect(result).toBe(css)
    })
    
    it('should NOT scope @media queries', () => {
      const css = `@media (max-width: 768px) {
        .content { font-size: 14px; }
      }`
      const result = scopeStyles(css, 0)
      
      expect(result).toBe(css)
    })
    
    it('should NOT scope @import statements', () => {
      const css = '@import url("https://fonts.googleapis.com/css2?family=Inter");'
      const result = scopeStyles(css, 0)
      
      expect(result).toBe(css)
    })
    
    it('should NOT scope @font-face declarations', () => {
      const css = `@font-face {
        font-family: 'CustomFont';
        src: url('font.woff2');
      }`
      const result = scopeStyles(css, 0)
      
      expect(result).toBe(css)
    })
  })
  
  describe('complex CSS structures', () => {
    it('should handle nested CSS with proper indentation', () => {
      const css = `
.container {
  display: flex;
}
  .container .item {
    flex: 1;
  }`
      
      const result = scopeStyles(css, 0)
      const expected = `
.curtains-slide:nth-child(1) .container {
  display: flex;
}
  .curtains-slide:nth-child(1) .container .item {
    flex: 1;
  }`
      
      expect(result).toBe(expected)
    })
    
    it('should handle CSS with comments', () => {
      const css = `
/* Main container styles */
.container {
  display: block;
}
/* Item styles */
.item { color: blue; }`
      
      const result = scopeStyles(css, 0)
      const expected = `
/* Main container styles */
.curtains-slide:nth-child(1) .container {
  display: block;
}
/* Item styles */
.curtains-slide:nth-child(1) .item { color: blue; }`
      
      expect(result).toBe(expected)
    })
    
    it('should handle pseudo-selectors', () => {
      const css = '.button:hover { background: blue; }'
      const result = scopeStyles(css, 0)
      
      expect(result).toBe('.curtains-slide:nth-child(1) .button:hover { background: blue; }')
    })
    
    it('should handle combinators', () => {
      const css = '.parent > .child { margin: 10px; }'
      const result = scopeStyles(css, 0)
      
      expect(result).toBe('.curtains-slide:nth-child(1) .parent > .child { margin: 10px; }')
    })
  })
  
  describe('mixed content', () => {
    it('should handle mix of global and scoped rules', () => {
      const css = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.hero {
  animation: fadeIn 1s ease-in;
  background: linear-gradient(45deg, #667eea, #764ba2);
}

@media (max-width: 768px) {
  .hero {
    padding: 1rem;
  }
}`
      
      const result = scopeStyles(css, 1)
      const expected = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.curtains-slide:nth-child(2) .hero {
  animation: fadeIn 1s ease-in;
  background: linear-gradient(45deg, #667eea, #764ba2);
}

@media (max-width: 768px) {
  .hero {
    padding: 1rem;
  }
}`
      
      expect(result).toBe(expected)
    })
  })
  
  describe('edge cases', () => {
    it('should handle empty CSS', () => {
      expect(scopeStyles('', 0)).toBe('')
      expect(scopeStyles('   ', 0)).toBe('')
    })
    
    it('should handle CSS with only whitespace and comments', () => {
      const css = `
      /* Just a comment */
      
      /* Another comment */
      `
      const result = scopeStyles(css, 0)
      expect(result).toBe(css)
    })
    
    it('should not double-scope existing curtains-slide selectors', () => {
      const css = '.curtains-slide .existing { color: red; }'
      const result = scopeStyles(css, 0)
      
      // Should not be double-scoped
      expect(result).toBe('.curtains-slide .existing { color: red; }')
    })
    
    it('should handle selectors that start with pseudo-elements', () => {
      const css = '::before { content: ""; }'
      const result = scopeStyles(css, 0)
      
      expect(result).toBe('.curtains-slide:nth-child(1) ::before { content: ""; }')
    })
    
    it('should handle empty selectors in comma-separated list', () => {
      const css = '.valid, , .another { color: red; }'
      const result = scopeStyles(css, 0)
      
      // Empty selector should remain empty, valid ones should be scoped
      expect(result).toBe('.curtains-slide:nth-child(1) .valid, , .curtains-slide:nth-child(1) .another { color: red; }')
    })
    
    it('should handle pseudo-selectors at start of selector', () => {
      const css = ':hover { color: blue; }'
      const result = scopeStyles(css, 0)
      
      expect(result).toBe('.curtains-slide:nth-child(1):hover { color: blue; }')
    })
    
    it('should handle direct child combinators at start of selector', () => {
      const css = '> .child { margin: 10px; }'
      const result = scopeStyles(css, 0)
      
      expect(result).toBe('.curtains-slide:nth-child(1)> .child { margin: 10px; }')
    })
    
    it('should handle adjacent sibling combinators at start of selector', () => {
      const css = '+ .sibling { padding: 5px; }'
      const result = scopeStyles(css, 0)
      
      expect(result).toBe('.curtains-slide:nth-child(1)+ .sibling { padding: 5px; }')
    })
    
    it('should handle general sibling combinators at start of selector', () => {
      const css = '~ .sibling { border: 1px solid; }'
      const result = scopeStyles(css, 0)
      
      expect(result).toBe('.curtains-slide:nth-child(1)~ .sibling { border: 1px solid; }')
    })
    
    it('should handle malformed CSS with empty selector before brace', () => {
      const css = ' { color: red; }'
      const result = scopeStyles(css, 0)
      
      // Should pass through malformed CSS unchanged
      expect(result).toBe(' { color: red; }')
    })
    
    it('should handle CSS line with brace but no selector part', () => {
      const css = '{ color: blue; }'
      const result = scopeStyles(css, 0)
      
      // Should pass through malformed CSS unchanged
      expect(result).toBe('{ color: blue; }')
    })
  })
  
  describe('real-world CSS examples', () => {
    it('should handle complex presentation styles', () => {
      const css = `
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
}

.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.column h3 {
  margin-bottom: 1rem;
  color: #333;
}

@media (max-width: 768px) {
  .columns {
    grid-template-columns: 1fr;
  }
}`
      
      const result = scopeStyles(css, 2)
      const expected = `
.curtains-slide:nth-child(3) .hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
}

.curtains-slide:nth-child(3) .columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.curtains-slide:nth-child(3) .column h3 {
  margin-bottom: 1rem;
  color: #333;
}

@media (max-width: 768px) {
  .columns {
    grid-template-columns: 1fr;
  }
}`
      
      expect(result).toBe(expected)
    })
  })
})