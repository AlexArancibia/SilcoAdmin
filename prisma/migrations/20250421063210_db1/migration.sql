-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Instructor" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "password" TEXT,
    "extrainfo" JSONB,
    "ultimoBono" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disciplina" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "color" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Disciplina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Periodo" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "año" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bonoCalculado" BOOLEAN DEFAULT false,

    CONSTRAINT "Periodo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Formula" (
    "id" SERIAL NOT NULL,
    "disciplinaId" INTEGER NOT NULL,
    "periodoId" INTEGER NOT NULL,
    "requisitosCategoria" JSONB NOT NULL,
    "parametrosPago" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Formula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaInstructor" (
    "id" SERIAL NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "disciplinaId" INTEGER NOT NULL,
    "periodoId" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL,
    "metricas" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoriaInstructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clase" (
    "id" TEXT NOT NULL,
    "pais" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "disciplinaId" INTEGER NOT NULL,
    "semana" INTEGER NOT NULL,
    "estudio" TEXT NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "periodoId" INTEGER NOT NULL,
    "salon" TEXT NOT NULL,
    "reservasTotales" INTEGER NOT NULL DEFAULT 0,
    "listasEspera" INTEGER NOT NULL DEFAULT 0,
    "cortesias" INTEGER NOT NULL DEFAULT 0,
    "lugares" INTEGER NOT NULL,
    "reservasPagadas" INTEGER NOT NULL DEFAULT 0,
    "textoEspecial" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoInstructor" (
    "id" SERIAL NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "instructorId" INTEGER NOT NULL,
    "periodoId" INTEGER NOT NULL,
    "detalles" JSONB,
    "cumpleLineamientos" BOOLEAN,
    "dobleteos" INTEGER,
    "horariosNoPrime" INTEGER,
    "participacionEventos" BOOLEAN,
    "retencion" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "reajuste" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "tipoReajuste" TEXT NOT NULL DEFAULT 'FIJO',
    "bono" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pagoFinal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PagoInstructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Archivo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT,
    "url" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Archivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DisciplinaToInstructor" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DisciplinaToInstructor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_nombre_key" ON "Instructor"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Disciplina_nombre_key" ON "Disciplina"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Formula_disciplinaId_periodoId_key" ON "Formula"("disciplinaId", "periodoId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaInstructor_instructorId_disciplinaId_periodoId_key" ON "CategoriaInstructor"("instructorId", "disciplinaId", "periodoId");

-- CreateIndex
CREATE UNIQUE INDEX "PagoInstructor_instructorId_periodoId_key" ON "PagoInstructor"("instructorId", "periodoId");

-- CreateIndex
CREATE INDEX "_DisciplinaToInstructor_B_index" ON "_DisciplinaToInstructor"("B");

-- AddForeignKey
ALTER TABLE "Formula" ADD CONSTRAINT "Formula_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formula" ADD CONSTRAINT "Formula_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "Periodo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriaInstructor" ADD CONSTRAINT "CategoriaInstructor_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriaInstructor" ADD CONSTRAINT "CategoriaInstructor_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriaInstructor" ADD CONSTRAINT "CategoriaInstructor_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "Periodo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clase" ADD CONSTRAINT "Clase_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clase" ADD CONSTRAINT "Clase_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clase" ADD CONSTRAINT "Clase_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "Periodo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoInstructor" ADD CONSTRAINT "PagoInstructor_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoInstructor" ADD CONSTRAINT "PagoInstructor_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "Periodo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DisciplinaToInstructor" ADD CONSTRAINT "_DisciplinaToInstructor_A_fkey" FOREIGN KEY ("A") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DisciplinaToInstructor" ADD CONSTRAINT "_DisciplinaToInstructor_B_fkey" FOREIGN KEY ("B") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
