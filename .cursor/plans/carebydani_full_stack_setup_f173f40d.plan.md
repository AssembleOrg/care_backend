---
name: CareByDani Full Stack Setup
overview: Crear el proyecto completo CareByDani con Next.js App Router, TypeScript, Mantine, Prisma, Supabase, arquitectura limpia, cifrado con campos Enc+Hash, auditoría, Swagger protegido, y landing/admin panel con diseño anti-template y paleta viva.
todos:
  - id: setup-dependencies
    content: "Instalar todas las dependencias: Mantine, Prisma, Zod, Swagger, @react-pdf/renderer, class-transformer, bcryptjs, cookie"
    status: pending
  - id: configure-mantine
    content: Configurar Mantine provider y theme con paleta viva (fucsia/coral, cian, amarillo) en app/layout.tsx
    status: pending
    dependencies:
      - setup-dependencies
  - id: setup-prisma
    content: "Crear schema.prisma con modelos: Cuidador, PersonaAsistida, Asignacion, Pago, ReciboAdjunto, AuditLog, Admin. Campos Enc+Hash para PII. Configurar Supabase connection"
    status: pending
    dependencies:
      - setup-dependencies
  - id: create-migration
    content: Generar migración inicial de Prisma y configurar scripts en package.json
    status: pending
    dependencies:
      - setup-prisma
  - id: config-env-schema
    content: Crear src/config/env.ts con Zod schema para validar ENC_KEY_BASE64, HMAC_PEPPER, ADMIN_SESSION_SECRET, SWAGGER_PASSWORD, DATABASE_URL
    status: pending
    dependencies:
      - setup-dependencies
  - id: infrastructure-crypto
    content: Implementar EncryptionService (AES-256-GCM) y HashingService (HMAC-SHA256) en src/infrastructure/crypto/ usando ENC_KEY_BASE64 y HMAC_PEPPER
    status: pending
    dependencies:
      - setup-dependencies
      - config-env-schema
  - id: infrastructure-audit
    content: Implementar AuditService para registrar C/U/D sin PII (actor, action, table, recordId, oldData, newData, ip, userAgent) en src/infrastructure/audit/
    status: pending
    dependencies:
      - setup-prisma
  - id: infrastructure-database
    content: Crear PrismaService singleton y repositorios concretos en src/infrastructure/database/ con Prisma middleware para audit
    status: pending
    dependencies:
      - setup-prisma
  - id: domain-entities
    content: Crear entidades de dominio y value objects en src/domain/entities/ y interfaces de repositorios en src/domain/
    status: pending
  - id: response-wrapper
    content: Crear middleware de response wrapper con estructura estándar {ok,data/error,meta:{requestId,timestamp}} en src/presentation/middleware/
    status: pending
  - id: application-dtos
    content: Crear DTOs con class-transformer para todas las entidades en src/application/dto/
    status: pending
    dependencies:
      - setup-dependencies
  - id: application-use-cases
    content: Implementar use cases para CRUD de todas las entidades, reporte de saldos, y generación de PDFs en src/application/use-cases/
    status: pending
    dependencies:
      - application-dtos
      - infrastructure-crypto
      - infrastructure-audit
      - domain-entities
  - id: api-routes-v1
    content: Crear API routes bajo /api/v1 para cuidadores, personas-asistidas, asignaciones, pagos con paginación y /all, auth middleware y response wrapper
    status: pending
    dependencies:
      - application-use-cases
      - response-wrapper
  - id: api-reportes-recibos
    content: Implementar GET /api/v1/reportes/saldos y POST /api/v1/pagos/:id/recibos (metadata) y GET /api/v1/pagos/:id/recibo.pdf (PDF on-demand)
    status: pending
    dependencies:
      - api-routes-v1
  - id: api-auth-swagger
    content: Implementar auth con sesión cookie httpOnly (/api/v1/auth/login con rate limit) y Swagger protegido con password gate en /docs (solo producción)
    status: pending
    dependencies:
      - api-routes-v1
  - id: landing-page
    content: Crear landing page anti-template con Bento grid asimétrico, sección manifiesto, timeline, y PreviewUI con mock data
    status: pending
    dependencies:
      - configure-mantine
  - id: admin-layout
    content: Crear layout de admin con Mantine AppShell y navegación en app/admin/layout.tsx protegido con middleware
    status: pending
    dependencies:
      - configure-mantine
      - api-auth-swagger
  - id: admin-crud
    content: Implementar páginas CRUD de admin para cuidadores, personas-asistidas, asignaciones y pagos con Mantine forms y validación
    status: pending
    dependencies:
      - admin-layout
      - api-routes-v1
  - id: admin-reportes
    content: Crear página de reportes con saldos por cuidador y filtros (fechas, cuidador) en app/admin/reportes/page.tsx
    status: pending
    dependencies:
      - admin-layout
  - id: pdf-service
    content: Implementar PDFService con @react-pdf/renderer para generar recibos on-demand en src/application/services/
    status: pending
    dependencies:
      - setup-dependencies
      - application-use-cases
  - id: env-readme
    content: Crear .env.example y README.md con instrucciones completas de instalación, setup de Supabase, y generación de keys
    status: pending
