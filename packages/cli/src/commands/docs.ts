import chalk from 'chalk';
import ora from 'ora';
// Assuming the CLI runs in an environment where @aetherionfw/docs is accessible
// For a global CLI, we might need to dynamically import it from the user's workspace
import { generateStaticDocs, startScalarServer } from '@aetherionfw/docs';
import * as path from 'path';
import * as fs from 'fs';
import open from 'open';

export async function docsCommand(options: any) {
  const isServe = options.serve;
  const spinner = ora('Preparing OpenAPI documentation...').start();
  
  try {
    // Dynamically register ts-node to load TS files from the user project
    require('ts-node').register({
      transpileOnly: true,
      compilerOptions: { module: 'commonjs' }
    });

    // Load the root app.module from the user's project
    const appModulePath = path.resolve(process.cwd(), 'src/app.module.ts');
    if (fs.existsSync(appModulePath)) {
      require(appModulePath);
    } else {
      spinner.warn(chalk.yellow('src/app.module.ts not found. API documentation might be empty.'));
    }

    // Always generate the static docs
    generateStaticDocs(process.cwd());

    if (isServe) {
      spinner.succeed(chalk.green('Starting Scalar API Reference Server...'));
      startScalarServer(3000);
      
      const url = 'http://localhost:3000/docs';
      console.log(chalk.cyan(`\nOpening browser at ${url}`));
      await open(url);
      
      // Keep process alive
    } else {
      spinner.succeed(chalk.green('Documentation generated at openapi.json'));
    }
  } catch (err: any) {
    spinner.fail(chalk.red('Failed to process documentation.'));
    console.error(err.message);
  }
}
