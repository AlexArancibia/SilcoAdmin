import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de pago inválido" }, { status: 400 })
    }

    const pago = await prisma.pagoInstructor.findUnique({
      where: { id },
      include: {
        instructor: true,
        periodo: true,
      },
    })

    if (!pago) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
    }

    return NextResponse.json(pago)
  } catch (error) {
    console.error("Error fetching payment:", error)
    return NextResponse.json({ error: "Error al obtener el pago" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de pago inválido" }, { status: 400 })
    }

    const body = await request.json()

    // Validate the payment exists
    const existingPago = await prisma.pagoInstructor.findUnique({
      where: { id },
    })

    if (!existingPago) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
    }

    // Parse numeric fields
    if (body.monto !== undefined) {
      body.monto = Number(body.monto)

      if (isNaN(body.monto)) {
        return NextResponse.json({ error: "El monto debe ser un número válido" }, { status: 400 })
      }
    }

    // Validate estado field
    const validEstados = ["PENDIENTE", "APROBADO", "RECHAZADO", "PAGADO"]
    if (body.estado && !validEstados.includes(body.estado)) {
      return NextResponse.json(
        { error: `El valor de estado debe ser uno de: ${validEstados.join(", ")}` },
        { status: 400 },
      )
    }

    const updatedPago = await prisma.pagoInstructor.update({
      where: { id },
      data: {
        ...(body.monto !== undefined && { monto: body.monto }),
        ...(body.estado !== undefined && { estado: body.estado }),
        ...(body.detalles !== undefined && { detalles: body.detalles }),
      },
      include: {
        instructor: true,
        periodo: true,
      },
    })

    return NextResponse.json(updatedPago)
  } catch (error) {
    console.error("Error updating payment:", error)
    return NextResponse.json({ error: "Error al actualizar el pago" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de pago inválido" }, { status: 400 })
    }

    // Validate the payment exists
    const existingPago = await prisma.pagoInstructor.findUnique({
      where: { id },
    })

    if (!existingPago) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
    }

    await prisma.pagoInstructor.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting payment:", error)
    return NextResponse.json({ error: "Error al eliminar el pago" }, { status: 500 })
  }
}

