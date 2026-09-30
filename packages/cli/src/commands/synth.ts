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
    const entrypoint = config.build?.entrypoint || 'dist/infra/main.js';
    const entryPath = path.resolve(process.cwd(), entrypoint);

    if (!fs.existsSync(entryPath)) {
      // Fallback: maybe they haven't built yet, try to run ts-node if available, or just throw
      spinner.fail(`Entrypoint not found at ${entryPath}. Please run 'npm run build' first.`);
      process.exit(1);
    }

    // ARCH-001: Bypass cdktf CLI completely. Just execute the entrypoint directly.
    // The entrypoint calls app.synth() which generates cdktf.out locally.
    execSync(`node ${entryPath}`, { stdio: 'pipe', cwd: process.cwd() });
    
    // DX-006: Auto-generate cdktf.json just in case they want to use cdktf CLI manually
    const cdktfConfig = {
      language: "typescript",
      app: `node ${entrypoint}`,
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
