import 'reflect-metadata';

export type Type<T = any> = new (...args: any[]) => T;

export class Injector {
  private static instance: Injector;
  private container = new Map<Type, any>();

  private constructor() {}

  public static getInstance(): Injector {
    if (!Injector.instance) {
      Injector.instance = new Injector();
    }
    return Injector.instance;
  }

  public resolve<T>(target: Type<T>): T {
    // If instance already exists, return it (Singleton pattern)
    if (this.container.has(target)) {
      return this.container.get(target);
    }

    // Get constructor parameters
    const tokens = Reflect.getMetadata('design:paramtypes', target) || [];

    // Resolve dependencies recursively
    const injections = tokens.map((token: Type) => this.resolve(token));

    // Instantiate class with dependencies
    const instance = new target(...injections);
    
    // Store in container
    this.container.set(target, instance);

    return instance;
  }

  public provide<T>(target: Type<T>, instance: T) {
    this.container.set(target, instance);
  }
}
