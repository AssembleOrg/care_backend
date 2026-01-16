import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/src/config/env';

export async function GET(request: NextRequest) {
  const env = getEnv();

  // Password protection in production
  if (env.NODE_ENV === 'production') {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Swagger Docs"',
        },
      });
    }

    const credentials = Buffer.from(authHeader.substring(6), 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    if (username !== 'admin' || password !== env.SWAGGER_PASSWORD) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Swagger Docs"',
        },
      });
    }
  }

  // Return Swagger UI HTML
  const swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'CareByDani API',
      version: '1.0.0',
      description: 'API REST para gestión de cuidadores, personas asistidas, asignaciones y pagos',
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
        description: 'API Server',
      },
    ],
    paths: {
      '/cuidadores': {
        get: {
          summary: 'Listar cuidadores',
          tags: ['Cuidadores'],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'all', in: 'query', schema: { type: 'boolean' } },
          ],
          responses: {
            '200': { description: 'Lista de cuidadores' },
          },
        },
        post: {
          summary: 'Crear cuidador',
          tags: ['Cuidadores'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    nombreCompleto: { type: 'string' },
                    dni: { type: 'string' },
                    telefono: { type: 'string' },
                    email: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Cuidador creado' },
          },
        },
      },
      '/pagos': {
        get: {
          summary: 'Listar pagos',
          tags: ['Pagos'],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            '200': { description: 'Lista de pagos' },
          },
        },
        post: {
          summary: 'Crear pago',
          tags: ['Pagos'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    cuidadorId: { type: 'string', format: 'uuid' },
                    personaId: { type: 'string', format: 'uuid' },
                    monto: { type: 'number' },
                    fecha: { type: 'string', format: 'date-time' },
                    metodo: { type: 'string', enum: ['EFECTIVO', 'TRANSFERENCIA', 'OTRO'] },
                    nota: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Pago creado' },
          },
        },
      },
      '/reportes/saldos': {
        get: {
          summary: 'Obtener saldos por cuidador',
          tags: ['Reportes'],
          parameters: [
            { name: 'cuidadorId', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'groupByMonth', in: 'query', schema: { type: 'boolean' } },
          ],
          responses: {
            '200': { description: 'Saldos calculados' },
          },
        },
      },
    },
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>CareByDani API Docs</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        spec: ${JSON.stringify(swaggerSpec)},
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.presets.standalone
        ]
      });
    };
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
