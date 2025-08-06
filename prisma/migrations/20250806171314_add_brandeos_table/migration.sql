-- CreateTable
CREATE TABLE "Brandeo" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "periodoId" INTEGER NOT NULL,
    "comentarios" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brandeo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brandeo_numero_periodoId_key" ON "Brandeo"("numero", "periodoId");

-- AddForeignKey
ALTER TABLE "Brandeo" ADD CONSTRAINT "Brandeo_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brandeo" ADD CONSTRAINT "Brandeo_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "Periodo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
