import { App } from 'cdktf';
import { FrameworkStack } from './builder/FrameworkStack';
import { MetadataRegistry } from '@aetherionfw/core';
import * as path from 'path';
import * as fs from 'fs';

// Dynamically load config to get project name and stage
function loadConfig() {
  const configPath = path.resolve(process.cwd(), 'aetherion.config.ts');
  const configJsPath = path.resolve(process.cwd(), 'aetherion.config.js');
  let resolvedPath = null;
  if (fs.existsSync(configPath)) resolvedPath = configPath;
  else if (fs.existsSync(configJsPath)) resolvedPath = configJsPath;
  
  if (resolvedPath) {
    try {
      const mod = require(resolvedPath);
      return mod.default ?? mod;
    } catch (e) {
      // Ignore
    }
  }
  return {};
}

const config = loadConfig();
const stackName = config.projectName ? `${config.projectName}-${config.stage || 'dev'}` : 'aetherion-dev';

const app = new App();
new FrameworkStack(app, stackName);
app.synth();
