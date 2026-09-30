import 'reflect-metadata';
import { Injectable } from '@aetherionfw/core';

export interface ILogger {
  info(message: string, context?: any): void;
  error(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  debug(message: string, context?: any): void;
}

@Injectable()
export class StructuredLogger implements ILogger {
  private format(level: string, message: string, context?: any) {
    const baseContext = {
      timestamp: new Date().toISOString(),
      level,
      message,
      awsRequestId: process.env._X_AMZN_TRACE_ID || undefined,
      functionName: process.env.AWS_LAMBDA_FUNCTION_NAME || undefined,
    };
    
    return JSON.stringify({ ...baseContext, ...context });
  }

  info(message: string, context?: any) { 
    console.log(this.format('INFO', message, context)); 
  }
  
  error(message: string, context?: any) { 
    console.error(this.format('ERROR', message, context)); 
  }
  
  warn(message: string, context?: any) { 
    console.warn(this.format('WARN', message, context)); 
  }
  
  debug(message: string, context?: any) { 
    if (process.env.DEBUG || process.env.AETHERION_STAGE !== 'prod') {
      console.debug(this.format('DEBUG', message, context)); 
    }
  }
}

export const Logger = (): ParameterDecorator => {
  return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    // Aetherion uses `design:paramtypes` to resolve dependencies.
    // Since ILogger is an interface (which resolves to Object at runtime),
    // we override the parameter type to be StructuredLogger so the Injector instantiates it.
    const existingParamTypes: any[] = Reflect.getMetadata('design:paramtypes', target) || [];
    existingParamTypes[parameterIndex] = StructuredLogger;
    Reflect.defineMetadata('design:paramtypes', existingParamTypes, target);
  };
};
