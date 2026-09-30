import 'reflect-metadata';

// ────────────────────────────────────────────
// Exported Types & Interfaces
// ────────────────────────────────────────────

export interface ModuleMetadata {
  name: string;
  imports?: any[];
  providers?: any[];
  controllers?: any[];
  infra?: any[];
}

export interface ControllerMetadata {
  lambdaName: string;
  runtime?: string;
  memorySize?: number;
  timeout?: number;
  layers?: string[];
  apiGateway?: string;
  /**
   * Environment variables to inject into every Lambda generated from this controller.
   * These override project-level `lambdaDefaults.envVars` but are overridden by framework vars.
   */
  envVars?: Record<string, string>;
}

export interface RouteMetadata {
  method: string;
  path: string;
  authorizer?: string;
  methodName: string;
}

export interface HandleMetadata {
  methodName: string;
  timeout?: number;
  memorySize?: number;
}

export interface IamPermissionMetadata {
  methodName?: string;
  permissions: any; // Validated at decoration time, normalized at build time
}

export interface SqsTriggerMetadata {
  queueName: string;
  methodName: string;
  options?: any;
}

export interface InfraMetadata {
  type: string;
  name: string;
  props: any;
}

export interface ApiGatewayMetadata {
  name: string;
  type: 'REST' | 'HTTP';
  description?: string;
  existingApiId?: string;
  existingRootResourceId?: string;
  stageName?: string;
  corsEnabled?: boolean;
  corsOrigins?: string[];
}

// ────────────────────────────────────────────
// IAM Permission Types (CORE-001)
// ────────────────────────────────────────────

/**
 * AWS IAM policy statement in native format (RECOMMENDED).
 *
 * @example
 * ```typescript
 * const stmt: IamStatement = {
 *   Effect: 'Allow',
 *   Action: ['dynamodb:GetItem', 'dynamodb:Query'],
 *   Resource: 'arn:aws:dynamodb:*:*:table/Users',
 * };
 * ```
 */
export interface IamStatement {
  Effect: 'Allow' | 'Deny';
  Action: string | string[];
  Resource: string | string[];
}

/**
 * IAM permissions input format.
 *
 * Supports two formats:
 *
 * 1. **AWS Native (recommended):** Array of `{ Effect, Action, Resource }` statements.
 * 2. **Service-grouped (legacy):** Object keyed by service name with `{ action, resource }` rules.
 *
 * @example AWS Native format (recommended):
 * ```typescript
 * @IamPermissions([
 *   { Effect: 'Allow', Action: ['dynamodb:GetItem'], Resource: ['arn:aws:dynamodb:*:*:table/Users'] }
 * ])
 * ```
 *
 * @example Service-grouped format (legacy):
 * ```typescript
 * @IamPermissions({
 *   dynamodb: [{ action: 'dynamodb:GetItem', resource: 'arn:aws:dynamodb:*:*:table/Users' }]
 * })
 * ```
 */
export type IamPermissionsInput =
  | IamStatement[]
  | Record<string, Array<{ action: string | string[]; resource: string | string[] }>>;

// ────────────────────────────────────────────
// DynamoDB Types (INFRA-003)
// ────────────────────────────────────────────

/** Supported DynamoDB attribute types. */
export type DynamoAttributeType = 'STRING' | 'NUMBER' | 'BINARY';

/** A DynamoDB key attribute (partition key or sort key). */
export interface DynamoKeyAttribute {
  name: string;
  type: DynamoAttributeType;
}

/** Configuration for a DynamoDB Global Secondary Index (GSI). */
export interface DynamoGsiConfig {
  /** Name of the GSI. */
  name: string;
  /** Hash key attribute name for the GSI. */
  hashKey: string;
  /** Hash key attribute type. @default 'STRING' */
  hashKeyType?: DynamoAttributeType;
  /** Optional range key attribute name. */
  rangeKey?: string;
  /** Range key attribute type. @default 'STRING' */
  rangeKeyType?: DynamoAttributeType;
  /** Projection type for the GSI. @default 'ALL' */
  projectionType?: 'ALL' | 'KEYS_ONLY' | 'INCLUDE';
  /** Non-key attributes to project (only when projectionType is 'INCLUDE'). */
  nonKeyAttributes?: string[];
}

// ────────────────────────────────────────────
// Registry Class
// ────────────────────────────────────────────

export class MetadataRegistry {
  private static instance: MetadataRegistry;

