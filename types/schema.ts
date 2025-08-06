export type EstadoPago = "PENDIENTE" | "APROBADO" | "PAGADO" | "CANCELADO"
export type TipoReajuste = "FIJO" | "PORCENTAJE"
export type StatusCover = "PENDIENTE" | "APROBADO" | "RECHAZADO"

// Pagination types
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Query parameter types for filtering
export interface ClasesQueryParams extends PaginationParams {
  periodoId?: number
  periodoInicio?: number // Nuevo: para rangos de períodos
  periodoFin?: number // Nuevo: para rangos de períodos
  instructorId?: number
  disciplinaId?: number
  semana?: number
  fecha?: string
  estudio?: string
}

export interface PagosQueryParams extends PaginationParams {
  periodoId?: number
  periodoInicio?: number // Nuevo: para rangos de períodos
  periodoFin?: number // Nuevo: para rangos de períodos
  instructorId?: number
  disciplinaId?: number
  semana?: number
  estudio?: string
  claseId?: string
  estado?: EstadoPago
  busqueda?: string
}

// Query parameter types for covers
export interface CoversQueryParams extends PaginationParams {
  [key: string]: string | number | boolean | undefined
  periodoId?: number
  instructorOriginalId?: number
  instructorReemplazoId?: number
  disciplinaId?: number
  justificacion?: StatusCover // Cambiado de status a justificacion
  fecha?: string
  busqueda?: string
}

export type CategoriaInstructor = "INSTRUCTOR" | "EMBAJADOR_JUNIOR" | "EMBAJADOR" | "EMBAJADOR_SENIOR"
export type TipoPenalizacion = "CANCELACION_FIJA" | "LLEGO_TARDE" | "CANCELACION_FUERA_TIEMPO"  | "CANCELAR_MENOS_24HRS" | "COVER_DEL_COVER" | "SALIR_TARDE" | "PERSONALIZADA"
export enum Rol {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  USUARIO = "USUARIO",
}

export interface Usuario {
  id: number
  nombre: string
  email: string
  password: string
  rol: Rol
  activo: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface Instructor {
  id: number
  nombre: string
  nombreCompleto?: string
  activo: boolean
  password?: string
  extrainfo?: InstructorExtraInfo
  ultimoBono?: Record<string, number> // {disciplinaId: periodoId}
  createdAt?: Date
  updatedAt?: Date
  
  // Nuevos campos opcionales
  personaContacto?: string
  cuentaBancaria?: string
  CCI?: string
  banco?: string
  celular?: string
  DNI?: number

  // Relaciones
  clases?: Clase[]
  pagos?: PagoInstructor[]
  disciplinas?: Disciplina[]
  categorias?: CategoriaInstructorModel[]
  penalizaciones? : Penalizacion  []
  coversComoDador?: Cover[] // Covers donde este instructor fue el original
  coversComoReemplazo?: Cover[] // Covers donde este instructor fue el reemplazo
  brandeos?: Brandeo[]
  themeRides?: ThemeRide[]
  workshops?: Workshop[]
}

export interface InstructorExtraInfo {
  foto?: string
  biografia?: string
  experiencia?: number
  [key: string]: any
}

export interface Disciplina {
  id: number
  nombre: string
  descripcion?: string | null
  color?: string | null
  activo: boolean
  createdAt?: Date
  updatedAt?: Date

  // Relaciones
  clases?: Clase[]
  formulas?: FormulaDB[]
  instructores?: Instructor[]
  categorias?: CategoriaInstructorModel[]
  covers?: Cover[] // Nueva relación para covers
  brandeos?: Brandeo[]
  themeRides?: ThemeRide[]
  workshops?: Workshop[]
}

export interface Periodo {
  id: number
  numero: number
  año: number
  fechaInicio: Date
  fechaFin: Date
  fechaPago: Date
  createdAt?: Date
  updatedAt?: Date
  bonoCalculado? : boolean


  // Relaciones
  clases?: Clase[]
  pagos?: PagoInstructor[]
  formulas?: FormulaDB[]
  categorias?: CategoriaInstructorModel[]
  covers?: Cover[] // Nueva relación para covers
  brandeos?: Brandeo[]
  themeRides?: ThemeRide[]
  workshops?: Workshop[]
}

export interface RequisitosCategoria {
  ocupacion: number
  clases: number
  localesEnLima: number
  dobleteos: number
  horariosNoPrime: number
  participacionEventos: boolean
  antiguedadMinima?: number
  evaluacionPromedio?: number
  capacitacionesCompletadas?: number
  lineamientos: boolean // Indica si cumple los lineamientos
}

 
 
export interface CategoriaInstructorModel {
  id: number
  instructorId: number
  disciplinaId: number
  periodoId: number
  categoria: CategoriaInstructor
  esManual: boolean
  metricas?: {
  ocupacion: number
  clases: number
  localesEnLima: number
  dobleteos: number
  horariosNoPrime: number
  participacionEventos: boolean
  [key: string]: any
  }
  createdAt?: Date
  updatedAt?: Date

