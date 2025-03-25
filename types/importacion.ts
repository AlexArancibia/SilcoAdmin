// Interfaz para los datos de Excel
export interface DatosExcelClase {
  ID_clase?: string
  País: string
  Ciudad: string
  Disciplina: string
  Estudio: string
  Instructor: string
  Salon: string
  Día: Date | string
  Hora: string
  "Reservas Totales": number
  "Listas de Espera": number
  Cortesias: number
  Lugares: number
  "Reservas Pagadas": number
  "Texto espcial"?: string
  "Es cover"?: string
  "Fitpass Bloqueadas (bot)"?: number
  "Fitpass Fantasmas"?: number
  "Fitpass Reserved"?: number
  "Gympass Late Cancel"?: number
  "Gympass Pagadas"?: number
  "Classpass Late Cancel"?: number
  "Classpass Pagadas"?: number
  Ecosinvisibles?: number
  "PR Bloqueadas"?: number
  [key: string]: any
}

// Interfaz para los errores de importación
export interface ErrorImportacion {
  fila: number
  mensaje: string
}

// Interfaz para el resultado de la importación
export interface ResultadoImportacion {
  pagosActualizados: number
  totalRegistros: number
  registrosImportados: number
  registrosConError: number
  errores: ErrorImportacion[]
  clasesCreadas: number
  clasesEliminadas?: number
  instructoresCreados?: number
  asignacionesCreadas?:number
  pagosCreados?:number
}

