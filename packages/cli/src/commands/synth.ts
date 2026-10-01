import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import * as path from 'path';
import * as fs from 'fs';

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

export async function synthCommand() {
  const spinner = ora('Synthesizing infrastructure...').start();
  
  try {
    const config = loadConfig();
    const buildDir = path.resolve(process.cwd(), 'dist/src');
    const distDir = fs.existsSync(buildDir) ? buildDir : path.resolve(process.cwd(), 'dist');
    const appModulePath = path.join(distDir, 'app.module.js');

    if (!fs.existsSync(appModulePath)) {
      spinner.fail(`app.module.js not found at ${appModulePath}. Please run 'npm run build' first.`);
      process.exit(1);
    }

    // ARCH-001: Bypass cdktf CLI completely. Just execute the built-in infra entrypoint.
    // We execute it dynamically to ensure it uses the user's config and compiled app.module.
    const infraRunner = `
      require('${appModulePath.replace(/\\/g, '/')}');
      const { synthApp } = require('@aetherionfw/infra');
      synthApp(${JSON.stringify(config)});
    `;
    
    fs.writeFileSync(path.resolve(process.cwd(), '.aetherion-build/synth.js'), infraRunner);
    execSync(`node .aetherion-build/synth.js`, { stdio: 'pipe', cwd: process.cwd() });
    
    // DX-006: Auto-generate cdktf.json just in case they want to use cdktf CLI manually
    const cdktfConfig = {
      language: "typescript",
      app: `node .aetherion-build/synth.js`,
      projectId: config.projectName || "aetherion-project",
      terraformProviders: ["hashicorp/aws@~> 5.0", "hashicorp/archive@~> 2.0"],
      output: "cdktf.out",
    };
    fs.writeFileSync(path.resolve(process.cwd(), 'cdktf.json'), JSON.stringify(cdktfConfig, null, 2));

    spinner.succeed(chalk.green('Infrastructure synthesized successfully to cdktf.out/'));
  } catch (err: any) {
    spinner.fail(chalk.red('Synthesis failed.'));
    console.error(err.stdout?.toString() || err.stderr?.toString() || err.message);
    process.exit(1);
  }
}
