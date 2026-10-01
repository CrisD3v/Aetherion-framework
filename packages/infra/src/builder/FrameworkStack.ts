import { Construct } from 'constructs';
import { TerraformStack, Fn, TerraformAsset, AssetType, S3Backend } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';
import { CloudfrontDistribution } from '@cdktf/provider-aws/lib/cloudfront-distribution';
import { CognitoUserPool } from '@cdktf/provider-aws/lib/cognito-user-pool';
import { CognitoUserPoolClient } from '@cdktf/provider-aws/lib/cognito-user-pool-client';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaEventSourceMapping } from '@cdktf/provider-aws/lib/lambda-event-source-mapping';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { ApiGatewayAuthorizer } from '@cdktf/provider-aws/lib/api-gateway-authorizer';
import { ApiGatewayMethodResponse } from '@cdktf/provider-aws/lib/api-gateway-method-response';
import { ApiGatewayIntegrationResponse } from '@cdktf/provider-aws/lib/api-gateway-integration-response';
import { Apigatewayv2Api } from '@cdktf/provider-aws/lib/apigatewayv2-api';
import { Apigatewayv2Integration } from '@cdktf/provider-aws/lib/apigatewayv2-integration';
import { Apigatewayv2Route } from '@cdktf/provider-aws/lib/apigatewayv2-route';
import { Apigatewayv2Stage } from '@cdktf/provider-aws/lib/apigatewayv2-stage';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';
import { MetadataRegistry, ApiGatewayMetadata, AetherionConfig } from '@aetherionfw/core';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

interface ApiGatewayRef {
  metadata: ApiGatewayMetadata;
  restApi?: ApiGatewayRestApi;
  httpApi?: Apigatewayv2Api;
  rootResourceId: string;
  resourceMap: Map<string, ApiGatewayResource>;
  authorizerMap: Map<string, ApiGatewayAuthorizer>;
  methodIds: string[];
  // BUG-004, INFRA-002: Track dependencies for deployment
  deployDependencies: any[];
}

export class FrameworkStack extends TerraformStack {
  private static loadConfig(): AetherionConfig {
    const configPath = path.resolve(process.cwd(), 'aetherion.config.ts');
    const configJsPath = path.resolve(process.cwd(), 'aetherion.config.js');

    let resolvedPath: string | null = null;
    if (fs.existsSync(configPath)) resolvedPath = configPath;
    else if (fs.existsSync(configJsPath)) resolvedPath = configJsPath;

    if (!resolvedPath) {
      console.warn(
        '[Aetherion] No aetherion.config.ts found. Using default AWS provider settings.\n' +
        '  Run `aetherion init` to scaffold a config file, or create aetherion.config.ts manually.'
      );
      return {
        accountId: process.env.AWS_ACCOUNT_ID ?? '',
        region: process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1',
        profile: process.env.AWS_PROFILE,
      };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require(resolvedPath);
      const config: AetherionConfig = mod.default ?? mod;
      return {
        ...config,
        accountId: process.env.AWS_ACCOUNT_ID ?? config.accountId,
        region: process.env.AWS_REGION ?? config.region ?? 'us-east-1',
        profile: process.env.AWS_PROFILE ?? config.profile,
      };
    } catch (err) {
      console.error(`[Aetherion] Failed to load aetherion.config.ts: ${(err as Error).message}`);
      process.exit(1);
      throw new Error('unreachable');
    }
  }

  private lambdaFunctions: Map<string, LambdaFunction> = new Map();
  private cognitoPools: Map<string, CognitoUserPool> = new Map();
  private sqsQueues: Map<string, SqsQueue> = new Map(); // Track SQS Queues for BUG-005

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const config = FrameworkStack.loadConfig();

    new AwsProvider(this, 'AWS', {
      region: config.region,
      ...(config.profile ? { profile: config.profile } : {}),
      ...(config.accountId ? { allowedAccountIds: [config.accountId] } : {}),
    });

    // BACKEND: Configure S3 backend with DynamoDB state locking if specified
    if (config.backend) {
      new S3Backend(this, {
        bucket: config.backend.bucket,
        key: config.backend.key || `terraform/${config.projectName || 'aetherion'}/${config.stage || 'dev'}/terraform.tfstate`,
        region: config.backend.region || config.region,
        dynamodbTable: config.backend.dynamodbTable,
        encrypt: true,
      });
    }

    // Archive provider for dummy.zip fallback (if bundling hasn't run yet)
    new ArchiveProvider(this, 'Archive');

