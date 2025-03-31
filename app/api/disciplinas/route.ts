import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const disciplinas = await prisma.disciplina.findMany({
      orderBy: {
        nombre: "asc",
      },
    });

    return NextResponse.json(disciplinas);
  } catch (error) {
    console.error("Error al obtener disciplinas:", error);
    return NextResponse.json({ error: "Error al obtener disciplinas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => {
      throw new Error("Error al parsear el cuerpo de la solicitud");
    });

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
    }

    const { nombre, descripcion, color, activo } = body;

    if (!nombre) {
      return NextResponse.json(
        {
          error: "Falta el campo requerido: nombre",
        },
        { status: 400 }
      );
    }

    const disciplinaExistente = await prisma.disciplina.findUnique({
      where: { nombre },
    });

    if (disciplinaExistente) {
      return NextResponse.json({ error: "Ya existe una disciplina con ese nombre" }, { status: 409 });
    }

    const nuevaDisciplina = await prisma.disciplina.create({
      data: {
        nombre,
        descripcion,
        color,
        activo: activo !== undefined ? activo : true,
      },
    });

    return NextResponse.json(nuevaDisciplina, { status: 201 });
  } catch (error) {
    console.error("Error al crear disciplina:", error);
    return NextResponse.json({ error: "Error al crear disciplina" }, { status: 500 });
  }
}
