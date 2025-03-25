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

    const { nombre, password, extrainfo, disciplinaIds } = body

    // First check if the instructor exists
    const existingInstructor = await prisma.instructor.findUnique({
      where: { id },
    })

    if (!existingInstructor) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 })
    }

    // Update the instructor
    const updatedInstructor = await prisma.instructor.update({
      where: { id },
      data: {
        nombre,
        password,
        extrainfo,
        disciplinas: disciplinaIds
          ? {
              set: disciplinaIds.map((id: number) => ({ id })),
            }
          : undefined,
      },
      include: {
        disciplinas: true,
      },
    })

    return NextResponse.json(updatedInstructor)
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "An instructor with this name already exists" }, { status: 400 })
    }

    return NextResponse.json({ error: "Error updating instructor" }, { status: 500 })
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

    // Delete the instructor
    await prisma.instructor.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Instructor deleted successfully" }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Error deleting instructor" }, { status: 500 })
  }
}

