/**
 * Archivo de configuración con valores hardcodeados para la aplicación
 * Incluye horarios no prime por salón, disciplinas sin categorización visual, etc.
 */

// Definir tipos para mejorar la seguridad de tipos
type HorarioRecord = Record<string, boolean>
type EstudioRecord = Record<string, HorarioRecord>

// Horarios NO estelares (no prime) por salón/estudio
export const HORARIOS_NO_PRIME: EstudioRecord = {
  // Formato: { estudio: { hora: boolean } }
  // Las horas deben estar en formato de 24 horas (HH:MM)
  Reducto: {
    "08:00": true,
    "09:00": true,
    "13:00": true,
    "18:00": true, // 6:00pm (pendiente de votación)
  },
  "San Isidro": {
    "09:00": true,
    "13:00": true,
  },
  Primavera: {
    "09:00": true,
    "13:00": true,
    "18:00": true,
  },
  Estancia: {
    "06:00": true,
    "09:15": true,
    "18:00": true,
  },
}

// Disciplinas que no aplican para mostrar categorización visual
// Estas disciplinas no mostrarán la categoría del instructor en la UI, aunque sí se calculará internamente
export const DISCIPLINAS_SIN_CATEGORIA_VISUAL = ["Barre", "Yoga", "Ejercito"]

// Valor de retención para pagos (porcentaje expresado como decimal)
export const RETENCION_VALOR = 0.08 // 8%

// Configuración de categorías de instructores
export const CATEGORIAS_CONFIG = {
  // Nombres para mostrar en la UI
  NOMBRES_CATEGORIAS: {
    INSTRUCTOR: "Instructor",
    EMBAJADOR_JUNIOR: "Embajador Junior",
    EMBAJADOR: "Embajador",
    EMBAJADOR_SENIOR: "Embajador Senior",
  },
  // Colores para las badges de categorías
  COLORES_CATEGORIAS: {
    INSTRUCTOR: "bg-gray-100 text-gray-800 border-gray-200",
    EMBAJADOR_JUNIOR: "bg-teal-100 text-teal-800 border-teal-200",
    EMBAJADOR: "bg-blue-100 text-blue-800 border-blue-200",
    EMBAJADOR_SENIOR: "bg-purple-100 text-purple-800 border-purple-200",
  },
  // Orden de prioridad de categorías (de mayor a menor)
  PRIORIDAD_CATEGORIAS: ["EMBAJADOR_SENIOR", "EMBAJADOR", "EMBAJADOR_JUNIOR", "INSTRUCTOR"],
}

// Función para verificar si un horario es no prime para un estudio específico
export function esHorarioNoPrime(estudio: string, hora: string): boolean {
  // Normalizar la hora al formato HH:MM
  let horaNormalizada = hora

  // Si la hora viene con formato de 12 horas (con am/pm), convertirla a 24 horas
  if (hora.toLowerCase().includes("am") || hora.toLowerCase().includes("pm")) {
    const [horaStr, minutos] = hora.replace(/[^\d:]/g, "").split(":")
    let horaNum = Number.parseInt(horaStr, 10)

    if (hora.toLowerCase().includes("pm") && horaNum < 12) {
      horaNum += 12
    } else if (hora.toLowerCase().includes("am") && horaNum === 12) {
      horaNum = 0
    }

    horaNormalizada = `${horaNum.toString().padStart(2, "0")}:${minutos || "00"}`
  }

  // Recorrer todas las entradas en HORARIOS_NO_PRIME
  for (const [estudioConfig, horarios] of Object.entries(HORARIOS_NO_PRIME)) {
    // Verificar si el nombre del estudio de la configuración está contenido en el estudio proporcionado
    if (estudio.toLowerCase().includes(estudioConfig.toLowerCase())) {
      // Si el estudio coincide, verificar si la hora está en la lista de horarios no prime
      if (horarios[horaNormalizada]) {
        return true
      }
    }
  }

  return false
}

// Función para verificar si una disciplina debe mostrar categoría visual
export function mostrarCategoriaVisual(disciplina: string): boolean {
  return !DISCIPLINAS_SIN_CATEGORIA_VISUAL.includes(disciplina)
}

// Exportar todas las configuraciones como un objeto único para facilitar importaciones
export const CONFIG = {
  HORARIOS_NO_PRIME,
  DISCIPLINAS_SIN_CATEGORIA_VISUAL,
  RETENCION_VALOR,
  CATEGORIAS_CONFIG,
  esHorarioNoPrime,
  mostrarCategoriaVisual,
}

export default CONFIG
