import {
  type Formula,
  TipoNodo,
  TipoOperacion,
  type ResultadoFormula,
  type PasoEvaluacion,
  type NodoDatosVariable,
  type NodoDatosNumero,
  type NodoDatosOperacion,
  type NodoDatosComparador,
} from "@/types/formula"

// Interfaz para los datos de entrada para la evaluación
interface DatosEvaluacion {
  reservaciones: number
  listaEspera: number
  cortesias: number
  capacidad: number
  reservasPagadas: number
  lugares: number
  [key: string]: number
}

// Función principal para evaluar una fórmula
export function evaluarFormula(formula: Formula, datos: DatosEvaluacion): ResultadoFormula {
  const pasos: PasoEvaluacion[] = []
  const valoresNodos: Map<string, number> = new Map()
  const nodosEvaluados: Set<string> = new Set()

  // Verificar que la fórmula tenga un nodo de resultado
  if (!formula.nodoResultado && formula.nodos.filter((n) => n.tipo === TipoNodo.RESULTADO).length === 0) {
    throw new Error("La fórmula no tiene un nodo de resultado definido")
  }

  try {
    // Encontrar el nodo de resultado
    const nodoResultadoId = formula.nodoResultado || formula.nodos.find((n) => n.tipo === TipoNodo.RESULTADO)?.id

    if (!nodoResultadoId) {
      throw new Error("No se pudo determinar un nodo de resultado válido")
    }

    // Evaluar el nodo de resultado
    const resultadoFinal = evaluarNodo(nodoResultadoId) as number

    return {
      valor: resultadoFinal,
      pasos: pasos,
    }
  } catch (error) {
    // Capturar errores y añadirlos como un paso de evaluación
    pasos.push({
      nodoId: "error",
      descripcion: `Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
      valor: 0,
      esError: true,
    })

    return {
      valor: 0,
      pasos: pasos,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }

  // Función recursiva para evaluar un nodo
  function evaluarNodo(nodoId: string): number {
    // Si el nodo ya fue evaluado, devolver su valor
    if (valoresNodos.has(nodoId)) {
      return valoresNodos.get(nodoId)!
    }

    // Marcar el nodo como en proceso de evaluación para detectar ciclos
    if (nodosEvaluados.has(nodoId)) {
      throw new Error(`Ciclo detectado en la evaluación del nodo ${nodoId}`)
    }
    nodosEvaluados.add(nodoId)

    // Encontrar el nodo actual
    const nodo = formula.nodos.find((n) => n.id === nodoId)
    if (!nodo) {
      throw new Error(`No se encontró el nodo ${nodoId} en la fórmula`)
    }

    let resultado = 0

    switch (nodo.tipo) {
      case TipoNodo.VARIABLE:
        // Obtener el valor de la variable desde los datos de entrada
        const datosVariable = nodo.datos as NodoDatosVariable
        const variable = datosVariable.variable
        resultado = datos[variable] || 0

        pasos.push({
          nodoId: nodo.id,
          descripcion: `Variable ${variable}: ${resultado}`,
          valor: resultado,
        })
        valoresNodos.set(nodo.id, resultado)
        break

      case TipoNodo.NUMERO:
        // Obtener el valor numérico directamente
        const datosNumero = nodo.datos as NodoDatosNumero
        resultado = datosNumero.valor || 0

        pasos.push({
          nodoId: nodo.id,
          descripcion: `Número constante: ${resultado}`,
          valor: resultado,
        })
        valoresNodos.set(nodo.id, resultado)
        break

      case TipoNodo.OPERACION:
        // Encontrar las conexiones de entrada para este nodo
        const conexionesEntrada = formula.conexiones.filter((c) => c.destino === nodoId)

        if (conexionesEntrada.length < 1) {
          throw new Error(`La operación ${nodoId} no tiene suficientes entradas`)
        }

        // Evaluar los nodos de entrada
        const valoresEntrada: number[] = []
        for (const conexion of conexionesEntrada) {
          const valorEntrada = evaluarNodo(conexion.origen)
          valoresEntrada.push(valorEntrada)
        }

        // Realizar la operación según el tipo
        const datosOperacion = nodo.datos as NodoDatosOperacion
        const operacion = datosOperacion.operacion

        switch (operacion) {
          case TipoOperacion.SUMA:
            resultado = valoresEntrada.reduce((sum, val) => sum + val, 0)
            break
          case TipoOperacion.RESTA:
            resultado =
              valoresEntrada.length > 1
                ? valoresEntrada[0] - valoresEntrada.slice(1).reduce((sum, val) => sum + val, 0)
                : valoresEntrada[0]
            break
          case TipoOperacion.MULTIPLICACION:
            resultado = valoresEntrada.reduce((product, val) => product * val, 1)
            break
          case TipoOperacion.DIVISION:
            if (valoresEntrada.length < 2 || valoresEntrada[1] === 0) {
              throw new Error("División inválida o división por cero")
            }
            resultado = valoresEntrada[0] / valoresEntrada[1]
            break
          case TipoOperacion.PORCENTAJE:
            if (valoresEntrada.length < 2) {
              throw new Error("La operación de porcentaje requiere dos valores")
            }
            resultado = (valoresEntrada[0] * valoresEntrada[1]) / 100
            break
          default:
            throw new Error(`Operación no soportada: ${operacion}`)
        }

        pasos.push({
          nodoId: nodo.id,
          descripcion: `Operación ${operacion} con valores [${valoresEntrada.join(", ")}]: ${resultado}`,
          valor: resultado,
        })
        valoresNodos.set(nodo.id, resultado)
        break

      case TipoNodo.COMPARADOR:
        // Evaluar el nodo comparador
        // Encontrar las conexiones para la comparación
        const conexionesEntradaComparador = formula.conexiones.filter(
          (c) => c.destino === nodoId && (c.puntoEntrada === "valueA" || c.puntoEntrada === "valueB"),
        )

        if (conexionesEntradaComparador.length < 2) {
          throw new Error(`El comparador ${nodoId} no tiene todas las conexiones de entrada necesarias`)
        }

        // Obtener los valores de entrada para la comparación
        const conexionComparadorA = conexionesEntradaComparador.find((c) => c.puntoEntrada === "valueA")
        const conexionComparadorB = conexionesEntradaComparador.find((c) => c.puntoEntrada === "valueB")

        if (!conexionComparadorA || !conexionComparadorB) {
          throw new Error(`El comparador ${nodoId} no tiene las conexiones correctas para los valores A y B`)
        }

        const valorComparadorA = evaluarNodo(conexionComparadorA.origen)
        const valorComparadorB = evaluarNodo(conexionComparadorB.origen)

        // Evaluar la condición según el tipo
        const datosComparador = nodo.datos as NodoDatosComparador
        const condicionComparador = datosComparador.condicion
        let comparacionCumplida = false

        switch (condicionComparador) {
          case TipoOperacion.MAYOR_QUE:
            comparacionCumplida = valorComparadorA > valorComparadorB
            break
          case TipoOperacion.MENOR_QUE:
            comparacionCumplida = valorComparadorA < valorComparadorB
            break
          case TipoOperacion.IGUAL:
            comparacionCumplida = valorComparadorA === valorComparadorB
            break
          case TipoOperacion.MAYOR_IGUAL:
            comparacionCumplida = valorComparadorA >= valorComparadorB
            break
          case TipoOperacion.MENOR_IGUAL:
            comparacionCumplida = valorComparadorA <= valorComparadorB
            break
          default:
            throw new Error(`Condición no soportada en comparador: ${condicionComparador}`)
        }

        // Convertir el resultado booleano a número (1 o 0)
        resultado = comparacionCumplida ? 1 : 0

        pasos.push({
          nodoId: nodo.id,
          descripcion: `Comparador ${condicionComparador} (${valorComparadorA} ${condicionComparador} ${valorComparadorB}): ${comparacionCumplida ? "1" : "0"}`,
          valor: resultado,
        })
        valoresNodos.set(nodo.id, resultado)
        break

      case TipoNodo.RESULTADO:
        // Encontrar la conexión de entrada para el nodo de resultado
        const conexionResultado = formula.conexiones.find((c) => c.destino === nodoId && c.puntoEntrada === "input")

        if (!conexionResultado) {
          throw new Error(`El nodo de resultado ${nodoId} no tiene una conexión de entrada`)
        }

        // Evaluar el nodo conectado al resultado
        resultado = evaluarNodo(conexionResultado.origen)

        pasos.push({
          nodoId: nodo.id,
          descripcion: `Resultado final: ${resultado}`,
          valor: resultado,
        })
        valoresNodos.set(nodo.id, resultado)
        break

      default:
        throw new Error(`Tipo de nodo no soportado: ${nodo.tipo}`)
    }

    return resultado
  }
}

