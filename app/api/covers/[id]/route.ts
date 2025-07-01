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
        clase: {
          include: {
            instructor: true,
            disciplina: true,
            periodo: true,
          }
        },
        periodo: true,
        instructorReemplazo: true,
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
    const numericFields = ["periodoId", "instructorReemplazoId"]
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
    const booleanFields = ["justificacion", "pagoBono", "pagoFullHouse"]
    for (const field of booleanFields) {
      if (parsedBody[field] !== undefined) {
        parsedBody[field] = Boolean(parsedBody[field])
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

    // Update the cover
    const updatedCover = await prisma.cover.update({
      where: { id },
      data: {
        ...(parsedBody.claseId && { claseId: parsedBody.claseId }),
        ...(parsedBody.periodoId && { periodoId: parsedBody.periodoId }),
        ...(parsedBody.instructorReemplazoId && { instructorReemplazoId: parsedBody.instructorReemplazoId }),
        ...(parsedBody.justificacion !== undefined && { justificacion: parsedBody.justificacion }),
        ...(parsedBody.pagoBono !== undefined && { pagoBono: parsedBody.pagoBono }),
        ...(parsedBody.pagoFullHouse !== undefined && { pagoFullHouse: parsedBody.pagoFullHouse }),
        ...(parsedBody.comentarios !== undefined && { comentarios: parsedBody.comentarios }),
        ...(parsedBody.cambioDeNombre !== undefined && { cambioDeNombre: parsedBody.cambioDeNombre }),
      },
      include: {
        clase: {
          include: {
            instructor: true,
            disciplina: true,
            periodo: true,
          }
        },
        periodo: true,
        instructorReemplazo: true,
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