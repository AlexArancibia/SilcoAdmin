import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const id = Number.parseInt(params.id, 10)
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID debe ser un número válido" }, { status: 400 })
    }

    const penalizacion = await prisma.penalizacion.findUnique({
      where: { id },
      include: {
        instructor: true,
        disciplina: true,
        periodo: true,
      },
    })

    if (!penalizacion) {
      return NextResponse.json({ error: "Penalización no encontrada" }, { status: 404 })
    }

    return NextResponse.json(penalizacion)
  } catch (error) {
    console.error("Error en GET /api/penalizaciones/[id]:", error)
    return NextResponse.json(
      { error: "Error al consultar la penalización", message: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const id = Number.parseInt(params.id, 10)
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID debe ser un número válido" }, { status: 400 })
    }

    const body = await request.json().catch(() => {
      throw new Error("El cuerpo de la solicitud no es un JSON válido")
    })

    if (!body) {
      return NextResponse.json({ error: "El cuerpo de la solicitud está vacío" }, { status: 400 })
    }

    // Check if penalizacion exists
    const existingPenalizacion = await prisma.penalizacion.findUnique({
      where: { id }
    })

    if (!existingPenalizacion) {
      return NextResponse.json({ error: "Penalización no encontrada" }, { status: 404 })
    }

    // Validate tipo field if provided
    if (body.tipo) {
      const tiposValidos = [
        "CANCELACION_FIJA",
        "CANCELACION_FUERA_TIEMPO", 
        "CANCELAR_MENOS_24HRS",
        "COVER_DEL_COVER",
        "SALIR_TARDE",
        "PERSONALIZADA"
      ]
      
      if (!tiposValidos.includes(body.tipo)) {
        return NextResponse.json({ error: "Tipo de penalización no válido" }, { status: 400 })
      }
    }

    // Parse numeric fields with validation
    const numericFields = ["instructorId", "periodoId", "disciplinaId", "puntos"]
    const parsedBody: Record<string, any> = { ...body }

    for (const field of numericFields) {
      if (parsedBody[field] !== undefined) {
        const parsedValue = Number.parseInt(String(parsedBody[field]), 10)
        if (isNaN(parsedValue)) {
          return NextResponse.json({ error: `El campo ${field} debe ser un número válido` }, { status: 400 })
        }
        parsedBody[field] = parsedValue
      }
    }

    // Handle boolean fields
    if (parsedBody.activa !== undefined) {
      parsedBody.activa = Boolean(parsedBody.activa)
    }

    // Handle date field for aplicadaEn
    if (parsedBody.aplicadaEn) {
      const parsedDate = new Date(parsedBody.aplicadaEn)
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: "El formato de fecha para aplicadaEn no es válido" }, { status: 400 })
      }
      parsedBody.aplicadaEn = parsedDate
    }

    // Verify related entities exist if they're being updated
    if (parsedBody.instructorId && parsedBody.instructorId !== existingPenalizacion.instructorId) {
      const instructorExists = await prisma.instructor.findUnique({
        where: { id: parsedBody.instructorId }
      })

      if (!instructorExists) {
        return NextResponse.json({ error: "El instructor especificado no existe" }, { status: 404 })
      }
    }

    if (parsedBody.periodoId && parsedBody.periodoId !== existingPenalizacion.periodoId) {
      const periodoExists = await prisma.periodo.findUnique({
        where: { id: parsedBody.periodoId }
      })

      if (!periodoExists) {
        return NextResponse.json({ error: "El periodo especificado no existe" }, { status: 404 })
      }
    }

    if (parsedBody.disciplinaId && parsedBody.disciplinaId !== existingPenalizacion.disciplinaId) {
      const disciplinaExists = await prisma.disciplina.findUnique({
        where: { id: parsedBody.disciplinaId }
      })

      if (!disciplinaExists) {
        return NextResponse.json({ error: "La disciplina especificada no existe" }, { status: 404 })
      }
    }

    // Update the penalizacion
    const updatedPenalizacion = await prisma.penalizacion.update({
      where: { id },
      data: {
        ...(parsedBody.instructorId && { instructorId: parsedBody.instructorId }),
        ...(parsedBody.disciplinaId !== undefined && { disciplinaId: parsedBody.disciplinaId }),
        ...(parsedBody.periodoId && { periodoId: parsedBody.periodoId }),
        ...(parsedBody.tipo && { tipo: parsedBody.tipo }),
        ...(parsedBody.puntos !== undefined && { puntos: parsedBody.puntos }),
        ...(parsedBody.descripcion !== undefined && { descripcion: parsedBody.descripcion }),
        ...(parsedBody.activa !== undefined && { activa: parsedBody.activa }),
        ...(parsedBody.aplicadaEn && { aplicadaEn: parsedBody.aplicadaEn }),
        ...(parsedBody.comentarios !== undefined && { comentarios: parsedBody.comentarios }),
      },
      include: {
        instructor: true,
        disciplina: true,
        periodo: true,
      },
    })

    return NextResponse.json(updatedPenalizacion)
  } catch (error) {
    console.error("Error en PUT /api/penalizaciones/[id]:", error)
    return NextResponse.json(
      {
        error: "Error al actualizar la penalización",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const id = Number.parseInt(params.id, 10)
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID debe ser un número válido" }, { status: 400 })
    }

    // Check if penalizacion exists
    const existingPenalizacion = await prisma.penalizacion.findUnique({
      where: { id }
    })

    if (!existingPenalizacion) {
      return NextResponse.json({ error: "Penalización no encontrada" }, { status: 404 })
    }

    // Delete the penalizacion
    await prisma.penalizacion.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en DELETE /api/penalizaciones/[id]:", error)
    return NextResponse.json(
      {
        error: "Error al eliminar la penalización",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}