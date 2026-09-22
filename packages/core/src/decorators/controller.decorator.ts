import { MetadataRegistry, ControllerMetadata } from '../registry/MetadataRegistry';

export function LambdaController(metadata: ControllerMetadata): ClassDecorator {
  return (target: any) => {
    MetadataRegistry.getInstance().registerController(target, metadata);
  };
}
