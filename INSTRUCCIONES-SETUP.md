# Instrucciones de Setup - CareByDani

## 🚀 Setup Completo

### 1. Variables de Entorno

Crear `.env` desde `.env.example` y configurar:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-anon-key"
SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"

# Database (Supabase Postgres)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Encryption (generar con openssl)
ENC_KEY_BASE64="$(openssl rand -base64 32)"
HMAC_PEPPER="$(openssl rand -hex 32)"
ADMIN_SESSION_SECRET="$(openssl rand -hex 32)"
SWAGGER_PASSWORD="tu-password-seguro"
```

**O ejecutar el script:**
```bash
./scripts/generate-keys.sh
```

### 2. Migración de Base de Datos

**SÍ, necesitas ejecutar la migración:**

```bash
# 1. Generar Prisma Client
pnpm prisma:generate

# 2. Crear tablas en la base de datos
pnpm prisma db push

# (Opcional) Si querés registrar la migración:
pnpm prisma:migrate dev --name init
```

### 3. Crear Usuario Admin en Supabase Auth

**IMPORTANTE:** El sistema usa Supabase Auth, no la tabla Admin de Prisma.

**Si ya creaste el usuario por Supabase GUI:**
- ✅ No necesitás hacer nada más
- ✅ No necesitás correr el seed de Prisma
- ✅ Solo necesitás configurar las políticas RLS (paso 4)

**Si necesitás crear el usuario manualmente:**
1. Ir al **SQL Editor** de Supabase
2. Ejecutar el archivo: `supabase/create-admin.sql`
3. Esto crea el usuario con:
   - Email: `admin@carebydani.com`
   - Password: `Admin123!` (cambiar después del primer login)
   - ID: `72769ed3-610f-43a4-9e3a-56140fbf4f55`

### 4. Configurar Políticas RLS

1. Ir al **SQL Editor** de Supabase
2. **IMPORTANTE:** Si tu UUID de admin es diferente, reemplazá `72769ed3-610f-43a4-9e3a-56140fbf4f55` en el archivo
3. Ejecutar el archivo: `supabase/policies-admin-only.sql`
4. Esto configura RLS para que **solo ese admin específico** pueda acceder a los datos

**Para obtener tu UUID de admin:**
```sql
SELECT id, email FROM auth.users WHERE email = 'tu-email@example.com';
```

### 5. Verificar Setup

```bash
# Iniciar servidor
pnpm dev

# Abrir http://localhost:3000
# Login en http://localhost:3000/admin/login
# Email: tu-email@example.com
# Password: tu-password
```

## ✅ Checklist de Verificación

- [ ] Variables de entorno configuradas (especialmente `ENC_KEY_BASE64` con 32 bytes)
- [ ] Migración de Prisma ejecutada (`pnpm prisma db push`)
- [ ] Usuario admin existe en Supabase Auth (verificado en GUI)
- [ ] Políticas RLS configuradas con el UUID correcto
- [ ] Servidor iniciado correctamente
- [ ] Login funciona
- [ ] Panel admin accesible
- [ ] Endpoints API funcionan

## 🔒 Seguridad

- **Cambiar contraseña** después del primer login
- **No commitear** el archivo `.env`
- **Rotar claves** de cifrado en producción
- **Revisar políticas RLS** regularmente

## 📝 Notas

- **NO necesitás correr el seed** si ya creaste el usuario por Supabase GUI
- La tabla `Admin` de Prisma es legacy (no se usa para auth)
- El auth real está en Supabase Auth
- Las políticas RLS solo permiten acceso al admin con UUID específico
- El service_role puede acceder a todo (necesario para Prisma)

## 🐛 Troubleshooting

### Error: "ENC_KEY_BASE64 must be 32 bytes"
```bash
# Generar clave correcta:
openssl rand -base64 32

# Copiar el resultado a .env como ENC_KEY_BASE64
```

### Error: "column admin_user_id does not exist"
- Las políticas SQL fueron corregidas para usar el UUID directamente
- Ejecutá `supabase/policies-admin-only.sql` nuevamente

### Error: "No autorizado" en endpoints
- Verificá que estés logueado (cookie de sesión)
- Verificá que el UUID en las políticas coincida con tu usuario
- Verificá que las políticas RLS estén activas
