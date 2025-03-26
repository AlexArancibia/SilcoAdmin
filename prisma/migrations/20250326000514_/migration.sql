/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Instructor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[instructorId,periodoId]` on the table `PagoInstructor` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "email" TEXT,
ADD COLUMN     "parametros" JSONB;

-- AlterTable
ALTER TABLE "PagoInstructor" ADD COLUMN     "reajuste" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_email_key" ON "Instructor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PagoInstructor_instructorId_periodoId_key" ON "PagoInstructor"("instructorId", "periodoId");
