import { App } from 'cdktf';
import { FrameworkStack } from './builder/FrameworkStack';

const app = new App();
new FrameworkStack(app, 'aetherion-dev');
app.synth();
