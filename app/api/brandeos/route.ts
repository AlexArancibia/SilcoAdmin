import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BrandeosQueryParams } from "@/types/schema";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    
    if (searchParams.get("periodoId")) {
      where.periodoId = parseInt(searchParams.get("periodoId")!);
    }
    
    if (searchParams.get("instructorId")) {
      where.instructorId = parseInt(searchParams.get("instructorId")!);
    }
    
    if (searchParams.get("numero")) {
      where.numero = parseInt(searchParams.get("numero")!);
    }
    
    if (searchParams.get("busqueda")) {
      const busqueda = searchParams.get("busqueda")!;
      where.OR = [
        {
          instructor: {
            nombre: {
              contains: busqueda,
              mode: "insensitive",
            },
          },
        },
        {
          comentarios: {
            contains: busqueda,
            mode: "insensitive",
          },
        },
      ];
    }

    // Obtener total de registros
    const total = await prisma.brandeo.count({ where });

    // Obtener brandeos con relaciones
    const brandeos = await prisma.brandeo.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: brandeos,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error al obtener brandeos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { numero, instructorId, periodoId, comentarios } = body;

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

    // Verificar que no existe un brandeo con el mismo número en el mismo periodo
    const brandeoExistente = await prisma.brandeo.findUnique({
      where: {
        numero_periodoId: {
          numero,
          periodoId,
        },
      },
    });
    if (brandeoExistente) {
      return NextResponse.json(
        { error: "Ya existe un brandeo con este número en el periodo especificado" },
        { status: 409 }
      );
    }

    // Crear el brandeo
    const brandeo = await prisma.brandeo.create({
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

    return NextResponse.json(brandeo, { status: 201 });
  } catch (error) {
    console.error("Error al crear brandeo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 