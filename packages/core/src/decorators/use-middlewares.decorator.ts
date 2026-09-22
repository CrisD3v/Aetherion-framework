import { Type } from '../di/Injector';
import { Middleware } from '../adapter/interfaces';
import { MetadataRegistry } from '../registry/MetadataRegistry';

// We could extend MetadataRegistry to support storing middlewares per controller/method.
// For now, we'll attach it directly as reflect metadata.

export function UseMiddlewares(middlewares: Type<Middleware>[]): ClassDecorator & MethodDecorator {
  return (target: any, propertyKey?: string | symbol) => {
    if (propertyKey) {
      Reflect.defineMetadata('middlewares', middlewares, target, propertyKey);
    } else {
      Reflect.defineMetadata('middlewares', middlewares, target);
    }
  };
}
