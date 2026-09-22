import { Construct } from 'constructs';
import { TerraformStack } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';
import { CloudfrontDistribution } from '@cdktf/provider-aws/lib/cloudfront-distribution';
import { CognitoUserPool } from '@cdktf/provider-aws/lib/cognito-user-pool';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaEventSourceMapping } from '@cdktf/provider-aws/lib/lambda-event-source-mapping';
import { MetadataRegistry } from '@aetherionfw/core';

export class FrameworkStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, 'AWS', {
      region: 'us-east-1',
    });

    const registry = MetadataRegistry.getInstance();
    
    // 1. Build Infra Resources
    const infraClasses = registry.getInfraClasses();
    for (const target of infraClasses) {
      const resources = registry.getInfraResources(target);
      
      for (const res of resources) {
        console.log(`Building ${res.type}: ${res.name}`);
        
        switch (res.type) {
          case 'S3Bucket':
            new S3Bucket(this, res.name, {
              bucket: res.props.name,
              // Minimal abstracted configuration mapped to raw CDKTF
            });
            break;
          case 'DynamoTable':
            new DynamodbTable(this, res.name, {
              name: res.props.name,
              hashKey: res.props.partitionKey.name,
              attribute: [{ name: res.props.partitionKey.name, type: res.props.partitionKey.type === 'STRING' ? 'S' : 'N' }],
              billingMode: 'PAY_PER_REQUEST',
            });
            break;
          case 'SqsQueue':
            new SqsQueue(this, res.name, {
              name: res.props.name,
              visibilityTimeoutSeconds: res.props.visibilityTimeout,
            });
            break;
          case 'KmsKey':
            new KmsKey(this, res.name, {
              description: res.props.description,
            });
            break;
          case 'SsmParameter':
            new SsmParameter(this, res.name, {
              name: res.props.name,
              type: res.props.type || 'String',
              value: res.props.value,
            });
            break;
          case 'CloudFrontDistribution':
            // Simplified mapping for a highly complex resource
            new CloudfrontDistribution(this, res.name, {
              enabled: true,
              origin: [{
                domainName: res.props.originDomain,
                originId: `${res.name}-origin`,
              }],
              defaultCacheBehavior: {
                targetOriginId: `${res.name}-origin`,
                viewerProtocolPolicy: 'redirect-to-https',
                allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
                cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
              },
              viewerCertificate: {
                cloudfrontDefaultCertificate: true,
              },
              restrictions: { geoRestriction: { restrictionType: 'none' } },
            });
            break;
          case 'CognitoUserPool':
            new CognitoUserPool(this, res.name, {
              name: res.props.name,
            });
            break;
          case 'Vpc':
            new Vpc(this, res.name, {
              cidrBlock: res.props.cidr,
              enableDnsSupport: true,
              enableDnsHostnames: true,
              tags: { Name: res.props.name },
            });
            break;
          case 'IamRole':
            new IamRole(this, res.name, {
              name: res.props.name,
              assumeRolePolicy: res.props.assumedBy, // Assume this is a JSON string passed in
            });
            break;
          case 'RdsInstance':
            new DbInstance(this, res.name, {
              engine: res.props.engine,
              instanceClass: res.props.size,
              dbName: res.props.dbName,
              skipFinalSnapshot: true, // safe default for dev frameworks
            });
            break;
          default:
            console.warn(`Unknown infra resource type: ${res.type}`);
        }
      }
    }
    
    // 2. Build Lambdas and IAM Policies (1:1 Lambda per Handle Architecture)
    const controllers = registry.getControllers();
    for (const [target, controllerMeta] of controllers) {
      
      const handles = registry.getHandles(target);
      const iamPermissions = registry.getIamPermissions(target);
      const routes = registry.getRoutes(target);
      const sqsTriggers = registry.getSqsTriggers(target);

      if (handles.length === 0) {
        // Fallback or skip if no methods are decorated with @Handle
        continue;
      }

      for (const handle of handles) {
        const methodName = handle.methodName;
        const lambdaName = `${controllerMeta.lambdaName}-${methodName}`;
        console.log(`Building 1:1 Lambda: ${lambdaName}`);

        // 2a. Create Execution Role for this specific Lambda
        const role = new IamRole(this, `${lambdaName}-role`, {
          name: `${lambdaName}-role`,
          assumeRolePolicy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
              Action: "sts:AssumeRole",
              Principal: { Service: "lambda.amazonaws.com" },
              Effect: "Allow",
            }],
          }),
        });

        // 2b. Attach IAM Policies (Method overrides Class)
        let handlePerms = iamPermissions.find(p => p.methodName === methodName);
        if (!handlePerms) {
          // Fallback to class-level permissions
          handlePerms = iamPermissions.find(p => !p.methodName);
        }

        if (handlePerms) {
          const statements = [];
          for (const service of Object.keys(handlePerms.permissions)) {
            const rules = handlePerms.permissions[service];
            for (const rule of rules) {
              statements.push({
                Effect: "Allow",
                Action: rule.action,
                Resource: rule.resource,
              });
            }
          }

          if (statements.length > 0) {
            new IamRolePolicy(this, `${lambdaName}-policy`, {
              name: `${lambdaName}-inline-policy`,
              role: role.name,
              policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: statements,
              }),
            });
          }
        }

        // 2c. Create the Lambda Function
        const lambdaFunction = new LambdaFunction(this, lambdaName, {
          functionName: lambdaName,
          runtime: controllerMeta.runtime || 'nodejs20.x',
          memorySize: handle.memorySize || controllerMeta.memorySize || 128,
          timeout: handle.timeout || controllerMeta.timeout || 3,
          role: role.arn,
          filename: 'dummy.zip', // CDKTF requires a deployment package
          handler: 'index.handler',
          environment: {
            variables: {
              AETHERION_TARGET_CLASS: controllerMeta.lambdaName, // Storing for debug
              AETHERION_TARGET_METHOD: methodName,
            }
          }
        });

        // 2d. Check for SQS Triggers targeting this handle
        const handleTriggers = sqsTriggers.filter(t => t.methodName === methodName);
        for (const trigger of handleTriggers) {
          console.log(`Linking SQS Trigger ${trigger.queueName} to ${lambdaName}`);
          new LambdaEventSourceMapping(this, `${lambdaName}-${trigger.queueName}-mapping`, {
            functionName: lambdaFunction.arn,
            eventSourceArn: `arn:aws:sqs:us-east-1:123456789012:${trigger.queueName}`, // mock
          });
        }
      }
    }
  }
}
