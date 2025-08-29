// CSS Merger
// Handles CSS merging in correct cascade order

/**
 * Task 2: Merge CSS in correct order
 * Order: base styles → theme styles → global CSS → slide-specific CSS
 */
export async function mergeCSS(params: {
  globalCSS: string;
  slidesCSS: string[];
  theme: 'light' | 'dark';
}): Promise<string> {
  // Embedded template CSS content
  const baseCSS = getTemplateCSSContent();

  // Get base layout styles (these go before theme variables)
  const layoutCSS = getBaseLayoutCSS();

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
    ...params.slidesCSS.filter(css => css.trim()),
  ];

  return cssLayers.filter(layer => layer !== undefined).join('\n');
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
  position: absolute;
  width: 1920px;
  height: 1080px;
  transform-origin: center center;
  background-color: var(--curtains-bg-primary, #ffffff);
  overflow: hidden;
  left: 50%;
  top: 50%;
  margin-left: -960px;
  margin-top: -540px;
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
  font-size: 2rem;
  line-height: 1.8;
}

/* Content wrapper with padding */
.curtains-content {
  padding: 4rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

/* Typography Scale */
.curtains-slide h1 {
  font-size: 4rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.curtains-slide h2 {
  font-size: 3.2rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
  line-height: 1.3;
}

.curtains-slide h3 {
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.curtains-slide h4 {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.875rem;
  line-height: 1.5;
}

.curtains-slide h5 {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.curtains-slide h6 {
  font-size: 1.5rem;
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
  font-size: 1.75rem;
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

/* Column layout scaling */
.columns {
  font-size: inherit;
}

.columns * {
  font-size: inherit;
}
  `.trim();
}

/**
 * Get the embedded template CSS content
 * This is bundled directly into the code to avoid filesystem dependencies
 */
export function getTemplateCSSContent(): string {
  return `/* Curtains Presentation Tool - Theme Variables */

:root {
  /* Light Theme Variables */
  --curtains-bg-primary: #ffffff;
  --curtains-bg-secondary: #f8fafc;
  --curtains-bg-tertiary: #f1f5f9;
  
  --curtains-text-primary: #0f172a;
  --curtains-text-secondary: #475569;
  --curtains-text-muted: #64748b;
  --curtains-text-inverse: #ffffff;
  
  --curtains-accent-primary: #3b82f6;
  --curtains-accent-secondary: #1e40af;
  --curtains-accent-tertiary: #dbeafe;
  
  --curtains-link-default: #2563eb;
  --curtains-link-hover: #1d4ed8;
  --curtains-link-visited: #7c3aed;
  
  --curtains-border-light: #e2e8f0;
  --curtains-border-medium: #cbd5e1;
  --curtains-border-strong: #94a3b8;
  
  --curtains-code-bg: #f8fafc;
  --curtains-code-border: #e2e8f0;
  --curtains-code-text: #374151;
  --curtains-code-keyword: #dc2626;
  --curtains-code-string: #059669;
  --curtains-code-comment: #6b7280;
  
  --curtains-counter-bg: rgba(15, 23, 42, 0.85);
  --curtains-counter-text: #ffffff;
  --curtains-counter-border: rgba(255, 255, 255, 0.2);
  
  --curtains-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --curtains-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --curtains-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  
  --curtains-success: #10b981;
  --curtains-warning: #f59e0b;
  --curtains-error: #ef4444;
  --curtains-info: #3b82f6;
}

[data-theme="dark"] {
  /* Dark Theme Variables */
  --curtains-bg-primary: #0f172a;
  --curtains-bg-secondary: #1e293b;
  --curtains-bg-tertiary: #334155;
  
  --curtains-text-primary: #f8fafc;
  --curtains-text-secondary: #cbd5e1;
  --curtains-text-muted: #94a3b8;
  --curtains-text-inverse: #0f172a;
  
  --curtains-accent-primary: #60a5fa;
  --curtains-accent-secondary: #3b82f6;
  --curtains-accent-tertiary: #1e3a8a;
  
  --curtains-link-default: #60a5fa;
  --curtains-link-hover: #93c5fd;
  --curtains-link-visited: #a78bfa;
  
  --curtains-border-light: #334155;
  --curtains-border-medium: #475569;
  --curtains-border-strong: #64748b;
  
  --curtains-code-bg: #1e293b;
  --curtains-code-border: #374151;
  --curtains-code-text: #e5e7eb;
  --curtains-code-keyword: #fca5a5;
  --curtains-code-string: #6ee7b7;
  --curtains-code-comment: #9ca3af;
  
  --curtains-counter-bg: rgba(248, 250, 252, 0.9);
  --curtains-counter-text: #0f172a;
  --curtains-counter-border: rgba(15, 23, 42, 0.2);
  
  --curtains-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --curtains-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --curtains-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  
  --curtains-success: #34d399;
  --curtains-warning: #fbbf24;
  --curtains-error: #f87171;
  --curtains-info: #60a5fa;
}

/* Base Styles */
.curtains-root {
  background-color: var(--curtains-bg-primary);
  color: var(--curtains-text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.curtains-stage {
  background-color: var(--curtains-bg-primary);
}

.curtains-slide {
  background-color: var(--curtains-bg-primary);
  color: var(--curtains-text-primary);
}

/* Typography */
.curtains-slide h1,
.curtains-slide h2,
.curtains-slide h3,
.curtains-slide h4,
.curtains-slide h5,
.curtains-slide h6 {
  color: var(--curtains-text-primary);
}

.curtains-slide p {
  color: var(--curtains-text-primary);
}

.curtains-slide small,
.curtains-slide .text-muted {
  color: var(--curtains-text-muted);
}

/* Links */
.curtains-slide a {
  color: var(--curtains-link-default);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.curtains-slide a:hover {
  color: var(--curtains-link-hover);
  border-bottom-color: var(--curtains-link-hover);
}

.curtains-slide a:visited {
  color: var(--curtains-link-visited);
}

/* Code Blocks */
.curtains-slide pre,
.curtains-slide code {
  background-color: var(--curtains-code-bg);
  color: var(--curtains-code-text);
  border: 1px solid var(--curtains-code-border);
}

.curtains-slide pre {
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  box-shadow: var(--curtains-shadow-sm);
}

.curtains-slide code {
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
  font-size: 0.875em;
}

.curtains-slide pre code {
  background-color: transparent;
  border: none;
  padding: 0;
  font-size: inherit;
}

/* Lists */
.curtains-slide ul,
.curtains-slide ol {
  color: var(--curtains-text-primary);
}

.curtains-slide li {
  margin-bottom: 0.5rem;
}

.curtains-slide ul li::marker {
  color: var(--curtains-accent-primary);
}

.curtains-slide ol li::marker {
  color: var(--curtains-accent-primary);
  font-weight: 600;
}

/* Blockquotes */
.curtains-slide blockquote {
  background-color: var(--curtains-bg-secondary);
  border-left: 4px solid var(--curtains-accent-primary);
  padding: 1rem 1.5rem;
  margin: 1.5rem 0;
  border-radius: 0 6px 6px 0;
  color: var(--curtains-text-secondary);
  font-style: italic;
}

/* Tables */
.curtains-slide table {
  background-color: var(--curtains-bg-secondary);
  border-collapse: collapse;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: var(--curtains-shadow-sm);
}

.curtains-slide th {
  background-color: var(--curtains-accent-tertiary);
  color: var(--curtains-text-primary);
  font-weight: 600;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--curtains-border-medium);
}

.curtains-slide td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--curtains-border-light);
  color: var(--curtains-text-primary);
}

.curtains-slide tr:last-child td {
  border-bottom: none;
}

.curtains-slide tr:hover {
  background-color: var(--curtains-bg-tertiary);
}

/* Horizontal Rules */
.curtains-slide hr {
  border: none;
  border-top: 2px solid var(--curtains-border-medium);
  margin: 2rem 0;
  opacity: 0.6;
}

/* Counter Overlay */
.curtains-counter {
  background-color: var(--curtains-counter-bg);
  color: var(--curtains-counter-text);
  border: 1px solid var(--curtains-counter-border);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 20px;
  padding: 0.5rem 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: var(--curtains-shadow-md);
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
  transition: all 0.3s ease;
}

/* Images */
.curtains-slide img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  box-shadow: var(--curtains-shadow-md);
}

/* Emphasis */
.curtains-slide strong {
  color: var(--curtains-text-primary);
  font-weight: 700;
}

.curtains-slide em {
  color: var(--curtains-text-secondary);
  font-style: italic;
}

/* Utility Classes */
.curtains-slide .text-accent {
  color: var(--curtains-accent-primary);
}

.curtains-slide .bg-accent {
  background-color: var(--curtains-accent-tertiary);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.curtains-slide .text-success {
  color: var(--curtains-success);
}

.curtains-slide .text-warning {
  color: var(--curtains-warning);
}

.curtains-slide .text-error {
  color: var(--curtains-error);
}

.curtains-slide .text-info {
  color: var(--curtains-info);
}

/* Focus states for accessibility */
.curtains-slide a:focus {
  outline: 2px solid var(--curtains-accent-primary);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Smooth transitions for theme switching */
.curtains-root *,
.curtains-root *::before,
.curtains-root *::after {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}`;
}
