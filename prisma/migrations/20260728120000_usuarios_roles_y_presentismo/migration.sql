-- Roles de usuario (admin / empleado) + presentismo con validación de ubicación.

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'EMPLEADO');

-- CreateEnum
CREATE TYPE "EstadoRevisionFichaje" AS ENUM ('NO_REQUIERE', 'PENDIENTE', 'APROBADO', 'RECHAZADO');

-- AlterTable: punto exacto del domicilio + radio tolerado para el fichaje
ALTER TABLE "PersonaAsistida"
  ADD COLUMN "lat" DOUBLE PRECISION,
  ADD COLUMN "lng" DOUBLE PRECISION,
  ADD COLUMN "radioMetros" INTEGER NOT NULL DEFAULT 50;

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT,
    "rol" "RolUsuario" NOT NULL DEFAULT 'EMPLEADO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "cuidadorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
CREATE UNIQUE INDEX "Usuario_cuidadorId_key" ON "Usuario"("cuidadorId");
CREATE INDEX "Usuario_rol_idx" ON "Usuario"("rol");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_cuidadorId_fkey" FOREIGN KEY ("cuidadorId") REFERENCES "Cuidador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Fichaje" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "cuidadorId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "asignacionId" TEXT,
    "entradaAt" TIMESTAMP(3) NOT NULL,
    "entradaLat" DOUBLE PRECISION NOT NULL,
    "entradaLng" DOUBLE PRECISION NOT NULL,
    "entradaPrecisionM" DOUBLE PRECISION,
    "entradaDistanciaM" DOUBLE PRECISION NOT NULL,
    "entradaEnRango" BOOLEAN NOT NULL,
    "salidaAt" TIMESTAMP(3),
    "salidaLat" DOUBLE PRECISION,
    "salidaLng" DOUBLE PRECISION,
    "salidaPrecisionM" DOUBLE PRECISION,
    "salidaDistanciaM" DOUBLE PRECISION,
    "salidaEnRango" BOOLEAN,
    "revision" "EstadoRevisionFichaje" NOT NULL DEFAULT 'NO_REQUIERE',
    "revisadoPorId" TEXT,
    "revisadoAt" TIMESTAMP(3),
    "notaRevision" TEXT,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fichaje_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Fichaje_cuidadorId_entradaAt_idx" ON "Fichaje"("cuidadorId", "entradaAt");
CREATE INDEX "Fichaje_personaId_entradaAt_idx" ON "Fichaje"("personaId", "entradaAt");
CREATE INDEX "Fichaje_usuarioId_entradaAt_idx" ON "Fichaje"("usuarioId", "entradaAt");
CREATE INDEX "Fichaje_revision_idx" ON "Fichaje"("revision");

-- AddForeignKey
ALTER TABLE "Fichaje" ADD CONSTRAINT "Fichaje_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Fichaje" ADD CONSTRAINT "Fichaje_revisadoPorId_fkey" FOREIGN KEY ("revisadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Fichaje" ADD CONSTRAINT "Fichaje_cuidadorId_fkey" FOREIGN KEY ("cuidadorId") REFERENCES "Cuidador"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Fichaje" ADD CONSTRAINT "Fichaje_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "PersonaAsistida"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Fichaje" ADD CONSTRAINT "Fichaje_asignacionId_fkey" FOREIGN KEY ("asignacionId") REFERENCES "Asignacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
