/*
  Warnings:

  - The primary key for the `Clase` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Clase" DROP CONSTRAINT "Clase_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Clase_pkey" PRIMARY KEY ("id");
