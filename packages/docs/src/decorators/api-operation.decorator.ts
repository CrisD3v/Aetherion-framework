import { DocsRegistry, ApiOperationMetadata, ApiResponseMetadata } from '../registry/DocsRegistry';

export function ApiTag(name: string, description?: string): ClassDecorator {
  return (target: any) => {
    DocsRegistry.getInstance().registerTag(target, name, description);
  };
}

export function ApiOperation(metadata: ApiOperationMetadata): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    DocsRegistry.getInstance().registerOperation(target.constructor, String(propertyKey), metadata);
  };
}

export function ApiResponse(metadata: ApiResponseMetadata): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    DocsRegistry.getInstance().registerResponse(target.constructor, String(propertyKey), metadata);
  };
}