    // Generate dummy.zip using cdktf archive provider
    const dummyZip = new DataArchiveFile(this, 'dummy_zip', {
      type: 'zip',
      sourceContent: 'exports.handler = async (event) => ({ statusCode: 200, body: "Dummy" });',
      sourceContentFilename: 'index.js',
      outputPath: `${path.resolve(process.cwd(), '.aetherion/cdktf.out/dummy.zip')}`,
    });

    const registry = MetadataRegistry.getInstance();
    
    // CORE-003: Validate apiGateway references
    const warnings = registry.validateApiGatewayReferences();
    for (const w of warnings) {
      console.warn(`[WARN] ${w}`);
    }

    // ────────────────────────────────────────────
    // 1. Build Infra Resources
    // ────────────────────────────────────────────
    const apiGatewayConfigs: Map<string, { infraResource: any; props: ApiGatewayMetadata }> = new Map();
    const infraClasses = registry.getInfraClasses();

    for (const target of infraClasses) {
      const resources = registry.getInfraResources(target);
      
      for (const res of resources) {
        console.log(`Building ${res.type}: ${res.name}`);
        
        switch (res.type) {
          case 'S3Bucket':
            new S3Bucket(this, res.name, { bucket: res.props.name });
            break;
          case 'DynamoTable': {
            // INFRA-003: Support Sort Key and GSIs
            const props = res.props;
            
            const attributeMap = new Map<string, string>();
            attributeMap.set(props.partitionKey.name, props.partitionKey.type === 'STRING' ? 'S' : props.partitionKey.type === 'NUMBER' ? 'N' : 'B');
            
            if (props.sortKey) {
              attributeMap.set(props.sortKey.name, props.sortKey.type === 'STRING' ? 'S' : props.sortKey.type === 'NUMBER' ? 'N' : 'B');
            }
            
            if (props.gsi) {
              for (const gsi of props.gsi) {
                attributeMap.set(gsi.hashKey, gsi.hashKeyType === 'NUMBER' ? 'N' : gsi.hashKeyType === 'BINARY' ? 'B' : 'S');
                if (gsi.rangeKey) {
                  attributeMap.set(gsi.rangeKey, gsi.rangeKeyType === 'NUMBER' ? 'N' : gsi.rangeKeyType === 'BINARY' ? 'B' : 'S');
                }
              }
            }

            const attributes = Array.from(attributeMap.entries()).map(([name, type]) => ({ name, type }));

            new DynamodbTable(this, res.name, {
              name: props.name,
              hashKey: props.partitionKey.name,
              rangeKey: props.sortKey?.name,
              attribute: attributes,
              billingMode: 'PAY_PER_REQUEST',
              globalSecondaryIndex: props.gsi?.map((gsi: any) => ({
                name: gsi.name,
                hashKey: gsi.hashKey,
                rangeKey: gsi.rangeKey,
                projectionType: gsi.projectionType || 'ALL',
                nonKeyAttributes: gsi.nonKeyAttributes,
              })),
            });
            break;
          }
          case 'SqsQueue': {
            const queue = new SqsQueue(this, res.name, {
              name: res.props.name,
              visibilityTimeoutSeconds: res.props.visibilityTimeout,
            });
            this.sqsQueues.set(res.props.name, queue); // Track for event source mapping
            break;
          }
          case 'KmsKey':
            new KmsKey(this, res.name, { description: res.props.description });
            break;
          case 'SsmParameter':
            new SsmParameter(this, res.name, {
              name: res.props.name,
              type: res.props.type || 'String',
              value: res.props.value,
            });
            break;
          case 'CloudFrontDistribution':
            new CloudfrontDistribution(this, res.name, {
              enabled: true,
              origin: [{ domainName: res.props.originDomain, originId: `${res.name}-origin` }],
              defaultCacheBehavior: {
                targetOriginId: `${res.name}-origin`,
                viewerProtocolPolicy: 'redirect-to-https',
                allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
                cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
              },
              viewerCertificate: { cloudfrontDefaultCertificate: true },
              restrictions: { geoRestriction: { restrictionType: 'none' } },
            });
            break;
          case 'CognitoUserPool': {
            const pool = new CognitoUserPool(this, res.name, { name: res.props.name });
            this.cognitoPools.set(res.props.name, pool);
            break;
          }
          case 'CognitoUserPoolClient': {
            // INFRA-004: CognitoUserPoolClient support
            const userPoolId = res.props.userPoolId || this.cognitoPools.values().next().value?.id;
            if (!userPoolId) {
              console.warn(`[WARN] CognitoUserPoolClient ${res.name} has no userPoolId and no UserPool exists.`);
              break;
            }
            new CognitoUserPoolClient(this, res.name, {
              name: res.props.name,
              userPoolId: userPoolId,
              generateSecret: res.props.generateSecret,
            });
            break;
          }
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
              assumeRolePolicy: res.props.assumedBy,
            });
            break;
          case 'RdsInstance':
            new DbInstance(this, res.name, {
              engine: res.props.engine,
              instanceClass: res.props.size,
              dbName: res.props.dbName,
              skipFinalSnapshot: true,
            });
            break;
          case 'ApiGateway':
            apiGatewayConfigs.set(res.props.name, { infraResource: res, props: res.props });
            break;
          default:
            console.warn(`Unknown infra resource type: ${res.type}`);
        }
      }
    }
    
    // ────────────────────────────────────────────
    // 2. Build Lambdas and IAM Policies (1:1 Lambda per Handle)
    // ────────────────────────────────────────────
    const controllers = registry.getControllers();
    for (const [target, controllerMeta] of controllers) {
      
      const handles = registry.getHandles(target);
      const iamPermissions = registry.getIamPermissions(target);
      const sqsTriggers = registry.getSqsTriggers(target);

      if (handles.length === 0) continue;

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

        // 2b. Attach IAM Policies
        let handlePerms = iamPermissions.find(p => p.methodName === methodName);
        if (!handlePerms) {
          handlePerms = iamPermissions.find(p => !p.methodName);
        }

        if (handlePerms) {
          const statements = [];
          
          // BUG-006: Normalize IAM permission format
          if (Array.isArray(handlePerms.permissions)) {
            // AWS native format (preferred)
            statements.push(...handlePerms.permissions);
          } else {
            // Service-grouped legacy format
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

        // INFRA-006 & 1:1 Architecture: Extensible and Filtered lambda environment variables
        const projectEnvVars = config.lambdaDefaults?.envVars || {};
        const controllerEnvVars = controllerMeta.envVars || {};
        
        let mergedEnvVars: Record<string, string> = {
            ...projectEnvVars,
            ...controllerEnvVars,
            ...(process.env as Record<string, string>) // Pull in process.env so we can filter from it
        };

        const finalEnvVars: Record<string, string> = {
            AETHERION_TARGET_CLASS: controllerMeta.lambdaName,
            AETHERION_TARGET_METHOD: methodName,
        };

        // Filter based on envKeys to achieve Least Privilege (preventing 4KB limit blowout)
        const allowedKeys = new Set<string>();
        if (controllerMeta.envKeys) controllerMeta.envKeys.forEach(k => allowedKeys.add(k));
        if (handle.envKeys) handle.envKeys.forEach(k => allowedKeys.add(k));

        if (allowedKeys.size > 0) {
            for (const key of allowedKeys) {
                if (mergedEnvVars[key] !== undefined) {
                    finalEnvVars[key] = mergedEnvVars[key] as string;
                }
            }
        } else {
            // Fallback: If no envKeys specified, use the old behavior of injecting project/controller vars,
            // but NOT process.env to avoid bloating.
            Object.assign(finalEnvVars, { ...projectEnvVars, ...controllerEnvVars });
        }

        // 2c. Create the Lambda Function (1:1 Architecture)
        // Find the specific zip bundle generated by `aetherion bundle` for this specific handle
        const handleZipPath = path.resolve(process.cwd(), `.aetherion/build/${lambdaName}.zip`);
        const handleZipExists = fs.existsSync(handleZipPath);
        const activeZipPath = handleZipExists ? handleZipPath : dummyZip.outputPath;
        const activeZipHash = handleZipExists
          ? crypto.createHash('sha256').update(fs.readFileSync(handleZipPath)).digest('base64')
          : undefined;

        const lambdaFunction = new LambdaFunction(this, lambdaName, {
          functionName: lambdaName,
          runtime: controllerMeta.runtime || config.lambdaDefaults?.runtime || 'nodejs20.x',
          memorySize: handle.memorySize || controllerMeta.memorySize || config.lambdaDefaults?.memorySize || 128,
          timeout: handle.timeout || controllerMeta.timeout || config.lambdaDefaults?.timeout || 3,
          role: role.arn,
          filename: activeZipPath,
          sourceCodeHash: activeZipHash,
          handler: 'bundle.handler', // The esbuild output is bundle.js
          environment: {
            variables: finalEnvVars
          }
        });

        this.lambdaFunctions.set(lambdaName, lambdaFunction);

        // 2d. SQS Triggers
        const handleTriggers = sqsTriggers.filter(t => t.methodName === methodName);
        for (const trigger of handleTriggers) {
          console.log(`Linking SQS Trigger ${trigger.queueName} to ${lambdaName}`);
          
          // BUG-005: Use real queue ARN instead of hardcoded
          const sqsQueue = this.sqsQueues.get(trigger.queueName);
          const queueArn = sqsQueue ? sqsQueue.arn : `arn:aws:sqs:${config.region}:${config.accountId}:${trigger.queueName}`;

          new LambdaEventSourceMapping(this, `${lambdaName}-${trigger.queueName}-mapping`, {
            functionName: lambdaFunction.arn,
            eventSourceArn: queueArn,
          });
        }
      }
    }

    // ────────────────────────────────────────────
    // 3. Build API Gateways and wire Routes
    // ────────────────────────────────────────────
    const apiRefs: Map<string, ApiGatewayRef> = new Map();

    for (const [apiName, apiConfig] of apiGatewayConfigs) {
      const props = apiConfig.props as ApiGatewayMetadata;
      console.log(`Building API Gateway: ${apiName} (${props.type})`);

      if (props.type === 'REST') {
        this.buildRestApiGateway(apiName, props, apiRefs);
      } else {
        this.buildHttpApiGateway(apiName, props, apiRefs);
      }
    }

    for (const [target, controllerMeta] of controllers) {
      if (!controllerMeta.apiGateway) continue;

      const apiRef = apiRefs.get(controllerMeta.apiGateway);
      if (!apiRef) continue;

      const routes = registry.getRoutes(target);
      const handles = registry.getHandles(target);

      for (const route of routes) {
        const handle = handles.find(h => h.methodName === route.methodName);
        if (!handle) continue;

        const lambdaName = `${controllerMeta.lambdaName}-${route.methodName}`;
        const lambdaFn = this.lambdaFunctions.get(lambdaName);
        if (!lambdaFn) continue;

        console.log(`Wiring ${route.method} ${route.path} → ${lambdaName}`);

        if (apiRef.metadata.type === 'REST') {
          this.wireRestApiRoute(apiRef, route, lambdaFn, lambdaName);
        } else {
          this.wireHttpApiRoute(apiRef, route, lambdaFn, lambdaName);
        }
      }
    }

    // 3c. Create Deployments and Stages
    for (const [apiName, apiRef] of apiRefs) {
      const stageName = apiRef.metadata.stageName || config.stage || 'dev';

      if (apiRef.metadata.type === 'REST' && apiRef.restApi && !apiRef.metadata.existingApiId) {
        
        // BUG-004, INFRA-002: deployment dependsOn all API Gateway resources
        // INFRA-007: redeployment triggers on route change
        const redeploymentHash = crypto.createHash('sha256').update(JSON.stringify(apiRef.methodIds)).digest('hex');

        const deployment = new ApiGatewayDeployment(this, `${apiName}-deployment`, {
          restApiId: apiRef.restApi.id,
          dependsOn: apiRef.deployDependencies,
          triggers: {
            redeployment: redeploymentHash,
          },
          lifecycle: {
            createBeforeDestroy: true,
          },
        });

        new ApiGatewayStage(this, `${apiName}-stage`, {
          restApiId: apiRef.restApi.id,
          deploymentId: deployment.id,
          stageName,
        });

        console.log(`Created REST API deployment: ${apiName} → stage "${stageName}"`);
      } else if (apiRef.metadata.type === 'HTTP' && apiRef.httpApi) {
        new Apigatewayv2Stage(this, `${apiName}-stage`, {
          apiId: apiRef.httpApi.id,
          name: stageName,
          autoDeploy: true,
        });
        console.log(`Created HTTP API stage: ${apiName} → "${stageName}"`);
      }
    }
  }

  // ────────────────────────────────────────────
  // REST API Gateway Builder
  // ────────────────────────────────────────────

  private buildRestApiGateway(apiName: string, props: ApiGatewayMetadata, apiRefs: Map<string, ApiGatewayRef>) {
    if (props.existingApiId) {
      apiRefs.set(apiName, {
        metadata: props,
        rootResourceId: props.existingRootResourceId || '',
        resourceMap: new Map(),
        authorizerMap: new Map(),
        methodIds: [],
        deployDependencies: [],
      });
    } else {
      const restApi = new ApiGatewayRestApi(this, apiName, {
        name: props.name,
        description: props.description || `API Gateway for ${props.name}`,
      });

      apiRefs.set(apiName, {
        metadata: props,
        restApi,
        rootResourceId: restApi.rootResourceId,
        resourceMap: new Map(),
        authorizerMap: new Map(),
        methodIds: [],
        deployDependencies: [],
      });
    }
  }

  // ────────────────────────────────────────────
  // HTTP API Gateway Builder
  // ────────────────────────────────────────────

  private buildHttpApiGateway(apiName: string, props: ApiGatewayMetadata, apiRefs: Map<string, ApiGatewayRef>) {
    if (props.existingApiId) {
      apiRefs.set(apiName, {
        metadata: props,
        rootResourceId: '',
        resourceMap: new Map(),
        authorizerMap: new Map(),
        methodIds: [],
        deployDependencies: [],
      });
    } else {
      const corsConfig = props.corsEnabled !== false ? {
        allowOrigins: props.corsOrigins || ['*'],
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key'],
      } : undefined;

      const httpApi = new Apigatewayv2Api(this, apiName, {
        name: props.name,
        protocolType: 'HTTP',
        description: props.description || `HTTP API for ${props.name}`,
        corsConfiguration: corsConfig,
      });

      apiRefs.set(apiName, {
        metadata: props,
        httpApi,
        rootResourceId: '',
        resourceMap: new Map(),
        authorizerMap: new Map(),
        methodIds: [],
        deployDependencies: [],
      });
    }
  }

  // ────────────────────────────────────────────
  // REST API Route Wiring
  // ────────────────────────────────────────────

  private wireRestApiRoute(
    apiRef: ApiGatewayRef,
    route: { method: string; path: string; authorizer?: string; methodName: string },
    lambdaFn: LambdaFunction,
    lambdaName: string,
  ) {
    const restApi = apiRef.restApi;
    const restApiId = restApi ? restApi.id : apiRef.metadata.existingApiId!;

    const resourceId = this.getOrCreateRestResource(apiRef, route.path, restApiId);

    let authorizationType = 'NONE';
    let authorizerId: string | undefined;

    if (route.authorizer) {
      const authorizer = this.getOrCreateAuthorizer(apiRef, route.authorizer, restApiId);
      if (authorizer) {
        authorizationType = 'COGNITO_USER_POOLS';
        authorizerId = authorizer.id;
      }
    }

    const methodId = `${lambdaName}-${route.method}`;

    const method = new ApiGatewayMethod(this, methodId, {
      restApiId,
      resourceId,
      httpMethod: route.method.toUpperCase(),
      authorization: authorizationType,
      authorizerId,
    });

    apiRef.methodIds.push(methodId);

    const integration = new ApiGatewayIntegration(this, `${methodId}-integration`, {
      restApiId,
      resourceId,
      httpMethod: method.httpMethod,
      type: 'AWS_PROXY',
      integrationHttpMethod: 'POST',
      uri: lambdaFn.invokeArn,
    });

    apiRef.deployDependencies.push(method, integration);

    new LambdaPermission(this, `${methodId}-permission`, {
      statementId: `AllowAPIGateway-${methodId}`,
      action: 'lambda:InvokeFunction',
      functionName: lambdaFn.functionName,
      principal: 'apigateway.amazonaws.com',
    });

    if (apiRef.metadata.corsEnabled !== false) {
      this.createCorsOptionsMethod(apiRef, route.path, restApiId, resourceId);
    }
  }

  // ────────────────────────────────────────────
  // HTTP API Route Wiring
  // ────────────────────────────────────────────

  private wireHttpApiRoute(
    apiRef: ApiGatewayRef,
    route: { method: string; path: string; authorizer?: string; methodName: string },
    lambdaFn: LambdaFunction,
    lambdaName: string,
  ) {
    const httpApi = apiRef.httpApi;
    const apiId = httpApi ? httpApi.id : apiRef.metadata.existingApiId!;

    const integrationId = `${lambdaName}-${route.method}-int`;

    const integration = new Apigatewayv2Integration(this, integrationId, {
      apiId,
      integrationType: 'AWS_PROXY',
      integrationUri: lambdaFn.invokeArn,
      payloadFormatVersion: '2.0',
    });

    const routeKey = `${route.method.toUpperCase()} ${route.path}`;
    new Apigatewayv2Route(this, `${lambdaName}-${route.method}-route`, {
      apiId,
      routeKey,
      target: `integrations/${integration.id}`,
    });

    new LambdaPermission(this, `${lambdaName}-${route.method}-permission`, {
      statementId: `AllowHTTPAPI-${lambdaName}-${route.method}`,
      action: 'lambda:InvokeFunction',
      functionName: lambdaFn.functionName,
      principal: 'apigateway.amazonaws.com',
    });
  }

  // ────────────────────────────────────────────
  // Hierarchical Resource Builder (REST API)
  // ────────────────────────────────────────────

  private getOrCreateRestResource(
    apiRef: ApiGatewayRef,
    path: string,
    restApiId: string,
  ): string {
    if (path === '/') return apiRef.rootResourceId;

    const segments = path.split('/').filter(Boolean);
    let currentParentId = apiRef.rootResourceId;
    let currentPath = '';

    for (const segment of segments) {
      currentPath += `/${segment}`;

      if (apiRef.resourceMap.has(currentPath)) {
        currentParentId = apiRef.resourceMap.get(currentPath)!.id;
        continue;
      }

      const resource = new ApiGatewayResource(this, `resource-${currentPath.replace(/[/{}]/g, '-')}`, {
        restApiId,
        parentId: currentParentId,
        pathPart: segment,
      });

      apiRef.resourceMap.set(currentPath, resource);
      apiRef.deployDependencies.push(resource);
      currentParentId = resource.id;
    }

    return currentParentId;
  }

  // ────────────────────────────────────────────
  // Cognito Authorizer Builder (REST API)
  // ────────────────────────────────────────────

  private getOrCreateAuthorizer(
    apiRef: ApiGatewayRef,
    authorizerName: string,
    restApiId: string,
  ): ApiGatewayAuthorizer | undefined {
    if (apiRef.authorizerMap.has(authorizerName)) {
      return apiRef.authorizerMap.get(authorizerName)!;
    }

    const pool = this.cognitoPools.get(authorizerName);
    if (!pool) {
      console.warn(`Authorizer "${authorizerName}" references a Cognito User Pool that was not found in @Infra resources.`);
      return undefined;
    }

    const authorizer = new ApiGatewayAuthorizer(this, `${authorizerName}-authorizer`, {
      name: `${authorizerName}-cognito-authorizer`,
      restApiId,
      type: 'COGNITO_USER_POOLS',
      providerArns: [pool.arn],
    });

    apiRef.authorizerMap.set(authorizerName, authorizer);
    apiRef.deployDependencies.push(authorizer);
    return authorizer;
  }

  // ────────────────────────────────────────────
  // CORS OPTIONS Method (REST API)
  // ────────────────────────────────────────────

  private createCorsOptionsMethod(
    apiRef: ApiGatewayRef,
    path: string,
    restApiId: string,
    resourceId: string,
  ) {
    // BUG-002: Base CORS ID on path, not lambda to prevent duplicates
    const corsId = `CORS-OPTIONS-${path.replace(/[/{}]/g, '-')}`;

    if (apiRef.methodIds.includes(corsId)) return;
    apiRef.methodIds.push(corsId);

    const origins = apiRef.metadata.corsOrigins?.join(',') || '*';
    const headers = 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token';
    const methods = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';

    const optionsMethod = new ApiGatewayMethod(this, corsId, {
      restApiId,
      resourceId,
      httpMethod: 'OPTIONS',
      authorization: 'NONE',
    });

    const corsIntegration = new ApiGatewayIntegration(this, `${corsId}-integration`, {
      restApiId,
      resourceId,
      httpMethod: optionsMethod.httpMethod,
      type: 'MOCK',
      requestTemplates: {
        'application/json': '{"statusCode": 200}',
      },
    });

    const methodResponse = new ApiGatewayMethodResponse(this, `${corsId}-response`, {
      restApiId,
      resourceId,
      httpMethod: optionsMethod.httpMethod,
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    });

    // BUG-003: IntegrationResponse must depend on MethodResponse
    const intResponse = new ApiGatewayIntegrationResponse(this, `${corsId}-int-response`, {
      dependsOn: [methodResponse],
      restApiId,
      resourceId,
      httpMethod: optionsMethod.httpMethod,
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': `'${headers}'`,
        'method.response.header.Access-Control-Allow-Methods': `'${methods}'`,
        'method.response.header.Access-Control-Allow-Origin': `'${origins}'`,
      },
    });

    apiRef.deployDependencies.push(optionsMethod, corsIntegration, methodResponse, intResponse);
  }
}
