#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from '../commands/init';
import { synthCommand } from '../commands/synth';
import { deployCommand } from '../commands/deploy';
import { docsCommand } from '../commands/docs';
import { checkEnvCommand } from '../commands/check-env';
import { validateCommand } from '../commands/validate';
import { destroyCommand } from '../commands/destroy';
import { statusCommand } from '../commands/status';
import { bundleCommand } from '../commands/bundle';

const program = new Command();

program
  .name('aetherion')
  .description(chalk.blue('Aetherion Serverless Framework CLI'))
  .version('1.3.0');

program
  .command('init <project-name>')
  .description('Initialize a new Aetherion project')
  .action(initCommand);

program
  .command('synth')
  .description('Synthesize the infrastructure to CDKTF JSON')
  .action(synthCommand);

program
  .command('deploy')
  .description('Deploy the infrastructure to AWS')
  .option('--skip-build', 'Skip building the project before deployment')
  .option('--plan-only', 'Only show the terraform plan without applying')
  .action(deployCommand);

program
  .command('validate')
  .description('Validate the project configuration and prerequisites')
  .action(validateCommand);

program
  .command('destroy')
  .description('Destroy the deployed infrastructure')
  .option('--force', 'Bypass the confirmation prompt')
  .action(destroyCommand);

program
  .command('status')
  .description('Show the status of the deployed infrastructure')
  .action(statusCommand);

program
  .command('docs')
  .description('Generate OpenAPI documentation')
  .option('-s, --serve', 'Serve the documentation using Scalar UI locally')
  .action(docsCommand);

program
  .command('check-env')
  .description('Verify AWS credentials and connection using STS GetCallerIdentity')
  .action(checkEnvCommand);

program
  .command('bundle')
  .description('Bundle the project for Lambda deployment (tsc → esbuild → zip)')
  .action(bundleCommand);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
