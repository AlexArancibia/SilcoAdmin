import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// import { calcularPago } from "../../../../../utils/calcularPago"; // Eliminado para cálculo explícito en la ruta
import {
  determinarCategoria,
  calcularDobleteos,
  calcularHorariosNoPrime,
  calcularPenalizacion,
  calcularMetricasDisciplina,
  obtenerHora,
  calcularMetricasGenerales,
} from "../../../../../utils/calculo-helpers";
import {
  CategoriaInstructor,
  FormulaDB,
  Penalizacion,
  ResultadoCalculo,
  RequisitosCategoria,
  Clase,
} from "@/types/schema";
import { HORARIOS_NO_PRIME, mostrarCategoriaVisual } from "@/utils/config";
import { calcularPago } from "@/lib/formula-evaluator";

type ManualCategoria = {
  instructorId: number;
  disciplinaId: number;
  categoria: CategoriaInstructor;
};

export async function POST(req: Request) {
  const logs: string[] = [];
  try {
    const body = await req.json();
    let { periodoId, manualCategorias } = body as { periodoId: number; manualCategorias?: ManualCategoria[] };
    if (!manualCategorias || !Array.isArray(manualCategorias)) {
      manualCategorias = [];
    }

    if (!periodoId) {
      return NextResponse.json({ error: "periodoId es requerido" }, { status: 400 });
    }

    // Eliminar pagos con monto 0 para el periodo antes de calcular
    await prisma.pagoInstructor.deleteMany({
      where: { periodoId, monto: 0 }
    });

    // Cargar catálogos
    const disciplinasDb = await prisma.disciplina.findMany();
    const formulas: FormulaDB[] = await prisma.formula.findMany({
      where: { periodoId }
    }) as unknown as FormulaDB[];    
    
    const disciplinaMap = Object.fromEntries(disciplinasDb.map(d => [d.id, d.nombre]));

    // Cargar instructores activos con clases y penalizaciones
    const instructoresConClases = await prisma.instructor.findMany({
      where: {
        activo: true,
        clases: { some: { periodoId } },
      },
      include: {
        clases: { where: { periodoId } },
        penalizaciones: { where: { periodoId } },
        categorias: { where: { periodoId } },
        covers: { where: { periodoId } },
      },
    });

    logs.push(`Iniciando cálculo para ${instructoresConClases.length} instructores en el periodo ${periodoId}`);
    const disciplinaSiclo = disciplinasDb.find((d) => d.nombre === "Síclo")
    const sicloId = disciplinaSiclo ? disciplinaSiclo.id : null

    for (const instructor of instructoresConClases) {
 
      const clasesDelInstructor = instructor.clases as Clase[];
      const penalizacionesDelInstructor = instructor.penalizaciones as Penalizacion[];
      const clasesPorDisciplina = clasesDelInstructor.reduce((acc, clase) => {
        const disciplinaId = clase.disciplinaId;
        if (!acc[disciplinaId]) acc[disciplinaId] = [];
        acc[disciplinaId].push(clase);
        return acc;
      }, {} as Record<number, Clase[]>);


      const pagoExistente = await prisma.pagoInstructor.findUnique({
        where: {
          instructorId_periodoId: {
            instructorId: instructor.id,
            periodoId: periodoId,
          },
        },
      });

      if (pagoExistente && pagoExistente.estado === "APROBADO") {
        console.log(`⚠️ Pago ya aprobado, manteniendo valores existentes`, instructor.id)
        continue
      }

      // Número de disciplinas únicas en las que dictó clases este periodo
      const disciplinasUnicas = [...new Set(clasesDelInstructor.map(clase => clase.disciplinaId))];
      let montoTotal = 0
      const detallesClases = []
      

      for (const disciplinaId of disciplinasUnicas) {
        const clasesDisciplina = clasesDelInstructor.filter((c) => c.disciplinaId === disciplinaId)
        const disciplina = disciplinasDb.find((d) => d.id === disciplinaId)
        
        if (!disciplina) continue
        
        
        const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodoId)
        if (!formula) continue
        
        // Obtener categoría del instructor
        let categoriaInstructor: CategoriaInstructor;

        const categoriaManual = manualCategorias.find(
          (c) => c.instructorId === instructor.id && c.disciplinaId === disciplinaId,
        );

        if (categoriaManual) {
          categoriaInstructor = categoriaManual.categoria as CategoriaInstructor;
        } else {
          const categoriaInfo = instructor.categorias?.find(
            (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId,
          );
          categoriaInstructor = (categoriaInfo?.categoria as CategoriaInstructor) || "INSTRUCTOR" as const;
        }

        for (const clase of clasesDisciplina) {
          try {
            const esFullHouse = instructor.covers?.some(
              c => c.claseId === clase.id && c.periodoId === periodoId && c.pagoFullHouse === true
            );
        
            let claseParaCalculo = { ...clase };
        
            if (esFullHouse) {
              claseParaCalculo = {
                ...claseParaCalculo,
                reservasTotales: claseParaCalculo.lugares, // Forzar 100% ocupación
              };
              logs.push(`🏠 FULL HOUSE: Clase ${clase.id} se considera al 100% de ocupación`, String(instructor.id));
            }
        
            if (clase.esVersus && clase.vsNum && clase.vsNum > 1) {
              const reservasAjustadas = claseParaCalculo.reservasTotales * clase.vsNum;
              const lugaresAjustados = claseParaCalculo.lugares * clase.vsNum;
        
              claseParaCalculo = {
                          ...claseParaCalculo,
                          reservasTotales: reservasAjustadas,
                          lugares: lugaresAjustados,
                        };
        
              logs.push(`⚖️ CLASE VS: Ajustando para cálculo: Reservas ${clase.reservasTotales} x ${clase.vsNum} = ${reservasAjustadas}, Lugares ${clase.lugares} x ${clase.vsNum} = ${lugaresAjustados}`, String(instructor.id));
            }
        
            const resultado = calcularPago(claseParaCalculo, categoriaInstructor, formula);
            let detalleCalculo = resultado.detalleCalculo;
              if (esFullHouse) {
                detalleCalculo = `FULL HOUSE (ocupación forzada al 100%) - ${detalleCalculo}`;
              }
               let montoPagoFinal = resultado.montoPago;
                      if (clase.esVersus && clase.vsNum && clase.vsNum > 1) {
                        montoPagoFinal = resultado.montoPago / clase.vsNum;
                        logs.push(
                          `⚖️ CLASE VS: Dividiendo pago entre ${clase.vsNum} instructores: ${resultado.montoPago.toFixed(2)} / ${clase.vsNum} = ${montoPagoFinal.toFixed(2)}`,
                          String(instructor.id)  
                        );
                      }
        
                      montoTotal += montoPagoFinal;
        
                      logs.push(
                        `💰 PAGO POR CLASE [${clase.id}]: ${disciplina.nombre} - ${new Date(clase.fecha).toLocaleDateString()} ${obtenerHora(clase.fecha)}` +
                          `\n   Monto: ${Number(montoPagoFinal).toFixed(2)} | Categoría: ${categoriaInstructor}` +
                          `\n   Reservas: ${claseParaCalculo.reservasTotales}/${claseParaCalculo.lugares} (${Math.round((claseParaCalculo.reservasTotales / claseParaCalculo.lugares) * 100)}% ocupación)` +
                          (clase.esVersus ? `\n   Versus: Sí (${clase.vsNum} instructores)` : "") +
                          (esFullHouse ? `\n   FULL HOUSE: Sí` : "") +
                          `\n   Detalle: ${resultado.detalleCalculo}`,
                        String(instructor.id) ,
                      );
        
                      // Check if this is a non-prime hour class
                      const hora = obtenerHora(clase.fecha);
                      const estudio = clase.estudio || "";
                      let esNoPrime = false;
        
                      for (const [estudioConfig, horarios] of Object.entries(HORARIOS_NO_PRIME)) {
                        if (estudio.toLowerCase().includes(estudioConfig.toLowerCase()) && horarios[hora]) {
                          esNoPrime = true;
                          break;
                        }
                      }
        
                      if (esNoPrime) {
                        logs.push(
                          `⏱️ HORARIO NO PRIME: ${disciplina.nombre} - ${new Date(clase.fecha).toLocaleDateString()} ${hora}` +
                            `\n   Estudio: ${estudio} | Hora: ${hora}`,
                          String(instructor.id),
                        );
                      }
        
                      detallesClases.push({
                        claseId: clase.id,
                        montoCalculado: montoPagoFinal,
                        disciplinaId: clase.disciplinaId,
                        disciplinaNombre: disciplina.nombre,
                        fechaClase: clase.fecha,
                        detalleCalculo: resultado.detalleCalculo + (esFullHouse ? " (FULL HOUSE)" : ""),
                        categoria: categoriaInstructor,
                        esVersus: clase.esVersus,
                        vsNum: clase.vsNum,
                        esFullHouse: esFullHouse || false,
                      });
                    } catch (error) {
                      logs.push(`Error al calcular pago para clase ${clase.id}`, String(instructor.id));
                    }
                  }
                }


      const metricasGenerales = calcularMetricasGenerales(clasesDelInstructor, sicloId)
      const horariosNoPrime = metricasGenerales.horariosNoPrime
      const totalClases = metricasGenerales.totalClases
      const totalReservas = metricasGenerales.totalReservas
      const totalLugares = metricasGenerales.totalLugares
      const ocupacionPromedio = metricasGenerales.ocupacionPromedio
      const dobleteos = metricasGenerales.dobleteos
      const clasesPorSemana = metricasGenerales.clasesPorSemana
      let pagoTotalInstructor = 0;
      let retencionTotalInstructor = 0;
 

      // Penalización global del instructor (sobre todas sus clases)
      const penalizacionResumen = calcularPenalizacion(clasesDelInstructor, penalizacionesDelInstructor, disciplinasDb);

      const coverTotal = 0 * 80;
      const subtotal = montoTotal + 
                          (pagoExistente?.reajuste || 0) + 
                          (pagoExistente?.bono || 0) + 
                          coverTotal;

      const descuentoPenalizacion = penalizacionResumen.descuento || 0;
      const montoDescuento = pagoTotalInstructor * (descuentoPenalizacion / 100);
      const montoFinal = pagoTotalInstructor - montoDescuento;
      const retencion = montoFinal * 0.08; // 8% retención
      const pagoFinal = montoFinal - retencion;

 

      // Guardar/actualizar pago del instructor
    
      const detallesInstructor = {
        clases: detallesClases,
        penalizaciones: penalizacionResumen,
        resumen: {
          totalClases: clasesDelInstructor.length,
          totalMonto: pagoTotalInstructor,
          descuentoPenalizacion,
          montoDescuento,
          retencion,
          pagoFinal,
          categorias: [],
          comentarios: `Calculado el ${new Date().toLocaleDateString()}`,
        },
      };
      if (pagoExistente) {
        await prisma.pagoInstructor.update({
          where: { id: pagoExistente.id },
          data: {
            monto: pagoTotalInstructor,
            bono: 0,
            reajuste: pagoExistente.reajuste,
            penalizacion: descuentoPenalizacion,
            tipoReajuste: pagoExistente.tipoReajuste,
            retencion,
            pagoFinal,
            dobleteos,
            cover: coverTotal,
            horariosNoPrime,
            detalles: detallesInstructor,
          },
        });
        logs.push(`[OK] Pago actualizado para ${instructor.nombre}`);
      } else {
        await prisma.pagoInstructor.create({
          data: {
            instructorId: instructor.id,
            periodoId,
            monto: pagoTotalInstructor,
            bono: 0,
            retencion,
            reajuste: 0,
            tipoReajuste: "FIJO",
            pagoFinal,
            dobleteos,
            cover: coverTotal,
            horariosNoPrime,
            participacionEventos: true,
            cumpleLineamientos: true,
            penalizacion: descuentoPenalizacion,
            estado: "PENDIENTE",
            detalles: detallesInstructor,
          },
        });
        logs.push(`[OK] Nuevo pago creado para ${instructor.nombre}`);
      }
    }

    return NextResponse.json({ message: "Cálculo completado para todos los instructores.", logs });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
 
 
 