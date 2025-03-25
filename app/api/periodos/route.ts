import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const periodos = await prisma.periodo.findMany({
      orderBy: [{ fechaInicio: "desc" }],
    })

    return NextResponse.json(periodos)
  } catch (error) {
    console.error("Error al obtener periodos:", error)
    return NextResponse.json({ error: "Error al obtener periodos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => {
      throw new Error("Error al parsear el cuerpo de la solicitud")
    })

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 })
    }

    // Validar campos requeridos
    if (!body.nombre || !body.fechaInicio || !body.fechaFin || !body.fechaPago) {
      return NextResponse.json(
        {
          error: "Faltan campos requeridos (nombre, fechaInicio, fechaFin, fechaPago)",
        },
        { status: 400 },
      )
    }

    // Crear el nuevo periodo
    const nuevoPeriodo = await prisma.periodo.create({
      data: {
        numero: body.numero,
        año:body.año,
        fechaInicio: new Date(body.fechaInicio),
        fechaFin: new Date(body.fechaFin),
        fechaPago: new Date(body.fechaPago),
      },
    })

    return NextResponse.json(nuevoPeriodo, { status: 201 })
  } catch (error) {
    console.error("Error al crear periodo:", error)
    return NextResponse.json({ error: "Error al crear periodo" }, { status: 500 })
  }
}

