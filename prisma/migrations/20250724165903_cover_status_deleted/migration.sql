/*
  Warnings:

  - You are about to drop the column `status` on the `Cover` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cover" DROP COLUMN "status",
ALTER COLUMN "justificacion" SET DEFAULT 'PENDIENTE',
ALTER COLUMN "justificacion" SET DATA TYPE TEXT;
