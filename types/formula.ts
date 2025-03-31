// Tipos de nodos para el constructor de fórmulas
export enum TipoNodo {
  VARIABLE = "variable",
  OPERACION = "operacion",
  NUMERO = "numero",
  RESULTADO = "resultado",
  COMPARADOR = "comparador",
}

export enum TipoOperacion {
  SUMA = "suma",
  RESTA = "resta",
  MULTIPLICACION = "multiplicacion",
  DIVISION = "division",
  PORCENTAJE = "porcentaje",
  MAYOR_QUE = "mayor_que",
  MENOR_QUE = "menor_que",
  IGUAL = "igual",
  MAYOR_IGUAL = "mayor_igual",
  MENOR_IGUAL = "menor_igual",
}

export enum TipoVariable {
  RESERVACIONES = "reservaciones",
  LISTA_ESPERA = "listaEspera",
  CORTESIAS = "cortesias",
  CAPACIDAD = "capacidad",
  RESERVAS_PAGADAS = "reservasPagadas",
  LUGARES = "lugares",
}

// Interfaz para un nodo en el constructor de fórmulas
export interface NodoFormula {
  id: string
  tipo: TipoNodo
  posicion: { x: number; y: number }
  datos: NodoDatos
  entradas?: string[] // IDs de nodos conectados como entradas
  salidas?: string[] // IDs de nodos conectados como salidas
}

// Unión de tipos para los datos específicos de cada tipo de nodo
export type NodoDatos =
  | NodoDatosVariable
  | NodoDatosOperacion
  | NodoDatosNumero
  | NodoDatosResultado
  | NodoDatosComparador

export interface NodoDatosVariable {
  variable: TipoVariable
  etiqueta: string
}

export interface NodoDatosOperacion {
  operacion: TipoOperacion
  etiqueta: string
}

export interface NodoDatosNumero {
  valor: number
}

export interface NodoDatosResultado {
  etiqueta: string
}

// Interfaz para los datos del nodo comparador
export interface NodoDatosComparador {
  condicion: TipoOperacion // Operación de comparación
  etiqueta: string
}

// Interfaz para una fórmula completa
export interface Formula {
  id: string | number
  nombre: string
  descripcion?: string
  nodos: FormulaNode[]
  conexiones: FormulaConnection[]
  nodoResultado: string // ID del nodo de resultado
  fechaCreacion: Date | string
  fechaActualizacion: Date | string
  disciplinaId?: number
  periodoId?: number
}

// Interfaz para una conexión entre nodos
export interface Conexion {
  id: string
  origen: string // ID del nodo origen
  destino: string // ID del nodo destino
  puntoSalida: string // Identificador del punto de salida
  puntoEntrada: string // Identificador del punto de entrada
}

// Interfaz para el resultado de la evaluación de una fórmula
export interface ResultadoFormula {
  valor: number
  pasos: PasoEvaluacion[]
  error?: string // Mensaje de error si la evaluación falla
}

// Interfaz para un paso en la evaluación de una fórmula
export interface PasoEvaluacion {
  nodoId: string
  descripcion: string
  valor: number | boolean
  esError?: boolean // Indica si este paso representa un error
}

// Interfaz extendida para incluir la disciplina asociada
export interface FormulaConDisciplina extends Formula {
  disciplinaId: number
  disciplinaNombre?: string
}

export interface FormulaNode {
  id: string
  tipo: string
  datos: Record<string, any>
  posicion: { x: number; y: number }
}

export interface FormulaConnection {
  id: string
  origen: string
  destino: string
  puntoSalida: string
  puntoEntrada: string
}
