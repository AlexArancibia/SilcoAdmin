import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const instructorId = searchParams.get("instructorId")
  const disciplinaId = searchParams.get("disciplinaId")
  const periodoId = searchParams.get("periodoId")

  try {
    const where: any = {}

    if (instructorId) where.instructorId = Number.parseInt(instructorId)
    if (disciplinaId) where.disciplinaId = Number.parseInt(disciplinaId)
    if (periodoId) where.periodoId = Number.parseInt(periodoId)

    const categorias = await prisma.categoriaInstructor.findMany({
      where,
      include: {
        instructor: true,
        disciplina: true,
        periodo: true,
      },
    })

    return NextResponse.json(categorias)
  } catch (error) {
    console.error("Error al obtener categorías:", error)
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { instructorId, disciplinaId, periodoId, categoria, metricas } = body

    // Verificar si ya existe una categoría para este instructor, disciplina y periodo
    const existingCategoria = await prisma.categoriaInstructor.findUnique({
      where: {
        instructorId_disciplinaId_periodoId: {
          instructorId,
          disciplinaId,
          periodoId,
        },
      },
    })

    if (existingCategoria) {
      // Actualizar la categoría existente
      const updatedCategoria = await prisma.categoriaInstructor.update({
        where: {
          id: existingCategoria.id,
        },
        data: {
          categoria,
          metricas,
        },
      })

      return NextResponse.json(updatedCategoria)
    } else {
      // Crear una nueva categoría
      const newCategoria = await prisma.categoriaInstructor.create({
        data: {
          instructorId,
          disciplinaId,
          periodoId,
          categoria,
          metricas,
        },
      })

      return NextResponse.json(newCategoria)
    }
  } catch (error) {
    console.error("Error al crear/actualizar categoría:", error)
    return NextResponse.json({ error: "Error al crear/actualizar categoría" }, { status: 500 })
  }
}
