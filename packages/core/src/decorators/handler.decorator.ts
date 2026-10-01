import { MetadataRegistry, RouteMetadata, IamPermissionsInput, IamStatement } from '../registry/MetadataRegistry';

export function Route(metadata: Omit<RouteMetadata, 'methodName'>): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const fullMetadata: RouteMetadata = { ...metadata, methodName: String(propertyKey) };
    
    // CORE-002: Validation in @Route() to detect duplicates
    const registry = MetadataRegistry.getInstance();
    const existingRoutes = registry.getRoutes(target.constructor);
    const duplicate = existingRoutes.find(r => r.method === metadata.method && r.path === metadata.path);
    
    if (duplicate) {
      throw new Error(
        `Duplicate route: ${metadata.method.toUpperCase()} ${metadata.path} is already defined in method "${duplicate.methodName}"`
      );
    }

    registry.registerRoute(target.constructor, fullMetadata);
    Reflect.defineMetadata('route', fullMetadata, target, propertyKey);
  };
}

export function Handle(options?: { timeout?: number; memorySize?: number; envKeys?: string[] }): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    MetadataRegistry.getInstance().registerHandle(target.constructor, {
      methodName: String(propertyKey),
      timeout: options?.timeout,
      memorySize: options?.memorySize,
      envKeys: options?.envKeys,
    });
    Reflect.defineMetadata('handle', options || true, target, propertyKey);
  };
}

/**
 * Define IAM permissions for this controller or handler.
 *
 * @example Using AWS-native format (RECOMMENDED):
 * ```typescript
 * import permissions from './iam/my.permissions.json';
 *
 * @IamPermissions([
 *   { "Effect": "Allow", "Action": ["dynamodb:GetItem"], "Resource": ["arn:aws:dynamodb:*:*:table/my-table"] }
 * ])
 * ```
 */
export function IamPermissions(permissions: IamPermissionsInput): ClassDecorator & MethodDecorator {
  // CORE-001: Validate IAM schema
  if (!permissions) {
    throw new Error(`@IamPermissions expects permissions data, got: ${typeof permissions}`);
  }

  // Normalize to internal format, validating along the way
  let normalizedPermissions: any;

  if (Array.isArray(permissions)) {
    // Validate AWS native format
    for (const stmt of permissions) {
      if (!stmt.Effect || !stmt.Action || !stmt.Resource) {
        throw new Error(`Invalid IAM statement in @IamPermissions: must have Effect, Action, and Resource. Got: ${JSON.stringify(stmt)}`);
      }
    }
    normalizedPermissions = permissions;
  } else if (typeof permissions === 'object') {
    // Handle legacy service-grouped format, but we don't throw, just pass it through
    // as the builder will normalize it. But we can ensure it's an object.
    normalizedPermissions = permissions;
  } else {
    throw new Error(`@IamPermissions expects an array of IAM statements or a permissions object, got: ${typeof permissions}`);
  }

  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    const actualTarget = propertyKey ? target.constructor : target;
    MetadataRegistry.getInstance().registerIamPermissions(actualTarget, {
      methodName: propertyKey ? String(propertyKey) : undefined,
      permissions: normalizedPermissions
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
