import { parametrosPagoEjemplo, requisitosCategoriaEjemplo } from "@/types/schema"
import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"
 

const prisma = new PrismaClient()

 


async function main() {
  console.log("Iniciando seed...")

  // Crear usuarios
  console.log("Creando usuarios...")

  // Super administrador
  const superAdminPassword = await hash("superadmin123", 10)
  await prisma.usuario.upsert({
    where: { email: "superadmin@siclo.com" },
    update: {},
    create: {
      nombre: "Super Admin",
      email: "superadmin@siclo.com",
      password: superAdminPassword,
      rol: "SUPER_ADMIN",
      activo: true,
    },
  })

  // Administradores
  const adminPassword = await hash("admin123", 10)
  for (let i = 1; i <= 3; i++) {
    await prisma.usuario.upsert({
      where: { email: `admin${i}@siclo.com` },
      update: {},
      create: {
        nombre: `Admin ${i}`,
        email: `admin${i}@siclo.com`,
        password: adminPassword,
        rol: "ADMIN",
        activo: true,
      },
    })
  }

  // Crear periodos para 2025
  console.log("Creando periodos...")
  const periodos = [
    {
      numero: 1,
      año: 2025,
      fechaInicio: new Date("2024-12-30"),
      fechaFin: new Date("2025-01-26"),
      fechaPago: new Date("2025-01-30"),
    },
    {
      numero: 2,
      año: 2025,
      fechaInicio: new Date("2025-01-27"),
      fechaFin: new Date("2025-02-23"),
      fechaPago: new Date("2025-02-27"),
    },
    {
      numero: 3,
      año: 2025,
      fechaInicio: new Date("2025-02-24"),
      fechaFin: new Date("2025-03-23"),
      fechaPago: new Date("2025-03-27"),
    },
    {
      numero: 4,
      año: 2025,
      fechaInicio: new Date("2025-03-24"),
      fechaFin: new Date("2025-04-20"),
      fechaPago: new Date("2025-04-24"),
    },
    {
      numero: 5,
      año: 2025,
      fechaInicio: new Date("2025-04-21"),
      fechaFin: new Date("2025-05-18"),
      fechaPago: new Date("2025-05-22"),
    },
    {
      numero: 6,
      año: 2025,
      fechaInicio: new Date("2025-05-19"),
      fechaFin: new Date("2025-06-15"),
      fechaPago: new Date("2025-06-19"),
    },
    {
      numero: 7,
      año: 2025,
      fechaInicio: new Date("2025-06-16"),
      fechaFin: new Date("2025-07-13"),
      fechaPago: new Date("2025-07-17"),
    },
    {
      numero: 8,
      año: 2025,
      fechaInicio: new Date("2025-07-14"),
      fechaFin: new Date("2025-08-10"),
      fechaPago: new Date("2025-08-14"),
    },
    {
      numero: 9,
      año: 2025,
      fechaInicio: new Date("2025-08-11"),
      fechaFin: new Date("2025-09-07"),
      fechaPago: new Date("2025-09-11"),
    },
    {
      numero: 10,
      año: 2025,
      fechaInicio: new Date("2025-09-08"),
      fechaFin: new Date("2025-10-05"),
      fechaPago: new Date("2025-10-09"),
    },
    {
      numero: 11,
      año: 2025,
      fechaInicio: new Date("2025-10-06"),
      fechaFin: new Date("2025-11-02"),
      fechaPago: new Date("2025-11-06"),
    },
    {
      numero: 12,
      año: 2025,
      fechaInicio: new Date("2025-11-03"),
      fechaFin: new Date("2025-11-30"),
      fechaPago: new Date("2025-12-04"),
    },
    {
      numero: 13,
      año: 2025,
      fechaInicio: new Date("2025-12-01"),
      fechaFin: new Date("2025-12-28"),
      fechaPago: new Date("2026-01-02"),
    },
  ]

  for (let i = 0; i < periodos.length; i++) {
    await prisma.periodo.upsert({
      where: {
        id: i + 1,
      },
      update: {},
      create: periodos[i],
    })
  }

  // Crear disciplinas
  console.log("Creando disciplinas...")
  const disciplinas = [
    {
      nombre: "Síclo",
      descripcion: "Clases de ciclismo indoor",
      color: "#FF5733",
      activo: true,
    },
    {
      nombre: "Barre",
      descripcion: "Entrenamiento que combina ballet, yoga y pilates",
      color: "#33FF57",
      activo: true,
    },
    {
      nombre: "Yoga",
      descripcion: "Práctica que conecta el cuerpo, la respiración y la mente",
      color: "#3357FF",
      activo: true,
    },
    {
      nombre: "Ejercito",
      descripcion: "Entrenamiento de alta intensidad tipo militar",
      color: "#8033FF",
      activo: true,
    },
  ]

  const disciplinasCreadas = []
  for (const disciplina of disciplinas) {
    const disciplinaCreada = await prisma.disciplina.upsert({
      where: { nombre: disciplina.nombre },
      update: {},
      create: disciplina,
    })
    disciplinasCreadas.push(disciplinaCreada)
  }

  // Crear fórmulas para cada disciplina y periodo
  console.log("Creando fórmulas...")

  // Fórmula para Síclo
 

  // Fórmula para Barre
 

 
  const formulas = [
    { disciplinaId: 1 },
    { disciplinaId: 2 },
    { disciplinaId: 3 },
    { disciplinaId: 4  },
  ]
 
  // Crear fórmulas para el periodo actual (periodo 4)
  for (const { disciplinaId } of formulas) {
    await prisma.formula.create({
      data: {
        disciplinaId,
        periodoId: 4, // Periodo actual
        // Agregar los requisitos de categoría y parámetros de pago con la estructura actualizada
        requisitosCategoria: requisitosCategoriaEjemplo,
        parametrosPago: parametrosPagoEjemplo,
      },
    })
  }

  console.log("Seed completado!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })