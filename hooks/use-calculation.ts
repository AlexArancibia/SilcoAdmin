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

  // Helper function to add process logs
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

  // Update the determinarCategoria function to get properties from pagoInstructor instead of instructor
  const determinarCategoria = (
    instructorId: number,
    disciplinaId: number,
    periodoId: number,
    formula: FormulaDB,
  ): CategoriaInstructor => {
    // Get instructor's classes for this discipline and period
    const clasesInstructor = clases.filter(
      (c) => c.instructorId === instructorId && c.disciplinaId === disciplinaId && c.periodoId === periodoId,
    )

    // Get instructor data
    const instructor = instructores.find((i) => i.id === instructorId)
    if (!instructor) return "INSTRUCTOR"

    // Buscar el pago del instructor para este periodo (para obtener los campos que ahora están en PagoInstructor)
    const pagoInstructor = pagos.find((p) => p.instructorId === instructorId && p.periodoId === periodoId)

    // Calculate metrics
    const totalClases = clasesInstructor.length

    // Calculate occupancy rate (reservas / lugares)
    let totalReservas = 0
    let totalLugares = 0
    clasesInstructor.forEach((clase) => {
      totalReservas += clase.reservasTotales
      totalLugares += clase.lugares
    })
    const ocupacion = totalLugares > 0 ? (totalReservas / totalLugares) * 100 : 0

    // Count unique locations in Lima
    const localesEnLima = new Set(
      clasesInstructor.filter((c) => c.ciudad.toLowerCase().includes("lima")).map((c) => c.estudio),
    ).size

    // Get instructor metrics - ahora desde pagoInstructor en lugar de instructor
    const dobleteos = pagoInstructor?.dobleteos || 0
    const horariosNoPrime = pagoInstructor?.horariosNoPrime || 0
    const participacionEventos = pagoInstructor?.participacionEventos || false
    const cumpleLineamientos = pagoInstructor?.cumpleLineamientos || false

    // Check requirements for each category from highest to lowest
    const requisitos = formula.requisitosCategoria

    // Check EMBAJADOR_SENIOR requirements
    if (
      requisitos.EMBAJADOR_SENIOR &&
      ocupacion >= requisitos.EMBAJADOR_SENIOR.ocupacion &&
      totalClases >= requisitos.EMBAJADOR_SENIOR.clases &&
      localesEnLima >= requisitos.EMBAJADOR_SENIOR.localesEnLima &&
      dobleteos >= requisitos.EMBAJADOR_SENIOR.dobleteos &&
      horariosNoPrime >= requisitos.EMBAJADOR_SENIOR.horariosNoPrime &&
      (participacionEventos || !requisitos.EMBAJADOR_SENIOR.participacionEventos) &&
      (cumpleLineamientos || !requisitos.EMBAJADOR_SENIOR.lineamientos)
    ) {
      return "EMBAJADOR_SENIOR"
    }

    // Check EMBAJADOR requirements
    if (
      requisitos.EMBAJADOR &&
      ocupacion >= requisitos.EMBAJADOR.ocupacion &&
      totalClases >= requisitos.EMBAJADOR.clases &&
      localesEnLima >= requisitos.EMBAJADOR.localesEnLima &&
      dobleteos >= requisitos.EMBAJADOR.dobleteos &&
      horariosNoPrime >= requisitos.EMBAJADOR.horariosNoPrime &&
      (participacionEventos || !requisitos.EMBAJADOR.participacionEventos) &&
      (cumpleLineamientos || !requisitos.EMBAJADOR.lineamientos)
    ) {
      return "EMBAJADOR"
    }

    // Check EMBAJADOR_JUNIOR requirements
    if (
      requisitos.EMBAJADOR_JUNIOR &&
      ocupacion >= requisitos.EMBAJADOR_JUNIOR.ocupacion &&
      totalClases >= requisitos.EMBAJADOR_JUNIOR.clases &&
      localesEnLima >= requisitos.EMBAJADOR_JUNIOR.localesEnLima &&
      dobleteos >= requisitos.EMBAJADOR_JUNIOR.dobleteos &&
      horariosNoPrime >= requisitos.EMBAJADOR_JUNIOR.horariosNoPrime &&
      (participacionEventos || !requisitos.EMBAJADOR_JUNIOR.participacionEventos) &&
      (cumpleLineamientos || !requisitos.EMBAJADOR_JUNIOR.lineamientos)
    ) {
      return "EMBAJADOR_JUNIOR"
    }

    // Default to INSTRUCTOR
    return "INSTRUCTOR"
  }

  // Function to get or create instructor category
  const getOrCreateInstructorCategoria = async (
    instructorId: number,
    disciplinaId: number,
    periodoId: number,
    formula: any,
  ): Promise<CategoriaInstructor> => {
    // Find the instructor
    const instructor = instructores.find((i) => i.id === instructorId)
    if (!instructor) {
      addProcessLog(`⚠️ Instructor ID ${instructorId} no encontrado`)
      return "INSTRUCTOR" // Default category if instructor not found
    }

    // Buscar el pago del instructor para este periodo (para obtener los campos que ahora están en PagoInstructor)
    const pagoInstructor = pagos.find((p) => p.instructorId === instructorId && p.periodoId === periodoId)

    // Check if instructor already has a category for this specific discipline and period
    const existingCategoria = instructor.categorias?.find(
      (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId,
    )

    if (existingCategoria) {
      addProcessLog(`✓ Instructor ${instructor.nombre} ya tiene categoría para disciplina ${disciplinaId}`)
      return existingCategoria.categoria
    }

    // Determine appropriate category based on metrics
    const categoriaCalculada = determinarCategoria(instructorId, disciplinaId, periodoId, formula)

    // Get instructor's classes for this discipline and period
    const clasesInstructor = clases.filter(
      (c) => c.instructorId === instructorId && c.disciplinaId === disciplinaId && c.periodoId === periodoId,
    )

    // Calculate metrics for storing
    const totalClases = clasesInstructor.length

    // Calculate occupancy rate (reservas / lugares)
    let totalReservas = 0
    let totalLugares = 0
    clasesInstructor.forEach((clase) => {
      totalReservas += clase.reservasTotales
      totalLugares += clase.lugares
    })
    const ocupacion = totalLugares > 0 ? (totalReservas / totalLugares) * 100 : 0

    // Count unique locations in Lima
    const localesEnLima = new Set(
      clasesInstructor.filter((c) => c.ciudad.toLowerCase().includes("lima")).map((c) => c.estudio),
    ).size

    // Create new category
    try {
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

      // Importante: Obtener el instructor más actualizado antes de modificar sus categorías
      const instructorActualizado = await instructoresApi.getInstructor(instructorId)

      // Get existing categories or initialize empty array
      const categorias = instructorActualizado.categorias || []

      // Make sure we're not duplicating categories
      const categoriaIndex = categorias.findIndex((c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId)

      const updatedCategorias = [...categorias]

      if (categoriaIndex >= 0) {
        // Replace existing category
        updatedCategorias[categoriaIndex] = { ...updatedCategorias[categoriaIndex], ...nuevaCategoria }
      } else {
        // Add new category
        updatedCategorias.push(nuevaCategoria)
      }

      // Update instructor with the new category
      await actualizarInstructor(instructorId, {
        categorias: updatedCategorias,
      })

      addProcessLog(`✓ Categoría creada para ${instructor.nombre} en disciplina ${disciplinaId}: ${categoriaCalculada}`)

      // Return the newly created category
      return categoriaCalculada
    } catch (error) {
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

    addProcessLog("🚀 Iniciando cálculo de pagos...")

    setIsCalculatingPayments(true)
    setShowCalculateDialog(false)

    try {
      addProcessLog(`📅 Calculando pagos para periodo ID: ${periodoId}`)

      // Get all instructors with classes in this period
      const instructoresConClases = [
        ...new Set(clases.filter((c) => c.periodoId === periodoId).map((c) => c.instructorId)),
      ]
      const todosInstructores = instructores.filter((i) => instructoresConClases.includes(i.id))

      addProcessLog(`👥 Total instructores con clases: ${todosInstructores.length}`)

      // Get existing payments for this period
      const pagosPeriodo = pagos.filter((p) => p.periodoId === periodoId)
      const instructoresConPago = new Set(pagosPeriodo.map((p) => p.instructorId))

      addProcessLog(`💰 Instructores con pago existente: ${instructoresConPago.size}`)

      let pagosCreados = 0
      let pagosActualizados = 0
      let categoriasCreadas = 0

      // Process each instructor
      for (const instructor of todosInstructores) {
        addProcessLog(`Procesando instructor ${instructor.nombre}`, instructor.id)

        // Get classes for this instructor in this period
        const clasesInstructor = clases.filter(
          (clase) => clase.instructorId === instructor.id && clase.periodoId === periodoId,
        )

        if (clasesInstructor.length === 0) {
          addProcessLog(`Sin clases, omitiendo`, instructor.id)
          continue
        }

        // Check if instructor already has a payment for this period
        const pagoExistente = pagos.find((p) => p.instructorId === instructor.id && p.periodoId === periodoId)

        // Calculate total payment amount
        let montoTotal = 0
        const detallesClases = []
        const disciplinasUnicas = [...new Set(clasesInstructor.map((c) => c.disciplinaId))]

        // Calculate non-prime hours
        const horariosNoPrime = clasesInstructor.filter((clase) => {
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

        // Crear un mapa para almacenar las categorías por disciplina
        const categoriasPorDisciplina = new Map<number, CategoriaInstructor>()

        // Primero, procesar todas las categorías para cada disciplina
        for (const disciplinaId of disciplinasUnicas) {
          const disciplina = disciplinas.find((d) => d.id === disciplinaId)

          if (!disciplina) {
            addProcessLog(`Disciplina ID ${disciplinaId} no encontrada, omitiendo`, instructor.id)
            continue
          }

          // Get formula for this discipline
          const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodoId)

          if (!formula) {
            addProcessLog(`No se encontró fórmula para ${disciplina.nombre}, omitiendo`, instructor.id)
            continue
          }

          // Crear o obtener la categoría para esta disciplina específica
          try {
            const categoriaInstructor = await getOrCreateInstructorCategoria(
              instructor.id,
              disciplinaId,
              periodoId,
              formula,
            )
            categoriasPorDisciplina.set(disciplinaId, categoriaInstructor)
            categoriasCreadas++

            addProcessLog(`✅ Categoría para ${disciplina.nombre}: ${categoriaInstructor}`, instructor.id)
          } catch (error) {
            addProcessLog(
              `❌ Error al procesar categoría para ${disciplina.nombre}: ${error instanceof Error ? error.message : "Error desconocido"}`,
              instructor.id,
            )
            // Usar INSTRUCTOR como categoría por defecto en caso de error
            categoriasPorDisciplina.set(disciplinaId, "INSTRUCTOR")
          }
        }

        // Ahora, calcular los pagos usando las categorías asignadas
        for (const disciplinaId of disciplinasUnicas) {
          const clasesDisciplina = clasesInstructor.filter((c) => c.disciplinaId === disciplinaId)
          const disciplina = disciplinas.find((d) => d.id === disciplinaId)

          if (!disciplina) continue

          // Get formula for this discipline
          const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodoId)
          if (!formula) continue

          // Obtener la categoría asignada para esta disciplina
          const categoriaInstructor = categoriasPorDisciplina.get(disciplinaId) || "INSTRUCTOR"

          addProcessLog(
            `Calculando pagos para disciplina ${disciplina.nombre} con categoría ${categoriaInstructor}`,
            instructor.id,
          )

          // Calculate payment for each class in this discipline
          for (const clase of clasesDisciplina) {
            try {
              const resultado = calcularPago(clase, categoriaInstructor, formula)
              montoTotal += resultado.montoPago

              detallesClases.push({
                claseId: clase.id,
                montoCalculado: resultado.montoPago,
                disciplinaId: clase.disciplinaId,
                disciplinaNombre: disciplina.nombre,
                fechaClase: clase.fecha,
                detalleCalculo: resultado.detalleCalculo,
                categoria: categoriaInstructor,
              })
            } catch (error) {
              addProcessLog(`Error al calcular pago para clase ${clase.id}`, instructor.id)
            }
          }
        }

        // Recargar el instructor para obtener las categorías actualizadas
        const instructorActualizado = await instructoresApi.getInstructor(instructor.id)

        // Calculate bonus if enabled
        let bonoTotal = 0
        if (calcularBonoEnPeriodo) {
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
        }

        // Calculate retention and final payment
        const montoConBono = montoTotal + bonoTotal
        const retencionCalculada = montoConBono * retencionValor
        const pagoFinal = montoConBono - retencionCalculada

        // Modifiquemos la parte donde se crea o actualiza el pago
        // Create or update payment
        try {
          // Preparar el objeto de pago con todos los datos necesarios
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
            dobleteos: 0,
            horariosNoPrime: horariosNoPrime,
            participacionEventos: false,
            cumpleLineamientos: false,
            detalles: {
              clases: detallesClases,
              resumen: {
                totalClases: detallesClases.length,
                totalMonto: montoTotal,
                bono: bonoTotal,
                disciplinas: disciplinasUnicas.length,
                categorias: disciplinasUnicas.map((disciplinaId) => {
                  // Usar las categorías que acabamos de crear/obtener
                  const categoria = categoriasPorDisciplina.get(disciplinaId) || "INSTRUCTOR"
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

          // For existing payments, preserve manual values
          if (pagoExistente) {
            // Crear un objeto de actualización parcial
            const actualizacion = {
              monto: montoTotal,
              bono: bonoTotal,
              retencion: retencionCalculada,
              pagoFinal: pagoFinal,
              // Mantener valores manuales existentes
              horariosNoPrime: horariosNoPrime,
              detalles: pagoData.detalles,
            }

            // Usar el método del store para actualizar
            await actualizarPago(pagoExistente.id, actualizacion)
            pagosActualizados++
            addProcessLog(`✅ Pago actualizado`, instructor.id)
          } else {
            // Usar el método del store para crear
            await crearPago(pagoData)
            pagosCreados++
            addProcessLog(`✅ Pago creado`, instructor.id)
          }
        } catch (error) {
          addProcessLog(
            `❌ Error al procesar pago: ${error instanceof Error ? error.message : "Error desconocido"}`,
            instructor.id,
          )
        }
      }

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
      addProcessLog(`✅ Pagos creados: ${pagosCreados}`)
      addProcessLog(`🔄 Pagos actualizados: ${pagosActualizados}`)
      addProcessLog(`📊 Categorías creadas/actualizadas: ${categoriasCreadas}`)
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

      await fetchPagos()
      toast({
        title: "Cálculo completado",
        description: `Se han creado ${pagosCreados} pagos y actualizado ${pagosActualizados}.`,
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
    // Clear previous logs
    setProcessLogs([])
    setShowProcessLogsDialog(true)

    addProcessLog("🔄 Re-evaluando categorías de instructores...")

    const periodoId = selectedPeriodoId || periodoActual?.id

    if (!periodoId) {
      addProcessLog("❌ Error: No hay periodo seleccionado")
      toast({
        title: "Error",
        description: "Debes seleccionar un periodo para re-evaluar las categorías",
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

    setIsCalculatingPayments(true)
    setShowCalculateDialog(false)

    try {
      addProcessLog(`📅 Re-evaluando categorías para periodo ID: ${periodoId}`)

      // Get all instructors with classes in this period
      const instructoresConClases = [
        ...new Set(clases.filter((c) => c.periodoId === periodoId).map((c) => c.instructorId)),
      ]
      const todosInstructores = instructores.filter((i) => instructoresConClases.includes(i.id))

      addProcessLog(`👥 Total instructores con clases: ${todosInstructores.length}`)

      let categoriasActualizadas = 0

      // Helper function to calculate metrics
      const calcularMetricas = (clasesInstructor: any[], disciplinaId: number) => {
        const clasesDisciplina = clasesInstructor.filter((c) => c.disciplinaId === disciplinaId)
        const totalClases = clasesDisciplina.length

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

        return { ocupacion, clases: totalClases, localesEnLima }
      }

      // Process each instructor
      for (const instructor of todosInstructores) {
        addProcessLog(`Procesando instructor ${instructor.nombre}`, instructor.id)

        // Get classes for this instructor in this period
        const clasesInstructor = clases.filter(
          (clase) => clase.instructorId === instructor.id && clase.periodoId === periodoId,
        )

        if (clasesInstructor.length === 0) {
          addProcessLog(`Sin clases, omitiendo`, instructor.id)
          continue
        }

        // Get the payment for this instructor in this period
        const pagoInstructor = pagos.find((p) => p.instructorId === instructor.id && p.periodoId === periodoId)

        if (!pagoInstructor) {
          addProcessLog(`Sin pago registrado, omitiendo`, instructor.id)
          continue
        }

        // Get unique disciplines taught by the instructor
        const disciplinasInstructor = [...new Set(clasesInstructor.map((c) => c.disciplinaId))]

        // Process each discipline the instructor has taught
        for (const disciplinaId of disciplinasInstructor) {
          // Get the discipline name
          const disciplina = disciplinas.find((d) => d.id === disciplinaId)
          const nombreDisciplina = disciplina?.nombre || `Disciplina ${disciplinaId}`

          // Skip disciplines that don't have visual categories
          if (disciplina && !mostrarCategoriaVisual(disciplina.nombre)) {
            continue
          }

          // Calculate real metrics for this discipline
          const metricasBase = calcularMetricas(clasesInstructor, disciplinaId)

          // Get formula for this discipline
          const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodoId)

          if (!formula) {
            addProcessLog(`No se encontró fórmula para ${nombreDisciplina}, omitiendo`, instructor.id)
            continue
          }

          // Determine appropriate category based on metrics
          const categoriaCalculada = determinarCategoria(instructor.id, disciplinaId, periodoId, formula)

          // Get existing category
          const existingCategoria = instructor.categorias?.find(
            (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId,
          )

          // If the category has changed, update it
          if (existingCategoria?.categoria !== categoriaCalculada) {
            try {
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
                  dobleteos: pagoInstructor.dobleteos || 0,
                  horariosNoPrime: pagoInstructor.horariosNoPrime || 0,
                  participacionEventos: pagoInstructor.participacionEventos || false,
                },
              }

              // Get existing categories or initialize empty array
              const categorias = instructor.categorias || []

              // Find the index of the category to update
              const categoriaIndex = categorias.findIndex(
                (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId,
              )

              const updatedCategorias = [...categorias]

              if (categoriaIndex >= 0) {
                // Replace existing category
                updatedCategorias[categoriaIndex] = { ...updatedCategorias[categoriaIndex], ...nuevaCategoria }
              } else {
                // Add new category
                updatedCategorias.push(nuevaCategoria)
              }

              // Update instructor with the updated category
              await actualizarInstructor(instructor.id, {
                categorias: updatedCategorias,
              })

              categoriasActualizadas++
              addProcessLog(
                `✅ Categoría actualizada para ${instructor.nombre} en ${nombreDisciplina} a ${categoriaCalculada}`,
                instructor.id,
              )
            } catch (error) {
              addProcessLog(
                `❌ Error al actualizar categoría para ${instructor.nombre} en ${nombreDisciplina}: ${
                  error instanceof Error ? error.message : "Error desconocido"
                }`,
                instructor.id,
              )
            }
          } else {
            addProcessLog(
              `✓ Categoría sin cambios para ${instructor.nombre} en ${nombreDisciplina} (${categoriaCalculada})`,
              instructor.id,
            )
          }
        }
      }

      // Final summary
      addProcessLog("\n🏁 Proceso completado. Resumen:")
      addProcessLog(`✅ Categorías actualizadas: ${categoriasActualizadas}`)
      addProcessLog(`👥 Total instructores procesados: ${todosInstructores.length}`)

      await fetchInstructores()
      toast({
        title: "Re-evaluación completada",
        description: `Se han actualizado ${categoriasActualizadas} categorías de instructores.`,
      })
    } catch (error) {
      addProcessLog(`❌ Error en el proceso: ${error instanceof Error ? error.message : "Error desconocido"}`)
      toast({
        title: "Error al re-evaluar categorías",
        description: error instanceof Error ? error.message : "Error desconocido al re-evaluar categorías",
        variant: "destructive",
      })
    } finally {
      addProcessLog("🏁 Finalizando proceso")
      setIsCalculatingPayments(false)
    }
  }

  return {
    isCalculatingPayments,
    processLogs,
    setProcessLogs,
    calcularPagosPeriodo,
    selectedPeriodoId,
    setSelectedPeriodoId,
    calcularBonoEnPeriodo,
    setCalcularBonoEnPeriodo,
    reevaluarTodasCategorias,
    // Nuevos estados y funciones para el diálogo de duplicación de fórmulas
    showFormulaDuplicationDialog,
    setShowFormulaDuplicationDialog,
    periodoOrigenFormulas,
    isDuplicatingFormulas,
    handleDuplicateFormulas,
  }
}