---

# CareByDani - Proyecto Completo

## Arquitectura General

El proyecto seguirá clean architecture con las siguientes capas:

- **Domain**: Entidades, value objects, interfaces de repositorios, errores de dominio
- **Application**: Casos de uso, DTOs, servicios de aplicación
- **Infrastructure**: Prisma client, repositorios concretos, crypto, audit, logger
- **Presentation**: Route handlers (Next.js), response wrapper, swagger, componentes React
- **Config**: Schema de env con Zod, constantes

## Estructura de Carpetas

```
care_backend/
├── src/
│   ├── domain/
│   │   ├── entities/          # Cuidador, PersonaAsistida, Asignacion, Pago, ReciboAdjunto
│   │   ├── value-objects/     # EncryptedData, etc.
│   │   ├── repositories/      # Interfaces de repositorios
│   │   └── errors/            # Errores de dominio
│   ├── application/
│   │   ├── use-cases/         # CRUD operations, PDF generation, reportes
│   │   ├── services/          # PDFService
│   │   └── dto/               # DTOs con class-transformer
│   ├── infrastructure/
│   │   ├── database/          # PrismaService, repositorios concretos
│   │   ├── crypto/            # AES-256-GCM + HMAC-SHA256
│   │   ├── audit/             # AuditService con Prisma middleware
│   │   └── logger/            # Logger con redacción de PII
│   ├── presentation/
│   │   ├── api/               # Next.js route handlers (/api/v1)
│   │   ├── middleware/        # Auth, response wrapper, requestId
│   │   ├── components/        # React components compartidos
│   │   └── theme/             # Mantine theme
│   └── config/
│       ├── env.ts              # Zod schema para env vars
│       └── constants.ts       # Constantes de la app
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── app/
│   ├── layout.tsx             # Root layout con Mantine provider
│   ├── page.tsx               # Landing page
│   ├── admin/                 # Admin panel
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── cuidadores/page.tsx
│   │   ├── personas-asistidas/page.tsx
│   │   ├── asignaciones/page.tsx
│   │   ├── pagos/page.tsx
│   │   └── reportes/page.tsx
│   └── api/
│       └── v1/                # API REST base path
│           ├── cuidadores/
│           ├── personas-asistidas/
│           ├── asignaciones/
│           ├── pagos/
│           ├── reportes/
│           ├── auth/
│           └── docs/          # Swagger UI
├── public/
└── .env.example
```

## Fase 1: Configuración Base

### 1.1 Dependencias (package.json)

