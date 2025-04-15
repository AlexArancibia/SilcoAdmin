"use client"
import { hash } from "bcryptjs"
import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import {
  FileSpreadsheet,
  Upload,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  UserCheck,
  UserX,
  BookOpen,
  Loader2,
  CheckCircle2,
  FileText,
} from "lucide-react"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DatosExcelClase, ResultadoImportacion, ErrorImportacion } from "@/types/importacion"
import * as XLSX from "xlsx"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import type { Instructor, Disciplina, Periodo, Clase } from "@/types/schema"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { clasesApi } from "@/lib/api/clases-api"
import { instructoresApi } from "@/lib/api/instructores-api"
import { usePagosStore } from "@/store/usePagosStore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

import { useFormulasStore } from "@/store/useFormulaStore"

export function ExcelImport() {
  // Función para obtener el nombre del periodo
  const getNombrePeriodo = (periodo: Periodo): string => {
    return `Periodo ${periodo.numero} - ${periodo.año}`
  }

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

  // Add a new state for status messages
  const [statusMessage, setStatusMessage] = useState<string>("")

  // Inicializar estados con valores por defecto
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

  // Modify the VS instructors state to include options for keeping/discarding instructors
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

  // Obtener datos de los stores
  const { periodos, periodoActual, fetchPeriodos, isLoading: isLoadingPeriodos } = usePeriodosStore()

  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()
  const { formulas, fetchFormulas } = useFormulasStore()
  const { instructores, fetchInstructores, isLoading: isLoadingInstructores } = useInstructoresStore()

  // Obtener el store de pagos
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

          // Procesar los datos para asegurar que los campos críticos estén en el formato correcto
          const jsonData = rawData.map((row: any) => {
            // Asegurarse de que todos los campos necesarios existan
            const processedRow: any = { ...row }

            // Convertir explícitamente la hora a string si es necesario
            if (processedRow.Hora && typeof processedRow.Hora !== "string") {
              if (processedRow.Hora instanceof Date) {
                // Formatear como HH:MM
                const hours = processedRow.Hora.getHours().toString().padStart(2, "0")
                const minutes = processedRow.Hora.getMinutes().toString().padStart(2, "0")
                processedRow.Hora = `${hours}:${minutes}`
              } else {
                // Intentar convertir a string
                processedRow.Hora = String(processedRow.Hora)
              }
            }

            // Asegurarse de que los campos numéricos sean números
            const numericFields = [
              "ID_clase",
              "Reservas Totales",
              "Listas de Espera",
              "Cortesias",
              "Lugares",
              "Reservas Pagadas",
              "Fitpass Bloqueadas (bot)",
              "Fitpass Fantasmas",
              "Fitpass Reserved",
              "Gympass Late Cancel",
              "Gympass Pagadas",
              "Classpass Late Cancel",
              "Classpass Pagadas",
              "Ecosinvisibles",
              "PR Bloqueadas",
            ]

            numericFields.forEach((field) => {
              if (field in processedRow) {
                if (typeof processedRow[field] === "string") {
                  // Si es una cadena vacía o un espacio, convertir a 0
                  if (processedRow[field].trim() === "") {
                    processedRow[field] = 0
                  } else {
                    // Intentar convertir a número
                    const num = Number(processedRow[field])
                    processedRow[field] = isNaN(num) ? 0 : num
                  }
                } else if (processedRow[field] === null || processedRow[field] === undefined) {
                  processedRow[field] = 0
                }
              } else {
                // Si el campo no existe, inicializarlo a 0
                processedRow[field] = 0
              }
            })

            return processedRow as DatosExcelClase
          })

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

  // Modify the analyzeInstructors function to detect "vs" in instructor names
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

      // Check if instructor name contains "vs" or "VS"
      if (instructor.toLowerCase().includes(" vs ")) {
        const parts = instructor.split(/\s+vs\s+/i)
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

  const resetState = () => {
    setIsImporting(false)
    setProgress(0)
    setResultado(null)
    setError(null)
    setPagosCreados(0)
    setStatusMessage("")
  }

  // Función para crear un instructor y devolver su ID
  const logObject = (obj: any) => {
    return JSON.stringify(obj, null, 2)
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

  // Modify the createInstructor function to include default values for the new fields
  const createInstructor = async (nombre: string, disciplinaIds?: number[]): Promise<number> => {
    // Check if the name contains "vs" - if so, don't create the instructor
    if (nombre.toLowerCase().includes(" vs ")) {
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
        cumpleLineamientos: false, // Valor por defecto
        dobleteos: 0, // Valor por defecto
        horariosNoPrime: 0, // Valor por defecto
        participacionEventos: false, // Valor por defecto
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

  // Modify the handleSubmit function to remove payment creation
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
          const isVsInstructor = row.Instructor.toLowerCase().includes(" vs ")
          const instructorIds: number[] = []

          // Modify the section in handleSubmit where VS instructors are processed
          if (isVsInstructor) {
            // Split the instructor name
            const parts = row.Instructor.split(/\s+vs\s+/i)
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
                  if (instructor1Name.toLowerCase().includes(" vs ")) {
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
                  if (instructor2Name.toLowerCase().includes(" vs ")) {
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

          // Convertir fecha
          let fecha: Date
          console.log(`Procesando fecha: ${row.Día} (tipo: ${typeof row.Día})`)
          if (row.Día instanceof Date) {
            fecha = row.Día
            console.log(`Fecha es instancia de Date: ${fecha.toISOString()}`)
          } else if (typeof row.Día === "string") {
            // Intentar diferentes formatos de fecha
            try {
              // Primero intentar con el formato YYYY-MM-DD
              fecha = new Date(row.Día)
              if (isNaN(fecha.getTime())) {
                // Si falla, intentar con formato DD/MM/YYYY
                const parts = row.Día.split("/")
                if (parts.length === 3) {
                  fecha = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
                }
              }
              console.log(`Fecha convertida: ${fecha.toISOString()}`)
            } catch (error) {
              console.error(`Error al procesar fecha: ${row.Día}`, error)
              errores.push({
                fila: i + 1,
                mensaje: `Formato de fecha inválido: "${row.Día}"`,
              })
              registrosConError++
              continue
            }

            if (isNaN(fecha.getTime())) {
              console.error(`Formato de fecha inválido: "${row.Día}"`)
              errores.push({
                fila: i + 1,
                mensaje: `Formato de fecha inválido: "${row.Día}"`,
              })
              registrosConError++
              continue
            }
          } else {
            console.error(`Tipo de fecha no soportado: ${typeof row.Día}`)
            errores.push({
              fila: i + 1,
              mensaje: `Tipo de fecha no soportado: ${typeof row.Día}`,
            })
            registrosConError++
            continue
          }

          // For VS instructors, create two classes with split reservations
          // Modify the section in handleSubmit where VS instructors are processed
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

            // Create base class object
            const baseClase: Partial<Clase> = {
              periodoId: periodoSeleccionadoId,
              disciplinaId: disciplina.id,
              pais: row.País || "México",
              ciudad: row.Ciudad || "Ciudad de México",
              estudio: row.Estudio || "",
              salon: row.Salon || "",
              fecha: fecha,
              listasEspera: row["Listas de Espera"] || 0,
              cortesias: row.Cortesias || 0,
              textoEspecial: row["Texto espcial"] || "",
              semana: weekNumber,
            }

            // Create first class if instructor1 should be kept
            if (keepInstructor1 && instructorIds.length > 0) {
              try {
                const clase1: Partial<Clase> = {
                  ...baseClase,
                  id: classId1,
                  instructorId: instructorIds[0],
                  reservasTotales: splitReservas,
                  lugares: splitLugares,
                  reservasPagadas: Math.ceil((row["Reservas Pagadas"] || 0) / 2),
                }

                console.log(`Objeto de clase A a crear:`, logObject(clase1))
                const claseCreada1 = await clasesApi.createClase(clase1 as Clase)
                console.log(`Clase A creada exitosamente, ID: ${claseCreada1.id}`)
                clasesCreadas++
              } catch (error) {
                console.error(`Error al crear clase A:`, error)
                errores.push({
                  fila: i + 1,
                  mensaje: `Error al crear clase A: ${error instanceof Error ? error.message : "Error desconocido"}`,
                })
                registrosConError++
              }
            }

            // Create second class if instructor2 should be kept
            if (keepInstructor2 && instructorIds.length > 1) {
              try {
                const clase2: Partial<Clase> = {
                  ...baseClase,
                  id: classId2,
                  instructorId: instructorIds[1],
                  reservasTotales: splitReservas,
                  lugares: splitLugares,
                  reservasPagadas: Math.ceil((row["Reservas Pagadas"] || 0) / 2),
                }

                console.log(`Objeto de clase B a crear:`, logObject(clase2))
                const claseCreada2 = await clasesApi.createClase(clase2 as Clase)
                console.log(`Clase B creada exitosamente, ID: ${claseCreada2.id}`)
                clasesCreadas++
              } catch (error) {
                console.error(`Error al crear clase B:`, error)
                errores.push({
                  fila: i + 1,
                  mensaje: `Error al crear clase B: ${error instanceof Error ? error.message : "Error desconocido"}`,
                })
                registrosConError++
              }
            }

            // If neither instructor is kept, skip this class
            if (!keepInstructor1 && !keepInstructor2) {
              console.log(`Ambos instructores descartados para ${row.Instructor}, saltando clase`)
            }
          } else {
            // Regular class creation (non-VS instructor)
            // Crear objeto de clase
            const nuevaClase: Partial<Clase> = {
              id: row.ID_clase ? String(row.ID_clase) : undefined, // Usar ID del Excel como string
              periodoId: periodoSeleccionadoId,
              disciplinaId: disciplina.id,
              instructorId: instructorIds[0],
              pais: row.País || "México",
              ciudad: row.Ciudad || "Ciudad de México",
              estudio: row.Estudio || "",
              salon: row.Salon || "",
              fecha: fecha,
              reservasTotales: row["Reservas Totales"] || 0,
              listasEspera: row["Listas de Espera"] || 0,
              cortesias: row.Cortesias || 0,
              lugares: Number(row.Lugares || 0),
              reservasPagadas: row["Reservas Pagadas"] || 0,
              textoEspecial: row["Texto espcial"] || "",
              semana: weekNumber,
            }

            console.log(`Objeto de clase a crear:`, logObject(nuevaClase))

            // Crear clase
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
            } catch (error) {
              console.error(`Error al crear clase:`, error)
              errores.push({
                fila: i + 1,
                mensaje: `Error al crear clase: ${error instanceof Error ? error.message : "Error desconocido"}`,
              })
              registrosConError++
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
      toast({
        title: "Error en la importación",
        description: error instanceof Error ? error.message : "Error desconocido durante la importación",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  // Add a function to toggle the keep status of VS instructors
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

  // Paginación
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

  // Formatear fecha y hora para la visualización
  const formatDateTime = (value: any): string => {
    if (!value) return "-"

    try {
      if (value instanceof Date) {
        return format(value, "dd/MM/yyyy", { locale: es })
      }

      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return format(date, "dd/MM/yyyy", { locale: es })
      }

      return String(value)
    } catch (error) {
      return String(value)
    }
  }

  const formatTime = (value: any): string => {
    if (!value) return "-"

    try {
      if (typeof value === "string" && value.includes(":")) {
        return value
      }

      if (value instanceof Date) {
        return format(value, "HH:mm", { locale: es })
      }

      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return format(date, "HH:mm", { locale: es })
      }

      // Si es un número como 600 para 6:00
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

  // Obtener las columnas principales y secundarias
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

  const mainColumns = getMainColumns()
  const additionalColumns = getAdditionalColumns()

  // Renderizar el paso actual
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      case 4:
        return renderStep4()
      default:
        return renderStep1()
    }
  }

  // Paso 1: Selección de archivo y periodo
  const renderStep1 = () => {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="periodo" className="text-sm font-medium mb-1.5 block">
              Periodo
            </Label>
            <Select
              value={periodoSeleccionadoId?.toString() || ""}
              onValueChange={(value) => setPeriodoSeleccionadoId(value ? Number.parseInt(value) : null)}
              disabled={isLoadingPeriodos}
            >
              <SelectTrigger id="periodo" className="w-full bg-background border-muted">
                <SelectValue placeholder={isLoadingPeriodos ? "Cargando periodos..." : "Seleccionar periodo"} />
              </SelectTrigger>
              <SelectContent>
                {periodos.length === 0 && !isLoadingPeriodos ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">No hay periodos disponibles</div>
                ) : (
                  periodos.map((periodo) => (
                    <SelectItem key={periodo.id} value={periodo.id.toString()}>
                      {getNombrePeriodo(periodo)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="semana" className="text-sm font-medium mb-1.5 block">
              Semana
            </Label>
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger id="semana" className="w-full bg-background border-muted">
                <SelectValue placeholder="Seleccionar semana" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Semana 1</SelectItem>
                <SelectItem value="2">Semana 2</SelectItem>
                <SelectItem value="3">Semana 3</SelectItem>
                <SelectItem value="4">Semana 4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4">
          <Label htmlFor="file" className="text-sm font-medium">
            Archivo Excel
          </Label>
          <div className="flex items-center gap-4">
            <Input id="file" type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
            <div className="grid w-full gap-2">
              <Label
                htmlFor="file"
                className="flex h-36 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/5 px-4 py-5 text-center transition-colors hover:bg-muted/10"
              >
                <FileSpreadsheet className="h-10 w-10 text-primary/60" />
                <div className="mt-3 text-base font-medium text-primary">
                  {file ? file.name : "Arrastra y suelta o haz clic para subir"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Solo archivos Excel (.xlsx, .xls)</div>
              </Label>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isInitialLoading && (
          <div className="flex items-center justify-center p-6 bg-muted/10 rounded-lg border border-muted">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span className="font-medium">Cargando datos necesarios...</span>
          </div>
        )}

        {parsedData && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-primary">Vista previa de datos</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllColumns(!showAllColumns)}
                  className="border-muted"
                >
                  {showAllColumns ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {showAllColumns ? "Mostrar menos columnas" : "Mostrar todas las columnas"}
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-lg p-4 overflow-x-auto border shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">
                  Se encontraron <span className="text-primary">{parsedData.length}</span> registros en el archivo.
                </p>
              </div>
              <div className="min-w-full overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      {mainColumns.map((column) => (
                        <th key={column.key} className="text-left py-2.5 px-3 font-medium text-primary">
                          {column.label}
                        </th>
                      ))}
                      {showAllColumns &&
                        additionalColumns.map((column) => (
                          <th key={column.key} className="text-left py-2.5 px-3 font-medium text-primary">
                            {column.label}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-muted/20 transition-colors">
                        {mainColumns.map((column) => (
                          <td key={column.key} className="py-2.5 px-3">
                            {column.key === "Día" ? (
                              <div className="flex items-center">
                                <Calendar className="h-3.5 w-3.5 mr-1.5 text-primary/60" />
                                {column.format
                                  ? column.format(row[column.key as keyof DatosExcelClase])
                                  : String(row[column.key as keyof DatosExcelClase] || "")}
                              </div>
                            ) : column.key === "Hora" ? (
                              <div className="flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-1.5 text-primary/60" />
                                {column.format
                                  ? column.format(row[column.key as keyof DatosExcelClase])
                                  : String(row[column.key as keyof DatosExcelClase] || "")}
                              </div>
                            ) : column.format ? (
                              column.format(row[column.key as keyof DatosExcelClase])
                            ) : (
                              String(row[column.key as keyof DatosExcelClase] || "")
                            )}
                          </td>
                        ))}
                        {showAllColumns &&
                          additionalColumns.map((column) => (
                            <td key={column.key} className="py-2.5 px-3">
                              {column.format
                                ? column.format(row[column.key as keyof DatosExcelClase])
                                : String(row[column.key as keyof DatosExcelClase] || "")}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="rows-per-page" className="text-xs">
                    Filas por página:
                  </Label>
                  <Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPageChange}>
                    <SelectTrigger id="rows-per-page" className="h-8 w-[70px] border-muted">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="h-8 w-8 border-muted"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 border-muted"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <Button
            onClick={() => setCurrentStep(2)}
            disabled={!parsedData || !periodoSeleccionadoId || !selectedWeek || isInitialLoading}
            className="bg-primary hover:bg-primary/90 transition-colors"
          >
            Continuar <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // Paso 2: Validación de instructores
  const renderStep2 = () => {
    if (isLoadingInstructores) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Cargando instructores...</span>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="bg-card rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-medium text-primary mb-4">Validación de Instructores</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-background p-5 rounded-lg border shadow-sm">
              <div className="text-sm text-muted-foreground mb-1">Total de Instructores</div>
              <div className="text-2xl font-bold text-primary">{instructorAnalysis.total}</div>
            </div>
            <div className="bg-background p-5 rounded-lg border shadow-sm">
              <div className="text-sm text-muted-foreground mb-1">Instructores Existentes</div>
              <div className="text-2xl font-bold text-green-600">{instructorAnalysis.existing}</div>
            </div>
            <div className="bg-background p-5 rounded-lg border shadow-sm">
              <div className="text-sm text-muted-foreground mb-1">Instructores Nuevos</div>
              <div className="text-2xl font-bold text-blue-600">{instructorAnalysis.new}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-primary">Detalle de Instructores</h4>
              <div className="text-sm text-muted-foreground">
                Se crearán automáticamente los instructores que no existan
              </div>
            </div>

            <div className="bg-background rounded-lg border overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium text-primary">Instructor</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">Clases</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">Información</th>
                  </tr>
                </thead>
                <tbody>
                  {instructorAnalysis.instructors.map((instructor, index) => (
                    <tr key={index} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-medium">{instructor.name}</td>
                      <td className="py-3 px-4">
                        {instructor.exists ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 flex items-center w-fit px-2 py-0.5"
                          >
                            <UserCheck className="h-3 w-3 mr-1.5" />
                            Existente
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200 flex items-center w-fit px-2 py-0.5"
                          >
                            <UserX className="h-3 w-3 mr-1.5" />
                            Nuevo
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">{instructor.count}</td>
                      <td className="py-3 px-4">
                        {instructor.matchedInstructor && (
                          <div className="text-xs text-muted-foreground">
                            <div>
                              ID: <span className="font-medium">{instructor.matchedInstructor.id}</span>
                            </div>
                            {instructor.matchedInstructor.extrainfo?.telefono && (
                              <div>
                                Teléfono:{" "}
                                <span className="font-medium">{instructor.matchedInstructor.extrainfo.telefono}</span>
                              </div>
                            )}
                            {instructor.matchedInstructor.extrainfo?.especialidad && (
                              <div>
                                Especialidad:{" "}
                                <span className="font-medium">
                                  {instructor.matchedInstructor.extrainfo.especialidad}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {vsInstructors.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-primary">Instructores con VS detectados</h4>
              <div className="text-sm text-muted-foreground">Selecciona qué instructores mantener en cada par VS</div>
            </div>

            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Atención: Instructores VS detectados</AlertTitle>
              <AlertDescription className="text-amber-700">
                Se han detectado {vsInstructors.length} instructores con formato "VS". Puedes elegir qué instructores
                mantener en cada par. Si un instructor es invitado y no pertenece a la organización, puedes desmarcarlo.
              </AlertDescription>
            </Alert>

            <div className="bg-background rounded-lg border overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium text-primary">Nombre Original</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">Instructor 1</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">Instructor 2</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">Clases</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {vsInstructors.map((instructor, index) => (
                    <tr key={index} className="border-b hover:bg-amber-50 transition-colors">
                      <td className="py-3 px-4 font-medium">{instructor.originalName}</td>
                      <td className="py-3 px-4">{instructor.instructor1}</td>
                      <td className="py-3 px-4">{instructor.instructor2}</td>
                      <td className="py-3 px-4">{instructor.count}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`keep-instructor1-${index}`}
                              checked={instructor.keepInstructor1}
                              onChange={() => toggleKeepVsInstructor(instructor.originalName, 1)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor={`keep-instructor1-${index}`} className="text-xs">
                              Mantener instructor 1
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`keep-instructor2-${index}`}
                              checked={instructor.keepInstructor2}
                              onChange={() => toggleKeepVsInstructor(instructor.originalName, 2)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor={`keep-instructor2-${index}`} className="text-xs">
                              Mantener instructor 2
                            </label>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => setCurrentStep(1)} className="border-muted">
            <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
          </Button>
          <Button onClick={() => setCurrentStep(3)} className="bg-primary hover:bg-primary/90 transition-colors">
            Continuar <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // Paso 3: Validación de disciplinas
  const renderStep3 = () => {
    if (isLoadingDisciplinas) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Cargando disciplinas...</span>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="bg-card rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-medium text-primary mb-4">Validación de Disciplinas</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-background p-5 rounded-lg border shadow-sm">
              <div className="text-sm text-muted-foreground mb-1">Total de Disciplinas</div>
              <div className="text-2xl font-bold text-primary">{disciplineAnalysis.total}</div>
            </div>
            <div className="bg-background p-5 rounded-lg border shadow-sm">
              <div className="text-sm text-muted-foreground mb-1">Disciplinas Existentes</div>
              <div className="text-2xl font-bold text-green-600">{disciplineAnalysis.existing}</div>
            </div>
            <div className="bg-background p-5 rounded-lg border shadow-sm">
              <div className="text-sm text-muted-foreground mb-1">Disciplinas Nuevas</div>
              <div className="text-2xl font-bold text-blue-600">{disciplineAnalysis.new}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-primary">Detalle de Disciplinas</h4>
              <div className="text-sm text-muted-foreground">
                Puedes mapear disciplinas nuevas a existentes o crearlas automáticamente
              </div>
            </div>

            <div className="bg-background rounded-lg border overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium text-primary">Disciplina</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">Clases</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {disciplineAnalysis.disciplines.map((discipline, index) => (
                    <tr key={index} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-medium">
                        {discipline.name}
                        {discipline.mappedTo && (
                          <span className="text-primary ml-2 flex items-center gap-1 text-xs">
                            <ArrowRight className="h-3 w-3" />
                            <span className="font-medium">{discipline.mappedTo}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {discipline.exists ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 flex items-center w-fit px-2 py-0.5"
                          >
                            <BookOpen className="h-3 w-3 mr-1.5" />
                            Existente
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200 flex items-center w-fit px-2 py-0.5"
                          >
                            <BookOpen className="h-3 w-3 mr-1.5" />
                            Nueva
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">{discipline.count}</td>
                      <td className="py-3 px-4">
                        {!discipline.exists && (
                          <Select onValueChange={(value) => handleDisciplineMapping(discipline.name, value)}>
                            <SelectTrigger className="h-9 w-[180px] border-muted">
                              <SelectValue placeholder="Mapear a..." />
                            </SelectTrigger>
                            <SelectContent>
                              {disciplinas.map((d) => (
                                <SelectItem key={d.id} value={d.nombre}>
                                  {d.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => setCurrentStep(2)} className="border-muted">
            <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
          </Button>
          <Button onClick={() => setCurrentStep(4)} className="bg-primary hover:bg-primary/90 transition-colors">
            Continuar <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // Paso 4: Resumen y confirmación
  const renderStep4 = () => {
    return (
      <div className="space-y-6">
        <div className="bg-card rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-medium text-primary mb-4">Resumen de Importación</h3>

          <div className="space-y-4">
            <div className="bg-background p-5 rounded-lg border shadow-sm">
              <h4 className="font-medium text-primary mb-3">Información General</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-sm font-medium text-muted-foreground">Periodo:</div>
                <div className="text-sm">
                  {periodos.find((p) => p.id === periodoSeleccionadoId)
                    ? getNombrePeriodo(periodos.find((p) => p.id === periodoSeleccionadoId)!)
                    : "No seleccionado"}
                </div>
                <div className="text-sm font-medium text-muted-foreground">Semana:</div>
                <div className="text-sm">Semana {selectedWeek}</div>
                <div className="text-sm font-medium text-muted-foreground">Archivo:</div>
                <div className="text-sm">{file?.name}</div>
                <div className="text-sm font-medium text-muted-foreground">Total de registros:</div>
                <div className="text-sm">{parsedData?.length || 0}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-background p-5 rounded-lg border shadow-sm">
                <h4 className="font-medium text-primary mb-3">Instructores</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-sm font-medium text-muted-foreground">Total de instructores:</div>
                  <div className="text-sm">{instructorAnalysis.total}</div>
                  <div className="text-sm font-medium text-muted-foreground">Instructores existentes:</div>
                  <div className="text-sm text-green-600 font-medium">{instructorAnalysis.existing}</div>
                  <div className="text-sm font-medium text-muted-foreground">Instructores nuevos:</div>
                  <div className="text-sm text-blue-600 font-medium">{instructorAnalysis.new}</div>
                </div>
              </div>

              <div className="bg-background p-5 rounded-lg border shadow-sm">
                <h4 className="font-medium text-primary mb-3">Disciplinas</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-sm font-medium text-muted-foreground">Total de disciplinas:</div>
                  <div className="text-sm">{disciplineAnalysis.total}</div>
                  <div className="text-sm font-medium text-muted-foreground">Disciplinas existentes:</div>
                  <div className="text-sm text-green-600 font-medium">{disciplineAnalysis.existing}</div>
                  <div className="text-sm font-medium text-muted-foreground">Disciplinas nuevas:</div>
                  <div className="text-sm text-blue-600 font-medium">{disciplineAnalysis.new}</div>
                  <div className="text-sm font-medium text-muted-foreground">Disciplinas mapeadas:</div>
                  <div className="text-sm text-purple-600 font-medium">
                    {disciplineAnalysis.disciplines.filter((d) => d.mappedTo).length}
                  </div>
                </div>
              </div>
            </div>

            {disciplineAnalysis.disciplines.some((d) => d.mappedTo) && (
              <div className="bg-background p-5 rounded-lg border shadow-sm">
                <h4 className="font-medium text-primary mb-3">Mapeos de Disciplinas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {disciplineAnalysis.disciplines
                    .filter((d) => d.mappedTo)
                    .map((d, index) => (
                      <div key={index} className="text-sm flex items-center gap-2 bg-muted/20 p-2 rounded-md">
                        <span className="font-medium">{d.name}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-primary/60" />
                        <span className="text-primary">{d.mappedTo}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {isImporting && (
          <div className="grid gap-2 bg-background p-5 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Procesando archivo...</Label>
              <span className="text-sm text-primary font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            {isImporting && statusMessage && (
              <div className="mt-2 text-sm text-center font-medium text-primary">{statusMessage}</div>
            )}
          </div>
        )}

        {resultado && (
          <Alert className="bg-primary/10 text-primary border-primary/30 rounded-lg">
            <CheckCircle2 className="h-5 w-5" />
            <AlertTitle>Importación completada</AlertTitle>
            <AlertDescription>
              Se importaron {resultado.registrosImportados} de {resultado.totalRegistros} registros.
            </AlertDescription>
          </Alert>
        )}

        {resultado && (
          <div className="space-y-4 mt-4">
            <h3 className="text-lg font-medium text-primary">Resultado de la importación</h3>

            <Tabs defaultValue="resumen" className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="resumen">Resumen</TabsTrigger>
                <TabsTrigger value="errores">Errores ({resultado.errores.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="resumen" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-card p-4 rounded-lg border shadow-sm">
                    <div className="text-sm text-muted-foreground">Total registros</div>
                    <div className="text-2xl font-bold text-primary">{resultado.totalRegistros}</div>
                  </div>
                  <div className="bg-card p-4 rounded-lg border shadow-sm">
                    <div className="text-sm text-muted-foreground">Importados</div>
                    <div className="text-2xl font-bold text-green-600">{resultado.registrosImportados}</div>
                  </div>
                  <div className="bg-card p-4 rounded-lg border shadow-sm">
                    <div className="text-sm text-muted-foreground">Con errores</div>
                    <div className="text-2xl font-bold text-red-600">{resultado.registrosConError}</div>
                  </div>
                  <div className="bg-card p-4 rounded-lg border shadow-sm">
                    <div className="text-sm text-muted-foreground">Clases creadas</div>
                    <div className="text-2xl font-bold text-blue-600">{resultado.clasesCreadas}</div>
                  </div>
                </div>

                {/* Mostrar información sobre clases eliminadas, instructores creados y pagos creados */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {resultado.clasesEliminadas !== undefined && (
                    <div className="bg-card p-4 rounded-lg border shadow-sm">
                      <div className="text-sm text-muted-foreground">Clases eliminadas previamente</div>
                      <div className="text-2xl font-bold text-amber-600">{resultado.clasesEliminadas}</div>
                    </div>
                  )}
                  {resultado.instructoresCreados !== undefined && (
                    <div className="bg-card p-4 rounded-lg border shadow-sm">
                      <div className="text-sm text-muted-foreground">Instructores nuevos creados</div>
                      <div className="text-2xl font-bold text-purple-600">{resultado.instructoresCreados}</div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="errores">
                {resultado.errores.length > 0 ? (
                  <div className="bg-card rounded-lg p-4 border shadow-sm max-h-80 overflow-y-auto">
                    <ul className="space-y-2">
                      {resultado.errores.map((error, index) => (
                        <li
                          key={index}
                          className="text-sm bg-destructive/5 p-3 rounded-md border border-destructive/20"
                        >
                          <span className="font-medium text-destructive">Fila {error.fila}:</span> {error.mensaje}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-card rounded-lg p-6 border shadow-sm text-center">
                    <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                    <p className="text-lg font-medium">¡No se encontraron errores!</p>
                    <p className="text-sm text-muted-foreground mt-1">La importación se completó sin problemas.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => setCurrentStep(3)} className="border-muted">
            <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isImporting || !!resultado}
            className={`${isImporting ? "bg-primary/80" : resultado ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"} transition-colors`}
          >
            {isImporting ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </div>
            ) : resultado ? (
              <div className="flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Importación Completada
              </div>
            ) : (
              <div className="flex items-center">
                <Upload className="mr-2 h-4 w-4" />
                Confirmar Importación
              </div>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Renderizar el indicador de progreso
  const renderProgressIndicator = () => {
    return (
      <div className="mb-8">
        <div className="flex justify-between">
          {[
            { step: 1, label: "Archivo y Periodo", icon: FileText },
            { step: 2, label: "Instructores", icon: UserCheck },
            { step: 3, label: "Disciplinas", icon: BookOpen },
            { step: 4, label: "Confirmación", icon: CheckCircle2 },
          ].map((item) => (
            <div
              key={item.step}
              className={`flex flex-col items-center ${
                currentStep >= item.step ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                  currentStep >= item.step
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
              </div>
              <div className="text-xs font-medium">{item.label}</div>
            </div>
          ))}
        </div>
        <div className="relative mt-3">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-muted rounded-full"></div>
          <div
            className="absolute top-0 left-0 h-1.5 bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          ></div>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full border shadow-sm">
      <CardHeader className="bg-muted/20 border-b">
        <CardTitle className="text-primary flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Importar Datos de Excel
        </CardTitle>
        <CardDescription>
          Sigue los pasos para importar datos de clases para el periodo y semana seleccionados.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {renderProgressIndicator()}
        {renderStep()}
      </CardContent>
    </Card>
  )
}

function obtenerDiaSemana(fecha: Date): string {
  const diasSemana = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"]
  return diasSemana[fecha.getDay()]
}
