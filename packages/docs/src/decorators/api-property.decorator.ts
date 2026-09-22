import { DocsRegistry, ApiPropertyMetadata } from '../registry/DocsRegistry';

export function ApiProperty(metadata: Omit<ApiPropertyMetadata, 'name'> = { type: 'string' }): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    DocsRegistry.getInstance().registerProperty(target.constructor, {
      name: String(propertyKey),
      ...metadata,
    });
  };
}
