import { RegistryState, RegistryAction, ActionTypes } from './types';

/**
 * Registry reducer - handles all state mutations for the registry.
 * Validation is handled in the dispatcher before actions reach this reducer.
 * Get/List operations don't belong in reducers since they don't modify state.
 */
export const registryReducer = (state: RegistryState, action: RegistryAction): RegistryState => {
  switch (action.type) {
    case ActionTypes.REGISTER_PARSER: {
      const newParsers = new Map(state.parsers);
      newParsers.set(action.payload.name, action.payload.parser);
      return { ...state, parsers: newParsers };
    }
    case ActionTypes.REGISTER_TRANSFORMER: {
      const newTransformers = new Map(state.transformers);
      newTransformers.set(action.payload.name, action.payload.transformer);
      return { ...state, transformers: newTransformers };
    }
    case ActionTypes.REGISTER_RENDERER: {
      const newRenderers = new Map(state.renderers);
      newRenderers.set(action.payload.name, action.payload.renderer);
      return { ...state, renderers: newRenderers };
    }
    case ActionTypes.REGISTER_PLUGIN: {
      const newPlugins = new Map(state.plugins);
      newPlugins.set(action.payload.name, action.payload.plugin);
      return { ...state, plugins: newPlugins };
    }
    case ActionTypes.REGISTER_CLI_COMMAND: {
      const newCLICommands = new Map(state.cliCommands);
      newCLICommands.set(action.payload.name, action.payload.handler);
      return { ...state, cliCommands: newCLICommands };
    }
    case ActionTypes.ADD_MIDDLEWARE: {
      return {
        ...state,
        middleware: [...state.middleware, action.payload.middleware],
      };
    }
    default:
      return state;
  }
};
