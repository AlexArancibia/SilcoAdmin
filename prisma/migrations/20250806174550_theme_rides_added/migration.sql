/*
  Warnings:

  - You are about to drop the column `total` on the `ThemeRide` table. All the data in the column will be lost.
  - You are about to drop the `_BrandeoToPagoInstructor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PagoInstructorToThemeRide` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[numero,periodoId]` on the table `ThemeRide` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `numero` to the `ThemeRide` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_BrandeoToPagoInstructor" DROP CONSTRAINT "_BrandeoToPagoInstructor_A_fkey";

-- DropForeignKey
ALTER TABLE "_BrandeoToPagoInstructor" DROP CONSTRAINT "_BrandeoToPagoInstructor_B_fkey";

-- DropForeignKey
ALTER TABLE "_PagoInstructorToThemeRide" DROP CONSTRAINT "_PagoInstructorToThemeRide_A_fkey";

-- DropForeignKey
ALTER TABLE "_PagoInstructorToThemeRide" DROP CONSTRAINT "_PagoInstructorToThemeRide_B_fkey";

-- DropIndex
DROP INDEX "ThemeRide_instructorId_periodoId_key";

-- AlterTable
ALTER TABLE "PagoInstructor" ADD COLUMN     "themeRide" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE "ThemeRide" DROP COLUMN "total",
ADD COLUMN     "numero" INTEGER NOT NULL;

-- DropTable
DROP TABLE "_BrandeoToPagoInstructor";

-- DropTable
DROP TABLE "_PagoInstructorToThemeRide";

-- CreateIndex
CREATE UNIQUE INDEX "ThemeRide_numero_periodoId_key" ON "ThemeRide"("numero", "periodoId");
