export const landingI18n = {
  en: {
    'nav.docs': 'Documentation',
    'nav.core': 'Core Concepts',
    'nav.quickstart': 'Quick Start',
    'nav.getStarted': 'Get Started',
    'hero.badge': 'Introducing Aetherion v1.0 Alpha',
    'hero.title': 'Serverless Infrastructure,',
    'hero.titleHighlight': 'Defined by Logic.',
    'hero.subtitle': 'Banish the Lambdalith. A highly opinionated, decorator-driven TypeScript framework that maps every controller directly to a 1:1 isolated AWS Lambda via CDKTF.',
    'hero.cta.build': 'Start Building',
    'hero.cta.github': 'View on GitHub',
    
    // Features
    'features.title': 'Designed for scale.',
    'features.subtitle': 'Built for speed.',
    'features.desc': 'Every feature in Aetherion is engineered to eliminate friction between your business logic and your cloud infrastructure.',
    'features.card1.title': '1:1 Lambda Architecture',
    'features.card1.desc': 'Banish the Lambdalith. Aetherion maps each controller method to an independent, highly-optimized AWS Lambda function automatically.',
    'features.card2.title': 'Security by Default',
    'features.card2.desc': 'Specify least-privilege IAM permissions directly on your methods using @IamPermissions. The framework provisions isolated roles for every endpoint.',
    'features.card3.title': 'Zero-drift CDKTF',
    'features.card3.desc': 'Infrastructure generated from your business logic. No more writing Terraform separately from your TypeScript application code.',
    'features.card4.title': 'Automatic OpenAPI',
    'features.card4.desc': 'Your OpenAPI documentation is generated natively from the same decorators that define your routes and schemas. Never out of sync.',

    // FAQ
    'faq.title': 'Frequently Asked Questions',
    'faq.q1': 'Why not just use Express inside Lambda?',
    'faq.a1': 'Running an entire web framework inside a single Lambda (the \'Lambdalith\' pattern) leads to bloated bundle sizes, slow cold starts, and excessive IAM permissions. Aetherion\'s 1:1 architecture ensures each endpoint is a tiny, isolated Lambda function with only the permissions it needs.',
    'faq.q2': 'Do I need to know Terraform to use CDKTF?',
    'faq.a2': 'Not necessarily. While Aetherion uses CDKTF under the hood, the infrastructure is completely abstracted by decorators. You only need to write standard TypeScript code, and the framework automatically generates the optimal infrastructure for you.',
    'faq.q3': 'How does the Dependency Injection work?',
    'faq.a3': 'Aetherion uses a custom lightweight DI container tailored for serverless. Services are instantiated lazily and cleanly injected into your controllers, ensuring fast cold starts and zero global state pollution between executions.',
    'faq.q4': 'Is it production ready?',
    'faq.a4': 'Aetherion is currently in Alpha. While the core architecture (1:1 mapping, CDKTF generation) is fully operational, we are still finalizing the plugin ecosystem and running extensive load tests before recommending it for mission-critical enterprise workloads.',

    // CTA
    'cta.title': 'Start building today.',
    'cta.desc': 'Open source, highly opinionated, and ready for production.\nEliminate the infrastructure boilerplate.',
    'cta.btn': 'Get Started for Free',
    
    // Copy
    'copy.title': 'Install the CLI and get started in seconds',
  },
  es: {
    'nav.docs': 'Documentación',
    'nav.core': 'Conceptos Base',
    'nav.quickstart': 'Inicio Rápido',
    'nav.getStarted': 'Comenzar',
    'hero.badge': 'Presentando Aetherion v1.0 Alpha',
    'hero.title': 'Infraestructura Serverless,',
    'hero.titleHighlight': 'Definida por Lógica.',
    'hero.subtitle': 'Destierra el Lambdalith. Un framework TypeScript altamente estricto y basado en decoradores que mapea cada controlador a una AWS Lambda aislada 1:1 vía CDKTF.',
    'hero.cta.build': 'Empezar a Construir',
    'hero.cta.github': 'Ver en GitHub',

    // Features
    'features.title': 'Diseñado para escalar.',
    'features.subtitle': 'Construido para la velocidad.',
    'features.desc': 'Cada característica de Aetherion está diseñada para eliminar la fricción entre tu lógica de negocio y tu infraestructura en la nube.',
    'features.card1.title': 'Arquitectura Lambda 1:1',
    'features.card1.desc': 'Deshazte del Lambdalith. Aetherion mapea cada método del controlador a una función AWS Lambda independiente y altamente optimizada, de forma totalmente automática.',
    'features.card2.title': 'Seguridad por Defecto',
    'features.card2.desc': 'Especifica permisos IAM de menor privilegio directamente en tus métodos usando @IamPermissions. El framework aprovisiona roles aislados para cada endpoint.',
    'features.card3.title': 'CDKTF sin Desviaciones',
    'features.card3.desc': 'Infraestructura generada a partir de tu lógica de negocio. Se acabó el escribir Terraform de forma aislada al código de tu aplicación TypeScript.',
    'features.card4.title': 'OpenAPI Automático',
    'features.card4.desc': 'Tu documentación OpenAPI se genera nativamente a partir de los mismos decoradores que definen tus rutas y esquemas. Nunca estará desactualizada.',

    // FAQ
    'faq.title': 'Preguntas Frecuentes',
    'faq.q1': '¿Por qué no usar simplemente Express dentro de Lambda?',
    'faq.a1': 'Ejecutar todo un framework web dentro de una única Lambda (el patrón \'Lambdalith\') genera bundles pesados, cold starts lentos y permisos IAM excesivos. La arquitectura 1:1 de Aetherion asegura que cada endpoint sea una función diminuta y aislada con los permisos exactos.',
    'faq.q2': '¿Necesito saber Terraform para usar CDKTF?',
    'faq.a2': 'No necesariamente. Aunque Aetherion usa CDKTF internamente, la infraestructura está abstraída por los decoradores. Solo necesitas escribir TypeScript, y el framework generará la infraestructura óptima por ti.',
    'faq.q3': '¿Cómo funciona la Inyección de Dependencias?',
    'faq.a3': 'Aetherion usa un contenedor de inyección (DI) propio y ultraligero adaptado a serverless. Los servicios se instancian de forma lazy y limpia, asegurando inicios en frío ultrarrápidos y evitando fugas de memoria entre ejecuciones.',
    'faq.q4': '¿Está listo para producción?',
    'faq.a4': 'Aetherion se encuentra en fase Alpha. Aunque la arquitectura principal es 100% funcional, seguimos puliendo el ecosistema de plugins y ejecutando pruebas de carga exhaustivas antes de recomendarlo para sistemas empresariales críticos.',

    // CTA
    'cta.title': 'Empieza a construir hoy.',
    'cta.desc': 'Open source, estrictamente estandarizado y listo para producción.\nElimina el código repetitivo de tu infraestructura.',
    'cta.btn': 'Comenzar Gratis',

    // Copy
    'copy.title': 'Instala la CLI y comienza en segundos',
  }
};
