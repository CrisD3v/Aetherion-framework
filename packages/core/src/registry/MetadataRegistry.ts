import 'reflect-metadata';

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
  permissions: Record<string, any>;
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
}
