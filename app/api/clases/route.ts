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

    if (periodoId) {
      where.periodoId = Number.parseInt(periodoId)
    }

    if (instructorId) {
      where.instructorId = Number.parseInt(instructorId)
    }

    if (disciplinaId) {
      where.disciplinaId = Number.parseInt(disciplinaId)
    }

    if (semana) {
      where.semana = Number.parseInt(semana)
    }

    if (fecha) {
      // Handle date format (assuming ISO format)
      where.fecha = new Date(fecha)
    }

    try {
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
    } catch (dbError) {
      console.error("Database query error:", dbError)
      return NextResponse.json({ error: "Error al consultar las clases", details: dbError }, { status: 500 })
    }
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Error interno del servidor", details: error }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

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

    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return NextResponse.json({ error: `El campo ${field} es requerido` }, { status: 400 })
      }
    }

    // Parse numeric fields
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

    numericFields.forEach((field) => {
      if (body[field] !== undefined) {
        body[field] = Number.parseInt(body[field])
      }
    })

    // Handle date field
    if (body.fecha) {
      // Check if fecha is a string in format YYYY-MM-DD
      if (typeof body.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.fecha)) {
        body.fecha = new Date(body.fecha)
      }
      // Check if fecha is a string in format DD/MM/YYYY
      else if (typeof body.fecha === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(body.fecha)) {
        const [day, month, year] = body.fecha.split("/").map(Number)
        body.fecha = new Date(year, month - 1, day)
      }
      // If it's already a Date object or ISO string, just use it
      else if (typeof body.fecha === "string") {
        body.fecha = new Date(body.fecha)
      }
    }

    const clase = await prisma.clase.create({
      data: {
        pais: body.pais,
        ciudad: body.ciudad,
        disciplinaId: body.disciplinaId,
        semana: body.semana,
        estudio: body.estudio,
        instructorId: body.instructorId,
        periodoId: body.periodoId,
        salon: body.salon,
        reservasTotales: body.reservasTotales || 0,
        listasEspera: body.listasEspera || 0,
        cortesias: body.cortesias || 0,
        lugares: body.lugares,
        reservasPagadas: body.reservasPagadas || 0,
        textoEspecial: body.textoEspecial || null,
        fecha: body.fecha,
      },
      include: {
        instructor: true,
        disciplina: true,
        periodo: true,
      },
    })

    return NextResponse.json(clase)
  } catch (error: any) {
    console.error("Error creating class:", error)
    return NextResponse.json(
      {
        error: "Error al crear la clase",
        details: error.message || String(error),
      },
      { status: 500 },
    )
  }
}

