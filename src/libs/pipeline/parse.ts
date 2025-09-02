import type { Root as MdastRoot } from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { z } from 'zod';

import {
  ContainerSchema,
  ExtractedStyleSchema,
  type ParsedSlide,
  ParsedSlideSchema,
  ParserOutputSchema,
} from '../schemas/parsers';

/**
 * Split content into slides based on delimiter
 */
export function splitIntoSlides(content: string): {
  globalContent: string;
  slideContents: string[];
} {
  const delimiter = '===';
  const parts = content.split(delimiter);
  
  // First part is global content
  const globalContent = parts[0] ? parts[0].trim() : '';
  
  // Rest are slide contents
  const slideContents = parts.slice(1).map(s => (s ? s.trim() : '')).filter(s => s.length > 0);
  
  return {
    globalContent,
    slideContents,
  };
}

/**
 * Extract container syntax from content
 */
export function extractContainers(content: string): {
  containers: z.infer<typeof ContainerSchema>[];
  cleaned: string;
} {
  const containers: z.infer<typeof ContainerSchema>[] = [];
  
  // Extract only the top-level container (if any)
  // For HTML containers, we need to handle nesting carefully
  // We need to find matching open/close tags to handle nesting
  const containerStartRegex = /<container(?:\s+class="([^"]+)")?>/i;
  const containerMatch = containerStartRegex.exec(content);
  
  if (containerMatch) {
    const startIndex = containerMatch.index;
    const classesStr = containerMatch[1];
    
    // Find the matching closing tag by counting open/close tags
    let depth = 1;
    let currentIndex = startIndex + containerMatch[0].length;
    let endIndex = -1;
    
    while (depth > 0 && currentIndex < content.length) {
      const remainingContent = content.substring(currentIndex);
      const openMatch = /<container(?:\s+[^>]*)?>/.exec(remainingContent);
      const closeMatch = /<\/container>/.exec(remainingContent);
      
      // Find which comes first
      const openIndex = openMatch ? openMatch.index : content.length;
      const closeIndex = closeMatch ? closeMatch.index : content.length;
      
      if (closeIndex < openIndex) {
        // Found a closing tag first
        depth--;
        currentIndex += closeIndex + (closeMatch ? closeMatch[0].length : 0);
        if (depth === 0) {
          endIndex = currentIndex;
        }
      } else if (openIndex < content.length) {
        // Found an opening tag first
        depth++;
        currentIndex += openIndex + (openMatch ? openMatch[0].length : 0);
      } else {
        // No more tags found
        break;
      }
    }
    
    if (endIndex > 0) {
      // Extract the content between the matched tags
      const containerContent = content.substring(startIndex + containerMatch[0].length, endIndex - '</container>'.length);
      
      const classes = classesStr ? classesStr.trim().split(/\s+/).filter(c => c.length > 0) : [];
      // Dedent and trim the content to handle indentation issues
      const dedentedContent = dedentContent(containerContent);
      const trimmedContent = dedentedContent ? dedentedContent.trim() : '';
      
      containers.push({
        tag: 'container',
        classes,
        content: trimmedContent,
      });
      
      // Remove only this container from content
      content = content.substring(0, startIndex) + content.substring(endIndex);
    }
  }
  
  // Then handle fence-style containers (:::container)
  const fenceRegex = /:::container(?:\s+([^\n]*))?\n([\s\S]*?)\n:::/g;
  let fenceMatch;
  let cleaned = content;
  
  while ((fenceMatch = fenceRegex.exec(content)) !== null) {
    const classesStr = fenceMatch[1];
    const containerContent = fenceMatch[2];
    
    const classes = classesStr ? classesStr.trim().split(/\s+/).filter(c => c.length > 0) : [];
    // Trim the content but preserve internal formatting
    const trimmedContent = containerContent ? containerContent.trim() : '';
    
    containers.push({
      tag: 'container',
      classes,
      content: trimmedContent,
    });
  }
  
  // Remove fence containers from cleaned content
  cleaned = cleaned.replace(fenceRegex, '');
  
  return {
    containers,
    cleaned,
  };
}

/**
 * Extract style tags from content
 */
export function extractStyles(content: string): {
  styles: z.infer<typeof ExtractedStyleSchema>[];
  cleaned: string;
} {
  const styles: z.infer<typeof ExtractedStyleSchema>[] = [];
  const styleRegex = /<style(?:\s+global)?>[\s\S]*?<\/style>/g;
  
  let cleaned = content;
  let match;
  
  while ((match = styleRegex.exec(content)) !== null) {
    const isGlobal = match[0].includes('global');
    const styleContent = match[0]
      .replace(/<style(?:\s+global)?>/g, '')
      .replace(/<\/style>/g, '')
      .trim();
    
    styles.push({
      content: styleContent,
      global: isGlobal,
    });
  }
  
  // Remove style tags from content
  cleaned = content.replace(styleRegex, '');
  
  return {
    styles,
    cleaned,
  };
}

