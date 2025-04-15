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
    const body = await request.json()

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 })
    }

    const { numero, año, fechaInicio, fechaFin, fechaPago, bonoCalculado } = body

    // Validar campos requeridos
    if (
      numero === undefined ||
      año === undefined ||
      !fechaInicio ||
      !fechaFin ||
      !fechaPago
    ) {
      return NextResponse.json(
        {
          error: "Faltan campos requeridos (numero, año, fechaInicio, fechaFin, fechaPago)",
        },
        { status: 400 },
      )
    }

    const nuevoPeriodo = await prisma.periodo.create({
      data: {
        numero: Number(numero),
        año: Number(año),
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        fechaPago: new Date(fechaPago),
        bonoCalculado: bonoCalculado !== undefined ? Boolean(bonoCalculado) : false,
      },
    })

    return NextResponse.json(nuevoPeriodo, { status: 201 })
  } catch (error) {
    console.error("Error al crear periodo:", error)
    return NextResponse.json({ error: "Error al crear periodo" }, { status: 500 })
  }
}
