import { Module } from '@aetherionfw/core';
import { InitialModule } from './initial/initial.module';

@Module({
  name: 'AppModule',
  imports: [InitialModule],
})
export class AppModule {}
