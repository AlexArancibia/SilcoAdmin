import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { formatDataForExport } from "@/utils/excel-utils"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      periodoId, 
      periodoInicio, 
      periodoFin, 
      instructorId, 
      estado, 
      busqueda 
    } = body

    // Build the where clause for filtering
    const where: any = {}

    // Handle period filtering
    if (periodoId) {
      where.periodoId = periodoId
    } else if (periodoInicio || periodoFin) {
      where.periodo = {}
      if (periodoInicio) {
        where.periodo.id = { gte: periodoInicio }
      }
      if (periodoFin) {
        where.periodo.id = { ...where.periodo.id, lte: periodoFin }
      }
    }

    if (instructorId) {
      where.instructorId = instructorId
    }

    if (estado) {
      where.estado = estado
    }

    // Fetch pagos with related data
    const pagos = await prisma.pagoInstructor.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            nombre: true,
            nombreCompleto: true,
            activo: true,
            personaContacto: true,
            cuentaBancaria: true,
            CCI: true,
            banco: true,
            celular: true,
            DNI: true,
          }
        },
        periodo: {
          select: {
            id: true,
            numero: true,
            año: true,
            fechaInicio: true,
            fechaFin: true,
            fechaPago: true,
          }
        }
      },
      orderBy: [
        { periodo: { año: 'desc' } },
        { periodo: { numero: 'desc' } },
        { instructor: { nombre: 'asc' } }
      ]
    })

    // Format data for Excel export
    const formattedData = pagos.map(pago => ({
      'ID Pago': pago.id,
      'Instructor': pago.instructor?.nombre || 'N/A',
      'Nombre Completo': pago.instructor?.nombreCompleto || 'N/A',
      'Período': pago.periodo ? `${pago.periodo.numero}-${pago.periodo.año}` : 'N/A',
      'Fecha Inicio Período': pago.periodo?.fechaInicio ? new Date(pago.periodo.fechaInicio).toLocaleDateString('es-ES') : 'N/A',
      'Fecha Fin Período': pago.periodo?.fechaFin ? new Date(pago.periodo.fechaFin).toLocaleDateString('es-ES') : 'N/A',
      'Fecha Pago': pago.periodo?.fechaPago ? new Date(pago.periodo.fechaPago).toLocaleDateString('es-ES') : 'N/A',
      'Monto Base': pago.monto,
      'Retención': pago.retencion,
      'Reajuste': pago.reajuste,
      'Cover': pago.cover,
      'Penalización': pago.penalizacion,
      'Bono': pago.bono || 0,
      'Pago Final': pago.pagoFinal,
      'Estado': pago.estado,
      'Tipo Reajuste': pago.tipoReajuste,
      'Cumple Lineamientos': pago.cumpleLineamientos ? 'Sí' : 'No',
      'Dobleteos': pago.dobleteos || 0,
      'Horarios No Prime': pago.horariosNoPrime || 0,
      'Participación Eventos': pago.participacionEventos ? 'Sí' : 'No',
      'Comentarios': pago.comentarios || '',
      'Persona Contacto': pago.instructor?.personaContacto || '',
      'Cuenta Bancaria': pago.instructor?.cuentaBancaria || '',
      'CCI': pago.instructor?.CCI || '',
      'Banco': pago.instructor?.banco || '',
      'Celular': pago.instructor?.celular || '',
      'DNI': pago.instructor?.DNI || '',
      'Fecha Creación': pago.createdAt ? new Date(pago.createdAt).toLocaleDateString('es-ES') : 'N/A',
      'Última Actualización': pago.updatedAt ? new Date(pago.updatedAt).toLocaleDateString('es-ES') : 'N/A',
    }))

    return NextResponse.json({ 
      success: true, 
      data: formattedData,
      total: pagos.length 
    })

  } catch (error) {
    console.error('Error exporting pagos to Excel:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al exportar los pagos a Excel' 
      },
      { status: 500 }
    )
  }
} 