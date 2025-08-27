import { GlobalRegistry, GlobalRegistrySchema } from '../schemas/integration';
import { createInitialState } from './registry/state';
import { registryReducer } from './registry/reducers';
import { createDispatcher } from './registry/dispatcher';

// Registry implementation using reducer-based composition pattern
export const createGlobalRegistry = (): GlobalRegistry => {
  // Initialize dispatcher with the main reducer and initial state
  const dispatcher = createDispatcher(registryReducer, createInitialState());

  // Extract methods from dispatcher to create the GlobalRegistry interface
  const registry: GlobalRegistry = {
    registerParser: dispatcher.methods.registerParser,
    registerTransformer: dispatcher.methods.registerTransformer,
    registerRenderer: dispatcher.methods.registerRenderer,
    registerPlugin: dispatcher.methods.registerPlugin,
    registerCLICommand: dispatcher.methods.registerCLICommand,
    getAdapter: dispatcher.methods.getAdapter,
    getPlugin: dispatcher.methods.getPlugin,
    getCLICommand: dispatcher.methods.getCLICommand,
    addMiddleware: dispatcher.methods.addMiddleware,
    getMiddleware: dispatcher.methods.getMiddleware,
    listAdapters: dispatcher.methods.listAdapters,
    listPlugins: dispatcher.methods.listPlugins,
    listCLICommands: dispatcher.methods.listCLICommands,
    validateRegistration: dispatcher.methods.validateRegistration,
  };

  // Validate the complete registry against schema
  GlobalRegistrySchema.parse(registry);

  return registry;
};

// Export type for convenience
export type { GlobalRegistry };
