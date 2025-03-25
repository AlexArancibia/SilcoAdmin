import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const periodoId = searchParams.get("periodoId")
    const instructorId = searchParams.get("instructorId")

    // Build the where clause based on the provided parameters
    const where: any = {}

    if (periodoId) {
      where.periodoId = Number.parseInt(periodoId)
    }

    if (instructorId) {
      where.instructorId = Number.parseInt(instructorId)
    }

    const pagos = await prisma.pagoInstructor.findMany({
      where,
      include: {
        instructor: true,
        periodo: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(pagos)
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Error interno del servidor", details: error }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Ensure required fields are present
    const requiredFields = ["monto", "instructorId", "periodoId"]

    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return NextResponse.json({ error: `El campo ${field} es requerido` }, { status: 400 })
      }
    }

    // Parse numeric fields
    const numericFields = ["monto", "instructorId", "periodoId"]

    numericFields.forEach((field) => {
      if (body[field] !== undefined) {
        body[field] = Number(body[field])
      }
    })

    // Validate estado field
    const validEstados = ["PENDIENTE", "APROBADO", "RECHAZADO", "PAGADO"]
    if (body.estado && !validEstados.includes(body.estado)) {
      return NextResponse.json(
        { error: `El valor de estado debe ser uno de: ${validEstados.join(", ")}` },
        { status: 400 },
      )
    }

    const pago = await prisma.pagoInstructor.create({
      data: {
        monto: body.monto,
        estado: body.estado || "PENDIENTE",
        instructorId: body.instructorId,
        periodoId: body.periodoId,
        detalles: body.detalles || {},
      },
      include: {
        instructor: true,
        periodo: true,
      },
    })

    return NextResponse.json(pago)
  } catch (error: any) {
    console.error("Error creating payment:", error)
    return NextResponse.json(
      {
        error: "Error al crear el pago",
        details: error.message || String(error),
      },
      { status: 500 },
    )
  }
}

