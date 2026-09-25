# @aetherionfw/core

> Core decorators, metadata registry, and runtime for the Aetherion Serverless Framework.

Aetherion is a modern, TypeScript-first serverless framework designed to bring the developer experience of frameworks like NestJS to AWS serverless architectures using CDKTF.

## Overview

This package provides the core building blocks for your Aetherion applications:

- **Decorators**: `@LambdaController`, `@Route`, `@Infra`, `@Module`, `@Injectable`
- **Metadata Registry**: Centralized reflection metadata storage that bridges the gap between your application code and your infrastructure definition.
- **Dependency Injection**: A lightweight, fast injector for managing services and dependencies.
- **Adapters**: The runtime adapter that translates API Gateway events into your controller methods.

## Installation

```bash
npm install @aetherionfw/core
```

## Usage

```typescript
import { LambdaController, Route, Handle } from '@aetherionfw/core';

@LambdaController({
  lambdaName: 'users-api',
  apiGateway: 'main-api'
})
export class UserController {
  @Handle()
  @Route({ method: 'GET', path: '/users' })
  async getUsers() {
    return { users: [] };
  }
}
```

## Documentation

For full documentation, visit [https://github.com/CrisD3v/Aetherion-framework](https://github.com/CrisD3v/Aetherion-framework).

## License

MIT
