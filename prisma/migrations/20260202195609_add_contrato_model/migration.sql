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
CREATE UNIQUE INDEX "Contrato_nombreManualHash_key" ON "Contrato"("nombreManualHash");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_cuitManualHash_key" ON "Contrato"("cuitManualHash");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_direccionManualHash_key" ON "Contrato"("direccionManualHash");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_telefonoEmergenciaHash_key" ON "Contrato"("telefonoEmergenciaHash");

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_idCliente_fkey" FOREIGN KEY ("idCliente") REFERENCES "PersonaAsistida"("id") ON DELETE SET NULL ON UPDATE CASCADE;
