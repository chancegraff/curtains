import {
  AdapterType,
  InterfaceViolationError,
  InterfaceViolationErrorSchema,
  AdapterNotFoundError,
  AdapterNotFoundErrorSchema,
} from '../../schemas/common';

// Error creation helpers
export const createInterfaceViolationError = (
  interfaceName: string,
  missingMethods: string[],
  originalError?: unknown
): InterfaceViolationError => {
  const errorData: {
    readonly message: string;
    readonly code: 'INTERFACE_VIOLATION';
    readonly interfaceName: string;
    readonly missingMethods: string[];
    readonly timestamp: number;
    readonly cause: unknown;
  } = {
    message: `Adapter does not implement ${interfaceName}`,
    code: 'INTERFACE_VIOLATION',
    interfaceName,
    missingMethods,
    timestamp: Date.now(),
    cause: originalError,
  };
  return InterfaceViolationErrorSchema.parse(errorData);
};

export const createAdapterNotFoundError = (
  adapterType: AdapterType,
  adapterName: string
): AdapterNotFoundError => {
  const errorData: {
    readonly message: string;
    readonly code: 'ADAPTER_NOT_FOUND';
    readonly adapterType: AdapterType;
    readonly adapterName: string;
    readonly timestamp: number;
  } = {
    message: `Adapter not found: ${adapterName} of type ${adapterType}`,
    code: 'ADAPTER_NOT_FOUND',
    adapterType,
    adapterName,
    timestamp: Date.now(),
  };
  return AdapterNotFoundErrorSchema.parse(errorData);
};
