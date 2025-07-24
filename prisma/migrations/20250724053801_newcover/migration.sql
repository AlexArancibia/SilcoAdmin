/*
  Warnings:

  - You are about to drop the column `claseTemp` on the `Cover` table. All the data in the column will be lost.
  - Added the required column `disciplinaId` to the `Cover` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fecha` to the `Cover` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hora` to the `Cover` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instructorOriginalId` to the `Cover` table without a default value. This is not possible if the table is not empty.
  - Made the column `periodoId` on table `Cover` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Cover" DROP CONSTRAINT "Cover_periodoId_fkey";

-- AlterTable
ALTER TABLE "Cover" DROP COLUMN "claseTemp",
ADD COLUMN     "disciplinaId" INTEGER NOT NULL,
ADD COLUMN     "fecha" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "hora" TEXT NOT NULL,
ADD COLUMN     "instructorOriginalId" INTEGER NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
ALTER COLUMN "periodoId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Cover" ADD CONSTRAINT "Cover_instructorOriginalId_fkey" FOREIGN KEY ("instructorOriginalId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cover" ADD CONSTRAINT "Cover_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cover" ADD CONSTRAINT "Cover_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "Periodo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
