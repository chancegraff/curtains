import { z } from 'zod';
import {
  BaseParserInterfaceSchema,
  ParserOptionsSchema,
  ParseResultSchema,
  ParserContextSchema,
  ParserPluginInterfaceSchema,
  ParserPluginManagerSchema,
  ParserErrorSchema,
  ParserStatisticsSchema,
  ParserPerformanceSchema,
  DocumentASTSchema,
  ASTNodeSchema,
  type BaseParserInterface,
  type ParserContext,
  type ParserPluginInterface,
  type ParserPluginManager,
  type ParserError,
  type ParserStatistics,
  type ParserPerformance,
  type DocumentAST,
  type ASTNode,
} from '../schemas/parsers';
import {
  ValidationResultSchema,
  type ValidationResult,
} from '../schemas/common';
import { createLogger } from '../utils/logger';

// Input normalizers
export function normalizeASTNode(node: Partial<ASTNode>): ASTNode {
  return ASTNodeSchema.parse({
    type: node.type ?? 'unknown',
    children: node.children ?? [],
    value: node.value ?? '',
  });
}

export function normalizeParserOptions(
  options: Partial<z.infer<typeof ParserOptionsSchema>>
): z.infer<typeof ParserOptionsSchema> {
  const defaultOptions: z.infer<typeof ParserOptionsSchema> = {
    debug: false,
    strict: true,
    timeout: 30000,
    preserveWhitespace: false,
    allowHTML: true,
    allowContainers: true,
    allowStyles: true,
    maxNestingDepth: 10,
    maxInputSize: 10485760, // 10MB
    validateContainers: true,
    extractStyles: true,
    splitSlides: true,
    slideDelimiter: '===',
    customElements: {},
    plugins: [],
  };

  return ParserOptionsSchema.parse({
    ...defaultOptions,
    ...options,
  });
}

// Complex condition extractors
export function isValidInput(input: string, maxSize: number): boolean {
  return (
    typeof input === 'string' && input.length > 0 && input.length <= maxSize
  );
}

export function isNestingValid(depth: number, maxDepth: number): boolean {
  return depth >= 0 && depth <= maxDepth;
}

export function hasChildren(node: ASTNode): boolean {
  return Array.isArray(node.children) && node.children.length > 0;
}

export function isParseTimeout(startTime: number, timeout: number): boolean {
  return Date.now() - startTime > timeout;
}

// Default parser options
const DEFAULT_OPTIONS: z.infer<typeof ParserOptionsSchema> =
  normalizeParserOptions({});

// Plugin manager state type
type PluginManagerState = {
  plugins: Map<string, ParserPluginInterface>;
  preProcessors: Array<(input: string, context: ParserContext) => string>;
  postProcessors: Array<(ast: ASTNode, context: ParserContext) => ASTNode>;
  nodeValidators: Array<(node: ASTNode) => ValidationResult>;
};

/**
 * Creates a plugin manager for handling parser extensions
 */
function createParserPluginManager(): ParserPluginManager {
  const state: PluginManagerState = {
    plugins: new Map(),
    preProcessors: [],
    postProcessors: [],
    nodeValidators: [],
  };

  const register = (plugin: unknown): boolean => {
    try {
      // Validate plugin interface
      const validatedPlugin = ParserPluginInterfaceSchema.parse(plugin);

      // Check if plugin already exists
      if (state.plugins.has(validatedPlugin.name)) {
        return false;
      }

      // Register plugin
      state.plugins.set(validatedPlugin.name, validatedPlugin);

      // Register pre-processor
      if (validatedPlugin.preProcess) {
        state.preProcessors.push(validatedPlugin.preProcess);
      }

      // Register post-processor
      if (validatedPlugin.postProcess) {
        const processor = validatedPlugin.postProcess;
        state.postProcessors.push((ast: ASTNode, context: ParserContext) => {
          const result = processor(ast, context);
          return ASTNodeSchema.parse(result);
        });
      }

      // Register node validator
      if (validatedPlugin.validateNode) {
        const validator = validatedPlugin.validateNode;
        state.nodeValidators.push((node: ASTNode) => {
          return validator(node);
        });
      }

      return true;
    } catch {
      return false;
    }
  };

  const unregister = (name: string): boolean => {
    const plugin = state.plugins.get(name);
    if (!plugin) {
      return false;
    }

    state.plugins.delete(name);

    // Remove from processors (would need plugin reference to match, simplified for now)
    // In a full implementation, would track which processors belong to which plugins

    return true;
  };

  const getPlugin = (name: string): ParserPluginInterface | null => {
    return state.plugins.get(name) ?? null;
  };

  const applyPreProcessors = (input: string, context: unknown): string => {
    let result = input;
    const typedContext = ParserContextSchema.parse(context);
    for (const processor of state.preProcessors) {
      result = processor(result, typedContext);
    }
    return result;
  };

  const applyPostProcessors = (ast: unknown, context: unknown): unknown => {
    let result = ASTNodeSchema.parse(ast);
    const typedContext = ParserContextSchema.parse(context);
    for (const processor of state.postProcessors) {
      result = processor(result, typedContext);
    }
    return result;
  };

  const validateAll = (ast: unknown): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const typedAST = ASTNodeSchema.parse(ast);
    for (const validator of state.nodeValidators) {
      const result = validator(typedAST);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  };

  const manager: ParserPluginManager = {
    plugins: Array.from(state.plugins.values()),
    register,
    unregister,
    getPlugin,
    applyPreProcessors,
    applyPostProcessors,
    validateAll,
  };

  return ParserPluginManagerSchema.parse(manager);
}

