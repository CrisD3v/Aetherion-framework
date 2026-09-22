<p align="center">
  <h1 align="center">Aetherion Framework</h1>
</p>

<p align="center">
  <strong>The Next-Generation Serverless Framework for TypeScript</strong>
</p>

<p align="center">
  A highly opinionated, decorator-driven framework that seamlessly unifies application logic, CDKTF infrastructure as code, and OpenAPI documentation into a single, cohesive developer experience.
</p>

---

## 🌌 What is Aetherion?

Aetherion is a modern Serverless framework designed to eliminate the friction between writing application code and provisioning cloud infrastructure. 

By leveraging TypeScript decorators and the AWS Cloud Development Kit for Terraform (CDKTF), Aetherion automatically parses your business logic to provision highly optimized, least-privilege infrastructure.

## 🎯 What problems do we solve?

1. **The "Lambdalith" Anti-pattern:** Most frameworks deploy your entire application into a single monolithic AWS Lambda, leading to cold starts, overly permissive IAM roles, and tight coupling. Aetherion enforces a **1:1 Lambda-per-Method architecture** out of the box without requiring you to manage dozens of separate entry points.
2. **Infrastructure as an Afterthought:** Writing Terraform or CloudFormation separately from your application code creates cognitive load and drift. Aetherion generates your infra directly from your code.
3. **Security by Default:** You define exact AWS IAM permissions directly on your methods using `@IamPermissions`. The framework provisions isolated execution roles for every single endpoint.
4. **Documentation Rot:** Your OpenAPI documentation is generated natively from the same decorators that define your routes and schemas.

## 🚀 Quick Start

Initialize a new Aetherion project using the CLI:

```bash
# Install the CLI globally (if published, otherwise use npx)
npm install -g @aetherionfw/cli

# Scaffold a new project
aetherion init my-serverless-api
cd my-serverless-api
pnpm install

# Synthesize CDKTF infrastructure
aetherion synth

# Serve OpenAPI documentation locally
aetherion docs --serve
```

## 💻 Code Example

Aetherion brings a familiar, NestJS-like developer experience to Serverless.

```typescript
import { LambdaController, Handle, Route, IamPermissions } from '@aetherionfw/core';
import { ApiTag, ApiOperation, ApiResponse } from '@aetherionfw/docs';

@ApiTag('Users', 'User management endpoints')
@LambdaController({
  lambdaName: 'users-api',
  memorySize: 256,
})
export class UsersController {
  
  @Handle({ timeout: 5 }) // Generates a dedicated Lambda Function
  @Route({ method: 'GET', path: '/users/:id' }) // Generates API Gateway route
  @IamPermissions({
    dynamodb: [
      { action: 'dynamodb:GetItem', resource: 'arn:aws:dynamodb:*:*:table/Users' }
    ] // Generates a dedicated, least-privilege IAM Role Policy
  })
  @ApiOperation({ summary: 'Get User by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  async getUser(event: any) {
    // Your business logic here
    return { id: event.pathParameters.id, name: 'John Doe' };
  }
}
```

## 🤝 Support and Contributing

We welcome community contributions! Whether you want to add new AWS resource adapters, improve the CLI, or fix bugs, your help is appreciated.

### How to contribute
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/aetherion-framework.git`
3. Install dependencies using pnpm: `pnpm install`
4. Create a new branch for your feature: `git checkout -b feat/my-new-feature`
5. Make your changes and commit using **Conventional Commits** (`feat: ...`, `fix: ...`).
6. Push to your fork and submit a Pull Request.

### Getting Help
If you encounter any issues or have questions, please:
- Open an Issue on GitHub
- Join our community discussions

---
*Aetherion is built with ❤️ for the Serverless community.*
