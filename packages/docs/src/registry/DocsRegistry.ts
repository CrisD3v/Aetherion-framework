export interface ApiPropertyMetadata {
  name: string;
  type?: any;
  description?: string;
  example?: any;
  required?: boolean;
}

export interface ApiOperationMetadata {
  summary: string;
  description?: string;
}

export interface ApiResponseMetadata {
  status: number;
  description: string;
  type?: any;
}

export class DocsRegistry {
  private static instance: DocsRegistry;

  private schemas = new Map<any, ApiPropertyMetadata[]>();
  private operations = new Map<any, Map<string, ApiOperationMetadata>>(); // Controller -> method -> Metadata
  private responses = new Map<any, Map<string, ApiResponseMetadata[]>>(); // Controller -> method -> Metadata
  private tags = new Map<any, { name: string; description?: string }>(); // Controller -> Tag

  private constructor() {}

  public static getInstance(): DocsRegistry {
    if (!DocsRegistry.instance) {
      DocsRegistry.instance = new DocsRegistry();
    }
    return DocsRegistry.instance;
  }

  public registerProperty(target: any, metadata: ApiPropertyMetadata) {
    if (!this.schemas.has(target)) {
      this.schemas.set(target, []);
    }
    this.schemas.get(target)!.push(metadata);
  }

  public getSchemas() {
    return Array.from(this.schemas.entries());
  }

  public registerOperation(target: any, method: string, metadata: ApiOperationMetadata) {
    if (!this.operations.has(target)) {
      this.operations.set(target, new Map());
    }
    this.operations.get(target)!.set(method, metadata);
  }

  public getOperation(target: any, method: string): ApiOperationMetadata | undefined {
    return this.operations.get(target)?.get(method);
  }

  public registerResponse(target: any, method: string, metadata: ApiResponseMetadata) {
    if (!this.responses.has(target)) {
      this.responses.set(target, new Map());
    }
    const methodResponses = this.responses.get(target)!;
    if (!methodResponses.has(method)) {
      methodResponses.set(method, []);
    }
    methodResponses.get(method)!.push(metadata);
  }

  public getResponses(target: any, method: string): ApiResponseMetadata[] {
    return this.responses.get(target)?.get(method) || [];
  }

  public registerTag(target: any, name: string, description?: string) {
    this.tags.set(target, { name, description });
  }

  public getTag(target: any) {
    return this.tags.get(target);
  }
}
