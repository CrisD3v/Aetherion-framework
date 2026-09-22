import { Module } from '@aetherion/core';
import { InitialInfra } from './infra/initial.infra';
import { InitialLambdaController } from './controllers/initial.lambda';
import { InitialHealthService } from './application/initial-health.service';

@Module({
  name: 'InitialModule',
  providers: [InitialHealthService],
  controllers: [InitialLambdaController],
  infra: [InitialInfra],
})
export class InitialModule {}
