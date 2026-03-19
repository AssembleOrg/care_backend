/*
  Warnings:

  - A unique constraint covering the columns `[telefonoHash]` on the table `SolicitudEmpleo` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[emailHash]` on the table `SolicitudEmpleo` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `emailHash` to the `SolicitudEmpleo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `telefonoHash` to the `SolicitudEmpleo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SolicitudEmpleo" ADD COLUMN     "emailHash" TEXT NOT NULL,
ADD COLUMN     "telefonoHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SolicitudEmpleo_telefonoHash_key" ON "SolicitudEmpleo"("telefonoHash");

-- CreateIndex
CREATE UNIQUE INDEX "SolicitudEmpleo_emailHash_key" ON "SolicitudEmpleo"("emailHash");