/**
 * Creates performance monitoring for parser operations
 */
function createPerformanceMonitor(): {
  start: () => void;
  markPhase: (phase: string) => void;
  finish: () => ParserPerformance;
} {
  const startTime = Date.now();
  const phases: Record<string, number> = {};
  let lastPhaseTime = startTime;

  const start = (): void => {
    // Already started in initialization
  };

  const markPhase = (phase: string): void => {
    const now = Date.now();
    phases[phase] = now - lastPhaseTime;
    lastPhaseTime = now;
  };

  const finish = (): ParserPerformance => {
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    return ParserPerformanceSchema.parse({
      startTime,
      endTime,
      totalTime,
      phases,
      memoryUsage: {
        initial: 0,
        peak: 0,
        final: 0,
      },
    });
  };

  return { start, markPhase, finish };
}

/**
 * Creates a base parser that provides common parsing functionality
 * and can be extended by specific parser implementations
 */
export function createBaseParser(): BaseParserInterface {
  let options = { ...DEFAULT_OPTIONS };
  const pluginManager = createParserPluginManager();
  let statistics: ParserStatistics | null = null;

  const validateInput = (input: string): ValidationResult => {
    const logger = createLogger(options.debug);
    const errors: string[] = [];
    const warnings: string[] = [];

    logger.debug('Starting input validation');

    if (typeof input !== 'string') {
      errors.push('Input must be a string');
      logger.debug('Input type validation failed: not a string');
    }

    if (input.length === 0) {
      warnings.push('Input is empty');
      logger.debug('Input is empty');
    } else if (input.length > options.maxInputSize) {
      errors.push(
        `Input size ${input.length} exceeds maximum allowed size ${options.maxInputSize}`
      );
      logger.debug(
        `Input size validation failed: ${input.length} > ${options.maxInputSize}`
      );
    }

    const result = ValidationResultSchema.parse({
      isValid: errors.length === 0,
      errors,
      warnings,
    });

    logger.debug(
      `Input validation completed: ${result.isValid ? 'passed' : 'failed'}`
    );
    return result;
  };

  const createContext = (input: string): ParserContext => {
    return ParserContextSchema.parse({
      source: input,
      position: 0,
      line: 1,
      column: 0,
      errors: [],
      warnings: [],
      metadata: {},
      options: { ...options },
    });
  };

  const createError = (
    type: 'syntax' | 'validation' | 'nesting' | 'size' | 'timeout' | 'plugin',
    message: string,
    context?: Partial<ParserError>
  ): ParserError => {
    return ParserErrorSchema.parse({
      type,
      message,
      severity: 'error',
      ...context,
    });
  };

  const createStatistics = (
    input: string,
    ast: DocumentAST,
    parseTime: number
  ): ParserStatistics => {
    const countNodes = (node: ASTNode, type: string): number => {
      let count = node.type === type ? 1 : 0;
      if (node.children) {
        for (const child of node.children) {
          count += countNodes(child, type);
        }
      }
      return count;
    };

    const wordCount = input.split(/\s+/).filter(word => word.length > 0).length;

    return ParserStatisticsSchema.parse({
      inputSize: input.length,
      outputSize: JSON.stringify(ast).length,
      parseTime,
      totalSlides: countNodes(ast, 'slide'),
      totalContainers: countNodes(ast, 'container'),
      maxNestingDepth: calculateMaxDepth(ast),
      styleBlocks: 0, // Would be calculated based on style extraction
      imageCount: countNodes(ast, 'image'),
      linkCount: countNodes(ast, 'link'),
      tableCount: countNodes(ast, 'table'),
      codeBlocks: countNodes(ast, 'code'),
      wordCount,
      characterCount: input.length,
      lineCount: input.split('\n').length,
    });
  };

  const calculateMaxDepth = (node: ASTNode, depth = 0): number => {
    let maxDepth = depth;
    if (node.children) {
      for (const child of node.children) {
        maxDepth = Math.max(maxDepth, calculateMaxDepth(child, depth + 1));
      }
    }
    return maxDepth;
  };

  const performBasicParsing = (
    input: string,
    _context: ParserContext
  ): DocumentAST => {
    // This is a basic implementation that creates a minimal document AST
    // Specific parsers should override this method
    const textNode: ASTNode = ASTNodeSchema.parse({
      type: 'text',
      value: input,
    });

    const paragraphNode: ASTNode = ASTNodeSchema.parse({
      type: 'paragraph',
      children: [textNode],
    });

    return DocumentASTSchema.parse({
      type: 'document',
      children: [paragraphNode],
      metadata: {
        version: '1.0.0',
      },
    });
  };

  const parse = (input: string, _parseOptions?: unknown): unknown => {
    const monitor = createPerformanceMonitor();
    monitor.start();

    try {
      // Note: Options merging would be implemented here if needed

      // Validate input
      monitor.markPhase('preprocessing');
      const validation = validateInput(input);
      if (!validation.isValid) {
        const error = createError('validation', validation.errors.join('; '));
        throw error;
      }

      // Create context
      const context = createContext(input);
      context.errors.push(...validation.errors);
      context.warnings.push(...validation.warnings);

      // Apply pre-processors
      const processedInput = pluginManager.applyPreProcessors(input, context);

      // Core parsing
      monitor.markPhase('parsing');
      let ast = performBasicParsing(processedInput, context);

      // Apply post-processors
      monitor.markPhase('postprocessing');
      const rootNode: ASTNode = ASTNodeSchema.parse(ast);
      const processedAST = pluginManager.applyPostProcessors(rootNode, context);

      // Validate the processed AST is still a document
      const typedProcessedAST = DocumentASTSchema.parse(processedAST);

      ast = typedProcessedAST;

      // Final validation
      monitor.markPhase('validation');
      const astValidation = pluginManager.validateAll(ast);
      context.errors.push(...astValidation.errors);
      context.warnings.push(...astValidation.warnings);

      const performance = monitor.finish();
      statistics = createStatistics(input, ast, performance.totalTime);

      // Extract slides from document (basic implementation)
      const slides =
        ast.children?.filter(child => child.type === 'slide') ?? [];

      return ParseResultSchema.parse({
        ast,
        slides: slides.map((slide, index) => ({
          type: 'slide',
          index,
          children: slide.children ?? [],
          slideCSS: slide.slideCSS ?? '',
        })),
        globalStyles: ast.globalStyles ?? '',
        metadata: ast.metadata ?? {},
        errors: context.errors,
        warnings: context.warnings,
        statistics: {
          totalSlides: statistics.totalSlides,
          totalContainers: statistics.totalContainers,
          maxNestingDepth: statistics.maxNestingDepth,
          parseTime: statistics.parseTime,
          inputSize: statistics.inputSize,
        },
      });
    } catch (error) {
      monitor.finish();

      // Handle errors
      if (error instanceof z.ZodError) {
        const validationError = createError('validation', error.message);
        throw validationError;
      }

      if (ParserErrorSchema.safeParse(error).success) {
        throw error;
      }

      const unknownError = createError(
        'syntax',
        error instanceof Error ? error.message : 'Unknown parsing error'
      );
      throw unknownError;
    }
  };

  const supports = (format: string): boolean => {
    const supportedFormats = ['markdown', 'md', 'curtains'];
    return supportedFormats.includes(format.toLowerCase());
  };

  const validate = (input: string): ValidationResult => {
    try {
      const inputValidation = validateInput(input);
      if (!inputValidation.isValid) {
        return inputValidation;
      }

      // Try to parse to validate structure
      const context = createContext(input);
      const processedInput = pluginManager.applyPreProcessors(input, context);
      const ast = performBasicParsing(processedInput, context);
      const astValidation = pluginManager.validateAll(ast);

      return ValidationResultSchema.parse({
        isValid: inputValidation.isValid && astValidation.isValid,
        errors: [...inputValidation.errors, ...astValidation.errors],
        warnings: [...inputValidation.warnings, ...astValidation.warnings],
      });
    } catch (error) {
      return ValidationResultSchema.parse({
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
        warnings: [],
      });
    }
  };

  const getCapabilities = (): {
    supportedFormats: string[];
    supportsMetadata: boolean;
    supportsFrontmatter: boolean;
    supportsContainers: boolean;
    supportsStyles: boolean;
    maxInputSize: number;
    pluginsEnabled: boolean;
  } => {
    return {
      supportedFormats: ['markdown', 'md', 'curtains'],
      supportsMetadata: true,
      supportsFrontmatter: false,
      supportsContainers: options.allowContainers,
      supportsStyles: options.allowStyles,
      maxInputSize: options.maxInputSize,
      pluginsEnabled: true,
    };
  };

  const configure = (newOptions: unknown): void => {
    const typedNewOptions = ParserOptionsSchema.partial().parse(newOptions);
    const mergedOptions = { ...options, ...typedNewOptions };
    options = ParserOptionsSchema.parse(mergedOptions);
  };

  const reset = (): void => {
    options = { ...DEFAULT_OPTIONS };
    statistics = null;
    // Don't reset plugin manager as plugins should persist across resets
  };

  const baseParser: BaseParserInterface = {
    parse,
    supports,
    validate,
    getCapabilities,
    configure,
    reset,
  };

  return BaseParserInterfaceSchema.parse(baseParser);
}
