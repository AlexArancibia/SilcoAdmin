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
  Cover,
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
        coversComoReemplazo: { where: { periodoId } }, // Cargar covers donde es instructor de reemplazo
        brandeos: { where: { periodoId } }, // Cargar brandeos del instructor
        themeRides: { where: { periodoId } }, // Cargar theme rides del instructor
        workshops: { where: { periodoId } }, // Cargar workshops del instructor
      },
    });

    logs.push(`👥 Instructores encontrados: ${instructoresConClases.length}`);
    instructoresConClases.forEach(instructor => {
      logs.push(`👤 Instructor ${instructor.id} - ${instructor.nombre}: ${instructor.clases.length} clases, ${instructor.penalizaciones.length} penalizaciones, ${instructor.categorias.length} categorías, ${instructor.coversComoReemplazo?.length || 0} covers como reemplazo`);
    });

    logs.push(`Iniciando cálculo para ${instructoresConClases.length} instructores en el periodo ${periodoId}`);
    
    const disciplinaSiclo = disciplinasDb.find((d) => d.nombre === "Síclo");
    const sicloId = disciplinaSiclo ? disciplinaSiclo.id : null;
    logs.push(`🚴 Disciplina Síclo: ${sicloId ? `ID ${sicloId}` : 'No encontrada'}`);

    for (const instructor of instructoresConClases) {
      logs.push(`\n🔄 PROCESANDO INSTRUCTOR: ${instructor.id} - ${instructor.nombre}`);
      logs.push(`👤 ID: ${instructor.id} | Nombre: ${instructor.nombre}`);
 
      const clasesDelInstructor = instructor.clases as Clase[];
      const penalizacionesDelInstructor = instructor.penalizaciones as Penalizacion[];
      const coversComoReemplazo = instructor.coversComoReemplazo || [];
      const brandeosDelInstructor = instructor.brandeos || [];
      const themeRidesDelInstructor = instructor.themeRides || [];
      const workshopsDelInstructor = instructor.workshops || [];
      
      logs.push(`📊 RESUMEN INICIAL DEL INSTRUCTOR:`);
      logs.push(`   📝 Total de clases: ${clasesDelInstructor.length}`);
      logs.push(`   ⚠️ Penalizaciones: ${penalizacionesDelInstructor.length}`);
      logs.push(`   🔄 Covers como reemplazo: ${coversComoReemplazo.length}`);
      logs.push(`   🏆 Brandeos: ${brandeosDelInstructor.length}`);
      logs.push(`   ⚡ Theme Rides: ${themeRidesDelInstructor.length}`);
      logs.push(`   🎓 Workshops: ${workshopsDelInstructor.length}`);
      
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
      
      logs.push(`💰 Total bonos adicionales: S/.${(bonoBrandeos + bonoThemeRides + bonoWorkshops).toFixed(2)}`);
      
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
          // SIEMPRE RECALCULAR CATEGORÍA AUTOMÁTICAMENTE
          logs.push(`🔄 Recalculando categoría automáticamente para ${disciplina.nombre}...`);
          
                      // Calcular métricas para esta disciplina
            logs.push(`🔍 DEBUG: Datos de clases para ${disciplina.nombre}:`);
            logs.push(`   - Total clases: ${clasesDisciplina.length}`);
            logs.push(`   - Muestra de estudios: ${clasesDisciplina.slice(0, 5).map(c => c.estudio).join(', ')}`);
            logs.push(`   - Muestra de ciudades: ${clasesDisciplina.slice(0, 5).map(c => c.ciudad).join(', ')}`);
            
            const metricasDisciplina = calcularMetricasDisciplina(clasesDisciplina, disciplinaId, sicloId);
            
            // Obtener valores reales del instructor para estos factores
            const participacionEventos = true; // Por defecto, se puede ajustar según la lógica del negocio
            const cumpleLineamientos = true; // Por defecto, se puede ajustar según la lógica del negocio
            
            // Crear métricas completas con los valores reales del instructor
            const metricasCompletas = {
              ...metricasDisciplina,
              participacionEventos,
              cumpleLineamientos,
            };
            
            logs.push(`📊 Métricas calculadas para ${disciplina.nombre}: ocupación ${metricasDisciplina.ocupacionPromedio}%, clases ${metricasDisciplina.totalClases}, locales ${metricasDisciplina.totalLocales}, dobleteos ${metricasDisciplina.totalDobleteos}, horarios no prime ${metricasDisciplina.horariosNoPrime}, participación eventos: ${participacionEventos}, cumple lineamientos: ${cumpleLineamientos}`);
          
          // Determinar categoría usando la fórmula
          categoriaInstructor = determinarCategoria(formula, metricasCompletas);
          logs.push(`🎭 Categoría recalculada: ${categoriaInstructor}`);
          
          // GUARDAR O ACTUALIZAR LA CATEGORÍA EN LA BD
          try {
            // Verificar si ya existe una categoría para esta disciplina
            const categoriaExistente = instructor.categorias?.find(
              (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId,
            );
            
            if (categoriaExistente) {
              // Actualizar categoría existente
              await prisma.categoriaInstructor.update({
                where: { id: categoriaExistente.id },
                data: {
                  categoria: categoriaInstructor,
                  metricas: metricasCompletas,
                  esManual: false,
                },
              });
              logs.push(`✅ Categoría actualizada en BD: ID ${categoriaExistente.id}`);
              
              // Actualizar en memoria
              const index = instructor.categorias.findIndex(c => c.id === categoriaExistente.id);
              if (index !== -1) {
                instructor.categorias[index] = {
                  ...categoriaExistente,
                  categoria: categoriaInstructor,
                  metricas: metricasCompletas,
                };
              }
            } else {
              // Crear nueva categoría
              const nuevaCategoria = await prisma.categoriaInstructor.create({
                data: {
                  instructorId: instructor.id,
                  disciplinaId: disciplinaId,
                  periodoId: periodoId,
                  categoria: categoriaInstructor,
                  esManual: false,
                  metricas: metricasCompletas,
                },
              });
              logs.push(`✅ Nueva categoría creada en BD: ID ${nuevaCategoria.id}`);
              
              // Agregar a memoria
              if (!instructor.categorias) instructor.categorias = [];
              instructor.categorias.push(nuevaCategoria);
            }
          } catch (error) {
            logs.push(`❌ Error al guardar/actualizar categoría: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            categoriaInstructor = "INSTRUCTOR" as const;
          }
        }

        logs.push(`\n🔄 Procesando ${clasesDisciplina.length} clases de ${disciplina.nombre}...`);
        
        for (const clase of clasesDisciplina) {
          logs.push(`\n📅 CLASE ID: ${clase.id} - Fecha: ${new Date(clase.fecha).toLocaleDateString()} ${obtenerHora(clase.fecha)}`);
          logs.push(`   📊 Reservas: ${clase.reservasTotales}/${clase.lugares} (${Math.round((clase.reservasTotales / clase.lugares) * 100)}%)`);
          
          try {
            // Verificar Full House por covers
            const esFullHousePorCover = clasesFullHouseMap.get(clase.id) || false;
            logs.push(`🏠 Full House por cover: ${esFullHousePorCover ? 'SÍ' : 'NO'}`);
        
            let claseParaCalculo = { ...clase };
        
            if (esFullHousePorCover) {
              logs.push(`🏠 Aplicando FULL HOUSE por cover: Reservas ${clase.reservasTotales} -> ${clase.lugares} (100% ocupación)`);
              claseParaCalculo = {
                ...claseParaCalculo,
                reservasTotales: claseParaCalculo.lugares, // Forzar 100% ocupación
              };
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
        
                      montoTotal += montoPagoFinal;
                      logs.push(`📈 Monto acumulado: ${montoTotal.toFixed(2)}`);
        
                      logs.push(
                        `💰 PAGO POR CLASE [${clase.id}]: ${disciplina.nombre} - ${new Date(clase.fecha).toLocaleDateString()} ${obtenerHora(clase.fecha)}` +
                          `\n   Monto: ${Number(montoPagoFinal).toFixed(2)} | Categoría: ${categoriaInstructor}` +
                          `\n   Reservas: ${claseParaCalculo.reservasTotales}/${claseParaCalculo.lugares} (${Math.round((claseParaCalculo.reservasTotales / claseParaCalculo.lugares) * 100)}% ocupación)` +
                          (clase.esVersus ? `\n   Versus: Sí (${clase.vsNum} instructores)` : "") +
                          (esFullHousePorCover ? `\n   FULL HOUSE por cover: Sí` : "") +
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
                        detalleCalculo: resultado.detalleCalculo + (esFullHousePorCover ? " (FULL HOUSE por cover)" : ""),
                        categoria: categoriaInstructor,
                        esVersus: clase.esVersus,
                        vsNum: clase.vsNum,
                        esFullHouse: esFullHousePorCover || false,
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

      // 6. Calcular bono de versus (S/.30 por clase versus, excepto Síclo)
      const clasesVersus = clasesDelInstructor.filter(clase => {
        const disciplina = disciplinasDb.find(d => d.id === clase.disciplinaId);
        return clase.esVersus && clase.vsNum && clase.vsNum > 1 && disciplina?.nombre !== "Síclo";
      });
      const bonoVersus = clasesVersus.length * 30;
      logs.push(`⚖️ Clases versus: ${clasesVersus.length} x S/.30 = S/.${bonoVersus}`);
      
      logs.push(`🔄 Cover total: ${bonoCovers}`);
      logs.push(`🏆 Brandeo total: ${bonoBrandeos}`);
      logs.push(`⚡ Theme Ride total: ${bonoThemeRides}`);
      logs.push(`🎓 Workshop total: ${bonoWorkshops.toFixed(2)}`);
      logs.push(`⚖️ Versus total: ${bonoVersus}`);
      
      const reajusteExistente = pagoExistente?.reajuste || 0;
      const bonoExistente = pagoExistente?.bono || 0;
      logs.push(`💰 Valores existentes - Reajuste: ${reajusteExistente}, Bono: ${bonoExistente}`);
      
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
      logs.push(`   - Total bonos: ${totalBonos.toFixed(2)} (Bono: ${bono.toFixed(2)}, Cover: ${cover.toFixed(2)}, Brandeo: ${brandeo.toFixed(2)}, Theme Ride: ${themeRide.toFixed(2)}, Workshop: ${workshop.toFixed(2)}, Versus: ${versus.toFixed(2)})`);
      logs.push(`   - Base para penalización (monto base + reajuste + bonos): ${baseParaPenalizacion.toFixed(2)}`);
      logs.push(`   - Descuento penalización: ${descuentoPenalizacion}% = ${montoDescuento.toFixed(2)}`);
      logs.push(`   - Monto final: ${montoFinal.toFixed(2)}`);
      logs.push(`   - Retención (8%): ${retencion.toFixed(2)}`);
      logs.push(`   - Pago final: ${pagoFinal.toFixed(2)}`);

      // Guardar/actualizar pago del instructor
      logs.push(`💾 Preparando datos para guardar...`);
    
      const detallesInstructor = {
        clases: detallesClases,
        penalizaciones: penalizacionResumen,
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
      
      logs.push(`📋 Detalles del instructor preparados: ${detallesClases.length} clases procesadas`);
      
      if (pagoExistente) {
        logs.push(`🔄 Actualizando pago existente ID: ${pagoExistente.id}...`);
        await prisma.pagoInstructor.update({
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
        logs.push(`✅ Nuevo pago creado para ${instructor.nombre} (ID: ${instructor.id}) - Pago ID: ${nuevoPago.id}`);
      }
      
      logs.push(`✅ COMPLETADO instructor ${instructor.id} - ${instructor.nombre}`);
      logs.push(`📋 RESUMEN FINAL DEL INSTRUCTOR:`);
      logs.push(`   💰 Pago final: S/. ${pagoFinal.toFixed(2)}`);
      logs.push(`   📝 Total clases procesadas: ${detallesClases.length}`);
      logs.push(`   🔄 Covers aplicados: ${coversConBono.length}`);
      logs.push(`   🏆 Brandeos aplicados: ${totalBrandeos}`);
      logs.push(`   ⚡ Theme Rides aplicados: ${totalThemeRides}`);
      logs.push(`   🎓 Workshops aplicados: ${workshopsDelInstructor.length}`);
      logs.push(`   ⚠️ Horarios no prime: ${horariosNoPrime}`);
      logs.push(`   💸 Penalización aplicada: ${descuentoPenalizacion}%`);
      logs.push(`   🏦 Retención (8%): S/. ${retencion.toFixed(2)}`);
      logs.push(`─`.repeat(60));
    }

    // RECALCULAR TODAS LAS CATEGORÍAS PARA ASEGURAR CONSISTENCIA
    logs.push(`\n🔄 RECALCULANDO TODAS LAS CATEGORÍAS PARA CONSISTENCIA...`);
    
    for (const instructor of instructoresConClases) {
      logs.push(`\n👤 Recalculando categorías para instructor ${instructor.id} - ${instructor.nombre}`);
      
      const clasesDelInstructor = instructor.clases as Clase[];
      const disciplinasUnicas = [...new Set(clasesDelInstructor.map(clase => clase.disciplinaId))];
      
      for (const disciplinaId of disciplinasUnicas) {
        const disciplina = disciplinasDb.find((d) => d.id === disciplinaId);
        if (!disciplina || !mostrarCategoriaVisual(disciplina.nombre)) {
          logs.push(`⏭️ Saltando disciplina ${disciplina?.nombre || disciplinaId} (sin categorización visual)`);
          continue;
        }
        
        const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodoId);
        if (!formula) {
          logs.push(`❌ No hay fórmula para disciplina ${disciplina.nombre}`);
          continue;
        }
        
        const clasesDisciplina = clasesDelInstructor.filter((c) => c.disciplinaId === disciplinaId);
        const metricasDisciplina = calcularMetricasDisciplina(clasesDisciplina, disciplinaId, sicloId);
        
        // Crear métricas completas con valores por defecto
        const metricasCompletas = {
          ...metricasDisciplina,
          participacionEventos: true, // Por defecto
          cumpleLineamientos: true, // Por defecto
        };
        
        const categoriaCalculada = determinarCategoria(formula, metricasCompletas);
        
        // Verificar si ya existe una categoría para esta disciplina
        const categoriaExistente = instructor.categorias?.find(
          (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId,
        );
        
        if (categoriaExistente) {
          if (categoriaExistente.categoria !== categoriaCalculada) {
            logs.push(`🔄 Actualizando categoría de ${disciplina.nombre}: ${categoriaExistente.categoria} -> ${categoriaCalculada}`);
            await prisma.categoriaInstructor.update({
              where: { id: categoriaExistente.id },
              data: {
                categoria: categoriaCalculada,
                metricas: metricasCompletas,
                esManual: false,
              },
            });
          } else {
            logs.push(`✅ Categoría de ${disciplina.nombre} ya está actualizada: ${categoriaCalculada}`);
          }
        } else {
          logs.push(`➕ Creando nueva categoría para ${disciplina.nombre}: ${categoriaCalculada}`);
          await prisma.categoriaInstructor.create({
            data: {
              instructorId: instructor.id,
              disciplinaId: disciplinaId,
              periodoId: periodoId,
              categoria: categoriaCalculada,
              esManual: false,
              metricas: metricasCompletas,
            },
          });
        }
      }
    }
    
    logs.push(`\n🎉 PROCESO COMPLETADO EXITOSAMENTE`);
    logs.push(`📊 RESUMEN GENERAL DEL PROCESO:`);
    logs.push(`👥 Total instructores procesados: ${instructoresConClases.length}`);
    logs.push(`📅 Periodo procesado: ${periodoId}`);
    logs.push(`⏰ Fecha y hora: ${new Date().toLocaleString()}`);
    logs.push(`🎯 Estado: Completado exitosamente`);
    logs.push(`📈 Total de pagos procesados: ${instructoresConClases.length}`);
    logs.push(`💰 Periodo de cálculo: ${periodoId}`);
    logs.push(`📅 Fecha de ejecución: ${new Date().toLocaleDateString()}`);
    logs.push(`⏰ Hora de ejecución: ${new Date().toLocaleTimeString()}`);
    
    return NextResponse.json({ message: "Cálculo completado para todos los instructores.", logs });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    logs.push(`💥 ERROR CRÍTICO: ${errorMessage}`);
    logs.push(`📍 Stack trace: ${error instanceof Error ? error.stack : 'No disponible'}`);
    return NextResponse.json({ error: errorMessage, logs }, { status: 500 });
  }
}