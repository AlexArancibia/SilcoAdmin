import type { Clase, CategoriaInstructor, FormulaDB, Penalizacion } from "@/types/schema";

// Resultado del cálculo para una clase individual
interface ResultadoCalculoClase {
  montoPago: number;
  tarifaAplicada: number;
  tipoTarifa: string;
  minimoAplicado: boolean;
  maximoAplicado: boolean;
  detalleCalculo: string;
  bonoAplicado?: number;
}

/**
 * Calcula el pago para una clase según la fórmula y categoría del instructor
 */
function calcularPagoClase(clase: Clase, instructorType: CategoriaInstructor, formula: FormulaDB): ResultadoCalculoClase {
  try {
    const parametros = formula.parametrosPago[instructorType]
    if (!parametros) {
      throw new Error(`No se encontraron parámetros de pago para: ${instructorType}`)
    }

    const reservaciones = clase.reservasTotales || 0
    const capacidad = clase.lugares || 0

    const determinarTarifa = (numReservas: number, numCapacidad: number) => {
      const esFullHouse = numReservas >= numCapacidad && numCapacidad > 0
      if (esFullHouse) {
        return { tarifa: parametros.tarifaFullHouse, tipo: "Full House" }
      }

      const tarifasOrdenadas = [...parametros.tarifas].sort((a, b) => a.numeroReservas - b.numeroReservas)
      for (const tarifa of tarifasOrdenadas) {
        if (numReservas <= tarifa.numeroReservas) {
          return { tarifa: tarifa.tarifa, tipo: `Hasta ${tarifa.numeroReservas} reservas` }
        }
      }

      const tarifaMasAlta = tarifasOrdenadas[tarifasOrdenadas.length - 1]
      return {
        tarifa: tarifaMasAlta?.tarifa || parametros.tarifaFullHouse,
        tipo: "Tarifa máxima aplicada",
      }
    }

    let montoPago = 0
    const tarifaInfo = determinarTarifa(reservaciones, capacidad)
    const tarifaAplicada = tarifaInfo.tarifa
    const tipoTarifa = tarifaInfo.tipo
    montoPago = tarifaAplicada * reservaciones
    let detalleCalculo = `${reservaciones} reservas × S/.${tarifaAplicada.toFixed(2)} = S/.${montoPago.toFixed(2)}`

    if (parametros.cuotaFija && parametros.cuotaFija > 0) {
      montoPago += parametros.cuotaFija
      detalleCalculo += `\nCuota fija: +S/.${parametros.cuotaFija.toFixed(2)}`
    }

    let bonoAplicado = 0
    if (parametros.bono && parametros.bono > 0) {
      bonoAplicado = parametros.bono * reservaciones
    }

    let minimoAplicado = false
    if (parametros.minimoGarantizado > 0 && montoPago < parametros.minimoGarantizado) {
      minimoAplicado = true
      montoPago = parametros.minimoGarantizado
      detalleCalculo += `\nSe aplicó el mínimo garantizado: S/.${parametros.minimoGarantizado.toFixed(2)}`
    }

    let maximoAplicado = false
    if (parametros.maximo > 0 && montoPago > parametros.maximo) {
      maximoAplicado = true
      montoPago = parametros.maximo
      detalleCalculo += `\nSe aplicó el máximo: S/.${parametros.maximo.toFixed(2)}`
    }

    detalleCalculo += `\nMonto final clase: S/.${montoPago.toFixed(2)}`

    return {
      montoPago,
      tarifaAplicada,
      tipoTarifa,
      minimoAplicado,
      maximoAplicado,
      detalleCalculo,
      bonoAplicado: bonoAplicado > 0 ? bonoAplicado : undefined,
    }
  } catch (error) {
    console.error("Error al calcular pago de clase:", error)
    throw error
  }
}

/**
 * Calcula el pago total para un conjunto de clases y aplica penalizaciones.
 */
/**
 * Calcula el pago total para un conjunto de clases y aplica penalizaciones.
 */
export function calcularPago(
  clases: Clase[],
  formula: FormulaDB,
  categoria: CategoriaInstructor,
  penalizaciones: Penalizacion[] = [],
): { pago: number; logs: string[] } {
  const logs: string[] = []
  
  const resultadosClases = clases.map((clase) => {
    const resultado = calcularPagoClase(clase, categoria, formula);
    logs.push(`Clase ${clase.id}: ${resultado.detalleCalculo.replace(/\n/g, "; ")}`);
    return resultado;
  });

  const pagoBase = resultadosClases.reduce((sum, r) => sum + r.montoPago, 0);
  logs.push(`Subtotal por clases: S/. ${pagoBase.toFixed(2)}`);

  let totalPenalizaciones = 0;
  if (penalizaciones && penalizaciones.length > 0) {
    penalizaciones.forEach((p) => {
      totalPenalizaciones += p.puntos; // Asumiendo 1 punto = S/. 1
      logs.push(`Penalización: ${p.tipo} (${p.puntos} puntos) -> -S/. ${p.puntos.toFixed(2)}`);
    });
    logs.push(`Total penalizaciones: -S/. ${totalPenalizaciones.toFixed(2)}`);
  }

  const pagoFinal = pagoBase - totalPenalizaciones;
  logs.push(`PAGO FINAL: S/. ${pagoFinal.toFixed(2)} (Subtotal - Penalizaciones)`);

  return { pago: pagoFinal > 0 ? pagoFinal : 0, logs };}
