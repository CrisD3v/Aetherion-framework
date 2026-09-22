import * as fs from 'fs';
import * as path from 'path';
import express from 'express';
import { OpenApiBuilder } from '../builder/OpenApiBuilder';

export function generateStaticDocs(outputDir: string, title: string = 'Aetherion API') {
  const builder = new OpenApiBuilder();
  const spec = builder.build(title);
  
  const fullPath = path.resolve(outputDir, 'openapi.json');
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(spec, null, 2));
  
  console.log(`Generated OpenAPI spec at ${fullPath}`);
}

export function startScalarServer(port: number = 3000, title: string = 'Aetherion API') {
  const app = express();
  
  app.get('/openapi.json', (req, res) => {
    const builder = new OpenApiBuilder();
    const spec = builder.build(title);
    res.json(spec);
  });

  app.get('/docs', (req, res) => {
    const html = `
      <!doctype html>
      <html>
        <head>
          <title>${title} Reference</title>
          <meta charset="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1" />
        </head>
        <body>
          <script
            id="api-reference"
            data-url="/openapi.json"></script>
          <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
        </body>
      </html>
    `;
    res.send(html);
  });

  app.listen(port, () => {
    console.log(`Scalar docs available at http://localhost:${port}/docs`);
  });
}
