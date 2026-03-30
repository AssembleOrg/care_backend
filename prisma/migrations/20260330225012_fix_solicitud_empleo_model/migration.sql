-- AlterTable
ALTER TABLE "SolicitudEmpleo" ADD COLUMN     "experienciaHash" TEXT,
ALTER COLUMN "experiencia" DROP NOT NULL;
