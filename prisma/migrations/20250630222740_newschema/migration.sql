/*
  Warnings:

  - You are about to drop the column `faltasPermitidas` on the `PagoInstructor` table. All the data in the column will be lost.
  - You are about to drop the column `montoDescuento` on the `PagoInstructor` table. All the data in the column will be lost.
  - You are about to drop the column `penalizaciones` on the `PagoInstructor` table. All the data in the column will be lost.
  - You are about to drop the column `totalPuntosPenalizacion` on the `PagoInstructor` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Clase" DROP CONSTRAINT "Clase_instructorReemplazoId_fkey";

-- AlterTable
ALTER TABLE "Formula" ADD COLUMN     "reglasDescuentoPenalizacion" JSONB;

-- AlterTable
ALTER TABLE "PagoInstructor" DROP COLUMN "faltasPermitidas",
DROP COLUMN "montoDescuento",
DROP COLUMN "penalizaciones",
DROP COLUMN "totalPuntosPenalizacion";

-- CreateTable
CREATE TABLE "Cover" (
    "id" SERIAL NOT NULL,
    "claseId" TEXT NOT NULL,
    "periodoId" INTEGER NOT NULL,
    "instructorReemplazoId" INTEGER NOT NULL,
    "justificacion" BOOLEAN NOT NULL DEFAULT false,
    "pagoBono" BOOLEAN NOT NULL DEFAULT false,
    "pagoFullHouse" BOOLEAN NOT NULL DEFAULT false,
    "comentarios" TEXT,
    "cambioDeNombre" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Penalizacion" (
    "id" SERIAL NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "disciplinaId" INTEGER,
    "periodoId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "puntos" INTEGER NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "aplicadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comentarios" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Penalizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CoverToDisciplina" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CoverToDisciplina_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CoverToDisciplina_B_index" ON "_CoverToDisciplina"("B");

-- AddForeignKey
ALTER TABLE "Cover" ADD CONSTRAINT "Cover_claseId_fkey" FOREIGN KEY ("claseId") REFERENCES "Clase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cover" ADD CONSTRAINT "Cover_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "Periodo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cover" ADD CONSTRAINT "Cover_instructorReemplazoId_fkey" FOREIGN KEY ("instructorReemplazoId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penalizacion" ADD CONSTRAINT "Penalizacion_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penalizacion" ADD CONSTRAINT "Penalizacion_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penalizacion" ADD CONSTRAINT "Penalizacion_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "Periodo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CoverToDisciplina" ADD CONSTRAINT "_CoverToDisciplina_A_fkey" FOREIGN KEY ("A") REFERENCES "Cover"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CoverToDisciplina" ADD CONSTRAINT "_CoverToDisciplina_B_fkey" FOREIGN KEY ("B") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;
