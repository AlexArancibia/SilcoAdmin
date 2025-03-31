import type { Formula } from "@/types/formula";

export type EstadoPago = "PENDIENTE" | "APROBADO";
export type TipoReajuste = "FIJO" | "PORCENTAJE"
export enum Rol {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  USUARIO = "USUARIO",
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Instructor {
  id: number;
  nombre: string;
  password?: string;
  extrainfo?: InstructorExtraInfo;
  createdAt?: Date;
  updatedAt?: Date;
  
  // Relaciones
  clases?: Clase[];
  pagos?: PagoInstructor[];
  disciplinas?: Disciplina[];
}

export interface InstructorExtraInfo {
  telefono?: string;
  especialidad?: string;
  estado?: string;
  activo?: boolean;
  foto?: string;
  biografia?: string;
  experiencia?: number;
  [key: string]: any;
}

export interface Disciplina {
  id: number;
  nombre: string;
  descripcion?: string;
  color?: string;
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  // Relaciones
  clases?: Clase[];
  formulas?: FormulaDB[];
  instructores?: Instructor[];
}

export interface Periodo {
  id: number;
  numero: number;
  año: number;
  fechaInicio: Date;
  fechaFin: Date;
  fechaPago: Date;
  createdAt?: Date;
  updatedAt?: Date;

  // Relaciones
  clases?: Clase[];
  pagos?: PagoInstructor[];
  formulas?: FormulaDB[];
}

export interface FormulaDB {
  id: number;
  disciplinaId: number;
  periodoId: number;
  parametros: {
    formula: Formula;
    [key: string]: any;
  };
  createdAt?: Date;
  updatedAt?: Date;

  // Relaciones
  disciplina?: Disciplina;
  periodo?: Periodo;
}

export interface Clase {
  id: number;
  pais: string;
  ciudad: string;
  disciplinaId: number;
  semana: number;
  estudio: string;
  instructorId: number;
  periodoId: number;
  salon: string;
  reservasTotales: number;
  listasEspera: number;
  cortesias: number;
  lugares: number;
  reservasPagadas: number;
  textoEspecial?: string;
  fecha: Date;
  createdAt?: Date;
  updatedAt?: Date;

  // Relaciones
  instructor?: Instructor;
  disciplina?: Disciplina;
  periodo?: Periodo;
}

export interface PagoInstructor {
  id: number;
  monto: number;
  estado: EstadoPago;
  instructorId: number;
  periodoId: number;
  detalles?: any;
  retencion: number;
  reajuste: number;
  tipoReajuste:TipoReajuste ;
  pagoFinal:number;
  createdAt?: Date;
  updatedAt?: Date;
  
  // Relaciones
  instructor?: Instructor;
  periodo?: Periodo;
}

export interface Archivo {
  id: number;
  nombre: string;
  tipo?: string;
  url: string;
  descripcion: string;
  createdAt?: Date;
  updatedAt?: Date;
}
