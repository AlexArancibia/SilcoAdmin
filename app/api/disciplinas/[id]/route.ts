import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const disciplina = await prisma.disciplina.findUnique({
      where: { id },
    });

    if (!disciplina) {
      return NextResponse.json({ error: "Disciplina no encontrada" }, { status: 404 });
    }

    return NextResponse.json(disciplina);
  } catch (error) {
    console.error("Error al obtener disciplina:", error);
    return NextResponse.json({ error: "Error al obtener disciplina" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json().catch(() => {
      throw new Error("Error al parsear el cuerpo de la solicitud");
    });

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
    }

    const disciplinaExistente = await prisma.disciplina.findUnique({
      where: { id },
    });

    if (!disciplinaExistente) {
      return NextResponse.json({ error: "Disciplina no encontrada" }, { status: 404 });
    }

    if (body.nombre && body.nombre !== disciplinaExistente.nombre) {
      const disciplinaConMismoNombre = await prisma.disciplina.findUnique({
        where: { nombre: body.nombre },
      });

      if (disciplinaConMismoNombre) {
        return NextResponse.json({ error: "Ya existe otra disciplina con ese nombre" }, { status: 409 });
      }
    }

    const datosActualizados: any = {};

    if (body.nombre !== undefined) datosActualizados.nombre = body.nombre;
    if (body.descripcion !== undefined) datosActualizados.descripcion = body.descripcion;
    if (body.color !== undefined) datosActualizados.color = body.color;
    if (body.activo !== undefined) datosActualizados.activo = body.activo;

    const disciplinaActualizada = await prisma.disciplina.update({
      where: { id },
      data: datosActualizados,
    });

    return NextResponse.json(disciplinaActualizada);
  } catch (error) {
    console.error("Error al actualizar disciplina:", error);
    return NextResponse.json({ error: "Error al actualizar disciplina" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const disciplinaExistente = await prisma.disciplina.findUnique({
      where: { id },
    });

    if (!disciplinaExistente) {
      return NextResponse.json({ error: "Disciplina no encontrada" }, { status: 404 });
    }

    await prisma.disciplina.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar disciplina:", error);
    return NextResponse.json({ error: "Error al eliminar disciplina" }, { status: 500 });
  }
}
