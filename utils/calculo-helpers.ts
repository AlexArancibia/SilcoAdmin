import { prisma } from "@/lib/prisma";
import type {
  CategoriaInstructor,
  Clase,
  FormulaDB,
  Penalizacion,
  RequisitosCategoria,
  TipoPenalizacion,
} from "@/types/schema";

// --- TIPOS Y CONSTANTES --- //

type HorarioRecord = Record<string, boolean>;
type EstudioRecord = Record<string, HorarioRecord>;

const HORARIOS_NO_PRIME: EstudioRecord = {
  "Reducto": {
    "08:00": true,
    "09:00": true,
    "13:00": true,
    "18:00": true,
  },
  "San Isidro": {
    "09:00": true,
    "13:00": true,
  },
  "Primavera": {
    "09:00": true,
    "13:00": true,
    "18:00": true,
  },
  "Estancia": {
    "06:00": true,
    "09:15": true,
    "18:00": true,
  },
};

// --- FUNCIONES AUXILIARES DE FECHA Y HORA --- //

const obtenerHora = (fecha: Date | string): string => {
  try {
    const dateObj = new Date(fecha);
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }
    return dateObj.toLocaleTimeString('es-PE', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false, 
      timeZone: 'America/Lima' 
    });
  } catch (error) {
    console.error("Error al obtener hora:", error);
    return "00:00";
  }
};

// --- FUNCIONES DE CÁLCULO DE MÉTRICAS Y CATEGORÍAS --- //

export const determinarCategoria = (
  formula: FormulaDB,
  metricas: {
    totalClases: number;
    ocupacionPromedio: number;
    totalLocales: number;
    totalDobleteos: number;
    horariosNoPrime: number;
    participacionEventos: boolean;
    cumpleLineamientos: boolean;
  }
): CategoriaInstructor => {
  const categorias: CategoriaInstructor[] = [
    "EMBAJADOR_SENIOR",
    "EMBAJADOR",
    "EMBAJADOR_JUNIOR",
    "INSTRUCTOR",
  ];

  for (const categoria of categorias) {
    const requisitos = formula.requisitosCategoria[categoria] as RequisitosCategoria;
    if (!requisitos) continue;

    const cumple =
      metricas.totalClases >= requisitos.clases &&
      metricas.ocupacionPromedio >= requisitos.ocupacion &&
      metricas.totalLocales >= requisitos.localesEnLima &&
      metricas.totalDobleteos >= requisitos.dobleteos &&
      metricas.horariosNoPrime >= requisitos.horariosNoPrime &&
      (requisitos.participacionEventos ? metricas.participacionEventos : true) &&
      requisitos.lineamientos;

    if (cumple) {
      return categoria;
    }
  }
  return "INSTRUCTOR";
};

export const calcularDobleteos = (clases: Clase[], sicloId: number | null): number => {
  if (!sicloId || clases.length <= 1) {
    return 0;
  }

  const clasesSiclo = clases.filter((c) => c.disciplinaId === sicloId);
  const clasesPorDia: Record<string, number> = {};

  clasesSiclo.forEach(clase => {
    const fecha = new Date(clase.fecha).toISOString().split('T')[0];
    if (!clasesPorDia[fecha]) {
      clasesPorDia[fecha] = 0;
    }
    clasesPorDia[fecha]++;
  });

  return Object.values(clasesPorDia).filter(count => count > 1).length;
};

export const calcularHorariosNoPrime = (clases: Clase[], sicloId: number | null): number => {
  return clases.filter(clase => {
    // La métrica de horarios no prime solo aplica para Síclo
    if (sicloId && clase.disciplinaId !== sicloId) {
      return false;
    }

    try {
      const hora = obtenerHora(clase.fecha);
      const estudio = clase.estudio || "";

      for (const [estudioConfig, horarios] of Object.entries(HORARIOS_NO_PRIME)) {
        if (estudio.toLowerCase().includes(estudioConfig.toLowerCase()) && horarios[hora]) {
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }).length;
};

// --- FUNCIONES DE CÁLCULO DE PAGOS --- //

export const calcularDatosPenalizacion = (penalizaciones: Penalizacion[], totalClases: number) => {
  if (!penalizaciones || penalizaciones.length === 0) {
    return {
      puntos: 0,
      maxPermitidos: Math.floor(totalClases * 0.1),
      excedentes: 0,
      descuento: 0,
      detalle: [],
    };
  }

  // El 10% del total de clases es el umbral permitido de puntos.
  const maxPuntosPermitidos = Math.floor(totalClases * 0.1);
  
  const detallePenalizaciones = penalizaciones.map(p => ({
    tipo: p.tipo,
    puntos: p.puntos,
    descripcion: p.descripcion || 'Sin descripción',
    fecha: p.aplicadaEn,
  }));

  const totalPuntos = penalizaciones.reduce((sum, p) => sum + p.puntos, 0);
  const puntosExcedentes = Math.max(0, totalPuntos - maxPuntosPermitidos);
  
  // 1 punto excedente equivale a 1% de descuento sobre el pago final.
  const porcentajeDescuento = puntosExcedentes;

  return {
    puntos: totalPuntos,
    maxPermitidos: maxPuntosPermitidos,
    excedentes: puntosExcedentes,
    descuento: porcentajeDescuento,
    detalle: detallePenalizaciones,
  };
};
