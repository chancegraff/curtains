import { z } from 'zod';

import { type RuntimeConfigSchema } from '../schemas/cli';
import { HTMLOutputSchema } from '../schemas/renderers';
import { type TransformedDocumentSchema } from '../schemas/transformers';
import { getRuntimeJS } from './runtime';
import curtainsStyleCSS from './style.css';

/**
 * Build HTML for all slides
 */
export function buildSlidesHTML(doc: z.infer<typeof TransformedDocumentSchema>): string {
  const slideElements = doc.slides
    .map((slide, _index) => {
      // slide.html already contains .curtains-content wrapper from transform stage
      return `<section class="curtains-slide">${slide.html}</section>`;
    })
    .join('\n');

  // Build proper Curtains HTML structure with viewport, stage wrapper, and stage
  const curtainsHTML = `
<div class="curtains-root" data-theme="dark">
  <div class="curtains-viewport">
    <div class="curtains-stage-wrapper">
      <div class="curtains-stage">
        ${slideElements}
      </div>
    </div>
  </div>
  <div class="curtains-counter" aria-live="polite" aria-atomic="true">1/${doc.slides.length}</div>
</div>`;

  return curtainsHTML;
}

/**
 * Merge CSS from global and slides
 */
export function mergeCSS(options: {
  globalCSS: string;
  slidesCSS: string[];
  theme: 'light' | 'dark';
}): string {
  const { globalCSS, slidesCSS } = options;

  // Base curtains CSS (layout and structure)
  const baseCSS = getBaseCSS();

  // Get Curtains style.css content (theme variables and component styles)
  const curtainsStyleCSS = getCurtainsStyleCSS();

  // Format global user styles with comment label
  const labeledGlobalCSS = globalCSS.trim().length > 0 
    ? `\n/* Global User Styles */\n${globalCSS}`
    : '';

  // Format slide-specific styles with comment label
  const combinedSlidesCSS = slidesCSS.filter(css => css.trim().length > 0).join('\n');
  const labeledSlidesCSS = combinedSlidesCSS.trim().length > 0
    ? `\n/* Slide-Specific Scoped Styles */\n${combinedSlidesCSS}`
    : '';

  // Combine all CSS in order: base layout, theme variables/styles, global, slides
  const cssParts = [
    baseCSS,
    curtainsStyleCSS,
    labeledGlobalCSS,
    labeledSlidesCSS,
  ];

  return cssParts.filter(css => css.trim().length > 0).join('\n');
}

/**
 * Get CSS from style.css file
 * Pure function that returns the Curtains style CSS content
 */
export function getCurtainsStyleCSS(): string {
  // CSS is embedded at build time via esbuild text loader
  return curtainsStyleCSS;
}

/**
 * Get Curtains theme CSS
 * Pure function that returns theme CSS variables
 */
export function getCurtainsThemeCSS(): string {
  return `
/* Curtains Presentation Tool - Theme Variables */
:root {
  /* Light Theme Variables */
  --curtains-bg-primary: #ffffff;
  --curtains-bg-secondary: #f8fafc;
  --curtains-text-primary: #0f172a;
  --curtains-accent-primary: #3b82f6;
  --curtains-link-default: #2563eb;
  --curtains-border-light: #e2e8f0;
  --curtains-code-bg: #f8fafc;
  --curtains-counter-bg: rgba(15, 23, 42, 0.85);
  --curtains-counter-text: #ffffff;
}

[data-theme="dark"] {
  /* Dark Theme Variables */
  --curtains-bg-primary: #0f172a;
  --curtains-bg-secondary: #1e293b;
  --curtains-text-primary: #f8fafc;
  --curtains-accent-primary: #60a5fa;
  --curtains-link-default: #60a5fa;
  --curtains-border-light: #334155;
  --curtains-code-bg: #1e293b;
  --curtains-counter-bg: rgba(248, 250, 252, 0.9);
  --curtains-counter-text: #0f172a;
}

.curtains-counter {
  background-color: var(--curtains-counter-bg);
  color: var(--curtains-counter-text);
  border-radius: 20px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
}`;
}

/**
 * Load theme-specific CSS
 */
export function loadThemeCSS(_theme: 'light' | 'dark'): string {
  // Theme is now handled by CSS variables in style.css
  // Return empty string since themes are managed through data-theme attribute
  return '';
}

/**
 * Get base CSS for curtains
 */
function getBaseCSS(): string {
  return `/* Base Layout Styles */
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
}`;
}

/**
 * Generate runtime JavaScript modules
 * Returns modular runtime components
 */
export function getRuntimeModules(): {
  navigation: string;
  eventHandlers: string;
  initialization: string;
} {
  // Get the complete runtime from runtime.ts
  const fullRuntime = getRuntimeJS();

  // For now, return the full runtime as initialization
  // This can be further modularized if needed
  return {
    navigation: '',
    eventHandlers: '',
    initialization: fullRuntime,
  };
}

/**
 * Compose runtime modules into complete script
 * Pure function that combines runtime modules
 */
export function composeRuntimeScript(config: z.infer<typeof RuntimeConfigSchema>): string {
  const modules = getRuntimeModules();

  // Compose the modules together
  const composedScript = [
    modules.navigation,
    modules.eventHandlers,
    modules.initialization,
  ].filter(module => module.length > 0).join('\n');

  // Add runtime config
  return `
${composedScript}
// Runtime configuration
window.curtainsConfig = ${JSON.stringify(config)};
`;
}

/**
 * Generate runtime JavaScript for navigation
 * Delegates to the modular runtime composition
 */
export function generateRuntimeJS(config: z.infer<typeof RuntimeConfigSchema>): string {
  return composeRuntimeScript(config);
}

