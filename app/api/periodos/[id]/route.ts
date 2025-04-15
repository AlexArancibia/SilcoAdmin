import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const periodo = await prisma.periodo.findUnique({
      where: { id },
    })

    if (!periodo) {
      return NextResponse.json({ error: "Periodo no encontrado" }, { status: 404 })
    }

    return NextResponse.json(periodo)
  } catch (error) {
    console.error("Error al obtener periodo:", error)
    return NextResponse.json({ error: "Error al obtener periodo" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = await request.json()

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 })
    }

    const periodoExistente = await prisma.periodo.findUnique({
      where: { id },
    })

    if (!periodoExistente) {
      return NextResponse.json({ error: "Periodo no encontrado" }, { status: 404 })
    }

    const datosActualizados: any = {}

    if (body.nombre !== undefined) datosActualizados.nombre = body.nombre
    if (body.numero !== undefined) datosActualizados.numero = Number(body.numero)
    if (body.año !== undefined) datosActualizados.año = Number(body.año)
    if (body.fechaInicio !== undefined) datosActualizados.fechaInicio = new Date(body.fechaInicio)
    if (body.fechaFin !== undefined) datosActualizados.fechaFin = new Date(body.fechaFin)
    if (body.fechaPago !== undefined) datosActualizados.fechaPago = new Date(body.fechaPago)
    if (body.bonoCalculado !== undefined) datosActualizados.bonoCalculado = Boolean(body.bonoCalculado)

    const periodoActualizado = await prisma.periodo.update({
      where: { id },
      data: datosActualizados,
    })

    return NextResponse.json(periodoActualizado)
  } catch (error) {
    console.error("Error al actualizar periodo:", error)
    return NextResponse.json({ error: "Error al actualizar periodo" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id, 10)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const periodoExistente = await prisma.periodo.findUnique({
      where: { id },
    })

    if (!periodoExistente) {
      return NextResponse.json({ error: "Periodo no encontrado" }, { status: 404 })
    }

    await prisma.periodo.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar periodo:", error)
    return NextResponse.json({ error: "Error al eliminar periodo" }, { status: 500 })
  }
}
