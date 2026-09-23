import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Aetherion',
      customCss: ['./src/styles/global.css'],
      components: {
        Header: './src/components/starlight/StarlightHeader.astro',
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/CrisD3v/Aetherion-framework' }
      ],
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
        es: {
          label: 'Español',
          lang: 'es',
        },
      },
      sidebar: [
        {
          label: 'Getting Started',
          translations: { es: 'Empezando' },
          items: [
            { label: 'Introduction', slug: 'getting-started/introduction', translations: { es: 'Introducción' } },
            { label: 'Quick Start', slug: 'getting-started/quickstart', translations: { es: 'Inicio Rápido' } },
          ],
        },
        {
          label: 'Core Concepts',
          translations: { es: 'Conceptos Centrales' },
          items: [
            { label: 'Decorators', slug: 'core/decorators', translations: { es: 'Decoradores' } },
            { label: 'Dependency Injection', slug: 'core/di', translations: { es: 'Inyección de Dependencias' } },
            { label: 'Middlewares & Auth', slug: 'core/middlewares', translations: { es: 'Middlewares y Autenticación' } },
          ],
        },
        {
          label: 'Infrastructure',
          translations: { es: 'Infraestructura' },
          items: [
            { label: 'CDKTF Integration', slug: 'infra/cdktf', translations: { es: 'Integración CDKTF' } },
            { label: '1:1 Lambda Architecture', slug: 'infra/lambda-1-1', translations: { es: 'Arquitectura 1:1 Lambda' } },
            { label: 'IAM Permissions', slug: 'infra/iam', translations: { es: 'Permisos IAM' } },
            { label: 'VPC Networking', slug: 'infra/vpc', translations: { es: 'Redes VPC' } },
          ],
        },
        {
          label: 'AWS Integrations',
          translations: { es: 'Integraciones AWS' },
          items: [
            { label: 'API Gateway', slug: 'integrations/api-gateway', translations: { es: 'API Gateway' } },
            { label: 'Cognito User Pools', slug: 'integrations/cognito', translations: { es: 'Cognito User Pools' } },
            { label: 'DynamoDB', slug: 'integrations/dynamodb', translations: { es: 'DynamoDB' } },
            { label: 'RDS Instances', slug: 'integrations/rds', translations: { es: 'Instancias RDS' } },
            { label: 'S3 Buckets', slug: 'integrations/s3', translations: { es: 'Buckets S3' } },
            { label: 'KMS Encryption', slug: 'integrations/kms', translations: { es: 'Cifrado KMS' } },
            { label: 'CloudFront', slug: 'integrations/cloudfront', translations: { es: 'CloudFront' } },
            { label: 'Systems Manager', slug: 'integrations/ssm', translations: { es: 'Systems Manager (SSM)' } },
          ],
        },
        {
          label: 'Events & Messaging',
          translations: { es: 'Eventos y Mensajería' },
          items: [
            { label: 'EventBridge', slug: 'integrations/eventbridge', translations: { es: 'EventBridge' } },
            { label: 'SQS Queues', slug: 'integrations/sqs', translations: { es: 'Colas SQS' } },
          ],
        },
        {
          label: 'Guides & Best Practices',
          translations: { es: 'Guías y Mejores Prácticas' },
          items: [
            { label: 'Testing', slug: 'guides/testing', translations: { es: 'Pruebas' } },
            { label: 'Logging & Tracing', slug: 'guides/logging', translations: { es: 'Logs y Trazabilidad' } },
            { label: 'Troubleshooting', slug: 'guides/troubleshooting', translations: { es: 'Solución de problemas' } },
          ],
        },
      ],
    }),
    react()
  ],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['framer-motion']
    },
    optimizeDeps: {
      exclude: ['lucide-react']
    }
  },
});