import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calcularPenalizacion,
  calcularMetricasGenerales,
} from "../../../../../utils/calculo-helpers";
import {
  CategoriaInstructor,
  Clase,
} from "@/types/schema";
import { calcularPagoInstructor, calcularBonosAdicionales } from "../../../../../utils/pago-calculator";

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

    // Usar función modular para calcular el pago del instructor
    const resultadoCalculo = await calcularPagoInstructor(
      instructorId,
      periodoId,
      categoriasManuales,
      logs
    );

    const { montoTotal, detallesClases } = resultadoCalculo;

    // Cargar instructor para obtener datos adicionales
    const instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
      include: {
        clases: { where: { periodoId } },
        penalizaciones: { where: { periodoId } },
        coversComoReemplazo: { where: { periodoId } },
        brandeos: { where: { periodoId } },
        themeRides: { where: { periodoId } },
        workshops: { where: { periodoId } },
      },
    });

    if (!instructor) {
      return NextResponse.json(
        { error: "Instructor no encontrado." },
        { status: 404 }
      );
    }

    const clasesDelInstructor = instructor.clases as Clase[];
    const penalizacionesDelInstructor = instructor.penalizaciones as any[];

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

    // Calcular métricas generales
    logs.push(`\n🧮 CALCULANDO MÉTRICAS GENERALES para instructor ${instructor.id}...`);
    const metricasGenerales = calcularMetricasGenerales(clasesDelInstructor, null);
    logs.push(`📊 Métricas generales calculadas:`);
    logs.push(`   - Total clases: ${metricasGenerales.totalClases}`);
    logs.push(`   - Total reservas: ${metricasGenerales.totalReservas}`);
    logs.push(`   - Total lugares: ${metricasGenerales.totalLugares}`);
    logs.push(`   - Ocupación promedio: ${metricasGenerales.ocupacionPromedio.toFixed(2)}%`);
    logs.push(`   - Dobleteos: ${metricasGenerales.dobleteos}`);
    logs.push(`   - Horarios no prime: ${metricasGenerales.horariosNoPrime}`);
    logs.push(`   - Clases por semana: ${metricasGenerales.clasesPorSemana.toFixed(2)}`);

    // Calcular bonos adicionales
    const bonos = calcularBonosAdicionales(instructor, periodoId, logs);

    // Calcular bono de versus
    const clasesVersus = clasesDelInstructor.filter(clase => {
      return clase.esVersus && clase.vsNum && clase.vsNum > 1;
    });
    const bonoVersus = clasesVersus.length * 30;
    logs.push(`⚖️ Clases versus: ${clasesVersus.length} x S/.30 = S/.${bonoVersus}`);

    // Calcular penalizaciones
    logs.push(`⚠️ Calculando penalizaciones...`);
    const penalizacionResumen = calcularPenalizacion(clasesDelInstructor, penalizacionesDelInstructor, []);
    logs.push(`📊 Penalizaciones calculadas:`);
    logs.push(`   - Descuento: ${penalizacionResumen.descuento || 0}%`);
    logs.push(`   - Detalle: ${JSON.stringify(penalizacionResumen)}`);

    // Calcular totales
    const reajusteExistente = pagoExistente?.reajuste || 0;
    const bonoExistente = pagoExistente?.bono || 0;
    logs.push(`💰 Valores existentes - Reajuste: ${reajusteExistente}, Bono: ${bonoExistente}`);

    const montoBase = montoTotal;
    const bono = bonoExistente;
    const cover = bonos.bonoCovers;
    const brandeo = bonos.bonoBrandeos;
    const themeRide = bonos.bonoThemeRides;
    const workshop = bonos.bonoWorkshops;
    const versus = bonoVersus;

    const totalBonos = bono + cover + brandeo + themeRide + workshop + versus;

    // Calcular reajuste
    let reajusteCalculado = 0;
    if (pagoExistente?.tipoReajuste === "PORCENTAJE") {
      reajusteCalculado = montoBase * (pagoExistente.reajuste / 100);
    } else {
      reajusteCalculado = pagoExistente?.reajuste || 0;
    }

    // Calcular penalización
    const descuentoPenalizacion = penalizacionResumen.descuento || 0;
    const baseParaPenalizacion = montoBase + reajusteCalculado + totalBonos;
    const montoDescuento = baseParaPenalizacion * (descuentoPenalizacion / 100);

    // Cálculo final
    const montoFinal = baseParaPenalizacion - montoDescuento;
    const retencion = montoFinal * 0.08; // 8% retención
    const pagoFinal = montoFinal - retencion;

    logs.push(`💰 Cálculos finales:`);
    logs.push(`   - Monto base (clases): ${montoBase.toFixed(2)}`);
    logs.push(`   - Reajuste: ${reajusteCalculado.toFixed(2)}`);
    logs.push(`   - Total bonos: ${totalBonos.toFixed(2)} (Bono: ${bono.toFixed(2)}, Cover: ${cover.toFixed(2)}, Brandeo: ${brandeo.toFixed(2)}, Theme Ride: ${themeRide.toFixed(2)}, Workshop: ${workshop.toFixed(2)}, Versus: ${versus.toFixed(2)})`);
    logs.push(`   - Base para penalización: ${baseParaPenalizacion.toFixed(2)}`);
    logs.push(`   - Descuento penalización: ${descuentoPenalizacion}% = ${montoDescuento.toFixed(2)}`);
    logs.push(`   - Monto final: ${montoFinal.toFixed(2)}`);
    logs.push(`   - Retención (8%): ${retencion.toFixed(2)}`);
    logs.push(`   - Pago final: ${pagoFinal.toFixed(2)}`);

    // Preparar datos para guardar
    const detallesInstructor = {
      clases: detallesClases,
      penalizaciones: penalizacionResumen,
      covers: {
        totalCovers: instructor.coversComoReemplazo?.length || 0,
        coversConBono: instructor.coversComoReemplazo?.filter((c: any) => c.pagoBono).length || 0,
        bonoTotal: cover,
        coversConFullHouse: 0,
        clasesFullHouse: []
      },
      brandeos: {
        totalBrandeos: instructor.brandeos?.length || 0,
        bonoTotal: brandeo
      },
      themeRides: {
        totalThemeRides: instructor.themeRides?.length || 0,
        bonoTotal: themeRide
      },
      workshops: {
        totalWorkshops: instructor.workshops?.length || 0,
        bonoTotal: workshop
      },
      versus: {
        totalClasesVersus: clasesVersus.length,
        bonoTotal: versus
      },
      resumen: {
        totalClases: detallesClases.length,
        totalMonto: montoTotal,
        bono: totalBonos,
        disciplinas: new Set(detallesClases.map(c => c.disciplinaId)).size,
        categorias: detallesClases.map(c => ({
          disciplinaId: c.disciplinaId,
          disciplinaNombre: c.disciplinaNombre,
          categoria: c.categoria
        }))
      }
    };

    // Guardar o actualizar pago
    if (pagoExistente) {
      if (pagoExistente.estado === "APROBADO") {
        logs.push(`✅ Pago aprobado, no se modificará`);
        return NextResponse.json({
          message: "Pago ya aprobado, no se puede modificar",
          pago: pagoExistente,
          logs
        });
      }

      const pagoActualizado = await prisma.pagoInstructor.update({
        where: { id: pagoExistente.id },
        data: {
          monto: montoBase,
          bono: totalBonos,
          estado: pagoExistente.estado,
          penalizacion: montoDescuento,
          retencion: retencion,
          reajuste: pagoExistente.reajuste,
          tipoReajuste: pagoExistente.tipoReajuste,
          pagoFinal: pagoFinal,
          dobleteos: metricasGenerales.dobleteos,
          cover: cover,
          brandeo: brandeo,
          themeRide: themeRide,
          workshop: workshop,
          bonoVersus: versus,
          horariosNoPrime: metricasGenerales.horariosNoPrime / 4,
          participacionEventos: pagoExistente.participacionEventos ?? true,
          cumpleLineamientos: pagoExistente.cumpleLineamientos ?? true,
          detalles: JSON.parse(JSON.stringify(detallesInstructor)),
        },
      });

      logs.push(`✅ Pago actualizado: ID ${pagoActualizado.id}`);
      return NextResponse.json({
        message: "Pago actualizado exitosamente",
        pago: pagoActualizado,
        logs
      });
    } else {
      const nuevoPago = await prisma.pagoInstructor.create({
        data: {
          instructorId: instructor.id,
          periodoId: periodoId,
          monto: montoBase,
          bono: totalBonos,
          estado: "PENDIENTE",
          penalizacion: montoDescuento,
          retencion: retencion,
          reajuste: 0,
          tipoReajuste: "FIJO",
          pagoFinal: pagoFinal,
          dobleteos: metricasGenerales.dobleteos,
          cover: cover,
          brandeo: brandeo,
          themeRide: themeRide,
          workshop: workshop,
          bonoVersus: versus,
          horariosNoPrime: metricasGenerales.horariosNoPrime / 4,
          participacionEventos: true,
          cumpleLineamientos: true,
          detalles: JSON.parse(JSON.stringify(detallesInstructor)),
        },
      });

      logs.push(`✅ Nuevo pago creado: ID ${nuevoPago.id}`);
      return NextResponse.json({
        message: "Pago calculado y creado exitosamente",
        pago: nuevoPago,
        logs
      });
    }
  } catch (error) {
    logs.push(`❌ Error en el cálculo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    return NextResponse.json({
      error: "Error al calcular el pago",
      details: error instanceof Error ? error.message : 'Error desconocido',
      logs
    }, { status: 500 });
  }
}
