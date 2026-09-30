# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-09-30

### Added
- **Core:** Added `AetherionConfig` extended fields (`stage`, `projectName`, `lambdaDefaults`) in `defineConfig`.
- **Core:** Support for `CognitoUserPoolClient` in `@Infra` decorators.
- **Core:** Support for DynamoDB Global Secondary Indexes (GSIs) and Sort Keys via `@DynamoTable`.
- **Core:** Enhanced IAM schema support via `@IamPermissions` accepting both native AWS format and legacy object maps.
- **CLI:** Native `aetherion validate` command to check environment and build prerequisites.
- **CLI:** Native `aetherion status` command to introspect `terraform.tfstate` for active deployed resources (Endpoints, Compute, DBs).
- **CLI:** Native `aetherion destroy` command with safety prompts.
- **CLI/Init:** `aetherion init` now auto-generates `.env` and `.env.example`.

### Changed
- **CLI/Deploy:** Major refactor of the deployment pipeline. `aetherion deploy` is now an "all-in-one" command that runs build, synth, and terraform apply automatically.
- **CLI/Deploy:** The CLI now invokes `terraform` directly via `child_process`, eliminating reliance on the buggy Windows `cdktf` CLI wrapper.
- **CLI/Deploy:** Added intelligent retry logic for eventual consistency errors (e.g. `ConflictException`) during API Gateway deployments.
- **Infra/CDKTF:** Bypassed `cdktf synth` CLI, generating terraform modules directly by invoking the application entry point.
- **Infra/Builder:** The infrastructure builder dynamically resolves AWS region and account ID from `aetherion.config.ts`.
- **Infra/Builder:** API Gateway deployments now strictly depend on all associated route/method changes, forcing clean redeployments when paths update.
- **Infra/Builder:** Extensible environment variables now correctly map from `AetherionConfig` through `ControllerMetadata` into individual Lambda functions.

### Fixed
- **Infra:** Fixed CORS OPTIONS method generation by tying the unique ID to the path (preventing duplicates).
- **Infra:** Fixed API Gateway `IntegrationResponse` missing dependencies on `MethodResponse`.
- **Infra:** SQS Event Source Mapping now correctly uses the real queue ARN instead of a hardcoded string.
- **Infra:** Generated a local `dummy.zip` via `@cdktf/provider-archive` during synthesis to fix Lambda source requirements before build.
- **Core:** Fixed duplicated route registrations by adding validations directly into the `@Route` decorator.
- **Core:** Added synth-time validation ensuring all `@Controller` gateways actually point to a declared `@ApiGateway` infra resource.