  // Relaciones
  instructor?: Instructor
  disciplina?: Disciplina
  periodo?: Periodo
}

export interface Clase {
  id: string
  pais: string
  ciudad: string
  disciplinaId: number
  semana: number
  estudio: string
  instructorId: number
  periodoId: number
  salon: string
  reservasTotales: number
  listasEspera: number
  cortesias: number
  lugares: number
  reservasPagadas: number
  textoEspecial?: string | null
  fecha: Date
  
  // Nuevos campos
  esVersus: boolean
  vsNum?: number | null

  
  createdAt?: Date
  updatedAt?: Date

  // Relaciones
  instructor?: Instructor
  disciplina?: Disciplina
  periodo?: Periodo
  covers?: Cover[] // Una clase puede tener múltiples covers
}

export interface PagoInstructor {
  id: number
  monto: number
  estado: EstadoPago
  instructorId: number
  periodoId: number
  detalles?: any
  cumpleLineamientos?: boolean
  dobleteos?: number // Relaciones
  horariosNoPrime?: number
  participacionEventos?: boolean  
  retencion: number
  reajuste: number
  cover: number
  brandeo: number // Monto del bono de brandeo
  themeRide: number // Monto del bono de theme ride
  workshop: number // Monto del bono de workshop
  bonoVersus: number // Monto del bono de versus
  penalizacion:number
  tipoReajuste: TipoReajuste
  bono?: number // Monto del bono
  pagoFinal: number
  createdAt?: Date
  updatedAt?: Date
  comentarios?: string
  // Relaciones
  instructor?: Instructor
  periodo?: Periodo
  brandeos?: Brandeo[]
}

export interface Archivo {
  id: number
  nombre: string
  tipo?: string
  url: string
  descripcion: string
  createdAt?: Date
  updatedAt?: Date
}



export interface RequisitosCategoria {
  ocupacion: number
  clases: number
  localesEnLima: number
  dobleteos: number
  horariosNoPrime: number
  participacionEventos: boolean
  antiguedadMinima?: number
  evaluacionPromedio?: number
  capacitacionesCompletadas?: number
  lineamientos: boolean
}

// New interface for tariff per reservation
export interface TarifaPorReserva {
  tarifa: number
  numeroReservas: number
}

// Updated ParametrosPago interface with dynamic tariffs
export interface ParametrosPago {
  cuotaFija: number
  minimoGarantizado: number
  tarifas: TarifaPorReserva[]
  tarifaFullHouse: number
  maximo: number
  bono: number
  retencionPorcentaje?: number
  ajustePorDobleteo?: number
}

// Interface actualizada para Cover
export interface Cover {
  id: number
  
  // Información básica del cover
  instructorOriginalId: number // Instructor que debía dar la clase
  instructorReemplazoId: number // Instructor que hace el cover
  disciplinaId: number // Disciplina de la clase
  periodoId: number // Periodo al que pertenece
  fecha: Date // Fecha de la clase
  hora: string // Hora de la clase (formato "HH:mm")
  
  // Información opcional de clase existente
  claseId?: string // ID de la clase que está siendo cubierta (opcional)
  
  // Estados y configuraciones (solo modificables por managers/admin)
  justificacion: StatusCover // PENDIENTE, APROBADO, RECHAZADO
  pagoBono: boolean
  pagoFullHouse: boolean
  comentarios?: string
  cambioDeNombre?: string
  
  createdAt?: Date
  updatedAt?: Date

  // Relaciones
  instructorOriginal?: Instructor
  instructorReemplazo?: Instructor
  disciplina?: Disciplina
  periodo?: Periodo
  clase?: Clase
}

// Interface para Penalizacion
export interface Penalizacion {
  id: number
  instructorId: number
  disciplinaId?: number | null
  periodoId: number
  tipo: TipoPenalizacion
  puntos: number
  descripcion?: string
  activa: boolean
  aplicadaEn: Date
  comentarios?: string
  createdAt?: Date
  updatedAt?: Date

  // Relaciones
  instructor?: Instructor
  disciplina?: Disciplina
  periodo?: Periodo
}

// Interface para las reglas de descuento de penalizaciones en Formula
export interface ReglasDescuentoPenalizacion {
  umbralPermitido: number // Porcentaje de clases permitidas como umbral
  basePuntosPorClase: number // Puntos base por clase para calcular umbral
  reglasDescuento: {
    porExcesoPuntos: Array<{
      desde: number
      hasta: number
      descuentoPorcentaje: number
    }>
  }
  tiposPenalizacion: Record<TipoPenalizacion, number | "variable">
}




// Define the FormulaDB interface
export interface FormulaDB {
  id: number
  disciplinaId: number
  periodoId: number
  requisitosCategoria: Record<CategoriaInstructor, RequisitosCategoria>
  parametrosPago: Record<CategoriaInstructor, ParametrosPago>
  reglasDescuentoPenalizacion?: ReglasDescuentoPenalizacion
  createdAt?: Date
  updatedAt?: Date

