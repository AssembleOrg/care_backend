# Fix AuditLog Foreign Keys

## Problema

Las foreign keys de `AuditLog` están causando errores porque PostgreSQL intenta validar TODAS las foreign keys al mismo tiempo cuando se inserta un registro. Como `recordId` solo puede ser válido para UNA de las 4 tablas (Cuidador, PersonaAsistida, Asignacion, Pago), la validación falla.

## Solución

Hacer las foreign keys `DEFERRABLE INITIALLY DEFERRED`. Esto significa que PostgreSQL validará las foreign keys al final de la transacción, no inmediatamente, permitiendo que solo se valide la foreign key que realmente corresponde.

## Cómo aplicar la migración

### Opción 1: Ejecutar directamente en Supabase SQL Editor

1. Abre el SQL Editor en Supabase
2. Copia y pega el contenido de `fix_auditlog_foreign_keys.sql`
3. Ejecuta el script

### Opción 2: Ejecutar con psql

```bash
psql $DATABASE_URL -f prisma/migrations/fix_auditlog_foreign_keys.sql
```

### Opción 3: Ejecutar con Prisma

```bash
# Si tienes acceso directo a la base de datos
pnpm prisma db execute --file prisma/migrations/fix_auditlog_foreign_keys.sql --schema prisma/schema.prisma
```

## Verificar

Después de ejecutar la migración, intenta crear un nuevo cuidador. El AuditLog debería crearse sin errores.

```sql
-- Verificar que las foreign keys son DEFERRABLE
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  condeferrable AS is_deferrable,
  condeferred AS is_deferred
FROM pg_constraint
WHERE conrelid = 'AuditLog'::regclass
  AND contype = 'f';
```

Deberías ver `is_deferrable = true` y `is_deferred = true` para todas las foreign keys.
