import { MetadataRegistry } from '@aetherion/core';
import { DocsRegistry } from '../registry/DocsRegistry';

export class OpenApiBuilder {
  public build(title: string, version: string = '1.0.0') {
    const metaRegistry = MetadataRegistry.getInstance();
    const docsRegistry = DocsRegistry.getInstance();

    const openapi: any = {
      openapi: '3.0.0',
      info: { title, version },
      paths: {},
      components: {
        schemas: {}
      }
    };

    // 1. Build Schemas
    const schemas = docsRegistry.getSchemas();
    for (const [target, properties] of schemas) {
      const schemaName = target.name;
      const requiredProps: string[] = [];
      const propertiesObj: any = {};

      for (const prop of properties) {
        propertiesObj[prop.name] = {
          type: prop.type,
          description: prop.description,
          example: prop.example
        };
        if (prop.required !== false) {
          requiredProps.push(prop.name);
        }
      }

      openapi.components.schemas[schemaName] = {
        type: 'object',
        properties: propertiesObj,
        required: requiredProps.length > 0 ? requiredProps : undefined
      };
    }

    // 2. Build Paths & Operations
    const controllers = metaRegistry.getControllers();
    for (const [target, _] of controllers) {
      const tagMeta = docsRegistry.getTag(target);
      const routes = metaRegistry.getRoutes(target);

      // In a real implementation we would map route -> prototype method name.
      // For this simplified version, let's assume route paths are properly mapped
      // and we just try to find the matching documentation via a heuristic (or the stored method name).
      
      const prototype = target.prototype;
      const methods = Object.getOwnPropertyNames(prototype).filter(m => m !== 'constructor');

      for (const method of methods) {
        // Did @Route tag this method?
        const routeMeta = Reflect.getMetadata('route', prototype, method);
        if (routeMeta && routeMeta.path && routeMeta.method) {
          const path = routeMeta.path;
          const httpMethod = routeMeta.method.toLowerCase();
          
          if (!openapi.paths[path]) {
            openapi.paths[path] = {};
          }

          const opMeta = docsRegistry.getOperation(target, method) || { summary: method };
          const responsesMeta = docsRegistry.getResponses(target, method);

          const responsesObj: any = {};
          if (responsesMeta.length === 0) {
            responsesObj['200'] = { description: 'Success' };
          } else {
            for (const res of responsesMeta) {
              responsesObj[String(res.status)] = {
                description: res.description,
                content: res.type ? {
                  'application/json': {
                    schema: { $ref: `#/components/schemas/${res.type.name}` }
                  }
                } : undefined
              };
            }
          }

          openapi.paths[path][httpMethod] = {
            summary: opMeta.summary,
            description: opMeta.description,
            tags: tagMeta ? [tagMeta.name] : ['Default'],
            responses: responsesObj
          };
        }
      }
    }

    return openapi;
  }
}
