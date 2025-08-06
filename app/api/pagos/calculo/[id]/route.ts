import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
        coversComoReemplazo: { where: { periodoId } }, // Cargar covers donde es instructor de reemplazo
        brandeos: { where: { periodoId } }, // Cargar brandeos del instructor
        themeRides: { where: { periodoId } }, // Cargar theme rides del instructor
        workshops: { where: { periodoId } }, // Cargar workshops del instructor
      },
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

    const clasesDelInstructor = instructor.clases as Clase[];
    const penalizacionesDelInstructor = instructor.penalizaciones as Penalizacion[];
    const coversComoReemplazo = instructor.coversComoReemplazo || [];
    const brandeosDelInstructor = instructor.brandeos || [];
    const themeRidesDelInstructor = instructor.themeRides || [];
    const workshopsDelInstructor = instructor.workshops || [];
    
    logs.push(`📝 Clases del instructor: ${clasesDelInstructor.length}`);
    logs.push(`⚠️ Penalizaciones del instructor: ${penalizacionesDelInstructor.length}`);
    logs.push(`🔄 Covers como reemplazo: ${coversComoReemplazo.length}`);
    logs.push(`🏆 Brandeos del instructor: ${brandeosDelInstructor.length}`);
    logs.push(`⚡ Theme Rides del instructor: ${themeRidesDelInstructor.length}`);
    logs.push(`🎓 Workshops del instructor: ${workshopsDelInstructor.length}`);

    // Si no hay clases, no se calcula nada
    if (clasesDelInstructor.length === 0) {
      logs.push("❌ No hay clases para este instructor en este periodo");
      return NextResponse.json({ 
        error: "No hay clases para este instructor en este periodo",
        logs 
      }, { status: 404 });
    }

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
      logs.push(`💰 Pago existente encontrado: ID ${pagoExistente.id}, Estado: ${pagoExistente.estado}, Monto: ${pagoExistente.monto}`);
    } else {
      logs.push(`📭 No existe pago previo para este instructor en este periodo`);
    }

    const clasesPorDisciplina = clasesDelInstructor.reduce((acc, clase) => {
      const disciplinaId = clase.disciplinaId;
      if (!acc[disciplinaId]) acc[disciplinaId] = [];
      acc[disciplinaId].push(clase);
      return acc;
    }, {} as Record<number, Clase[]>);

    logs.push(`📊 Clases agrupadas por disciplina:`);
    Object.entries(clasesPorDisciplina).forEach(([disciplinaId, clases]) => {
      const disciplinaNombre = disciplinaMap[parseInt(disciplinaId)] || 'Desconocida';
      logs.push(`   - ${disciplinaNombre} (ID: ${disciplinaId}): ${clases.length} clases`);
    });

    // Número de disciplinas únicas en las que dictó clases este periodo
    const disciplinasUnicas = [...new Set(clasesDelInstructor.map(clase => clase.disciplinaId))];
    logs.push(`🎯 Disciplinas únicas del instructor: ${disciplinasUnicas.length} (IDs: ${disciplinasUnicas.join(', ')})`);
    
    let montoTotal = 0;
    const detallesClases = [];
    logs.push(`💵 Iniciando cálculo de montos por disciplina...`);

    const disciplinaSiclo = disciplinasDb.find((d) => d.nombre === "Síclo");
    const sicloId = disciplinaSiclo ? disciplinaSiclo.id : null;

    for (const disciplinaId of disciplinasUnicas) {
      logs.push(`\n📚 PROCESANDO DISCIPLINA ID: ${disciplinaId}`);
      
      const clasesDisciplina = clasesDelInstructor.filter((c) => c.disciplinaId === disciplinaId);
      const disciplina = disciplinasDb.find((d) => d.id === disciplinaId);
      
      logs.push(`📋 Clases en esta disciplina: ${clasesDisciplina.length}`);
      
      if (!disciplina) {
        logs.push(`❌ Disciplina no encontrada para ID ${disciplinaId}, saltando`);
        continue;
      }
      
      logs.push(`✅ Disciplina encontrada: ${disciplina.nombre}`);
      
      const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodoId);
      if (!formula) {
        logs.push(`❌ Fórmula no encontrada para disciplina ${disciplina.nombre} en periodo ${periodoId}, saltando`);
        continue;
      }
      
      logs.push(`📐 Fórmula encontrada para ${disciplina.nombre}: ID ${formula.id}`);
      
      // Obtener categoría del instructor
      let categoriaInstructor: CategoriaInstructor;

      const categoriaManual = categoriasManuales && Object.entries(categoriasManuales).find(
        ([key, categoria]) => {
          const [instrId, discId] = key.split('-').map(Number);
          return instrId === instructor.id && discId === disciplinaId;
        }
      );

      if (categoriaManual) {
        categoriaInstructor = categoriaManual[1] as CategoriaInstructor;
        logs.push(`🎭 Categoría manual asignada: ${categoriaInstructor}`);
      } else {
        const categoriaInfo = instructor.categorias?.find(
          (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId,
        );
        categoriaInstructor = (categoriaInfo?.categoria as CategoriaInstructor) || "INSTRUCTOR" as const;
        logs.push(`🎭 Categoría ${categoriaInfo ? 'de BD' : 'por defecto'}: ${categoriaInstructor}`);
      }

      logs.push(`\n🔄 Procesando ${clasesDisciplina.length} clases de ${disciplina.nombre}...`);
      
      for (const clase of clasesDisciplina) {
        logs.push(`\n📅 CLASE ID: ${clase.id} - Fecha: ${new Date(clase.fecha).toLocaleDateString()} ${obtenerHora(clase.fecha)}`);
        logs.push(`   📊 Reservas: ${clase.reservasTotales}/${clase.lugares} (${Math.round((clase.reservasTotales / clase.lugares) * 100)}%)`);
        
        try {
          // Verificar Full House (comentado por ahora)
          const esFullHouse = false;
          logs.push(`🏠 Full House: ${esFullHouse ? 'SÍ' : 'NO'}`);
      
          let claseParaCalculo = { ...clase };
      
          if (esFullHouse) {
            logs.push(`🏠 Aplicando FULL HOUSE: Reservas ${clase.reservasTotales} -> ${clase.lugares} (100% ocupación)`);
            claseParaCalculo = {
              ...claseParaCalculo,
              reservasTotales: claseParaCalculo.lugares,
            };
          }
      
          // Verificar Versus
          if (clase.esVersus && clase.vsNum && clase.vsNum > 1) {
            const reservasOriginales = claseParaCalculo.reservasTotales;
            const lugaresOriginales = claseParaCalculo.lugares;
            const reservasAjustadas = claseParaCalculo.reservasTotales * clase.vsNum;
            const lugaresAjustados = claseParaCalculo.lugares * clase.vsNum;
      
            logs.push(`⚖️ Aplicando VERSUS (${clase.vsNum} instructores):`);
            logs.push(`   Reservas: ${reservasOriginales} x ${clase.vsNum} = ${reservasAjustadas}`);
            logs.push(`   Lugares: ${lugaresOriginales} x ${clase.vsNum} = ${lugaresAjustados}`);
            
            claseParaCalculo = {
              ...claseParaCalculo,
              reservasTotales: reservasAjustadas,
              lugares: lugaresAjustados,
            };
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
          if (esFullHouse) {
            detalleCalculo = `FULL HOUSE (ocupación forzada al 100%) - ${detalleCalculo}`;
          }
          
          let montoPagoFinal = resultado.montoPago;
          logs.push(`💰 Monto inicial: ${montoPagoFinal.toFixed(2)}`);
          
          if (clase.esVersus && clase.vsNum && clase.vsNum > 1) {
            const montoAnterior = montoPagoFinal;
            montoPagoFinal = resultado.montoPago / clase.vsNum;
            logs.push(`⚖️ Dividiendo por VERSUS: ${montoAnterior.toFixed(2)} / ${clase.vsNum} = ${montoPagoFinal.toFixed(2)}`);
          }

          montoTotal += montoPagoFinal;
          logs.push(`📈 Monto acumulado: ${montoTotal.toFixed(2)}`);

          // Check if this is a non-prime hour class
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
          
          logs.push(`📋 Detalle de clase agregado al resumen`);
        } catch (error) {
          logs.push(`❌ Error al calcular pago para clase ${clase.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }
    }

    logs.push(`\n🧮 CALCULANDO MÉTRICAS GENERALES para instructor ${instructor.id}...`);
    const metricasGenerales = calcularMetricasGenerales(clasesDelInstructor, sicloId);
    logs.push(`📊 Métricas generales calculadas:`);
    logs.push(`   - Total clases: ${metricasGenerales.totalClases}`);
    logs.push(`   - Total reservas: ${metricasGenerales.totalReservas}`);
    logs.push(`   - Total lugares: ${metricasGenerales.totalLugares}`);
    logs.push(`   - Ocupación promedio: ${metricasGenerales.ocupacionPromedio.toFixed(2)}%`);
    logs.push(`   - Dobleteos: ${metricasGenerales.dobleteos}`);
    logs.push(`   - Horarios no prime: ${metricasGenerales.horariosNoPrime}`);
    logs.push(`   - Clases por semana: ${metricasGenerales.clasesPorSemana.toFixed(2)}`);
    
    const horariosNoPrime = metricasGenerales.horariosNoPrime;
    const dobleteos = metricasGenerales.dobleteos;
    
    logs.push(`💰 Monto total por clases: ${montoTotal.toFixed(2)}`);

    // CALCULAR COVERS Y FULL HOUSE
    logs.push(`\n💰 CALCULANDO COVERS Y FULL HOUSE...`);
    
    // 1. Calcular bono de covers (solo covers justificados con pagoBono = true)
    const coversConBono = coversComoReemplazo.filter(cover => 
      cover.justificacion === "APROBADO" && cover.pagoBono === true
    );
    const bonoCovers = coversConBono.length * 80;
    logs.push(`💰 Covers con bono: ${coversConBono.length} x S/.80 = S/.${bonoCovers}`);
    
    // 2. Identificar clases que deben tratarse como full house por covers
    const coversConFullHouse = coversComoReemplazo.filter(cover => 
      cover.justificacion === "APROBADO" && 
      cover.pagoFullHouse === true && 
      cover.claseId // Solo covers con clase asociada
    );
    
    const clasesFullHouseIds = new Set(coversConFullHouse.map(cover => cover.claseId!));
    logs.push(`🏠 Covers con full house: ${coversConFullHouse.length} (clases IDs: ${Array.from(clasesFullHouseIds).join(', ')})`);
    
    // Crear un mapa para verificar rápidamente si una clase debe ser full house
    const clasesFullHouseMap = new Map<string, boolean>();
    clasesDelInstructor.forEach(clase => {
      clasesFullHouseMap.set(clase.id, clasesFullHouseIds.has(clase.id));
    });
    
    logs.push(`🗺️ Mapa de clases full house creado: ${clasesFullHouseMap.size} clases procesadas`);
    
    // CALCULAR BONOS DE BRANDEOS, THEME RIDES Y WORKSHOPS
    logs.push(`\n🏆 CALCULANDO BONOS ADICIONALES...`);
    
    // 3. Calcular bono de brandeos (número de brandeos x S/.15)
    const totalBrandeos = brandeosDelInstructor.reduce((total, brandeo) => total + brandeo.numero, 0);
    const bonoBrandeos = totalBrandeos * 15;
    logs.push(`🏆 Brandeos: ${totalBrandeos} x S/.15 = S/.${bonoBrandeos}`);
    
    // 4. Calcular bono de theme rides (número de theme rides x S/.30)
    const totalThemeRides = themeRidesDelInstructor.reduce((total, themeRide) => total + themeRide.numero, 0);
    const bonoThemeRides = totalThemeRides * 30;
    logs.push(`⚡ Theme Rides: ${totalThemeRides} x S/.30 = S/.${bonoThemeRides}`);
    
    // 5. Calcular bono de workshops (suma de todos los pagos de workshops)
    const bonoWorkshops = workshopsDelInstructor.reduce((total, workshop) => total + workshop.pago, 0);
    logs.push(`🎓 Workshops: ${workshopsDelInstructor.length} workshops = S/.${bonoWorkshops.toFixed(2)}`);
    
    // 6. Calcular bono de versus (S/.30 por clase versus, excepto Síclo)
    const clasesVersus = clasesDelInstructor.filter(clase => {
      const disciplina = disciplinasDb.find(d => d.id === clase.disciplinaId);
      return clase.esVersus && clase.vsNum && clase.vsNum > 1 && disciplina?.nombre !== "Síclo";
    });
    const bonoVersus = clasesVersus.length * 30;
    logs.push(`⚖️ Clases versus: ${clasesVersus.length} x S/.30 = S/.${bonoVersus}`);
    
    logs.push(`💰 Total bonos adicionales: S/.${(bonoBrandeos + bonoThemeRides + bonoWorkshops + bonoVersus).toFixed(2)}`);

    // Penalización global del instructor (sobre todas sus clases)
    logs.push(`⚠️ Calculando penalizaciones...`);
    const penalizacionResumen = calcularPenalizacion(clasesDelInstructor, penalizacionesDelInstructor, disciplinasDb);
    logs.push(`📊 Penalizaciones calculadas:`);
    logs.push(`   - Descuento: ${penalizacionResumen.descuento || 0}%`);
    logs.push(`   - Detalle: ${JSON.stringify(penalizacionResumen)}`);
    
    // El monto base es solo la suma de los pagos por clase
    const montoBase = montoTotal;
    
    // Los bonos se suman al monto base
    const bono = pagoExistente?.bono || 0;
    const cover = bonoCovers; // Usar el bono de covers calculado
    const brandeo = bonoBrandeos; // Usar el bono de brandeos calculado
    const themeRide = bonoThemeRides; // Usar el bono de theme rides calculado
    const workshop = bonoWorkshops; // Usar el bono de workshops calculado
    const versus = bonoVersus; // Usar el bono de versus calculado
    
    // Calcular el total de bonos
    const totalBonos = bono + cover + brandeo + themeRide + workshop + versus;
    
    // Calcular el reajuste según tipo
    let reajusteCalculado = 0;
    if (pagoExistente?.tipoReajuste === "PORCENTAJE") {
      reajusteCalculado = montoBase * (pagoExistente.reajuste / 100);
    } else {
      reajusteCalculado = pagoExistente?.reajuste || 0;
    }
    
    // La penalización se aplica sobre monto base + reajuste + bonos
    const descuentoPenalizacion = penalizacionResumen.descuento || 0;
    const baseParaPenalizacion = montoBase + reajusteCalculado + totalBonos;
    const montoDescuento = baseParaPenalizacion * (descuentoPenalizacion / 100);
    
    // Cálculo final: monto base + reajuste + bonos - penalización
    const montoFinal = baseParaPenalizacion - montoDescuento;
    const retencion = montoFinal * 0.08; // 8% retención
    const pagoFinal = montoFinal - retencion;
    
    logs.push(`💰 Cálculos finales:`);
    logs.push(`   - Monto base (clases): ${montoBase.toFixed(2)}`);
    logs.push(`   - Reajuste: ${reajusteCalculado.toFixed(2)}`);
    logs.push(`   - Total bonos: ${totalBonos.toFixed(2)} (Bono: ${bono.toFixed(2)}, Cover: ${cover.toFixed(2)}, Brandeo: ${brandeo.toFixed(2)}, Theme Ride: ${themeRide.toFixed(2)}, Workshop: ${workshop.toFixed(2)})`);
    logs.push(`   - Base para penalización (monto base + reajuste + bonos): ${baseParaPenalizacion.toFixed(2)}`);
    logs.push(`   - Descuento penalización: ${descuentoPenalizacion}% = ${montoDescuento.toFixed(2)}`);
    logs.push(`   - Monto final: ${montoFinal.toFixed(2)}`);
    logs.push(`   - Retención (8%): ${retencion.toFixed(2)}`);
    logs.push(`   - Pago final: ${pagoFinal.toFixed(2)}`);

    // Preparar detalles del instructor
    const detallesInstructor = {
      clases: detallesClases,
      penalizaciones: {
        ...penalizacionResumen,
        montoDescuento: montoDescuento
      },
      covers: {
        totalCovers: coversComoReemplazo.length,
        coversConBono: coversConBono.length,
        bonoTotal: bonoCovers,
        coversConFullHouse: coversConFullHouse.length,
        clasesFullHouse: Array.from(clasesFullHouseIds)
      },
      brandeos: {
        totalBrandeos: totalBrandeos,
        bonoTotal: bonoBrandeos,
        brandeos: brandeosDelInstructor
      },
      themeRides: {
        totalThemeRides: totalThemeRides,
        bonoTotal: bonoThemeRides,
        themeRides: themeRidesDelInstructor
      },
      workshops: {
        totalWorkshops: workshopsDelInstructor.length,
        bonoTotal: bonoWorkshops,
        workshops: workshopsDelInstructor
      },
      versus: {
        totalClasesVersus: clasesVersus.length,
        bonoTotal: bonoVersus,
        clasesVersus: clasesVersus.map(clase => ({
          id: clase.id,
          fecha: clase.fecha,
          disciplina: disciplinasDb.find(d => d.id === clase.disciplinaId)?.nombre || 'Desconocida',
          vsNum: clase.vsNum
        }))
      },
      resumen: {
        totalClases: clasesDelInstructor.length,
        totalMonto: montoFinal,
        descuentoPenalizacion,
        montoDescuento,
        retencion,
        pagoFinal,
        categorias: [],
        comentarios: `Calculado el ${new Date().toLocaleDateString()}`,
      },
    };

    const resultado = {
      pago: pagoFinal,
              resumen: {
          instructor: {
            id: instructor.id,
            nombre: instructor.nombre,
          },
          periodo: {
            id: periodo.id,
            numero: periodo.numero,
            año: periodo.año,
          },
          clases: detallesClases.length,
          montoBase: montoFinal,
          penalizacion: montoDescuento,
          retencion,
          pagoFinal,
        },
      detalles: detallesInstructor,
      logs,
    };

    // Guardar o actualizar el pago
    if (pagoExistente) {
      logs.push(`🔄 Actualizando pago existente ID: ${pagoExistente.id}...`);
      const pagoActualizado = await prisma.pagoInstructor.update({
        where: { id: pagoExistente.id },
        data: {
          monto: montoBase, // Solo el monto base
          bono,
          reajuste: pagoExistente.reajuste,
          penalizacion: montoDescuento, // Guardar el monto de penalización, no el porcentaje
          tipoReajuste: pagoExistente.tipoReajuste,
          retencion,
          pagoFinal,
          dobleteos,
          cover,
          brandeo,
          themeRide,
          workshop,
          bonoVersus: versus,
          horariosNoPrime,
          detalles: detallesInstructor,
        },
      });
      (resultado as any).pagoId = pagoActualizado.id;
      logs.push(`✅ Pago actualizado para ${instructor.nombre} (ID: ${instructor.id})`);
    } else {
      logs.push(`➕ Creando nuevo pago...`);
      const nuevoPago = await prisma.pagoInstructor.create({
        data: {
          instructorId: instructor.id,
          periodoId,
          monto: montoBase, // Solo el monto base
          bono: 0,
          retencion,
          reajuste: 0,
          tipoReajuste: "FIJO",
          pagoFinal,
          dobleteos,
          cover,
          brandeo,
          themeRide,
          workshop,
          bonoVersus: versus,
          horariosNoPrime,
          participacionEventos: true,
          cumpleLineamientos: true,
          penalizacion: montoDescuento, // Guardar el monto de penalización, no el porcentaje
          estado: "PENDIENTE",
          detalles: detallesInstructor,
        },
      });
      (resultado as any).pagoId = nuevoPago.id;
      logs.push(`✅ Nuevo pago creado para ${instructor.nombre} (ID: ${instructor.id}) - Pago ID: ${nuevoPago.id}`);
    }

    return NextResponse.json(resultado);

  } catch (error: any) {
    console.error("Error en el cálculo de pago:", error);
    logs.push(`💥 ERROR CRÍTICO: ${error.message}`);
    logs.push(`📍 Stack trace: ${error.stack}`);
    return NextResponse.json(
      { error: "Error interno del servidor.", logs },
      { status: 500 }
    );
  }
}
