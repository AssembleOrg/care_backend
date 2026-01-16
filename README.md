# CareByDani

Sistema de gestión de cuidadores, personas asistidas, asignaciones y pagos con cifrado de datos personales y auditoría completa.

## Stack Tecnológico

- **Next.js 16** (App Router) + TypeScript
- **Mantine UI** para frontend y admin panel
- **Supabase** para autenticación y PostgreSQL
- **Prisma ORM** para base de datos
- **Zod** para validación
- **Swagger/OpenAPI** para documentación
- **@react-pdf/renderer** para generación de PDFs on-demand
- **AES-256-GCM** para cifrado de datos personales

## Arquitectura

El proyecto sigue **Clean Architecture** con las siguientes capas:

- **Domain**: Entidades, value objects, interfaces de repositorios
- **Application**: Casos de uso, DTOs, servicios
- **Infrastructure**: Prisma, Supabase, crypto, audit, logger
- **Presentation**: Route handlers (Next.js), componentes React
- **Config**: Schema de env con Zod

## Instalación

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar Supabase

1. Crear un proyecto en [Supabase](https://supabase.com)
2. Ir a **Settings > API** y copiar:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
3. Ir a **Settings > Database** y copiar:
   - Connection string (Transaction mode) → `DATABASE_URL`
   - Connection string (Session mode) → `DIRECT_URL`

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con los valores de Supabase y generar claves de cifrado:

```bash
# Generar ENC_KEY_BASE64 (32 bytes)
openssl rand -base64 32

# Generar HMAC_PEPPER (string aleatorio)
openssl rand -hex 32

# Generar ADMIN_SESSION_SECRET (string aleatorio)
openssl rand -hex 32
```

### 4. Configurar base de datos

```bash
# Generar Prisma Client
pnpm prisma:generate

# Ejecutar migraciones
pnpm prisma:migrate
```

### 5. Crear usuario admin en Supabase

1. Ir a **Authentication > Users** en el dashboard de Supabase
2. Click en **Add user > Create new user**
3. Ingresar email y contraseña
4. Click en **Create user**

Alternativamente, usar la API de Supabase o el SQL Editor:

```sql
-- En el SQL Editor de Supabase
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@example.com',
  crypt('tu-password-seguro', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  ''
);
```

### 6. (Opcional) Configurar Row Level Security

Ejecutar el archivo `supabase/policies.sql` en el SQL Editor de Supabase para configurar políticas de seguridad a nivel de fila.

### 7. Iniciar servidor de desarrollo

```bash
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000) para ver la landing page.

Acceder a [http://localhost:3000/admin](http://localhost:3000/admin) para el panel de administración.

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Iniciar servidor de desarrollo |
| `pnpm build` | Construir para producción |
| `pnpm start` | Iniciar servidor de producción |
| `pnpm lint` | Ejecutar ESLint |
| `pnpm format` | Formatear código con Prettier |
| `pnpm prisma:generate` | Generar Prisma Client |
| `pnpm prisma:migrate` | Ejecutar migraciones |
| `pnpm prisma:studio` | Abrir Prisma Studio |

## Estructura del Proyecto

```
care_backend/
├── src/
│   ├── domain/              # Entidades y repositorios (interfaces)
│   ├── application/         # Casos de uso, DTOs, servicios
│   ├── infrastructure/      # Prisma, Supabase, crypto, audit, logger
│   ├── presentation/        # Route handlers, componentes, theme
│   └── config/              # Env schema, constantes
├── app/
│   ├── page.tsx             # Landing page
│   ├── admin/               # Panel de administración
│   └── api/v1/              # API REST endpoints
├── prisma/
│   └── schema.prisma        # Schema de base de datos
├── supabase/
│   └── policies.sql         # Políticas RLS
└── middleware.ts            # Middleware de Supabase Auth
```

## API REST

Base path: `/api/v1`

### Endpoints Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/cuidadores` | Listar cuidadores |
| `POST` | `/cuidadores` | Crear cuidador |
| `GET` | `/cuidadores/:id` | Obtener cuidador |
| `DELETE` | `/cuidadores/:id` | Eliminar cuidador |
| `GET` | `/pagos` | Listar pagos |
| `POST` | `/pagos` | Crear pago |
| `GET` | `/pagos/:id/recibo.pdf` | Generar PDF de recibo |
| `GET` | `/reportes/saldos` | Obtener saldos por cuidador |
| `POST` | `/auth/login` | Iniciar sesión |
| `GET` | `/docs` | Documentación Swagger |

### Estructura de Respuestas

**Éxito:**
```json
{
  "ok": true,
  "data": { ... },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error:**
```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje de error"
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Seguridad

| Característica | Implementación |
|---------------|----------------|
| **Autenticación** | Supabase Auth con sesiones seguras |
| **Cifrado** | AES-256-GCM para datos personales |
| **Hashes** | HMAC-SHA256 para búsquedas |
| **Auditoría** | Log de todas las operaciones C/U/D |
| **Rate Limiting** | 5 intentos de login por IP / 15 min |
| **Swagger** | Protegido con Basic Auth en producción |

## Características

- ✅ Autenticación con Supabase Auth
- ✅ Cifrado de datos personales (AES-256-GCM)
- ✅ Auditoría completa de operaciones
- ✅ Generación de PDFs on-demand
- ✅ Reportes de saldos con filtros
- ✅ API REST documentada con Swagger
- ✅ Panel de administración con Mantine
- ✅ Landing page moderna y profesional
- ✅ Middleware de protección de rutas

## Licencia

Privado - CareByDani
