import { AdapterType, AdapterTypeSchema, Middleware } from '../../schemas/common';
import { ParserInterface, TransformerInterface } from '../../schemas/integration';
import { RendererInterface } from '../../schemas/rendering';
import { PluginInterface } from '../../schemas/plugins';
import { CLICommandHandler } from '../../schemas/cli';
import { RegistryState } from './types';
import { createAdapterNotFoundError } from './errors';

// Create empty initial state
export const createInitialState = (): RegistryState => ({
  parsers: new Map<string, ParserInterface>(),
  transformers: new Map<string, TransformerInterface>(),
  renderers: new Map<string, RendererInterface>(),
  plugins: new Map<string, PluginInterface>(),
  cliCommands: new Map<string, CLICommandHandler>(),
  middleware: [],
});

// Getter functions for adapters
export const getAdapterFromState = (
  state: RegistryState,
  type: AdapterType,
  name: string
): unknown => {
  switch (type) {
    case 'parser': {
      const adapter = state.parsers.get(name);
      if (adapter) return adapter;

      const defaultAdapter = state.parsers.get('default');
      if (defaultAdapter) return defaultAdapter;

      throw createAdapterNotFoundError(type, name);
    }
    case 'transformer': {
      const adapter = state.transformers.get(name);
      if (adapter) return adapter;

      const defaultAdapter = state.transformers.get('default');
      if (defaultAdapter) return defaultAdapter;

      throw createAdapterNotFoundError(type, name);
    }
    case 'renderer': {
      const adapter = state.renderers.get(name);
      if (adapter) return adapter;

      const defaultAdapter = state.renderers.get('default');
      if (defaultAdapter) return defaultAdapter;

      throw createAdapterNotFoundError(type, name);
    }
  }
};

export const getPluginFromState = (state: RegistryState, name: string): unknown => {
  const plugin = state.plugins.get(name);
  if (plugin) return plugin;

  const defaultPlugin = state.plugins.get('default');
  if (defaultPlugin) return defaultPlugin;

  return null;
};

export const getCLICommandFromState = (
  state: RegistryState,
  name: string
): ((...args: never[]) => unknown) | undefined => {
  const command = state.cliCommands.get(name);
  if (command) {
    // Return the specific command handler function from the CLICommandHandler
    switch (name) {
      case 'build':
        return command.build;
      case 'serve':
        return command.serve;
      case 'watch':
        return command.watch;
      case 'export':
        return command.export;
      case 'validate':
        return command.validate;
      default:
        return undefined;
    }
  }

  const defaultCommand = state.cliCommands.get('default');
  if (defaultCommand) {
    switch (name) {
      case 'build':
        return defaultCommand.build;
      case 'serve':
        return defaultCommand.serve;
      case 'watch':
        return defaultCommand.watch;
      case 'export':
        return defaultCommand.export;
      case 'validate':
        return defaultCommand.validate;
      default:
        return undefined;
    }
  }

  return undefined;
};

export const getMiddlewareFromState = (state: RegistryState): Middleware[] => {
  return [...state.middleware];
};

export const listPluginsFromState = (state: RegistryState): string[] => {
  return Array.from(state.plugins.keys());
};

export const listCLICommandsFromState = (state: RegistryState): string[] => {
  return Array.from(state.cliCommands.keys());
};

export const listAdaptersFromState = (state: RegistryState, typeFilter?: string): string[] => {
  if (typeFilter === undefined || typeFilter === '') {
    return [
      ...Array.from(state.parsers.keys()),
      ...Array.from(state.transformers.keys()),
      ...Array.from(state.renderers.keys()),
    ];
  }

  const validatedType = AdapterTypeSchema.parse(typeFilter);

  switch (validatedType) {
    case 'parser':
      return Array.from(state.parsers.keys());
    case 'transformer':
      return Array.from(state.transformers.keys());
    case 'renderer':
      return Array.from(state.renderers.keys());
  }
};
