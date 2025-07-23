-- DropForeignKey
ALTER TABLE "Cover" DROP CONSTRAINT "Cover_periodoId_fkey";

-- AlterTable
ALTER TABLE "CategoriaInstructor" ADD COLUMN     "esManual" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "Cover" ALTER COLUMN "periodoId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Cover" ADD CONSTRAINT "Cover_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "Periodo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
