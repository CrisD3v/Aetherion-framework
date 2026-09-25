/**
 * Aetherion deployment environment configuration.
 */
export interface AetherionConfig {
  /**
   * AWS account ID where the infrastructure will be deployed.
   * Can be hardcoded or read from an environment variable:
   * @example accountId: process.env.AWS_ACCOUNT_ID!
   */
  accountId: string;

  /**
   * AWS region for deployment.
   * @example region: 'us-east-1'
   */
  region: string;

  /**
   * AWS CLI profile name to use for local credentials.
   * Maps to the profile in `~/.aws/credentials`.
   * When deploying from CI/CD, leave undefined and use IAM roles or env vars instead.
   * @example profile: 'my-dev-profile'
   */
  profile?: string;
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
 *   region: process.env.AWS_REGION ?? 'us-east-1',
 *   profile: process.env.AWS_PROFILE ?? 'default',
 * });
 * ```
 */
export function defineConfig(config: AetherionConfig): AetherionConfig {
  return config;
}
