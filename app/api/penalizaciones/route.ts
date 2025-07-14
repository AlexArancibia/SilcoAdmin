import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const periodoId = searchParams.get("periodoId")
    const instructorId = searchParams.get("instructorId")
    const disciplinaId = searchParams.get("disciplinaId")
    const tipo = searchParams.get("tipo")
    const activa = searchParams.get("activa")

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

    if (instructorId) {
      const parsedInstructorId = Number.parseInt(instructorId, 10)
      if (isNaN(parsedInstructorId)) {
        return NextResponse.json({ error: "El instructorId debe ser un número válido" }, { status: 400 })
      }
      where.instructorId = parsedInstructorId
    }

    if (disciplinaId) {
      const parsedDisciplinaId = Number.parseInt(disciplinaId, 10)
      if (isNaN(parsedDisciplinaId)) {
        return NextResponse.json({ error: "El disciplinaId debe ser un número válido" }, { status: 400 })
      }
      where.disciplinaId = parsedDisciplinaId
    }

    if (tipo) {
      // Validate that tipo is one of the allowed values
      const tiposValidos = [
        "CANCELACION_FIJA",
        "CANCELACION_FUERA_TIEMPO", 
        "CANCELAR_MENOS_24HRS",
        "COVER_DEL_COVER",
        "SALIR_TARDE",
        "LLEGO_TARDE",
        "PERSONALIZADA"
      ]
      
      if (!tiposValidos.includes(tipo)) {
        return NextResponse.json({ error: "Tipo de penalización no válido" }, { status: 400 })
      }
      where.tipo = tipo
    }

    if (activa !== null) {
      where.activa = activa === "true"
    }

    const penalizaciones = await prisma.penalizacion.findMany({
      where,
      include: {
        instructor: true,
        disciplina: true,
        periodo: true,
      },
      orderBy: {
        aplicadaEn: "desc",
      },
    })

    return NextResponse.json(penalizaciones)
  } catch (error) {
    console.error("Error en GET /api/penalizaciones:", error)

    return NextResponse.json(
      { error: "Error al consultar las penalizaciones", message: error instanceof Error ? error.message : "Error desconocido" },
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
      "instructorId",
      "periodoId",
      "tipo",
      "puntos",
    ]

    const missingFields = requiredFields.filter((field) => body[field] === undefined)
    if (missingFields.length > 0) {
      return NextResponse.json({ error: "Campos requeridos faltantes", fields: missingFields }, { status: 400 })
    }

    // Validate tipo field
    const tiposValidos = [
      "CANCELACION_FIJA",
      "CANCELACION_FUERA_TIEMPO", 
      "CANCELAR_MENOS_24HRS",
      "COVER_DEL_COVER",
      "SALIR_TARDE",
      "LLEGO_TARDE",
      "PERSONALIZADA"
    ]
    
    if (!tiposValidos.includes(body.tipo)) {
      return NextResponse.json({ error: "Tipo de penalización no válido" }, { status: 400 })
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

    // Verify instructor exists
    const instructorExists = await prisma.instructor.findUnique({
      where: { id: parsedBody.instructorId }
    })

    if (!instructorExists) {
      return NextResponse.json({ error: "El instructor especificado no existe" }, { status: 404 })
    }

    // Verify periodo exists
    const periodoExists = await prisma.periodo.findUnique({
      where: { id: parsedBody.periodoId }
    })

    if (!periodoExists) {
      return NextResponse.json({ error: "El periodo especificado no existe" }, { status: 404 })
    }

    // If disciplinaId is provided, verify it exists
    if (parsedBody.disciplinaId) {
      const disciplinaExists = await prisma.disciplina.findUnique({
        where: { id: parsedBody.disciplinaId }
      })

      if (!disciplinaExists) {
        return NextResponse.json({ error: "La disciplina especificada no existe" }, { status: 404 })
      }
    }

    // Create the penalizacion in the database
    const penalizacion = await prisma.penalizacion.create({
      data: {
        instructorId: parsedBody.instructorId,
        disciplinaId: parsedBody.disciplinaId || null,
        periodoId: parsedBody.periodoId,
        tipo: parsedBody.tipo,
        puntos: parsedBody.puntos,
        descripcion: parsedBody.descripcion || null,
        activa: parsedBody.activa !== undefined ? parsedBody.activa : true,
        aplicadaEn: parsedBody.aplicadaEn || new Date(),
        comentarios: parsedBody.comentarios || null,
      },
      include: {
        instructor: true,
        disciplina: true,
        periodo: true,
      },
    })

    return NextResponse.json(penalizacion)
  } catch (error) {
    console.error("Error en POST /api/penalizaciones:", error instanceof Error ? error.message : "Error desconocido")

    return NextResponse.json(
      {
        error: "Error al crear la penalización",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}