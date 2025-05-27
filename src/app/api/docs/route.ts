import { NextResponse } from 'next/server';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your swagger.yaml file
const swaggerDocumentPath = path.resolve(__dirname, '../../../../docs/swagger.yaml');

// Load the Swagger document
const swaggerDocument = YAML.load(swaggerDocumentPath);

// Initialize Swagger UI middleware
// Note: swagger-ui-express is designed for Express.js.
// Integrating it directly into Next.js App Router requires a wrapper.
// This is a simplified example. A more robust solution might involve
// a custom server or a dedicated package for Next.js Swagger integration.

// We'll create a simple handler that serves the JSON spec directly
// and instruct the user on how to view the UI separately if needed,
// or explore more complex integration later.

export async function GET() {
  return NextResponse.json(swaggerDocument);
}

// To serve the actual Swagger UI, you would typically need to
// integrate swagger-ui-express with a custom server or use a library
// designed for Next.js App Router.

// Example of how you *might* use swagger-ui-express in a custom server:
/*
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

const app = express();
const swaggerDocument = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// In Next.js App Router, you might need to handle this differently.
// One approach is to use a dynamic route and render a component
// that initializes Swagger UI on the client side, fetching the spec
// from the GET /api/docs endpoint above.
*/

// For now, the GET /api/docs endpoint serves the raw JSON spec.
// Users can use online Swagger viewers or local tools to visualize it.