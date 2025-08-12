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

    // Get classes and disciplines
    const [clases, disciplinas] = await Promise.all([
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
      })
    ])

    // Classes by discipline
    const porDisciplina = disciplinas
      .map((d) => {
        const clasesDeEsta = clases.filter((c) => c.disciplinaId === d.id)
        const ocupacionTotal = clasesDeEsta.reduce((acc, clase) => {
          return acc + (clase.reservasTotales / clase.lugares) * 100
        }, 0)
        
        return {
          disciplinaId: d.id,
          nombre: d.nombre,
          color: d.color || "#7b8af9",
          count: clasesDeEsta.length,
          ocupacionPromedio: clasesDeEsta.length > 0 ? Math.round(ocupacionTotal / clasesDeEsta.length) : 0,
        }
      })
      .sort((a, b) => b.count - a.count)

    // Classes by day of the week
    const porDia = Array.from({ length: 7 })
      .map((_, i) => ({
        dia: i,
        nombre: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][i],
        count: clases.filter((c) => new Date(c.fecha).getDay() === i).length,
        reservas: clases
          .filter((c) => new Date(c.fecha).getDay() === i)
          .reduce((acc, clase) => acc + clase.reservasTotales, 0),
      }))
      .sort((a, b) => b.count - a.count)

    // Classes by hour (using Peru timezone)
    const porHorario = Array.from({ length: 24 })
      .map((_, i) => {
        const clasesDeEstaHora = clases.filter((c) => {
          const date = new Date(c.fecha)
          const peruHour = parseInt(date.toLocaleTimeString('es-PE', { 
            hour: '2-digit', 
            timeZone: 'America/Lima' 
          }).split(':')[0])
          return peruHour === i
        })
        
        return {
          hora: `${String(i).padStart(2, "0")}:00`,
          count: clasesDeEstaHora.length,
          reservas: clasesDeEstaHora.reduce((acc, clase) => acc + clase.reservasTotales, 0),
        }
      })
      .filter((hour) => hour.count > 0) // Only show hours with classes

    // Reservations by hour (using Peru timezone)
    const reservasPorHorario = Array.from({ length: 24 })
      .map((_, i) => {
        const clasesDeEstaHora = clases.filter((c) => {
          const date = new Date(c.fecha)
          const peruHour = parseInt(date.toLocaleTimeString('es-PE', { 
            hour: '2-digit', 
            timeZone: 'America/Lima' 
          }).split(':')[0])
          return peruHour === i
        })
        const totalReservas = clasesDeEstaHora.reduce((acc, clase) => acc + clase.reservasTotales, 0)
        const totalCapacidad = clasesDeEstaHora.reduce((acc, clase) => acc + clase.lugares, 0)
        
        return {
          hora: `${String(i).padStart(2, "0")}:00`,
          reservas: totalReservas,
          ocupacionPromedio: totalCapacidad > 0 ? Math.round((totalReservas / totalCapacidad) * 100) : 0,
        }
      })
      .filter((hour) => hour.reservas > 0) // Only show hours with reservations

    const classStats = {
      porDisciplina,
      porDia,
      porHorario,
      reservasPorHorario,
    }

    return NextResponse.json(classStats)

  } catch (error) {
    console.error("Error in GET /api/statistics/classes:", error)
    return NextResponse.json(
      { error: "Error al obtener estadísticas de clases", message: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
} 