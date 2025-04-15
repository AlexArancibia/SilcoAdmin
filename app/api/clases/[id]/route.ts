import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const clase = await prisma.clase.findUnique({
      where: { id },
      include: {
        instructor: true,
        disciplina: true,
        periodo: true,
      },
    })

    if (!clase) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 })
    }

    return NextResponse.json(clase)
  } catch (error) {
    console.error("Error fetching class:", error)
    return NextResponse.json({ error: "Error al obtener la clase" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = (params.id)
    const body = await request.json()

    // Parse numeric fields
    const numericFields = [
      "disciplinaId",
      "semana",
      "instructorId",
      "periodoId",
      "reservasTotales",
      "listasEspera",
      "cortesias",
      "lugares",
      "reservasPagadas",
    ]

    numericFields.forEach((field) => {
      if (body[field] !== undefined) {
        body[field] = (body[field])
      }
    })

    // Handle date field
    if (body.fecha) {
      // Check if fecha is a string in format YYYY-MM-DD
      if (typeof body.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.fecha)) {
        body.fecha = new Date(body.fecha)
      }
      // Check if fecha is a string in format DD/MM/YYYY
      else if (typeof body.fecha === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(body.fecha)) {
        const [day, month, year] = body.fecha.split("/").map(Number)
        body.fecha = new Date(year, month - 1, day)
      }
      // If it's already a Date object or ISO string, just use it
      else if (typeof body.fecha === "string") {
        body.fecha = new Date(body.fecha)
      }
    }

    const updatedClase = await prisma.clase.update({
      where: { id },
      data: {
        pais: body.pais,
        ciudad: body.ciudad,
        disciplinaId: body.disciplinaId,
        semana: body.semana,
        estudio: body.estudio,
        instructorId: body.instructorId,
        periodoId: body.periodoId,
        salon: body.salon,
        reservasTotales: body.reservasTotales,
        listasEspera: body.listasEspera,
        cortesias: body.cortesias,
        lugares: body.lugares,
        reservasPagadas: body.reservasPagadas,
        textoEspecial: body.textoEspecial,
        fecha: body.fecha,
      },
      include: {
        instructor: true,
        disciplina: true,
        periodo: true,
      },
    })

    return NextResponse.json(updatedClase)
  } catch (error) {
    console.error("Error updating class:", error)
    return NextResponse.json({ error: "Error al actualizar la clase" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = (params.id)

    await prisma.clase.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting class:", error)
    return NextResponse.json({ error: "Error al eliminar la clase" }, { status: 500 })
  }
}

