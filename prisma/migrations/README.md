# Migraciones de Prisma

## ¿Necesitas crear una migración?

**SÍ**, necesitas ejecutar la migración inicial porque:

1. El schema de Prisma define todas las tablas necesarias
2. Supabase Postgres necesita las tablas creadas
3. Las políticas RLS de Supabase requieren que las tablas existan

## Pasos para migrar

1. **Configurar variables de entorno:**
   ```bash
   # Asegúrate de tener DATABASE_URL y DIRECT_URL en .env
   DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
   ```

2. **Generar Prisma Client:**
   ```bash
   pnpm prisma:generate
   ```

3. **Crear y ejecutar migración:**
   ```bash
   pnpm prisma:migrate
   ```
   
   Esto creará una migración inicial con todas las tablas.

4. **Ejecutar seed (opcional):**
   ```bash
   pnpm prisma:seed
   ```

5. **Configurar Supabase Auth:**
   - Ejecutar `supabase/create-admin.sql` en el SQL Editor de Supabase
   - Esto crea el usuario admin con el ID específico

6. **Configurar políticas RLS:**
   - Ejecutar `supabase/policies-admin-only.sql` en el SQL Editor de Supabase
   - Esto restringe el acceso solo al admin específico

## Verificar migración

```bash
# Abrir Prisma Studio para ver las tablas
pnpm prisma:studio
```

## Estructura de tablas creadas

- `Cuidador` - Datos de cuidadores con cifrado
- `PersonaAsistida` - Personas asistidas con cifrado
- `Asignacion` - Relación cuidador-persona
- `Pago` - Registro de pagos
- `ReciboAdjunto` - Metadata de recibos
- `AuditLog` - Log de auditoría
- `Admin` - Usuarios admin (legacy, ahora usamos Supabase Auth)
