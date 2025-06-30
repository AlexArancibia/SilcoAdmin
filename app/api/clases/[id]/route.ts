import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const clase = await prisma.clase.findUnique({
      where: { id },
      include: {
        instructor: true,
        instructorReemplazo: true, // Añadido para incluir el instructor de reemplazo
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
    const id = params.id
    const body = await request.json()

    // Parse numeric fields (EXCLUYENDO instructorReemplazoId para manejo especial)
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
      "vsNum",
      "puntosPenalizacion"     // Corregido el typo: era "puntosPenalizacon"
    ]

    numericFields.forEach((field) => {
      if (body[field] !== undefined) {
        body[field] = Number(body[field])
      }
    })

    // Manejo especial para instructorReemplazoId - permitir null explícitamente
    if (body.hasOwnProperty('instructorReemplazoId')) {
      if (body.instructorReemplazoId === null || body.instructorReemplazoId === undefined || body.instructorReemplazoId === '') {
        body.instructorReemplazoId = null
      } else {
        body.instructorReemplazoId = Number(body.instructorReemplazoId)
      }
    }

    // Handle boolean fields
    if (body.esVersus !== undefined) {
      body.esVersus = Boolean(body.esVersus)
    }

    // Handle date field
    if (body.fecha) {
      if (typeof body.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.fecha)) {
        body.fecha = new Date(body.fecha)
      }
      else if (typeof body.fecha === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(body.fecha)) {
        const [day, month, year] = body.fecha.split("/").map(Number)
        body.fecha = new Date(year, month - 1, day)
      }
      else if (typeof body.fecha === "string") {
        body.fecha = new Date(body.fecha)
      }
    }

    // Preparar los datos para la actualización
    const updateData: any = {
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
      esVersus: body.esVersus,
      vsNum: body.vsNum,
      tipoPenalizacion: body.tipoPenalizacion,
      puntosPenalizacion: body.puntosPenalizacion
    }

    // Solo incluir instructorReemplazoId si está presente en el body
    if (body.hasOwnProperty('instructorReemplazoId')) {
      updateData.instructorReemplazoId = body.instructorReemplazoId
    }

    console.log('Updating class with data:', { 
      id, 
      instructorReemplazoId: body.instructorReemplazoId,
      hasProperty: body.hasOwnProperty('instructorReemplazoId')
    })

    const updatedClase = await prisma.clase.update({
      where: { id },
      data: updateData,
      include: {
        instructor: true,
        instructorReemplazo: true, // Añadido para incluir el instructor de reemplazo
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
    const id = params.id

    await prisma.clase.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting class:", error)
    return NextResponse.json({ error: "Error al eliminar la clase" }, { status: 500 })
  }
}