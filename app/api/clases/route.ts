import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import type { ClasesQueryParams, PaginatedResponse, Clase } from "@/types/schema"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Parse pagination parameters
    const page = Number(searchParams.get("page")) || 1
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 100) // Max 100 items per page
    const offset = (page - 1) * limit

    // Parse filter parameters
    const periodoId = searchParams.get("periodoId")
    const periodoInicio = searchParams.get("periodoInicio") // Nuevo: rango inicio
    const periodoFin = searchParams.get("periodoFin") // Nuevo: rango fin
    const instructorId = searchParams.get("instructorId")
    const disciplinaId = searchParams.get("disciplinaId")
    const semana = searchParams.get("semana")
    const fecha = searchParams.get("fecha")
    const estudio = searchParams.get("estudio")
    const id = searchParams.get("id") // Nuevo parámetro para filtrar por ID

    // Build the where clause based on the provided parameters
    const where: any = {}

    // Handle period filtering with range support
    let periodoFilter: any = null

    if (periodoId) {
      // Comportamiento existente: período individual
      const parsedPeriodoId = Number.parseInt(periodoId, 10)
      if (isNaN(parsedPeriodoId)) {
        return NextResponse.json({ error: "El periodoId debe ser un número válido" }, { status: 400 })
      }
      periodoFilter = parsedPeriodoId
    } else if (periodoInicio || periodoFin) {
      // Nuevo comportamiento: rango de períodos
      const startId = periodoInicio ? Number.parseInt(periodoInicio, 10) : null
      const endId = periodoFin ? Number.parseInt(periodoFin, 10) : null

      if (periodoInicio && isNaN(startId!)) {
        return NextResponse.json({ error: "El periodoInicio debe ser un número válido" }, { status: 400 })
      }
      if (periodoFin && isNaN(endId!)) {
        return NextResponse.json({ error: "El periodoFin debe ser un número válido" }, { status: 400 })
      }

      if (startId && endId) {
        // Rango de períodos
        const minId = Math.min(startId, endId)
        const maxId = Math.max(startId, endId)
        periodoFilter = {
          gte: minId,
          lte: maxId
        }
      } else if (startId) {
        // Solo inicio especificado, tratar como período único
        periodoFilter = startId
      } else if (endId) {
        // Solo fin especificado, usar como límite superior
        periodoFilter = {
          lte: endId
        }
      }
    }

    // Apply period filter if any
    if (periodoFilter !== null) {
      where.periodoId = periodoFilter
    }

    // Validate and parse other numeric parameters
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

    if (semana) {
      const parsedSemana = Number.parseInt(semana, 10)
      if (isNaN(parsedSemana)) {
        return NextResponse.json({ error: "La semana debe ser un número válido" }, { status: 400 })
      }
      where.semana = parsedSemana
    }

    if (fecha) {
      // Validate date format
      const parsedDate = new Date(fecha)
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: "El formato de fecha no es válido" }, { status: 400 })
      }
      where.fecha = parsedDate
    }

    if (estudio) {
      where.estudio = {
        contains: estudio,
        mode: 'insensitive'
      }
    }

    if (id) {
      where.id = id
    }

    // Get total count for pagination
    const total = await prisma.clase.count({ where })
    const totalPages = Math.ceil(total / limit)

    // Get paginated results
    const clases = await prisma.clase.findMany({
      where,
      include: {
        instructor: true,
        disciplina: true,
        periodo: true,
      },
      orderBy: [
        { fecha: "desc" },
        { semana: "desc" },
        { id: "asc" }
      ],
      skip: offset,
      take: limit,
    })

    const response: PaginatedResponse<any> = {
      data: clases,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error en GET /api/clases:", error)

    // Safe error response that doesn't expose internal details
    return NextResponse.json(
      { error: "Error al consultar las clases", message: error instanceof Error ? error.message : "Error desconocido" },
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
      "pais",
      "ciudad",
      "disciplinaId",
      "semana",
      "estudio",
      "instructorId",
      "periodoId",
      "salon",
      "lugares",
      "fecha",
    ]

    const missingFields = requiredFields.filter((field) => body[field] === undefined)
    if (missingFields.length > 0) {
      return NextResponse.json({ error: "Campos requeridos faltantes", fields: missingFields }, { status: 400 })
    }

    // Parse numeric fields with validation
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
      "vsNum", // Added new numeric field
    ]

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
    if (parsedBody.esVersus !== undefined) {
      parsedBody.esVersus = Boolean(parsedBody.esVersus)
    }

    // Handle date field with validation
    if (parsedBody.fecha) {
      let parsedDate: Date | null = null

      // Check if fecha is a string in format YYYY-MM-DD
      if (typeof parsedBody.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsedBody.fecha)) {
        parsedDate = new Date(parsedBody.fecha)
      }
      // Check if fecha is a string in format DD/MM/YYYY
      else if (typeof parsedBody.fecha === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(parsedBody.fecha)) {
        const [day, month, year] = parsedBody.fecha.split("/").map(Number)
        parsedDate = new Date(year, month - 1, day)
      }
      // If it's already a Date object or ISO string, just use it
      else if (typeof parsedBody.fecha === "string") {
        parsedDate = new Date(parsedBody.fecha)
      }

      if (!parsedDate || isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: "El formato de fecha no es válido" }, { status: 400 })
      }

      parsedBody.fecha = parsedDate
    }

    // Create the class in the database
    const clase = await prisma.clase.create({
      data: {
        id: parsedBody.id,
        pais: parsedBody.pais,
        ciudad: parsedBody.ciudad,
        disciplinaId: parsedBody.disciplinaId,
        semana: parsedBody.semana,
        estudio: parsedBody.estudio,
        instructorId: parsedBody.instructorId,
        periodoId: parsedBody.periodoId,
        salon: parsedBody.salon,
        reservasTotales: parsedBody.reservasTotales || 0,
        listasEspera: parsedBody.listasEspera || 0,
        cortesias: parsedBody.cortesias || 0,
        lugares: parsedBody.lugares,
        reservasPagadas: parsedBody.reservasPagadas || 0,
        textoEspecial: parsedBody.textoEspecial || null,
        fecha: parsedBody.fecha,
        // New fields
        esVersus: parsedBody.esVersus !== undefined ? parsedBody.esVersus : false,
        vsNum: parsedBody.vsNum || null,
      },
      include: {
        instructor: true,
        disciplina: true,
        periodo: true,
      },
    })

    return NextResponse.json(clase)
  } catch (error) {
    // Log detallado del error con toda la información de la clase que falló
    

    // Determinar el tipo de error específico para dar una respuesta más útil
    let errorMessage = "Error al crear la clase"
    let statusCode = 500

    if (error instanceof Error) {
      // Errores específicos de Prisma
      if (error.message.includes("Invalid value provided")) {
        errorMessage = `Error de validación: ${error.message}`
        statusCode = 400
      } else if (error.message.includes("Unique constraint")) {
        errorMessage = `Error de duplicado: ${error.message}`
        statusCode = 409
      } else if (error.message.includes("Foreign key constraint")) {
        errorMessage = `Error de referencia: ${error.message}`
        statusCode = 400
      } else if (error.message.includes("Record to create does not exist")) {
        errorMessage = `Error de referencia: El instructor, disciplina o periodo especificado no existe`
        statusCode = 400
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        message: error instanceof Error ? error.message : "Error desconocido",
        
        timestamp: new Date().toISOString(),
      },
      { status: statusCode },
    )
  }
}
