import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';

export async function synthCommand() {
  const spinner = ora('Synthesizing CDKTF infrastructure...').start();
  
  try {
    // In a real scenario, this would dynamically resolve the infra entrypoint.
    // Assuming the user runs this in their project root and there's a cdktf project.
    execSync('cdktf synth', { stdio: 'pipe' });
    spinner.succeed(chalk.green('Infrastructure synthesized successfully.'));
  } catch (err: any) {
    spinner.fail(chalk.red('Synthesis failed.'));
    console.error(err.message);
  }
}
