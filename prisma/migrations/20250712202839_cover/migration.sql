-- DropForeignKey
ALTER TABLE "Cover" DROP CONSTRAINT "Cover_claseId_fkey";

-- AlterTable
ALTER TABLE "Cover" ALTER COLUMN "claseId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Cover" ADD CONSTRAINT "Cover_claseId_fkey" FOREIGN KEY ("claseId") REFERENCES "Clase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
