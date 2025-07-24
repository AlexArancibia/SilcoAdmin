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

    // Calculate instructor stats
    const instructores = await prisma.instructor.findMany({
      include: {
        disciplinas: true,
      }
    })

    const instructoresStats = {
      total: instructores.length,
      activos: instructores.filter((i) => i.activo).length,
      inactivos: instructores.filter((i) => !i.activo).length,
      conDisciplinas: instructores.filter((i) => i.disciplinas && i.disciplinas.length > 0).length,
      sinDisciplinas: instructores.filter((i) => !i.disciplinas || i.disciplinas.length === 0).length,
      nuevos: instructores.filter((i) => 
        new Date(i.createdAt!).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
      ).length,
    }

    // Calculate discipline stats
    const disciplinas = await prisma.disciplina.findMany()
    const disciplinasStats = {
      total: disciplinas.length,
      activas: disciplinas.filter((d) => d.activo).length,
      inactivas: disciplinas.filter((d) => !d.activo).length,
    }

    // Calculate class stats
    const clases = await prisma.clase.findMany({
      where: periodoFilter,
    })

    const clasesStats = {
      total: clases.length,
      ocupacionPromedio: clases.length > 0
        ? Math.round(
            (clases.reduce((acc, clase) => acc + clase.reservasTotales / (clase.lugares || 1), 0) /
              clases.length) * 100,
          )
        : 0,
      clasesLlenas: clases.filter((c) => c.reservasTotales >= c.lugares).length,
      porcentajeClasesLlenas: clases.length > 0
        ? Math.round(
            (clases.filter((c) => c.reservasTotales >= c.lugares).length / clases.length) * 100,
          )
        : 0,
      reservasTotales: clases.reduce((acc, clase) => acc + clase.reservasTotales, 0),
    }

    // Calculate payment stats
    const pagos = await prisma.pagoInstructor.findMany({
      where: periodoFilter,
    })

    const pagosStats = {
      total: pagos.length,
      pendientes: pagos.filter((p) => p.estado === "PENDIENTE").length,
      pagados: pagos.filter((p) => p.estado === "APROBADO").length,
      montoTotal: pagos.reduce((acc, pago) => acc + pago.pagoFinal, 0),
      montoPagado: pagos.filter((p) => p.estado === "APROBADO").reduce((acc, pago) => acc + pago.pagoFinal, 0),
      montoPendiente: pagos
        .filter((p) => p.estado === "PENDIENTE")
        .reduce((acc, pago) => acc + pago.pagoFinal, 0),
      montoPromedio: pagos.length > 0
        ? pagos.reduce((acc, pago) => acc + pago.pagoFinal, 0) / pagos.length
        : 0,
      porcentajePagado: pagos.length > 0
        ? (pagos.filter((p) => p.estado === "APROBADO").length / pagos.length) * 100
        : 0,
      porcentajePendiente: pagos.length > 0
        ? (pagos.filter((p) => p.estado === "PENDIENTE").length / pagos.length) * 100
        : 0,
    }

    const generalStats = {
      instructores: instructoresStats,
      disciplinas: disciplinasStats,
      clases: clasesStats,
      pagos: pagosStats,
    }

    return NextResponse.json(generalStats)

  } catch (error) {
    console.error("Error in GET /api/statistics/general:", error)
    return NextResponse.json(
      { error: "Error al obtener estadísticas generales", message: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
} 