/*
  Warnings:

  - You are about to drop the column `reglasDescuentoPenalizacion` on the `Formula` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Formula" DROP COLUMN "reglasDescuentoPenalizacion";

-- AlterTable
ALTER TABLE "PagoInstructor" ADD COLUMN     "bonoCover" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "penalizacion" DOUBLE PRECISION NOT NULL DEFAULT 0.0;
