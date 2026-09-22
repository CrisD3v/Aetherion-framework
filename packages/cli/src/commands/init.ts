import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';

export async function initCommand(projectName: string) {
  const spinner = ora(`Initializing project ${chalk.cyan(projectName)}...`).start();
  
  try {
    const projectPath = path.resolve(process.cwd(), projectName);
    if (fs.existsSync(projectPath)) {
      spinner.fail(`Directory ${chalk.red(projectName)} already exists.`);
      return;
    }

    // 1. Copy the entire template directory
    // Assuming this file runs from `dist/commands/init.js`, the template is at `../../template`
    // Depending on the build setup, we might need to adjust this path.
    const templatePath = path.resolve(__dirname, '../../template');
    
    if (!fs.existsSync(templatePath)) {
      spinner.fail(`Template directory not found at ${templatePath}`);
      return;
    }

    await fs.copy(templatePath, projectPath);

    // 2. Generate package.json dynamically
    const packageJson = {
      name: projectName,
      version: "1.0.0",
      scripts: {
        "build": "tsc",
        "synth": "aetherion synth",
        "deploy": "aetherion deploy",
        "docs": "aetherion docs",
        "test": "vitest run"
      },
      dependencies: {
        "@aetherion/core": "latest",
        "@aetherion/infra": "latest",
        "@aetherion/docs": "latest"
      },
      devDependencies: {
        "typescript": "^5.5.4",
        "vitest": "^2.0.5"
      }
    };
    await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });

    spinner.succeed(`Project ${chalk.green(projectName)} created successfully.`);
    console.log(chalk.blue(`\nNext steps:`));
    console.log(`  $ cd ${projectName}`);
    console.log(`  $ pnpm install`);
    console.log(`  $ pnpm test`);
    console.log(`  $ aetherion synth`);
  } catch (err: any) {
    spinner.fail(`Failed to create project: ${err.message}`);
  }
}