  private modules: Map<any, ModuleMetadata> = new Map();
  private controllers: Map<any, ControllerMetadata> = new Map();
  private handles: Map<any, HandleMetadata[]> = new Map();
  private iamPermissions: Map<any, IamPermissionMetadata[]> = new Map();
  private routes: Map<any, RouteMetadata[]> = new Map();
  private sqsTriggers: Map<any, SqsTriggerMetadata[]> = new Map(); // target -> triggers
  private infraClasses: Map<any, any> = new Map();
  private infraResources: Map<any, InfraMetadata[]> = new Map(); // target -> resources

  private constructor() {}

  public static getInstance(): MetadataRegistry {
    if (!MetadataRegistry.instance) {
      MetadataRegistry.instance = new MetadataRegistry();
    }
    return MetadataRegistry.instance;
  }

  public registerModule(target: any, metadata: ModuleMetadata) {
    this.modules.set(target, metadata);
  }

  public getModules() {
    return Array.from(this.modules.entries());
  }

  public registerController(target: any, metadata: ControllerMetadata) {
    this.controllers.set(target, metadata);
  }

  public getControllers() {
    return Array.from(this.controllers.entries());
  }

  public registerHandle(target: any, metadata: HandleMetadata) {
    if (!this.handles.has(target)) {
      this.handles.set(target, []);
    }
    this.handles.get(target)!.push(metadata);
  }

  public getHandles(target: any): HandleMetadata[] {
    return this.handles.get(target) || [];
  }

  public registerIamPermissions(target: any, metadata: IamPermissionMetadata) {
    if (!this.iamPermissions.has(target)) {
      this.iamPermissions.set(target, []);
    }
    this.iamPermissions.get(target)!.push(metadata);
  }

  public getIamPermissions(target: any): IamPermissionMetadata[] {
    return this.iamPermissions.get(target) || [];
  }

  public registerRoute(target: any, metadata: RouteMetadata) {
    if (!this.routes.has(target)) {
      this.routes.set(target, []);
    }
    this.routes.get(target)!.push(metadata);
  }

  public getRoutes(target: any): RouteMetadata[] {
    return this.routes.get(target) || [];
  }

  public registerSqsTrigger(target: any, metadata: SqsTriggerMetadata) {
    if (!this.sqsTriggers.has(target)) {
      this.sqsTriggers.set(target, []);
    }
    this.sqsTriggers.get(target)!.push(metadata);
  }

  public getSqsTriggers(target: any): SqsTriggerMetadata[] {
    return this.sqsTriggers.get(target) || [];
  }

  public registerInfraClass(target: any) {
    this.infraClasses.set(target, true);
  }

  public getInfraClasses() {
    return Array.from(this.infraClasses.keys());
  }

  public registerInfraResource(target: any, metadata: InfraMetadata) {
    if (!this.infraResources.has(target)) {
      this.infraResources.set(target, []);
    }
    this.infraResources.get(target)!.push(metadata);
  }

  public getInfraResources(target: any): InfraMetadata[] {
    return this.infraResources.get(target) || [];
  }

  // ────────────────────────────────────────────
  // Validation Methods (called at synth time)
  // ────────────────────────────────────────────

  /**
   * Validates that all `apiGateway` references in controllers point to
   * an existing `@ApiGateway()` declaration. Returns an array of warning strings.
   * Called by FrameworkStack during synthesis. (CORE-003)
   */
  public validateApiGatewayReferences(): string[] {
    const warnings: string[] = [];

    // Collect all declared API Gateway names from infra resources
    const declaredGateways = new Set<string>();
    for (const target of this.getInfraClasses()) {
      for (const res of this.getInfraResources(target)) {
        if (res.type === 'ApiGateway') {
          declaredGateways.add(res.props.name);
        }
      }
    }

    // Check every controller's apiGateway reference
    for (const [target, meta] of this.controllers) {
      if (meta.apiGateway && !declaredGateways.has(meta.apiGateway)) {
        warnings.push(
          `Controller "${meta.lambdaName}" references apiGateway "${meta.apiGateway}" ` +
          `which is not declared in any @Infra class. ` +
          `Available gateways: [${Array.from(declaredGateways).join(', ')}]`
        );
      }
    }

    return warnings;
  }

  /**
   * Returns a flat list of all registered routes across all controllers,
   * useful for global duplicate detection at synth time.
   */
  public getAllRoutesFlat(): Array<{ controller: string; route: RouteMetadata }> {
    const result: Array<{ controller: string; route: RouteMetadata }> = [];

    for (const [target, meta] of this.controllers) {
      const routes = this.getRoutes(target);
      for (const route of routes) {
        result.push({ controller: meta.lambdaName, route });
      }
    }

    return result;
  }
}
