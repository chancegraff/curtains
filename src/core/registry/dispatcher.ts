import {
  AdapterTypeSchema,
  Middleware,
  MiddlewareSchema,
  ValidationResult,
} from '../../schemas/common';
import { RegistryState, RegistryAction, RegistryDispatcher } from './types';
import {
  registerParser,
  registerTransformer,
  registerRenderer,
  registerPlugin,
  registerCLICommand,
  addMiddleware,
} from './actions';
import { validateRegistrationForState } from './validation';
import { createInterfaceViolationError } from './errors';
import {
  getAdapterFromState,
  getPluginFromState,
  getCLICommandFromState,
  getMiddlewareFromState,
  listAdaptersFromState,
  listPluginsFromState,
  listCLICommandsFromState,
} from './state';
import {
  CLICommandHandlerSchema,
  ParserInterfaceSchema,
  PluginInterfaceSchema,
  RendererInterfaceSchema,
  TransformerInterfaceSchema,
} from '../../schemas';

// Create dispatcher - the core state management system
export const createDispatcher = (
  reducer: (state: RegistryState, action: RegistryAction) => RegistryState,
  initialState: RegistryState
): RegistryDispatcher => {
  let currentState = initialState;

  // Pure dispatch function
  const dispatch = (action: RegistryAction): RegistryState => {
    currentState = reducer(currentState, action);
    return currentState;
  };

  // Create methods that dispatch appropriate actions
  const methods = {
    // Registration methods with validation and error handling
    registerParser: (name: string, parser: unknown): boolean => {
      try {
        const validatedParser = ParserInterfaceSchema.parse(parser);
        dispatch(registerParser(name, validatedParser));
        return true;
      } catch (error) {
        const interfaceError = createInterfaceViolationError(
          'IParser',
          ['parse', 'supports', 'validate'],
          error
        );
        throw interfaceError;
      }
    },

    registerTransformer: (name: string, transformer: unknown): boolean => {
      try {
        const validatedTransformer = TransformerInterfaceSchema.parse(transformer);
        dispatch(registerTransformer(name, validatedTransformer));
        return true;
      } catch (error) {
        const interfaceError = createInterfaceViolationError(
          'ITransformer',
          ['transform', 'configure', 'getCapabilities'],
          error
        );
        throw interfaceError;
      }
    },

    registerRenderer: (name: string, renderer: unknown): boolean => {
      try {
        const validatedRenderer = RendererInterfaceSchema.parse(renderer);
        dispatch(registerRenderer(name, validatedRenderer));
        return true;
      } catch (error) {
        const interfaceError = createInterfaceViolationError(
          'IRenderer',
          ['render', 'validateInput', 'getCapabilities'],
          error
        );
        throw interfaceError;
      }
    },

    registerPlugin: (name: string, plugin: unknown): boolean => {
      try {
        const validatedPlugin = PluginInterfaceSchema.parse(plugin);
        dispatch(registerPlugin(name, validatedPlugin));
        return true;
      } catch (error) {
        const interfaceError = createInterfaceViolationError(
          'IPlugin',
          ['manifest', 'lifecycle', 'hooks', 'api'],
          error
        );
        throw interfaceError;
      }
    },

    registerCLICommand: (name: string, handler: unknown): boolean => {
      try {
        const validatedHandler = CLICommandHandlerSchema.parse(handler);
        dispatch(registerCLICommand(name, validatedHandler));
        return true;
      } catch (error) {
        const interfaceError = createInterfaceViolationError(
          'ICLICommandHandler',
          ['build', 'serve', 'watch', 'export', 'validate'],
          error
        );
        throw interfaceError;
      }
    },

    addMiddleware: (middleware: unknown): void => {
      const validatedMiddleware = MiddlewareSchema.parse(middleware);
      dispatch(addMiddleware(validatedMiddleware));
    },

    // Query methods
    getAdapter: (type: string, name: string): unknown => {
      const validatedType = AdapterTypeSchema.parse(type);
      return getAdapterFromState(currentState, validatedType, name);
    },

    getPlugin: (name: string): unknown => {
      return getPluginFromState(currentState, name);
    },

    getCLICommand: (name: string): ((...args: never[]) => unknown) | undefined => {
      return getCLICommandFromState(currentState, name);
    },

    getMiddleware: (): Middleware[] => {
      return getMiddlewareFromState(currentState);
    },

    listAdapters: (typeFilter?: string): string[] => {
      return listAdaptersFromState(currentState, typeFilter);
    },

    listPlugins: (): string[] => {
      return listPluginsFromState(currentState);
    },

    listCLICommands: (): string[] => {
      return listCLICommandsFromState(currentState);
    },

    validateRegistration: (type: string, adapter: unknown): ValidationResult => {
      return validateRegistrationForState(type, adapter);
    },
  };

  return {
    dispatch,
    methods,
  };
};
