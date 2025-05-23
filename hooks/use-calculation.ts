"use client"

// Importar la función esHorarioNoPrime del archivo de configuración
import { useState, useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { usePagosStore } from "@/store/usePagosStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { useClasesStore } from "@/store/useClasesStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { useFormulasStore } from "@/store/useFormulaStore"
import { calcularPago } from "@/lib/formula-evaluator"
import { instructoresApi } from "@/lib/api/instructores-api"
import { retencionValor } from "@/utils/const"
// Add import for mostrarCategoriaVisual at the top of the file
import { mostrarCategoriaVisual, HORARIOS_NO_PRIME } from "@/utils/config"
// Primero, importemos el tipo EstadoPago
import type { CategoriaInstructor, EstadoPago } from "@/types/schema"
import type { FormulaDB } from "@/types/schema"
import type { CategoriaInstructorModel } from "@/types/schema"
import type { Periodo } from "@/types/schema"

// Función auxiliar para obtener una clave de fecha consistente
function obtenerClaveFecha(fecha: any): string {
  try {
    // Si es un string, intentamos extraer la fecha
    if (typeof fecha === "string") {
      // Intentar extraer solo la parte de la fecha (YYYY-MM-DD)
      const match = fecha.match(/^\d{4}-\d{2}-\d{2}/)
      if (match) {
        return match[0]
      }

      // Si no coincide con el formato ISO, intentar crear un objeto Date
      const dateObj = new Date(fecha)
      if (!isNaN(dateObj.getTime())) {
        return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`
      }

      // Si todo falla, devolver el string original
      return fecha
    }

    // Si es un objeto Date
    if (fecha instanceof Date && !isNaN(fecha.getTime())) {
      return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`
    }

    // Si es un objeto con propiedades de fecha
    if (fecha && typeof fecha === "object") {
      if ("year" in fecha && "month" in fecha && "day" in fecha) {
        return `${fecha.year}-${String(fecha.month).padStart(2, "0")}-${String(fecha.day).padStart(2, "0")}`
      }
    }

    // Si no podemos determinar la fecha, devolver un string único
    return JSON.stringify(fecha)
  } catch (error) {
    console.error("Error al obtener clave de fecha:", error)
    return "fecha-invalida"
  }
}

// Función auxiliar para obtener la hora de una fecha
function obtenerHora(fecha: any): string {
  try {
    // Si es un string, intentamos extraer la hora
    if (typeof fecha === "string") {
      // Intentar extraer la hora (HH:MM)
      const match = fecha.match(/\d{2}:\d{2}/)
      if (match) {
        return match[0]
      }

      // Si no coincide, intentar crear un objeto Date
      const dateObj = new Date(fecha)
      if (!isNaN(dateObj.getTime())) {
        return `${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`
      }

      // Si todo falla, devolver un valor por defecto
      return "00:00"
    }

    // Si es un objeto Date
    if (fecha instanceof Date && !isNaN(fecha.getTime())) {
      return `${String(fecha.getHours()).padStart(2, "0")}:${String(fecha.getMinutes()).padStart(2, "0")}`
    }

    // Si es un objeto con propiedades de hora
    if (fecha && typeof fecha === "object") {
      if ("hours" in fecha && "minutes" in fecha) {
        return `${String(fecha.hours).padStart(2, "0")}:${String(fecha.minutes).padStart(2, "0")}`
      }
    }

    // Si no podemos determinar la hora, devolver un valor por defecto
    return "00:00"
  } catch (error) {
    console.error("Error al obtener hora:", error)
    return "00:00"
  }
}

// Función para calcular dobleteos (clases consecutivas) para un instructor en la disciplina Síclo
const calcularDobleteos = (clasesInstructor: any[], disciplinaSicloId: number | null): number => {
  // Si no tenemos el ID de la disciplina Síclo o no hay clases, retornar 0
  if (!disciplinaSicloId || clasesInstructor.length === 0) {
    return 0
  }

  // Filtrar solo las clases de Síclo
  const clasesSiclo = clasesInstructor.filter((c) => c.disciplinaId === disciplinaSicloId)

  if (clasesSiclo.length <= 1) {
    return 0 // No hay suficientes clases para formar dobleteos
  }

  // Agrupar clases por fecha (día)
  const clasesPorDia: Record<string, any[]> = {}

  clasesSiclo.forEach((clase) => {
    // Obtener solo la parte de la fecha (sin la hora)
    const fechaKey = obtenerClaveFecha(clase.fecha)

    if (!clasesPorDia[fechaKey]) {
      clasesPorDia[fechaKey] = []
    }

    // Añadir la clase con su hora
    clasesPorDia[fechaKey].push({
      ...clase,
      hora: obtenerHora(clase.fecha),
    })
  })

  // Contar dobleteos por cada día
  let totalDobleteos = 0

  Object.values(clasesPorDia).forEach((clasesDelDia) => {
    // Ordenar clases por hora
    clasesDelDia.sort((a, b) => {
      const horaA = a.hora.split(":").map(Number)
      const horaB = b.hora.split(":").map(Number)

      // Comparar horas y luego minutos
      if (horaA[0] !== horaB[0]) {
        return horaA[0] - horaB[0]
      }
      return horaA[1] - horaB[1]
    })

    // Contar clases consecutivas
    for (let i = 0; i < clasesDelDia.length - 1; i++) {
      const horaActual = clasesDelDia[i].hora.split(":").map(Number)
      const horaSiguiente = clasesDelDia[i + 1].hora.split(":").map(Number)

      // Verificar si son horas consecutivas (diferencia de 1 hora)
      if (
        (horaSiguiente[0] === horaActual[0] + 1 && horaSiguiente[1] === horaActual[1]) ||
        (horaSiguiente[0] === horaActual[0] && Math.abs(horaSiguiente[1] - horaActual[1]) === 60)
      ) {
        totalDobleteos++
      }
    }
  })

  return totalDobleteos / 4
}

// Asegúrate de que la función reevaluarTodasCategorias esté disponible para ser llamada desde otros componentes
export function useCalculation(
  setShowProcessLogsDialog: (show: boolean) => void,
  setShowCalculateDialog: (show: boolean) => void,
) {
  const { pagos, fetchPagos, actualizarPago, crearPago } = usePagosStore()
  const { periodos, periodoActual, actualizarPeriodo } = usePeriodosStore()
  const { instructores, fetchInstructores, actualizarInstructor } = useInstructoresStore()
  const { clases } = useClasesStore()
  const { disciplinas } = useDisciplinasStore()
  const { formulas, fetchFormulas, crearFormula } = useFormulasStore()

  const [isCalculatingPayments, setIsCalculatingPayments] = useState<boolean>(false)
  const [processLogs, setProcessLogs] = useState<string[]>([])
  const [selectedPeriodoId, setSelectedPeriodoId] = useState<number | null>(null)
  const [calcularBonoEnPeriodo, setCalcularBonoEnPeriodo] = useState<boolean>(false)

  // Estados para el diálogo de duplicación de fórmulas
  const [showFormulaDuplicationDialog, setShowFormulaDuplicationDialog] = useState<boolean>(false)
  const [periodoOrigenFormulas, setPeriodoOrigenFormulas] = useState<Periodo | null>(null)
  const [isDuplicatingFormulas, setIsDuplicatingFormulas] = useState<boolean>(false)

  // Añadir este useEffect después de la definición de los estados
  useEffect(() => {
    // Cuando se abre el diálogo, establecer el periodo actual como seleccionado
    if (periodoActual && selectedPeriodoId === null) {
      setSelectedPeriodoId(periodoActual.id)
    }
  }, [periodoActual, selectedPeriodoId])

  // Modificar la función addProcessLog para mejorar la estructura de los logs
  const addProcessLog = (message: string, instructorId?: number) => {
    const timestamp = new Date().toLocaleTimeString()
    const formattedMessage = `[${timestamp}] ${message}`

    setProcessLogs((prev) => {
      // If no instructorId is provided, add to general logs
      if (!instructorId) {
        return [...prev, formattedMessage]
      }

      // Find instructor name for better readability
      const instructor = instructores.find((i) => i.id === instructorId)
      const instructorName = instructor ? instructor.nombre : `Instructor ${instructorId}`

      // Add a separator if this is a new instructor section
      const lastLog = prev[prev.length - 1] || ""
      const isNewInstructorSection = !lastLog.includes(`[INSTRUCTOR: ${instructorName}]`)

      if (isNewInstructorSection && prev.length > 0) {
        return [...prev, `\n[INSTRUCTOR: ${instructorName}] ${formattedMessage}`]
      }

      return [...prev, `[INSTRUCTOR: ${instructorName}] ${formattedMessage}`]
    })
  }

  // Función para verificar si existen fórmulas para un periodo
  const verificarFormulasExistentes = (periodoId: number): boolean => {
    return formulas.some((f) => f.periodoId === periodoId)
  }

  // Función para encontrar el periodo más cercano con fórmulas
  const encontrarPeriodoConFormulas = (periodoId: number): Periodo | null => {
    // Obtener todos los periodos que tienen fórmulas
    const periodosConFormulas = periodos.filter((p) => formulas.some((f) => f.periodoId === p.id))

    if (periodosConFormulas.length === 0) {
      return null
    }

    // Ordenar por cercanía al periodo actual (por ID)
    periodosConFormulas.sort((a, b) => {
      const distanciaA = Math.abs(a.id - periodoId)
      const distanciaB = Math.abs(b.id - periodoId)
      return distanciaA - distanciaB
    })

    // Devolver el más cercano
    return periodosConFormulas[0]
  }

  // Función para duplicar fórmulas de un periodo a otro
  const duplicarFormulas = async (periodoOrigenId: number, periodoDestinoId: number): Promise<void> => {
    setIsDuplicatingFormulas(true)

    try {
      // Obtener las fórmulas del periodo origen
      const formulasOrigen = formulas.filter((f) => f.periodoId === periodoOrigenId)

      if (formulasOrigen.length === 0) {
        throw new Error("No se encontraron fórmulas en el periodo origen")
      }

      // Duplicar cada fórmula para el periodo destino
      for (const formula of formulasOrigen) {
        // Crear una copia de la fórmula con el nuevo periodoId
        const nuevaFormula = {
          ...formula,
          id: undefined, // Eliminar ID para que se genere uno nuevo
          periodoId: periodoDestinoId,
        }

        // Guardar la nueva fórmula
        await crearFormula(nuevaFormula)
      }

      // Recargar las fórmulas
      await fetchFormulas()

      toast({
        title: "Fórmulas duplicadas",
        description: `Se han duplicado ${formulasOrigen.length} fórmulas al periodo seleccionado.`,
      })

      // Cerrar el diálogo y continuar con el cálculo
      setShowFormulaDuplicationDialog(false)
      calcularPagosPeriodo()
    } catch (error) {
      toast({
        title: "Error al duplicar fórmulas",
        description: error instanceof Error ? error.message : "Error desconocido al duplicar fórmulas",
        variant: "destructive",
      })
    } finally {
      setIsDuplicatingFormulas(false)
    }
  }

  // Modificar la función determinarCategoria para mejorar la legibilidad de los logs
  const determinarCategoria = (
    instructorId: number,
    disciplinaId: number,
    periodoId: number,
    formula: FormulaDB,
  ): CategoriaInstructor => {
    console.log(
      `\n[CATEGORIA] Evaluando categoría para instructor ID ${instructorId}, disciplina ID ${disciplinaId}, periodo ID ${periodoId}`,
    )

    // Get instructor's classes for this discipline and period
    const clasesInstructor = clases.filter(
      (c) => c.instructorId === instructorId && c.disciplinaId === disciplinaId && c.periodoId === periodoId,
    )
    console.log(`[CATEGORIA] Encontradas ${clasesInstructor.length} clases para esta disciplina`)

    // Get instructor data
    const instructor = instructores.find((i) => i.id === instructorId)
    if (!instructor) {
      console.log(`[CATEGORIA] ❌ ERROR: Instructor ID ${instructorId} no encontrado`)
      return "INSTRUCTOR"
    }
    console.log(`[CATEGORIA] Evaluando instructor: ${instructor.nombre}`)

    // Buscar el pago del instructor para este periodo (para obtener los campos que ahora están en PagoInstructor)
    const pagoInstructor = pagos.find((p) => p.instructorId === instructorId && p.periodoId === periodoId)
    if (!pagoInstructor) {
      console.log(`[CATEGORIA] ⚠️ No se encontró pago para este instructor en este periodo, usando valores por defecto`)
    }

    // Calculate metrics
    const totalClases = clasesInstructor.length
    // Calcular el promedio semanal de clases (dividir entre 4 semanas)
    const clasesPorSemana = totalClases / 4
    console.log(`[CATEGORIA] Total clases: ${totalClases} (${clasesPorSemana.toFixed(2)} por semana)`)

    // Calculate occupancy rate (reservas / lugares)
    let totalReservas = 0
    let totalLugares = 0
    clasesInstructor.forEach((clase) => {
      totalReservas += clase.reservasTotales
      totalLugares += clase.lugares
    })
    const ocupacion = totalLugares > 0 ? (totalReservas / totalLugares) * 100 : 0
    console.log(`[CATEGORIA] Ocupación: ${ocupacion.toFixed(2)}% (${totalReservas}/${totalLugares})`)

    // Count unique locations in Lima
    const localesEnLima = new Set(
      clasesInstructor.filter((c) => c.ciudad.toLowerCase().includes("lima")).map((c) => c.estudio),
    ).size
    console.log(`[CATEGORIA] Locales en Lima: ${localesEnLima}`)

    // Get instructor metrics - ahora desde pagoInstructor en lugar de instructor
    const dobleteos = pagoInstructor?.dobleteos || 0
    const horariosNoPrime = pagoInstructor?.horariosNoPrime || 0
    const participacionEventos = pagoInstructor?.participacionEventos || false
    const cumpleLineamientos = pagoInstructor?.cumpleLineamientos || false

    console.log(`[CATEGORIA] Factores adicionales:`)
    console.log(`[CATEGORIA] - Dobleteos: ${dobleteos}`)
    console.log(`[CATEGORIA] - Horarios No Prime: ${horariosNoPrime}`)
    console.log(`[CATEGORIA] - Participación Eventos: ${participacionEventos ? "Sí" : "No"}`)
    console.log(`[CATEGORIA] - Cumple Lineamientos: ${cumpleLineamientos ? "Sí" : "No"}`)

    // Check requirements for each category from highest to lowest
    const requisitos = formula.requisitosCategoria
    console.log(`[CATEGORIA] Evaluando requisitos de categorías según fórmula ID ${formula.id}`)

    // Check EMBAJADOR_SENIOR requirements
    console.log(`[CATEGORIA] Evaluando requisitos para EMBAJADOR_SENIOR:`)
    console.log(
      `[CATEGORIA] - Ocupación: ${ocupacion.toFixed(2)}% >= ${requisitos.EMBAJADOR_SENIOR.ocupacion}% ? ${ocupacion >= requisitos.EMBAJADOR_SENIOR.ocupacion}`,
    )
    console.log(
      `[CATEGORIA] - Clases por semana: ${clasesPorSemana.toFixed(2)} >= ${requisitos.EMBAJADOR_SENIOR.clases} ? ${clasesPorSemana >= requisitos.EMBAJADOR_SENIOR.clases}`,
    )
    console.log(
      `[CATEGORIA] - Locales en Lima: ${localesEnLima} >= ${requisitos.EMBAJADOR_SENIOR.localesEnLima} ? ${localesEnLima >= requisitos.EMBAJADOR_SENIOR.localesEnLima}`,
    )
    console.log(
      `[CATEGORIA] - Dobleteos: ${dobleteos} >= ${requisitos.EMBAJADOR_SENIOR.dobleteos} ? ${dobleteos >= requisitos.EMBAJADOR_SENIOR.dobleteos}`,
    )
    console.log(
      `[CATEGORIA] - Horarios No Prime: ${horariosNoPrime} >= ${requisitos.EMBAJADOR_SENIOR.horariosNoPrime} ? ${horariosNoPrime >= requisitos.EMBAJADOR_SENIOR.horariosNoPrime}`,
    )
    console.log(
      `[CATEGORIA] - Participación Eventos: ${participacionEventos} || !${requisitos.EMBAJADOR_SENIOR.participacionEventos} ? ${participacionEventos || !requisitos.EMBAJADOR_SENIOR.participacionEventos}`,
    )
    console.log(
      `[CATEGORIA] - Cumple Lineamientos: ${cumpleLineamientos} || !${requisitos.EMBAJADOR_SENIOR.lineamientos} ? ${cumpleLineamientos || !requisitos.EMBAJADOR_SENIOR.lineamientos}`,
    )

    if (
      requisitos.EMBAJADOR_SENIOR &&
      ocupacion >= requisitos.EMBAJADOR_SENIOR.ocupacion &&
      clasesPorSemana >= requisitos.EMBAJADOR_SENIOR.clases && // Usar clases por semana en lugar del total
      localesEnLima >= requisitos.EMBAJADOR_SENIOR.localesEnLima &&
      dobleteos >= requisitos.EMBAJADOR_SENIOR.dobleteos &&
      horariosNoPrime >= requisitos.EMBAJADOR_SENIOR.horariosNoPrime &&
      // Fix boolean comparison for participacionEventos
      (participacionEventos || !requisitos.EMBAJADOR_SENIOR.participacionEventos) &&
      // Fix boolean comparison for cumpleLineamientos
      (cumpleLineamientos || !requisitos.EMBAJADOR_SENIOR.lineamientos)
    ) {
      console.log(`[CATEGORIA] ✅ Cumple requisitos para EMBAJADOR_SENIOR`)
      return "EMBAJADOR_SENIOR"
    }
    console.log(`[CATEGORIA] ❌ No cumple requisitos para EMBAJADOR_SENIOR`)

    // Check EMBAJADOR requirements
    console.log(`[CATEGORIA] Evaluando requisitos para EMBAJADOR:`)
    console.log(
      `[CATEGORIA] - Ocupación: ${ocupacion.toFixed(2)}% >= ${requisitos.EMBAJADOR.ocupacion}% ? ${ocupacion >= requisitos.EMBAJADOR.ocupacion}`,
    )
    console.log(
      `[CATEGORIA] - Clases por semana: ${clasesPorSemana.toFixed(2)} >= ${requisitos.EMBAJADOR.clases} ? ${clasesPorSemana >= requisitos.EMBAJADOR.clases}`,
    )
    console.log(
      `[CATEGORIA] - Locales en Lima: ${localesEnLima} >= ${requisitos.EMBAJADOR.localesEnLima} ? ${localesEnLima >= requisitos.EMBAJADOR.localesEnLima}`,
    )
    console.log(
      `[CATEGORIA] - Dobleteos: ${dobleteos} >= ${requisitos.EMBAJADOR.dobleteos} ? ${dobleteos >= requisitos.EMBAJADOR.dobleteos}`,
    )
    console.log(
      `[CATEGORIA] - Horarios No Prime: ${horariosNoPrime} >= ${requisitos.EMBAJADOR.horariosNoPrime} ? ${horariosNoPrime >= requisitos.EMBAJADOR.horariosNoPrime}`,
    )
    console.log(
      `[CATEGORIA] - Participación Eventos: ${participacionEventos} || !${requisitos.EMBAJADOR.participacionEventos} ? ${participacionEventos || !requisitos.EMBAJADOR.participacionEventos}`,
    )
    console.log(
      `[CATEGORIA] - Cumple Lineamientos: ${cumpleLineamientos} || !${requisitos.EMBAJADOR.lineamientos} ? ${cumpleLineamientos || !requisitos.EMBAJADOR.lineamientos}`,
    )

    if (
      requisitos.EMBAJADOR &&
      ocupacion >= requisitos.EMBAJADOR.ocupacion &&
      clasesPorSemana >= requisitos.EMBAJADOR.clases && // Usar clases por semana en lugar del total
      localesEnLima >= requisitos.EMBAJADOR.localesEnLima &&
      dobleteos >= requisitos.EMBAJADOR.dobleteos &&
      horariosNoPrime >= requisitos.EMBAJADOR.horariosNoPrime &&
      // Fix boolean comparison for participacionEventos
      (participacionEventos || !requisitos.EMBAJADOR.participacionEventos) &&
      // Fix boolean comparison for cumpleLineamientos
      (cumpleLineamientos || !requisitos.EMBAJADOR.lineamientos)
    ) {
      console.log(`[CATEGORIA] ✅ Cumple requisitos para EMBAJADOR`)
      return "EMBAJADOR"
    }
    console.log(`[CATEGORIA] ❌ No cumple requisitos para EMBAJADOR`)

    // Check EMBAJADOR_JUNIOR requirements
    console.log(`[CATEGORIA] Evaluando requisitos para EMBAJADOR_JUNIOR:`)
    console.log(
      `[CATEGORIA] - Ocupación: ${ocupacion.toFixed(2)}% >= ${requisitos.EMBAJADOR_JUNIOR.ocupacion}% ? ${ocupacion >= requisitos.EMBAJADOR_JUNIOR.ocupacion}`,
    )
    console.log(
      `[CATEGORIA] - Clases por semana: ${clasesPorSemana.toFixed(2)} >= ${requisitos.EMBAJADOR_JUNIOR.clases} ? ${clasesPorSemana >= requisitos.EMBAJADOR_JUNIOR.clases}`,
    )
    console.log(
      `[CATEGORIA] - Locales en Lima: ${localesEnLima} >= ${requisitos.EMBAJADOR_JUNIOR.localesEnLima} ? ${localesEnLima >= requisitos.EMBAJADOR_JUNIOR.localesEnLima}`,
    )
    console.log(
      `[CATEGORIA] - Dobleteos: ${dobleteos} >= ${requisitos.EMBAJADOR_JUNIOR.dobleteos} ? ${dobleteos >= requisitos.EMBAJADOR_JUNIOR.dobleteos}`,
    )
    console.log(
      `[CATEGORIA] - Horarios No Prime: ${horariosNoPrime} >= ${requisitos.EMBAJADOR_JUNIOR.horariosNoPrime} ? ${horariosNoPrime >= requisitos.EMBAJADOR_JUNIOR.horariosNoPrime}`,
    )
    console.log(
      `[CATEGORIA] - Participación Eventos: ${participacionEventos} || !${requisitos.EMBAJADOR_JUNIOR.participacionEventos} ? ${participacionEventos || !requisitos.EMBAJADOR_JUNIOR.participacionEventos}`,
    )
    console.log(
      `[CATEGORIA] - Cumple Lineamientos: ${cumpleLineamientos} || !${requisitos.EMBAJADOR_JUNIOR.lineamientos} ? ${cumpleLineamientos || !requisitos.EMBAJADOR_JUNIOR.lineamientos}`,
    )

    if (
      requisitos.EMBAJADOR_JUNIOR &&
      ocupacion >= requisitos.EMBAJADOR_JUNIOR.ocupacion &&
      clasesPorSemana >= requisitos.EMBAJADOR_JUNIOR.clases && // Usar clases por semana en lugar del total
      localesEnLima >= requisitos.EMBAJADOR_JUNIOR.localesEnLima &&
      dobleteos >= requisitos.EMBAJADOR_JUNIOR.dobleteos &&
      horariosNoPrime >= requisitos.EMBAJADOR_JUNIOR.horariosNoPrime &&
      // Fix boolean comparison for participacionEventos
      (participacionEventos || !requisitos.EMBAJADOR_JUNIOR.participacionEventos) &&
      // Fix boolean comparison for cumpleLineamientos
      (cumpleLineamientos || !requisitos.EMBAJADOR_JUNIOR.lineamientos)
    ) {
      console.log(`[CATEGORIA] ✅ Cumple requisitos para EMBAJADOR_JUNIOR`)
      return "EMBAJADOR_JUNIOR"
    }
    console.log(`[CATEGORIA] ❌ No cumple requisitos para EMBAJADOR_JUNIOR`)

    // Default to INSTRUCTOR
    console.log(`[CATEGORIA] ⚠️ No cumple requisitos para ninguna categoría especial, asignando INSTRUCTOR`)
    return "INSTRUCTOR"
  }

  // Function to get or create instructor category
  const getOrCreateInstructorCategoria = async (
    instructorId: number,
    disciplinaId: number,
    periodoId: number,
    formula: any,
  ): Promise<CategoriaInstructor> => {
    console.log(
      `\n[CATEGORIA_INSTRUCTOR] Obteniendo/creando categoría para instructor ID ${instructorId}, disciplina ID ${disciplinaId}, periodo ID ${periodoId}`,
    )

    // Find the instructor
    const instructor = instructores.find((i) => i.id === instructorId)
    if (!instructor) {
      console.log(`[CATEGORIA_INSTRUCTOR] ⚠️ Instructor ID ${instructorId} no encontrado`)
      addProcessLog(`⚠️ Instructor ID ${instructorId} no encontrado`)
      return "INSTRUCTOR" // Default category if instructor not found
    }
    console.log(`[CATEGORIA_INSTRUCTOR] Instructor encontrado: ${instructor.nombre} (ID: ${instructor.id})`)

    // Buscar el pago del instructor para este periodo (para obtener los campos que ahora están en PagoInstructor)
    const pagoInstructor = pagos.find((p) => p.instructorId === instructorId && p.periodoId === periodoId)
    if (!pagoInstructor) {
      console.log(`[CATEGORIA_INSTRUCTOR] ⚠️ No se encontró pago para este instructor en este periodo`)
    } else {
      console.log(`[CATEGORIA_INSTRUCTOR] Pago encontrado: ID ${pagoInstructor.id}, Monto: ${pagoInstructor.monto}`)
      console.log(
        `[CATEGORIA_INSTRUCTOR] Factores del pago: Dobleteos: ${pagoInstructor.dobleteos}, Horarios No Prime: ${pagoInstructor.horariosNoPrime}`,
      )
      console.log(
        `[CATEGORIA_INSTRUCTOR] Participación Eventos: ${pagoInstructor.participacionEventos ? "Sí" : "No"}, Cumple Lineamientos: ${pagoInstructor.cumpleLineamientos ? "Sí" : "No"}`,
      )
    }

    // Check if instructor already has a category for this specific discipline and period
    const existingCategoria = instructor.categorias?.find(
      (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId,
    )

    if (existingCategoria) {
      console.log(
        `[CATEGORIA_INSTRUCTOR] ✅ Instructor ${instructor.nombre} ya tiene categoría para disciplina ${disciplinaId}: ${existingCategoria.categoria}`,
      )
      addProcessLog(`✓ Instructor ${instructor.nombre} ya tiene categoría para disciplina ${disciplinaId}`)
      return existingCategoria.categoria
    }
    console.log(`[CATEGORIA_INSTRUCTOR] ⚠️ No se encontró categoría existente, calculando nueva categoría...`)

    // Determine appropriate category based on metrics
    console.log(`[CATEGORIA_INSTRUCTOR] Llamando a determinarCategoria para calcular categoría...`)
    const categoriaCalculada = determinarCategoria(instructorId, disciplinaId, periodoId, formula)
    console.log(`[CATEGORIA_INSTRUCTOR] Categoría calculada: ${categoriaCalculada}`)

    // Get instructor's classes for this discipline and period
    const clasesInstructor = clases.filter(
      (c) => c.instructorId === instructorId && c.disciplinaId === disciplinaId && c.periodoId === periodoId,
    )
    console.log(`[CATEGORIA_INSTRUCTOR] Encontradas ${clasesInstructor.length} clases para esta disciplina`)

    // Calculate metrics for storing
    const totalClases = clasesInstructor.length
    // Calcular el promedio semanal de clases
    const clasesPorSemana = totalClases / 4

    // Calculate occupancy rate (reservas / lugares)
    let totalReservas = 0
    let totalLugares = 0
    clasesInstructor.forEach((clase) => {
      totalReservas += clase.reservasTotales
      totalLugares += clase.lugares
    })
    const ocupacion = totalLugares > 0 ? (totalReservas / totalLugares) * 100 : 0
    console.log(
      `[CATEGORIA_INSTRUCTOR] Métricas calculadas: Ocupación: ${ocupacion.toFixed(2)}%, Clases: ${totalClases} (${clasesPorSemana.toFixed(2)} por semana)`,
    )

    // Count unique locations in Lima
    const localesEnLima = new Set(
      clasesInstructor.filter((c) => c.ciudad.toLowerCase().includes("lima")).map((c) => c.estudio),
    ).size
    console.log(`[CATEGORIA_INSTRUCTOR] Locales en Lima: ${localesEnLima}`)

    // Create new category
    try {
      console.log(
        `[CATEGORIA_INSTRUCTOR] ⏳ Creando categoría para ${instructor.nombre} en disciplina ${disciplinaId}...`,
      )
      addProcessLog(`⏳ Creando categoría para ${instructor.nombre} en disciplina ${disciplinaId}...`)

      // Prepare the new category object according to the schema
      const nuevaCategoria: CategoriaInstructorModel = {
        id: Date.now(), // Temporary ID that will be replaced by the server
        instructorId,
        disciplinaId,
        periodoId,
        categoria: categoriaCalculada,
        metricas: {
          ocupacion,
          clases: totalClases,
          localesEnLima,
          dobleteos: pagoInstructor?.dobleteos || 0,
          horariosNoPrime: pagoInstructor?.horariosNoPrime || 0,
          participacionEventos: pagoInstructor?.participacionEventos || false,
        },
      }
      console.log(`[CATEGORIA_INSTRUCTOR] Nueva categoría preparada:`, nuevaCategoria)

      // Importante: Obtener el instructor más actualizado antes de modificar sus categorías
      console.log(`[CATEGORIA_INSTRUCTOR] Obteniendo instructor actualizado desde API...`)
      const instructorActualizado = await instructoresApi.getInstructor(instructorId)
      console.log(`[CATEGORIA_INSTRUCTOR] Instructor actualizado obtenido: ${instructorActualizado.nombre}`)
      console.log(`[CATEGORIA_INSTRUCTOR] Categorías actuales: ${instructorActualizado.categorias?.length || 0}`)

      // Get existing categories or initialize empty array
      const categorias = instructorActualizado.categorias || []
      console.log(`[CATEGORIA_INSTRUCTOR] Categorías existentes: ${categorias.length}`)

      // Make sure we're not duplicating categories
      const categoriaIndex = categorias.findIndex((c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId)
      console.log(`[CATEGORIA_INSTRUCTOR] Índice de categoría existente: ${categoriaIndex}`)

      const updatedCategorias = [...categorias]

      if (categoriaIndex >= 0) {
        // Replace existing category
        console.log(`[CATEGORIA_INSTRUCTOR] Reemplazando categoría existente en índice ${categoriaIndex}`)
        updatedCategorias[categoriaIndex] = { ...updatedCategorias[categoriaIndex], ...nuevaCategoria }
      } else {
        // Add new category
        console.log(`[CATEGORIA_INSTRUCTOR] Agregando nueva categoría`)
        updatedCategorias.push(nuevaCategoria)
      }
      console.log(`[CATEGORIA_INSTRUCTOR] Total categorías después de actualización: ${updatedCategorias.length}`)

      // Update instructor with the new category
      console.log(`[CATEGORIA_INSTRUCTOR] Actualizando instructor con nuevas categorías...`)
      await actualizarInstructor(instructorId, {
        categorias: updatedCategorias,
      })
      console.log(`[CATEGORIA_INSTRUCTOR] ✅ Instructor actualizado exitosamente`)

      addProcessLog(`✓ Categoría creada para ${instructor.nombre} en disciplina ${disciplinaId}: ${categoriaCalculada}`)
      console.log(
        `[CATEGORIA_INSTRUCTOR] ✅ Categoría creada para ${instructor.nombre} en disciplina ${disciplinaId}: ${categoriaCalculada}`,
      )

      // Return the newly created category
      return categoriaCalculada
    } catch (error) {
      console.error(`[CATEGORIA_INSTRUCTOR] ❌ ERROR al crear categoría:`, error)
      addProcessLog(
        `❌ Error al crear categoría para ${instructor.nombre} en disciplina ${disciplinaId}: ${error instanceof Error ? error.message : "Error desconocido"}`,
      )
      return "INSTRUCTOR" // Default to INSTRUCTOR on error
    }
  }

  // Function to calculate and create payments for all instructors in a period
  const calcularPagosPeriodo = async () => {
    // Verificar si hay un periodo seleccionado
    const periodoId = selectedPeriodoId || periodoActual?.id

    if (!periodoId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un periodo para calcular los pagos",
        variant: "destructive",
      })
      return
    }

    // Verificar si existen fórmulas para el periodo seleccionado
    if (!verificarFormulasExistentes(periodoId)) {
      // Buscar el periodo más cercano con fórmulas
      const periodoOrigen = encontrarPeriodoConFormulas(periodoId)
      setPeriodoOrigenFormulas(periodoOrigen)

      // Mostrar diálogo para duplicar fórmulas
      setShowFormulaDuplicationDialog(true)
      setShowCalculateDialog(false)
      return
    }

    // Clear previous logs
    setProcessLogs([])
    setShowProcessLogsDialog(true)

    addProcessLog("🚀 Iniciando proceso de cálculo de pagos...")
    addProcessLog("📊 PASO 1: Evaluando y actualizando categorías de instructores...")

    setIsCalculatingPayments(true)
    setShowCalculateDialog(false)

    // Declare variables here
    let pagosActualizados = 0
    const pagosParaActualizar: any[] = []
    let pagosCreados = 0

    try {
      // Get all instructors with classes in this period
      const instructoresConClases = [
        ...new Set(clases.filter((c) => c.periodoId === periodoId).map((c) => c.instructorId)),
      ]
      const todosInstructores = instructores.filter((i) => instructoresConClases.includes(i.id))

      addProcessLog(`👥 Total instructores con clases: ${todosInstructores.length}`)

      // PASO 1: Evaluar y actualizar categorías de todos los instructores
      const categoriasActualizadas = 0

      // Helper function to calculate metrics
      const calcularMetricas = (clasesInstructor: any[], disciplinaId: number) => {
        const clasesDisciplina = clasesInstructor.filter((c) => c.disciplinaId === disciplinaId)
        const totalClases = clasesDisciplina.length
        const clasesPorSemana = totalClases / 4 // Calcular clases por semana

        let totalReservas = 0
        let totalLugares = 0
        clasesDisciplina.forEach((clase) => {
          totalReservas += clase.reservasTotales
          totalLugares += clase.lugares
        })
        const ocupacion = totalLugares > 0 ? (totalReservas / totalLugares) * 100 : 0

        const localesEnLima = new Set(
          clasesDisciplina.filter((c) => c.ciudad.toLowerCase().includes("lima")).map((c) => c.estudio),
        ).size

        return { ocupacion, clases: totalClases, clasesPorSemana, localesEnLima }
      }

      // Primero, evaluar y actualizar categorías para todos los instructores
      for (const instructor of todosInstructores) {
        addProcessLog(`Evaluando categorías para ${instructor.nombre}`, instructor.id)

        // Get classes for this instructor in this period
        const clasesInstructor = clases.filter(
          (clase) => clase.instructorId === instructor.id && clase.periodoId === periodoId,
        )

        if (clasesInstructor.length === 0) {
          addProcessLog(`Sin clases, omitiendo`, instructor.id)
          continue
        }

        // Get the payment for this instructor in this period
        const pagoExistente = pagos.find((p) => p.instructorId === instructor.id && p.periodoId === periodoId)

        // Si el pago existe y está aprobado, no recalcular y mantener los valores existentes
        if (pagoExistente && pagoExistente.estado === "APROBADO") {
          addProcessLog(`⚠️ Pago ya aprobado, manteniendo valores existentes`, instructor.id)
          pagosActualizados++
          continue
        }

        // Calculate total payment amount
        let montoTotal = 0
        const detallesClases = []
        const disciplinasUnicas = [...new Set(clasesInstructor.map((c) => c.disciplinaId))]

        // Calculate non-prime hours only for Síclo discipline
        const disciplinaSiclo = disciplinas.find((d) => d.nombre === "Síclo")
        const sicloId = disciplinaSiclo ? disciplinaSiclo.id : null

        // Calcular horarios no prime (solo para Síclo)
        const horariosNoPrime = clasesInstructor.filter((clase) => {
          // Solo contar horarios no prime para la disciplina Síclo
          if (sicloId && clase.disciplinaId !== sicloId) {
            return false
          }

          try {
            const hora = obtenerHora(clase.fecha)
            const estudio = clase.estudio || ""

            // Check if this is a non-prime hour
            for (const [estudioConfig, horarios] of Object.entries(HORARIOS_NO_PRIME)) {
              if (estudio.toLowerCase().includes(estudioConfig.toLowerCase()) && horarios[hora]) {
                return true
              }
            }
            return false
          } catch (error) {
            return false
          }
        }).length

        // Calcular dobleteos (solo para Síclo)
        const dobleteos = calcularDobleteos(clasesInstructor, sicloId)
        addProcessLog(`🔄 Dobleteos calculados para ${instructor.nombre}: ${dobleteos}`, instructor.id)

        // Obtener el instructor actualizado para tener sus categorías actualizadas
        const instructorActualizado = await instructoresApi.getInstructor(instructor.id)

        // Ahora, calcular los pagos usando las categorías ya actualizadas
        for (const disciplinaId of disciplinasUnicas) {
          const clasesDisciplina = clasesInstructor.filter((c) => c.disciplinaId === disciplinaId)
          const disciplina = disciplinas.find((d) => d.id === disciplinaId)

          if (!disciplina) continue

          // Get formula for this discipline
          const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodoId)
          if (!formula) continue

          // Obtener la categoría asignada para esta disciplina
          const categoriaInfo = instructorActualizado.categorias?.find(
            (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId,
          )
          const categoriaInstructor = categoriaInfo?.categoria || "INSTRUCTOR"

          addProcessLog(
            `Calculando pagos para disciplina ${disciplina.nombre} con categoría ${categoriaInstructor}`,
            instructor.id,
          )

          // Calculate payment for each class in this discipline
          for (const clase of clasesDisciplina) {
            try {
              // Modificación para clases de versus
              let claseParaCalculo = { ...clase }

              // Si es una clase de versus, ajustar las reservas y lugares para el cálculo
              if (clase.esVersus && clase.vsNum && clase.vsNum > 1) {
                // Multiplicar las reservas y lugares por el número de instructores para el cálculo
                const reservasAjustadas = clase.reservasTotales * clase.vsNum
                const lugaresAjustados = clase.lugares * clase.vsNum

                // Crear una copia de la clase con las reservas y lugares ajustados
                claseParaCalculo = {
                  ...clase,
                  reservasTotales: reservasAjustadas,
                  lugares: lugaresAjustados,
                }

                addProcessLog(
                  `⚖️ CLASE VS: Ajustando para cálculo: Reservas ${clase.reservasTotales} x ${clase.vsNum} = ${reservasAjustadas}, Lugares ${clase.lugares} x ${clase.vsNum} = ${lugaresAjustados}`,
                  instructor.id,
                )
              }

              // Calcular el pago con la clase ajustada si es versus
              const resultado = calcularPago(claseParaCalculo, categoriaInstructor, formula)

              // Si es versus, dividir el monto calculado entre el número de instructores
              let montoPagoFinal = resultado.montoPago
              if (clase.esVersus && clase.vsNum && clase.vsNum > 1) {
                montoPagoFinal = resultado.montoPago / clase.vsNum
                addProcessLog(
                  `⚖️ CLASE VS: Dividiendo pago entre ${clase.vsNum} instructores: ${resultado.montoPago.toFixed(2)} / ${clase.vsNum} = ${montoPagoFinal.toFixed(2)}`,
                  instructor.id,
                )
              }

              // Sumar al monto total
              montoTotal += montoPagoFinal

              // Modificar la función calcularPagosPeriodo para mejorar los logs
              // Dentro de la función calcularPagosPeriodo, modificar la parte donde se calculan los pagos por clase:

              // Add detailed log about payment for this class
              addProcessLog(
                `💰 PAGO POR CLASE [${clase.id}]: ${disciplina.nombre} - ${new Date(clase.fecha).toLocaleDateString()} ${obtenerHora(clase.fecha)}` +
                  `\n   Monto: ${montoPagoFinal.toFixed(2)} | Categoría: ${categoriaInstructor}` +
                  `\n   Reservas: ${clase.reservasTotales}/${clase.lugares} (${Math.round((clase.reservasTotales / clase.lugares) * 100)}% ocupación)` +
                  (clase.esVersus ? `\n   Versus: Sí (${clase.vsNum} instructores)` : "") +
                  `\n   Detalle: ${resultado.detalleCalculo}`,
                instructor.id,
              )

              // Check if this is a non-prime hour class
              const hora = obtenerHora(clase.fecha)
              const estudio = clase.estudio || ""
              let esNoPrime = false

              // Check if this is a non-prime hour
              for (const [estudioConfig, horarios] of Object.entries(HORARIOS_NO_PRIME)) {
                if (estudio.toLowerCase().includes(estudioConfig.toLowerCase()) && horarios[hora]) {
                  esNoPrime = true
                  break
                }
              }

              if (esNoPrime) {
                addProcessLog(
                  `⏱️ HORARIO NO PRIME: ${disciplina.nombre} - ${new Date(clase.fecha).toLocaleDateString()} ${hora}` +
                    `\n   Estudio: ${estudio} | Hora: ${hora}`,
                  instructor.id,
                )
              }

              detallesClases.push({
                claseId: clase.id,
                montoCalculado: montoPagoFinal,
                disciplinaId: clase.disciplinaId,
                disciplinaNombre: disciplina.nombre,
                fechaClase: clase.fecha,
                detalleCalculo: resultado.detalleCalculo,
                categoria: categoriaInstructor,
                esVersus: clase.esVersus,
                vsNum: clase.vsNum,
              })
            } catch (error) {
              addProcessLog(`Error al calcular pago para clase ${clase.id}`, instructor.id)
            }
          }
        }

        // Add a summary of metrics for the instructor
        const totalClases = clasesInstructor.length
        const clasesPorSemana = totalClases / 4 // Calcular clases por semana
        const totalReservas = clasesInstructor.reduce((sum, c) => sum + c.reservasTotales, 0)
        const totalCapacidad = clasesInstructor.reduce((sum, c) => sum + c.lugares, 0)
        const ocupacionPromedio = totalCapacidad > 0 ? (totalReservas / totalCapacidad) * 100 : 0
        const disciplinasUnicasCount = new Set(clasesInstructor.map((c) => c.disciplinaId)).size
        const estudiosUnicos = new Set(clasesInstructor.map((c) => c.estudio)).size
        const clasesNoPrime = clasesInstructor.filter((clase) => {
          const hora = obtenerHora(clase.fecha)
          const estudio = clase.estudio || ""
          for (const [estudioConfig, horarios] of Object.entries(HORARIOS_NO_PRIME)) {
            if (estudio.toLowerCase().includes(estudioConfig.toLowerCase()) && horarios[hora]) {
              return true
            }
          }
          return false
        }).length

        // Buscar la sección de cálculo de bono y comentarla
        // En la función calcularPagosPeriodo, buscar la sección que comienza con:
        // Calculate bonus if enabled
        const bonoTotal = 0
        if (calcularBonoEnPeriodo) {
          // Comentar todo el bloque de cálculo de bono
          /*
          // Simplified bonus calculation
          const tieneCategoriasEspeciales = instructorActualizado.categorias?.some(
            (cat) => cat.periodoId === periodoId && cat.categoria !== "INSTRUCTOR",
          )

          if (tieneCategoriasEspeciales) {
            addProcessLog(`Calculando bonos`, instructor.id)

            // Calculate bonus for each discipline with special category
            for (const disciplinaId of disciplinasUnicas) {
              const categoriaInfo = instructorActualizado.categorias?.find(
                (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId && c.categoria !== "INSTRUCTOR",
              )

              if (categoriaInfo) {
                const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodoId)
                const bonoPorAlumno = formula?.parametrosPago?.[categoriaInfo.categoria]?.bono || 0

                if (bonoPorAlumno > 0) {
                  const clasesDisciplina = clasesInstructor.filter((c) => c.disciplinaId === disciplinaId)
                  const bonoDisciplina = clasesDisciplina.reduce(
                    (sum, clase) => sum + bonoPorAlumno * clase.reservasTotales,
                    0,
                  )

                  bonoTotal += bonoDisciplina
                  addProcessLog(`Bono para disciplina ${disciplinaId}: ${bonoDisciplina.toFixed(2)}`, instructor.id)
                }
              }
            }

            // Add accumulated bonuses from previous periods
            // Get all periods where bonos were calculated but not paid
            const periodosConBonoCalculado = periodos
              .filter(
                (p) =>
                  // Period is before current period
                  p.id < periodoId &&
                  // Bonus was calculated but not paid
                  p.bonoCalculado === true,
              )
              .sort((a, b) => a.id - b.id) // Sort by ID ascending

            if (periodosConBonoCalculado.length > 0) {
              addProcessLog(`Verificando bonos acumulados de periodos anteriores`, instructor.id)

              // For each period with calculated bonus, find the instructor's payment and add the bonus
              let bonosAcumulados = 0
              for (const periodoAnterior of periodosConBonoCalculado) {
                const pagoAnterior = pagos.find(
                  (p) => p.instructorId === instructor.id && p.periodoId === periodoAnterior.id,
                )

                if (pagoAnterior && pagoAnterior.bono) {
                  bonosAcumulados += pagoAnterior.bono
                  addProcessLog(
                    `Bono acumulado del periodo ${periodoAnterior.numero}-${periodoAnterior.año}: ${pagoAnterior.bono.toFixed(2)}`,
                    instructor.id,
                  )
                }
              }

              if (bonosAcumulados > 0) {
                addProcessLog(`Total bonos acumulados: ${bonosAcumulados.toFixed(2)}`, instructor.id)
                bonoTotal += bonosAcumulados
              }
            }
          }
          */

          // Agregar un comentario explicativo
          // Se utilizará otra función para gestionar el cálculo de bonos
          addProcessLog(`ℹ️ El cálculo de bonos se gestionará con otra función`, instructor.id)
        }

        // Calculate retention and final payment
        const montoConBono = montoTotal + bonoTotal
        const retencionCalculada =
          pagoExistente?.reajuste != null
            ? (montoConBono + pagoExistente.reajuste) * retencionValor
            : montoConBono * retencionValor

        const pagoFinal = montoConBono - retencionCalculada

        // Modificar la parte donde se muestra el resumen de métricas
        addProcessLog(
          `RESUMEN DE MÉTRICAS:` +
            `\n   Total Clases: ${totalClases} (${clasesPorSemana.toFixed(1)} por semana) | Disciplinas: ${disciplinasUnicasCount} | Estudios: ${estudiosUnicos}` +
            `\n   Ocupación Promedio: ${ocupacionPromedio.toFixed(1)}% (${totalReservas}/${totalCapacidad})` +
            `\n   Clases en Horario No Prime: ${clasesNoPrime} (${((clasesNoPrime / totalClases) * 100).toFixed(1)}%)` +
            `\n   Monto Total: ${montoTotal.toFixed(2)} | Bono: ${bonoTotal.toFixed(2)} | Final: ${pagoFinal.toFixed(2)}`,
          instructor.id,
        )

        // Preparar el objeto de pago con todos los datos necesarios
        try {
          if (pagoExistente) {
            // Si el pago está aprobado, no actualizar
            if (pagoExistente.estado === "APROBADO") {
              addProcessLog(`✅ Pago aprobado, no se modificará`, instructor.id)
              continue
            }

            // Crear un objeto de actualización completo, incluyendo todos los campos requeridos
            const actualizacion = {
              id: pagoExistente.id,
              instructorId: instructor.id,
              periodoId: periodoId,
              monto: montoTotal,
              bono: bonoTotal,
              estado: pagoExistente.estado, // Mantener el estado existente
              retencion: retencionCalculada,
              reajuste: pagoExistente.reajuste, // Mantener el reajuste existente
              tipoReajuste: pagoExistente.tipoReajuste, // Mantener el tipo de reajuste existente
              pagoFinal: pagoFinal,
              // Mantener valores manuales existentes
              dobleteos: dobleteos,
              horariosNoPrime: horariosNoPrime / 4,
              participacionEventos: pagoExistente.participacionEventos || false,
              cumpleLineamientos: pagoExistente.cumpleLineamientos || false,
              detalles: {
                clases: detallesClases,
                resumen: {
                  totalClases: detallesClases.length,
                  totalMonto: montoTotal,
                  bono: bonoTotal,
                  disciplinas: disciplinasUnicas.length,
                  categorias: disciplinasUnicas.map((disciplinaId) => {
                    // Usar las categorías actualizadas del instructor
                    const categoriaInfo = instructorActualizado.categorias?.find(
                      (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId,
                    )
                    const categoria = categoriaInfo?.categoria || "INSTRUCTOR"
                    const disc = disciplinas.find((d) => d.id === disciplinaId)
                    return {
                      disciplinaId,
                      disciplinaNombre: disc?.nombre || `Disciplina ${disciplinaId}`,
                      categoria: categoria,
                    }
                  }),
                  comentarios: `Calculado el ${new Date().toLocaleDateString()}`,
                },
              },
            }

            // Agregar a la lista de pagos para actualizar
            pagosParaActualizar.push({ id: pagoExistente.id, data: actualizacion })
            pagosActualizados++
            addProcessLog(`✅ Pago preparado para actualización`, instructor.id)
          } else {
            // Preparar nuevo pago
            const pagoData = {
              instructorId: instructor.id,
              periodoId: periodoId,
              monto: montoTotal,
              bono: bonoTotal,
              estado: "PENDIENTE" as EstadoPago,
              retencion: retencionCalculada,
              reajuste: 0,
              tipoReajuste: "FIJO" as const,
              pagoFinal: pagoFinal,
              dobleteos: dobleteos,
              horariosNoPrime: horariosNoPrime / 4,
              // CORRECCIÓN: Establecer participacionEventos y cumpleLineamientos como true por defecto
              participacionEventos: true,
              cumpleLineamientos: true,
              detalles: {
                clases: detallesClases,
                resumen: {
                  totalClases: detallesClases.length,
                  totalMonto: montoTotal,
                  bono: bonoTotal,
                  disciplinas: disciplinasUnicas.length,
                  categorias: disciplinasUnicas.map((disciplinaId) => {
                    // Usar las categorías actualizadas del instructor
                    const categoriaInfo = instructorActualizado.categorias?.find(
                      (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId,
                    )
                    const categoria = categoriaInfo?.categoria || "INSTRUCTOR"
                    const disc = disciplinas.find((d) => d.id === disciplinaId)
                    return {
                      disciplinaId,
                      disciplinaNombre: disc?.nombre || `Disciplina ${disciplinaId}`,
                      categoria: categoria,
                    }
                  }),
                  comentarios: `Calculado el ${new Date().toLocaleDateString()}`,
                },
              },
            }

            // Agregar a la lista de pagos para crear
            pagosParaActualizar.push({ id: null, data: pagoData })
            pagosCreados++
            addProcessLog(`✅ Pago preparado para creación`, instructor.id)
          }
        } catch (error) {
          addProcessLog(
            `❌ Error al procesar pago: ${error instanceof Error ? error.message : "Error desconocido"}`,
            instructor.id,
          )
        }
      }

      // Ahora, después de procesar todos los instructores, realizamos todas las actualizaciones de pagos
      addProcessLog(`\n🔄 Actualizando base de datos con ${pagosParaActualizar.length} pagos...`)

      // Procesar todos los pagos en lote
      for (const pago of pagosParaActualizar) {
        try {
          if (pago.id) {
            // Actualizar pago existente
            // Asegurarse de que solo pasamos los campos que queremos actualizar
            const { id, ...datosActualizacion } = pago.data
            await actualizarPago(pago.id, datosActualizacion)
          } else {
            // Crear nuevo pago
            // Asegurarse de que el objeto tiene todos los campos requeridos
            await crearPago(pago.data as any)
          }
        } catch (error) {
          addProcessLog(`❌ Error al guardar pago: ${error instanceof Error ? error.message : "Error desconocido"}`)
        }
      }

      // Actualizar la UI con todos los pagos de una sola vez
      await fetchPagos()
      addProcessLog(`✅ Base de datos actualizada correctamente`)

      // Update period if bonuses were calculated
      if (calcularBonoEnPeriodo) {
        const periodoSeleccionado = periodos.find((p) => p.id === periodoId)
        if (periodoSeleccionado) {
          await actualizarPeriodo(periodoId, {
            ...periodoSeleccionado,
            bonoCalculado: true,
          })
          addProcessLog(`✅ Periodo marcado con bonos calculados`)
        }
      }

      // Final summary
      addProcessLog("\n🏁 Proceso completado. Resumen:")
      addProcessLog(`✅ Categorías actualizadas: ${categoriasActualizadas}`)
      addProcessLog(`✅ Pagos creados: ${pagosCreados}`)
      addProcessLog(`🔄 Pagos actualizados: ${pagosActualizados}`)
      addProcessLog(`👥 Total instructores procesados: ${todosInstructores.length}`)
      addProcessLog(
        `💵 Total monto procesado: ${pagos
          .filter((p) => p.periodoId === periodoId)
          .reduce((sum, p) => sum + p.monto, 0)
          .toFixed(2)}`,
      )
      if (calcularBonoEnPeriodo) {
        addProcessLog(
          `🎁 Total bonos asignados: ${pagos
            .filter((p) => p.periodoId === periodoId)
            .reduce((sum, p) => sum + (p.bono || 0), 0)
            .toFixed(2)}`,
        )

        // Add information about accumulated bonuses
        const periodosConBonoCalculado = periodos
          .filter((p) => p.id < periodoId && p.bonoCalculado === true)
          .sort((a, b) => a.id - b.id)

        if (periodosConBonoCalculado.length > 0) {
          addProcessLog(
            `📊 Periodos con bonos acumulados: ${periodosConBonoCalculado.map((p) => `${p.numero}-${p.año}`).join(", ")}`,
          )

          // Calculate total accumulated bonuses
          let totalBonosAcumulados = 0
          for (const instructor of todosInstructores) {
            for (const periodoAnterior of periodosConBonoCalculado) {
              const pagoAnterior = pagos.find(
                (p) => p.instructorId === instructor.id && p.periodoId === periodoAnterior.id,
              )

              if (pagoAnterior && pagoAnterior.bono) {
                totalBonosAcumulados += pagoAnterior.bono
              }
            }
          }

          addProcessLog(`🎁 Total bonos acumulados incluidos: ${totalBonosAcumulados.toFixed(2)}`)
        }
      }
      addProcessLog(
        `📊 Promedio de clases por instructor: ${(clases.filter((c) => c.periodoId === periodoId).length / todosInstructores.length).toFixed(1)}`,
      )

      toast({
        title: "Cálculo completado",
        description: `Se han actualizado ${categoriasActualizadas} categorías, creado ${pagosCreados} pagos y actualizado ${pagosActualizados}.`,
      })
    } catch (error) {
      addProcessLog(`❌ Error en el proceso: ${error instanceof Error ? error.message : "Error desconocido"}`)
      toast({
        title: "Error al calcular pagos",
        description: error instanceof Error ? error.message : "Error desconocido al calcular pagos",
        variant: "destructive",
      })
    } finally {
      addProcessLog("🏁 Finalizando proceso")
      setIsCalculatingPayments(false)
    }
  }

  // Función para manejar la duplicación de fórmulas
  const handleDuplicateFormulas = async () => {
    if (!periodoOrigenFormulas || !selectedPeriodoId) {
      toast({
        title: "Error",
        description: "No se puede duplicar las fórmulas sin un periodo origen o destino",
        variant: "destructive",
      })
      return
    }

    await duplicarFormulas(periodoOrigenFormulas.id, selectedPeriodoId)
  }

  // Modify the reevaluarTodasCategorias function to filter disciplines:
  // In the reevaluarTodasCategorias function, find the part where we process each discipline and modify it:

  // Asegúrate de que esta función esté exportada correctamente
  // Function to re-evaluate all instructor categories
  const reevaluarTodasCategorias = async () => {
    console.log("\n[REEVALUACION] 🔄 Iniciando proceso de reevaluación de categorías...")

    // Clear previous logs
    setProcessLogs([])
    setShowProcessLogsDialog(true)

    addProcessLog("🔄 Re-evaluando categorías de instructores...")

    const periodoId = selectedPeriodoId || periodoActual?.id

    if (!periodoId) {
      console.log("[REEVALUACION] ❌ ERROR: No hay periodo seleccionado")
      addProcessLog("❌ Error: No hay periodo seleccionado")
      toast({
        title: "Error",
        description: "Debes seleccionar un periodo para re-evaluar las categorías",
        variant: "destructive",
      })
      return
    }
    console.log(`[REEVALUACION] Periodo seleccionado: ${periodoId}`)

    // Verificar si existen fórmulas para el periodo seleccionado
    if (!verificarFormulasExistentes(periodoId)) {
      console.log("[REEVALUACION] ⚠️ No existen fórmulas para este periodo")
      // Buscar el periodo más cercano con fórmulas
      const periodoOrigen = encontrarPeriodoConFormulas(periodoId)
      setPeriodoOrigenFormulas(periodoOrigen)
      console.log(`[REEVALUACION] Periodo origen con fórmulas encontrado: ${periodoOrigen?.id || "ninguno"}`)

      // Mostrar diálogo para duplicar fórmulas
      setShowFormulaDuplicationDialog(true)
      setShowCalculateDialog(false)
      return
    }
    console.log("[REEVALUACION] ✅ Fórmulas encontradas para este periodo")

    setIsCalculatingPayments(true)
    setShowCalculateDialog(false)

    try {
      addProcessLog(`📅 Re-evaluando categorías para periodo ID: ${periodoId}`)
      console.log(`[REEVALUACION] 📅 Re-evaluando categorías para periodo ID: ${periodoId}`)

      // Get all instructors with classes in this period
      const instructoresConClases = [
        ...new Set(clases.filter((c) => c.periodoId === periodoId).map((c) => c.instructorId)),
      ]
      console.log(`[REEVALUACION] Instructores con clases en este periodo: ${instructoresConClases.length}`)

      const todosInstructores = instructores.filter((i) => instructoresConClases.includes(i.id))
      console.log(`[REEVALUACION] Total instructores a procesar: ${todosInstructores.length}`)

      addProcessLog(`👥 Total instructores con clases: ${todosInstructores.length}`)

      let categoriasActualizadas = 0

      // Helper function to calculate metrics
      const calcularMetricas = (clasesInstructor: any[], disciplinaId: number) => {
        const clasesDisciplina = clasesInstructor.filter((c) => c.disciplinaId === disciplinaId)
        const totalClases = clasesDisciplina.length
        const clasesPorSemana = totalClases / 4 // Calcular clases por semana

        let totalReservas = 0
        let totalLugares = 0
        clasesDisciplina.forEach((clase) => {
          totalReservas += clase.reservasTotales
          totalLugares += clase.lugares
        })
        const ocupacion = totalLugares > 0 ? (totalReservas / totalLugares) * 100 : 0

        const localesEnLima = new Set(
          clasesDisciplina.filter((c) => c.ciudad.toLowerCase().includes("lima")).map((c) => c.estudio),
        ).size

        return { ocupacion, clases: totalClases, clasesPorSemana, localesEnLima }
      }

      // Process each instructor
      for (const instructor of todosInstructores) {
        console.log(`\n[REEVALUACION] 👤 Procesando instructor: ${instructor.nombre} (ID: ${instructor.id})`)
        addProcessLog(`Procesando instructor ${instructor.nombre}`, instructor.id)

        // Get classes for this instructor in this period
        const clasesInstructor = clases.filter(
          (clase) => clase.instructorId === instructor.id && clase.periodoId === periodoId,
        )
        console.log(`[REEVALUACION] Clases encontradas: ${clasesInstructor.length}`)

        if (clasesInstructor.length === 0) {
          console.log(`[REEVALUACION] ⚠️ Sin clases, omitiendo instructor`)
          addProcessLog(`Sin clases, omitiendo`, instructor.id)
          continue
        }

        // Get the payment for this instructor in this period
        const pagoInstructor = pagos.find((p) => p.instructorId === instructor.id && p.periodoId === periodoId)
        console.log(`[REEVALUACION] Pago encontrado: ${pagoInstructor ? "Sí" : "No"}`)

        if (!pagoInstructor) {
          console.log(`[REEVALUACION] ⚠️ Sin pago registrado, omitiendo instructor`)
          addProcessLog(`Sin pago registrado, omitiendo`, instructor.id)
          continue
        }
        console.log(`[REEVALUACION] Detalles del pago: ID ${pagoInstructor.id}, Monto: ${pagoInstructor.monto}`)
        console.log(
          `[REEVALUACION] Factores del pago: Dobleteos: ${pagoInstructor.dobleteos}, Horarios No Prime: ${pagoInstructor.horariosNoPrime}`,
        )
        console.log(
          `[REEVALUACION] Participación Eventos: ${pagoInstructor.participacionEventos ? "Sí" : "No"}, Cumple Lineamientos: ${pagoInstructor.cumpleLineamientos ? "Sí" : "No"}`,
        )

        // Get unique disciplines taught by the instructor
        const disciplinasInstructor = [...new Set(clasesInstructor.map((c) => c.disciplinaId))]
        console.log(`[REEVALUACION] Disciplinas únicas: ${disciplinasInstructor.length}`)

        // IMPORTANTE: Preservar los valores manuales del pago existente
        // Estos valores no deben ser recalculados, sino mantenidos tal como están
        const valoresManuales = {
          dobleteos: pagoInstructor.dobleteos || 0,
          participacionEventos: pagoInstructor.participacionEventos || false,
          cumpleLineamientos: pagoInstructor.cumpleLineamientos || false,
        }
        console.log(`[REEVALUACION] Valores manuales preservados:`, valoresManuales)

        // Process each discipline the instructor has taught
        for (const disciplinaId of disciplinasInstructor) {
          console.log(`\n[REEVALUACION] 📊 Procesando disciplina ID: ${disciplinaId}`)

          // Get the discipline name
          const disciplina = disciplinas.find((d) => d.id === disciplinaId)
          const nombreDisciplina = disciplina?.nombre || `Disciplina ${disciplinaId}`
          console.log(`[REEVALUACION] Nombre de disciplina: ${nombreDisciplina}`)

          // Skip disciplines that don't have visual categories
          if (disciplina && !mostrarCategoriaVisual(disciplina.nombre)) {
            console.log(`[REEVALUACION] ⚠️ Disciplina sin categoría visual, omitiendo`)
            continue
          }

          // Calculate real metrics for this discipline
          console.log(`[REEVALUACION] Calculando métricas reales...`)
          const metricasBase = calcularMetricas(clasesInstructor, disciplinaId)
          console.log(
            `[REEVALUACION] Métricas calculadas: Ocupación: ${metricasBase.ocupacion.toFixed(2)}%, Clases: ${metricasBase.clases} (${metricasBase.clasesPorSemana.toFixed(2)} por semana), Locales: ${metricasBase.localesEnLima}`,
          )

          // Get formula for this discipline
          const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodoId)
          console.log(`[REEVALUACION] Fórmula encontrada: ${formula ? "Sí" : "No"}`)

          if (!formula) {
            console.log(`[REEVALUACION] ❌ No se encontró fórmula para ${nombreDisciplina}, omitiendo`)
            addProcessLog(`No se encontró fórmula para ${nombreDisciplina}, omitiendo`, instructor.id)
            continue
          }
          console.log(`[REEVALUACION] Fórmula ID: ${formula.id}`)

          // Determine appropriate category based on metrics
          // IMPORTANTE: Usar los valores manuales preservados en lugar de recalcularlos
          console.log(`[REEVALUACION] Determinando categoría apropiada usando valores manuales preservados...`)
          const instructorParams = {
            dobleteos: valoresManuales.dobleteos,
            horariosNoPrime: pagoInstructor.horariosNoPrime || 0, // Este valor se calcula automáticamente
            participacionEventos: valoresManuales.participacionEventos,
            cumpleLineamientos: valoresManuales.cumpleLineamientos,
          }
          console.log(`[REEVALUACION] Parámetros del instructor para evaluación:`, instructorParams)

          // Combine base metrics with instructor parameters
          const metricas = {
            ...metricasBase,
            dobleteos: instructorParams.dobleteos,
            horariosNoPrime: instructorParams.horariosNoPrime,
            participacionEventos: instructorParams.participacionEventos,
          }

          const categoriaCalculada = determinarCategoria(instructor.id, disciplinaId, periodoId, formula)
          console.log(`[REEVALUACION] Categoría calculada: ${categoriaCalculada}`)

          // Get existing category
          const existingCategoria = instructor.categorias?.find(
            (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId,
          )
          console.log(`[REEVALUACION] Categoría existente: ${existingCategoria?.categoria || "No encontrada"}`)

          // If the category has changed, update it
          if (existingCategoria?.categoria !== categoriaCalculada) {
            console.log(
              `[REEVALUACION] ⚠️ Cambio de categoría detectado: ${existingCategoria?.categoria || "No asignada"} -> ${categoriaCalculada}`,
            )
            try {
              console.log(`[REEVALUACION] 🔄 Actualizando categoría para ${instructor.nombre} en ${nombreDisciplina}`)
              addProcessLog(
                `🔄 Actualizando categoría para ${instructor.nombre} en ${nombreDisciplina} de ${existingCategoria?.categoria} a ${categoriaCalculada}`,
                instructor.id,
              )

              // Prepare the updated category object
              const nuevaCategoria: CategoriaInstructorModel = {
                id: existingCategoria?.id || Date.now(), // Use existing ID or create a temporary one
                instructorId: instructor.id,
                disciplinaId,
                periodoId,
                categoria: categoriaCalculada,
                metricas: {
                  ocupacion: metricasBase.ocupacion,
                  clases: metricasBase.clases,
                  localesEnLima: metricasBase.localesEnLima,
                  dobleteos: valoresManuales.dobleteos,
                  horariosNoPrime: instructorParams.horariosNoPrime,
                  participacionEventos: valoresManuales.participacionEventos,
                },
              }
              console.log(`[REEVALUACION] Nueva categoría preparada:`, nuevaCategoria)

              // Get existing categories or initialize empty array
              const categorias = instructor.categorias || []
              console.log(`[REEVALUACION] Categorías existentes: ${categorias.length}`)

              // Find the index of the category to update
              const categoriaIndex = categorias.findIndex(
                (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId,
              )
              console.log(`[REEVALUACION] Índice de categoría existente: ${categoriaIndex}`)

              const updatedCategorias = [...categorias]

              if (categoriaIndex >= 0) {
                // Replace existing category
                console.log(`[REEVALUACION] Reemplazando categoría existente en índice ${categoriaIndex}`)
                updatedCategorias[categoriaIndex] = { ...updatedCategorias[categoriaIndex], ...nuevaCategoria }
              } else {
                // Add new category
                console.log(`[REEVALUACION] Agregando nueva categoría`)
                updatedCategorias.push(nuevaCategoria)
              }
              console.log(`[REEVALUACION] Total categorías después de actualización: ${updatedCategorias.length}`)

              // Update instructor with the updated category
              console.log(`[REEVALUACION] Actualizando instructor con nuevas categorías...`)
              await actualizarInstructor(instructor.id, {
                categorias: updatedCategorias,
              })
              console.log(`[REEVALUACION] ✅ Instructor actualizado exitosamente`)

              categoriasActualizadas++
              addProcessLog(
                `✅ Categoría actualizada para ${instructor.nombre} en ${nombreDisciplina} a ${categoriaCalculada}`,
                instructor.id,
              )
            } catch (error) {
              console.error(`[REEVALUACION] ❌ ERROR al actualizar categoría:`, error)
              addProcessLog(
                `❌ Error al actualizar categoría para ${instructor.nombre} en ${nombreDisciplina} en ${nombreDisciplina}: ${
                  error instanceof Error ? error.message : "Error desconocido"
                }`,
                instructor.id,
              )
            }
          } else {
            console.log(
              `[REEVALUACION] ✓ Categoría sin cambios para ${instructor.nombre} en ${nombreDisciplina} (${categoriaCalculada})`,
            )
            addProcessLog(
              `✓ Categoría sin cambios para ${instructor.nombre} en ${nombreDisciplina} (${categoriaCalculada})`,
              instructor.id,
            )
          }
        }
      }

      // Final summary
      console.log("\n[REEVALUACION] 🏁 Proceso completado. Resumen:")
      console.log(`[REEVALUACION] ✅ Categorías actualizadas: ${categoriasActualizadas}`)
      console.log(`[REEVALUACION] 👥 Total instructores procesados: ${todosInstructores.length}`)

      addProcessLog("\n🏁 Proceso completado. Resumen:")
      addProcessLog(`✅ Categorías actualizadas: ${categoriasActualizadas}`)
      addProcessLog(`👥 Total instructores procesados: ${todosInstructores.length}`)

      await fetchInstructores()
      toast({
        title: "Re-evaluación completada",
        description: `Se han actualizado ${categoriasActualizadas} categorías de instructores.`,
      })
    } catch (error) {
      console.error(`[REEVALUACION] ❌ ERROR en el proceso:`, error)
      addProcessLog(`❌ Error en el proceso: ${error instanceof Error ? error.message : "Error desconocido"}`)
      toast({
        title: "Error al re-evaluar categorías",
        description: error instanceof Error ? error.message : "Error desconocido al re-evaluar categorías",
        variant: "destructive",
      })
    } finally {
      console.log("[REEVALUACION] 🏁 Finalizando proceso")
      addProcessLog("🏁 Finalizando proceso")
      setIsCalculatingPayments(false)
    }
  }

  // Añadir estas nuevas funciones y estados al hook useCalculation
  // No modificaré las funciones existentes ni los imports
  // Nuevos estados para el cálculo de bonos
  const [periodosSeleccionadosParaBono, setPeriodosSeleccionadosParaBono] = useState<number[]>([])
  const [isCalculatingBonuses, setIsCalculatingBonuses] = useState<boolean>(false)

  // Función para verificar si un periodo ya tiene bonos calculados
  const verificarBonoCalculado = (periodoId: number): boolean => {
    const periodo = periodos.find((p) => p.id === periodoId)
    return periodo?.bonoCalculado || false
  }

  // Función para obtener periodos disponibles para cálculo de bonos
  const obtenerPeriodosDisponiblesParaBono = (): Periodo[] => {
    return periodos.filter((p) => !p.bonoCalculado)
  }

  // Función para añadir o quitar un periodo de la selección para bonos
  const togglePeriodoParaBono = (periodoId: number) => {
    setPeriodosSeleccionadosParaBono((prev) => {
      if (prev.includes(periodoId)) {
        return prev.filter((id) => id !== periodoId)
      } else {
        return [...prev, periodoId]
      }
    })
  }

  // Función para calcular bonos para los periodos seleccionados
  const calcularBonosPeriodo = async () => {
    // Verificar que haya al menos un periodo seleccionado
    if (periodosSeleccionadosParaBono.length === 0 && selectedPeriodoId) {
      // Si no hay periodos seleccionados pero hay un periodo principal, usarlo
      setPeriodosSeleccionadosParaBono([selectedPeriodoId])
    }

    // Verificar nuevamente que haya periodos seleccionados
    if (periodosSeleccionadosParaBono.length === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos un periodo para calcular bonos",
        variant: "destructive",
      })
      return
    }

    // Limpiar logs anteriores
    setProcessLogs([])
    setShowProcessLogsDialog(true)

    addProcessLog("🚀 Iniciando proceso de cálculo de bonos...")
    addProcessLog(`📊 Periodos seleccionados: ${periodosSeleccionadosParaBono.join(", ")}`)

    setIsCalculatingBonuses(true)

    try {
      // Obtener todos los instructores con clases en los periodos seleccionados
      const instructoresConClases = [
        ...new Set(
          clases.filter((c) => periodosSeleccionadosParaBono.includes(c.periodoId)).map((c) => c.instructorId),
        ),
      ]

      const todosInstructores = instructores.filter((i) => instructoresConClases.includes(i.id))

      addProcessLog(`👥 Total instructores a procesar: ${todosInstructores.length}`)

      let bonosActualizados = 0
      const pagosParaActualizar: any[] = []

      // Procesar cada instructor
      for (const instructor of todosInstructores) {
        addProcessLog(`Procesando bonos para ${instructor.nombre}`, instructor.id)

        // Procesar cada periodo seleccionado
        for (const periodoId of periodosSeleccionadosParaBono) {
          const periodo = periodos.find((p) => p.id === periodoId)
          if (!periodo) continue

          addProcessLog(`Calculando bonos para periodo ${periodo.numero}-${periodo.año}`, instructor.id)

          // Obtener el pago del instructor para este periodo
          const pagoExistente = pagos.find((p) => p.instructorId === instructor.id && p.periodoId === periodoId)

          if (!pagoExistente) {
            addProcessLog(`⚠️ No existe pago para este periodo, omitiendo`, instructor.id)
            continue
          }

          // Si el pago está cancelado, omitirlo
          if (pagoExistente.estado === "CANCELADO") {
            addProcessLog(`⚠️ Pago cancelado, omitiendo`, instructor.id)
            continue
          }

          // Obtener las clases del instructor en este periodo
          const clasesInstructor = clases.filter((c) => c.instructorId === instructor.id && c.periodoId === periodoId)

          if (clasesInstructor.length === 0) {
            addProcessLog(`⚠️ Sin clases en este periodo, omitiendo`, instructor.id)
            continue
          }

          // Obtener las disciplinas únicas del instructor en este periodo
          const disciplinasUnicas = [...new Set(clasesInstructor.map((c) => c.disciplinaId))]

          // Obtener el instructor actualizado para tener sus categorías actualizadas
          const instructorActualizado = await instructoresApi.getInstructor(instructor.id)

          // Calcular bono para cada disciplina con categoría especial
          let bonoTotal = 0
          const detallesBono: string[] = []

          // Verificar si tiene categorías especiales
          const tieneCategoriasEspeciales = instructorActualizado.categorias?.some(
            (cat) => cat.periodoId === periodoId && cat.categoria !== "INSTRUCTOR",
          )

          if (tieneCategoriasEspeciales) {
            addProcessLog(`Calculando bonos por categorías especiales`, instructor.id)

            // Calcular bono para cada disciplina con categoría especial
            for (const disciplinaId of disciplinasUnicas) {
              const categoriaInfo = instructorActualizado.categorias?.find(
                (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId && c.categoria !== "INSTRUCTOR",
              )

              if (categoriaInfo) {
                const disciplina = disciplinas.find((d) => d.id === disciplinaId)
                const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodoId)

                if (formula) {
                  const bonoPorAlumno = formula.parametrosPago?.[categoriaInfo.categoria]?.bono || 0

                  if (bonoPorAlumno > 0) {
                    const clasesDisciplina = clasesInstructor.filter((c) => c.disciplinaId === disciplinaId)
                    let totalReservas = 0

                    // Sumar todas las reservas de las clases de esta disciplina
                    clasesDisciplina.forEach((clase) => {
                      // Si es versus, ajustar las reservas
                      if (clase.esVersus && clase.vsNum && clase.vsNum > 1) {
                        totalReservas += clase.reservasTotales / clase.vsNum
                      } else {
                        totalReservas += clase.reservasTotales
                      }
                    })

                    const bonoDisciplina = bonoPorAlumno * totalReservas
                    bonoTotal += bonoDisciplina

                    const disciplinaNombre = disciplina?.nombre || `Disciplina ${disciplinaId}`
                    detallesBono.push(
                      `${disciplinaNombre}: ${bonoDisciplina.toFixed(2)} (${totalReservas} reservas x ${bonoPorAlumno} por alumno)`,
                    )

                    addProcessLog(
                      `Bono para ${disciplinaNombre}: ${bonoDisciplina.toFixed(2)} (${totalReservas} reservas x ${bonoPorAlumno} por alumno)`,
                      instructor.id,
                    )
                  }
                }
              }
            }
          } else {
            addProcessLog(`⚠️ No tiene categorías especiales, no aplica bono`, instructor.id)
          }

          // Si hay bono calculado, actualizar el pago
          if (bonoTotal > 0) {
            // Preparar el comentario para el bono
            const comentarioBono = `Bono calculado para periodo ${periodo.numero}-${periodo.año}: ${bonoTotal.toFixed(2)}. Detalles: ${detallesBono.join("; ")}`

            // Preparar el objeto de actualización
            const nuevoReajuste = (pagoExistente.reajuste || 0) + bonoTotal
            const nuevosComentarios = pagoExistente.comentarios
              ? `${pagoExistente.comentarios}\n${comentarioBono}`
              : comentarioBono

            const actualizacion = {
              id: pagoExistente.id,
              reajuste: nuevoReajuste,
              comentarios: nuevosComentarios,
              bono: bonoTotal, // Guardar el valor del bono calculado
            }

            // Agregar a la lista de pagos para actualizar
            pagosParaActualizar.push({ id: pagoExistente.id, data: actualizacion })
            bonosActualizados++

            addProcessLog(`✅ Bono calculado: ${bonoTotal.toFixed(2)}`, instructor.id)
            addProcessLog(`✅ Nuevo reajuste total: ${nuevoReajuste.toFixed(2)}`, instructor.id)
          } else {
            addProcessLog(`ℹ️ No se calculó bono para este periodo`, instructor.id)
          }
        }
      }

      // Actualizar todos los pagos en la base de datos
      addProcessLog(`\n🔄 Actualizando base de datos con ${pagosParaActualizar.length} pagos...`)

      // Procesar todos los pagos en lote
      for (const pago of pagosParaActualizar) {
        try {
          // Actualizar pago existente
          const { id, ...datosActualizacion } = pago.data
          await actualizarPago(pago.id, datosActualizacion)
        } catch (error) {
          addProcessLog(`❌ Error al guardar pago: ${error instanceof Error ? error.message : "Error desconocido"}`)
        }
      }

      // Actualizar la UI con todos los pagos de una sola vez
      await fetchPagos()
      addProcessLog(`✅ Base de datos actualizada correctamente`)

      // Marcar los periodos como con bonos calculados
      for (const periodoId of periodosSeleccionadosParaBono) {
        const periodoSeleccionado = periodos.find((p) => p.id === periodoId)
        if (periodoSeleccionado && !periodoSeleccionado.bonoCalculado) {
          await actualizarPeriodo(periodoId, {
            ...periodoSeleccionado,
            bonoCalculado: true,
          })
          addProcessLog(
            `✅ Periodo ${periodoSeleccionado.numero}-${periodoSeleccionado.año} marcado con bonos calculados`,
          )
        }
      }

      // Final summary
      addProcessLog("\n🏁 Proceso completado. Resumen:")
      addProcessLog(`✅ Bonos actualizados: ${bonosActualizados}`)
      addProcessLog(`👥 Total instructores procesados: ${todosInstructores.length}`)
      addProcessLog(`📅 Periodos procesados: ${periodosSeleccionadosParaBono.length}`)

      toast({
        title: "Cálculo de bonos completado",
        description: `Se han actualizado ${bonosActualizados} bonos para ${todosInstructores.length} instructores.`,
      })

      // Limpiar la selección de periodos
      setPeriodosSeleccionadosParaBono([])
    } catch (error) {
      addProcessLog(`❌ Error en el proceso: ${error instanceof Error ? error.message : "Error desconocido"}`)
      toast({
        title: "Error al calcular bonos",
        description: error instanceof Error ? error.message : "Error desconocido al calcular bonos",
        variant: "destructive",
      })
    } finally {
      addProcessLog("🏁 Finalizando proceso")
      setIsCalculatingBonuses(false)
    }
  }

  // Retornar los estados y funciones existentes, más los nuevos
  return {
    // Estados y funciones existentes...
    isCalculatingPayments,
    processLogs,
    setProcessLogs,
    calcularPagosPeriodo,
    selectedPeriodoId,
    setSelectedPeriodoId,
    calcularBonoEnPeriodo,
    setCalcularBonoEnPeriodo,
    reevaluarTodasCategorias,
    showFormulaDuplicationDialog,
    setShowFormulaDuplicationDialog,
    periodoOrigenFormulas,
    isDuplicatingFormulas,
    handleDuplicateFormulas,

    // Nuevos estados y funciones para bonos
    isCalculatingBonuses,
    periodosSeleccionadosParaBono,
    setPeriodosSeleccionadosParaBono,
    verificarBonoCalculado,
    obtenerPeriodosDisponiblesParaBono,
    togglePeriodoParaBono,
    calcularBonosPeriodo,
  }
}
