import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

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
  return null;
}

export async function validateCommand() {
  console.log(chalk.blue('🔍 Validating Aetherion Project Configuration'));
  console.log();

  let hasErrors = false;

  // 1. .env check
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    console.log(chalk.green('✔ .env file found'));
  } else {
    console.log(chalk.yellow('⚠ No .env file found. (This is okay if using CI/CD environment variables)'));
  }

  // 2. Config check
  const config = loadConfig();
  if (config) {
    console.log(chalk.green('✔ aetherion.config valid'));
    if (!config.accountId) console.log(chalk.yellow('  ⚠ accountId is missing (will fallback to env vars)'));
    if (!config.region) console.log(chalk.yellow('  ⚠ region is missing (will fallback to env vars or us-east-1)'));
  } else {
    console.log(chalk.red('✖ aetherion.config.ts not found or invalid'));
    hasErrors = true;
  }

  // 3. Entrypoint check
  const entrypoint = config?.build?.entrypoint || 'dist/infra/main.js';
  const entryPath = path.resolve(process.cwd(), entrypoint);
  if (fs.existsSync(entryPath)) {
    console.log(chalk.green(`✔ Built entrypoint found at ${entrypoint}`));
  } else {
    console.log(chalk.yellow(`⚠ Built entrypoint not found at ${entrypoint}. Make sure to run 'npm run build' before synth.`));
  }

  console.log();
  if (hasErrors) {
    console.error(chalk.red('Validation failed with errors.'));
    process.exit(1);
  } else {
    console.log(chalk.green('✅ Validation passed. Project is ready to deploy.'));
  }
}
