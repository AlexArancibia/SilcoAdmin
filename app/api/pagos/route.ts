import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { PagosQueryParams, PaginatedResponse, EstadoPago } from "@/types/schema";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse pagination parameters
    const page = Number(searchParams.get("page")) || 1;
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 100); // Max 100 items per page
    const offset = (page - 1) * limit;

    // Parse filter parameters
    const periodoId = searchParams.get("periodoId");
    const periodoInicio = searchParams.get("periodoInicio"); // Nuevo: rango inicio
    const periodoFin = searchParams.get("periodoFin"); // Nuevo: rango fin
    const instructorId = searchParams.get("instructorId");
    const disciplinaId = searchParams.get("disciplinaId");
    const semana = searchParams.get("semana");
    const estudio = searchParams.get("estudio");
    const claseId = searchParams.get("claseId");
    const estado = searchParams.get("estado") as EstadoPago;

    // Build the where clause
    const where: Record<string, any> = {};

    // Handle period filtering with range support
    let periodoFilter: any = null;

    if (periodoId) {
      // Comportamiento existente: período individual
      const parsedPeriodoId = Number.parseInt(periodoId, 10);
      if (isNaN(parsedPeriodoId)) {
        return NextResponse.json({ error: "El periodoId debe ser un número válido" }, { status: 400 });
      }
      periodoFilter = parsedPeriodoId;
    } else if (periodoInicio || periodoFin) {
      // Nuevo comportamiento: rango de períodos
      const startId = periodoInicio ? Number.parseInt(periodoInicio, 10) : null;
      const endId = periodoFin ? Number.parseInt(periodoFin, 10) : null;

      if (periodoInicio && isNaN(startId!)) {
        return NextResponse.json({ error: "El periodoInicio debe ser un número válido" }, { status: 400 });
      }
      if (periodoFin && isNaN(endId!)) {
        return NextResponse.json({ error: "El periodoFin debe ser un número válido" }, { status: 400 });
      }

      if (startId && endId) {
        // Rango de períodos
        const minId = Math.min(startId, endId);
        const maxId = Math.max(startId, endId);
        periodoFilter = {
          gte: minId,
          lte: maxId
        };
      } else if (startId) {
        // Solo inicio especificado, tratar como período único
        periodoFilter = startId;
      } else if (endId) {
        // Solo fin especificado, usar como límite superior
        periodoFilter = {
          lte: endId
        };
      }
    }

    // Apply period filter if any
    if (periodoFilter !== null) {
      where.periodoId = periodoFilter;
    }

    // Validate and parse other numeric parameters
    if (instructorId) {
      const parsedInstructorId = Number.parseInt(instructorId, 10);
      if (isNaN(parsedInstructorId)) {
        return NextResponse.json({ error: "El instructorId debe ser un número válido" }, { status: 400 });
      }
      where.instructorId = parsedInstructorId;
    }

    // Filter by estado
    if (estado) {
      const validEstados: EstadoPago[] = ["PENDIENTE", "APROBADO", "PAGADO", "CANCELADO"];
      if (!validEstados.includes(estado)) {
        return NextResponse.json({ error: `Estado inválido. Valores permitidos: ${validEstados.join(", ")}` }, { status: 400 });
      }
      where.estado = estado;
    }

    // Filter by related clase data (disciplina, semana, estudio, claseId)
    if (disciplinaId || semana || estudio || claseId) {
      where.instructor = {
        clases: {
          some: {
            ...(disciplinaId && { disciplinaId: Number.parseInt(disciplinaId, 10) }),
            ...(semana && { semana: Number.parseInt(semana, 10) }),
            ...(estudio && { estudio: { contains: estudio, mode: 'insensitive' } }),
            ...(claseId && { id: claseId }),
          }
        }
      };
    }

    // Get total count for pagination
    const total = await prisma.pagoInstructor.count({ where });
    const totalPages = Math.ceil(total / limit);

    // Get paginated results
    const pagos = await prisma.pagoInstructor.findMany({
      where,
      include: {
        instructor: {
          include: {
            coversComoDador: true,
            coversComoReemplazo: true,
            clases: {
              where: {
                // Update to support range filtering in related clases
                ...(periodoFilter !== null ? { periodoId: periodoFilter } : {}),
              },
              include: {
                disciplina: true,
              },
            },
          },
        },
        periodo: true,
      },
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
      skip: offset,
      take: limit,
    });

    const response: PaginatedResponse<any> = {
      data: pagos,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Error interno del servidor", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requiredFields = ["monto", "instructorId", "periodoId"];
    
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return NextResponse.json({ error: `El campo ${field} es requerido` }, { status: 400 });
      }
    }

    // Convertir valores numéricos
    ["monto", "instructorId", "periodoId", "retencion", "reajuste","penalizacion","bono","cover"].forEach((field) => {
      if (body[field] !== undefined) {
        body[field] = Number(body[field]);
      }
    });

    // Validar estado
    const validEstados = ["PENDIENTE", "APROBADO", "RECHAZADO", "PAGADO"];
    if (body.estado && !validEstados.includes(body.estado)) {
      return NextResponse.json({ error: `El estado debe ser uno de: ${validEstados.join(", ")}` }, { status: 400 });
    }

    // Validar tipoReajuste
    const validTiposReajuste = ["FIJO", "PORCENTAJE"];
    if (body.tipoReajuste && !validTiposReajuste.includes(body.tipoReajuste)) {
      return NextResponse.json({ error: `El tipo de reajuste debe ser uno de: ${validTiposReajuste.join(", ")}` }, { status: 400 });
    }

    // Calcular pago final
    let pagoFinal = body.monto - (body.retencion || 0);
    if (body.reajuste) {
      pagoFinal += body.tipoReajuste === "PORCENTAJE" ? (body.monto * body.reajuste) / 100 : body.reajuste;
    }

    const pago = await prisma.pagoInstructor.create({
      data: {
        monto: body.monto,
        estado: body.estado || "PENDIENTE",
        instructorId: body.instructorId,
        periodoId: body.periodoId,
        bono:body.bono,
        detalles: body.detalles || {},
        cumpleLineamientos: body.cumpleLineamientos ?? null,
        pagoFinal:body.pagoFinal,
        dobleteos: body.dobleteos ?? null,
        horariosNoPrime: body.horariosNoPrime ?? null,
        participacionEventos: body.participacionEventos ?? null,        
        retencion: body.retencion || 0,
        reajuste: body.reajuste || 0,
        penalizacion: body.penalizacion || 0,
        cover: body.cover || 0,        
        tipoReajuste: body.tipoReajuste || "FIJO",
 
      },
      include: {
        instructor: true,
        periodo: true,
      },
    });

    return NextResponse.json(pago);
  } catch (error: any) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Error al crear el pago", details: error.message || String(error) }, { status: 500 });
  }
}
