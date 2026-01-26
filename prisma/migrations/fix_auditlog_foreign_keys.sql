-- Migración para hacer las foreign keys de AuditLog DEFERRABLE
-- Esto permite que PostgreSQL no valide todas las foreign keys al mismo tiempo
-- Solo valida la foreign key que realmente corresponde al tipo de registro

BEGIN;

-- Eliminar las foreign keys existentes
ALTER TABLE "AuditLog" 
  DROP CONSTRAINT IF EXISTS "AuditLog_Cuidador_fkey",
  DROP CONSTRAINT IF EXISTS "AuditLog_Persona_fkey",
  DROP CONSTRAINT IF EXISTS "AuditLog_Asignacion_fkey",
  DROP CONSTRAINT IF EXISTS "AuditLog_Pago_fkey";

-- Recrear las foreign keys como DEFERRABLE INITIALLY DEFERRED
-- Esto significa que la validación se hace al final de la transacción, no inmediatamente
ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_Cuidador_fkey" 
    FOREIGN KEY ("recordId") 
    REFERENCES "Cuidador"("id") 
    ON DELETE CASCADE
    DEFERRABLE INITIALLY DEFERRED,
  
  ADD CONSTRAINT "AuditLog_Persona_fkey" 
    FOREIGN KEY ("recordId") 
    REFERENCES "PersonaAsistida"("id") 
    ON DELETE CASCADE
    DEFERRABLE INITIALLY DEFERRED,
  
  ADD CONSTRAINT "AuditLog_Asignacion_fkey" 
    FOREIGN KEY ("recordId") 
    REFERENCES "Asignacion"("id") 
    ON DELETE CASCADE
    DEFERRABLE INITIALLY DEFERRED,
  
  ADD CONSTRAINT "AuditLog_Pago_fkey" 
    FOREIGN KEY ("recordId") 
    REFERENCES "Pago"("id") 
    ON DELETE CASCADE
    DEFERRABLE INITIALLY DEFERRED;

COMMIT;
