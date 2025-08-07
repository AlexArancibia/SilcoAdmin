"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { toast } from "@/hooks/use-toast"
import type { 
  DatosExcelClase, 
  ResultadoAnalisis, 
  ResultadoImportacion, 
  ConfiguracionImportacion,
  MapeoSemanas,
  InstructorVS
} from "@/types/importacion"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"

export function useExcelImportAPI() {
  // State variables
  const [file, setFile] = useState<File | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [resultadoAnalisis, setResultadoAnalisis] = useState<ResultadoAnalisis | null>(null)
  const [resultadoImportacion, setResultadoImportacion] = useState<ResultadoImportacion | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [periodoSeleccionadoId, setPeriodoSeleccionadoId] = useState<number | null>(null)

  // Configuración de importación
  const [mapeoSemanas, setMapeoSemanas] = useState<MapeoSemanas[]>([])
  const [mapeoDisciplinas, setMapeoDisciplinas] = useState<Record<string, string>>({})
  const [instructoresVS, setInstructoresVS] = useState<InstructorVS[]>([])
  const [instructoresCreados, setInstructoresCreados] = useState<string[]>([])

  // Obtener datos de los stores
  const { periodos, periodoActual, fetchPeriodos, isLoading: isLoadingPeriodos } = usePeriodosStore()
  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()
  const { instructores, fetchInstructores, isLoading: isLoadingInstructores } = useInstructoresStore()

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
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
    }

    loadInitialData()
  }, [
    periodos.length,
    disciplinas.length,
    instructores.length,
    fetchPeriodos,
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
    setIsAnalyzing(false)
    setIsImporting(false)
    setResultadoAnalisis(null)
    setResultadoImportacion(null)
    setError(null)
    setMapeoSemanas([])
    setMapeoDisciplinas({})
    setInstructoresVS([])
    setInstructoresCreados([])
  }

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      resetState()
      setCurrentStep(1)
    }
  }

  // Step 1: Analizar archivo
  const analizarArchivo = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Por favor seleccione un archivo para analizar",
        variant: "destructive",
      })
      return
    }

    try {
      setIsAnalyzing(true)
      setError(null)

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/importar/analizar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al analizar el archivo")
      }

      const resultado: ResultadoAnalisis = await response.json()
      setResultadoAnalisis(resultado)

      // Inicializar configuraciones por defecto
      inicializarConfiguraciones(resultado)

      setCurrentStep(2)
      toast({
        title: "Análisis completado",
        description: `Se encontraron ${resultado.totalRegistros} registros para procesar`,
      })
    } catch (error) {
      console.error("Error al analizar archivo:", error)
      setError(error instanceof Error ? error.message : "Error desconocido")
      toast({
        title: "Error al analizar archivo",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Inicializar configuraciones por defecto
  const inicializarConfiguraciones = (resultado: ResultadoAnalisis) => {
    // Mapeo de semanas vacío por defecto - el usuario debe configurar manualmente
    setMapeoSemanas([])

    // Mapeo de disciplinas por defecto (sin mapeo)
    const mapeoDisciplinasDefault: Record<string, string> = {}
    resultado.disciplineAnalysis.disciplines.forEach(disciplina => {
      if (!disciplina.exists && disciplina.matchedDiscipline) {
        mapeoDisciplinasDefault[disciplina.name] = disciplina.matchedDiscipline.nombre
      }
    })
    setMapeoDisciplinas(mapeoDisciplinasDefault)

    // Instructores VS por defecto (todos activos)
    setInstructoresVS(resultado.instructoresVS)

    // Instructores a crear por defecto (solo los nuevos)
    const instructoresNuevos = resultado.instructorAnalysis.instructors
      .filter(instructor => !instructor.exists)
      .map(instructor => instructor.name)
    setInstructoresCreados(instructoresNuevos)
  }

  // Step 2: Procesar importación
  const procesarImportacion = async () => {
    if (!file || !resultadoAnalisis || !periodoSeleccionadoId) {
      toast({
        title: "Error",
        description: "Faltan datos necesarios para la importación",
        variant: "destructive",
      })
      return
    }

    try {
      setIsImporting(true)
      setError(null)

      const configuracion: ConfiguracionImportacion = {
        periodoId: periodoSeleccionadoId,
        mapeoSemanas,
        mapeoDisciplinas,
        instructoresVS,
        instructoresCreados
      }

      const formData = new FormData()
      formData.append("file", file)
      formData.append("configuracion", JSON.stringify(configuracion))

      const response = await fetch("/api/importar/procesar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al procesar la importación")
      }

      const resultado: ResultadoImportacion = await response.json()
      setResultadoImportacion(resultado)

      setCurrentStep(3)
      toast({
        title: "Importación completada",
        description: `Se importaron ${resultado.registrosImportados} de ${resultado.totalRegistros} registros`,
      })
    } catch (error) {
      console.error("Error al procesar importación:", error)
      setError(error instanceof Error ? error.message : "Error desconocido")
      toast({
        title: "Error al procesar importación",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  // Handlers para configuraciones
  const actualizarMapeoSemanas = (semanaExcel: number, semanaPeriodo: number) => {
    setMapeoSemanas(prev => {
      // Si semanaExcel es 0 o vacío, eliminar el mapeo
      if (!semanaExcel) {
        return prev.filter(ms => ms.semanaPeriodo !== semanaPeriodo)
      }
      
      // Buscar si ya existe un mapeo para esta semana del periodo
      const existing = prev.find(ms => ms.semanaPeriodo === semanaPeriodo)
      if (existing) {
        return prev.map(ms => 
          ms.semanaPeriodo === semanaPeriodo 
            ? { ...ms, semanaExcel } 
            : ms
        )
      } else {
        return [...prev, { semanaExcel, semanaPeriodo }]
      }
    })
  }

  const actualizarMapeoDisciplinas = (disciplinaExcel: string, disciplinaSistema: string) => {
    setMapeoDisciplinas(prev => ({
      ...prev,
      [disciplinaExcel]: disciplinaSistema
    }))
  }

  const toggleInstructorVS = (originalName: string, instructorIndex: number) => {
    setInstructoresVS(prev => 
      prev.map(vs => {
        if (vs.originalName === originalName) {
          const newKeepInstructores = [...vs.keepInstructores]
          newKeepInstructores[instructorIndex] = !newKeepInstructores[instructorIndex]
          return {
            ...vs,
            keepInstructores: newKeepInstructores
          }
        }
        return vs
      })
    )
  }

  const toggleInstructorCreado = (nombreInstructor: string) => {
    setInstructoresCreados(prev => {
      if (prev.includes(nombreInstructor)) {
        return prev.filter(nombre => nombre !== nombreInstructor)
      } else {
        return [...prev, nombreInstructor]
      }
    })
  }

  // Validaciones
  const validarConfiguracion = (): { valido: boolean; errores: string[] } => {
    const errores: string[] = []

    if (!periodoSeleccionadoId) {
      errores.push("Debe seleccionar un periodo")
    }

    if (mapeoSemanas.length === 0) {
      errores.push("Debe configurar al menos un mapeo de semanas")
    }

    if (instructoresCreados.length === 0 && (resultadoAnalisis?.instructorAnalysis.new ?? 0) > 0) {
      errores.push("Debe seleccionar al menos un instructor nuevo para crear")
    }

    return {
      valido: errores.length === 0,
      errores
    }
  }

  return {
    // State
    file,
    setFile,
    currentStep,
    setCurrentStep,
    isAnalyzing,
    isImporting,
    resultadoAnalisis,
    resultadoImportacion,
    error,
    periodoSeleccionadoId,
    setPeriodoSeleccionadoId,
    
    // Configuraciones
    mapeoSemanas,
    mapeoDisciplinas,
    instructoresVS,
    instructoresCreados,
    
    // Stores
    periodos,
    disciplinas,
    instructores,
    isLoadingPeriodos,
    isLoadingDisciplinas,
    isLoadingInstructores,
    
    // Actions
    handleFileChange,
    analizarArchivo,
    procesarImportacion,
    actualizarMapeoSemanas,
    actualizarMapeoDisciplinas,
    toggleInstructorVS,
    toggleInstructorCreado,
    validarConfiguracion,
    resetState
  }
} 