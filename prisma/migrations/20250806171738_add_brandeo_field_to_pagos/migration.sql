-- AlterTable
ALTER TABLE "PagoInstructor" ADD COLUMN     "brandeo" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- CreateTable
CREATE TABLE "_BrandeoToPagoInstructor" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_BrandeoToPagoInstructor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_BrandeoToPagoInstructor_B_index" ON "_BrandeoToPagoInstructor"("B");

-- AddForeignKey
ALTER TABLE "_BrandeoToPagoInstructor" ADD CONSTRAINT "_BrandeoToPagoInstructor_A_fkey" FOREIGN KEY ("A") REFERENCES "Brandeo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BrandeoToPagoInstructor" ADD CONSTRAINT "_BrandeoToPagoInstructor_B_fkey" FOREIGN KEY ("B") REFERENCES "PagoInstructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
