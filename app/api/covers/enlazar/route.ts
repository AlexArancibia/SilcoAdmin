// app/api/covers/enlazar/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { periodoId } = await request.json()

    if (!periodoId) {
      return NextResponse.json(
        { error: 'El ID del período es requerido' },
        { status: 400 }
      )
    }

    // Obtener todos los covers del período con claseTemp
    const covers = await prisma.cover.findMany({
      where: {
        periodoId: Number(periodoId),
        claseTemp: { not: null },
      },
    })

    let updatedCount = 0

    // Procesar cada cover
    for (const cover of covers) {
      if (cover.claseTemp) {
        // Verificar si la clase existe
        const claseExists = await prisma.clase.findUnique({
          where: { id: cover.claseTemp },
        })

        if (claseExists) {
          // Actualizar el cover
          await prisma.cover.update({
            where: { id: cover.id },
            data: {
              claseId: cover.claseTemp,
              claseTemp: null,
            },
          })
          updatedCount++
        }
      }
    }

    return NextResponse.json({
      message: `${updatedCount} covers actualizados correctamente`,
      updatedCount,
    })
  } catch (error) {
    console.error('Error en POST /api/covers/enlazar:', error)
    return NextResponse.json(
      {
        error: 'Error al enlazar covers',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}