/**
 * Build complete HTML document
 */
export function buildCompleteHTML(options: {
  slidesHTML: string;
  css: string;
  runtimeConfig: z.infer<typeof RuntimeConfigSchema>;
  runtimeJS: string;
}): string {
  const { slidesHTML, css, runtimeJS } = options;

  const template = createHTMLTemplate();
  const withMeta = injectMetaTags(template, {
    viewport: 'width=device-width, initial-scale=1.0',
    charset: 'UTF-8',
  });

  // Build the complete document
  const html = withMeta
    .replace('{{TITLE}}', 'Curtains Presentation')
    .replace('{{STYLES}}', `<style>${css}</style>`)
    .replace('{{CONTENT}}', slidesHTML)
    .replace('{{RUNTIME}}', `<script>${runtimeJS}</script>`);

  return html;
}

/**
 * Create base HTML template
 */
export function createHTMLTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
{{META_TAGS}}
<title>{{TITLE}}</title>
{{STYLES}}
</head>
<body>
{{CONTENT}}
{{RUNTIME}}
</body>
</html>`;
}

/**
 * Inject meta tags into HTML template
 */
export function injectMetaTags(html: string, meta: Record<string, string>): string {
  const metaTags = [];

  if (meta.charset) {
    metaTags.push(`<meta charset="${meta.charset}">`);
  }

  if (meta.viewport) {
    metaTags.push(`<meta name="viewport" content="${meta.viewport}">`);
  }

  for (const [name, content] of Object.entries(meta)) {
    if (name !== 'charset' && name !== 'viewport') {
      metaTags.push(`<meta name="${name}" content="${content}">`);
    }
  }

  return html.replace('{{META_TAGS}}', metaTags.join('\n'));
}

/**
 * Simple lightweight HTML formatter for better readability
 * Avoids the 110,000 line Prettier build bloat
 */
export function formatHTML(html: string): string {
  // First, protect <pre> blocks from formatting
  const preBlocks: string[] = [];
  let preIndex = 0;
  
  // Extract pre blocks and replace with placeholders
  const htmlWithPlaceholders = html.replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, (match) => {
    preBlocks.push(match);
    return `___PRE_BLOCK_${preIndex++}___`;
  });
  
  // Split HTML into lines at tag boundaries
  const lines = htmlWithPlaceholders
    .replace(/></g, '>\n<')  // Add newlines between tags
    .replace(/(<\/[^>]+>)([^<\s])/g, '$1\n$2')  // Newline after closing tags if content follows
    .replace(/([^>\s])(<[^/])/g, '$1\n$2')  // Newline before opening tags if content precedes
    .split('\n');
  
  let formatted = '';
  let indent = 0;
  const indentStr = '  '; // 2 spaces per level
  
  for (const rawLine of lines) {
    const line = rawLine.trim();
    
    if (line.length === 0) {
      continue; // Skip empty lines
    }
    
    // Check if line is a closing tag
    const isClosingTag = line.startsWith('</');
    // Check if line is a self-closing tag or void element
    const isSelfClosing = line.includes('/>') || 
      line.match(/<(meta|link|img|br|hr|input|area|base|col|embed|source|track|wbr)\b[^>]*>/i);
    // Check if line is a comment or doctype
    const isSpecialTag = line.startsWith('<!--') || line.startsWith('<!DOCTYPE') || line.startsWith('<!');
    // Check if line opens and closes on same line (inline content)
    const isInlineComplete = !isSelfClosing && !isSpecialTag && 
      line.match(/<[^/][^>]*>.*<\/[^>]+>/);
    
    // Decrease indent before adding closing tags
    if (isClosingTag) {
      indent = Math.max(0, indent - 1);
    }
    
    // Add the line with current indentation
    formatted += indentStr.repeat(indent) + line + '\n';
    
    // Increase indent after opening tags (not self-closing, not inline complete)
    if (!isClosingTag && !isSelfClosing && !isSpecialTag && !isInlineComplete) {
      // Only increase if it's an opening tag
      if (line.startsWith('<') && !line.startsWith('</')) {
        indent++;
      }
    }
  }
  
  // Restore pre blocks without formatting
  let restoredHTML = formatted.trim();
  for (let i = 0; i < preBlocks.length; i++) {
    const placeholder = `___PRE_BLOCK_${i}___`;
    const preBlock = preBlocks[i] ?? '';
    restoredHTML = restoredHTML.replace(placeholder, preBlock);
  }
  
  return restoredHTML;
}

/**
 * Main render stage function
 */
export function renderStage(
  doc: z.infer<typeof TransformedDocumentSchema>,
  config?: z.infer<typeof RuntimeConfigSchema>
): z.infer<typeof HTMLOutputSchema> {
  // Build slides HTML
  const slidesHTML = buildSlidesHTML(doc);

  // Merge all CSS
  const mergedCSS = mergeCSS({
    globalCSS: doc.globalCSS,
    slidesCSS: doc.slides.map(s => s.css),
    theme: config?.theme ?? 'light', // Use config theme or default
  });

  // Use provided config or create defaults
  const runtimeConfig = config ?? {
    input: '',
    output: '',
    theme: 'light' as const,
    timestamp: Date.now(),
    processId: crypto.randomUUID(),
  };

  // Generate runtime JavaScript
  const runtimeJS = generateRuntimeJS(runtimeConfig);

  // Build complete HTML document
  const html = buildCompleteHTML({
    slidesHTML,
    css: mergedCSS,
    runtimeConfig,
    runtimeJS,
  });

  // Format the HTML for better readability
  const formattedHTML = formatHTML(html);

  return HTMLOutputSchema.parse(formattedHTML);
}
