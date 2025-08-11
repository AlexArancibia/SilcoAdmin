import { prisma } from "@/lib/prisma";
import { calcularPago } from "@/lib/formula-evaluator";
import {
  CategoriaInstructor,
  FormulaDB,
  Penalizacion,
  Clase,
  PagoInstructor,
} from "@/types/schema";
import { HORARIOS_NO_PRIME } from "@/utils/config";
import { obtenerHora } from "./calculo-helpers";

export interface CalculoClaseResult {
  claseId: string;
  montoCalculado: number;
  disciplinaId: number;
  disciplinaNombre: string;
  fechaClase: Date;
  detalleCalculo: string;
  categoria: CategoriaInstructor;
  esVersus: boolean;
  vsNum?: number | null;
  esFullHouse: boolean;
}

export interface CalculoPagoResult {
  montoTotal: number;
  detallesClases: CalculoClaseResult[];
  logs: string[];
}

/**
 * Calcula el pago para una clase individual
 */
export function calcularPagoClase(
  clase: Clase,
  categoriaInstructor: CategoriaInstructor,
  formula: FormulaDB,
  disciplina: { id: number; nombre: string },
  logs: string[] = []
): CalculoClaseResult {
  try {
    logs.push(`🧮 Calculando pago para clase ${clase.id}...`);
    
    let claseParaCalculo = { ...clase };
    let esFullHousePorCover = false;

    // Verificar Full House por cover
    if (clase.textoEspecial?.toLowerCase().includes("full house")) {
      esFullHousePorCover = true;
      claseParaCalculo = {
        ...claseParaCalculo,
        reservasTotales: claseParaCalculo.lugares, // Forzar 100% ocupación
      };
      logs.push(`🏠 FULL HOUSE por cover detectado para clase ${clase.id}`);
    }

    // Verificar Versus
    if (clase.esVersus && clase.vsNum && clase.vsNum > 1) {
      logs.push(`⚖️ Clase VERSUS detectada (${clase.vsNum} instructores)`);
      logs.push(`   Reservas originales: ${claseParaCalculo.reservasTotales}`);
      logs.push(`   Lugares originales: ${claseParaCalculo.lugares}`);
      logs.push(`   Nota: El cálculo se hará con las reservas originales y luego se dividirá entre ${clase.vsNum} instructores`);
    } else {
      logs.push(`⚖️ Versus: NO`);
    }

    logs.push(`🧮 Ejecutando cálculo de pago...`);
    logs.push(`   📊 Datos finales para cálculo:`);
    logs.push(`   - Reservas: ${claseParaCalculo.reservasTotales}`);
    logs.push(`   - Lugares: ${claseParaCalculo.lugares}`);
    logs.push(`   - Categoría: ${categoriaInstructor}`);
    logs.push(`   - Fórmula ID: ${formula.id}`);

    const resultado = calcularPago(claseParaCalculo, categoriaInstructor, formula);
    logs.push(`✅ Resultado del cálculo: ${resultado.montoPago.toFixed(2)}`);
    logs.push(`📝 Detalle: ${resultado.detalleCalculo}`);

    let detalleCalculo = resultado.detalleCalculo;
    if (esFullHousePorCover) {
      detalleCalculo = `FULL HOUSE por cover (ocupación forzada al 100%) - ${detalleCalculo}`;
    }

    let montoPagoFinal = resultado.montoPago;
    logs.push(`💰 Monto inicial: ${montoPagoFinal.toFixed(2)}`);

    if (clase.esVersus && clase.vsNum && clase.vsNum > 1) {
      const montoAnterior = montoPagoFinal;
      montoPagoFinal = resultado.montoPago / clase.vsNum;
      logs.push(`⚖️ Dividiendo por VERSUS: ${montoAnterior.toFixed(2)} / ${clase.vsNum} = ${montoPagoFinal.toFixed(2)}`);
    }

    logs.push(`💰 PAGO POR CLASE [${clase.id}]: ${disciplina.nombre} - ${new Date(clase.fecha).toLocaleDateString()} ${obtenerHora(clase.fecha)}` +
      `\n   Monto: ${Number(montoPagoFinal).toFixed(2)} | Categoría: ${categoriaInstructor}` +
      `\n   Reservas: ${claseParaCalculo.reservasTotales}/${claseParaCalculo.lugares} (${Math.round((claseParaCalculo.reservasTotales / claseParaCalculo.lugares) * 100)}% ocupación)` +
      (clase.esVersus ? `\n   Versus: Sí (${clase.vsNum} instructores)` : "") +
      (esFullHousePorCover ? `\n   FULL HOUSE por cover: Sí` : "") +
      `\n   Detalle: ${resultado.detalleCalculo}`);

    // Verificar horario no prime
    const hora = obtenerHora(clase.fecha);
    const estudio = clase.estudio || "";
    let esNoPrime = false;

    logs.push(`⏰ Verificando horario no prime: ${hora} en estudio '${estudio}'`);

    for (const [estudioConfig, horarios] of Object.entries(HORARIOS_NO_PRIME)) {
      if (estudio.toLowerCase().includes(estudioConfig.toLowerCase()) && horarios[hora]) {
        esNoPrime = true;
        logs.push(`✅ Horario NO PRIME detectado: ${estudioConfig} - ${hora}`);
        break;
      }
    }

    if (!esNoPrime) {
      logs.push(`✅ Horario PRIME: ${hora}`);
    }

    if (esNoPrime) {
      logs.push(`⏱️ HORARIO NO PRIME: ${disciplina.nombre} - ${new Date(clase.fecha).toLocaleDateString()} ${hora}` +
        `\n   Estudio: ${estudio} | Hora: ${hora}`);
    }

    return {
      claseId: clase.id,
      montoCalculado: montoPagoFinal,
      disciplinaId: clase.disciplinaId,
      disciplinaNombre: disciplina.nombre,
      fechaClase: clase.fecha,
      detalleCalculo: resultado.detalleCalculo + (esFullHousePorCover ? " (FULL HOUSE por cover)" : ""),
      categoria: categoriaInstructor,
      esVersus: clase.esVersus,
      vsNum: clase.vsNum,
      esFullHouse: esFullHousePorCover || false,
    };
  } catch (error) {
    logs.push(`❌ Error al calcular pago para clase ${clase.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    throw error;
  }
}

/**
 * Calcula el pago completo para un instructor
 */
export async function calcularPagoInstructor(
  instructorId: number,
  periodoId: number,
  categoriasManuales: Record<string, CategoriaInstructor> = {},
  logs: string[] = []
): Promise<CalculoPagoResult> {
  try {
    logs.push(`🚀 Iniciando cálculo para instructor ID: ${instructorId}, Período ID: ${periodoId}`);

    // Cargar catálogos
    logs.push("📚 Cargando catálogos de disciplinas...");
    const disciplinasDb = await prisma.disciplina.findMany();
    logs.push(`✅ Cargadas ${disciplinasDb.length} disciplinas: ${disciplinasDb.map(d => `${d.id}:${d.nombre}`).join(', ')}`);

    logs.push("📐 Cargando fórmulas...");
    const formulas: FormulaDB[] = await prisma.formula.findMany({
      where: { periodoId }
    }) as unknown as FormulaDB[];
    logs.push(`✅ Cargadas ${formulas.length} fórmulas para el periodo ${periodoId}`);

    const disciplinaMap = Object.fromEntries(disciplinasDb.map(d => [d.id, d.nombre]));

    const instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
      include: {
        clases: { where: { periodoId } },
        penalizaciones: { where: { periodoId } },
        categorias: { where: { periodoId } },
        coversComoReemplazo: { where: { periodoId } },
        brandeos: { where: { periodoId } },
        themeRides: { where: { periodoId } },
        workshops: { where: { periodoId } },
      },
    });

    if (!instructor) {
      throw new Error("Instructor no encontrado");
    }

    const clasesDelInstructor = instructor.clases as Clase[];
    const penalizacionesDelInstructor = instructor.penalizaciones as Penalizacion[];

    logs.push(`📝 Clases del instructor: ${clasesDelInstructor.length}`);
    logs.push(`⚠️ Penalizaciones del instructor: ${penalizacionesDelInstructor.length}`);

    if (clasesDelInstructor.length === 0) {
      logs.push("❌ No hay clases para este instructor en este periodo");
      throw new Error("No hay clases para este instructor en este periodo");
    }

    // Verificar pago existente
    logs.push(`🔍 Verificando pago existente para instructor ${instructor.id}...`);
    const pagoExistente = await prisma.pagoInstructor.findUnique({
      where: {
        instructorId_periodoId: {
          instructorId: instructor.id,
          periodoId: periodoId,
        },
      },
    });

    if (pagoExistente) {
      logs.push(`📋 Pago existente encontrado: ID ${pagoExistente.id}, Estado: ${pagoExistente.estado}`);
    } else {
      logs.push(`📋 No se encontró pago existente para este instructor y periodo`);
    }

    // Calcular pagos por clase
    let montoTotal = 0;
    const detallesClases: CalculoClaseResult[] = [];

    // Agrupar clases por disciplina
    const clasesPorDisciplina = new Map<number, Clase[]>();
    clasesDelInstructor.forEach(clase => {
      if (!clasesPorDisciplina.has(clase.disciplinaId)) {
        clasesPorDisciplina.set(clase.disciplinaId, []);
      }
      clasesPorDisciplina.get(clase.disciplinaId)!.push(clase);
    });

    // Calcular por cada disciplina
    for (const [disciplinaId, clasesDisciplina] of clasesPorDisciplina) {
      const disciplina = disciplinasDb.find(d => d.id === disciplinaId);
      if (!disciplina) {
        logs.push(`⚠️ Disciplina ${disciplinaId} no encontrada, saltando...`);
        continue;
      }

      const formula = formulas.find(f => f.disciplinaId === disciplinaId && f.periodoId === periodoId);
      if (!formula) {
        logs.push(`⚠️ No se encontró fórmula para disciplina ${disciplina.nombre}, saltando...`);
        continue;
      }

      // Obtener categoría del instructor
      let categoriaInstructor: CategoriaInstructor;
      const categoriaManual = categoriasManuales[`${instructorId}-${disciplinaId}`];
      
      if (categoriaManual) {
        categoriaInstructor = categoriaManual;
        logs.push(`📋 Categoría manual asignada para ${disciplina.nombre}: ${categoriaInstructor}`);
      } else {
        const categoriaInfo = instructor.categorias?.find(
          c => c.disciplinaId === disciplinaId && c.periodoId === periodoId,
        );
        categoriaInstructor = (categoriaInfo?.categoria as CategoriaInstructor) || "INSTRUCTOR";
        logs.push(`📋 Categoría automática para ${disciplina.nombre}: ${categoriaInstructor}`);
      }

      // Calcular pago por cada clase
      for (const clase of clasesDisciplina) {
        try {
          const resultadoClase = calcularPagoClase(
            clase,
            categoriaInstructor,
            formula,
            disciplina,
            logs
          );

          montoTotal += resultadoClase.montoCalculado;
          detallesClases.push(resultadoClase);
          logs.push(`📈 Monto acumulado: ${montoTotal.toFixed(2)}`);
          logs.push(`📋 Detalle de clase agregado al resumen`);
        } catch (error) {
          logs.push(`❌ Error al calcular pago para clase ${clase.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }
    }

    logs.push(`💰 Monto total por clases: ${montoTotal.toFixed(2)}`);

    return {
      montoTotal,
      detallesClases,
      logs,
    };
  } catch (error) {
    logs.push(`❌ Error en cálculo de pago: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    throw error;
  }
}

/**
 * Calcula los bonos adicionales para un instructor
 */
export function calcularBonosAdicionales(
  instructor: any,
  periodoId: number,
  logs: string[] = []
): {
  bonoCovers: number;
  bonoBrandeos: number;
  bonoThemeRides: number;
  bonoWorkshops: number;
  bonoVersus: number;
} {
  const coversComoReemplazo = instructor.coversComoReemplazo || [];
  const brandeosDelInstructor = instructor.brandeos || [];
  const themeRidesDelInstructor = instructor.themeRides || [];
  const workshopsDelInstructor = instructor.workshops || [];

  logs.push(`🔄 Covers como reemplazo: ${coversComoReemplazo.length}`);
  logs.push(`🏆 Brandeos del instructor: ${brandeosDelInstructor.length}`);
  logs.push(`⚡ Theme Rides del instructor: ${themeRidesDelInstructor.length}`);
  logs.push(`🎓 Workshops del instructor: ${workshopsDelInstructor.length}`);

  // Calcular bono de covers
  const coversConBono = coversComoReemplazo.filter((cover: any) => cover.pagoBono);
  const bonoCovers = coversConBono.length * 30;
  logs.push(`🔄 Covers con bono: ${coversConBono.length} x S/.30 = S/.${bonoCovers}`);

  // Calcular bono de brandeos
  const bonoBrandeos = brandeosDelInstructor.length * 50;
  logs.push(`🏆 Brandeos: ${brandeosDelInstructor.length} x S/.50 = S/.${bonoBrandeos}`);

  // Calcular bono de theme rides
  const bonoThemeRides = themeRidesDelInstructor.length * 40;
  logs.push(`⚡ Theme Rides: ${themeRidesDelInstructor.length} x S/.40 = S/.${bonoThemeRides}`);

  // Calcular bono de workshops
  const bonoWorkshops = workshopsDelInstructor.reduce((total: number, workshop: any) => total + workshop.pago, 0);
  logs.push(`🎓 Workshops: S/.${bonoWorkshops.toFixed(2)}`);

  // Calcular bono de versus (se calcula por clase, no por instructor)
  const bonoVersus = 0; // Se calcula en el proceso principal

  return {
    bonoCovers,
    bonoBrandeos,
    bonoThemeRides,
    bonoWorkshops,
    bonoVersus,
  };
} 