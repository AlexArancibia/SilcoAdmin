import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET a specific instructor by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    const instructor = await prisma.instructor.findUnique({
      where: { id },
      include: {
        disciplinas: true,
        clases: true,
        pagos: true,
        categorias: {
          include: {
            disciplina: true,
            periodo: true,
          },
        },
      },
    })

    if (!instructor) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 })
    }

    return NextResponse.json(instructor)
  } catch (error) {
    return NextResponse.json({ error: "Error fetching instructor" }, { status: 500 })
  }
}

// PUT update an instructor
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await request.json()

    const {
      nombre,
      nombreCompleto,
      activo,
      password,
      extrainfo,
      disciplinaIds,
      ultimoBono,
      cumpleLineamientos,
      dobleteos,
      horariosNoPrime,
      participacionEventos,
      categorias,
      // New fields
      personaContacto,
      cuentaBancaria,
      CCI,
      banco,
      celular,
      DNI, // Added DNI field
    } = body

    // First check if the instructor exists
    const existingInstructor = await prisma.instructor.findUnique({
      where: { id },
      include: {
        categorias: true,
      },
    })

    if (!existingInstructor) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 })
    }

    // If name is being updated, capitalize it and check for "vs"
    let updatedName = existingInstructor.nombre
    if (nombre && nombre !== existingInstructor.nombre) {
      // Capitalize each word in the instructor name
      updatedName = nombre
        .split(" ")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

      // Check if the name contains "vs" - if so, don't update the instructor
      if (updatedName.toLowerCase().includes(" vs ")) {
        return NextResponse.json({ error: "Cannot update to a name with 'vs' in it" }, { status: 400 })
      }
    }

    // Prepare the update data
    const updateData: any = {
      nombre: updatedName,
    }

    // Only include fields that are provided in the request
    if (password !== undefined) updateData.password = password
    if (extrainfo !== undefined) updateData.extrainfo = extrainfo
    if (ultimoBono !== undefined) updateData.ultimoBono = ultimoBono
    if (cumpleLineamientos !== undefined) updateData.cumpleLineamientos = cumpleLineamientos
    if (dobleteos !== undefined) updateData.dobleteos = dobleteos
    if (horariosNoPrime !== undefined) updateData.horariosNoPrime = horariosNoPrime
    if (participacionEventos !== undefined) updateData.participacionEventos = participacionEventos

    // New fields
    if (nombreCompleto !== undefined) updateData.nombreCompleto = nombreCompleto
    if (activo !== undefined) updateData.activo = Boolean(activo)
    if (personaContacto !== undefined) updateData.personaContacto = personaContacto
    if (cuentaBancaria !== undefined) updateData.cuentaBancaria = cuentaBancaria
    if (CCI !== undefined) updateData.CCI = CCI
    if (banco !== undefined) updateData.banco = banco
    if (celular !== undefined) updateData.celular = celular
    if (DNI !== undefined) updateData.DNI = Number(DNI) // Added DNI field, ensuring it's a number

    // Handle disciplines if provided
    if (Array.isArray(disciplinaIds)) {
      updateData.disciplinas = {
        set: disciplinaIds.map((id: number) => ({ id })),
      }
    }

    // Handle categories if provided
    if (Array.isArray(categorias)) {
      // Delete existing categories first
      await prisma.categoriaInstructor.deleteMany({
        where: { instructorId: id },
      })

      // Create new categories
      if (categorias.length > 0) {
        updateData.categorias = {
          create: categorias.map((categoria: any) => ({
            disciplinaId: categoria.disciplinaId,
            periodoId: categoria.periodoId,
            categoria: categoria.categoria,
            metricas: categoria.metricas || undefined,
          })),
        }
      }
    }

    // Update the instructor
    const updatedInstructor = await prisma.instructor.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updatedInstructor)
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "An instructor with this name already exists" }, { status: 400 })
    }

    return NextResponse.json(
      { error: `Error updating instructor: ${error.message || "Unknown error"}` },
      { status: 500 },
    )
  }
}

// DELETE an instructor
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    // First check if the instructor exists
    const existingInstructor = await prisma.instructor.findUnique({
      where: { id },
    })

    if (!existingInstructor) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 })
    }

    // Delete related records first to avoid foreign key constraints
    // Delete categories
    await prisma.categoriaInstructor.deleteMany({
      where: { instructorId: id },
    })

    // Delete the instructor
    await prisma.instructor.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Instructor deleted successfully" }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: `Error deleting instructor: ${error.message || "Unknown error"}` },
      { status: 500 },
    )
  }
}