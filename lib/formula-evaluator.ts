// Importar CategoriaInstructor
import type { FormulaDB, CategoriaInstructor, Clase } from "@/types/schema"

export interface ResultadoCalculo {
  montoPago: number
  tarifaAplicada: number
  tipoTarifa: string
  minimoAplicado: boolean
  maximoAplicado: boolean
  detalleCalculo: string
  bonoAplicado?: number
}

/**
 * Calcula el pago para una clase según la fórmula y categoría del instructor
 * @param clase Datos de la clase
 * @param instructorType Categoría del instructor (INSTRUCTOR por defecto)
 * @param formula Fórmula con parámetros de pago
 * @returns Resultado del cálculo
 */
export function calcularPago(clase: Clase, instructorType: CategoriaInstructor, formula: FormulaDB): ResultadoCalculo {
  try {
    // Obtener los parámetros de pago para este tipo de instructor
    const parametros = formula.parametrosPago[instructorType]

    if (!parametros) {
      throw new Error(`No se encontraron parámetros de pago para el tipo de instructor: ${instructorType}`)
    }

    // Obtener la cantidad de reservaciones y capacidad
    const reservaciones = clase.reservasTotales || 0
    const capacidad = clase.lugares || 0

    // CORREGIDO: Función auxiliar para determinar tarifa basada en reservas
    const determinarTarifa = (numReservas: number, numCapacidad: number) => {
      // Verificar si es full house
      const esFullHouse = numReservas >= numCapacidad && numCapacidad > 0

      if (esFullHouse) {
        return {
          tarifa: parametros.tarifaFullHouse,
          tipo: "Full House",
        }
      }

      // Ordenar tarifas por número de reservas (de menor a mayor)
      const tarifasOrdenadas = [...parametros.tarifas].sort((a, b) => a.numeroReservas - b.numeroReservas)

      // Encontrar la tarifa aplicable
      for (const tarifa of tarifasOrdenadas) {
        if (numReservas <= tarifa.numeroReservas) {
          return {
            tarifa: tarifa.tarifa,
            tipo: `Hasta ${tarifa.numeroReservas} reservas`,
          }
        }
      }

      // Si no se encontró una tarifa aplicable, usar la tarifa más alta
      const tarifaMasAlta = tarifasOrdenadas[tarifasOrdenadas.length - 1]
      return {
        tarifa: tarifaMasAlta?.tarifa || parametros.tarifaFullHouse,
        tipo: "Tarifa máxima aplicada",
      }
    }

    let montoPago = 0
    let tarifaAplicada = 0
    let tipoTarifa = ""
    let detalleCalculo = ""

    // CORREGIDO: Lógica unificada para clases normales y versus
    if (clase.esVersus && clase.vsNum && clase.vsNum > 1) {
      // Para clases versus, el hook ya ajustó las reservas y capacidad
      // Solo necesitamos calcular normalmente y el hook se encarga de la división
      const tarifaInfo = determinarTarifa(reservaciones, capacidad)
      tarifaAplicada = tarifaInfo.tarifa
      tipoTarifa = tarifaInfo.tipo

      montoPago = tarifaAplicada * reservaciones

      detalleCalculo = `VS(${clase.vsNum}): ${reservaciones} reservas × S/.${tarifaAplicada.toFixed(2)} = S/.${montoPago.toFixed(2)}`
      detalleCalculo += `\n(Capacidad: ${capacidad} lugares)`
    } else {
      // Clases normales
      const tarifaInfo = determinarTarifa(reservaciones, capacidad)
      tarifaAplicada = tarifaInfo.tarifa
      tipoTarifa = tarifaInfo.tipo

      montoPago = tarifaAplicada * reservaciones

      detalleCalculo = `${reservaciones} reservas × S/.${tarifaAplicada.toFixed(2)} = S/.${montoPago.toFixed(2)}`
    }

    // Aplicar cuota fija si existe
    let cuotaFijaAplicada = 0
    if (parametros.cuotaFija && parametros.cuotaFija > 0) {
      cuotaFijaAplicada = parametros.cuotaFija
      montoPago += cuotaFijaAplicada
      detalleCalculo += `\nCuota fija: +S/.${cuotaFijaAplicada.toFixed(2)}`
    }

    // Aplicar bono si corresponde (pero no lo incluimos en el cálculo final)
    let bonoAplicado = 0
    if (parametros.bono && parametros.bono > 0) {
      bonoAplicado = parametros.bono * reservaciones
      // No sumamos el bono al montoPago ya que se maneja en otra parte del sistema
    }

    // Verificar si se aplica el mínimo garantizado
    let minimoAplicado = false
    if (parametros.minimoGarantizado > 0 && montoPago < parametros.minimoGarantizado) {
      minimoAplicado = true
      const montoAnterior = montoPago
      montoPago = parametros.minimoGarantizado
      detalleCalculo += `\nSe aplicó el mínimo garantizado: S/.${montoAnterior.toFixed(2)} → S/.${parametros.minimoGarantizado.toFixed(2)}`
    }

    // Verificar si se aplica el máximo
    let maximoAplicado = false
    if (parametros.maximo > 0 && montoPago > parametros.maximo) {
      maximoAplicado = true
      const montoAnterior = montoPago
      montoPago = parametros.maximo
      detalleCalculo += `\nSe aplicó el máximo: S/.${montoAnterior.toFixed(2)} → S/.${parametros.maximo.toFixed(2)}`
    }

    // Agregar información final
    if (cuotaFijaAplicada > 0) {
      const subtotal = tarifaAplicada * reservaciones + cuotaFijaAplicada
      detalleCalculo += `\nSubtotal: S/.${subtotal.toFixed(2)}`
    }

    detalleCalculo += `\nMonto final: S/.${montoPago.toFixed(2)}`

    // CORREGIDO: Información adicional para clases versus
    if (clase.esVersus && clase.vsNum && clase.vsNum > 1) {
      detalleCalculo += `\n(Este monto será dividido entre ${clase.vsNum} instructores en el hook)`
    }

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
    console.error("Error al calcular pago:", error)
    throw error
  }
}

/**
 * Calcula el pago para múltiples clases
 * @param clases Array de clases
 * @param instructorType Categoría del instructor
 * @param formula Fórmula con parámetros de pago
 * @returns Array con los resultados de cálculo para cada clase
 */
export function calcularPagoMultiple(
  clases: Clase[],
  instructorType: CategoriaInstructor = "INSTRUCTOR",
  formula: FormulaDB,
): { resultados: ResultadoCalculo[]; total: number } {
  const resultados = clases.map((clase) => calcularPago(clase, instructorType, formula))
  const total = resultados.reduce((sum, resultado) => sum + resultado.montoPago, 0)

  return {
    resultados,
    total,
  }
}
