-- AlterTable
ALTER TABLE "Clase" ADD COLUMN     "esVersus" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vsNum" INTEGER;

-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "CCI" TEXT,
ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "banco" TEXT,
ADD COLUMN     "celular" TEXT,
ADD COLUMN     "cuentaBancaria" TEXT,
ADD COLUMN     "nombreCompleto" TEXT,
ADD COLUMN     "personaContacto" TEXT;
