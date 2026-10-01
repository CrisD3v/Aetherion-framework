import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import * as path from 'path';
import * as fs from 'fs';
import * as archiver from 'archiver';

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

/**
 * Auto-generate the Lambda entry point that routes requests
 * based on the AETHERION_TARGET_CLASS environment variable.
 *
 * This solves the "routing bug" described in the fix report:
 * The framework sets AETHERION_TARGET_CLASS per Lambda,
 * and this generated entry point uses it to find and invoke
 * the correct controller from the MetadataRegistry.
 */
function generateEntryPoint(distSrcDir: string) {
  const entryContent = `"use strict";
const { createLambdaHandler, MetadataRegistry } = require('@aetherionfw/core');

// Import all modules to register decorators in the MetadataRegistry
require('./app.module');

exports.handler = async (event, context) => {
  const targetClass = process.env.AETHERION_TARGET_CLASS;
  if (!targetClass) {
    throw new Error('AETHERION_TARGET_CLASS environment variable is not set. This Lambda was not provisioned correctly by the Aetherion framework.');
  }

  const registry = MetadataRegistry.getInstance();
  const controllers = registry.getControllers();
  const controllerEntry = controllers.find(([cls, meta]) => meta.lambdaName === targetClass);

  if (!controllerEntry) {
    const available = controllers.map(([, m]) => m.lambdaName).join(', ');
    throw new Error(
      \`No controller found for AETHERION_TARGET_CLASS="\${targetClass}". Available controllers: [\${available}]\`
    );
  }

  return createLambdaHandler(controllerEntry[0])(event, context);
};
`;

  fs.writeFileSync(path.join(distSrcDir, 'index.js'), entryContent);
}

/**
 * Create a zip archive from the bundled JS file.
 */
function createZip(bundlePath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    // Handle both default import and namespace import depending on TS compilation
    const archiverModule = (archiver as any).default || archiver;
    const archive = archiverModule('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', (err: Error) => reject(err));

    archive.pipe(output);
    archive.file(bundlePath, { name: 'bundle.js' });
    archive.finalize();
  });
}

export async function bundleCommand() {
  const config = loadConfig();

  console.log(chalk.blue('📦 Aetherion 1:1 Lambda Bundle Pipeline'));
  console.log();

  // Step 1: Compile TypeScript with tsc
  const tscSpinner = ora('Compiling TypeScript with tsc (preserving decorator metadata)...').start();
  try {
    const tsconfigPath = config.build?.tsconfig || 'tsconfig.json';
    execSync(`npx tsc -p ${tsconfigPath}`, { stdio: 'pipe', cwd: process.cwd() });
    tscSpinner.succeed('TypeScript compiled successfully');
  } catch (e: any) {
    tscSpinner.fail('TypeScript compilation failed');
    const output = e.stdout?.toString() || e.stderr?.toString() || e.message;
    console.error(chalk.red(output));
    process.exit(1);
  }

  // Determine build directories
  const buildDir = path.resolve(process.cwd(), '.aetherion/build');
  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true, force: true });
  }
  fs.mkdirSync(buildDir, { recursive: true });

  const distSrcDir = path.resolve(process.cwd(), 'dist/src');
  const distDir = fs.existsSync(distSrcDir) ? distSrcDir : path.resolve(process.cwd(), 'dist');

  // Step 2: Load MetadataRegistry
  const metaSpinner = ora('Scanning AST and loading MetadataRegistry...').start();
  try {
    // Register ts-node paths if necessary or just require the compiled app module
    const appModulePath = path.join(distDir, 'app.module.js');
    if (!fs.existsSync(appModulePath)) {
      throw new Error(`app.module.js not found at ${appModulePath}. Check your tsconfig rootDir.`);
    }

    // Set a flag to avoid executing actual app logic if the app runs on import
    process.env.AETHERION_IS_BUNDLING = 'true';
    require(appModulePath);

    metaSpinner.succeed('MetadataRegistry loaded successfully');
  } catch (e: any) {
    metaSpinner.fail('Failed to load MetadataRegistry');
    console.error(chalk.red(e.message));
    process.exit(1);
  }

  const { MetadataRegistry } = require('@aetherionfw/core');
  const registry = MetadataRegistry.getInstance();
  const controllers = registry.getControllers();

  if (controllers.length === 0) {
    console.log(chalk.yellow('⚠️ No controllers found. Make sure your app.module imports them.'));
    return;
  }

  console.log(chalk.blue(`\n🔍 Found ${controllers.length} controllers. Generating 1:1 Lambda bundles...`));

  // Step 3: Bundle each handle
  let totalBundles = 0;
  for (const [controllerClass, controllerMeta] of controllers) {
    const handles = registry.getHandles(controllerClass);
    
    for (const handleMeta of handles) {
      const lambdaName = `${controllerMeta.lambdaName}-${handleMeta.methodName}`;
      const entryContent = `"use strict";
const { createLambdaHandler, MetadataRegistry } = require('@aetherionfw/core');
require('${path.join(distDir, 'app.module.js').replace(/\\/g, '/')}');

exports.handler = async (event, context) => {
  const registry = MetadataRegistry.getInstance();
  const controllers = registry.getControllers();
  const controllerEntry = controllers.find(([cls, meta]) => meta.lambdaName === '${controllerMeta.lambdaName}');
  
  if (!controllerEntry) {
    throw new Error('Controller not found in registry at runtime.');
  }

  return createLambdaHandler(controllerEntry[0], '${handleMeta.methodName}')(event, context);
};
`;

      const entryPath = path.join(buildDir, `${lambdaName}.entry.js`);
      const bundlePath = path.join(buildDir, `${lambdaName}.bundle.js`);
      const zipPath = path.join(buildDir, `${lambdaName}.zip`);

      fs.writeFileSync(entryPath, entryContent);

      const spinner = ora(`Bundling ${chalk.cyan(lambdaName)}...`).start();
      try {
        // Run esbuild
        execSync(
          `npx esbuild "${entryPath}" --bundle --platform=node --target=node20 --outfile="${bundlePath}" --external:@aws-sdk/*`,
          { stdio: 'pipe', cwd: process.cwd() }
        );

        // Zip it
        await createZip(bundlePath, zipPath);

        const stats = fs.statSync(zipPath);
        const sizeKB = (stats.size / 1024).toFixed(1);
        spinner.succeed(`Bundled ${chalk.cyan(lambdaName)} (${sizeKB} KB)`);
        totalBundles++;
      } catch (e: any) {
        spinner.fail(`Failed to bundle ${lambdaName}`);
        console.error(chalk.red(e.message));
        process.exit(1);
      }
    }
  }

  console.log(chalk.green(`\n✅ 1:1 Architecture complete. Generated ${totalBundles} Lambda bundles in .aetherion/build/`));
}