/**
 * Parse markdown to mdast using unified ecosystem
 */
export function parseMarkdownToMdast(content: string): MdastRoot {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm);
  
  const parsed = processor.parse(content);
  
  // Validate the parsed result is a valid MdastRoot
  const isValidMdastRoot = (obj: unknown): obj is MdastRoot => {
    if (!obj || typeof obj !== 'object') return false;
    if (!('type' in obj) || !('children' in obj)) return false;
    return obj.type === 'root' && Array.isArray(obj.children);
  };
  
  if (!isValidMdastRoot(parsed)) {
    throw new Error('Failed to parse markdown to mdast');
  }
  
  return parsed;
}

/**
 * Process a single slide
 */
export function processSlide(content: string, index: number): ParsedSlide {
  // 1. Extract containers and styles
  const { containers, cleaned: cleanedFromContainers } = extractContainers(content);
  const { styles, cleaned: cleanedContent } = extractStyles(cleanedFromContainers);
  
  
  // 2. Parse markdown content to mdast
  const mdast = parseMarkdownToMdast(cleanedContent);
  
  // 3. Return parsed slide with mdast
  return {
    index,
    content: cleanedContent,
    mdast,
    containers,
    styles,
    metadata: {},
  };
}

/**
 * Validate slide count
 */
export function validateSlideCount(count: number): boolean {
  return count >= 0 && count < 100;
}

/**
 * Dedent container content
 */
export function dedentContent(content: string): string {
  const lines = content.split('\n');
  
  // Find minimum indentation (excluding empty lines)
  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    const matchResult = line.match(/^(\s*)/);
    const indent = matchResult?.[1]?.length ?? 0;
    if (indent < minIndent) {
      minIndent = indent;
    }
  }
  
  // If no indentation found or already at zero, return as-is
  if (minIndent === Infinity || minIndent === 0) return content;
  
  // Remove common indentation from all lines
  return lines
    .map(line => {
      // Keep empty lines as-is
      if (line.length === 0) return line;
      // For non-empty lines, remove the common indentation
      return line.slice(minIndent);
    })
    .join('\n');
}

/**
 * Preprocess HTML container tags to fence syntax
 * Converts <container class="foo bar"> to :::container foo bar
 * This is a pure function that returns a new string
 */
export function preprocessHTMLContainers(content: string): string {
  // Convert opening tags
  let processed = content.replace(
    /<container(?:\s+class="([^"]+)")?>/gi,
    (_, classes) => {
      const classNames = classes ? classes.trim().split(/\s+/) : [];
      const classString = classNames.length > 0 ? ` ${classNames.join(' ')}` : '';
      return `:::container${classString}\n`;
    }
  );
  
  // Convert closing tags - ensure they're on a new line
  processed = processed.replace(/<\/container>/gi, '\n:::');
  
  return processed;
}

/**
 * Expand inline containers to multiline format
 */
export function expandInlineContainers(content: string): string {
  // Match inline container syntax like :::{.class} content :::
  const inlineRegex = /:::\{([^}]+)\}\s*([^:]+?)\s*:::/g;
  
  return content.replace(inlineRegex, (_, classes, innerContent) => {
    const classNames = classes.replace(/^\./, '').split(/\s+/);
    return `:::container ${classNames.join(' ')}\n${innerContent.trim()}\n:::`;
  });
}

/**
 * Main parse stage function
 */
export function parseStage(input: string): z.infer<typeof ParserOutputSchema> {
  // Preprocessing pipeline - pure function composition
  // Skip HTML container preprocessing since we handle them directly now
  // Only expand inline containers
  const expanded = expandInlineContainers(input);
  
  // Split into slides
  const { globalContent, slideContents } = splitIntoSlides(expanded);
  
  // Validate slide count
  if (!validateSlideCount(slideContents.length)) {
    throw new Error(`Invalid slide count: ${slideContents.length}. Must be between 0 and 99.`);
  }
  
  // Extract global styles
  const { styles: globalStyles } = extractStyles(globalContent);
  
  // Process each slide
  const slides = slideContents.map((content, index) => processSlide(content, index));
  
  // Validate parsed slides
  const validatedSlides = slides.map(slide => ParsedSlideSchema.parse(slide));
  
  return ParserOutputSchema.parse({
    globalContent,
    globalStyles,
    slides: validatedSlides,
    version: '0.1',
  });
}