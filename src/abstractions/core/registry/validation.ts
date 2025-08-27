import { AdapterTypeSchema, ValidationResult } from '../../schemas/common';
import { ParserInterfaceSchema, TransformerInterfaceSchema } from '../../schemas/integration';
import { RendererInterfaceSchema } from '../../schemas/rendering';

export const validateRegistrationForState = (type: string, adapter: unknown): ValidationResult => {
  try {
    const validatedType = AdapterTypeSchema.parse(type);

    switch (validatedType) {
      case 'parser':
        ParserInterfaceSchema.parse(adapter);
        break;
      case 'transformer':
        TransformerInterfaceSchema.parse(adapter);
        break;
      case 'renderer':
        RendererInterfaceSchema.parse(adapter);
        break;
    }

    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
    return {
      isValid: false,
      errors: [errorMessage],
      warnings: [],
    };
  }
};
