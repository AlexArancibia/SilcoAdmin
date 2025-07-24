import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id) || NaN;
    if (isNaN(id)) return NextResponse.json({ error: "ID de pago inválido" }, { status: 400 });

    const pago = await prisma.pagoInstructor.findUnique({
  where: { id },
  include: { 
    instructor: {
      include: {
        coversComoDador: true,
        coversComoReemplazo: true
      }
    }, 
    periodo: true 
  },
});

    if (!pago) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    return NextResponse.json(pago);
  } catch (error) {
    console.error("Error fetching payment:", error);
    return NextResponse.json({ error: "Error al obtener el pago" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id) || NaN;
    if (isNaN(id)) return NextResponse.json({ error: "ID de pago inválido" }, { status: 400 });

    const body = await request.json();
    const existingPago = await prisma.pagoInstructor.findUnique({ where: { id } });
    if (!existingPago) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });

    // Convertir valores numéricos
    const monto = body.monto !== undefined ? Number(body.monto) : existingPago.monto;
    const retencion = body.retencion !== undefined ? Number(body.retencion) : existingPago.retencion;
    const reajuste = body.reajuste !== undefined ? Number(body.reajuste) : existingPago.reajuste;
    const penalizacion = body.penalizacion !== undefined ? Number(body.penalizacion) : existingPago.penalizacion;
    const cover = body.cover !== undefined ? Number(body.cover) : existingPago.cover;
    if (isNaN(monto) || isNaN(retencion) || isNaN(reajuste)) {
      return NextResponse.json({ error: "Los valores deben ser números válidos" }, { status: 400 });
    }

    // Validación de estado
    const validEstados = ["PENDIENTE", "APROBADO", "RECHAZADO", "PAGADO"];
    if (body.estado && !validEstados.includes(body.estado)) {
      return NextResponse.json({ error: `Estado inválido. Valores permitidos: ${validEstados.join(", ")}` }, { status: 400 });
    }

    // Calcular pagoFinal

    const updatedPago = await prisma.pagoInstructor.update({
      where: { id },
      data: {
        monto,
        retencion,
        reajuste,
        penalizacion,
        cover,
        bono: body.bono,
        cumpleLineamientos: body.cumpleLineamientos ?? null,
        dobleteos: body.dobleteos ?? null,
        horariosNoPrime: body.horariosNoPrime ?? null,
        participacionEventos: body.participacionEventos ?? null,
        tipoReajuste:body.tipoReajuste,
        comentarios:body.comentarios ?? null,      
        pagoFinal:body.pagoFinal,
        estado: body.estado || existingPago.estado,
        detalles: body.detalles !== undefined ? body.detalles : existingPago.detalles,
      },
      include: { instructor: true, periodo: true },
    });

    return NextResponse.json(updatedPago);
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json({ error: "Error al actualizar el pago" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id) || NaN;
    if (isNaN(id)) return NextResponse.json({ error: "ID de pago inválido" }, { status: 400 });

    const existingPago = await prisma.pagoInstructor.findUnique({ where: { id } });
    if (!existingPago) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });

    await prisma.pagoInstructor.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json({ error: "Error al eliminar el pago" }, { status: 500 });
  }
}
