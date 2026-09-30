import { execSync } from 'child_process';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

export async function destroyCommand(options: any) {
  const config = loadConfig();
  const stackName = config.projectName ? `${config.projectName}-${config.stage || 'dev'}` : 'aetherion-dev';
  const stackPath = path.resolve(process.cwd(), 'cdktf.out/stacks', stackName);

  if (!fs.existsSync(stackPath)) {
    console.error(chalk.red(`\nError: Stack directory not found at ${stackPath}. Cannot destroy.`));
    process.exit(1);
  }

  const force = options.force || options.autoApprove;

  console.log(chalk.red(`⚠ WARNING: You are about to DESTROY ALL resources in stack '${stackName}'`));
  
  const proceed = await new Promise(resolve => {
    if (force) {
      resolve(true);
      return;
    }
    rl.question('Are you sure you want to continue? (y/N): ', answer => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });

  rl.close();

  if (!proceed) {
    console.log(chalk.gray('Destroy cancelled.'));
    process.exit(0);
  }

  console.log(chalk.cyan('\n🗑 Destroying infrastructure...'));

  try {
    execSync('terraform destroy -auto-approve', { cwd: stackPath, stdio: 'inherit' });
    console.log(chalk.green('\n✅ Infrastructure destroyed successfully.'));
  } catch (err: any) {
    console.error(chalk.red('\n❌ Destroy failed.'));
    console.error(err.message);
    process.exit(1);
  }
}
