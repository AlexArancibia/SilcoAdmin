/*
  Warnings:

  - You are about to drop the column `cumpleLineamientos` on the `Instructor` table. All the data in the column will be lost.
  - You are about to drop the column `dobleteos` on the `Instructor` table. All the data in the column will be lost.
  - You are about to drop the column `horariosNoPrime` on the `Instructor` table. All the data in the column will be lost.
  - You are about to drop the column `participacionEventos` on the `Instructor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Instructor" DROP COLUMN "cumpleLineamientos",
DROP COLUMN "dobleteos",
DROP COLUMN "horariosNoPrime",
DROP COLUMN "participacionEventos";

-- AlterTable
ALTER TABLE "PagoInstructor" ADD COLUMN     "cumpleLineamientos" BOOLEAN,
ADD COLUMN     "dobleteos" INTEGER,
ADD COLUMN     "horariosNoPrime" INTEGER,
ADD COLUMN     "participacionEventos" BOOLEAN;
