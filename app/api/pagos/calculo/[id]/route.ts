import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { calcularPago } from "../../../../../utils/calcularPago";
import {
  determinarCategoria,
  calcularDobleteos,
  calcularHorariosNoPrime,
} from "../../../../../utils/calculo-helpers";
import {
  CategoriaInstructor,
  FormulaDB,
  Penalizacion,
  ResultadoCalculo,
  RequisitosCategoria,
} from "@/types/schema";

const prisma = new PrismaClient();

interface RequestBody {
  periodoId: number;
  categoriasManuales?: Record<string, CategoriaInstructor>;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const instructorId = parseInt(params.id, 10);
  const { periodoId, categoriasManuales }: RequestBody = await request.json();
  const logs: string[] = [];

  try {
    logs.push(`Iniciando cálculo para instructor ID: ${instructorId}, Período ID: ${periodoId}`);

    const instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
      include: { disciplinas: true },
    });

    const periodo = await prisma.periodo.findUnique({
      where: { id: periodoId },
    });

    if (!instructor || !periodo) {
      return NextResponse.json(
        { error: "Instructor o período no encontrado." },
        { status: 404 }
      );
    }

    // Asumimos una disciplina principal por simplicidad, esto puede necesitar ajustes
    const disciplinaPrincipal = instructor.disciplinas[0];
    if (!disciplinaPrincipal) {
      return NextResponse.json({ error: "El instructor no tiene una disciplina principal asignada." }, { status: 400 });
    }
    logs.push(`Disciplina principal: ${disciplinaPrincipal.nombre}`);

    const clases = await prisma.clase.findMany({
      where: {
        instructorId,
        disciplinaId: disciplinaPrincipal.id,
        fecha: {
          gte: periodo.fechaInicio,
          lte: periodo.fechaFin,
        },
      },
    });
    logs.push(`Clases encontradas: ${clases.length}`);

    const penalizaciones = await prisma.penalizacion.findMany({
      where: { instructorId, periodoId, disciplinaId: disciplinaPrincipal.id },
    }) as Penalizacion[];
    logs.push(`Penalizaciones encontradas: ${penalizaciones.length}`);

    const totalClases = clases.length;
    const totalAsistentes = clases.reduce((sum, c) => sum + c.reservasPagadas, 0);
    const totalCapacidad = clases.reduce((sum, c) => sum + c.lugares, 0);
    const ocupacionPromedio = totalCapacidad > 0 ? (totalAsistentes / totalCapacidad) * 100 : 0;

    const localesUnicos = [...new Set(clases.map((c) => c.estudio))];

    const clasesPorDia = clases.reduce((acc, clase) => {
      const fecha = clase.fecha.toISOString().split("T")[0];
      if (!acc[fecha]) acc[fecha] = 0;
      acc[fecha]++;
      return acc;
    }, {} as Record<string, number>);
    const totalDobleteos = Object.values(clasesPorDia).filter((c) => c > 1).length;

    const metricas = {
      totalClases,
      ocupacionPromedio,
      totalAsistentes,
      totalDobleteos,
      totalLocales: localesUnicos.length,
      horariosNoPrime: calcularHorariosNoPrime(clases, disciplinaPrincipal.id),
      participacionEventos: false, // Ajusta si tienes fuente real
      cumpleLineamientos: true, // Ajusta si tienes fuente real
    };
    logs.push(`Métricas calculadas: ${JSON.stringify(metricas)}`);

    const formula = await prisma.formula.findFirst({
      where: { disciplinaId: disciplinaPrincipal.id, periodoId },
    }) as FormulaDB | null;

    if (!formula) {
      const errorMsg = `No se encontró fórmula para la disciplina ${disciplinaPrincipal.nombre} en el período seleccionado.`;
      logs.push(errorMsg);
      return NextResponse.json({ error: errorMsg, logs }, { status: 400 });
    }
    logs.push(`Fórmula encontrada con ID: ${formula.id}`);

    const categoria = determinarCategoria(formula, metricas);
    logs.push(`Categoría determinada: ${categoria}`);

    const { pago, logs: calculoLogs } = calcularPago(clases, formula, categoria, penalizaciones);
    logs.push(...calculoLogs);

    const resultado: ResultadoCalculo = {
      pago,
      categoria,
      metricas,
      logs,
    };

    const pagoExistente = await prisma.pagoInstructor.findUnique({
      where: { instructorId_periodoId: { instructorId, periodoId } },
    });

    if (pagoExistente) {
      const pagoActualizado = await prisma.pagoInstructor.update({
        where: { id: pagoExistente.id },
        data: { monto: pago, pagoFinal: pago, detalles: resultado as any, estado: "PENDIENTE" },
      });
      resultado.pagoId = pagoActualizado.id;
      logs.push(`Pago existente actualizado. ID: ${pagoActualizado.id}`);
    } else {
      const nuevoPago = await prisma.pagoInstructor.create({
        data: {
          instructorId,
          periodoId,
          monto: pago,
          pagoFinal: pago,
          detalles: resultado as any,
          estado: "PENDIENTE",
        },
      });
      resultado.pagoId = nuevoPago.id;
      logs.push(`Nuevo pago creado. ID: ${nuevoPago.id}`);
    }

    return NextResponse.json(resultado);

  } catch (error: any) {
    console.error("Error en el cálculo de pago:", error);
    logs.push(`Error fatal en el cálculo: ${error.message}`);
    return NextResponse.json(
      { error: "Error interno del servidor.", logs },
      { status: 500 }
    );
  }
}
