#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from '../commands/init';
import { synthCommand } from '../commands/synth';
import { deployCommand } from '../commands/deploy';
import { docsCommand } from '../commands/docs';

const program = new Command();

program
  .name('aetherion')
  .description(chalk.blue('Aetherion Serverless Framework CLI'))
  .version('1.0.0');

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
  .action(deployCommand);

program
  .command('docs')
  .description('Generate OpenAPI documentation')
  .option('-s, --serve', 'Serve the documentation using Scalar UI locally')
  .action(docsCommand);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
