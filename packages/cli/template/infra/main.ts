// Import the modules to register them in the MetadataRegistry
import '../src/app.module';

import { App } from 'cdktf';
import { FrameworkStack } from '@aetherionfw/infra';

const app = new App();
// This automatically synthesizes all Lambdas, API Gateways, etc.
new FrameworkStack(app, 'initial-dev');
app.synth();
