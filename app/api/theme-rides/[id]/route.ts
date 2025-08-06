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

    const themeRide = await prisma.themeRide.findUnique({
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

    if (!themeRide) {
      return NextResponse.json(
        { error: "Theme ride no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(themeRide);
  } catch (error) {
    console.error("Error al obtener theme ride:", error);
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

    // Verificar que el theme ride existe
    const themeRideExistente = await prisma.themeRide.findUnique({
      where: { id },
    });
    if (!themeRideExistente) {
      return NextResponse.json(
        { error: "Theme ride no encontrado" },
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

    // Verificar que no existe otro theme ride con el mismo número en el mismo periodo
    const themeRideDuplicado = await prisma.themeRide.findFirst({
      where: {
        numero,
        periodoId,
        id: { not: id }, // Excluir el theme ride actual
      },
    });
    if (themeRideDuplicado) {
      return NextResponse.json(
        { error: "Ya existe un theme ride con este número en el periodo especificado" },
        { status: 409 }
      );
    }

    // Actualizar el theme ride
    const themeRide = await prisma.themeRide.update({
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

    return NextResponse.json(themeRide);
  } catch (error) {
    console.error("Error al actualizar theme ride:", error);
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

    // Verificar que el theme ride existe
    const themeRide = await prisma.themeRide.findUnique({
      where: { id },
    });
    if (!themeRide) {
      return NextResponse.json(
        { error: "Theme ride no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el theme ride
    await prisma.themeRide.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Theme ride eliminado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar theme ride:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 