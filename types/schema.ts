export enum EstadoPago {
  APROBADO = "APROBADO",
  PENDIENTE = "PENDIENTE",
  RECHAZADO = "RECHAZADO",
  PAGADO = "PAGADO"
}

export enum Rol {
  SUPERADMINISTRADOR = "superadministrador",
  ADMINISTRADOR = "administrador",
  USUARIO = "usuario",
  INSTRUCTOR = "instructor",
}

export enum EstadoInstructor {
  ACTIVO = "ACTIVO",
  INACTIVO = "INACTIVO",
}

export interface Usuario {
  id: number
  nombre: string
  email: string
  password: string
  telefono?: string
  rol: Rol
  foto?: string
  fechaCreacion?: Date
  fechaActualizacion?: Date
}

export interface Instructor {
  id: number
  nombre: string
  email?: string
  password?: string
  extrainfo?: InstructorExtraInfo
  createdAt: Date
  updatedAt: Date
  // Relaciones
  clases?: Clase[]
  pagos?: PagoInstructor[]
  disciplinas?: Disciplina[] // Ahora es un array directo de Disciplina
}

export interface InstructorExtraInfo {
  telefono?: string
  especialidad?: string
  estado?: string
  activo?: boolean
  foto?: string
  biografia?: string
  experiencia?: number
  [key: string]: any
}

export interface Periodo {
  id: number
  numero: number
  año: number
  fechaInicio: Date
  fechaFin: Date
  fechaPago: Date
  createdAt: Date
  updatedAt: Date

  // Relaciones
  clases?: Clase[]
  pagos?: PagoInstructor[]
}

// Importar el tipo Formula desde types/formula
import type { Formula } from "@/types/formula"

// Definir la estructura para el campo parametros como un tipo Record
// para permitir cualquier propiedad
export type ParametrosDisciplina = {
  formula?: Formula
  duracionClase?: number
  capacidadMaxima?: number
  nivelDificultad?: string
  pagoBase?: number
  bonoPorReservacion?: number
  minimoReservaciones?: number
  bonoCompleto?: number
  descuentoFalta?: number
  [key: string]: any
}

// Actualizar la interfaz Disciplina para reflejar el esquema fijo de la base de datos
export interface Disciplina {
  id: number
  nombre: string
  descripcion?: string
  color?: string
  parametros?: ParametrosDisciplina
  activo: boolean
  createdAt: Date
  updatedAt: Date

  // Relaciones
  instructores?: Instructor[] // Ahora es un array directo de Instructor
  clases?: Clase[]
}

export interface Clase {
  id: number
  pais: string
  ciudad: string
  disciplinaId: number
  semana: number
  estudio: string
  instructorId: number
  periodoId: number // Catorcena
  salon: string
  reservasTotales: number
  listasEspera: number
  cortesias: number
  lugares: number // Capacidad total
  reservasPagadas: number
  textoEspecial?: string
  fecha: Date
  createdAt: Date
  updatedAt: Date

  // Relaciones
  instructor?: Instructor
  disciplina?: Disciplina
  periodo?: Periodo
}

export interface PagoInstructor {
  id: number
  monto: number
  estado: EstadoPago
  instructorId: number
  periodoId: number
  detalles?: any // Detalles del cálculo del pago como JSON
  createdAt: Date
  updatedAt: Date

  // Relaciones
  instructor?: Instructor
  periodo?: Periodo
}
 