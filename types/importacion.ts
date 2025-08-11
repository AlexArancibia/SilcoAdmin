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
  Semana: number // Nuevo campo para mapeo de semanas
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

// Interfaz para el mapeo de semanas
export interface MapeoSemanas {
  semanaExcel: number
  semanaPeriodo: number
}

// Interfaz para instructores VS (hasta 4 instructores)
export interface InstructorVS {
  originalName: string
  instructores: string[] // Array de hasta 4 instructores
  count: number
  keepInstructores: boolean[] // Array de booleanos para cada instructor
  semanas: Set<number> // Semanas en las que aparece este instructor VS
}

// Interfaz para instructores VS serializados (para JSON)
export interface InstructorVSSerialized {
  originalName: string
  instructores: string[] // Array de hasta 4 instructores
  count: number
  keepInstructores: boolean[] // Array de booleanos para cada instructor
  semanas: number[] // Semanas en las que aparece este instructor VS
}

// Interfaz para una clase individual en la tabla de edición
export interface ClaseEditable {
  id: string // ID único de la fila
  filaOriginal: number // Número de fila en el Excel original
  instructor: string
  disciplina: string
  estudio: string
  salon: string
  dia: string
  hora: string
  semana: number
  reservasTotales: number
  listasEspera: number
  cortesias: number
  lugares: number
  reservasPagadas: number
  esInstructorVS: boolean
  instructoresVS?: string[] // Solo si es instructor VS
  mapeoDisciplina?: string // Disciplina mapeada en el sistema
  mapeoSemana?: number // Semana mapeada en el periodo
  instructorExiste: boolean // Si el instructor ya existe en el sistema
  instructorNuevo: boolean // Si el instructor es nuevo y se creará
  eliminada: boolean // Si la clase debe ser eliminada
  errores?: string[] // Errores de validación
  // Campos editables
  instructorEditado?: string // Instructor seleccionado del sistema
  disciplinaEditada?: string // Disciplina seleccionada del sistema
  estudioEditado?: string // Estudio editado
  salonEditado?: string // Salón editado
  diaEditado?: string // Día editado
  horaEditada?: string // Hora editada
}

// Interfaz para la tabla de clases editables
export interface TablaClasesEditable {
  clases: ClaseEditable[]
  totalClases: number
  clasesValidas: number
  clasesConErrores: number
  clasesEliminadas: number
}

// Interfaz para el análisis de instructores
export interface InstructorAnalysis {
  total: number
  existing: number
  new: number
  instructors: Array<{
    name: string
    exists: boolean
    count: number
    matchedInstructor?: any
    disciplines: string[]
  }>
}

// Interfaz para el análisis de disciplinas
export interface DisciplineAnalysis {
  total: number
  existing: number
  new: number
  disciplines: Array<{
    name: string
    exists: boolean
    count: number
    mappedTo?: string
    matchedDiscipline?: any
    matchedInstructor?: any
  }>
}

// Interfaz para la configuración de importación
export interface ConfiguracionImportacion {
  periodoId: number
  mapeoSemanas: MapeoSemanas[]
  mapeoDisciplinas: Record<string, string> // { disciplinaExcel: disciplinaSistema }
  instructoresCreados: string[] // Nombres de instructores que se crearán
}

// Interfaz para el resultado del análisis
export interface ResultadoAnalisis {
  totalRegistros: number
  semanasEncontradas: number[]
  instructoresEncontrados: string[]
  disciplinasEncontradas: string[]
  disciplineAnalysis: DisciplineAnalysis
  errores: ErrorImportacion[]
}

// Interfaz para los errores de importación
export interface ErrorImportacion {
  fila: number
  mensaje: string
}

// Interfaz para el resultado de la importación
export interface ResultadoImportacion {
  totalRegistros: number
  registrosFiltrados?: number
  registrosImportados: number
  registrosConError: number
  errores: ErrorImportacion[]
  clasesCreadas: number
  clasesEliminadas?: number
  instructoresCreados?: number
  pagosCreados?: number
  pagosActualizados?: number
  asignacionesCreadas?: number
}

// Interfaz para la configuración final de importación
export interface ConfiguracionFinalImportacion {
  periodoId: number
  clases: ClaseEditable[]
  instructoresCreados: string[]
}

