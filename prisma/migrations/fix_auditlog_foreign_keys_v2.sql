-- Solución alternativa: Eliminar foreign keys y usar triggers para validación condicional
-- Esto permite que solo se valide la foreign key que realmente corresponde según el campo "table"

BEGIN;

-- Eliminar las foreign keys existentes
ALTER TABLE "AuditLog" 
  DROP CONSTRAINT IF EXISTS "AuditLog_Cuidador_fkey",
  DROP CONSTRAINT IF EXISTS "AuditLog_Persona_fkey",
  DROP CONSTRAINT IF EXISTS "AuditLog_Asignacion_fkey",
  DROP CONSTRAINT IF EXISTS "AuditLog_Pago_fkey";

-- Crear función para validar foreign key según el tipo de tabla
CREATE OR REPLACE FUNCTION validate_auditlog_foreign_key()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar según el campo "table"
  CASE NEW."table"
    WHEN 'Cuidador' THEN
      IF NOT EXISTS (SELECT 1 FROM "Cuidador" WHERE id = NEW."recordId") THEN
        RAISE EXCEPTION 'Foreign key violation: recordId % does not exist in Cuidador', NEW."recordId";
      END IF;
    WHEN 'PersonaAsistida' THEN
      IF NOT EXISTS (SELECT 1 FROM "PersonaAsistida" WHERE id = NEW."recordId") THEN
        RAISE EXCEPTION 'Foreign key violation: recordId % does not exist in PersonaAsistida', NEW."recordId";
      END IF;
    WHEN 'Asignacion' THEN
      IF NOT EXISTS (SELECT 1 FROM "Asignacion" WHERE id = NEW."recordId") THEN
        RAISE EXCEPTION 'Foreign key violation: recordId % does not exist in Asignacion', NEW."recordId";
      END IF;
    WHEN 'Pago' THEN
      IF NOT EXISTS (SELECT 1 FROM "Pago" WHERE id = NEW."recordId") THEN
        RAISE EXCEPTION 'Foreign key violation: recordId % does not exist in Pago', NEW."recordId";
      END IF;
    ELSE
      -- Permitir otros tipos de tabla sin validación
      NULL;
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que ejecuta la validación antes de insertar
DROP TRIGGER IF EXISTS auditlog_validate_fkey ON "AuditLog";
CREATE TRIGGER auditlog_validate_fkey
  BEFORE INSERT ON "AuditLog"
  FOR EACH ROW
  EXECUTE FUNCTION validate_auditlog_foreign_key();

COMMIT;
