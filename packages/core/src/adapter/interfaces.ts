export interface CanActivate {
  canActivate(event: any, context: any): boolean | Promise<boolean>;
}

export interface Middleware {
  use(event: any, context: any, next: () => Promise<any>): Promise<any>;
}
