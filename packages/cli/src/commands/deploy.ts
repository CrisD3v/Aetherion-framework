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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function isRetryableError(errMessage: string) {
    const retryable = [
        'No method response exists for method',
        'No integration defined for method',
        'Invalid Integration identifier specified',
        'Method already exists for this resource',
        'ConflictException'
    ];
    return retryable.some(msg => errMessage.includes(msg));
}

export async function deployCommand(options: any) {
  const skipBuild = options.skipBuild;
  const planOnly = options.planOnly;
  
  const config = loadConfig();
  const stackName = config.projectName ? `${config.projectName}-${config.stage || 'dev'}` : 'aetherion-dev';

  console.log(chalk.blue(`🚀 Deploying Aetherion Project (Stack: ${stackName})`));
  console.log();

  try {
    // 1. Build & Bundle (native pipeline)
    if (!skipBuild) {
      const buildSpinner = ora('Running native bundle pipeline (tsc → esbuild → zip)...').start();
      try {
        // FIX-003: Use the native bundler instead of delegating to npm run build
        const { bundleCommand } = require('./bundle');
        buildSpinner.stop();
        await bundleCommand();
      } catch (e: any) {
        buildSpinner.fail('Bundle pipeline failed');
        console.error(e.message);
        process.exit(1);
      }
    }

    // 1.5 Auto env-validation (DX-004: run check-env before synth)
    const envSpinner = ora('Validating AWS credentials...').start();
    try {
      const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
      const stsClient = new STSClient({ region: config.region || 'us-east-1' });
      await stsClient.send(new GetCallerIdentityCommand({}));
      envSpinner.succeed('AWS credentials validated');
    } catch (e: any) {
      envSpinner.fail('AWS credentials check failed');
      console.error(chalk.red('  Could not verify AWS credentials. Run `aetherion check-env` for details.'));
      console.error(chalk.dim(`  Error: ${e.message}`));
      process.exit(1);
    }

    // 2. Pre-deploy checks & Synth
    const synthSpinner = ora('Synthesizing CDKTF infrastructure...').start();
    try {
      // Synth using the current executing aetherion binary
      execSync(`node "${process.argv[1]}" synth`, { stdio: 'pipe', cwd: process.cwd() });
      synthSpinner.succeed('Infrastructure synthesized successfully');
    } catch (e: any) {
      synthSpinner.fail('Synthesis failed');
      console.error(e.message);
      process.exit(1);
    }

    const stackPath = path.resolve(process.cwd(), 'cdktf.out/stacks', stackName);
    if (!fs.existsSync(stackPath)) {
      console.error(chalk.red(`\nError: Stack directory not found at ${stackPath}`));
      process.exit(1);
    }

    // 3. Terraform Init
    const initSpinner = ora('Initializing Terraform...').start();
    try {
      execSync('terraform init', { cwd: stackPath, stdio: 'pipe' });
      initSpinner.succeed('Terraform initialized');
    } catch (e: any) {
      initSpinner.fail('Terraform init failed');
      console.error(e.message);
      process.exit(1);
    }

    // 4. Terraform Plan (if requested)
    if (planOnly) {
      console.log(chalk.cyan('\n📝 Generating Terraform Plan...'));
      execSync('terraform plan', { cwd: stackPath, stdio: 'inherit' });
      process.exit(0);
    }

    // 5. Terraform Apply with Retries
    const maxRetries = 3;
    let attempt = 1;
    let applySuccess = false;

    console.log(chalk.cyan(`\n⏳ Applying infrastructure changes...`));

    while (attempt <= maxRetries && !applySuccess) {
      try {
        // Use inherit so the user can see Terraform's progressive output
        execSync('terraform apply -auto-approve', { cwd: stackPath, stdio: 'inherit' });
        applySuccess = true;
        console.log(chalk.green('\n✅ Terraform apply completed successfully!'));
      } catch (err: any) {
        const errorOutput = err.stdout?.toString() || err.stderr?.toString() || err.message;
        
        if (isRetryableError(errorOutput) && attempt < maxRetries) {
          console.log(chalk.yellow(`\n⚠️ Attempt ${attempt} failed with a retryable API Gateway error.`));
          console.log(chalk.dim('This is a known eventual consistency issue with AWS API Gateway. Retrying in 5 seconds...'));
          await sleep(5000);
          attempt++;
        } else {
          console.error(chalk.red(`\n❌ Terraform apply failed on attempt ${attempt}.`));
          console.error(errorOutput);
          process.exit(1);
        }
      }
    }

    // 6. Post-deploy output
    console.log(chalk.magenta('\n📋 Deployment Summary:'));
    console.log(chalk.dim('  • Check your AWS console for the new resources.'));
    console.log(chalk.dim(`  • Stack Name: ${stackName}`));
    console.log(chalk.dim(`  • Region: ${config.region || 'us-east-1'}`));
    
    // Try to extract API Gateway URL from tfstate if possible (basic extraction)
    try {
      const tfstatePath = path.join(stackPath, 'terraform.tfstate');
      if (fs.existsSync(tfstatePath)) {
        const tfstate = JSON.parse(fs.readFileSync(tfstatePath, 'utf8'));
        const apiGateways = tfstate.resources?.filter((r: any) => r.type === 'aws_api_gateway_stage' || r.type === 'aws_apigatewayv2_stage') || [];
        
        if (apiGateways.length > 0) {
          console.log(chalk.green('\n🌐 API Endpoints:'));
          apiGateways.forEach((api: any) => {
            const url = api.instances?.[0]?.attributes?.invoke_url;
            if (url) {
              console.log(`  • ${chalk.cyan(url)}`);
            }
          });
        }
      }
    } catch (e) {
      // Ignore tfstate parsing errors
    }

    console.log(chalk.green('\n✨ Deploy completed cleanly.'));
    process.exit(0);

  } catch (err: any) {
    console.error(chalk.red('\nDeploy pipeline failed.'));
    console.error(err.message);
    process.exit(1);
  }
}
