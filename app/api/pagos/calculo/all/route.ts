import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
  Clase,
} from "@/types/schema";

export async function POST(req: Request) {
  const logs: string[] = [];
  try {
    const body = await req.json();
    const { periodoId, manualCategorias } = body;

    if (!periodoId) {
      return NextResponse.json({ error: "periodoId es requerido" }, { status: 400 });
    }

    // Eliminar pagos con monto 0 para el periodo antes de calcular
    const deleted = await prisma.pagoInstructor.deleteMany({
      where: { periodoId, monto: 0 }
    });
    logs.push(`Pagos eliminados con monto 0 antes de cálculo: ${deleted.count}`);

    // 1. Obtener instructores activos con sus clases para el período especificado
    const instructoresConClases = await prisma.instructor.findMany({
      where: {
        activo: true,
        clases: {
          some: {
            periodoId: periodoId,
          },
        },
      },
      include: {
        clases: {
          where: {
            periodoId: periodoId,
          },
        },
        penalizaciones: {
          where: {
            periodoId: periodoId,
          }
        }
      },
    });

    logs.push(`Iniciando cálculo para ${instructoresConClases.length} instructores con clases en el período ${periodoId}.`);

    for (const instructor of instructoresConClases) {
      logs.push(`\n--- Procesando a ${instructor.nombre} ---`);
      const clasesDelInstructor = instructor.clases as Clase[];
      const penalizacionesDelInstructor = instructor.penalizaciones as Penalizacion[];

      // Agrupar clases por disciplinaId
      const clasesPorDisciplina = clasesDelInstructor.reduce((acc, clase) => {
        const disciplinaId = clase.disciplinaId;
        if (!acc[disciplinaId]) {
          acc[disciplinaId] = [];
        }
        acc[disciplinaId].push(clase);
        return acc;
      }, {} as Record<number, Clase[]>);

      let pagoTotalInstructor = 0;
      let retencionTotalInstructor = 0;

      for (const disciplinaIdStr in clasesPorDisciplina) {
        const disciplinaId = parseInt(disciplinaIdStr, 10);
        const clases = clasesPorDisciplina[disciplinaId];
        logs.push(`  Disciplina ID: ${disciplinaId}, Clases: ${clases.length}`);

        const formula = await prisma.formula.findFirst({
          where: { disciplinaId, periodoId },
        }) as FormulaDB | null;

        if (!formula) {
          logs.push(`  [ERROR] No se encontró fórmula para la disciplina ${disciplinaId}.`);
          continue;
        }
        logs.push(`  Fórmula encontrada con ID: ${formula.id}`);

        // Calcular métricas para esta disciplina
        const totalClases = clases.length;
        const totalAsistentes = clases.reduce((sum, c) => sum + c.reservasPagadas, 0);
        const totalCapacidad = clases.reduce((sum, c) => sum + c.lugares, 0);
        const ocupacionPromedio = totalCapacidad > 0 ? (totalAsistentes / totalCapacidad) * 100 : 0;
        const localesUnicos = [...new Set(clases.map((c) => c.estudio))];
        const clasesPorDia = clases.reduce((acc, clase) => {
          const fecha = new Date(clase.fecha).toISOString().split("T")[0];
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
          horariosNoPrime: calcularHorariosNoPrime(clases, disciplinaId),
          participacionEventos: false,
          cumpleLineamientos: true,
        };

        const categoriaManual = manualCategorias?.find((mc: any) => 
          mc.instructorId === instructor.id && mc.disciplinaId === disciplinaId)?.categoria;
        const categoria = categoriaManual || determinarCategoria(formula, metricas);
        logs.push(`  Categoría determinada: ${categoria} ${categoriaManual ? '(Manual)' : ''}`);

        const penalizacionesDeDisciplina = penalizacionesDelInstructor.filter(p => p.disciplinaId === disciplinaId);

        const { pago, logs: calculoLogs, retencion, pagoSinRetencion } = calcularPago(
          clases, 
          formula, 
          categoria, 
          penalizacionesDeDisciplina
        );
        
        logs.push(...calculoLogs.map(l => `    > ${l}`));
        pagoTotalInstructor += pagoSinRetencion;
        retencionTotalInstructor += retencion;
      }

      // Guardar o actualizar el pago total del instructor para el período
      const pagoExistente = await prisma.pagoInstructor.findUnique({
        where: { instructorId_periodoId: { instructorId: instructor.id, periodoId } },
      });

      if (pagoExistente) {
        await prisma.pagoInstructor.update({
          where: { id: pagoExistente.id },
          data: {
            monto: pagoTotalInstructor,
            retencion: retencionTotalInstructor,
            pagoFinal: pagoTotalInstructor - retencionTotalInstructor,
            estado: "PENDIENTE",
          },
        });
        logs.push(`[SUCCESS] Pago para ${instructor.nombre} actualizado. Monto: ${pagoTotalInstructor.toFixed(2)} Retención: ${retencionTotalInstructor.toFixed(2)}`);
      } else {
        await prisma.pagoInstructor.create({
          data: {
            instructorId: instructor.id,
            periodoId,
            monto: pagoTotalInstructor,
            retencion: retencionTotalInstructor,
            pagoFinal: pagoTotalInstructor - retencionTotalInstructor,
            estado: "PENDIENTE",
          },
        });
        logs.push(`[SUCCESS] Nuevo pago para ${instructor.nombre} creado. Monto: ${pagoTotalInstructor.toFixed(2)} Retención: ${retencionTotalInstructor.toFixed(2)}`);
      }
    }

    return NextResponse.json({ 
      message: "Cálculo completado para todos los instructores.", 
      logs 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}