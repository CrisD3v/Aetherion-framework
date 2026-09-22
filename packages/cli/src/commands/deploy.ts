import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';

export async function deployCommand() {
  const spinner = ora('Deploying infrastructure to AWS...').start();
  
  try {
    // Using inherit to show CDKTF output directly to the user
    spinner.stop(); 
    console.log(chalk.blue('Running cdktf deploy...'));
    execSync('cdktf deploy --auto-approve', { stdio: 'inherit' });
    console.log(chalk.green('\nDeploy completed successfully.'));
  } catch (err: any) {
    console.error(chalk.red('\nDeploy failed.'));
    process.exit(1);
  }
}
