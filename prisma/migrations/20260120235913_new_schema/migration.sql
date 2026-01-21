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
CREATE TABLE "Asignacion" (
    "id" TEXT NOT NULL,
    "cuidadorId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "precioPorHora" DECIMAL(10,2) NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "horarios" JSONB NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asignacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "cuidadorId" TEXT NOT NULL,
    "personaId" TEXT,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "metodo" TEXT NOT NULL,
    "nota" TEXT,
    "esLiquidacion" BOOLEAN NOT NULL DEFAULT false,
    "precioPorHora" DECIMAL(10,2),
    "horasTrabajadas" DECIMAL(10,2),
    "semanaInicio" TIMESTAMP(3),
    "semanaFin" TIMESTAMP(3),
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

-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL,
    "idCliente" TEXT,
    "nombreManual" TEXT,
    "nombreManualHash" TEXT,
    "cuitManual" TEXT,
    "cuitManualHash" TEXT,
    "direccionManual" TEXT,
    "direccionManualHash" TEXT,
    "telefonoEmergencia" TEXT,
    "telefonoEmergenciaHash" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_nombreManualHash_key" ON "Contrato"("nombreManualHash");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_cuitManualHash_key" ON "Contrato"("cuitManualHash");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_direccionManualHash_key" ON "Contrato"("direccionManualHash");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_telefonoEmergenciaHash_key" ON "Contrato"("telefonoEmergenciaHash");

-- AddForeignKey
ALTER TABLE "Asignacion" ADD CONSTRAINT "Asignacion_cuidadorId_fkey" FOREIGN KEY ("cuidadorId") REFERENCES "Cuidador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asignacion" ADD CONSTRAINT "Asignacion_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "PersonaAsistida"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_cuidadorId_fkey" FOREIGN KEY ("cuidadorId") REFERENCES "Cuidador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "PersonaAsistida"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReciboAdjunto" ADD CONSTRAINT "ReciboAdjunto_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_Cuidador_fkey" FOREIGN KEY ("recordId") REFERENCES "Cuidador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_Persona_fkey" FOREIGN KEY ("recordId") REFERENCES "PersonaAsistida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_Asignacion_fkey" FOREIGN KEY ("recordId") REFERENCES "Asignacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_Pago_fkey" FOREIGN KEY ("recordId") REFERENCES "Pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_idCliente_fkey" FOREIGN KEY ("idCliente") REFERENCES "PersonaAsistida"("id") ON DELETE SET NULL ON UPDATE CASCADE;
