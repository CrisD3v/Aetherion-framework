import { MetadataRegistry, InfraMetadata } from '../registry/MetadataRegistry';

export function Infra(): ClassDecorator {
  return (target: any) => {
    MetadataRegistry.getInstance().registerInfraClass(target);
  };
}

// Example of a specific infra resource decorator
export function S3Bucket(props: { name: string; versioned?: boolean; private?: boolean }): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    MetadataRegistry.getInstance().registerInfraResource(target.constructor, {
      type: 'S3Bucket',
      name: String(propertyKey),
      props
    });
  };
}

export function DynamoTable(props: { name: string; partitionKey: any }): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    MetadataRegistry.getInstance().registerInfraResource(target.constructor, {
      type: 'DynamoTable',
      name: String(propertyKey),
      props
    });
  };
}

export function SqsQueue(props: { name: string; visibilityTimeout?: number; deadLetterQueue?: string }): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    MetadataRegistry.getInstance().registerInfraResource(target.constructor, {
      type: 'SqsQueue',
      name: String(propertyKey),
      props
    });
  };
}

export function KmsKey(props: { alias?: string; description?: string }): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    MetadataRegistry.getInstance().registerInfraResource(target.constructor, {
      type: 'KmsKey',
      name: String(propertyKey),
      props
    });
  };
}

export function SsmParameter(props: { name: string; value: string; type?: string }): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    MetadataRegistry.getInstance().registerInfraResource(target.constructor, {
      type: 'SsmParameter',
      name: String(propertyKey),
      props
    });
  };
}

export function EventBridgeRule(props: { name: string; scheduleExpression?: string }): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    MetadataRegistry.getInstance().registerInfraResource(target.constructor, {
      type: 'EventBridgeRule',
      name: String(propertyKey),
      props
    });
  };
}

export function CloudFrontDistribution(props: { originDomain: string }): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    MetadataRegistry.getInstance().registerInfraResource(target.constructor, {
      type: 'CloudFrontDistribution',
      name: String(propertyKey),
      props
    });
  };
}

export function CognitoUserPool(props: { name: string }): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    MetadataRegistry.getInstance().registerInfraResource(target.constructor, {
      type: 'CognitoUserPool',
      name: String(propertyKey),
      props
    });
  };
}

export function Vpc(props: { name: string; cidr: string; natGateways?: number }): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    MetadataRegistry.getInstance().registerInfraResource(target.constructor, {
      type: 'Vpc',
      name: String(propertyKey),
      props
    });
  };
}

export function IamRole(props: { name: string; assumedBy: string }): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    MetadataRegistry.getInstance().registerInfraResource(target.constructor, {
      type: 'IamRole',
      name: String(propertyKey),
      props
    });
  };
}

export function RdsInstance(props: { engine: string; size: string; dbName: string }): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    MetadataRegistry.getInstance().registerInfraResource(target.constructor, {
      type: 'RdsInstance',
      name: String(propertyKey),
      props
    });
  };
}
