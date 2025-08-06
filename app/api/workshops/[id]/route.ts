import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const workshop = await prisma.workshop.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            nombre: true,
            nombreCompleto: true,
          },
        },
        periodo: {
          select: {
            id: true,
            numero: true,
            año: true,
          },
        },
      },
    });

    if (!workshop) {
      return NextResponse.json(
        { error: "Workshop no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(workshop);
  } catch (error) {
    console.error("Error al obtener workshop:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { nombre, instructorId, periodoId, fecha, comentarios, pago } = body;

    // Verificar que el workshop existe
    const workshopExistente = await prisma.workshop.findUnique({
      where: { id },
    });
    if (!workshopExistente) {
      return NextResponse.json(
        { error: "Workshop no encontrado" },
        { status: 404 }
      );
    }

    // Validaciones
    if (!nombre || !instructorId || !periodoId || !fecha || pago === undefined) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: nombre, instructorId, periodoId, fecha, pago" },
        { status: 400 }
      );
    }

    // Verificar que el instructor existe
    const instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
    });
    if (!instructor) {
      return NextResponse.json(
        { error: "Instructor no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el periodo existe
    const periodo = await prisma.periodo.findUnique({
      where: { id: periodoId },
    });
    if (!periodo) {
      return NextResponse.json(
        { error: "Periodo no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar el workshop
    const workshop = await prisma.workshop.update({
      where: { id },
      data: {
        nombre,
        instructorId,
        periodoId,
        fecha: new Date(fecha),
        comentarios,
        pago: parseFloat(pago),
      },
      include: {
        instructor: {
          select: {
            id: true,
            nombre: true,
            nombreCompleto: true,
          },
        },
        periodo: {
          select: {
            id: true,
            numero: true,
            año: true,
          },
        },
      },
    });

    return NextResponse.json(workshop);
  } catch (error) {
    console.error("Error al actualizar workshop:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // Verificar que el workshop existe
    const workshop = await prisma.workshop.findUnique({
      where: { id },
    });
    if (!workshop) {
      return NextResponse.json(
        { error: "Workshop no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el workshop
    await prisma.workshop.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Workshop eliminado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar workshop:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 