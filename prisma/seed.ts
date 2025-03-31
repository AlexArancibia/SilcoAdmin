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
  const formulaSiclo = {
    id: "formula-1742807352621",
    nodos: [
      {
        id: "numberNode-1742807354688",
        tipo: "numero",
        datos: { valor: 50 },
        posicion: { x: 279.5, y: 314 },
      },
      {
        id: "resultNode-1742807358541",
        tipo: "resultado",
        datos: { etiqueta: "Resultado" },
        posicion: { x: 516, y: 308 },
      },
    ],
    nombre: "Fórmula Síclo",
    conexiones: [
      {
        id: "reactflow__edge-numberNode-1742807354688output-resultNode-1742807358541input",
        origen: "numberNode-1742807354688",
        destino: "resultNode-1742807358541",
        puntoSalida: "output",
        puntoEntrada: "input",
      },
    ],
    descripcion: "Fórmula básica para Síclo",
    fechaCreacion: new Date(),
    nodoResultado: "resultNode-1742807358541",
    fechaActualizacion: new Date(),
  }

  // Fórmula para Barre
  const formulaBarre = {
    id: "formula-1742768104612",
    nodos: [
      {
        id: "variableNode-1742768119449",
        tipo: "variable",
        datos: { etiqueta: "Reservaciones", variable: "reservaciones" },
        posicion: { x: 52.40139271789303, y: 147.1972145642139 },
      },
      {
        id: "operationNode-1742768122739",
        tipo: "operacion",
        datos: { etiqueta: "Suma", operacion: "suma" },
        posicion: { x: 370.5777636729533, y: 71.44678404886062 },
      },
      {
        id: "resultNode-1742768184651",
        tipo: "resultado",
        datos: { etiqueta: "Resultado" },
        posicion: { x: 672.9764109486262, y: 86.74220777947437 },
      },
      {
        id: "numberNode-1742768244043",
        tipo: "numero",
        datos: { valor: 4 },
        posicion: { x: 47.35639078366296, y: 27.76497237280671 },
      },
    ],
    nombre: "Fórmula Barre",
    conexiones: [
      {
        id: "reactflow__edge-variableNode-1742768119449output-operationNode-1742768122739input-2",
        origen: "variableNode-1742768119449",
        destino: "operationNode-1742768122739",
        puntoSalida: "output",
        puntoEntrada: "input-2",
      },
      {
        id: "reactflow__edge-operationNode-1742768122739output-resultNode-1742768184651input",
        origen: "operationNode-1742768122739",
        destino: "resultNode-1742768184651",
        puntoSalida: "output",
        puntoEntrada: "input",
      },
      {
        id: "reactflow__edge-numberNode-1742768244043output-operationNode-1742768122739input-1",
        origen: "numberNode-1742768244043",
        destino: "operationNode-1742768122739",
        puntoSalida: "output",
        puntoEntrada: "input-1",
      },
    ],
    descripcion: "Fórmula para Barre",
    fechaCreacion: new Date(),
    nodoResultado: "resultNode-1742768184651",
    fechaActualizacion: new Date(),
  }

  // Fórmula para Yoga
  const formulaYoga = {
    id: "formula-1742852213107",
    nodos: [
      {
        id: "variableNode-1742852215704",
        tipo: "variable",
        datos: { etiqueta: "Reservaciones", variable: "reservaciones" },
        posicion: { x: 44, y: 152.5 },
      },
      {
        id: "variableNode-1742852217823",
        tipo: "variable",
        datos: { etiqueta: "Lugares", variable: "lugares" },
        posicion: { x: 43.69845510796972, y: 276.6273591336952 },
      },
      {
        id: "operationNode-1742852223158",
        tipo: "operacion",
        datos: { operacion: "division" },
        posicion: { x: 428.690463001611, y: 176.5900657440089 },
      },
      {
        id: "operationNode-1742852233690",
        tipo: "operacion",
        datos: { operacion: "multiplicacion" },
        posicion: { x: 845.5125187919703, y: 196.2943811086441 },
      },
      {
        id: "numberNode-1742852249486",
        tipo: "numero",
        datos: { valor: 600 },
        posicion: { x: 489.3191256620266, y: 402.4318341540582 },
      },
      {
        id: "resultNode-1742852269261",
        tipo: "resultado",
        datos: { etiqueta: "Resultado" },
        posicion: { x: 1150.171548660561, y: 222.0615627393209 },
      },
    ],
    nombre: "Fórmula Yoga",
    conexiones: [
      {
        id: "reactflow__edge-variableNode-1742852215704output-operationNode-1742852223158input-1",
        origen: "variableNode-1742852215704",
        destino: "operationNode-1742852223158",
        puntoSalida: "output",
        puntoEntrada: "input-1",
      },
      {
        id: "reactflow__edge-variableNode-1742852217823output-operationNode-1742852223158input-2",
        origen: "variableNode-1742852217823",
        destino: "operationNode-1742852223158",
        puntoSalida: "output",
        puntoEntrada: "input-2",
      },
      {
        id: "reactflow__edge-numberNode-1742852249486output-operationNode-1742852233690input-2",
        origen: "numberNode-1742852249486",
        destino: "operationNode-1742852233690",
        puntoSalida: "output",
        puntoEntrada: "input-2",
      },
      {
        id: "reactflow__edge-operationNode-1742852223158output-operationNode-1742852233690input-1",
        origen: "operationNode-1742852223158",
        destino: "operationNode-1742852233690",
        puntoSalida: "output",
        puntoEntrada: "input-1",
      },
      {
        id: "reactflow__edge-operationNode-1742852233690output-resultNode-1742852269261input",
        origen: "operationNode-1742852233690",
        destino: "resultNode-1742852269261",
        puntoSalida: "output",
        puntoEntrada: "input",
      },
    ],
    descripcion: "Fórmula para Yoga",
    fechaCreacion: new Date(),
    nodoResultado: "resultNode-1742852269261",
    fechaActualizacion: new Date(),
  }

  // Fórmula para Ejercito
  const formulaEjercito = {
    id: "formula-1742804115444",
    nodos: [
      {
        id: "variableNode-1742804123745",
        tipo: "variable",
        datos: { etiqueta: "Reservaciones", variable: "reservaciones" },
        posicion: { x: 341, y: 266 },
      },
      {
        id: "operationNode-1742804126926",
        tipo: "operacion",
        datos: { operacion: "division" },
        posicion: { x: 829.2340110889384, y: 284.2156197400355 },
      },
      {
        id: "variableNode-1742804133545",
        tipo: "variable",
        datos: { etiqueta: "Lugares", variable: "lugares" },
        posicion: { x: 335.2937184402134, y: 462.2638647645761 },
      },
      {
        id: "resultNode-1742804143621",
        tipo: "resultado",
        datos: { etiqueta: "Resultado" },
        posicion: { x: 1201.683296624787, y: 300.0672902464508 },
      },
    ],
    nombre: "Fórmula Ejercito",
    conexiones: [
      {
        id: "reactflow__edge-variableNode-1742804123745output-operationNode-1742804126926input-1",
        origen: "variableNode-1742804123745",
        destino: "operationNode-1742804126926",
        puntoSalida: "output",
        puntoEntrada: "input-1",
      },
      {
        id: "reactflow__edge-variableNode-1742804133545output-operationNode-1742804126926input-2",
        origen: "variableNode-1742804133545",
        destino: "operationNode-1742804126926",
        puntoSalida: "output",
        puntoEntrada: "input-2",
      },
      {
        id: "reactflow__edge-operationNode-1742804126926output-resultNode-1742804143621input",
        origen: "operationNode-1742804126926",
        destino: "resultNode-1742804143621",
        puntoSalida: "output",
        puntoEntrada: "input",
      },
    ],
    descripcion: "Fórmula para Ejercito",
    fechaCreacion: new Date(),
    nodoResultado: "resultNode-1742804143621",
    fechaActualizacion: new Date(),
  }

  // Crear fórmulas para cada disciplina y periodo
  const formulas = [
    { disciplinaId: 1, formula: formulaSiclo },
    { disciplinaId: 2, formula: formulaBarre },
    { disciplinaId: 3, formula: formulaYoga },
    { disciplinaId: 4, formula: formulaEjercito },
  ]

  // Crear fórmulas para el periodo actual (periodo 4)
  for (const { disciplinaId, formula } of formulas) {
    await prisma.formula.create({
      data: {
        disciplinaId,
        periodoId: 4, // Periodo actual
        parametros: {
          formula,
        },
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

