import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const periodoId = searchParams.get("periodoId")
    const periodoInicio = searchParams.get("periodoInicio")
    const periodoFin = searchParams.get("periodoFin")

    // Build period filter
    let periodoFilter: any = {}
    
    if (periodoId) {
      periodoFilter = { periodoId: parseInt(periodoId) }
    } else if (periodoInicio && periodoFin) {
      const inicio = parseInt(periodoInicio)
      const fin = parseInt(periodoFin)
      periodoFilter = {
        periodoId: {
          gte: inicio,
          lte: fin,
        }
      }
    }

    // Get instructors with their classes and payments for the period
    const instructores = await prisma.instructor.findMany({
      include: {
        clases: {
          where: periodoFilter,
        },
        pagos: {
          where: periodoFilter,
        },
      }
    })

    // Calculate instructor stats
    const instructoresPorOcupacion = instructores.map((instructor) => {
      const clasesInstructor = instructor.clases
      const ocupacionTotal = clasesInstructor.reduce((acc, clase) => {
        return acc + clase.reservasTotales / clase.lugares
      }, 0)
      const ocupacionPromedio = clasesInstructor.length > 0 ? (ocupacionTotal / clasesInstructor.length) * 100 : 0

      const pagosTotales = instructor.pagos.reduce((acc, pago) => acc + pago.pagoFinal, 0)

      return {
        id: instructor.id,
        nombre: instructor.nombre,
        clasesCount: clasesInstructor.length,
        ocupacionPromedio: Math.round(ocupacionPromedio),
        reservasTotal: clasesInstructor.reduce((acc, clase) => acc + clase.reservasTotales, 0),
        ingresoTotal: pagosTotales,
      }
    })

    // Top instructors by income
    const topPorIngresos = instructoresPorOcupacion
      .sort((a, b) => b.ingresoTotal - a.ingresoTotal)
      .slice(0, 8)
      .map((instructor) => ({
        id: instructor.id,
        nombre: instructor.nombre,
        ingresos: instructor.ingresoTotal,
        ocupacion: instructor.ocupacionPromedio,
        clases: instructor.clasesCount,
      }))

    // Top instructors by class count
    const topPorClases = instructoresPorOcupacion
      .sort((a, b) => b.clasesCount - a.clasesCount)
      .slice(0, 8)
      .map((instructor) => ({
        id: instructor.id,
        nombre: instructor.nombre,
        clases: instructor.clasesCount,
        reservas: instructor.reservasTotal,
        ocupacion: instructor.ocupacionPromedio,
      }))

    // Distribution by occupation percentage
    const distribucionOcupacion = [
      {
        rango: "0-25%",
        count: instructoresPorOcupacion.filter((i) => i.ocupacionPromedio >= 0 && i.ocupacionPromedio <= 25).length,
      },
      {
        rango: "26-50%",
        count: instructoresPorOcupacion.filter((i) => i.ocupacionPromedio > 25 && i.ocupacionPromedio <= 50).length,
      },
      {
        rango: "51-75%",
        count: instructoresPorOcupacion.filter((i) => i.ocupacionPromedio > 50 && i.ocupacionPromedio <= 75).length,
      },
      {
        rango: "76-100%",
        count: instructoresPorOcupacion.filter((i) => i.ocupacionPromedio > 75 && i.ocupacionPromedio <= 100).length,
      },
    ]

    const instructorStats = {
      topPorIngresos,
      topPorClases,
      distribucionOcupacion,
    }

    return NextResponse.json(instructorStats)

  } catch (error) {
    console.error("Error in GET /api/statistics/instructors:", error)
    return NextResponse.json(
      { error: "Error al obtener estadísticas de instructores", message: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
} 