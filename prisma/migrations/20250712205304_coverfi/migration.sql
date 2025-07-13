/*
  Warnings:

  - You are about to drop the `_CoverToDisciplina` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CoverToDisciplina" DROP CONSTRAINT "_CoverToDisciplina_A_fkey";

-- DropForeignKey
ALTER TABLE "_CoverToDisciplina" DROP CONSTRAINT "_CoverToDisciplina_B_fkey";

-- DropTable
DROP TABLE "_CoverToDisciplina";