  // Relations
  disciplina?: Disciplina
  periodo?: Periodo
}

export interface ResultadoCalculo {
  pago: number;
  categoria: CategoriaInstructor;
  metricas: {
    totalClases: number;
    ocupacionPromedio: number;
    totalAsistentes: number;
    totalDobleteos: number;
    totalLocales: number;
  };
  logs: string[];
  pagoId?: number;
  retencion?: number;
}

// Ejemplo de estructura JSON para requisitosCategoria
export const requisitosCategoriaEjemplo = {
  INSTRUCTOR: {
    ocupacion: 0.0,
    clases: 0,
    localesEnLima: 1,
    dobleteos: 0,
    horariosNoPrime: 0,
    participacionEventos: false,
    lineamientos: true,
  },
  EMBAJADOR_JUNIOR: {
    ocupacion: 40.0,
    clases: 4,
    localesEnLima: 2,
    dobleteos: 1,
    horariosNoPrime: 1,
    participacionEventos: false,
    lineamientos: true,
  },
  EMBAJADOR: {
    ocupacion: 60.0,
    clases: 6,
    localesEnLima: 3,
    dobleteos: 2,
    horariosNoPrime: 2,
    participacionEventos: true,
    lineamientos: true,
  },
  EMBAJADOR_SENIOR: {
    ocupacion: 80.0,
    clases: 9,
    localesEnLima: 4,
    dobleteos: 3,
    horariosNoPrime: 3,
    participacionEventos: true,
    lineamientos: true,
  },
}

// Ejemplo de estructura JSON para parametrosPago
export const parametrosPagoEjemplo = {
  INSTRUCTOR: {
    cuotaFija: 0.0,
    minimoGarantizado: 0.0,
    tarifas: [
      { tarifa: 3.25, numeroReservas: 19 },
      { tarifa: 4.25, numeroReservas: 49 },
    ],
    tarifaFullHouse: 5.25,
    maximo: 262.5,
    bono: 0.0,
    retencionPorcentaje: 8.0,
    ajustePorDobleteo: 0.0,
  },
  EMBAJADOR_JUNIOR: {
    cuotaFija: 0.0,
    minimoGarantizado: 60.0,
    tarifas: [
      { tarifa: 3.5, numeroReservas: 19 },
      { tarifa: 4.5, numeroReservas: 49 },
    ],
    tarifaFullHouse: 5.5,
    maximo: 275.0,
    bono: 0.5,
    retencionPorcentaje: 8.0,
    ajustePorDobleteo: 0.25,
  },
  EMBAJADOR: {
    cuotaFija: 0.0,
    minimoGarantizado: 80.0,
    tarifas: [
      { tarifa: 4.0, numeroReservas: 19 },
      { tarifa: 5.0, numeroReservas: 49 },
    ],
    tarifaFullHouse: 6.0,
    maximo: 300.0,
    bono: 1.0,
    retencionPorcentaje: 8.0,
    ajustePorDobleteo: 0.5,
  },
  EMBAJADOR_SENIOR: {
    cuotaFija: 0.0,
    minimoGarantizado: 100.0,
    tarifas: [
      { tarifa: 4.0, numeroReservas: 19 },
      { tarifa: 5.0, numeroReservas: 49 },
    ],
    tarifaFullHouse: 6.0,
    maximo: 325.0,
    bono: 1.5,
    retencionPorcentaje: 8.0,
    ajustePorDobleteo: 1.0,
  },
}

// Nueva interfaz para Brandeo
export interface Brandeo {
  id: number
  numero: number
  instructorId: number
  periodoId: number
  comentarios?: string
  createdAt?: Date
  updatedAt?: Date

  // Relaciones
  instructor?: Instructor
  periodo?: Periodo
  pagos?: PagoInstructor[]
}

// Query parameter types for brandeos
export interface BrandeosQueryParams extends PaginationParams {
  periodoId?: number
  instructorId?: number
  numero?: number
  busqueda?: string
}

// Nueva interfaz para ThemeRide
export interface ThemeRide {
  id: number
  numero: number
  instructorId: number
  periodoId: number
  comentarios?: string
  createdAt?: Date
  updatedAt?: Date

  // Relaciones
  instructor?: Instructor
  periodo?: Periodo
}

// Query parameter types for theme rides
export interface ThemeRidesQueryParams extends PaginationParams {
  periodoId?: number
  instructorId?: number
  numero?: number
  busqueda?: string
}

// Nueva interfaz para Workshop
export interface Workshop {
  id: number
  nombre: string
  instructorId: number
  periodoId: number
  fecha: Date
  comentarios?: string
  pago: number
  createdAt?: Date
  updatedAt?: Date

  // Relaciones
  instructor?: Instructor
  periodo?: Periodo
}

// Query parameter types for workshops
export interface WorkshopsQueryParams extends PaginationParams {
  periodoId?: number
  instructorId?: number
  nombre?: string
  busqueda?: string
  fechaDesde?: string
  fechaHasta?: string
}