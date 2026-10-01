/**
 * Aetherion deployment environment configuration.
 *
 * This is the single source of truth for all deployment settings.
 * Environment variables always take precedence over file-based config
 * to remain CI/CD-friendly.
 */
export interface AetherionConfig {
  /**
   * AWS account ID where the infrastructure will be deployed.
   * Can be hardcoded or read from an environment variable.
   * @example accountId: process.env.AWS_ACCOUNT_ID!
   */
  accountId: string;

  /**
   * AWS region for deployment.
   * @example region: 'us-east-2'
   */
  region: string;

  /**
   * AWS CLI profile name to use for local credentials.
   * Maps to the profile in `~/.aws/credentials`.
   * When deploying from CI/CD, leave undefined and use IAM roles or env vars instead.
   * @example profile: 'my-dev-profile'
   */
  profile?: string;

  /**
   * Deployment stage name (e.g., 'dev', 'staging', 'prod').
   * Used as suffix for resource naming and as the API Gateway stage name.
   * @default 'dev'
   */
  stage?: string;

  /**
   * Project name. Used for resource naming, tagging, and stack identification.
   * @example projectName: 'music-distri-pipe-api'
   */
  projectName?: string;

  /**
   * Default configuration applied to all Lambda functions.
   * Individual controller or handler settings always override these defaults.
   */
  lambdaDefaults?: {
    /** Default runtime for Lambda functions. @default 'nodejs20.x' */
    runtime?: string;
    /** Default memory size in MB. @default 128 */
    memorySize?: number;
    /** Default timeout in seconds. @default 3 */
    timeout?: number;
    /**
     * Environment variables injected into **every** Lambda function.
     * Useful for shared config like table names, pool IDs, etc.
     * Controller-level envVars and framework vars (AETHERION_TARGET_*) are merged on top.
     */
    envVars?: Record<string, string>;
  };

  /**
   * Build pipeline configuration.
   * Controls how the framework compiles and bundles your TypeScript code.
   */
  build?: {
    /** Path to tsconfig.json relative to project root. @default 'tsconfig.json' */
    tsconfig?: string;
    /** CDKTF/Infra entrypoint path (compiled JS). @default 'dist/infra/main.js' */
    entrypoint?: string;
  };

  /**
   * Terraform backend configuration for remote state.
   * When set, the framework configures an S3 backend with DynamoDB state locking,
   * preventing state conflicts when multiple developers deploy simultaneously.
   *
   * @example
   * ```typescript
   * backend: {
   *   bucket: 'my-terraform-state-bucket',
   *   dynamodbTable: 'terraform-locks',
   * }
   * ```
   */
  backend?: {
    /** S3 bucket name for storing terraform.tfstate */
    bucket: string;
    /** Key prefix in the bucket. @default 'terraform/<projectName>/<stage>/terraform.tfstate' */
    key?: string;
    /** DynamoDB table name for state locking. */
    dynamodbTable: string;
    /** Region for the backend resources. Falls back to the main region if not specified. */
    region?: string;
  };
}

/**
 * Define the Aetherion deployment configuration.
 * This function provides full type-safety and IDE autocompletion.
 *
 * @example
 * ```typescript
 * // aetherion.config.ts
 * import { defineConfig } from '@aetherionfw/core';
 *
 * export default defineConfig({
 *   accountId: process.env.AWS_ACCOUNT_ID!,
 *   region: process.env.AWS_REGION ?? 'us-east-2',
 *   profile: process.env.AWS_PROFILE ?? 'default',
 *   stage: 'dev',
 *   projectName: 'my-api',
 *   lambdaDefaults: {
 *     runtime: 'nodejs20.x',
 *     memorySize: 256,
 *     envVars: {
 *       TABLE_NAME: 'users-table-dev',
 *       COGNITO_POOL_ID: process.env.COGNITO_POOL_ID!,
 *     },
 *   },
 * });
 * ```
 */
export function defineConfig(config: AetherionConfig): AetherionConfig {
  return config;
}
