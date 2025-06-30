-- AlterTable
ALTER TABLE "Clase" ADD COLUMN     "instructorReemplazoId" INTEGER,
ADD COLUMN     "puntosPenalizacion" INTEGER,
ADD COLUMN     "tipoPenalizacion" TEXT;

-- AlterTable
ALTER TABLE "PagoInstructor" ADD COLUMN     "faltasPermitidas" DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN     "montoDescuento" DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN     "penalizaciones" JSONB,
ADD COLUMN     "totalPuntosPenalizacion" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "Periodo" ADD COLUMN     "reglasDescuento" JSONB;

-- AddForeignKey
ALTER TABLE "Clase" ADD CONSTRAINT "Clase_instructorReemplazoId_fkey" FOREIGN KEY ("instructorReemplazoId") REFERENCES "Instructor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
