# @aetherionfw/cli

> Command Line Interface for the Aetherion Serverless Framework.

Aetherion is a modern, TypeScript-first serverless framework designed to bring the developer experience of frameworks like NestJS to AWS serverless architectures.

## Overview

This package provides the `aetherion` command to initialize, synthesize, deploy, and manage your applications.

## Installation

```bash
npm install -g @aetherionfw/cli
```

*Note: The CLI is typically installed locally in your project as a dev dependency.*

## Commands

### `aetherion init <project-name>`
Scaffolds a new Aetherion project with the recommended directory structure, TypeScript configuration, and boilerplate code.

### `aetherion check-env`
Verifies your AWS credentials and connection using the STS `GetCallerIdentity` action. It reads your `aetherion.config.ts` and ensures you are deploying to the correct AWS account.

### `aetherion synth`
Synthesizes your infrastructure decorators into Terraform JSON (runs `cdktf synth` under the hood).

### `aetherion deploy`
Deploys your infrastructure to AWS (runs `cdktf deploy --auto-approve` under the hood).

### `aetherion docs`
Generates an OpenAPI specification from your `@Route` decorators and serves a local documentation UI using Scalar.

## Documentation

For full documentation, visit [https://github.com/CrisD3v/Aetherion-framework](https://github.com/CrisD3v/Aetherion-framework).

## License

MIT
