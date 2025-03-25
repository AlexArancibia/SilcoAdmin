import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const disciplinas = await prisma.disciplina.findMany({
      orderBy: {
        nombre: "asc",
      },
    })

    return NextResponse.json(disciplinas)
  } catch (error) {
    console.error("Error al obtener disciplinas:", error)
    return NextResponse.json({ error: "Error al obtener disciplinas" }, { status: 500 })
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
    if (!body.nombre) {
      return NextResponse.json(
        {
          error: "Falta el campo requerido: nombre",
        },
        { status: 400 },
      )
    }

    // Verificar si ya existe una disciplina con el mismo nombre
    const disciplinaExistente = await prisma.disciplina.findUnique({
      where: {
        nombre: body.nombre,
      },
    })

    if (disciplinaExistente) {
      return NextResponse.json({ error: "Ya existe una disciplina con ese nombre" }, { status: 409 })
    }

    // Crear la nueva disciplina
    const nuevaDisciplina = await prisma.disciplina.create({
      data: {
        nombre: body.nombre,
        descripcion: body.descripcion,
        color: body.color,
        parametros: body.parametros,
        activo: body.activo !== undefined ? body.activo : true,
      },
    })

    return NextResponse.json(nuevaDisciplina, { status: 201 })
  } catch (error) {
    console.error("Error al crear disciplina:", error)
    return NextResponse.json({ error: "Error al crear disciplina" }, { status: 500 })
  }
}

