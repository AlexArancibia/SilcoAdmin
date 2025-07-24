import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const instructorReemplazoId = searchParams.get("instructorReemplazoId")
    const periodoId = searchParams.get("periodoId")
    const disciplinaId = searchParams.get("disciplinaId")
    const status = searchParams.get("status")
    const fecha = searchParams.get("fecha")
    const busqueda = searchParams.get("busqueda")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    // Validate required parameter
    if (!instructorReemplazoId) {
      return NextResponse.json({ error: "El instructorReemplazoId es requerido" }, { status: 400 })
    }

    const parsedInstructorReemplazoId = Number.parseInt(instructorReemplazoId, 10)
    if (isNaN(parsedInstructorReemplazoId)) {
      return NextResponse.json({ error: "El instructorReemplazoId debe ser un número válido" }, { status: 400 })
    }

    // Verify the instructor exists
    const instructor = await prisma.instructor.findUnique({
      where: { id: parsedInstructorReemplazoId }
    })

    if (!instructor) {
      return NextResponse.json({ error: "Instructor no encontrado" }, { status: 404 })
    }

    // Build the where clause
    const where: any = {
      instructorReemplazoId: parsedInstructorReemplazoId // Only covers where this instructor was the replacement
    }

    // Add additional filters
    if (periodoId) {
      const parsedPeriodoId = Number.parseInt(periodoId, 10)
      if (isNaN(parsedPeriodoId)) {
        return NextResponse.json({ error: "El periodoId debe ser un número válido" }, { status: 400 })
      }
      where.periodoId = parsedPeriodoId
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
    console.error("Error en GET /api/covers/mis-reemplazos:", error)

    return NextResponse.json(
      { error: "Error al consultar los covers", message: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
} 