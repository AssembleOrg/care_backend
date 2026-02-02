-- Migración para agregar relación many-to-many entre PersonaAsistida y Cuidador
-- Elimina todas las asignaciones existentes como solicitado

BEGIN;

-- Eliminar AuditLogs relacionados con Asignaciones primero (para evitar problemas de foreign key)
DELETE FROM "AuditLog" WHERE "table" = 'Asignacion';

-- Eliminar todas las asignaciones (como solicitado por el usuario)
DELETE FROM "Asignacion";

-- Crear tabla PersonaCuidador
CREATE TABLE IF NOT EXISTS "PersonaCuidador" (
  "id" TEXT NOT NULL,
  "personaId" TEXT NOT NULL,
  "cuidadorId" TEXT NOT NULL,
  "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fechaFin" TIMESTAMP(3),
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PersonaCuidador_pkey" PRIMARY KEY ("id")
);

-- Agregar foreign keys
ALTER TABLE "PersonaCuidador" 
  ADD CONSTRAINT "PersonaCuidador_personaId_fkey" 
    FOREIGN KEY ("personaId") 
    REFERENCES "PersonaAsistida"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  
  ADD CONSTRAINT "PersonaCuidador_cuidadorId_fkey" 
    FOREIGN KEY ("cuidadorId") 
    REFERENCES "Cuidador"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- Crear índices
CREATE INDEX IF NOT EXISTS "PersonaCuidador_personaId_idx" ON "PersonaCuidador"("personaId");
CREATE INDEX IF NOT EXISTS "PersonaCuidador_cuidadorId_idx" ON "PersonaCuidador"("cuidadorId");

-- Crear unique constraint para evitar duplicados (persona + cuidador + fechaInicio)
CREATE UNIQUE INDEX IF NOT EXISTS "PersonaCuidador_personaId_cuidadorId_fechaInicio_key" 
  ON "PersonaCuidador"("personaId", "cuidadorId", "fechaInicio");

COMMIT;
