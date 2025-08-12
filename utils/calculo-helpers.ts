import { calcularPago } from "@/lib/formula-evaluator";
import type {
  CategoriaInstructor,
  Clase,
  Disciplina,
  FormulaDB,
  Penalizacion,
  RequisitosCategoria,
  Instructor,
  Periodo,
} from "@/types/schema";

// --- TIPOS Y CONSTANTES --- //

type HorarioRecord = Record<string, boolean>;
type EstudioRecord = Record<string, HorarioRecord>;
type MetricasDisciplina = {
  totalClases: number;
  ocupacionPromedio: number;
  totalLocales: number;
  totalDobleteos: number;
  horariosNoPrime: number;
  participacionEventos: boolean;
  cumpleLineamientos: boolean;
};

interface CalculoPagoInstructorParams {
  instructor: Instructor;
  periodo: Periodo;
  disciplinas: Disciplina[];
  formulas: FormulaDB[];
  clases: Clase[];
  penalizaciones: Penalizacion[];
  covers: { claseId: string; pagoBono: boolean; pagoFullHouse: boolean }[];
  manualCategorias?: { instructorId: number; disciplinaId: number; categoria: CategoriaInstructor }[];
}

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

const RETENCION_VALOR = 0.08; // 8% de retención
const MONTO_COVER = 80; // Pago fijo por cover
const MAX_PENALIZACION_PORCENTAJE = 10; // Máximo 10% de descuento por penalizaciones

// --- FUNCIONES AUXILIARES DE FECHA Y HORA --- //

