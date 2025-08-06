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

    const brandeo = await prisma.brandeo.findUnique({
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

    if (!brandeo) {
      return NextResponse.json(
        { error: "Brandeo no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(brandeo);
  } catch (error) {
    console.error("Error al obtener brandeo:", error);
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
    const { numero, instructorId, periodoId, comentarios } = body;

    // Verificar que el brandeo existe
    const brandeoExistente = await prisma.brandeo.findUnique({
      where: { id },
    });
    if (!brandeoExistente) {
      return NextResponse.json(
        { error: "Brandeo no encontrado" },
        { status: 404 }
      );
    }

    // Validaciones
    if (!numero || !instructorId || !periodoId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: numero, instructorId, periodoId" },
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

    // Verificar que no existe otro brandeo con el mismo número en el mismo periodo
    const brandeoDuplicado = await prisma.brandeo.findFirst({
      where: {
        numero,
        periodoId,
        id: { not: id }, // Excluir el brandeo actual
      },
    });
    if (brandeoDuplicado) {
      return NextResponse.json(
        { error: "Ya existe un brandeo con este número en el periodo especificado" },
        { status: 409 }
      );
    }

    // Actualizar el brandeo
    const brandeo = await prisma.brandeo.update({
      where: { id },
      data: {
        numero,
        instructorId,
        periodoId,
        comentarios,
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

    return NextResponse.json(brandeo);
  } catch (error) {
    console.error("Error al actualizar brandeo:", error);
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

    // Verificar que el brandeo existe
    const brandeo = await prisma.brandeo.findUnique({
      where: { id },
    });
    if (!brandeo) {
      return NextResponse.json(
        { error: "Brandeo no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el brandeo
    await prisma.brandeo.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Brandeo eliminado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar brandeo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 