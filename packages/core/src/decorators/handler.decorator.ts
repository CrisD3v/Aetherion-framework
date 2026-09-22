import { MetadataRegistry, RouteMetadata } from '../registry/MetadataRegistry';

export function Route(metadata: Omit<RouteMetadata, 'methodName'>): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const fullMetadata: RouteMetadata = { ...metadata, methodName: String(propertyKey) };
    MetadataRegistry.getInstance().registerRoute(target.constructor, fullMetadata);
    Reflect.defineMetadata('route', fullMetadata, target, propertyKey);
  };
}

export function Handle(options?: { timeout?: number; memorySize?: number }): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    MetadataRegistry.getInstance().registerHandle(target.constructor, {
      methodName: String(propertyKey),
      timeout: options?.timeout,
      memorySize: options?.memorySize,
    });
    Reflect.defineMetadata('handle', options || true, target, propertyKey);
  };
}

export function IamPermissions(permissions: Record<string, any>): ClassDecorator & MethodDecorator {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    // If propertyKey is undefined, it's a class decorator so target is the constructor.
    // If propertyKey is defined, it's a method decorator so target is the prototype.
    const actualTarget = propertyKey ? target.constructor : target;
    MetadataRegistry.getInstance().registerIamPermissions(actualTarget, {
      methodName: propertyKey ? String(propertyKey) : undefined,
      permissions
    });
  };
}

export function SqsTrigger(queueName: string, options?: any): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    MetadataRegistry.getInstance().registerSqsTrigger(target.constructor, {
      queueName,
      methodName: String(propertyKey),
      options
    });
  };
}
