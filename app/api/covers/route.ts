import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const periodoId = searchParams.get("periodoId")
    const instructorReemplazoId = searchParams.get("instructorReemplazoId")
    const claseId = searchParams.get("claseId")
    const disciplinaId = searchParams.get("disciplinaId")

    // Build the where clause based on the provided parameters
    const where: any = {}

    // Validate and parse numeric parameters
    if (periodoId) {
      const parsedPeriodoId = Number.parseInt(periodoId, 10)
      if (isNaN(parsedPeriodoId)) {
        return NextResponse.json({ error: "El periodoId debe ser un número válido" }, { status: 400 })
      }
      where.periodoId = parsedPeriodoId
    }

    if (instructorReemplazoId) {
      const parsedInstructorId = Number.parseInt(instructorReemplazoId, 10)
      if (isNaN(parsedInstructorId)) {
        return NextResponse.json({ error: "El instructorReemplazoId debe ser un número válido" }, { status: 400 })
      }
      where.instructorReemplazoId = parsedInstructorId
    }

    if (claseId) {
      where.claseId = claseId
    }

    // Handle disciplinaId filter through clase relation
    if (disciplinaId) {
      const parsedDisciplinaId = Number.parseInt(disciplinaId, 10)
      if (isNaN(parsedDisciplinaId)) {
        return NextResponse.json({ error: "El disciplinaId debe ser un número válido" }, { status: 400 })
      }
      where.clase = {
        disciplinaId: parsedDisciplinaId
      }
    }

    const covers = await prisma.cover.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(covers)
  } catch (error) {
    console.error("Error en GET /api/covers:", error)

    return NextResponse.json(
      { error: "Error al consultar los covers", message: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate that the request has a body
    const body = await request.json().catch(() => {
      throw new Error("El cuerpo de la solicitud no es un JSON válido")
    })

    if (!body) {
      return NextResponse.json({ error: "El cuerpo de la solicitud está vacío" }, { status: 400 })
    }

    // Ensure required fields are present
    const requiredFields = [
      "claseId",
      "periodoId",
      "instructorReemplazoId",
    ]

    const missingFields = requiredFields.filter((field) => body[field] === undefined)
    if (missingFields.length > 0) {
      return NextResponse.json({ error: "Campos requeridos faltantes", fields: missingFields }, { status: 400 })
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

    // Verify that the clase exists
    const claseExists = await prisma.clase.findUnique({
      where: { id: parsedBody.claseId }
    })

    if (!claseExists) {
      return NextResponse.json({ error: "La clase especificada no existe" }, { status: 404 })
    }

    // Create the cover in the database
    const cover = await prisma.cover.create({
      data: {
        claseId: parsedBody.claseId,
        periodoId: parsedBody.periodoId,
        instructorReemplazoId: parsedBody.instructorReemplazoId,
        justificacion: parsedBody.justificacion || false,
        pagoBono: parsedBody.pagoBono || false,
        pagoFullHouse: parsedBody.pagoFullHouse || false,
        comentarios: parsedBody.comentarios || null,
        cambioDeNombre: parsedBody.cambioDeNombre || null,
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

    return NextResponse.json(cover)
  } catch (error) {
    console.error("Error en POST /api/covers:", error instanceof Error ? error.message : "Error desconocido")

    return NextResponse.json(
      {
        error: "Error al crear el cover",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}