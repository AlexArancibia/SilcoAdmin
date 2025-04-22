"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { hash } from "bcryptjs"
import * as XLSX from "xlsx"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "@/hooks/use-toast"
import type { DatosExcelClase, ResultadoImportacion, ErrorImportacion } from "@/types/importacion"
import type { Instructor, Disciplina, Clase } from "@/types/schema"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { useFormulasStore } from "@/store/useFormulaStore"
import { usePagosStore } from "@/store/usePagosStore"
import { clasesApi } from "@/lib/api/clases-api"
import { instructoresApi } from "@/lib/api/instructores-api"

// Interfaces para el análisis de instructores y disciplinas
interface InstructorAnalysis {
  total: number
  existing: number
  new: number
  instructors: Array<{
    name: string
    exists: boolean
    count: number
    matchedInstructor?: Instructor
    disciplines: Set<string>
  }>
}

// Modify the DisciplineAnalysis interface to add a new property for VS detection
interface DisciplineAnalysis {
  total: number
  existing: number
  new: number
  disciplines: Array<{
    name: string
    exists: boolean
    count: number
    mappedTo?: string
    matchedDiscipline?: Disciplina
    matchedInstructor?: Instructor
  }>
}

// Función para formatear JSON de manera más legible para los mensajes de error
const formatErrorJson = (obj: any): string => {
  try {
    // Limitar la longitud del JSON para evitar mensajes de error demasiado largos
    const json = JSON.stringify(obj, null, 2)
    // Si el JSON es muy largo, truncarlo
    if (json.length > 1000) {
      return json.substring(0, 1000) + "... (truncado)"
    }
    return json
  } catch (error) {
    return "Error al formatear JSON: " + String(error)
  }
}

