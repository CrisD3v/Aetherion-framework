export const siteConfig = {
  name: "Aetherion Framework",
  description: "Serverless Framework for the Next Era.",
  url: "https://aetherion.dev",
  links: {
    github: 'https://github.com/CrisD3v/Aetherion-framework',
    docs: '/getting-started/introduction',
  },
};

export const features = [
  {
    title: "1:1 Lambda Architecture",
    description: "Banish the Lambdalith. Aetherion maps each controller method to an independent, highly-optimized AWS Lambda function automatically.",
    icon: "zap",
  },
  {
    title: "Security by Default",
    description: "Specify least-privilege IAM permissions directly on your methods using @IamPermissions. The framework provisions isolated roles for every endpoint.",
    icon: "lock",
  },
  {
    title: "Zero-drift CDKTF",
    description: "Infrastructure generated from your business logic. No more writing Terraform separately from your TypeScript application code.",
    icon: "layers",
  },
  {
    title: "Automatic OpenAPI",
    description: "Your OpenAPI documentation is generated natively from the same decorators that define your routes and schemas. Never out of sync.",
    icon: "book-open",
  },
];

export const showcaseCode = {
  controller: `import { LambdaController, Handle, Route, IamPermissions } from '@aetherionfw/core';
import { ApiTag, ApiOperation, ApiResponse } from '@aetherionfw/docs';

@ApiTag('Users', 'User management endpoints')
@LambdaController({
  lambdaName: 'users-api',
  memorySize: 512,
})
export class UsersController {
  @Handle()
  @Route({ method: 'GET', path: '/users/:id' })
  @ApiOperation({ summary: 'Get User by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @IamPermissions([
    { effect: 'Allow', actions: ['dynamodb:GetItem'], resources: ['*'] }
  ])
  async getUser(event: any) {
    // This method compiles to an independent AWS Lambda function!
    return { id: event.pathParameters.id, name: 'John Doe' };
  }
}`,
  infrastructure: `// Generated automatically by Aetherion CDKTF Synth
import { Construct } from 'constructs';
import { App, TerraformStack } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';

export class AetherionStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    new AwsProvider(this, 'AWS', { region: 'us-east-1' });

    const role = new IamRole(this, 'users-api_getUser_Role', {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{ Action: 'sts:AssumeRole', Effect: 'Allow', Principal: { Service: 'lambda.amazonaws.com' } }]
      })
    });

    // Lambda Provisioned 1:1 for the getUser method
    new LambdaFunction(this, 'users-api_getUser', {
      functionName: 'users-api_getUser',
      handler: 'index.handler',
      runtime: 'nodejs20.x',
      role: role.arn,
      memorySize: 512
    });
  }
}`,
  openapi: `openapi: 3.1.0
info:
  title: Aetherion API
  version: 1.0.0
paths:
  /users/{id}:
    get:
      summary: Get User by ID
      tags:
        - Users
      responses:
        "200":
          description: User found`
};

export const faqs = [
  {
    question: "Why not just use Express inside Lambda?",
    answer: "Running an entire web framework inside a single Lambda (the 'Lambdalith' pattern) leads to bloated bundle sizes, slow cold starts, and excessive IAM permissions. Aetherion's 1:1 architecture ensures each endpoint is a tiny, isolated Lambda function with only the permissions it needs."
  },
  {
    question: "Do I need to know Terraform to use CDKTF?",
    answer: "Not at all. Aetherion handles the infrastructure generation entirely under the hood based on your TypeScript decorators. You write business logic; we write the infrastructure."
  },
  {
    question: "How does the Dependency Injection work?",
    answer: "Aetherion includes a native, lightweight DI container out of the box. Classes decorated with @Injectable are automatically registered as singletons and resolved during the Lambda cold start, ensuring database connections and heavy services are reused across warm invocations."
  },
  {
    question: "Is it production ready?",
    answer: "Aetherion is currently in Alpha. While the core architecture and features are stable, we recommend evaluating it on non-critical workloads before adopting it for high-traffic enterprise applications."
  }
];

export const testimonials = [
  {
    quote: "Aetherion finally solves the dissonance between application code and infrastructure. My team ships 3x faster because they don't have to context-switch to Terraform.",
    name: "Alex Rivera",
    title: "Lead Architect, Serverless Co."
  },
  {
    quote: "The 1:1 Lambda architecture out of the box is incredible. Our cold starts dropped from 2.5s to 200ms simply by adopting the framework.",
    name: "Sam Chen",
    title: "Backend Engineer"
  },
  {
    quote: "I've used NestJS for years. Moving to Aetherion felt incredibly familiar due to the decorators, but the cloud-native deployment is lightyears ahead.",
    name: "Taylor Swift",
    title: "Fullstack Developer"
  }
];