export const obtenerHora = (fecha: Date | string): string => {
  try {
    const dateObj = new Date(fecha);
    if (isNaN(dateObj.getTime())) {
      throw new Error('Fecha inválida');
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

export const obtenerClaveFecha = (fecha: Date | string): string => {
  try {
    const dateObj = new Date(fecha);
    if (isNaN(dateObj.getTime())) {
      throw new Error('Fecha inválida');
    }
    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    console.error("Error al obtener clave de fecha:", error);
    return "fecha-invalida";
  }
};

// --- FUNCIONES DE CÁLCULO DE MÉTRICAS --- //

export const calcularMetricasDisciplina = (
  clases: Clase[],
  disciplinaId: number,
  sicloId: number | null
): MetricasDisciplina => {
  const clasesDisciplina = clases.filter(c => c.disciplinaId === disciplinaId);
  const totalClases = clasesDisciplina.length;
  
  const totalReservas = clasesDisciplina.reduce((sum, c) => sum + c.reservasTotales, 0);
  const totalLugares = clasesDisciplina.reduce((sum, c) => sum + c.lugares, 0);
  const ocupacionPromedio = totalLugares > 0 ? (totalReservas / totalLugares) * 100 : 0;
  
  // Contar locales únicos (estudios) donde el instructor dictó clases
  const estudios = clasesDisciplina
    .map(c => c.estudio)
    .filter(estudio => estudio && estudio.trim() !== ''); // Filtrar estudios vacíos
  
  const localesEnLima = new Set(estudios).size;
  
  // Logs para debugging
  console.log(`🔍 DEBUG: calcularMetricasDisciplina para disciplina ${disciplinaId}:`);
  console.log(`   - Total clases: ${totalClases}`);
  console.log(`   - Estudios encontrados: ${estudios.join(', ')}`);
  console.log(`   - Estudios únicos: ${localesEnLima}`);
  console.log(`   - Ocupación: ${ocupacionPromedio.toFixed(2)}%`);

  const dobleteos = calcularDobleteos(clasesDisciplina, sicloId);
  const horariosNoPrime = calcularHorariosNoPrime(clasesDisciplina, sicloId);

  return {
    totalClases,
    ocupacionPromedio,
    totalLocales: localesEnLima,
    totalDobleteos: dobleteos,
    horariosNoPrime,
    participacionEventos: false, // Por defecto, se puede sobreescribir
    cumpleLineamientos: true    // Por defecto, se puede sobreescribir
  };
};

export const calcularMetricasGenerales = (
  clases: Clase[],
  sicloId: number | null
) => {
  const totalClases = clases.length;
  const totalReservas = clases.reduce((sum, c) => sum + c.reservasTotales, 0);
  const totalLugares = clases.reduce((sum, c) => sum + c.lugares, 0);
  const ocupacionPromedio = totalLugares > 0 ? (totalReservas / totalLugares) * 100 : 0;
  const dobleteos = calcularDobleteos(clases, sicloId);
  const horariosNoPrime = calcularHorariosNoPrime(clases, sicloId);

  return {
    totalClases,
    ocupacionPromedio,
    totalReservas,
    totalLugares,
    dobleteos,
    horariosNoPrime,
    clasesPorSemana: totalClases / 4
  };
};

// --- FUNCIONES DE CÁLCULO DE CATEGORÍAS --- //

export const determinarCategoria = (
  formula: FormulaDB,
  metricas: MetricasDisciplina,
  categoriaManual?: CategoriaInstructor
): CategoriaInstructor => {
  console.log("🔍 DEBUG: determinarCategoria llamada con:", {
    formulaId: formula.id,
    metricas,
    requisitos: formula.requisitosCategoria
  });

  if (categoriaManual) {
    console.log("✅ Usando categoría manual:", categoriaManual);
    return categoriaManual;
  }

  const requisitos = formula.requisitosCategoria;
  
  // Orden de evaluación: de mayor a menor categoría (EMBAJADOR_SENIOR -> EMBAJADOR -> EMBAJADOR_JUNIOR -> INSTRUCTOR)
  
  // 1. Evaluar EMBAJADOR_SENIOR (categoría más alta)
  console.log("🔍 Evaluando EMBAJADOR_SENIOR...");
  if (requisitos.EMBAJADOR_SENIOR &&
      metricas.ocupacionPromedio >= requisitos.EMBAJADOR_SENIOR.ocupacion &&
      (metricas.totalClases / 4) >= requisitos.EMBAJADOR_SENIOR.clases &&
      metricas.totalLocales >= requisitos.EMBAJADOR_SENIOR.localesEnLima &&
      metricas.totalDobleteos >= requisitos.EMBAJADOR_SENIOR.dobleteos &&
      metricas.horariosNoPrime >= requisitos.EMBAJADOR_SENIOR.horariosNoPrime &&
      (metricas.participacionEventos || !requisitos.EMBAJADOR_SENIOR.participacionEventos) &&
      (metricas.cumpleLineamientos || !requisitos.EMBAJADOR_SENIOR.lineamientos)) {
    console.log("✅ Cumple requisitos para EMBAJADOR_SENIOR");
    return "EMBAJADOR_SENIOR";
  }

  // 2. Evaluar EMBAJADOR (categoría intermedia)
  console.log("🔍 Evaluando EMBAJADOR...");
  console.log("🔍 Requisitos EMBAJADOR:", requisitos.EMBAJADOR);
  console.log("🔍 Métricas vs Requisitos:");
  console.log(`   - Ocupación: ${metricas.ocupacionPromedio}% >= ${requisitos.EMBAJADOR?.ocupacion}% = ${metricas.ocupacionPromedio >= (requisitos.EMBAJADOR?.ocupacion || 0)}`);
  console.log(`   - Clases por semana: ${(metricas.totalClases / 4)} >= ${requisitos.EMBAJADOR?.clases} = ${(metricas.totalClases / 4) >= (requisitos.EMBAJADOR?.clases || 0)}`);
  console.log(`   - Locales en Lima: ${metricas.totalLocales} >= ${requisitos.EMBAJADOR?.localesEnLima} = ${metricas.totalLocales >= (requisitos.EMBAJADOR?.localesEnLima || 0)}`);
  console.log(`   - Dobleteos: ${metricas.totalDobleteos} >= ${requisitos.EMBAJADOR?.dobleteos} = ${metricas.totalDobleteos >= (requisitos.EMBAJADOR?.dobleteos || 0)}`);
  console.log(`   - Horarios no prime: ${metricas.horariosNoPrime} >= ${requisitos.EMBAJADOR?.horariosNoPrime} = ${metricas.horariosNoPrime >= (requisitos.EMBAJADOR?.horariosNoPrime || 0)}`);
  console.log(`   - Participación eventos: ${metricas.participacionEventos} || !${requisitos.EMBAJADOR?.participacionEventos} = ${(metricas.participacionEventos || !requisitos.EMBAJADOR?.participacionEventos)}`);
  console.log(`   - Cumple lineamientos: ${metricas.cumpleLineamientos} || !${requisitos.EMBAJADOR?.lineamientos} = ${(metricas.cumpleLineamientos || !requisitos.EMBAJADOR?.lineamientos)}`);

  if (requisitos.EMBAJADOR &&
      metricas.ocupacionPromedio >= requisitos.EMBAJADOR.ocupacion &&
      (metricas.totalClases / 4) >= requisitos.EMBAJADOR.clases &&
      metricas.totalLocales >= requisitos.EMBAJADOR.localesEnLima &&
      metricas.totalDobleteos >= requisitos.EMBAJADOR.dobleteos &&
      metricas.horariosNoPrime >= requisitos.EMBAJADOR.horariosNoPrime &&
      (metricas.participacionEventos || !requisitos.EMBAJADOR.participacionEventos) &&
      (metricas.cumpleLineamientos || !requisitos.EMBAJADOR.lineamientos)) {
    console.log("✅ Cumple requisitos para EMBAJADOR");
    return "EMBAJADOR";
  }

  // 3. Evaluar EMBAJADOR_JUNIOR (categoría baja)
  console.log("🔍 Evaluando EMBAJADOR_JUNIOR...");
  if (requisitos.EMBAJADOR_JUNIOR &&
      metricas.ocupacionPromedio >= requisitos.EMBAJADOR_JUNIOR.ocupacion &&
      (metricas.totalClases / 4) >= requisitos.EMBAJADOR_JUNIOR.clases &&
      metricas.totalLocales >= requisitos.EMBAJADOR_JUNIOR.localesEnLima &&
      metricas.totalDobleteos >= requisitos.EMBAJADOR_JUNIOR.dobleteos &&
      metricas.horariosNoPrime >= requisitos.EMBAJADOR_JUNIOR.horariosNoPrime &&
      (metricas.participacionEventos || !requisitos.EMBAJADOR_JUNIOR.participacionEventos) &&
      (metricas.cumpleLineamientos || !requisitos.EMBAJADOR_JUNIOR.lineamientos)) {
    console.log("✅ Cumple requisitos para EMBAJADOR_JUNIOR");
    return "EMBAJADOR_JUNIOR";
  }

  // 4. Categoría por defecto
  console.log("⚠️ No cumple requisitos para ninguna categoría especial, asignando INSTRUCTOR");
  return "INSTRUCTOR";
};

// --- FUNCIONES DE CÁLCULO ESPECÍFICAS --- //

export const calcularDobleteos = (clases: Clase[], sicloId: number | null): number => {
  if (!sicloId || clases.length <= 1) {
    return 0;
  }

  const clasesSiclo = clases.filter((c) => c.disciplinaId === sicloId);
  const clasesPorDia: Record<string, any[]> = {};

  // Agrupar clases por día
  clasesSiclo.forEach(clase => {
    const fechaKey = obtenerClaveFecha(clase.fecha);
    if (!clasesPorDia[fechaKey]) {
      clasesPorDia[fechaKey] = [];
    }
    clasesPorDia[fechaKey].push({
      ...clase,
      hora: obtenerHora(clase.fecha)
    });
  });

  let totalDobleteos = 0;

  // Calcular dobleteos por día
  Object.values(clasesPorDia).forEach(clasesDelDia => {
    // Ordenar clases por hora
    clasesDelDia.sort((a, b) => {
      const [horaA, minA] = a.hora.split(':').map(Number);
      const [horaB, minB] = b.hora.split(':').map(Number);
      return horaA - horaB || minA - minB;
    });

    // Verificar clases consecutivas
    for (let i = 0; i < clasesDelDia.length - 1; i++) {
      const [horaActual, minActual] = clasesDelDia[i].hora.split(':').map(Number);
      const [horaSiguiente, minSiguiente] = clasesDelDia[i + 1].hora.split(':').map(Number);

      const diferenciaHoras = horaSiguiente - horaActual;
      const diferenciaMinutos = minSiguiente - minActual;

      if (
        (diferenciaHoras === 1 && diferenciaMinutos === 0) || // Ej: 10:00 -> 11:00
        (diferenciaHoras === 0 && Math.abs(diferenciaMinutos) >= 60) // Ej: 10:00 -> 10:60 (no debería ocurrir)
      ) {
        totalDobleteos++;
      }
    }
  });

  return totalDobleteos;
};

export const calcularHorariosNoPrime = (clases: Clase[], sicloId: number | null): number => {
  return clases.filter(clase => {
    // Solo aplicar para Síclo si se especifica
    if (sicloId && clase.disciplinaId !== sicloId) {
      return false;
    }

    try {
      const hora = obtenerHora(clase.fecha);
      const estudio = clase.estudio || "";

      // Buscar coincidencia en los horarios no prime configurados
      for (const [estudioConfig, horarios] of Object.entries(HORARIOS_NO_PRIME)) {
        if (estudio.toLowerCase().includes(estudioConfig.toLowerCase()) && horarios[hora]) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error al calcular horario no prime:", error);
      return false;
    }
  }).length;
};

export const calcularPenalizacion = (
  clasesInstructor: Clase[],
  penalizaciones: Penalizacion[],
  disciplinas: Disciplina[]
) => {
  const totalClases = clasesInstructor.length;
  const maxPuntosPermitidos = Math.floor(totalClases * MAX_PENALIZACION_PORCENTAJE / 100);
  
  // Detalle completo de cada penalización
  const detallePenalizaciones = penalizaciones.map(p => ({
    tipo: p.tipo,
    puntos: p.puntos,
    descripcion: p.descripcion || 'Sin descripción',
    fecha: p.aplicadaEn,
    disciplina: disciplinas.find(d => d.id === p.disciplinaId)?.nombre || 'General'
  }));

  const totalPuntos = penalizaciones.reduce((sum, p) => sum + p.puntos, 0);
  const puntosExcedentes = Math.max(0, totalPuntos - maxPuntosPermitidos);
  const porcentajeDescuento = Math.min(puntosExcedentes, MAX_PENALIZACION_PORCENTAJE);

  return {
    puntos: totalPuntos,
    maxPermitidos: maxPuntosPermitidos,
    excedentes: puntosExcedentes,
    descuento: porcentajeDescuento,
    detalle: detallePenalizaciones
  };
};
