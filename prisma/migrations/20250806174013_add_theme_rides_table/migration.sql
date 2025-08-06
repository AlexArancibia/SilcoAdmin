-- CreateTable
CREATE TABLE "ThemeRide" (
    "id" SERIAL NOT NULL,
    "total" INTEGER NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "periodoId" INTEGER NOT NULL,
    "comentarios" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThemeRide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PagoInstructorToThemeRide" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PagoInstructorToThemeRide_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThemeRide_instructorId_periodoId_key" ON "ThemeRide"("instructorId", "periodoId");

-- CreateIndex
CREATE INDEX "_PagoInstructorToThemeRide_B_index" ON "_PagoInstructorToThemeRide"("B");

-- AddForeignKey
ALTER TABLE "ThemeRide" ADD CONSTRAINT "ThemeRide_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeRide" ADD CONSTRAINT "ThemeRide_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "Periodo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PagoInstructorToThemeRide" ADD CONSTRAINT "_PagoInstructorToThemeRide_A_fkey" FOREIGN KEY ("A") REFERENCES "PagoInstructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PagoInstructorToThemeRide" ADD CONSTRAINT "_PagoInstructorToThemeRide_B_fkey" FOREIGN KEY ("B") REFERENCES "ThemeRide"("id") ON DELETE CASCADE ON UPDATE CASCADE;
