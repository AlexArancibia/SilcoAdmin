import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WorkshopsQueryParams } from "@/types/schema";

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
    
    if (searchParams.get("nombre")) {
      where.nombre = {
        contains: searchParams.get("nombre")!,
        mode: "insensitive",
      };
    }
    
    if (searchParams.get("fechaDesde") || searchParams.get("fechaHasta")) {
      where.fecha = {};
      if (searchParams.get("fechaDesde")) {
        where.fecha.gte = new Date(searchParams.get("fechaDesde")!);
      }
      if (searchParams.get("fechaHasta")) {
        where.fecha.lte = new Date(searchParams.get("fechaHasta")!);
      }
    }
    
    if (searchParams.get("busqueda")) {
      const busqueda = searchParams.get("busqueda")!;
      where.OR = [
        {
          nombre: {
            contains: busqueda,
            mode: "insensitive",
          },
        },
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
    const total = await prisma.workshop.count({ where });

    // Obtener workshops con relaciones
    const workshops = await prisma.workshop.findMany({
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
        fecha: "desc",
      },
      skip: offset,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: workshops,
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
    console.error("Error al obtener workshops:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre, instructorId, periodoId, fecha, comentarios, pago } = body;

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

    // Crear el workshop
    const workshop = await prisma.workshop.create({
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

    return NextResponse.json(workshop, { status: 201 });
  } catch (error) {
    console.error("Error al crear workshop:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 