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
    logs.push("🚀 Iniciando proceso de cálculo de pagos");
    
    const body = await req.json();
    logs.push(`📋 Body recibido: ${JSON.stringify(body)}`);
    
    let { periodoId, manualCategorias } = body as { periodoId: number; manualCategorias?: ManualCategoria[] };
    if (!manualCategorias || !Array.isArray(manualCategorias)) {
      manualCategorias = [];
      logs.push("⚠️ No se encontraron categorías manuales, usando array vacío");
    } else {
      logs.push(`📊 Categorías manuales encontradas: ${manualCategorias.length}`);
    }

    if (!periodoId) {
      logs.push("❌ Error: periodoId no proporcionado");
      return NextResponse.json({ error: "periodoId es requerido" }, { status: 400 });
    }

    logs.push(`🎯 Procesando periodo ID: ${periodoId}`);

    // Eliminar pagos con monto 0 para el periodo antes de calcular
    logs.push("🗑️ Eliminando pagos con monto 0...");
    const deletedPagos = await prisma.pagoInstructor.deleteMany({
      where: { periodoId, monto: 0 }
    });
    logs.push(`✅ Eliminados ${deletedPagos.count} pagos con monto 0`);

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
    logs.push(`🗺️ Mapa de disciplinas creado: ${JSON.stringify(disciplinaMap)}`);

    // Cargar instructores activos con clases y penalizaciones
    logs.push("👥 Cargando instructores activos con clases...");
    const instructoresConClases = await prisma.instructor.findMany({
      where: {
        activo: true,
        clases: { some: { periodoId } },
      },
      include: {
        clases: { where: { periodoId } },
        penalizaciones: { where: { periodoId } },
        categorias: { where: { periodoId } },
      },
    });

    logs.push(`👥 Instructores encontrados: ${instructoresConClases.length}`);
    instructoresConClases.forEach(instructor => {
      logs.push(`👤 Instructor ${instructor.id} - ${instructor.nombre}: ${instructor.clases.length} clases, ${instructor.penalizaciones.length} penalizaciones, ${instructor.categorias.length} categorías,  `);
    });

    logs.push(`Iniciando cálculo para ${instructoresConClases.length} instructores en el periodo ${periodoId}`);
    
    const disciplinaSiclo = disciplinasDb.find((d) => d.nombre === "Síclo");
    const sicloId = disciplinaSiclo ? disciplinaSiclo.id : null;
    logs.push(`🚴 Disciplina Síclo: ${sicloId ? `ID ${sicloId}` : 'No encontrada'}`);

    for (const instructor of instructoresConClases) {
      logs.push(`\n🔄 PROCESANDO INSTRUCTOR: ${instructor.id} - ${instructor.nombre}`);
 
      const clasesDelInstructor = instructor.clases as Clase[];
      const penalizacionesDelInstructor = instructor.penalizaciones as Penalizacion[];
      logs.push(`📝 Clases del instructor: ${clasesDelInstructor.length}`);
      logs.push(`⚠️ Penalizaciones del instructor: ${penalizacionesDelInstructor.length}`);
      
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

      if (pagoExistente && pagoExistente.estado === "APROBADO") {
        logs.push(`⚠️ Pago ya aprobado para instructor ${instructor.id}, saltando cálculo`);
        continue;
      }

      // Número de disciplinas únicas en las que dictó clases este periodo
      const disciplinasUnicas = [...new Set(clasesDelInstructor.map(clase => clase.disciplinaId))];
      logs.push(`🎯 Disciplinas únicas del instructor: ${disciplinasUnicas.length} (IDs: ${disciplinasUnicas.join(', ')})`);
      
      let montoTotal = 0;
      const detallesClases = [];
      logs.push(`💵 Iniciando cálculo de montos por disciplina...`);

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

        const categoriaManual = manualCategorias.find(
          (c) => c.instructorId === instructor.id && c.disciplinaId === disciplinaId,
        );

        if (categoriaManual) {
          categoriaInstructor = categoriaManual.categoria as CategoriaInstructor;
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
            // Verificar Full House
            // const esFullHouse = instructor.covers?.some(
            //   c => c.claseId === clase.id && c.periodoId === periodoId && c.pagoFullHouse === true
            // );
            const esFullHouse = false;
            logs.push(`🏠 Full House: ${esFullHouse ? 'SÍ' : 'NO'}`);
        
            let claseParaCalculo = { ...clase };
        
            if (esFullHouse) {
              logs.push(`🏠 Aplicando FULL HOUSE: Reservas ${clase.reservasTotales} -> ${clase.lugares} (100% ocupación)`);
              claseParaCalculo = {
                ...claseParaCalculo,
                reservasTotales: claseParaCalculo.lugares, // Forzar 100% ocupación
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
      const totalClases = metricasGenerales.totalClases;
      const totalReservas = metricasGenerales.totalReservas;
      const totalLugares = metricasGenerales.totalLugares;
      const ocupacionPromedio = metricasGenerales.ocupacionPromedio;
      const dobleteos = metricasGenerales.dobleteos;
      const clasesPorSemana = metricasGenerales.clasesPorSemana;
      
      logs.push(`💰 Monto total por clases: ${montoTotal.toFixed(2)}`);

      // Penalización global del instructor (sobre todas sus clases)
      logs.push(`⚠️ Calculando penalizaciones...`);
      const penalizacionResumen = calcularPenalizacion(clasesDelInstructor, penalizacionesDelInstructor, disciplinasDb);
      logs.push(`📊 Penalizaciones calculadas:`);
      logs.push(`   - Descuento: ${penalizacionResumen.descuento || 0}%`);
      logs.push(`   - Detalle: ${JSON.stringify(penalizacionResumen)}`);

      const coverTotal = 0 * 80;
      logs.push(`🔄 Cover total: ${coverTotal}`);
      
      const reajusteExistente = pagoExistente?.reajuste || 0;
      const bonoExistente = pagoExistente?.bono || 0;
      logs.push(`💰 Valores existentes - Reajuste: ${reajusteExistente}, Bono: ${bonoExistente}`);
      
      const subtotal = montoTotal + reajusteExistente + bonoExistente + coverTotal;
      logs.push(`💰 Subtotal: ${montoTotal} + ${reajusteExistente} + ${bonoExistente} + ${coverTotal} = ${subtotal.toFixed(2)}`);

      // Usar el subtotal como base para los cálculos finales
      const pagoTotalInstructor = subtotal;
      const descuentoPenalizacion = penalizacionResumen.descuento || 0;
      const montoDescuento = pagoTotalInstructor * (descuentoPenalizacion / 100);
      const montoFinal = pagoTotalInstructor - montoDescuento;
      const retencion = montoFinal * 0.08; // 8% retención
      const pagoFinal = montoFinal - retencion;
      
      logs.push(`💰 Cálculos finales:`);
      logs.push(`   - Pago total instructor: ${pagoTotalInstructor.toFixed(2)}`);
      logs.push(`   - Descuento penalización: ${descuentoPenalizacion}% = ${montoDescuento.toFixed(2)}`);
      logs.push(`   - Monto final: ${montoFinal.toFixed(2)}`);
      logs.push(`   - Retención (8%): ${retencion.toFixed(2)}`);
      logs.push(`   - Pago final: ${pagoFinal.toFixed(2)}`);

      // Guardar/actualizar pago del instructor
      logs.push(`💾 Preparando datos para guardar...`);
    
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
      
      logs.push(`📋 Detalles del instructor preparados: ${detallesClases.length} clases procesadas`);
      
      if (pagoExistente) {
        logs.push(`🔄 Actualizando pago existente ID: ${pagoExistente.id}...`);
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
        logs.push(`✅ Pago actualizado para ${instructor.nombre} (ID: ${instructor.id})`);
      } else {
        logs.push(`➕ Creando nuevo pago...`);
        const nuevoPago = await prisma.pagoInstructor.create({
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
        logs.push(`✅ Nuevo pago creado para ${instructor.nombre} (ID: ${instructor.id}) - Pago ID: ${nuevoPago.id}`);
      }
      
      logs.push(`✅ COMPLETADO instructor ${instructor.id} - ${instructor.nombre}`);
    }

    logs.push(`\n🎉 PROCESO COMPLETADO EXITOSAMENTE`);
    logs.push(`📊 Resumen: ${instructoresConClases.length} instructores procesados`);
    
    return NextResponse.json({ message: "Cálculo completado para todos los instructores.", logs });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    logs.push(`💥 ERROR CRÍTICO: ${errorMessage}`);
    logs.push(`📍 Stack trace: ${error instanceof Error ? error.stack : 'No disponible'}`);
    return NextResponse.json({ error: errorMessage, logs }, { status: 500 });
  }
}