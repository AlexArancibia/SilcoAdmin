import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const periodoId = searchParams.get("periodoId")
    const instructorOriginalId = searchParams.get("instructorOriginalId")
    const instructorReemplazoId = searchParams.get("instructorReemplazoId")
    const disciplinaId = searchParams.get("disciplinaId")
    const status = searchParams.get("status")
    const fecha = searchParams.get("fecha")
    const busqueda = searchParams.get("busqueda")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

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

    if (instructorOriginalId) {
      const parsedInstructorId = Number.parseInt(instructorOriginalId, 10)
      if (isNaN(parsedInstructorId)) {
        return NextResponse.json({ error: "El instructorOriginalId debe ser un número válido" }, { status: 400 })
      }
      where.instructorOriginalId = parsedInstructorId
    }

    if (instructorReemplazoId) {
      const parsedInstructorId = Number.parseInt(instructorReemplazoId, 10)
      if (isNaN(parsedInstructorId)) {
        return NextResponse.json({ error: "El instructorReemplazoId debe ser un número válido" }, { status: 400 })
      }
      where.instructorReemplazoId = parsedInstructorId
    }

    if (disciplinaId) {
      const parsedDisciplinaId = Number.parseInt(disciplinaId, 10)
      if (isNaN(parsedDisciplinaId)) {
        return NextResponse.json({ error: "El disciplinaId debe ser un número válido" }, { status: 400 })
      }
      where.disciplinaId = parsedDisciplinaId
    }

    if (status) {
      if (!["PENDIENTE", "APROBADO", "RECHAZADO"].includes(status)) {
        return NextResponse.json({ error: "El status debe ser PENDIENTE, APROBADO o RECHAZADO" }, { status: 400 })
      }
      where.status = status
    }

    if (fecha) {
      const parsedFecha = new Date(fecha)
      if (isNaN(parsedFecha.getTime())) {
        return NextResponse.json({ error: "La fecha debe ser válida" }, { status: 400 })
      }
      // Filter by date (ignoring time)
      const startOfDay = new Date(parsedFecha)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(parsedFecha)
      endOfDay.setHours(23, 59, 59, 999)
      
      where.fecha = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    // Search functionality
    if (busqueda) {
      where.OR = [
        {
          instructorOriginal: {
            nombre: {
              contains: busqueda,
              mode: "insensitive"
            }
          }
        },
        {
          instructorReemplazo: {
            nombre: {
              contains: busqueda,
              mode: "insensitive"
            }
          }
        },
        {
          disciplina: {
            nombre: {
              contains: busqueda,
              mode: "insensitive"
            }
          }
        },
        {
          comentarios: {
            contains: busqueda,
            mode: "insensitive"
          }
        }
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get total count for pagination
    const total = await prisma.cover.count({ where })

    const covers = await prisma.cover.findMany({
      where,
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
          }
        },
      },
      orderBy: [
        { fecha: "desc" },
        { createdAt: "desc" }
      ],
      skip,
      take: limit,
    })

    return NextResponse.json({
      data: covers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      }
    })
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
      "instructorOriginalId",
      "instructorReemplazoId",
      "disciplinaId",
      "periodoId",
      "fecha",
      "hora"
    ]

    const missingFields = requiredFields.filter((field) => body[field] === undefined)
    if (missingFields.length > 0) {
      return NextResponse.json({ error: "Campos requeridos faltantes", fields: missingFields }, { status: 400 })
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

    // Validate fecha
    const fecha = new Date(parsedBody.fecha)
    if (isNaN(fecha.getTime())) {
      return NextResponse.json({ error: "La fecha debe ser válida" }, { status: 400 })
    }

    // Validate hora format (HH:mm)
    const horaPattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!horaPattern.test(parsedBody.hora)) {
      return NextResponse.json({ error: "La hora debe tener el formato HH:mm" }, { status: 400 })
    }

    // Check if the instructor original exists
    const instructorOriginal = await prisma.instructor.findUnique({
      where: { id: parsedBody.instructorOriginalId }
    })
    if (!instructorOriginal) {
      return NextResponse.json({ error: "El instructor original no existe" }, { status: 404 })
    }

    // Check if the instructor reemplazo exists
    const instructorReemplazo = await prisma.instructor.findUnique({
      where: { id: parsedBody.instructorReemplazoId }
    })
    if (!instructorReemplazo) {
      return NextResponse.json({ error: "El instructor de reemplazo no existe" }, { status: 404 })
    }

    // Check if the disciplina exists
    const disciplina = await prisma.disciplina.findUnique({
      where: { id: parsedBody.disciplinaId }
    })
    if (!disciplina) {
      return NextResponse.json({ error: "La disciplina no existe" }, { status: 404 })
    }

    // Check if the periodo exists
    const periodo = await prisma.periodo.findUnique({
      where: { id: parsedBody.periodoId }
    })
    if (!periodo) {
      return NextResponse.json({ error: "El periodo no existe" }, { status: 404 })
    }

    // Validate claseId if provided
    if (parsedBody.claseId) {
      const claseExists = await prisma.clase.findUnique({
        where: { id: parsedBody.claseId }
      })
      if (!claseExists) {
        return NextResponse.json({ error: "La clase especificada no existe" }, { status: 404 })
      }
    }

    // Prepare the cover data
    const coverData = {
      instructorOriginalId: parsedBody.instructorOriginalId,
      instructorReemplazoId: parsedBody.instructorReemplazoId,
      disciplinaId: parsedBody.disciplinaId,
      periodoId: parsedBody.periodoId,
      fecha: fecha,
      hora: parsedBody.hora,
      claseId: parsedBody.claseId || null,
      status: "PENDIENTE", // Default status
      justificacion: false,
      pagoBono: false,
      pagoFullHouse: false,
      comentarios: parsedBody.comentarios || null,
      cambioDeNombre: parsedBody.cambioDeNombre || null,
    }

    // Create the cover in the database
    const cover = await prisma.cover.create({
      data: coverData,
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
          }
        },
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