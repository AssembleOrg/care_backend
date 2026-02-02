-- CreateTable
CREATE TABLE "Cuidador" (
    "id" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "dniEnc" TEXT NOT NULL,
    "dniHash" TEXT NOT NULL,
    "telefonoEnc" TEXT,
    "telefonoHash" TEXT,
    "emailEnc" TEXT,
    "emailHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cuidador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonaAsistida" (
    "id" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "dniEnc" TEXT,
    "dniHash" TEXT,
    "telefonoEnc" TEXT,
    "telefonoHash" TEXT,
    "direccionEnc" TEXT,
    "direccionHash" TEXT,
    "telefonoContactoEmergenciaEnc" TEXT,
    "telefonoContactoEmergenciaHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonaAsistida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonaCuidador" (
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

-- CreateTable
CREATE TABLE "Asignacion" (
    "id" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "horarios" JSONB,
    "horasPorCuidador" JSONB,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asignacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsignacionCuidador" (
    "id" TEXT NOT NULL,
    "asignacionId" TEXT NOT NULL,
    "cuidadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AsignacionCuidador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "cuidadorId" TEXT NOT NULL,
    "personaId" TEXT,
    "asignacionId" TEXT,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "metodo" TEXT NOT NULL DEFAULT 'LIQUIDACION',
    "nota" TEXT,
    "precioPorHora" DECIMAL(10,2) NOT NULL,
    "horasTrabajadas" DECIMAL(10,2) NOT NULL,
    "semanaInicio" TIMESTAMP(3) NOT NULL,
    "semanaFin" TIMESTAMP(3) NOT NULL,
    "horarios" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReciboAdjunto" (
    "id" TEXT NOT NULL,
    "pagoId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReciboAdjunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "table" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cuidador_dniHash_key" ON "Cuidador"("dniHash");

-- CreateIndex
CREATE UNIQUE INDEX "Cuidador_telefonoHash_key" ON "Cuidador"("telefonoHash");

-- CreateIndex
CREATE UNIQUE INDEX "Cuidador_emailHash_key" ON "Cuidador"("emailHash");

-- CreateIndex
CREATE UNIQUE INDEX "PersonaAsistida_dniHash_key" ON "PersonaAsistida"("dniHash");

-- CreateIndex
CREATE UNIQUE INDEX "PersonaAsistida_telefonoHash_key" ON "PersonaAsistida"("telefonoHash");

-- CreateIndex
CREATE INDEX "PersonaCuidador_personaId_idx" ON "PersonaCuidador"("personaId");

-- CreateIndex
CREATE INDEX "PersonaCuidador_cuidadorId_idx" ON "PersonaCuidador"("cuidadorId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonaCuidador_personaId_cuidadorId_fechaInicio_key" ON "PersonaCuidador"("personaId", "cuidadorId", "fechaInicio");

-- CreateIndex
CREATE INDEX "AsignacionCuidador_asignacionId_idx" ON "AsignacionCuidador"("asignacionId");

-- CreateIndex
CREATE INDEX "AsignacionCuidador_cuidadorId_idx" ON "AsignacionCuidador"("cuidadorId");

-- CreateIndex
CREATE UNIQUE INDEX "AsignacionCuidador_asignacionId_cuidadorId_key" ON "AsignacionCuidador"("asignacionId", "cuidadorId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- AddForeignKey
ALTER TABLE "PersonaCuidador" ADD CONSTRAINT "PersonaCuidador_cuidadorId_fkey" FOREIGN KEY ("cuidadorId") REFERENCES "Cuidador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonaCuidador" ADD CONSTRAINT "PersonaCuidador_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "PersonaAsistida"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asignacion" ADD CONSTRAINT "Asignacion_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "PersonaAsistida"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionCuidador" ADD CONSTRAINT "AsignacionCuidador_asignacionId_fkey" FOREIGN KEY ("asignacionId") REFERENCES "Asignacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionCuidador" ADD CONSTRAINT "AsignacionCuidador_cuidadorId_fkey" FOREIGN KEY ("cuidadorId") REFERENCES "Cuidador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_cuidadorId_fkey" FOREIGN KEY ("cuidadorId") REFERENCES "Cuidador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "PersonaAsistida"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_asignacionId_fkey" FOREIGN KEY ("asignacionId") REFERENCES "Asignacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReciboAdjunto" ADD CONSTRAINT "ReciboAdjunto_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE CASCADE ON UPDATE CASCADE;
