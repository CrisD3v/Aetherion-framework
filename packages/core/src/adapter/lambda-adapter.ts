import { Type, Injector } from '../di/Injector';
import { Middleware } from './interfaces';
import { MetadataRegistry, RouteMetadata } from '../registry/MetadataRegistry';

export function createLambdaHandler(ControllerClass: Type) {
  // Resolve the controller via DI
  const controllerInstance = Injector.getInstance().resolve(ControllerClass);

  return async (event: any, context: any) => {
    // 1. Determine event type
    const isHttpEvent = !!event.httpMethod || !!(event.requestContext && event.requestContext.http);
    
    // 2. Identify target method from ENV (Injected by builder for 1:1 Lambda per Handle)
    const targetMethodName = process.env.AETHERION_TARGET_METHOD;

    if (!targetMethodName || typeof controllerInstance[targetMethodName] !== 'function') {
      if (isHttpEvent) {
        return { statusCode: 404, body: 'Not Found: Target method missing or invalid' };
      }
      throw new Error(`No suitable handler found for target method: ${targetMethodName}`);
    }

    // 3. Middlewares
    const classMiddlewares: Type<Middleware>[] = Reflect.getMetadata('middlewares', ControllerClass) || [];
    const methodMiddlewares: Type<Middleware>[] = Reflect.getMetadata('middlewares', ControllerClass.prototype, targetMethodName) || [];
    const allMiddlewares = [...classMiddlewares, ...methodMiddlewares];

    let middlewareIndex = 0;
    const executeMiddleware = async (): Promise<any> => {
      if (middlewareIndex < allMiddlewares.length) {
        const MiddlewareClass = allMiddlewares[middlewareIndex++];
        const middlewareInstance = Injector.getInstance().resolve(MiddlewareClass);
        return middlewareInstance.use(event, context, executeMiddleware);
      } else {
        // Finally execute the controller method
        return controllerInstance[targetMethodName!](event, context);
      }
    };

    try {
      const result = await executeMiddleware();
      
      if (isHttpEvent) {
        // Auto-format HTTP response if the controller just returned an object
        if (result && result.statusCode) {
          return result;
        }
        return {
          statusCode: 200,
          body: JSON.stringify(result),
          headers: { 'Content-Type': 'application/json' }
        };
      }
      return result; // SQS resolves normally
    } catch (error: any) {
      if (isHttpEvent) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
      }
      throw error;
    }
  };
}
