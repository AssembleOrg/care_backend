/*
  Warnings:

  - You are about to alter the column `experiencia` on the `SolicitudEmpleo` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.

*/
-- AlterTable
ALTER TABLE "SolicitudEmpleo" ALTER COLUMN "experiencia" SET DATA TYPE VARCHAR(200);
