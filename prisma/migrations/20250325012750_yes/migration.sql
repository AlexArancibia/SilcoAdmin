/*
  Warnings:

  - You are about to drop the column `estado` on the `Clase` table. All the data in the column will be lost.
  - You are about to drop the column `activo` on the `Instructor` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Instructor` table. All the data in the column will be lost.
  - You are about to drop the column `especialidad` on the `Instructor` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `Instructor` table. All the data in the column will be lost.
  - You are about to drop the column `fechaContratacion` on the `Instructor` table. All the data in the column will be lost.
  - You are about to drop the column `notas` on the `Instructor` table. All the data in the column will be lost.
  - You are about to drop the column `telefono` on the `Instructor` table. All the data in the column will be lost.
  - You are about to drop the column `fecha` on the `PagoInstructor` table. All the data in the column will be lost.
  - You are about to drop the `DisciplinaInstructor` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[nombre]` on the table `Instructor` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "DisciplinaInstructor" DROP CONSTRAINT "DisciplinaInstructor_disciplinaId_fkey";

-- DropForeignKey
ALTER TABLE "DisciplinaInstructor" DROP CONSTRAINT "DisciplinaInstructor_instructorId_fkey";

-- DropIndex
DROP INDEX "Instructor_email_key";

-- AlterTable
ALTER TABLE "Clase" DROP COLUMN "estado";

-- AlterTable
ALTER TABLE "Instructor" DROP COLUMN "activo",
DROP COLUMN "email",
DROP COLUMN "especialidad",
DROP COLUMN "estado",
DROP COLUMN "fechaContratacion",
DROP COLUMN "notas",
DROP COLUMN "telefono",
ADD COLUMN     "password" TEXT;

-- AlterTable
ALTER TABLE "PagoInstructor" DROP COLUMN "fecha";

-- DropTable
DROP TABLE "DisciplinaInstructor";

-- CreateTable
CREATE TABLE "_DisciplinaToInstructor" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DisciplinaToInstructor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DisciplinaToInstructor_B_index" ON "_DisciplinaToInstructor"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_nombre_key" ON "Instructor"("nombre");

-- AddForeignKey
ALTER TABLE "_DisciplinaToInstructor" ADD CONSTRAINT "_DisciplinaToInstructor_A_fkey" FOREIGN KEY ("A") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DisciplinaToInstructor" ADD CONSTRAINT "_DisciplinaToInstructor_B_fkey" FOREIGN KEY ("B") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
