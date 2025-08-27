import { Middleware } from '../../schemas/common';
import { ParserInterface, TransformerInterface } from '../../schemas/integration';
import { RendererInterface } from '../../schemas/rendering';
import { PluginInterface } from '../../schemas/plugins';
import { CLICommandHandler } from '../../schemas/cli';
import { ActionTypes, RegistryAction } from './types';

// Action creators
export const registerParser = (
  name: string,
  parser: ParserInterface
): RegistryAction => ({
  type: ActionTypes.REGISTER_PARSER,
  payload: { name, parser },
});

export const registerTransformer = (
  name: string,
  transformer: TransformerInterface
): RegistryAction => ({
  type: ActionTypes.REGISTER_TRANSFORMER,
  payload: { name, transformer },
});

export const registerRenderer = (
  name: string,
  renderer: RendererInterface
): RegistryAction => ({
  type: ActionTypes.REGISTER_RENDERER,
  payload: { name, renderer },
});

export const registerPlugin = (
  name: string,
  plugin: PluginInterface
): RegistryAction => ({
  type: ActionTypes.REGISTER_PLUGIN,
  payload: { name, plugin },
});

export const registerCLICommand = (
  name: string,
  handler: CLICommandHandler
): RegistryAction => ({
  type: ActionTypes.REGISTER_CLI_COMMAND,
  payload: { name, handler },
});

export const addMiddleware = (middleware: Middleware): RegistryAction => ({
  type: ActionTypes.ADD_MIDDLEWARE,
  payload: { middleware },
});
