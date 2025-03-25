"use client"
import { hash } from "bcrypt"
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
import { Instructor, Disciplina, Periodo, Clase, EstadoPago } from "@/types/schema"
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
  }>
}

// Asegurarnos de importar la función evaluarFormula
import { evaluarFormula } from "@/lib/formula-evaluator"

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

  // Obtener datos de los stores
  const {
    periodos,
    periodoSeleccionadoId,
    setPeriodoSeleccionado,
    fetchPeriodos,
    isLoading: isLoadingPeriodos,
  } = usePeriodosStore()

  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()

  const { instructores, fetchInstructores, isLoading: isLoadingInstructores } = useInstructoresStore()

  // Obtener el store de pagos
  const { pagos, actualizarPago, fetchPagos, crearPago } = usePagosStore()

  // Cargar datos iniciales si están vacíos
  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true)

      const promises = []

      if (periodos.length === 0) {
        promises.push(fetchPeriodos())
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
  }, [periodos.length, disciplinas.length, instructores.length, fetchPeriodos, fetchDisciplinas, fetchInstructores])

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

  const analyzeInstructors = (data: DatosExcelClase[]) => {
    // Obtener todos los instructores únicos del archivo
    const instructorCounts: Record<string, number> = {}
    const instructorInfo: Record<string, { count: number; disciplines: Set<string> }> = {}
    data.forEach((row) => {
      const instructor = row.Instructor
      const discipline = row.Disciplina

      if (!instructorInfo[instructor]) {
        instructorInfo[instructor] = {
          count: 0,
          disciplines: new Set<string>(),
        }
      }

      instructorInfo[instructor].count += 1
      instructorInfo[instructor].disciplines.add(discipline)
    })

    // Filtrar solo instructores activos
    const activeInstructores = instructores.filter(
      (i) => i.extrainfo?.estado === "ACTIVO" || i.extrainfo?.activo === true || i.extrainfo?.activo === undefined,
    )

    // Crear el análisis
    const instructorsAnalysis = Object.keys(instructorCounts).map((name) => {
      // Buscar si existe un instructor con este nombre
      const matchedInstructor = activeInstructores.find((i) => i.nombre.toLowerCase() === name.toLowerCase())

      return {
        name,
        exists: !!matchedInstructor,
        count: instructorCounts[name],
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
  }

  // Función para crear un instructor y devolver su ID
  // Modificar la función createInstructor para agregar logs
  const logObject = (obj: any) => {
    return JSON.stringify(obj, null, 2)
  }



const createInstructor = async (nombre: string): Promise<number> => {
  console.log(`Intentando crear instructor: ${nombre}`)
  try {
    // Generar una contraseña basada en el nombre y su longitud
    const rawPassword = `${nombre}@${nombre.length * 3}`

    // Hashear la contraseña antes de enviarla
    const hashedPassword = await hash(rawPassword, 10)

    // Crear el instructor directamente usando la API
    const nuevoInstructor = await instructoresApi.crearInstructor({
      nombre,
      extrainfo: {
        estado: "ACTIVO",
        activo: true,
        especialidad: "",
        password: hashedPassword, // Guardar la contraseña hasheada
      },
    })

    console.log(`Instructor creado exitosamente: ${nombre}, ID: ${nuevoInstructor.id}`)
    return nuevoInstructor.id
  } catch (error) {
    console.error(`Error al crear instructor ${nombre}:`, error)
    throw error
  }
}

  // Función para crear un pago para un instructor en un periodo
  // Modificar la función crearPagoParaInstructor para calcular el monto basado en las clases
  // Modify the crearPagoParaInstructor function to add more console logs
  // Corregir template literals en toda la función y ajustar lógica de actualización
const crearPagoParaInstructor = async (
  instructorId: number,
  periodoId: number,
  pagosExistentes: Record<string, boolean>,
): Promise<boolean> => {
  const pagoKey = `${instructorId}-${periodoId}`; // Usar backticks

  console.log(`=== INICIANDO CREACIÓN/ACTUALIZACIÓN DE PAGO PARA INSTRUCTOR ID ${instructorId} ===`);
  console.log(`Periodo ID: ${periodoId}, Clave de pago: ${pagoKey}`);
  console.log(`Pago existente: ${pagosExistentes[pagoKey] ? "Sí" : "No"}`);

  try {
    const clasesInstructor = await clasesApi.getClases({ instructorId, periodoId });
    console.log(`Encontradas ${clasesInstructor.length} clases para el instructor ID ${instructorId}`);

    if (clasesInstructor.length === 0) {
      console.log(`No hay clases para el instructor ID ${instructorId}`);
      return false;
    }

    let montoTotal = 0;
    const detallesClases = [];

    for (const clase of clasesInstructor) {
      const disciplina = disciplinas.find((d) => d.id === clase.disciplinaId);
      if (!disciplina) continue;

      const formula = disciplina?.parametros?.formula;
      if (!formula) continue;

      try {
        const resultado = evaluarFormula(formula, {
          reservaciones: clase.reservasTotales,
          listaEspera: clase.listasEspera,
          cortesias: clase.cortesias,
          capacidad: clase.lugares,
          reservasPagadas: clase.reservasPagadas,
          lugares: clase.lugares,
        });
        
        montoTotal += resultado.valor || 0;
        detallesClases.push({
          claseId: clase.id,
          fecha: clase.fecha,
          disciplina: disciplina.nombre,
          montoCalculado: resultado.valor,
          detalleCalculo: resultado,
        });
      } catch (error) {
        console.error(`Error en clase ${clase.id}:`, error);
      }
    }

    // Si no hay montos válidos, no crear pago
    if (montoTotal <= 0 && detallesClases.length === 0) {
      console.log(`No hay montos válidos para crear pago (Instructor ${instructorId})`);
      return false;
    }

    // Lógica simplificada de creación/actualización
    if (pagosExistentes[pagoKey]) {
      const pagoExistente = pagos.find(p => p.instructorId === instructorId && p.periodoId === periodoId);
      if (pagoExistente) {
        await actualizarPago(instructorId, { ...pagoExistente, monto: montoTotal });
        console.log(`Pago actualizado para instructor ${instructorId}`);
      }
    } else {
      await crearPago({
        instructorId,
        periodoId,
        monto: montoTotal,
        estado: EstadoPago.PENDIENTE,
        detalles: { clases: detallesClases }
      });
      pagosExistentes[pagoKey] = true;
      console.log(`Pago creado para instructor ${instructorId}`);
    }

    return true;
  } catch (error) {
    console.error(`Error procesando pago instructor ${instructorId}:`, error);
    return false;
  }
};

  // Modificar la función handleSubmit para mejorar la depuración y adaptarla al nuevo schema
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
      setProgress(5)
      setError(null)
      setPagosCreados(0)
      console.log("=== INICIANDO PROCESO DE IMPORTACIÓN ===")
      console.log(`Periodo seleccionado: ${periodoSeleccionadoId}, Semana: ${selectedWeek}`)

      // Cargar pagos existentes para el periodo
      console.log(`Cargando pagos existentes para el periodo ${periodoSeleccionadoId}`)
      await fetchPagos({ periodoId: periodoSeleccionadoId })

      // Crear un mapa para rastrear los pagos existentes
      const pagosExistentes: Record<string, boolean> = {}

      // Llenar el mapa con los pagos existentes
      pagos.forEach((pago) => {
        const key = `${pago.instructorId}-${pago.periodoId}`
        pagosExistentes[key] = true
      })

      console.log(`Se encontraron ${Object.keys(pagosExistentes).length} pagos existentes para el periodo`)

      // 1. Eliminar clases existentes para el periodo y semana seleccionados
      const weekNumber = Number.parseInt(selectedWeek)
      console.log(`Buscando clases existentes para periodo ${periodoSeleccionadoId} y semana ${weekNumber}`)

      // Obtener clases existentes para el periodo y semana
      const clasesExistentes = await clasesApi.getClases({
        periodoId: periodoSeleccionadoId,
        semana: weekNumber,
      })
      console.log(`Se encontraron ${clasesExistentes.length} clases existentes para eliminar`)

      setProgress(15)

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

      setProgress(30)

      // 2. Procesar y crear nuevas clases
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

      // Crear nuevas clases
      const errores: ErrorImportacion[] = []
      let clasesCreadas = 0
      let registrosConError = 0
      let instructoresCreados = 0

      // Caché de instructores para evitar búsquedas repetidas
      const instructoresCache: Record<string, number> = {}

      // Conjunto para rastrear instructores únicos en esta importación
      const instructoresUnicos: Set<number> = new Set()

      // Llenar el caché con los instructores existentes
      console.log("Inicializando caché de instructores existentes...")
      instructores.forEach((instructor) => {
        instructoresCache[instructor.nombre.toLowerCase()] = instructor.id
        console.log(`Instructor en caché: ${instructor.nombre} (ID: ${instructor.id})`)
      })

      console.log(`Total de registros a procesar: ${processedData.length}`)
      for (let i = 0; i < processedData.length; i++) {
        try {
          const row = processedData[i]
          console.log(`\n--- Procesando registro ${i + 1}/${processedData.length} ---`)
          console.log(
            `Instructor: ${row.Instructor}, Disciplina: ${row.Disciplina}, Fecha: ${row.Día}, Hora: ${row.Hora}`,
          )

          // Actualizar progreso
          setProgress(30 + Math.floor((i / processedData.length) * 50)) // Ajustado para dejar espacio para el procesamiento de pagos

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

          // Buscar o crear instructor
          let instructorId: number | undefined
          const instructorNombre = row.Instructor
          const instructorNombreLower = instructorNombre.toLowerCase()

          console.log(`Buscando instructor: ${instructorNombre}`)
          // Verificar si ya tenemos el ID en caché
          if (instructoresCache[instructorNombreLower]) {
            instructorId = instructoresCache[instructorNombreLower]
            console.log(`Instructor encontrado en caché: ${instructorNombre} (ID: ${instructorId})`)
          } else {
            // Si no está en caché, intentar crearlo
            console.log(`Instructor no encontrado en caché, intentando crear: ${instructorNombre}`)
            try {
              instructorId = await createInstructor(instructorNombre)
              instructoresCache[instructorNombreLower] = instructorId
              instructoresCreados++
              console.log(`Instructor creado y agregado a caché: ${instructorNombre} (ID: ${instructorId})`)
            } catch (error) {
              console.error(`Error al crear instructor, intentando buscar de nuevo: ${instructorNombre}`, error)
              // Si hay un error al crear (por ejemplo, ya existe), intentar buscarlo de nuevo
              await fetchInstructores()
              const instructorCreado = instructores.find((i) => i.nombre.toLowerCase() === instructorNombreLower)

              if (instructorCreado) {
                instructorId = instructorCreado.id
                instructoresCache[instructorNombreLower] = instructorId
                console.log(`Instructor encontrado después de recargar: ${instructorNombre} (ID: ${instructorId})`)
              } else {
                console.error(`No se pudo encontrar ni crear el instructor: ${instructorNombre}`)
                errores.push({
                  fila: i + 1,
                  mensaje: `Error al crear el instructor "${instructorNombre}": ${error instanceof Error ? error.message : "Error desconocido"}`,
                })
                registrosConError++
                continue
              }
            }
          }

          // Si encontramos o creamos un instructor, lo agregamos al conjunto de instructores únicos
          if (instructorId) {
            instructoresUnicos.add(instructorId)
          }

          // IMPORTANTE: Ya no creamos pagos aquí, solo registramos los instructores únicos

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

          // Crear objeto de clase según el nuevo schema
          const nuevaClase: Partial<Clase> = {
            periodoId: periodoSeleccionadoId,
            disciplinaId: disciplina.id,
            instructorId: instructorId,
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
            const claseCreada = await clasesApi.createClase(nuevaClase as Clase)
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
        } catch (error) {
          console.error(`Error general al procesar fila ${i + 1}:`, error)
          errores.push({
            fila: i + 1,
            mensaje: error instanceof Error ? error.message : "Error desconocido",
          })
          registrosConError++
        }
      }

      // Ahora procesamos los pagos una vez por instructor único
      console.log(`=== INICIANDO PROCESAMIENTO DE PAGOS ===`)
      console.log(`Total de instructores únicos: ${instructoresUnicos.size}`)

      let pagosNuevosCreados = 0
      let pagosActualizados = 0

      // Convertir el conjunto a un array para poder iterar
      const instructoresArray = Array.from(instructoresUnicos)

      // Procesar pagos para cada instructor único
      for (let j = 0; j < instructoresArray.length; j++) {
        const instructorId = instructoresArray[j]

        // Actualizar progreso para la fase de procesamiento de pagos
        setProgress(80 + Math.floor((j / instructoresArray.length) * 20))

        // Buscar el nombre del instructor para los logs
        const instructor = instructores.find((i) => i.id === instructorId)
        const instructorNombre = instructor ? instructor.nombre : `ID: ${instructorId}`

        console.log(`Procesando pago para instructor: ${instructorNombre} (${j + 1}/${instructoresArray.length})`)

        try {
          // Verificar si ya existe un pago para este instructor en este periodo
          const pagoKey = `${instructorId}-${periodoSeleccionadoId}`
          const pagoExistente = pagosExistentes[pagoKey] === true

          const pagoCreado = await crearPagoParaInstructor(instructorId, periodoSeleccionadoId, pagosExistentes)
          if (pagoCreado) {
            if (pagoExistente) {
              pagosActualizados++
              console.log(`Pago actualizado exitosamente para instructor: ${instructorNombre}`)
            } else {
              pagosNuevosCreados++
              console.log(`Pago creado exitosamente para instructor: ${instructorNombre}`)
            }
          } else {
            console.log(`No se creó pago para instructor: ${instructorNombre} (posiblemente sin clases en el periodo)`)
          }
        } catch (error) {
          console.error(`Error al procesar pago para instructor ${instructorNombre}:`, error)
        }
      }

      setPagosCreados(pagosNuevosCreados)
      setProgress(100)
      console.log("=== PROCESO DE IMPORTACIÓN COMPLETADO ===")
      console.log(`Clases creadas: ${clasesCreadas}`)
      console.log(`Instructores creados: ${instructoresCreados}`)
      console.log(`Pagos nuevos creados: ${pagosNuevosCreados}`)
      console.log(`Pagos actualizados: ${pagosActualizados}`)
      console.log(`Registros con error: ${registrosConError}`)

      // 4. Preparar resultado
      const resultadoImportacion: ResultadoImportacion = {
        totalRegistros: processedData.length,
        registrosImportados: clasesCreadas,
        registrosConError,
        errores,
        clasesCreadas,
        clasesEliminadas,
        instructoresCreados,
        pagosCreados: pagosNuevosCreados,
        pagosActualizados, // Agregar esta propiedad al tipo ResultadoImportacion si no existe
      }

      setResultado(resultadoImportacion)

      toast({
        title: "Importación completada",
        description: `Se importaron ${clasesCreadas} de ${processedData.length} registros. Se crearon ${pagosNuevosCreados} y actualizaron ${pagosActualizados} pagos.`,
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
              onValueChange={(value) => setPeriodoSeleccionado(value ? Number.parseInt(value) : null)}
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
                  {resultado.pagosCreados !== undefined && (
                    <div className="bg-card p-4 rounded-lg border shadow-sm">
                      <div className="text-sm text-muted-foreground">Pagos creados</div>
                      <div className="text-2xl font-bold text-green-600">{resultado.pagosCreados}</div>
                    </div>
                  )}
                  {resultado.pagosActualizados !== undefined && (
                    <div className="bg-card p-4 rounded-lg border shadow-sm">
                      <div className="text-sm text-muted-foreground">Pagos actualizados</div>
                      <div className="text-2xl font-bold text-green-600">{resultado.pagosActualizados}</div>
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

// Función para evaluar una fórmula con los datos de la clase
function evaluarFormulaInterna(formula: string, datos: any): any {
  try {
    // Reemplazar los nombres de las variables en la fórmula con los valores correspondientes
    let expresion = formula
    for (const key in datos) {
      const valor = datos[key]
      expresion = expresion.replace(new RegExp(key, "g"), valor)
    }

    // Evaluar la expresión
    const valor = eval(expresion)

    return {
      valor,
      expresion,
    }
  } catch (error) {
    console.error("Error al evaluar la fórmula:", error)
    return {
      valor: 0,
      expresion: formula,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

