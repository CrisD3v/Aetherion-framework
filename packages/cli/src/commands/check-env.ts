import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { fromIni } from '@aws-sdk/credential-providers';
import type { AetherionConfig } from '@aetherionfw/core';

/**
 * Loads aetherion.config.ts/js from the current working directory.
 * Returns null if not found (will fall back to env vars / default profile).
 */
function loadConfig(): AetherionConfig | null {
  const candidates = [
    path.resolve(process.cwd(), 'aetherion.config.ts'),
    path.resolve(process.cwd(), 'aetherion.config.js'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require(candidate);
        return mod.default ?? mod;
      } catch {
        // Ignore require errors — will be reported separately
      }
    }
  }
  return null;
}

export async function checkEnvCommand() {
  const spinner = ora('Reading Aetherion config...').start();

  const fileConfig = loadConfig();

  // Env vars always override the config file (CI/CD friendly)
  const region =
    process.env.AWS_REGION ??
    process.env.AWS_DEFAULT_REGION ??
    fileConfig?.region ??
    'us-east-1';

  const profile = process.env.AWS_PROFILE ?? fileConfig?.profile;
  const expectedAccountId = process.env.AWS_ACCOUNT_ID ?? fileConfig?.accountId;

  spinner.text = 'Connecting to AWS STS...';

  try {
    const clientConfig: ConstructorParameters<typeof STSClient>[0] = { region };

    // Use named profile credentials when a profile is configured
    if (profile) {
      clientConfig.credentials = fromIni({ profile });
    }

    const client = new STSClient(clientConfig);
    const response = await client.send(new GetCallerIdentityCommand({}));

    spinner.succeed(chalk.green('AWS connection verified successfully!\n'));

    console.log(chalk.bold('  Identity:'));
    console.log(`    ${chalk.dim('Account :')} ${chalk.cyan(response.Account)}`);
    console.log(`    ${chalk.dim('UserId  :')} ${chalk.cyan(response.UserId)}`);
    console.log(`    ${chalk.dim('ARN     :')} ${chalk.cyan(response.Arn)}`);
    console.log(`    ${chalk.dim('Region  :')} ${chalk.cyan(region)}`);
    if (profile) {
      console.log(`    ${chalk.dim('Profile :')} ${chalk.cyan(profile)}`);
    }

    // Warn if the resolved account differs from what is configured
    if (expectedAccountId && response.Account !== expectedAccountId) {
      console.log();
      console.log(
        chalk.yellow(
          `  ⚠ Warning: The active AWS account (${response.Account}) does not match` +
          ` the accountId in your config (${expectedAccountId}).`
        )
      );
    } else if (expectedAccountId) {
      console.log();
      console.log(chalk.green(`  ✔ Account matches aetherion.config.ts (${response.Account})`));
    }

    console.log();
  } catch (err: any) {
    spinner.fail(chalk.red('AWS connection failed.'));
    console.error();
    console.error(chalk.red(`  Error: ${err.message}`));
    console.error();
    console.error(chalk.dim('  Troubleshooting:'));
    console.error(chalk.dim('    • Make sure your AWS credentials are configured (~/.aws/credentials or environment variables).'));
    console.error(chalk.dim('    • If using a named profile, ensure it is set in aetherion.config.ts under the `profile` field.'));
    console.error(chalk.dim('    • Verify that the profile has permission to call sts:GetCallerIdentity.'));
    process.exit(1);
  }
}
