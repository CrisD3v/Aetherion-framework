import chalk from 'chalk';
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

export async function statusCommand() {
  const config = loadConfig();
  const stackName = config.projectName ? `${config.projectName}-${config.stage || 'dev'}` : 'aetherion-dev';
  const stackPath = path.resolve(process.cwd(), 'cdktf.out/stacks', stackName);
  const tfstatePath = path.join(stackPath, 'terraform.tfstate');

  console.log(chalk.blue(`📊 Aetherion Project Status`));
  console.log(chalk.dim('──────────────────────────────'));
  console.log(`Stack:  ${chalk.cyan(stackName)}`);
  console.log(`Region: ${chalk.cyan(config.region || 'us-east-1')}`);

  if (!fs.existsSync(tfstatePath)) {
    console.log(chalk.yellow(`\nNo deployment found (terraform.tfstate missing).`));
    console.log(`Run ${chalk.green('aetherion deploy')} to create infrastructure.`);
    return;
  }

  try {
    const tfstate = JSON.parse(fs.readFileSync(tfstatePath, 'utf8'));
    const resources = tfstate.resources || [];
    
    const apiGateways = resources.filter((r: any) => r.type === 'aws_api_gateway_stage' || r.type === 'aws_apigatewayv2_stage');
    const lambdas = resources.filter((r: any) => r.type === 'aws_lambda_function');
    const dbs = resources.filter((r: any) => r.type === 'aws_dynamodb_table');
    const cognitos = resources.filter((r: any) => r.type === 'aws_cognito_user_pool');
    
    console.log(`Resources: ${resources.length} total deployed\n`);
    
    if (apiGateways.length > 0) {
      console.log(chalk.bold('🌐 API Gateways:'));
      apiGateways.forEach((api: any) => {
        const url = api.instances?.[0]?.attributes?.invoke_url;
        if (url) console.log(`  - ${chalk.green(url)}`);
      });
    }

    console.log(chalk.bold('\n⚡ Compute:'));
    console.log(`  - ${lambdas.length} Lambda functions deployed`);

    if (dbs.length > 0) {
      console.log(chalk.bold('\n💾 Databases:'));
      dbs.forEach((db: any) => {
        const name = db.instances?.[0]?.attributes?.name;
        if (name) console.log(`  - DynamoDB: ${chalk.cyan(name)}`);
      });
    }

    if (cognitos.length > 0) {
      console.log(chalk.bold('\n🔐 Auth:'));
      cognitos.forEach((c: any) => {
        const name = c.instances?.[0]?.attributes?.name;
        if (name) console.log(`  - Cognito Pool: ${chalk.cyan(name)}`);
      });
    }

  } catch (err: any) {
    console.error(chalk.red(`\nError reading status: ${err.message}`));
  }
}
