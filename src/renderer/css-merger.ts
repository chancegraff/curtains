// CSS Merger
// Handles CSS merging in correct cascade order

import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * Task 2: Merge CSS in correct order
 * Order: base styles → theme styles → global CSS → slide-specific CSS
 */
export async function mergeCSS(params: {
  globalCSS: string
  slidesCSS: string[]
  theme: 'light' | 'dark'
}): Promise<string> {
  // Load base styles from template
  // Note: Using relative path from project root
  const templatePath = join(process.cwd(), 'src', 'templates', 'style.css')
  const baseCSS = await readFile(templatePath, 'utf-8')

  // Get base layout styles (these go before theme variables)
  const layoutCSS = getBaseLayoutCSS()

  // Merge in correct cascade order
  const cssLayers = [
    '/* Base Layout Styles */',
    layoutCSS,
    '',
    '/* Theme Variables and Base Styles */',
    baseCSS,
    '',
    '/* Global User Styles */',
    params.globalCSS,
    '',
    '/* Slide-specific Scoped Styles */',
    ...params.slidesCSS.filter(css => css.trim())
  ]

  return cssLayers.filter(layer => layer !== undefined).join('\n')
}

/**
 * Base layout styles that must come before theme variables
 * These define the core presentation structure
 */
export function getBaseLayoutCSS(): string {
  return `
/* Reset and Box Model */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
}

/* Core Presentation Structure */
.curtains-root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: #000000;
}

/* Responsive viewport with 16:9 aspect ratio */
.curtains-viewport {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000000;
}

.curtains-stage-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 177.78vh; /* 16:9 aspect ratio based on height */
  max-height: 56.25vw; /* 16:9 aspect ratio based on width */
  background-color: var(--curtains-bg-primary, #ffffff);
  overflow: hidden;
}

.curtains-stage {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  transition: transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
  transform: translateX(0%);
}

.curtains-slide {
  width: 100%;
  height: 100%;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  font-size: clamp(1.25rem, 2.5vmin, 2rem);
  line-height: 1.8;
}

/* Content wrapper with padding */
.curtains-content {
  padding: clamp(1.5rem, 4vmin, 6rem);
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

/* Typography Scale */
.curtains-slide h1 {
  font-size: clamp(2.5rem, 6vmin, 5rem);
  font-weight: 700;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.curtains-slide h2 {
  font-size: clamp(2rem, 4.5vmin, 4rem);
  font-weight: 600;
  margin-bottom: 1.25rem;
  line-height: 1.3;
}

.curtains-slide h3 {
  font-size: clamp(1.5rem, 3.5vmin, 3rem);
  font-weight: 600;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.curtains-slide h4 {
  font-size: clamp(1.25rem, 3vmin, 2.5rem);
  font-weight: 600;
  margin-bottom: 0.875rem;
  line-height: 1.5;
}

.curtains-slide h5 {
  font-size: clamp(1.125rem, 2.5vmin, 2rem);
  font-weight: 600;
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.curtains-slide h6 {
  font-size: clamp(1rem, 2vmin, 1.75rem);
  font-weight: 600;
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.curtains-slide p {
  margin-bottom: 1.5rem;
  font-size: inherit;
}

.curtains-slide ul,
.curtains-slide ol {
  margin-bottom: 1.5rem;
  padding-left: 2rem;
}

.curtains-slide li {
  margin-bottom: 0.75rem;
  font-size: inherit;
}

.curtains-slide pre {
  margin-bottom: 1.5rem;
  font-size: 1rem;
  line-height: 1.5;
}

.curtains-slide blockquote {
  margin: 2rem 0;
}

.curtains-slide table {
  width: 100%;
  margin-bottom: 1.5rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .curtains-slide {
    font-size: 1.125rem;
  }

  .curtains-content {
    padding: 2rem;
  }

  .curtains-slide h1 {
    font-size: 2.5rem;
  }

  .curtains-slide h2 {
    font-size: 2rem;
  }

  .curtains-slide h3 {
    font-size: 1.75rem;
  }
}

@media (max-width: 480px) {
  .curtains-slide {
    font-size: 1rem;
  }

  .curtains-content {
    padding: 1.5rem;
  }

  .curtains-slide h1 {
    font-size: 2rem;
  }

  .curtains-slide h2 {
    font-size: 1.75rem;
  }
}

/* Large screen breakpoints */
@media (min-width: 1200px) {
  .curtains-slide {
    font-size: clamp(1.5rem, 2.75vmin, 2.25rem);
  }
}

@media (min-width: 1600px) {
  .curtains-slide {
    font-size: clamp(1.75rem, 3vmin, 2.5rem);
  }
}

/* Column layout scaling */
.columns {
  font-size: inherit;
}

.columns * {
  font-size: inherit;
}
  `.trim()
}
