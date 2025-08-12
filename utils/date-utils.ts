/**
 * Utilidades para formatear fechas y horas en hora peruana
 */

/**
 * Convierte una fecha UTC a hora peruana (UTC-5)
 * @param fecha - Fecha en formato ISO o Date
 * @returns Fecha en hora peruana
 */
export function toPeruTime(fecha: Date | string): Date {
  const date = new Date(fecha)
  // Perú está en UTC-5, pero como la fecha ya está en UTC, solo necesitamos formatearla
  // No sumar 5 horas, solo usar la zona horaria correcta
  return date
}

/**
 * Formatea una fecha para mostrar solo la fecha (sin hora)
 * @param fecha - Fecha en formato ISO o Date
 * @returns Fecha formateada en español peruano
 */
export function formatPeruDate(fecha: Date | string): string {
  const date = toPeruTime(fecha)
  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Lima'
  })
}

/**
 * Formatea una fecha para mostrar solo la hora
 * @param fecha - Fecha en formato ISO o Date
 * @returns Hora formateada en formato 24h
 */
export function formatPeruTime(fecha: Date | string): string {
  const date = toPeruTime(fecha)
  return date.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Lima'
  })
}

/**
 * Formatea una fecha para mostrar fecha y hora
 * @param fecha - Fecha en formato ISO o Date
 * @returns Fecha y hora formateada en español peruano
 */
export function formatPeruDateTime(fecha: Date | string): string {
  const date = toPeruTime(fecha)
  return date.toLocaleString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Lima'
  })
}

/**
 * Formatea una fecha para mostrar el día de la semana
 * @param fecha - Fecha en formato ISO o Date
 * @returns Día de la semana en español
 */
export function formatPeruWeekday(fecha: Date | string): string {
  const date = toPeruTime(fecha)
  return date.toLocaleDateString('es-PE', {
    weekday: 'long',
    timeZone: 'America/Lima'
  })
}

/**
 * Obtiene la hora en formato HH:MM desde una fecha ISO
 * @param fechaISO - Fecha en formato ISO (ej: 2025-07-14T06:00:00.000Z)
 * @returns Hora en formato HH:MM
 */
export function getHourFromISO(fechaISO: string): string {
  try {
    const date = new Date(fechaISO)
    if (isNaN(date.getTime())) {
      return "00:00"
    }
    
    // Usar zona horaria peruana para mostrar la hora correcta
    return date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Lima'
    })
  } catch (error) {
    console.error("Error al extraer hora de fecha ISO:", error)
    return "00:00"
  }
}

/**
 * Obtiene la fecha en formato DD/MM/YYYY desde una fecha ISO
 * @param fechaISO - Fecha en formato ISO (ej: 2025-07-14T06:00:00.000Z)
 * @returns Fecha en formato DD/MM/YYYY
 */
export function getDateFromISO(fechaISO: string): string {
  try {
    const date = new Date(fechaISO)
    if (isNaN(date.getTime())) {
      return "00/00/0000"
    }
    
    // Usar zona horaria peruana para mostrar la fecha correcta
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Lima'
    })
  } catch (error) {
    console.error("Error al extraer fecha de fecha ISO:", error)
    return "00/00/0000"
  }
}
