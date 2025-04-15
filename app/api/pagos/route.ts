import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const where: Record<string, any> = {};

    const periodoId = searchParams.get("periodoId");
    const instructorId = searchParams.get("instructorId");

    if (periodoId !== null) where.periodoId = Number(periodoId);
    if (instructorId !== null) where.instructorId = Number(instructorId);

    const pagos = await prisma.pagoInstructor.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: {
        instructor: true,
        periodo: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(pagos);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Error interno del servidor", details: error }, { status: 500 });
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
    ["monto", "instructorId", "periodoId", "retencion", "reajuste"].forEach((field) => {
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
        retencion: body.retencion || 0,
        reajuste: body.reajuste || 0,
        tipoReajuste: body.tipoReajuste || "FIJO",
        pagoFinal,
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