- Next.js 16.1.2 (ya instalado)
- Mantine: `@mantine/core`, `@mantine/hooks`, `@mantine/form`, `@mantine/notifications`, `@mantine/dates`
- Prisma: `prisma`, `@prisma/client`
- Crypto: `crypto` (built-in Node.js)
- Zod: `zod`
- Swagger: `swagger-ui-react`, `swagger-jsdoc`
- PDF: `@react-pdf/renderer`
- Otros: `class-transformer`, `bcryptjs`, `cookie`, `@types/cookie`

### 1.2 Configuración TypeScript

- Actualizar `tsconfig.json` con path aliases `@/src/*`
- Configurar strict mode

### 1.3 Configuración Mantine

- Crear `src/presentation/theme/mantine-theme.ts` con paleta viva:
  - Primary: fucsia/coral (#FF6B9D / #FF8C69)
  - Secondary: cian eléctrico (#00D9FF / #00E5FF)
  - Accent: amarillo cálido (#FFD93D)
- Provider en `app/layout.tsx`

### 1.4 Configuración Env (src/config/env.ts)

- Schema Zod para validar:
  - `ENC_KEY_BASE64`: string (32 bytes en base64)
  - `HMAC_PEPPER`: string
  - `ADMIN_SESSION_SECRET`: string
  - `SWAGGER_PASSWORD`: string
  - `DATABASE_URL`: string (PostgreSQL)
  - `NODE_ENV`: 'development' | 'production'
- Validar al arrancar la app

## Fase 2: Prisma Schema

### 2.1 Modelos con Cifrado Enc+Hash

```prisma
model Cuidador {
  id            String   @id @default(uuid())
  nombreCompleto String  @db.Text
  dniEnc         String  // Cifrado AES-256-GCM
  dniHash        String  @unique // HMAC-SHA256 para búsquedas
  telefonoEnc    String?
  telefonoHash   String? @unique
  emailEnc       String?
  emailHash      String? @unique
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  asignaciones   Asignacion[]
  pagos          Pago[]
  auditLogs      AuditLog[]
}

model PersonaAsistida {
  id                        String   @id @default(uuid())
  nombreCompleto            String   @db.Text
  dniEnc                    String?
  dniHash                   String?  @unique
  telefonoEnc               String?
  telefonoHash              String?  @unique
  direccionEnc              String?  @db.Text
  direccionHash             String?
  telefonoContactoEmergenciaEnc String?
  telefonoContactoEmergenciaHash String?
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
  
  asignaciones              Asignacion[]
  pagos                     Pago[]
  auditLogs                 AuditLog[]
}

model Asignacion {
  id            String    @id @default(uuid())
  cuidadorId    String
  personaId     String
  tarifaMensual Decimal?  @db.Decimal(10, 2)
  fechaInicio   DateTime
  fechaFin      DateTime?
  notas         String?   @db.Text
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  cuidador      Cuidador      @relation(fields: [cuidadorId], references: [id], onDelete: Cascade)
  persona       PersonaAsistida @relation(fields: [personaId], references: [id], onDelete: Cascade)
  pagos         Pago[]
  auditLogs     AuditLog[]
}

model Pago {
  id            String   @id @default(uuid())
  cuidadorId    String
  personaId     String?
  monto         Decimal  @db.Decimal(10, 2)
  fecha         DateTime
  metodo        String   // 'EFECTIVO', 'TRANSFERENCIA', 'OTRO'
  nota          String?  @db.Text
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  cuidador      Cuidador      @relation(fields: [cuidadorId], references: [id], onDelete: Cascade)
  persona       PersonaAsistida? @relation(fields: [personaId], references: [id], onDelete: SetNull)
  recibos       ReciboAdjunto[]
  auditLogs     AuditLog[]
}

model ReciboAdjunto {
  id        String   @id @default(uuid())
  pagoId    String
  url       String   @db.Text
  filename  String
  createdAt DateTime @default(now())
  
  pago      Pago     @relation(fields: [pagoId], references: [id], onDelete: Cascade)
}

model AuditLog {
  id        String   @id @default(uuid())
  actor     String   // 'ADMIN'
  action    String   // 'CREATE', 'UPDATE', 'DELETE'
  table     String   // 'Cuidador', 'PersonaAsistida', etc.
  recordId  String
  oldData   Json?
  newData   Json?
  ip        String?
  userAgent String?
  createdAt DateTime @default(now())
  
  cuidador      Cuidador?      @relation(fields: [recordId], references: [id])
  persona       PersonaAsistida? @relation(fields: [recordId], references: [id])
  asignacion    Asignacion?    @relation(fields: [recordId], references: [id])
  pago          Pago?          @relation(fields: [recordId], references: [id])
}

model Admin {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // bcrypt hash
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 2.2 Migración Inicial

- Crear migración con `prisma migrate dev --name init`

## Fase 3: Infrastructure Layer

### 3.1 Crypto Service (`src/infrastructure/crypto/`)

- `EncryptionService`: 
  - `encrypt(plaintext: string): string` - AES-256-GCM
  - `decrypt(ciphertext: string): string`
  - Usar `ENC_KEY_BASE64` (decodificar de base64 a Buffer)
- `HashingService`:
  - `hash(data: string): string` - HMAC-SHA256
  - Usar `HMAC_PEPPER` como key
  - Determinístico para búsquedas y unicidad

### 3.2 Audit Service (`src/infrastructure/audit/`)

- `AuditService`: Registrar C/U/D con:
  - `actor`: 'ADMIN'
  - `action`: 'CREATE' | 'UPDATE' | 'DELETE'
  - `table`: nombre de tabla
  - `recordId`: ID del registro
  - `oldData`, `newData`: JSON sin PII (redactar campos cifrados)
  - `ip`, `userAgent`: del request
- Implementar con Prisma middleware para capturar automáticamente

### 3.3 Database (`src/infrastructure/database/`)

- `PrismaService`: Singleton de Prisma Client
- Repositorios concretos que implementan interfaces de dominio:
  - `CuidadorRepository`, `PersonaAsistidaRepository`, etc.
- Helpers para transacciones

### 3.4 Logger (`src/infrastructure/logger/`)

- Logger que redacta automáticamente PII antes de loguear
- Nunca loguear campos cifrados o datos sensibles

## Fase 4: Domain Layer

### 4.1 Entidades (`src/domain/entities/`)

- `Cuidador`, `PersonaAsistida`, `Asignacion`, `Pago`, `ReciboAdjunto`
- Lógica de negocio en las entidades

### 4.2 Interfaces de Repositorios (`src/domain/repositories/`)

- `ICuidadorRepository`, `IPersonaAsistidaRepository`, etc.
- Definir métodos necesarios (findById, findAll, create, update, delete)

### 4.3 Value Objects (`src/domain/value-objects/`)

- `EncryptedData`: wrapper para datos cifrados
- Otros value objects según necesidad

## Fase 5: Application Layer

### 5.1 DTOs (`src/application/dto/`)

- `CuidadorDTO`, `PersonaAsistidaDTO`, `AsignacionDTO`, `PagoDTO`, `ReciboAdjuntoDTO`
- Usar `class-transformer` para serialización
- Validación con Zod en los use cases

### 5.2 Use Cases (`src/application/use-cases/`)

- CRUD para cada entidad:
  - `CreateCuidadorUseCase`, `UpdateCuidadorUseCase`, `DeleteCuidadorUseCase`, `GetCuidadorUseCase`, `ListCuidadoresUseCase`
  - Similar para PersonaAsistida, Asignacion, Pago
- `GetSaldosByCuidadorUseCase`: 
  - Filtros: `cuidadorId`, `from`, `to`
  - Retornar: `totalPagado`, `cantidadPagos`, agrupaciones opcionales por mes
- `GenerateReciboPDFUseCase`: Generar PDF on-demand

### 5.3 Services (`src/application/services/`)

- `PDFService`: Generación de PDFs con @react-pdf/renderer
  - Template de recibo con datos del pago, cuidador, persona
  - Retornar buffer/stream

## Fase 6: API Routes (Presentation)

### 6.1 Estructura API (`app/api/v1/`)

```
app/api/v1/
├── cuidadores/
│   ├── route.ts          # GET (paginado), GET /all, POST
│   └── [id]/
│       └── route.ts      # GET, PUT, DELETE
├── personas-asistidas/
│   ├── route.ts
│   └── [id]/
│       └── route.ts
├── asignaciones/
│   ├── route.ts
│   └── [id]/
│       └── route.ts
├── pagos/
│   ├── route.ts          # GET (paginado), GET /all, POST
│   └── [id]/
│       ├── route.ts      # GET, PUT, DELETE
│       ├── recibos/
│       │   └── route.ts  # POST (metadata)
│       └── recibo.pdf/
│           └── route.ts  # GET (PDF on-demand)
├── reportes/
│   └── saldos/
│       └── route.ts      # GET con query params
├── auth/
│   └── login/
│       └── route.ts     # POST (cookie httpOnly + rate limit)
└── docs/
    └── route.ts         # GET Swagger UI (password gate en prod)
```

### 6.2 Middleware

- `authMiddleware`: Verificar sesión cookie para rutas protegidas
- `responseWrapper`: Envolver todas las respuestas con estructura estándar:
  - OK: `{ ok: true, data: T, meta: { requestId: string, timestamp: string } }`
  - ERROR: `{ ok: false, error: { code: string, message: string, details?: any }, meta: { requestId: string, timestamp: string } }`
- `requestIdMiddleware`: Generar `requestId` único por request (UUID v4)
- `auditMiddleware`: Integrado con Prisma middleware

### 6.3 Swagger

- Configurar `swagger-jsdoc` con definiciones de todos los endpoints
- Ruta `/api/v1/docs` (o `/docs` si prefieres)
- En producción: Basic Auth simple con `SWAGGER_PASSWORD`
- En dev: libre acceso

### 6.4 Auth

- Login: `POST /api/v1/auth/login`
  - Body: `{ email: string, password: string }`
  - Verificar contra tabla `Admin` (bcrypt)
  - Crear sesión cookie httpOnly con `ADMIN_SESSION_SECRET`
  - Rate limit: máximo 5 intentos por IP en 15 minutos
- Middleware de auth: verificar cookie en rutas `/api/v1/*` (excepto `/docs` en dev y `/auth/login`)

## Fase 7: Frontend - Landing Page

### 7.1 Estructura (`app/page.tsx`)

- Layout editorial premium (no template genérico)
- Bento grid asimétrico con 7-9 tarjetas de distintos tamaños:
  - "Saldo por cuidador" (con mock data visual)
  - "Pagos por período" (gráfico sutil con Mantine)
  - "Recibos on-demand" (icono + copy)
  - "Historial auditable" (timeline visual)
  - "Datos protegidos (cifrado)" (badge + explicación)
  - Otras tarjetas con contenido real y útil

### 7.2 Componentes Específicos

- `ManifiestoSection`: Texto grande + notas laterales tipo anotaciones (asides)
- `TimelineSection`: 3 pasos verticales con microcopy real y ejemplos concretos
- `PreviewUI`: 
  - Tabla de pagos con filtros (cuidador + rango fechas)
  - Tarjeta de saldo total
  - Botón "Generar recibo PDF" (mock)

### 7.3 Microinteracciones

- Hover: `elevation` + `border glow` sutil (Mantine shadows)
- Reveal de detalles al hover
- Transiciones suaves (CSS transitions o framer-motion si prefieres)

### 7.4 Copy

- Español rioplatense neutro, humano y concreto
- Enfatizar: "Pagos claros, historial completo", "Recibos en un clic, cuando los necesitás", "Tus datos, protegidos"
- FAQ real:
  - ¿Se guarda el PDF? (No, se genera bajo demanda)
  - ¿Cómo se calcula el saldo?
  - ¿Qué datos se protegen?
  - ¿Puedo filtrar por fechas?

## Fase 8: Admin Panel (Mantine)

### 8.1 Layout (`app/admin/layout.tsx`)

- `AppShell` de Mantine con navegación lateral
- Header con logout
- Rutas protegidas: middleware verifica sesión, redirige a `/admin/login` si no autenticado

### 8.2 Páginas Admin

- `app/admin/login/page.tsx`: Login form con Mantine
- `app/admin/cuidadores/page.tsx`: 
  - Tabla con paginación
  - Botones crear/editar/eliminar
  - Modal para crear/editar con formulario validado
- `app/admin/personas-asistidas/page.tsx`: Similar
- `app/admin/asignaciones/page.tsx`: Similar
- `app/admin/pagos/page.tsx`: 
  - Tabla con filtros (cuidador, fechas)
  - Botón "Generar recibo PDF" por pago (abre/descarga)
  - Formulario para crear pago
- `app/admin/reportes/page.tsx`: 
  - Filtros: cuidador, rango de fechas
  - Mostrar: total pagado, cantidad de pagos, agrupación por mes (opcional)
  - Gráfico visual con Mantine

### 8.3 Componentes Admin

- Tablas con `@mantine/core` Table
- Formularios con `@mantine/form` y validación Zod
- Modales para crear/editar
- Notificaciones con `@mantine/notifications`
- Filtros con DatePicker de Mantine

## Fase 9: PDF Generation

### 9.1 Template (`src/application/services/PDFService`)

- Usar `@react-pdf/renderer` para crear template de recibo
- Incluir: datos del pago, cuidador, persona, fecha, monto, concepto, método de pago
- Diseño profesional y legible

### 9.2 Endpoint

- `GET /api/v1/pagos/[id]/recibo.pdf`: Generar PDF on-demand
- No guardar PDF en DB, solo generar y servir como `application/pdf`
- Stream o buffer según preferencia

## Fase 10: Scripts y Configuración

### 10.1 package.json Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "format": "prettier --write .",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:studio": "prisma studio"
}
```

### 10.2 .env.example

```
DATABASE_URL="postgresql://user:password@host:port/database"
ENC_KEY_BASE64="base64-encoded-32-byte-key"
HMAC_PEPPER="your-hmac-pepper-string"
ADMIN_SESSION_SECRET="your-session-secret"
SWAGGER_PASSWORD="your-swagger-password"
NODE_ENV="development"
```

### 10.3 README.md

- Instrucciones de instalación: `pnpm i`
- Setup de Supabase Postgres
- Generación de keys:
  - `ENC_KEY_BASE64`: `openssl rand -base64 32`
  - `HMAC_PEPPER`: string aleatorio
  - `ADMIN_SESSION_SECRET`: string aleatorio
- Pasos: configurar .env, `pnpm prisma:migrate`, `pnpm dev`
- Crear usuario admin inicial (script o instrucciones)

## Consideraciones de Seguridad

1. **Nunca loguear PII**: Logger redacta automáticamente datos sensibles
2. **Cifrado**: AES-256-GCM para datos personales (dni, telefono, email, direccion, nombreCompleto)
3. **HMAC**: Hash determinístico para búsquedas y verificación de unicidad
4. **Sesión Cookie**: httpOnly, secure en producción, SameSite
5. **Swagger Gate**: Password solo en producción
6. **Auditoría**: Registrar todas las operaciones C/U/D sin PII (redactar campos cifrados)
7. **Rate Limit**: En endpoint de login (5 intentos / 15 min por IP)

## Paleta de Colores (Mantine Theme)

```typescript
{
  primary: '#FF6B9D',      // Fucsia/coral
  secondary: '#00D9FF',    // Cian eléctrico
  accent: '#FFD93D',       // Amarillo cálido
  background: '#FAFAFA',   // Blanco roto
  text: '#1A1A1A'          // Texto oscuro
}
```

Aplicar consistentemente en landing y admin panel con tipografía editorial premium.

Aplicar consistentemente en landing y admin panel.