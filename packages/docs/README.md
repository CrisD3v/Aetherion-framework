# @aetherionfw/docs

> OpenAPI generator and documentation UI for the Aetherion Serverless Framework.

Aetherion is a modern, TypeScript-first serverless framework designed to bring the developer experience of frameworks like NestJS to AWS serverless architectures.

## Overview

This package automatically generates OpenAPI (Swagger) specifications by analyzing the `@Route` decorators in your Aetherion application. It also provides a local web server to view the documentation interactively using [Scalar](https://scalar.com/).

## Installation

```bash
npm install @aetherionfw/docs
```

## Usage

This package is typically invoked via the Aetherion CLI:

```bash
aetherion docs --serve
```

This will generate the `openapi.json` file and start a local server at `http://localhost:3000/docs` where you can explore your API endpoints.

## Documentation

For full documentation, visit [https://github.com/CrisD3v/Aetherion-framework](https://github.com/CrisD3v/Aetherion-framework).

## License

MIT
