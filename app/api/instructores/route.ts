import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient, Prisma } from "@prisma/client"

const prisma = new PrismaClient()

// GET all instructors
export async function GET() {
  try {
    const instructors = await prisma.instructor.findMany({
      include: {
        disciplinas: true,
        categorias: {
          include: {
            disciplina: true,
            periodo: true,
          },
        },
      },
    })
    return NextResponse.json(instructors)
  } catch (error: unknown) {
    return NextResponse.json({ error: "Error fetching instructors" }, { status: 500 })
  }
}

// POST create a new instructor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      nombre,
      nombreCompleto,
      activo,
      password,
      extrainfo,
      ultimoBono,
      disciplinaIds,
      categorias,
      // New fields
      personaContacto,
      cuentaBancaria,
      CCI,
      banco,
      celular,
      DNI, // Added DNI field
    } = body

    if (!nombre) {
      return NextResponse.json({ error: "Instructor name is required" }, { status: 400 })
    }

    // Capitalize each word in the instructor name
    const capitalizedName = nombre
      .split(" ")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    // Check if the name contains "vs" or "vs." using a regular expression
    // This will match " vs " or " vs." regardless of case
    const vsRegex = /\bvs\.?\b/i
    if (vsRegex.test(capitalizedName)) {
      return NextResponse.json(
        {
          error: "Cannot create an instructor with 'vs' or 'vs.' in the name",
        },
        { status: 400 },
      )
    }

    const existingInstructor = await prisma.instructor.findUnique({
      where: { nombre: capitalizedName },
    })

    if (existingInstructor) {
      return NextResponse.json({ error: "An instructor with this name already exists" }, { status: 400 })
    }

    const createData: any = {
      nombre: capitalizedName, // Use capitalized name
    }

    // Only include fields that are provided in the request
    if (password !== undefined) createData.password = password
    if (extrainfo !== undefined) createData.extrainfo = extrainfo
    if (ultimoBono !== undefined) createData.ultimoBono = ultimoBono

    // New fields
    if (nombreCompleto !== undefined) createData.nombreCompleto = nombreCompleto
    if (activo !== undefined) createData.activo = Boolean(activo)
    if (personaContacto !== undefined) createData.personaContacto = personaContacto
    if (cuentaBancaria !== undefined) createData.cuentaBancaria = cuentaBancaria
    if (CCI !== undefined) createData.CCI = CCI
    if (banco !== undefined) createData.banco = banco
    if (celular !== undefined) createData.celular = celular
    if (DNI !== undefined) createData.DNI = Number(DNI) // Added DNI field, ensuring it's a number

    // Connect disciplines if provided
    if (Array.isArray(disciplinaIds) && disciplinaIds.length > 0) {
      createData.disciplinas = {
        connect: disciplinaIds.map((id: number) => ({ id })),
      }
    }

    // Create categories if provided
    if (Array.isArray(categorias) && categorias.length > 0) {
      createData.categorias = {
        create: categorias.map((categoria: any) => ({
          disciplinaId: categoria.disciplinaId,
          periodoId: categoria.periodoId,
          categoria: categoria.categoria,
          metricas: categoria.metricas || undefined,
        })),
      }
    }

    const instructor = await prisma.instructor.create({
      data: createData,
      include: {
        disciplinas: true,
        categorias: {
          include: {
            disciplina: true,
            periodo: true,
          },
        },
      },
    })

    return NextResponse.json(instructor, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "An instructor with this name already exists" }, { status: 400 })
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: `Error creating instructor: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ error: "Unknown error creating instructor" }, { status: 500 })
  }
}