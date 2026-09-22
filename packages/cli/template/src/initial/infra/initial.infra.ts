import { Infra } from '@aetherion/core';
// Using generic HttpApi decorators if available, or just mocking for the template
// Since we only added standard decorators like @Vpc, @S3Bucket, etc. earlier, we'll use a placeholder or generic @Infra config

@Infra()
export class InitialInfra {
  // Example definition
  // @ApiGatewayHttpApi({ name: 'initial-api', description: 'Initial health API for Aetherion framework' })
  // api!: any;
}
