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

    const cover = await prisma.cover.findUnique({
      where: { id },
      include: {
        instructorOriginal: {
          select: {
            id: true,
            nombre: true,
            nombreCompleto: true,
          }
        },
        instructorReemplazo: {
          select: {
            id: true,
            nombre: true,
            nombreCompleto: true,
          }
        },
        disciplina: {
          select: {
            id: true,
            nombre: true,
            color: true,
          }
        },
        periodo: {
          select: {
            id: true,
            numero: true,
            año: true,
          }
        },
        clase: {
          select: {
            id: true,
            estudio: true,
            salon: true,
            fecha: true,
            instructor: {
              select: {
                id: true,
                nombre: true,
              }
            }
          }
        },
      },
    })

    if (!cover) {
      return NextResponse.json({ error: "Cover no encontrado" }, { status: 404 })
    }

    return NextResponse.json(cover)
  } catch (error) {
    console.error("Error en GET /api/covers/[id]:", error)
    return NextResponse.json(
      { error: "Error al consultar el cover", message: error instanceof Error ? error.message : "Error desconocido" },
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

    // Check if cover exists
    const existingCover = await prisma.cover.findUnique({
      where: { id }
    })

    if (!existingCover) {
      return NextResponse.json({ error: "Cover no encontrado" }, { status: 404 })
    }

    // Parse numeric fields with validation
    const numericFields = ["instructorOriginalId", "instructorReemplazoId", "disciplinaId", "periodoId"]
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
    const booleanFields = ["pagoBono", "pagoFullHouse"]
    for (const field of booleanFields) {
      if (parsedBody[field] !== undefined) {
        parsedBody[field] = Boolean(parsedBody[field])
      }
    }

    // Validate justificacion if provided
    if (parsedBody.justificacion && !["PENDIENTE", "APROBADO", "RECHAZADO"].includes(parsedBody.justificacion)) {
      return NextResponse.json({ error: "La justificacion debe ser PENDIENTE, APROBADO o RECHAZADO" }, { status: 400 })
    }

    // Validate fecha if provided - manejar correctamente las fechas para evitar problemas de zona horaria
    if (parsedBody.fecha) {
      let fecha: Date
      if (typeof parsedBody.fecha === 'string') {
        // Si es una fecha en formato YYYY-MM-DD, crear la fecha en zona horaria local
        if (/^\d{4}-\d{2}-\d{2}$/.test(parsedBody.fecha)) {
          const [year, month, day] = parsedBody.fecha.split('-').map(Number)
          fecha = new Date(year, month - 1, day) // month - 1 porque Date usa 0-indexado
        } else {
          fecha = new Date(parsedBody.fecha)
        }
      } else {
        fecha = new Date(parsedBody.fecha)
      }
      
      if (isNaN(fecha.getTime())) {
        return NextResponse.json({ error: "La fecha debe ser válida" }, { status: 400 })
      }
      parsedBody.fecha = fecha
    }

    // Validate hora format if provided
    if (parsedBody.hora) {
      const horaPattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!horaPattern.test(parsedBody.hora)) {
        return NextResponse.json({ error: "La hora debe tener el formato HH:mm" }, { status: 400 })
      }
    }

    // Validate foreign keys if they are being updated
    if (parsedBody.instructorOriginalId && parsedBody.instructorOriginalId !== existingCover.instructorOriginalId) {
      const instructorOriginal = await prisma.instructor.findUnique({
        where: { id: parsedBody.instructorOriginalId }
      })
      if (!instructorOriginal) {
        return NextResponse.json({ error: "El instructor original especificado no existe" }, { status: 404 })
      }
    }

    if (parsedBody.instructorReemplazoId && parsedBody.instructorReemplazoId !== existingCover.instructorReemplazoId) {
      const instructorReemplazo = await prisma.instructor.findUnique({
        where: { id: parsedBody.instructorReemplazoId }
      })
      if (!instructorReemplazo) {
        return NextResponse.json({ error: "El instructor de reemplazo especificado no existe" }, { status: 404 })
      }
    }

    if (parsedBody.disciplinaId && parsedBody.disciplinaId !== existingCover.disciplinaId) {
      const disciplina = await prisma.disciplina.findUnique({
        where: { id: parsedBody.disciplinaId }
      })
      if (!disciplina) {
        return NextResponse.json({ error: "La disciplina especificada no existe" }, { status: 404 })
      }
    }

    if (parsedBody.periodoId && parsedBody.periodoId !== existingCover.periodoId) {
      const periodo = await prisma.periodo.findUnique({
        where: { id: parsedBody.periodoId }
      })
      if (!periodo) {
        return NextResponse.json({ error: "El periodo especificado no existe" }, { status: 404 })
      }
    }

    // If claseId is being updated, verify it exists
    if (parsedBody.claseId && parsedBody.claseId !== existingCover.claseId) {
      const claseExists = await prisma.clase.findUnique({
        where: { id: parsedBody.claseId }
      })
      if (!claseExists) {
        return NextResponse.json({ error: "La clase especificada no existe" }, { status: 404 })
      }
    }

    // Update the cover - only include fields that are provided
    const updateData: any = {}

    if (parsedBody.instructorOriginalId !== undefined) updateData.instructorOriginalId = parsedBody.instructorOriginalId
    if (parsedBody.instructorReemplazoId !== undefined) updateData.instructorReemplazoId = parsedBody.instructorReemplazoId
    if (parsedBody.disciplinaId !== undefined) updateData.disciplinaId = parsedBody.disciplinaId
    if (parsedBody.periodoId !== undefined) updateData.periodoId = parsedBody.periodoId
    if (parsedBody.fecha !== undefined) updateData.fecha = parsedBody.fecha
    if (parsedBody.hora !== undefined) updateData.hora = parsedBody.hora
    if (parsedBody.claseId !== undefined) updateData.claseId = parsedBody.claseId
    if (parsedBody.justificacion !== undefined) updateData.justificacion = parsedBody.justificacion
    if (parsedBody.pagoBono !== undefined) updateData.pagoBono = parsedBody.pagoBono
    if (parsedBody.pagoFullHouse !== undefined) updateData.pagoFullHouse = parsedBody.pagoFullHouse
    if (parsedBody.comentarios !== undefined) updateData.comentarios = parsedBody.comentarios
    if (parsedBody.cambioDeNombre !== undefined) updateData.cambioDeNombre = parsedBody.cambioDeNombre

    const updatedCover = await prisma.cover.update({
      where: { id },
      data: updateData,
      include: {
        instructorOriginal: {
          select: {
            id: true,
            nombre: true,
            nombreCompleto: true,
          }
        },
        instructorReemplazo: {
          select: {
            id: true,
            nombre: true,
            nombreCompleto: true,
          }
        },
        disciplina: {
          select: {
            id: true,
            nombre: true,
            color: true,
          }
        },
        periodo: {
          select: {
            id: true,
            numero: true,
            año: true,
          }
        },
        clase: {
          select: {
            id: true,
            estudio: true,
            salon: true,
            fecha: true,
            instructor: {
              select: {
                id: true,
                nombre: true,
              }
            }
          }
        },
      },
    })

    return NextResponse.json(updatedCover)
  } catch (error) {
    console.error("Error en PUT /api/covers/[id]:", error)
    return NextResponse.json(
      {
        error: "Error al actualizar el cover",
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

    // Check if cover exists
    const existingCover = await prisma.cover.findUnique({
      where: { id }
    })

    if (!existingCover) {
      return NextResponse.json({ error: "Cover no encontrado" }, { status: 404 })
    }

    // Delete the cover
    await prisma.cover.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en DELETE /api/covers/[id]:", error)
    return NextResponse.json(
      {
        error: "Error al eliminar el cover",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}