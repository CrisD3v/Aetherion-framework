import { defineConfig } from '@aetherionfw/core';
import 'dotenv/config';

/**
 * Aetherion deployment configuration.
 *
 * Environment variables always override these values — useful for CI/CD pipelines.
 * Sensitive values (account IDs, secrets) should be loaded from environment variables
 * or a secrets manager rather than hardcoded here.
 *
 * Required env vars (can be set in a .env file):
 *   AWS_ACCOUNT_ID  - Your AWS account ID
 *   AWS_REGION      - Target region (e.g. us-east-1)
 *   AWS_PROFILE     - Named profile from ~/.aws/credentials (optional for CI/CD)
 */
export default defineConfig({
  /**
   * AWS Account ID.
   * Run `aws sts get-caller-identity` or `aetherion check-env` to find yours.
   */
  accountId: process.env.AWS_ACCOUNT_ID!,

  /**
   * AWS region where all resources will be deployed.
   */
  region: process.env.AWS_REGION ?? 'us-east-1',

  /**
   * Named AWS CLI profile for local development.
   * Remove or leave undefined when deploying from CI/CD using IAM roles or env vars.
   */
  profile: process.env.AWS_PROFILE ?? 'default',
});