export function useExcelImport() {
  // State variables
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<DatosExcelClase[] | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [showAllColumns, setShowAllColumns] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isInitialLoading, setIsInitialLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pagosCreados, setPagosCreados] = useState<number>(0)
  const [periodoSeleccionadoId, setPeriodoSeleccionadoId] = useState<number | null>(0)
  const [statusMessage, setStatusMessage] = useState<string>("")
  const [instructorAnalysis, setInstructorAnalysis] = useState<InstructorAnalysis>({
    total: 0,
    existing: 0,
    new: 0,
    instructors: [],
  })
  const [disciplineAnalysis, setDisciplineAnalysis] = useState<DisciplineAnalysis>({
    total: 0,
    existing: 0,
    new: 0,
    disciplines: [],
  })
  const [vsInstructors, setVsInstructors] = useState<
    Array<{
      originalName: string
      instructor1: string
      instructor2: string
      count: number
      keepInstructor1: boolean
      keepInstructor2: boolean
    }>
  >([])

  // Add a new state variable for detailed logging
  const [detailedLogging, setDetailedLogging] = useState<boolean>(false)
  // Add a state for detailed logs
  const [detailedLogs, setDetailedLogs] = useState<
    Array<{
      type: "success" | "error" | "info"
      message: string
      details?: any
      timestamp: string
    }>
  >([])

  // Obtener datos de los stores
  const { periodos, periodoActual, fetchPeriodos, isLoading: isLoadingPeriodos } = usePeriodosStore()
  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()
  const { formulas, fetchFormulas } = useFormulasStore()
  const { instructores, fetchInstructores, isLoading: isLoadingInstructores } = useInstructoresStore()
  const {} = usePagosStore() // No longer needed

  // Cargar datos iniciales si están vacíos
  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true)

      const promises = []

      if (periodos.length === 0) {
        promises.push(fetchPeriodos())
      }
      if (formulas.length === 0) {
        promises.push(fetchFormulas())
      }
      if (disciplinas.length === 0) {
        promises.push(fetchDisciplinas())
      }
      if (instructores.length === 0) {
        promises.push(fetchInstructores())
      }

      if (promises.length > 0) {
        try {
          await Promise.all(promises)
          toast({
            title: "Datos cargados",
            description: "Se han cargado los datos necesarios para la importación",
          })
        } catch (error) {
          toast({
            title: "Error al cargar datos",
            description: error instanceof Error ? error.message : "Error desconocido al cargar datos iniciales",
            variant: "destructive",
          })
        }
      }

      setIsInitialLoading(false)
    }

    loadInitialData()
  }, [
    periodos.length,
    formulas.length,
    disciplinas.length,
    instructores.length,
    fetchPeriodos,
    fetchFormulas,
    fetchDisciplinas,
    fetchInstructores,
  ])

  useEffect(() => {
    if (periodoActual) {
      setPeriodoSeleccionadoId(periodoActual.id)
    }
  }, [periodoActual])

  // Helper functions
  const resetState = () => {
    setIsImporting(false)
    setProgress(0)
    setResultado(null)
    setError(null)
    setPagosCreados(0)
    setStatusMessage("")
    setDetailedLogs([]) // Reset detailed logs
  }

  const logObject = (obj: any) => {
    return JSON.stringify(obj, null, 2)
  }

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      resetState()
      setParsedData(null)
      setCurrentPage(1)
      setCurrentStep(1)

      // Leer el archivo Excel
      const reader = new FileReader()
      reader.onload = (evt) => {
        try {
          if (!evt.target?.result) return

          const data = new Uint8Array(evt.target.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: "array" })

          // Asumimos que los datos están en la primera hoja
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]

          // Opciones para asegurar que las fechas y horas se procesen correctamente
          const options = {
            raw: false,
            dateNF: "yyyy-mm-dd",
            cellDates: true,
            defval: "",
          }

          // Convertir a JSON
          const rawData = XLSX.utils.sheet_to_json(worksheet, options)

          // Aplicar preprocesamiento básico a los datos
          const jsonData = preprocessExcelData(rawData)

          setParsedData(jsonData)
          analyzeInstructors(jsonData)
          analyzeDisciplines(jsonData)
          console.log("Datos procesados:", jsonData)
        } catch (error) {
          console.error("Error al procesar el archivo:", error)
          toast({
            title: "Error al leer el archivo",
            description: "El archivo no tiene el formato esperado.",
            variant: "destructive",
          })
        }
      }
      reader.readAsArrayBuffer(e.target.files[0])
    }
  }

  // Función para preprocesar los datos del Excel
  const preprocessExcelData = (data: any[]): DatosExcelClase[] => {
    console.log("Iniciando preprocesamiento de datos...")
    console.log(`Datos originales: ${data.length} filas`)

    // Filtrar filas con datos críticos faltantes
    let processedData = data.filter((row) => {
      // Verificar que existan los campos críticos
      const hasCriticalData = row.Instructor && row.Disciplina && row.Día

      if (!hasCriticalData) {
        console.log("Fila descartada por falta de datos críticos:", row)
      }

      return hasCriticalData
    })

    console.log(`Después de filtrar filas incompletas: ${processedData.length} filas`)

    // Procesar cada fila para normalizar datos
    processedData = processedData.map((row) => {
      const processedRow = { ...row }

      // Normalizar nombres de instructores (primera letra de cada palabra en mayúscula)
      if (processedRow.Instructor) {
        processedRow.Instructor = processedRow.Instructor.split(" ")
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ")
          .trim()
      }

      // Normalizar nombres de disciplinas (primera letra en mayúscula)
      if (processedRow.Disciplina) {
        processedRow.Disciplina = processedRow.Disciplina.split(" ")
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ")
          .trim()
      }

      // Normalizar nombres de estudios y salones
      if (processedRow.Estudio) {
        processedRow.Estudio = processedRow.Estudio.trim()
      }

      if (processedRow.Salon) {
        processedRow.Salon = processedRow.Salon.trim()
      }

      // Asegurar que los campos numéricos sean números
      const numericFields = ["Reservas Totales", "Listas de Espera", "Cortesias", "Lugares", "Reservas Pagadas"]

      numericFields.forEach((field) => {
        if (field in processedRow) {
          if (typeof processedRow[field] === "string") {
            const numValue = Number(processedRow[field].replace(/[^\d.-]/g, ""))
            processedRow[field] = isNaN(numValue) ? 0 : numValue
          } else if (processedRow[field] === null || processedRow[field] === undefined) {
            processedRow[field] = 0
          }
        } else {
          processedRow[field] = 0
        }
      })

      return processedRow
    })

    console.log(`Preprocesamiento completado: ${processedData.length} filas válidas`)
    return processedData as DatosExcelClase[]
  }

  // Analysis functions
  const analyzeInstructors = (data: DatosExcelClase[]) => {
    // Obtener todos los instructores únicos del archivo y sus disciplinas
    const instructorInfo: Record<string, { count: number; disciplines: Set<string> }> = {}
    const vsInstructorsData: Array<{
      originalName: string
      instructor1: string
      instructor2: string
      count: number
      keepInstructor1: boolean
      keepInstructor2: boolean
    }> = []

    data.forEach((row) => {
      const instructor = row.Instructor
      const discipline = row.Disciplina

      // Update the check to include "vs." format
      if (instructor.toLowerCase().includes(" vs") || instructor.toLowerCase().includes(" vs. ")) {
        // Update the split pattern to handle both "vs" and "vs." formats
        const parts = instructor.split(/\s+vs\.?\s+/i)
        if (parts.length === 2) {
          const instructor1 = parts[0].trim()
          const instructor2 = parts[1].trim()

          // Add individual instructors to instructorInfo instead of the VS name
          if (!instructorInfo[instructor1]) {
            instructorInfo[instructor1] = {
              count: 0,
              disciplines: new Set<string>(),
            }
          }
          instructorInfo[instructor1].count += 1
          instructorInfo[instructor1].disciplines.add(discipline)

          if (!instructorInfo[instructor2]) {
            instructorInfo[instructor2] = {
              count: 0,
              disciplines: new Set<string>(),
            }
          }
          instructorInfo[instructor2].count += 1
          instructorInfo[instructor2].disciplines.add(discipline)

          // Check if this vs instructor is already in our list
          const existingIndex = vsInstructorsData.findIndex((vi) => vi.originalName === instructor)
          if (existingIndex === -1) {
            vsInstructorsData.push({
              originalName: instructor,
              instructor1: instructor1,
              instructor2: instructor2,
              count: 1,
              keepInstructor1: true,
              keepInstructor2: true,
            })
          } else {
            vsInstructorsData[existingIndex].count++
          }
        }
      } else {
        // Regular instructor
        if (!instructorInfo[instructor]) {
          instructorInfo[instructor] = {
            count: 0,
            disciplines: new Set<string>(),
          }
        }
        instructorInfo[instructor].count += 1
        instructorInfo[instructor].disciplines.add(discipline)
      }
    })

    // Set the VS instructors state
    setVsInstructors(vsInstructorsData)

    // Filtrar solo instructores activos
    const activeInstructores = instructores.filter(
      (i) => i.extrainfo?.estado === "ACTIVO" || i.extrainfo?.activo === true || i.extrainfo?.activo === undefined,
    )

    // Crear el análisis
    const instructorsAnalysis = Object.keys(instructorInfo).map((name) => {
      // Buscar si existe un instructor con este nombre - preserve case when searching
      const matchedInstructor = activeInstructores.find((i) => i.nombre.toLowerCase() === name.toLowerCase())

      return {
        name,
        exists: !!matchedInstructor,
        count: instructorInfo[name].count,
        disciplines: instructorInfo[name].disciplines,
        matchedInstructor,
      }
    })

    const existingCount = instructorsAnalysis.filter((i) => i.exists).length

    setInstructorAnalysis({
      total: instructorsAnalysis.length,
      existing: existingCount,
      new: instructorsAnalysis.length - existingCount,
      instructors: instructorsAnalysis.sort((a, b) => b.count - a.count), // Ordenar por cantidad de clases
    })
  }

  const analyzeDisciplines = (data: DatosExcelClase[]) => {
    // Obtener todas las disciplinas únicas del archivo
    const disciplineCounts: Record<string, number> = {}
    data.forEach((row) => {
      const discipline = row.Disciplina
      disciplineCounts[discipline] = (disciplineCounts[discipline] || 0) + 1
    })

    // Crear el análisis
    const disciplinesAnalysis = Object.keys(disciplineCounts).map((name) => {
      // Buscar si existe una disciplina con este nombre
      const matchedDiscipline = disciplinas.find((d) => d.nombre.toLowerCase() === name.toLowerCase())

      return {
        name,
        exists: !!matchedDiscipline,
        count: disciplineCounts[name],
        matchedDiscipline,
      }
    })

    const existingCount = disciplinesAnalysis.filter((d) => d.exists).length

    setDisciplineAnalysis({
      total: disciplinesAnalysis.length,
      existing: existingCount,
      new: disciplinesAnalysis.length - existingCount,
      disciplines: disciplinesAnalysis.sort((a, b) => b.count - a.count), // Ordenar por cantidad de clases
    })
  }

  // Instructor and discipline handling
  const handleDisciplineMapping = (originalName: string, mappedName: string) => {
    setDisciplineAnalysis((prev) => {
      const updatedDisciplines = prev.disciplines.map((d) => {
        if (d.name === originalName) {
          // Buscar la disciplina mapeada
          const matchedDiscipline = disciplinas.find((disc) => disc.nombre === mappedName)
          return {
            ...d,
            mappedTo: mappedName,
            matchedDiscipline,
          }
        }
        return d
      })

      return {
        ...prev,
        disciplines: updatedDisciplines,
      }
    })

    toast({
      title: "Disciplina mapeada",
      description: `"${originalName}" será importada como "${mappedName}"`,
    })
  }

  const asignarDisciplinaAInstructor = async (instructor: Instructor, disciplina: Disciplina): Promise<void> => {
    console.log(`Verificando asignación: Instructor ${instructor.nombre}, Disciplina ${disciplina.nombre}`)

    try {
      // Verificar si el instructor ya tiene la disciplina asignada
      const disciplinasActuales = instructor.disciplinas || []
      const tieneDisciplina = disciplinasActuales.some((d) => d.id === disciplina.id)

      if (tieneDisciplina) {
        console.log(`El instructor ${instructor.nombre} ya tiene asignada la disciplina ${disciplina.nombre}`)
        return
      }

      // Crear un array con los IDs de las disciplinas actuales más la nueva
      const disciplinaIds = [...disciplinasActuales.map((d) => d.id), disciplina.id]

      // Actualizar el instructor con las nuevas disciplinas
      await instructoresApi.actualizarInstructor(instructor.id, {
        disciplinaIds,
      })

      console.log(`Disciplina ${disciplina.nombre} asignada al instructor ${instructor.nombre}`)
    } catch (error) {
      console.error(`Error al asignar disciplina:`, error)
      throw error
    }
  }

  // Update the createInstructor function to check for both "vs" and "vs." formats

  const createInstructor = async (nombre: string, disciplinaIds?: number[]): Promise<number> => {
    // Check if the name contains "vs" or "vs." - if so, don't create the instructor
    if (nombre.toLowerCase().includes(" vs ") || nombre.toLowerCase().includes(" vs. ")) {
      console.error(`No se puede crear un instructor con "vs" en el nombre: ${nombre}`)
      throw new Error(`No se puede crear un instructor con "vs" en el nombre: ${nombre}`)
    }

    // Capitalize each word in the instructor name
    const capitalizedName = nombre
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    console.log(
      `Intentando crear instructor: ${capitalizedName}${disciplinaIds ? ` con disciplinas: ${disciplinaIds.join(", ")}` : ""}`,
    )

    try {
      // Generar la contraseña basada en el patrón definido - use lowercase only for password generation
      const nombreSinEspacios = nombre.replace(/\s+/g, "").toLowerCase()
      const cantidadLetras = nombreSinEspacios.length
      const simbolo = cantidadLetras % 2 === 0 ? "#" : "%"
      const patternPassword = `${nombreSinEspacios}${cantidadLetras}${simbolo}`
      const hashedPassword = await hash(patternPassword, 10)

      // Crear el instructor usando la nueva API con disciplinaIds y contraseña
      // Use the capitalized name
      const nuevoInstructor = await instructoresApi.crearInstructor({
        nombre: capitalizedName, // Use capitalized name
        password: hashedPassword, // Agregar la contraseña hasheada
        extrainfo: {
          estado: "ACTIVO",
          activo: true,
          especialidad: "",
          passwordTemporal: patternPassword, // Guardar la contraseña temporal en extrainfo
        },
        disciplinaIds: disciplinaIds || [], // Agregar disciplinaIds al crear el instructor
      })

      console.log(
        `Instructor creado exitosamente: ${capitalizedName}, ID: ${nuevoInstructor.id}, contraseña temporal: ${patternPassword}`,
      )
      return nuevoInstructor.id
    } catch (error) {
      console.error(`Error al crear instructor ${capitalizedName}:`, error)
      throw error
    }
  }

  // Función para convertir una fecha a formato ISO (YYYY-MM-DD)
  const formatDateToISO = (dateValue: any): Date | null => {
    // Si ya es un objeto Date, devolverlo directamente
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return dateValue
    }

    let date: Date | null = null

    // Si es una cadena, intentar parsearla
    if (typeof dateValue === "string") {
      // Intentar diferentes formatos
      try {
        // Primero intentar con formato ISO
        date = new Date(dateValue)

        // Si no es válida, probar con formato DD/MM/YYYY
        if (isNaN(date.getTime())) {
          const parts = dateValue.split("/")
          if (parts.length === 3) {
            // Formato DD/MM/YYYY
            date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
          }
        }
      } catch (error) {
        console.error(`Error al parsear fecha: ${dateValue}`, error)
        return null
      }
    }

    // Si no se pudo obtener una fecha válida, devolver null
    if (!date || isNaN(date.getTime())) {
      console.error(`No se pudo convertir a fecha: ${dateValue}`)
      return null
    }

    return date
  }

  // Modificar la función combinarFechaHora para asegurar que la hora se establezca correctamente
  // Buscar la función combinarFechaHora en el archivo y reemplazarla con esta versión mejorada:

  const combinarFechaHora = (fecha: Date, horaStr: string): Date => {
    // Crear una nueva fecha para no modificar la original
    const nuevaFecha = new Date(fecha)

    // Asegurarse de que la zona horaria esté configurada correctamente
    // Establecer la hora a 0 para evitar problemas con horario de verano
    nuevaFecha.setHours(0, 0, 0, 0)

    if (horaStr && horaStr.includes(":")) {
      const [horasStr, minutosStr] = horaStr.split(":")
      const horas = Number.parseInt(horasStr, 10)
      const minutos = Number.parseInt(minutosStr, 10)

      // Verificar que los valores sean válidos
      if (!isNaN(horas) && !isNaN(minutos)) {
        // Establecer la hora y minutos SIN ajuste de zona horaria
        // Usamos UTC para evitar cualquier ajuste automático de zona horaria
        nuevaFecha.setUTCHours(horas, minutos, 0, 0)
        console.log(`Hora establecida correctamente: ${nuevaFecha.toISOString()} (de ${horaStr})`)
      } else {
        console.warn(`Formato de hora inválido: ${horaStr}, usando 00:00`)
        nuevaFecha.setUTCHours(0, 0, 0, 0)
      }
    } else {
      console.warn(`Formato de hora no reconocido: ${horaStr}, usando 00:00`)
      nuevaFecha.setUTCHours(0, 0, 0, 0)
    }

    return nuevaFecha
  }

  // Add a function to add detailed logs
  const addDetailedLog = (type: "success" | "error" | "info", message: string, details?: any) => {
    if (detailedLogging) {
      const timestamp = new Date().toLocaleTimeString()
      setDetailedLogs((prev) => [...prev, { type, message, details, timestamp }])
    }
  }

  // Main import function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !parsedData) {
      toast({
        title: "Error",
        description: "Por favor seleccione un archivo para subir",
        variant: "destructive",
      })
      return
    }

    if (!periodoSeleccionadoId) {
      toast({
        title: "Error",
        description: "Por favor seleccione un periodo antes de importar",
        variant: "destructive",
      })
      return
    }

    if (!selectedWeek) {
      toast({
        title: "Error",
        description: "Por favor seleccione la semana a la que pertenecen los datos",
        variant: "destructive",
      })
      return
    }

    try {
      setIsImporting(true)
      setStatusMessage("Iniciando proceso de importación...")
      setProgress(5)
      setError(null)
      setPagosCreados(0)
      console.log("=== INICIANDO PROCESO DE IMPORTACIÓN ===")
      console.log(`Periodo seleccionado: ${periodoSeleccionadoId}, Semana: ${selectedWeek}`)

      // Aplicar mapeos de disciplinas si existen
      console.log("Aplicando mapeos de disciplinas...")
      const processedData = parsedData.map((row) => {
        const disciplineMapping = disciplineAnalysis.disciplines.find((d) => d.name === row.Disciplina)
        if (disciplineMapping?.mappedTo) {
          console.log(`Mapeando disciplina: ${row.Disciplina} -> ${disciplineMapping.mappedTo}`)
          return { ...row, Disciplina: disciplineMapping.mappedTo }
        }
        return row
      })

      // 1. PASO 1: VERIFICAR Y CREAR INSTRUCTORES
      setStatusMessage("Verificando y creando instructores...")
      setProgress(10)

      // Caché de instructores para evitar búsquedas repetidas
      const instructoresCache: Record<string, number> = {}

      // Mapa para rastrear las disciplinas que necesita cada instructor
      const instructorDisciplinas: Record<string, Set<number>> = {}

      // Conjunto para rastrear instructores únicos en esta importación
      const instructoresUnicos: Set<number> = new Set()

      // Llenar el caché con los instructores existentes
      console.log("Inicializando caché de instructores existentes...")
      instructores.forEach((instructor) => {
        instructoresCache[instructor.nombre.toLowerCase()] = instructor.id
        console.log(`Instructor en caché: ${instructor.nombre} (ID: ${instructor.id})`)
      })

      // Primera pasada: recopilar todas las disciplinas necesarias para cada instructor
      console.log("Primera pasada: recopilando disciplinas por instructor...")
      processedData.forEach((row) => {
        const instructorNombre = row.Instructor.toLowerCase()
        const disciplina = disciplinas.find((d) => d.nombre.toLowerCase() === row.Disciplina.toLowerCase())

        if (disciplina) {
          if (!instructorDisciplinas[instructorNombre]) {
            instructorDisciplinas[instructorNombre] = new Set<number>()
          }
          instructorDisciplinas[instructorNombre].add(disciplina.id)
        }
      })

      // Mostrar las disciplinas recopiladas por instructor
      Object.entries(instructorDisciplinas).forEach(([instructor, disciplinaIds]) => {
        console.log(`Instructor ${instructor} necesita las disciplinas: ${Array.from(disciplinaIds).join(", ")}`)
      })

      // Crear o actualizar instructores
      let instructoresCreados = 0
      const errores: ErrorImportacion[] = []

      // Modify the section in handleSubmit where instructors are processed
      for (const [instructorNombre, disciplinaIdsSet] of Object.entries(instructorDisciplinas)) {
        try {
          const disciplinaIdsArray = Array.from(disciplinaIdsSet)

          // Verificar si ya existe el instructor - use case-insensitive comparison but preserve original case
          const instructorNombreLower = instructorNombre.toLowerCase()
          if (Object.keys(instructoresCache).some((name) => name.toLowerCase() === instructorNombreLower)) {
            // Find the exact key with case preserved
            const exactKey = Object.keys(instructoresCache).find((name) => name.toLowerCase() === instructorNombreLower)
            const instructorId = instructoresCache[exactKey!]
            console.log(`Instructor encontrado en caché: ${instructorNombre} (ID: ${instructorId})`)

            // Actualizar disciplinas si es necesario
            const instructorExistente = instructores.find((i) => i.id === instructorId)
            if (instructorExistente) {
              const disciplinasActuales = instructorExistente.disciplinas?.map((d) => d.id) || []

              // Filtrar solo las disciplinas que no tiene asignadas
              const nuevasDisciplinas = disciplinaIdsArray.filter((id) => !disciplinasActuales.includes(id))

              if (nuevasDisciplinas.length > 0) {
                await instructoresApi.actualizarInstructor(instructorId, {
                  disciplinaIds: [...disciplinasActuales, ...nuevasDisciplinas],
                })
                console.log(
                  `Disciplinas asignadas al instructor existente ${instructorNombre}: ${nuevasDisciplinas.join(", ")}`,
                )
              }
            }

            instructoresUnicos.add(instructorId)
          } else {
            // Crear nuevo instructor - preserve original case
            console.log(`Creando nuevo instructor: ${instructorNombre}`)
            const instructorId = await createInstructor(
              instructorNombre,
              disciplinaIdsArray.length > 0 ? disciplinaIdsArray : undefined,
            )

            // Store with original case preserved
            instructoresCache[instructorNombre] = instructorId
            instructoresCreados++
            instructoresUnicos.add(instructorId)
            console.log(`Instructor creado: ${instructorNombre} (ID: ${instructorId})`)
          }
        } catch (error) {
          console.error(`Error al procesar instructor ${instructorNombre}:`, error)
          errores.push({
            fila: 0, // No podemos saber la fila exacta aquí
            mensaje: `Error al procesar instructor "${instructorNombre}": ${error instanceof Error ? error.message : "Error desconocido"}`,
          })
        }
      }

      setProgress(25)

      // 2. PASO 2: ELIMINAR CLASES EXISTENTES
      setStatusMessage("Buscando y eliminando clases existentes...")

      const weekNumber = Number.parseInt(selectedWeek)
      console.log(`Buscando clases existentes para periodo ${periodoSeleccionadoId} y semana ${weekNumber}`)

      // Obtener clases existentes para el periodo y semana
      const clasesExistentes = await clasesApi.getClases({
        periodoId: periodoSeleccionadoId,
        semana: weekNumber,
      })
      console.log(`Se encontraron ${clasesExistentes.length} clases existentes para eliminar`)

      // Eliminar clases existentes
      let clasesEliminadas = 0
      if (clasesExistentes.length > 0) {
        console.log("Eliminando clases existentes...")
        for (const clase of clasesExistentes) {
          console.log(`Eliminando clase ID: ${clase.id}`)
          await clasesApi.deleteClase(clase.id)
          clasesEliminadas++
        }
        console.log(`Se eliminaron ${clasesEliminadas} clases existentes`)
      }

      setProgress(40)

      // 3. PASO 3: CREAR NUEVAS CLASES
      setStatusMessage("Creando nuevas clases...")

      let clasesCreadas = 0
      let registrosConError = 0

      for (let i = 0; i < processedData.length; i++) {
        try {
          const row = processedData[i]
          console.log(`\n--- Procesando registro ${i + 1}/${processedData.length} ---`)
          console.log(
            `Instructor: ${row.Instructor}, Disciplina: ${row.Disciplina}, Fecha: ${row.Día}, Hora: ${row.Hora}`,
          )

          // Actualizar progreso
          setProgress(40 + Math.floor((i / processedData.length) * 60)) // Ajustado para llegar a 100% sin el paso de pagos

          // Buscar disciplina
          const disciplina = disciplinas.find((d) => d.nombre.toLowerCase() === row.Disciplina.toLowerCase())

          if (!disciplina) {
            console.error(`No se encontró la disciplina "${row.Disciplina}"`)
            errores.push({
              fila: i + 1,
              mensaje: `No se encontró la disciplina "${row.Disciplina}"`,
            })
            registrosConError++
            continue
          }
          console.log(`Disciplina encontrada: ${disciplina.nombre} (ID: ${disciplina.id})`)

          // Check if this is a VS instructor
          const isVsInstructor =
            row.Instructor.toLowerCase().includes(" vs ") || row.Instructor.toLowerCase().includes(" vs. ")
          const instructorIds: number[] = []

          // Modify the section in handleSubmit where VS instructors are processed
          if (isVsInstructor) {
            // Split the instructor name with updated regex to handle both formats
            const parts = row.Instructor.split(/\s+vs\.?\s+/i)
            if (parts.length === 2) {
              const instructor1Name = parts[0].trim()
              const instructor2Name = parts[1].trim()

              // Get the VS instructor configuration
              const vsInstructorConfig = vsInstructors.find((vi) => vi.originalName === row.Instructor)

              // Check which instructors to keep
              const keepInstructor1 = vsInstructorConfig?.keepInstructor1 ?? true
              const keepInstructor2 = vsInstructorConfig?.keepInstructor2 ?? true

              // Get or create both instructors
              if (keepInstructor1) {
                // Look for instructor1 in cache (case-insensitive search but preserve original case)
                const instructor1NameLower = instructor1Name.toLowerCase()
                const exactKey1 = Object.keys(instructoresCache).find(
                  (name) => name.toLowerCase() === instructor1NameLower,
                )

                if (exactKey1) {
                  instructorIds.push(instructoresCache[exactKey1])
                } else {
                  // Create new instructor with original case
                  // Also add an additional check in the section where VS instructors are processed
                  // to ensure we never create an instructor with "vs" in the name
                  if (
                    instructor1Name.toLowerCase().includes(" vs ") ||
                    instructor1Name.toLowerCase().includes(" vs. ")
                  ) {
                    console.error(`No se puede crear un instructor con "vs" en el nombre: ${instructor1Name}`)
                    errores.push({
                      fila: i + 1,
                      mensaje: `No se puede crear un instructor con "vs" en el nombre: ${instructor1Name}`,
                    })
                    continue
                  }
                  try {
                    console.log(`Creando nuevo instructor desde VS: ${instructor1Name}`)
                    const disciplinaIdsArray = disciplina ? [disciplina.id] : []
                    const instructorId = await createInstructor(
                      instructor1Name,
                      disciplinaIdsArray.length > 0 ? disciplinaIdsArray : undefined,
                    )

                    instructoresCache[instructor1Name] = instructorId
                    instructoresCreados++
                    instructoresUnicos.add(instructorId)
                    instructorIds.push(instructorId)
                    console.log(`Instructor creado desde VS: ${instructor1Name} (ID: ${instructorId})`)
                  } catch (error) {
                    console.error(`Error al crear instructor desde VS ${instructor1Name}:`, error)
                    errores.push({
                      fila: i + 1,
                      mensaje: `Error al crear instructor desde VS "${instructor1Name}": ${error instanceof Error ? error.message : "Error desconocido"}`,
                    })
                    continue
                  }
                }
              }

              if (keepInstructor2) {
                // Look for instructor2 in cache (case-insensitive search but preserve original case)
                const instructor2NameLower = instructor2Name.toLowerCase()
                const exactKey2 = Object.keys(instructoresCache).find(
                  (name) => name.toLowerCase() === instructor2NameLower,
                )

                if (exactKey2) {
                  instructorIds.push(instructoresCache[exactKey2])
                } else {
                  // Create new instructor with original case
                  // Also add an additional check in the section where VS instructors are processed
                  // to ensure we never create an instructor with "vs" in the name
                  if (
                    instructor2Name.toLowerCase().includes(" vs ") ||
                    instructor2Name.toLowerCase().includes(" vs. ")
                  ) {
                    console.error(`No se puede crear un instructor con "vs" en el nombre: ${instructor2Name}`)
                    errores.push({
                      fila: i + 1,
                      mensaje: `No se puede crear un instructor con "vs" en el nombre: ${instructor2Name}`,
                    })
                    continue
                  }
                  try {
                    console.log(`Creando nuevo instructor desde VS: ${instructor2Name}`)
                    const disciplinaIdsArray = disciplina ? [disciplina.id] : []
                    const instructorId = await createInstructor(
                      instructor2Name,
                      disciplinaIdsArray.length > 0 ? disciplinaIdsArray : undefined,
                    )

                    instructoresCache[instructor2Name] = instructorId
                    instructoresCreados++
                    instructoresUnicos.add(instructorId)
                    instructorIds.push(instructorId)
                    console.log(`Instructor creado desde VS: ${instructor2Name} (ID: ${instructorId})`)
                  } catch (error) {
                    console.error(`Error al crear instructor desde VS ${instructor2Name}:`, error)
                    errores.push({
                      fila: i + 1,
                      mensaje: `Error al crear instructor desde VS "${instructor2Name}": ${error instanceof Error ? error.message : "Error desconocido"}`,
                    })
                    continue
                  }
                }
              }
            } else {
              // Invalid VS format
              console.error(`Formato inválido de instructor VS: "${row.Instructor}"`)
              errores.push({
                fila: i + 1,
                mensaje: `Formato inválido de instructor VS: "${row.Instructor}"`,
              })
              registrosConError++
              continue
            }
          } else {
            // Regular instructor
            const instructorNombre = row.Instructor
            const instructorNombreLower = instructorNombre.toLowerCase()

            // Find the exact key with case preserved
            const exactKey = Object.keys(instructoresCache).find((name) => name.toLowerCase() === instructorNombreLower)

            if (!exactKey) {
              console.error(`No se encontró el instructor "${instructorNombre}" en caché`)
              errores.push({
                fila: i + 1,
                mensaje: `No se encontró el instructor "${instructorNombre}"`,
              })
              registrosConError++
              continue
            }

            instructorIds.push(instructoresCache[exactKey])
            console.log(`Instructor encontrado: ${instructorNombre} (ID: ${instructoresCache[exactKey]})`)
          }

          // Procesar la fecha usando la función formatDateToISO
          const fechaObj = formatDateToISO(row.Día)
          if (!fechaObj) {
            console.error(`Formato de fecha inválido: "${row.Día}"`)
            errores.push({
              fila: i + 1,
              mensaje: `Formato de fecha inválido: "${row.Día}"`,
            })
            registrosConError++
            continue
          }

          // Process time
          let hora = ""

          console.log(`Procesando fecha: ${row.Día} (tipo: ${typeof row.Día})`)
          console.log(`Procesando hora: ${row.Hora} (tipo: ${typeof row.Hora})`)

          // Reemplazar la sección problemática que causa el error "Property 'getHours' does not exist on type 'never'"
          // Sabemos que la columna Hora contiene valores en formato "HH:MM" como "06:00", "07:15", etc.
          if (row.Hora) {
            // Tratar la hora como string siempre, ya que sabemos que viene en formato "HH:MM"
            const horaStr = String(row.Hora).trim()
            if (horaStr.includes(":")) {
              hora = horaStr
              console.log(`Hora procesada como string: ${hora}`)
            } else {
              // Si por alguna razón no tiene ":", intentar convertir a formato HH:MM
              const timeValue = Number.parseInt(horaStr)
              if (!isNaN(timeValue)) {
                const hours = Math.floor(timeValue / 100)
                  .toString()
                  .padStart(2, "0")
                const minutes = (timeValue % 100).toString().padStart(2, "0")
                hora = `${hours}:${minutes}`
                console.log(`Hora convertida de número a string: ${hora}`)
              } else {
                hora = "00:00" // Valor predeterminado
                console.log(`No se pudo procesar la hora, usando valor predeterminado: ${hora}`)
              }
            }
          } else {
            hora = "00:00" // Valor predeterminado si no hay hora
            console.log(`No hay valor de hora, usando valor predeterminado: ${hora}`)
          }

          console.log(`Fecha procesada: ${fechaObj}, Hora procesada: ${hora}`)

          // For VS instructors, create two classes with split reservations
          if (isVsInstructor && instructorIds.length > 0) {
            // Get the VS instructor configuration
            const vsInstructorConfig = vsInstructors.find((vi) => vi.originalName === row.Instructor)

            // Check which instructors to keep
            const keepInstructor1 = vsInstructorConfig?.keepInstructor1 ?? true
            const keepInstructor2 = vsInstructorConfig?.keepInstructor2 ?? true

            // Always calculate split values regardless of which instructors are kept
            const totalReservas = row["Reservas Totales"] || 0
            const splitReservas = Math.ceil(totalReservas / 2)

            // Split lugares (capacity) as well
            const totalLugares = Number(row.Lugares || 0)
            const splitLugares = Math.ceil(totalLugares / 2)

            // Get the original class ID and create two new IDs
            const originalId = row.ID_clase ? String(row.ID_clase) : undefined
            const classId1 = originalId ? `${originalId}a` : undefined
            const classId2 = originalId ? `${originalId}b` : undefined

            // Crear fecha con hora
            const fechaConHora = combinarFechaHora(fechaObj, hora)
            const baseClase: Partial<Clase> = {
              periodoId: periodoSeleccionadoId,
              disciplinaId: disciplina.id,
              pais: row.País || "México",
              ciudad: row.Ciudad || "Ciudad de México",
              estudio: row.Estudio || "",
              salon: row.Salon || "",
              fecha: fechaConHora,
              listasEspera: row["Listas de Espera"] || 0,
              cortesias: row.Cortesias || 0,
              textoEspecial: row["Texto espcial"] || "",
              semana: weekNumber,
            }

            // Create first class if instructor1 should be kept
            if (keepInstructor1 && instructorIds.length > 0) {
              // Declare clase1 outside the try block
              const clase1: Partial<Clase> = {
                ...baseClase,
                id: classId1,
                instructorId: instructorIds[0],
                reservasTotales: splitReservas,
                lugares: splitLugares,
                reservasPagadas: Math.ceil((row["Reservas Pagadas"] || 0) / 2),
              }

              try {
                console.log(`Objeto de clase A a crear:`, logObject(clase1))
                const claseCreada1 = await clasesApi.createClase(clase1 as Clase)
                console.log(`Clase A creada exitosamente, ID: ${claseCreada1.id}`)
                clasesCreadas++

                // Add detailed log for successful class creation
                addDetailedLog("success", `Clase A creada exitosamente, ID: ${claseCreada1.id}`, {
                  instructor: instructorIds[0],
                  disciplina: disciplina.nombre,
                  fecha: fechaObj,
                  hora,
                  estudio: row.Estudio || "",
                  reservas: splitReservas,
                  lugares: splitLugares,
                })
              } catch (error) {
                console.error(`Error al crear clase A:`, error)
                console.error(`JSON enviado a crearClase (clase A):`, JSON.stringify(clase1, null, 2))
                errores.push({
                  fila: i + 1,
                  mensaje: `Error al crear clase A: ${error instanceof Error ? error.message : "Error desconocido"}. JSON enviado: ${formatErrorJson(clase1)}`,
                })
                registrosConError++

                // Add detailed log for error
                addDetailedLog(
                  "error",
                  `Error al crear clase A: ${error instanceof Error ? error.message : "Error desconocido"}`,
                  {
                    instructor: instructorIds[0],
                    disciplina: disciplina.nombre,
                    fecha: fechaObj,
                    hora,
                    estudio: row.Estudio || "",
                    error: error instanceof Error ? error.message : "Error desconocido",
                    data: clase1,
                  },
                )
              }
            }

            // Do the same for the second class (clase2)
            if (keepInstructor2 && instructorIds.length > 1) {
              // Declare clase2 outside the try block
              const clase2: Partial<Clase> = {
                ...baseClase,
                id: classId2,
                instructorId: instructorIds[1],
                reservasTotales: splitReservas,
                lugares: splitLugares,
                reservasPagadas: Math.ceil((row["Reservas Pagadas"] || 0) / 2),
              }

              try {
                console.log(`Objeto de clase B a crear:`, logObject(clase2))
                const claseCreada2 = await clasesApi.createClase(clase2 as Clase)
                console.log(`Clase B creada exitosamente, ID: ${claseCreada2.id}`)
                clasesCreadas++

                // Add detailed log for successful class creation
                addDetailedLog("success", `Clase B creada exitosamente, ID: ${claseCreada2.id}`, {
                  instructor: instructorIds[1],
                  disciplina: disciplina.nombre,
                  fecha: fechaObj,
                  hora,
                  estudio: row.Estudio || "",
                  reservas: splitReservas,
                  lugares: splitLugares,
                })
              } catch (error) {
                console.error(`Error al crear clase B:`, error)
                console.error(`JSON enviado a crearClase (clase B):`, JSON.stringify(clase2, null, 2))
                errores.push({
                  fila: i + 1,
                  mensaje: `Error al crear clase B: ${error instanceof Error ? error.message : "Error desconocido"}. JSON enviado: ${formatErrorJson(clase2)}`,
                })
                registrosConError++

                // Add detailed log for error
                addDetailedLog(
                  "error",
                  `Error al crear clase B: ${error instanceof Error ? error.message : "Error desconocido"}`,
                  {
                    instructor: instructorIds[1],
                    disciplina: disciplina.nombre,
                    fecha: fechaObj,
                    hora,
                    estudio: row.Estudio || "",
                    error: error instanceof Error ? error.message : "Error desconocido",
                    data: clase2,
                  },
                )
              }
            }

            // If neither instructor is kept, skip this class
            if (!keepInstructor1 && !keepInstructor2) {
              console.log(`Ambos instructores descartados para ${row.Instructor}, saltando clase`)
            }
          } else {
            // Regular class creation (non-VS instructor)
            const fechaConHora = combinarFechaHora(fechaObj, hora)
            const nuevaClase: Partial<Clase> = {
              id: row.ID_clase ? String(row.ID_clase) : undefined, // Usar ID del Excel como string
              periodoId: periodoSeleccionadoId,
              disciplinaId: disciplina.id,
              instructorId: instructorIds[0],
              pais: row.País || "México",
              ciudad: row.Ciudad || "Ciudad de México",
              estudio: row.Estudio || "",
              salon: row.Salon || "",
              fecha: fechaConHora,
              reservasTotales: row["Reservas Totales"] || 0,
              listasEspera: row["Listas de Espera"] || 0,
              cortesias: row.Cortesias || 0,
              lugares: Number(row.Lugares || 0),
              reservasPagadas: row["Reservas Pagadas"] || 0,
              textoEspecial: row["Texto espcial"] || "",
              semana: weekNumber,
            }

            console.log(`Objeto de clase a crear:`, logObject(nuevaClase))

            // Also add detailed logging for regular class creation
            // Find the section for regular class creation and add:
            try {
              let claseCreada
              if (nuevaClase.id) {
                console.log(`Usando ID de clase del Excel: ${nuevaClase.id}`)
                // Intentar crear con el ID específico
                claseCreada = await clasesApi.createClase(nuevaClase as Clase)
              } else {
                // Si no hay ID, crear con ID autogenerado
                claseCreada = await clasesApi.createClase(nuevaClase as Clase)
              }
              console.log(`Clase creada exitosamente, ID: ${claseCreada.id}`)
              clasesCreadas++

              // Add detailed log for successful class creation
              addDetailedLog("success", `Clase creada exitosamente, ID: ${claseCreada.id}`, {
                instructor: instructorIds[0],
                disciplina: disciplina.nombre,
                fecha: fechaObj,
                hora,
                estudio: row.Estudio || "",
                reservas: row["Reservas Totales"] || 0,
                lugares: Number(row.Lugares || 0),
              })
            } catch (error) {
              // Mejorar el log de errores para incluir el JSON completo
              console.error(`Error al crear clase:`, error)
              console.error(`JSON enviado a crearClase:`, JSON.stringify(nuevaClase, null, 2))
              errores.push({
                fila: i + 1,
                mensaje: `Error al crear clase: ${error instanceof Error ? error.message : "Error desconocido"}. JSON enviado: ${formatErrorJson(nuevaClase)}`,
              })
              registrosConError++

              // Add detailed log for error
              addDetailedLog(
                "error",
                `Error al crear clase: ${error instanceof Error ? error.message : "Error desconocido"}`,
                {
                  instructor: instructorIds[0],
                  disciplina: disciplina.nombre,
                  fecha: fechaObj,
                  hora,
                  estudio: row.Estudio || "",
                  error: error instanceof Error ? error.message : "Error desconocido",
                  data: nuevaClase,
                },
              )
            }
          }
        } catch (error) {
          console.error(`Error general al procesar fila ${i + 1}:`, error)
          errores.push({
            fila: i + 1,
            mensaje: error instanceof Error ? error.message : "Error desconocido",
          })
          registrosConError++
        }
      }

      setProgress(100)
      setStatusMessage("Importación completada con éxito")
      console.log("=== PROCESO DE IMPORTACIÓN COMPLETADO ===")
      console.log(`Clases creadas: ${clasesCreadas}`)
      console.log(`Instructores creados: ${instructoresCreados}`)
      console.log(`Registros con error: ${registrosConError}`)

      // Preparar resultado
      const resultadoImportacion: ResultadoImportacion = {
        totalRegistros: processedData.length,
        registrosImportados: clasesCreadas,
        registrosConError,
        errores,
        clasesCreadas,
        clasesEliminadas,
        instructoresCreados,
        pagosCreados: 0, // Ya no se crean pagos
        pagosActualizados: 0, // Ya no se actualizan pagos
      }

      setResultado(resultadoImportacion)

      toast({
        title: "Importación completada",
        description: `Se importaron ${clasesCreadas} de ${processedData.length} registros. Se crearon ${instructoresCreados} instructores nuevos.`,
      })
    } catch (error) {
      console.error("Error general en la importación:", error)
      setError(error instanceof Error ? error.message : "Error desconocido durante la importación")

      // Añadir más detalles sobre el error
      if (error instanceof Error) {
        console.error("Detalles del error:", {
          mensaje: error.message,
          stack: error.stack,
          nombre: error.name,
        })

        // Si es un error de red o API, intentar obtener más información
        if (error.name === "TypeError" && error.message.includes("fetch")) {
          console.error("Posible error de red o API. Verifique la conexión y los endpoints.")
        }
      }

      toast({
        title: "Error en la importación",
        description:
          error instanceof Error
            ? `${error.message}. Revise la consola para más detalles.`
            : "Error desconocido durante la importación. Revise la consola para más detalles.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  // VS instructors handling
  const toggleKeepVsInstructor = (originalName: string, instructorNumber: 1 | 2) => {
    setVsInstructors((prev) =>
      prev.map((instructor) => {
        if (instructor.originalName === originalName) {
          if (instructorNumber === 1) {
            return { ...instructor, keepInstructor1: !instructor.keepInstructor1 }
          } else {
            return { ...instructor, keepInstructor2: !instructor.keepInstructor2 }
          }
        }
        return instructor
      }),
    )
  }

  // Pagination
  const totalPages = parsedData ? Math.ceil(parsedData.length / rowsPerPage) : 0
  const paginatedData = parsedData ? parsedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage) : []

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(Number.parseInt(value))
    setCurrentPage(1)
  }

  // Formatting functions
  const formatDateTime = (value: any): string => {
    if (!value) return "-"

    try {
      if (typeof value === "object" && value !== null && typeof value.getMonth === "function") {
        return format(value, "yyyy-MM-dd", { locale: es })
      }

      if (typeof value === "string") {
        // Check if it's already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return value
        }

        // Try to parse as date
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          return format(date, "yyyy-MM-dd", { locale: es })
        }
      }

      return String(value)
    } catch (error) {
      return String(value)
    }
  }

  const formatTime = (value: any): string => {
    if (!value) return "-"

    try {
      if (typeof value === "string") {
        // If it's already in HH:MM format, return it
        if (/^\d{2}:\d{2}$/.test(value)) {
          return value
        }

        // If it's a time string with seconds, remove seconds
        if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
          return value.substring(0, 5)
        }
      }

      if (typeof value === "object" && value !== null && typeof value.getHours === "function") {
        return format(value, "HH:mm", { locale: es })
      }

      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return format(date, "HH:mm", { locale: es })
      }

      // If it's a number like 600 for 6:00
      if (typeof value === "number") {
        const hours = Math.floor(value / 100)
          .toString()
          .padStart(2, "0")
        const minutes = (value % 100).toString().padStart(2, "0")
        return `${hours}:${minutes}`
      }

      return String(value)
    } catch (error) {
      return String(value)
    }
  }

  // Column definitions
  const getMainColumns = () => {
    return [
      { key: "ID_clase", label: "ID", format: (value: any) => String(value || "") },
      { key: "Día", label: "Fecha", format: formatDateTime },
      { key: "Hora", label: "Hora", format: formatTime },
      { key: "Instructor", label: "Instructor", format: (value: any) => String(value || "") },
      { key: "Disciplina", label: "Disciplina", format: (value: any) => String(value || "") },
      { key: "Estudio", label: "Estudio", format: (value: any) => String(value || "") },
      { key: "Reservas Totales", label: "Reservas", format: (value: any) => String(value || "0") },
      { key: "Lugares", label: "Capacidad", format: (value: any) => String(value || "0") },
    ]
  }

  const getAdditionalColumns = () => {
    return [
      { key: "Listas de Espera", label: "Lista Espera", format: (value: any) => String(value || "0") },
      { key: "Cortesias", label: "Cortesías", format: (value: any) => String(value || "0") },
      { key: "Reservas Pagadas", label: "Reservas Pagadas", format: (value: any) => String(value || "0") },
      { key: "País", label: "País", format: (value: any) => String(value || "") },
      { key: "Ciudad", label: "Ciudad", format: (value: any) => String(value || "") },
      { key: "Salon", label: "Salón", format: (value: any) => String(value || "") },
      { key: "Texto espcial", label: "Texto Especial", format: (value: any) => String(value || "") },
      { key: "Es cover", label: "Es Cover", format: (value: any) => String(value || "") },
      { key: "Fitpass Bloqueadas (bot)", label: "Fitpass Bloqueadas", format: (value: any) => String(value || "0") },
      { key: "Fitpass Fantasmas", label: "Fitpass Fantasmas", format: (value: any) => String(value || "0") },
      { key: "Gympass Pagadas", label: "Gympass Pagadas", format: (value: any) => String(value || "0") },
      { key: "Classpass Pagadas", label: "Classpass Pagadas", format: (value: any) => String(value || "0") },
    ]
  }

  // Add detailedLogging and detailedLogs to the return object
  return {
    file,
    setFile,
    parsedData,
    setParsedData,
    selectedWeek,
    setSelectedWeek,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    showAllColumns,
    setShowAllColumns,
    currentStep,
    setCurrentStep,
    isInitialLoading,
    isImporting,
    progress,
    resultado,
    error,
    statusMessage,
    instructorAnalysis,
    disciplineAnalysis,
    vsInstructors,
    periodoSeleccionadoId,
    setPeriodoSeleccionadoId,
    paginatedData,
    totalPages,
    handleFileChange,
    handlePrevPage,
    handleNextPage,
    handleRowsPerPageChange,
    toggleKeepVsInstructor,
    handleDisciplineMapping,
    handleSubmit,
    formatDateTime,
    formatTime,
    getMainColumns,
    getAdditionalColumns,
    detailedLogging,
    setDetailedLogging,
    detailedLogs,
  }
}
