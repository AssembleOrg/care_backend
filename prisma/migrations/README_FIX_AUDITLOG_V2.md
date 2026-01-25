# Fix AuditLog Foreign Keys - Versión 2 (Recomendada)

## Problema

Las foreign keys de `AuditLog` están causando errores porque PostgreSQL intenta validar TODAS las foreign keys al mismo tiempo cuando se inserta un registro. Como `recordId` solo puede ser válido para UNA de las 4 tablas (Cuidador, PersonaAsistida, Asignacion, Pago), la validación falla incluso con DEFERRABLE.

## Solución (Versión 2 - Recomendada)

**Eliminar las foreign keys y usar un trigger de PostgreSQL** que valide solo la foreign key correcta según el campo `table`. Esto es más robusto y eficiente que usar DEFERRABLE.

### ¿Por qué esta solución es mejor?

1. **Solo valida la foreign key correcta**: El trigger verifica solo la tabla correspondiente según el campo `table`
2. **No requiere transacciones especiales**: Funciona con cualquier tipo de inserción
3. **Mantiene la integridad referencial**: Aún valida que el `recordId` exista en la tabla correcta
4. **Más eficiente**: No intenta validar 4 foreign keys cuando solo una es relevante

## Cómo aplicar la migración

### Opción 1: Ejecutar directamente en Supabase SQL Editor (Recomendado)

1. Abre el SQL Editor en Supabase
2. Copia y pega el contenido de `fix_auditlog_foreign_keys_v2.sql`
3. Ejecuta el script

### Opción 2: Ejecutar con psql

```bash
psql $DATABASE_URL -f prisma/migrations/fix_auditlog_foreign_keys_v2.sql
```

### Opción 3: Ejecutar con Prisma

```bash
pnpm prisma db execute --file prisma/migrations/fix_auditlog_foreign_keys_v2.sql --schema prisma/schema.prisma
```

## Verificar

Después de ejecutar la migración, intenta crear un nuevo cuidador. El AuditLog debería crearse sin errores.

```sql
-- Verificar que el trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'AuditLog';

-- Verificar que las foreign keys fueron eliminadas
SELECT 
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'AuditLog'::regclass
  AND contype = 'f';
```

Deberías ver:
- El trigger `auditlog_validate_fkey` existe
- No hay foreign keys en la tabla `AuditLog`

## Nota sobre Prisma Schema

Después de ejecutar esta migración, las relaciones en el schema de Prisma (`auditLogs` en Cuidador, PersonaAsistida, etc.) seguirán funcionando para consultas, pero las foreign keys físicas en la base de datos serán reemplazadas por el trigger. Esto es seguro y no afecta la funcionalidad.
