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

    // Obtener todas las clases del instructor en el periodo, con disciplina incluida
    const clases = await prisma.clase.findMany({
      where: {
        instructorId,
        periodoId,
        fecha: {
          gte: periodo.fechaInicio,
          lte: periodo.fechaFin,
        },
      },
      include: { disciplina: true },
    });
    logs.push(`Clases encontradas: ${clases.length}`);

    // Si no hay clases, no se calcula nada ni se devuelve log
    if (clases.length === 0) {
      return new NextResponse(null, { status: 204 }); // No Content
    }

    // Obtener todas las penalizaciones del instructor en el periodo
    const penalizaciones = await prisma.penalizacion.findMany({
      where: { instructorId, periodoId },
      include: { disciplina: true },
    }) as Penalizacion[];
    logs.push(`Penalizaciones encontradas: ${penalizaciones.length}`);

    // Agrupar clases por disciplina
    const clasesPorDisciplina = clases.reduce((acc, clase) => {
      const disciplinaId = clase.disciplinaId;
      if (!acc[disciplinaId]) acc[disciplinaId] = [];
      acc[disciplinaId].push(clase);
      return acc;
    }, {} as Record<number, typeof clases>);

    // Resumen y detalles
    const resumen: any[] = [];
    const clasesDetalles: any[] = [];
    let pagoTotal = 0;
    let retencionTotal = 0;
    let montoSinRetencion = 0;
    let categoriaPorDisciplina: Record<number, string> = {};
    let metricasPorDisciplina: Record<number, any> = {};
    let penalizacionesPorDisciplina: Record<number, Penalizacion[]> = {};

    for (const disciplinaIdStr in clasesPorDisciplina) {
      const disciplinaId = parseInt(disciplinaIdStr, 10);
      const clasesDisciplina = clasesPorDisciplina[disciplinaId];
      const disciplinaObj = clasesDisciplina[0]?.disciplina;
      const penalizacionesDisciplina = penalizaciones.filter(p => p.disciplinaId === disciplinaId);
      penalizacionesPorDisciplina[disciplinaId] = penalizacionesDisciplina;

      // Métricas
      const totalClases = clasesDisciplina.length;
      const totalAsistentes = clasesDisciplina.reduce((sum, c) => sum + c.reservasPagadas, 0);
      const totalCapacidad = clasesDisciplina.reduce((sum, c) => sum + c.lugares, 0);
      const ocupacionPromedio = totalCapacidad > 0 ? (totalAsistentes / totalCapacidad) * 100 : 0;
      const localesUnicos = [...new Set(clasesDisciplina.map((c) => c.estudio))];
      const clasesPorDia = clasesDisciplina.reduce((acc, clase) => {
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
        horariosNoPrime: calcularHorariosNoPrime(clasesDisciplina, disciplinaId),
        participacionEventos: false,
        cumpleLineamientos: true,
      };
      metricasPorDisciplina[disciplinaId] = metricas;

      // Fórmula y categoría
      const formula = await prisma.formula.findFirst({ where: { disciplinaId, periodoId } }) as FormulaDB | null;
      if (!formula) {
        logs.push(`No se encontró fórmula para la disciplina ${disciplinaObj?.nombre || disciplinaId}`);
        continue;
      }
      const categoria = determinarCategoria(formula, metricas);
      categoriaPorDisciplina[disciplinaId] = categoria;
      // Calcular pago y logs
      const { pago, logs: calculoLogs, retencion, pagoSinRetencion } = calcularPago(clasesDisciplina, formula, categoria, penalizacionesDisciplina);
      montoSinRetencion += pagoSinRetencion;
      retencionTotal += retencion;
      pagoTotal += pago;
      logs.push(`[Disciplina ${disciplinaObj?.nombre || disciplinaId}]`);
      logs.push(...calculoLogs);

      // Detalles por clase
      for (const clase of clasesDisciplina) {
        clasesDetalles.push({
          id: clase.id,
          disciplina: {
            id: disciplinaObj?.id,
            nombre: disciplinaObj?.nombre,
            color: disciplinaObj?.color,
          },
          fecha: clase.fecha,
          estudio: clase.estudio,
          reservasPagadas: clase.reservasPagadas,
          reservasTotales: clase.reservasTotales,
          lugares: clase.lugares,
          pagoClase: null, // Se puede detallar usando calcularPagoClase si se requiere
        });
      }

      // Resumen por disciplina
      resumen.push({
        disciplina: {
          id: disciplinaObj?.id,
          nombre: disciplinaObj?.nombre,
          color: disciplinaObj?.color,
        },
        categoria,
        metricas,
        pago,
        penalizaciones: penalizacionesDisciplina.map(p => ({
          id: p.id,
          tipo: p.tipo,
          puntos: p.puntos,
          descripcion: p.descripcion,
          fecha: p.aplicadaEn,
        })),
      });
    }

    // Penalizaciones globales
    const penalizacionesDetalle = penalizaciones.map(p => ({
      id: p.id,
      tipo: p.tipo,
      puntos: p.puntos,
      descripcion: p.descripcion,
      fecha: p.aplicadaEn,
      disciplina: p.disciplina ? { id: p.disciplina.id, nombre: p.disciplina.nombre } : null,
    }));

    // Guardar o actualizar el pago
    const pagoExistente = await prisma.pagoInstructor.findUnique({
      where: { instructorId_periodoId: { instructorId, periodoId } },
    });

    const resultado = {
      pago: pagoTotal,
      resumen,
      clasesDetalles,
      penalizaciones: penalizacionesDetalle,
      logs,
    };

    if (pagoExistente) {
      const pagoActualizado = await prisma.pagoInstructor.update({
        where: { id: pagoExistente.id },
        data: {
          monto: montoSinRetencion,
          retencion: retencionTotal,
          pagoFinal: montoSinRetencion - retencionTotal,
          detalles: resultado as any,
          estado: "PENDIENTE",
        },
      });
      (resultado as any).pagoId = pagoActualizado.id;
      logs.push(`Pago existente actualizado. ID: ${pagoActualizado.id}`);
    } else {
      const nuevoPago = await prisma.pagoInstructor.create({
        data: {
          instructorId,
          periodoId,
          monto: montoSinRetencion,
          retencion: retencionTotal,
          pagoFinal: montoSinRetencion - retencionTotal,
          detalles: resultado as any,
          estado: "PENDIENTE",
        },
      });
      (resultado as any).pagoId = nuevoPago.id;
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
