-- Crear tabla AsignacionCuidador
CREATE TABLE IF NOT EXISTS "AsignacionCuidador" (
    "id" TEXT NOT NULL,
    "asignacionId" TEXT NOT NULL,
    "cuidadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AsignacionCuidador_pkey" PRIMARY KEY ("id")
);

-- Crear índices
CREATE UNIQUE INDEX IF NOT EXISTS "AsignacionCuidador_asignacionId_cuidadorId_key" ON "AsignacionCuidador"("asignacionId", "cuidadorId");
CREATE INDEX IF NOT EXISTS "AsignacionCuidador_asignacionId_idx" ON "AsignacionCuidador"("asignacionId");
CREATE INDEX IF NOT EXISTS "AsignacionCuidador_cuidadorId_idx" ON "AsignacionCuidador"("cuidadorId");

-- Migrar datos existentes de Asignacion.cuidadorId a AsignacionCuidador
INSERT INTO "AsignacionCuidador" ("id", "asignacionId", "cuidadorId", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text as "id",
    a."id" as "asignacionId",
    a."cuidadorId" as "cuidadorId",
    a."createdAt" as "createdAt",
    a."updatedAt" as "updatedAt"
FROM "Asignacion" a
WHERE a."cuidadorId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- Agregar foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'AsignacionCuidador_asignacionId_fkey'
    ) THEN
        ALTER TABLE "AsignacionCuidador" 
        ADD CONSTRAINT "AsignacionCuidador_asignacionId_fkey" 
        FOREIGN KEY ("asignacionId") REFERENCES "Asignacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'AsignacionCuidador_cuidadorId_fkey'
    ) THEN
        ALTER TABLE "AsignacionCuidador" 
        ADD CONSTRAINT "AsignacionCuidador_cuidadorId_fkey" 
        FOREIGN KEY ("cuidadorId") REFERENCES "Cuidador"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Eliminar foreign key antigua de Asignacion.cuidadorId
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Asignacion_cuidadorId_fkey'
    ) THEN
        ALTER TABLE "Asignacion" DROP CONSTRAINT "Asignacion_cuidadorId_fkey";
    END IF;
END $$;

-- Eliminar columna cuidadorId de Asignacion
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Asignacion' AND column_name = 'cuidadorId'
    ) THEN
        ALTER TABLE "Asignacion" DROP COLUMN "cuidadorId";
    END IF;
END $$;
