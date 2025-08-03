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
    
    // If no filter is provided, get all data
    console.log('API Debug - Final period filter:', periodoFilter)

    // Get classes with disciplinas and payments data
    const [clases, disciplinas, pagos] = await Promise.all([
      prisma.clase.findMany({
        where: periodoFilter,
        include: {
          disciplina: {
            select: {
              id: true,
              nombre: true,
              color: true,
            }
          }
        }
      }),
      prisma.disciplina.findMany({
        select: {
          id: true,
          nombre: true,
          color: true,
        }
      }),
      prisma.pagoInstructor.findMany({
        where: periodoFilter,
      })
    ])

    console.log('API Debug - Period filter:', periodoFilter)
    console.log('API Debug - Classes found:', clases.length)
    console.log('API Debug - Unique venues:', [...new Set(clases.map((c) => c.estudio))])
    console.log('API Debug - Payments found:', pagos.length)

    // If no classes found with filter, try without filter to see if there's any data
    if (clases.length === 0 && Object.keys(periodoFilter).length > 0) {
      console.log('API Debug - No classes found with filter, checking total classes in DB...')
      const totalClasses = await prisma.clase.count()
      const totalPeriods = await prisma.periodo.count()
      console.log('API Debug - Total classes in DB:', totalClasses)
      console.log('API Debug - Total periods in DB:', totalPeriods)
      
      if (totalClasses > 0) {
        // Get a sample of classes to see what periods exist
        const sampleClasses = await prisma.clase.findMany({
          take: 5,
          select: {
            periodoId: true,
            estudio: true,
            fecha: true
          }
        })
        console.log('API Debug - Sample classes:', sampleClasses)
      }
    }

    // Get unique venues
    const uniqueVenues = [...new Set(clases.map((c) => c.estudio))]
    const totalLocales = uniqueVenues.length

    // Most used venues
    const masUsados = uniqueVenues
      .map((estudio) => {
        const clasesEstudio = clases.filter((c) => c.estudio === estudio)
        const totalReservas = clasesEstudio.reduce((sum, c) => sum + c.reservasTotales, 0)
        const totalCapacidad = clasesEstudio.reduce((sum, c) => sum + c.lugares, 0)
        const ocupacionPromedio = totalCapacidad > 0 
          ? Math.round((totalReservas / totalCapacidad) * 100) 
          : 0
        const instructoresUnicos = [...new Set(clasesEstudio.map((c) => c.instructorId))].length

        return {
          nombre: estudio,
          count: clasesEstudio.length,
          ocupacionPromedio,
          reservasTotales: totalReservas,
          instructores: instructoresUnicos,
        }
      })
      .sort((a, b) => b.count - a.count)

    // Occupation by venue
    const ocupacionPorSalon = uniqueVenues
      .map((estudio) => {
        const clasesEstudio = clases.filter((c) => c.estudio === estudio)
        const totalReservas = clasesEstudio.reduce((sum, c) => sum + c.reservasTotales, 0)
        const totalCapacidad = clasesEstudio.reduce((sum, c) => sum + c.lugares, 0)
        const ocupacion = totalCapacidad > 0 ? (totalReservas / totalCapacidad) * 100 : 0

        return {
          nombre: estudio,
          ocupacion: Math.round(ocupacion),
          clases: clasesEstudio.length,
        }
      })
      .sort((a, b) => b.ocupacion - a.ocupacion)

    // Revenue by venue (based on instructor payments proportional to classes in that venue)
    const ingresosPorSalon = uniqueVenues
      .map((estudio) => {
        const clasesEnSalon = clases.filter((c) => c.estudio === estudio)
        const instructoresIds = [...new Set(clasesEnSalon.map((c) => c.instructorId))]

        // Calculate revenue based on instructor payments for this venue
        const ingresos = pagos
          .filter((p) => instructoresIds.includes(p.instructorId))
          .reduce((acc, pago) => {
            // Proportion of instructor's classes in this venue
            const clasesTotalesInstructor = clases.filter((c) => c.instructorId === pago.instructorId).length
            const clasesEnEsteSalon = clasesEnSalon.filter((c) => c.instructorId === pago.instructorId).length
            const proporcion = clasesTotalesInstructor > 0 ? clasesEnEsteSalon / clasesTotalesInstructor : 0

            // Proportional revenue
            return acc + pago.pagoFinal * proporcion
          }, 0)

        return {
          nombre: estudio,
          ingresos: Math.round(ingresos),
          clases: clasesEnSalon.length,
          reservas: clasesEnSalon.reduce((acc, clase) => acc + clase.reservasTotales, 0),
          instructores: instructoresIds.length,
        }
      })
      .sort((a, b) => b.ingresos - a.ingresos)

    // Disciplines by venue
    const disciplinasPorSalon = uniqueVenues.map((estudio) => {
      const disciplinasEnSalon = [...new Set(clases.filter((c) => c.estudio === estudio).map((c) => c.disciplinaId))]
        .map((disciplinaId) => {
          const disciplina = disciplinas.find((d) => d.id === disciplinaId)
          return {
            disciplinaId,
            nombre: disciplina?.nombre || "Desconocida",
            count: clases.filter((c) => c.estudio === estudio && c.disciplinaId === disciplinaId).length,
            color: disciplina?.color || "#7b8af9",
          }
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)

      return {
        nombre: estudio,
        disciplinas: disciplinasEnSalon,
      }
    })

    const venueStats = {
      totalLocales,
      masUsados,
      ocupacionPorSalon,
      ingresosPorSalon,
      disciplinasPorSalon,
    }

    return NextResponse.json(venueStats)

  } catch (error) {
    console.error("Error in GET /api/statistics/venues:", error)
    return NextResponse.json(
      { error: "Error al obtener estadísticas de salones", message: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
} 