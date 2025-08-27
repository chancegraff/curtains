import { AdapterType, Middleware, ValidationResult } from '../../schemas/common';
import { ParserInterface, TransformerInterface } from '../../schemas/integration';
import { RendererInterface } from '../../schemas/rendering';
import { PluginInterface } from '../../schemas/plugins';
import { CLICommandHandler } from '../../schemas/cli';

// Internal registry state type
export type RegistryState = {
  readonly parsers: Map<string, ParserInterface>;
  readonly transformers: Map<string, TransformerInterface>;
  readonly renderers: Map<string, RendererInterface>;
  readonly plugins: Map<string, PluginInterface>;
  readonly cliCommands: Map<string, CLICommandHandler>;
  readonly middleware: readonly Middleware[];
};

// Action types constants
export const ActionTypes = {
  REGISTER_PARSER: 'REGISTER_PARSER',
  REGISTER_TRANSFORMER: 'REGISTER_TRANSFORMER',
  REGISTER_RENDERER: 'REGISTER_RENDERER',
  REGISTER_PLUGIN: 'REGISTER_PLUGIN',
  REGISTER_CLI_COMMAND: 'REGISTER_CLI_COMMAND',
  ADD_MIDDLEWARE: 'ADD_MIDDLEWARE',
  GET_ADAPTER: 'GET_ADAPTER',
  GET_PLUGIN: 'GET_PLUGIN',
  GET_CLI_COMMAND: 'GET_CLI_COMMAND',
  GET_MIDDLEWARE: 'GET_MIDDLEWARE',
  LIST_ADAPTERS: 'LIST_ADAPTERS',
  LIST_PLUGINS: 'LIST_PLUGINS',
  LIST_CLI_COMMANDS: 'LIST_CLI_COMMANDS',
} as const;

// Action types
export type RegistryAction =
  | {
      type: typeof ActionTypes.REGISTER_PARSER;
      payload: { name: string; parser: ParserInterface };
    }
  | {
      type: typeof ActionTypes.REGISTER_TRANSFORMER;
      payload: { name: string; transformer: TransformerInterface };
    }
  | {
      type: typeof ActionTypes.REGISTER_RENDERER;
      payload: { name: string; renderer: RendererInterface };
    }
  | {
      type: typeof ActionTypes.REGISTER_PLUGIN;
      payload: { name: string; plugin: PluginInterface };
    }
  | {
      type: typeof ActionTypes.REGISTER_CLI_COMMAND;
      payload: { name: string; handler: CLICommandHandler };
    }
  | {
      type: typeof ActionTypes.ADD_MIDDLEWARE;
      payload: { middleware: Middleware };
    }
  | {
      type: typeof ActionTypes.GET_ADAPTER;
      payload: { type: AdapterType; name: string };
    }
  | { type: typeof ActionTypes.GET_PLUGIN; payload: { name: string } }
  | { type: typeof ActionTypes.GET_CLI_COMMAND; payload: { name: string } }
  | { type: typeof ActionTypes.GET_MIDDLEWARE }
  | { type: typeof ActionTypes.LIST_ADAPTERS; payload: { typeFilter?: string } }
  | { type: typeof ActionTypes.LIST_PLUGINS }
  | { type: typeof ActionTypes.LIST_CLI_COMMANDS };

// Dispatcher interface
export interface RegistryDispatcher {
  readonly dispatch: (action: RegistryAction) => RegistryState;
  readonly methods: {
    readonly registerParser: (name: string, parser: unknown) => boolean;
    readonly registerTransformer: (name: string, transformer: unknown) => boolean;
    readonly registerRenderer: (name: string, renderer: unknown) => boolean;
    readonly registerPlugin: (name: string, plugin: unknown) => boolean;
    readonly registerCLICommand: (name: string, handler: unknown) => boolean;
    readonly getAdapter: (type: string, name: string) => unknown;
    readonly getPlugin: (name: string) => unknown;
    readonly getCLICommand: (name: string) => ((...args: never[]) => unknown) | undefined;
    readonly addMiddleware: (middleware: unknown) => void;
    readonly getMiddleware: () => Middleware[];
    readonly listAdapters: (typeFilter?: string) => string[];
    readonly listPlugins: () => string[];
    readonly listCLICommands: () => string[];
    readonly validateRegistration: (type: string, adapter: unknown) => ValidationResult;
  };
}
