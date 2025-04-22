import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const periodoId = searchParams.get("periodoId")
    const instructorId = searchParams.get("instructorId")
    const disciplinaId = searchParams.get("disciplinaId")
    const semana = searchParams.get("semana")
    const fecha = searchParams.get("fecha")

    // Build the where clause based on the provided parameters
    const where: any = {}

    // Validate and parse numeric parameters
    if (periodoId) {
      const parsedPeriodoId = parseInt(periodoId, 10)
      if (isNaN(parsedPeriodoId)) {
        return NextResponse.json({ error: "El periodoId debe ser un número válido" }, { status: 400 })
      }
      where.periodoId = parsedPeriodoId
    }

    if (instructorId) {
      const parsedInstructorId = parseInt(instructorId, 10)
      if (isNaN(parsedInstructorId)) {
        return NextResponse.json({ error: "El instructorId debe ser un número válido" }, { status: 400 })
      }
      where.instructorId = parsedInstructorId
    }

    if (disciplinaId) {
      const parsedDisciplinaId = parseInt(disciplinaId, 10)
      if (isNaN(parsedDisciplinaId)) {
        return NextResponse.json({ error: "El disciplinaId debe ser un número válido" }, { status: 400 })
      }
      where.disciplinaId = parsedDisciplinaId
    }

    if (semana) {
      const parsedSemana = parseInt(semana, 10)
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

    const clases = await prisma.clase.findMany({
      where,
      include: {
        instructor: true,
        disciplina: true,
        periodo: true,
      },
      orderBy: {
        fecha: "asc",
      },
    })

    return NextResponse.json(clases)
  } catch (error) {
    console.error("Error en GET /api/clases:", error)
    
    // Safe error response that doesn't expose internal details
    return NextResponse.json(
      { error: "Error al consultar las clases", message: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
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

    const missingFields = requiredFields.filter(field => body[field] === undefined)
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes", fields: missingFields },
        { status: 400 }
      )
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
    ]

    const parsedBody: Record<string, any> = { ...body }
    
    for (const field of numericFields) {
      if (parsedBody[field] !== undefined) {
        const parsedValue = parseInt(String(parsedBody[field]), 10)
        if (isNaN(parsedValue)) {
          return NextResponse.json(
            { error: `El campo ${field} debe ser un número válido` },
            { status: 400 }
          )
        }
        parsedBody[field] = parsedValue
      }
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
        return NextResponse.json(
          { error: "El formato de fecha no es válido" },
          { status: 400 }
        )
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
      },
      include: {
        instructor: true,
        disciplina: true,
        periodo: true,
      },
    })

    return NextResponse.json(clase)
  } catch (error) {
    // Safe error logging
    console.error("Error en POST /api/clases:", error instanceof Error ? error.message : "Error desconocido")
    
    // Fixed the syntax error in the response
    return NextResponse.json(
      {
        error: "Error al crear la clase",
        message: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    )
  }
}