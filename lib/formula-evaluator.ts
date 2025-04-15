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
export function calcularPago(
  clase: Clase,
  instructorType: CategoriaInstructor = "INSTRUCTOR",
  formula: FormulaDB,
): ResultadoCalculo {
  try {
    // Obtener los parámetros de pago para este tipo de instructor
    const parametros = formula.parametrosPago[instructorType]

    if (!parametros) {
      throw new Error(`No se encontraron parámetros de pago para el tipo de instructor: ${instructorType}`)
    }

    // Obtener la cantidad de reservaciones y capacidad
    const reservaciones = clase.reservasTotales || 0
    const capacidad = clase.lugares || 0

    // Determinar la tarifa aplicable según la ocupación
    let tarifaAplicada = 0 // Inicializar con valor predeterminado
    let tipoTarifa = "" // Inicializar con valor predeterminado

    // Verificar si es full house
    const esFullHouse = reservaciones >= capacidad

    if (esFullHouse) {
      tarifaAplicada = parametros.tarifaFullHouse
      tipoTarifa = "Full House"
    } else {
      // Ordenar tarifas por número de reservas (de menor a mayor)
      const tarifasOrdenadas = [...parametros.tarifas].sort((a, b) => a.numeroReservas - b.numeroReservas)

      // Encontrar la tarifa aplicable
      let tarifaEncontrada = false
      for (const tarifa of tarifasOrdenadas) {
        if (reservaciones <= tarifa.numeroReservas) {
          tarifaAplicada = tarifa.tarifa
          tipoTarifa = `Hasta ${tarifa.numeroReservas} reservas`
          tarifaEncontrada = true
          break
        }
      }

      // Si no se encontró una tarifa aplicable, usar la tarifa full house
      if (!tarifaEncontrada) {
        tarifaAplicada = parametros.tarifaFullHouse
        tipoTarifa = "Full House (por defecto)"
      }
    }

    // Calcular el monto base: tarifa * reservaciones
    let montoPago = tarifaAplicada * reservaciones

    // Aplicar cuota fija si existe
    let cuotaFijaAplicada = 0
    if (parametros.cuotaFija && parametros.cuotaFija > 0) {
      cuotaFijaAplicada = parametros.cuotaFija
      montoPago += cuotaFijaAplicada
    }

    // Aplicar bono si corresponde (pero no lo incluimos en el cálculo final)
    let bonoAplicado = 0
    if (parametros.bono && parametros.bono > 0) {
      bonoAplicado = parametros.bono * reservaciones
      // No sumamos el bono al montoPago ya que se maneja en otra parte del sistema
    }

    // Verificar si se aplica el mínimo garantizado
    let minimoAplicado = false
    if (montoPago < parametros.minimoGarantizado && parametros.minimoGarantizado > 0) {
      minimoAplicado = true
      montoPago = parametros.minimoGarantizado
    }

    // Verificar si se aplica el máximo
    let maximoAplicado = false
    if (montoPago > parametros.maximo) {
      maximoAplicado = true
      montoPago = parametros.maximo
    }

    // Generar detalle del cálculo
    let detalleCalculo = `${reservaciones} reservas × S/.${tarifaAplicada.toFixed(2)} = S/.${(reservaciones * tarifaAplicada).toFixed(2)}`

    if (cuotaFijaAplicada > 0) {
      detalleCalculo += `\nCuota fija: +S/.${cuotaFijaAplicada.toFixed(2)}`
      detalleCalculo += `\nSubtotal con cuota fija: S/.${(reservaciones * tarifaAplicada + cuotaFijaAplicada).toFixed(2)}`
    }

    if (minimoAplicado) {
      detalleCalculo += `\nSe aplicó el mínimo garantizado: S/.${parametros.minimoGarantizado.toFixed(2)}`
    }

    if (maximoAplicado) {
      detalleCalculo += `\nSe aplicó el máximo: S/.${parametros.maximo.toFixed(2)}`
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
