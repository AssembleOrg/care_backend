-- Permitir re-postular: quitar UNIQUE de emailHash/telefonoHash, dejar índices normales.
DROP INDEX "SolicitudEmpleo_emailHash_key";
DROP INDEX "SolicitudEmpleo_telefonoHash_key";
CREATE INDEX "SolicitudEmpleo_emailHash_idx" ON "SolicitudEmpleo"("emailHash");
CREATE INDEX "SolicitudEmpleo_telefonoHash_idx" ON "SolicitudEmpleo"("telefonoHash");

-- Rate limiting por IP para formularios públicos (anti-spam).
CREATE TABLE "FormSubmissionLog" (
    "id" TEXT NOT NULL,
    "routeKey" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FormSubmissionLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FormSubmissionLog_routeKey_ipHash_createdAt_idx" ON "FormSubmissionLog"("routeKey", "ipHash", "createdAt");
