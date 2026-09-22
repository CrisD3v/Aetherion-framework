import { MetadataRegistry, ModuleMetadata } from '../registry/MetadataRegistry';

export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: any) => {
    MetadataRegistry.getInstance().registerModule(target, metadata);
  };
}
