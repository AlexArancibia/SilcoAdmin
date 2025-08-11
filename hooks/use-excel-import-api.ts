"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { toast } from "@/hooks/use-toast"
import type { 
  DatosExcelClase, 
  ResultadoImportacion, 
  ConfiguracionImportacion,
  ConfiguracionFinalImportacion,
  MapeoSemanas,
  TablaClasesEditable,
  ClaseEditable
} from "@/types/importacion"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"

export function useExcelImportAPI() {
  // State variables
  const [file, setFile] = useState<File | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [resultadoImportacion, setResultadoImportacion] = useState<ResultadoImportacion | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [periodoSeleccionadoId, setPeriodoSeleccionadoId] = useState<number | null>(null)

  // Configuración de importación
  const [semanaInicial, setSemanaInicial] = useState<number>(1)
  const [mapeoDisciplinas, setMapeoDisciplinas] = useState<Record<string, string>>({})
  const [instructoresCreados, setInstructoresCreados] = useState<string[]>([])
  const [tablaClases, setTablaClases] = useState<TablaClasesEditable | null>(null)

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
    setIsGenerating(false)
    setIsImporting(false)
    setResultadoImportacion(null)
    setError(null)
    setMapeoDisciplinas({})
    setInstructoresCreados([])
    setTablaClases(null)
  }

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      resetState()
      setCurrentStep(1)
    }
  }

  // Generar tabla de clases directamente (sin análisis previo)
  const generarTablaClases = async () => {
    if (!file || !periodoSeleccionadoId) {
      toast({
        title: "Error",
        description: "Por favor seleccione un archivo y un periodo",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGenerating(true)
      setError(null)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("semanaInicial", semanaInicial.toString())

      const response = await fetch("/api/importar/generar-tabla", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al generar la tabla de clases")
      }

      const resultado = await response.json()
      setTablaClases(resultado.tablaClases)
      
      // Inicializar mapeo de disciplinas por defecto
      if (resultado.mapeoDisciplinas) {
        setMapeoDisciplinas(resultado.mapeoDisciplinas)
      }

      setCurrentStep(2)
      toast({
        title: "Tabla generada",
        description: `Se generaron ${resultado.tablaClases.totalClases} clases para revisar`,
      })
    } catch (error) {
      console.error("Error al generar tabla:", error)
      setError(error instanceof Error ? error.message : "Error desconocido")
      toast({
        title: "Error al generar tabla",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Step 2: Procesar importación final
  const procesarImportacion = async () => {
    if (!tablaClases || !periodoSeleccionadoId) {
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

      const configuracion: ConfiguracionFinalImportacion = {
        periodoId: periodoSeleccionadoId,
        clases: tablaClases.clases.filter(c => !c.eliminada).map(clase => ({
          ...clase,
          instructor: clase.instructorEditado || clase.instructor,
          disciplina: clase.disciplinaEditada || clase.mapeoDisciplina || clase.disciplina,
          salon: clase.salonEditado || clase.salon,
          dia: clase.diaEditado || clase.dia,
          hora: clase.horaEditada || clase.hora
        })),
        instructoresCreados: []
      }

      const formData = new FormData()
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
  const actualizarMapeoDisciplinas = (disciplinaExcel: string, disciplinaSistema: string) => {
    setMapeoDisciplinas(prev => ({
      ...prev,
      [disciplinaExcel]: disciplinaSistema
    }))
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

  // Funciones para editar clases
  const editarClase = (claseId: string, campo: string, valor: any) => {
    setTablaClases(prev => {
      if (!prev) return prev
      
      return {
        ...prev,
        clases: prev.clases.map(clase => {
          if (clase.id === claseId) {
            return { ...clase, [campo]: valor }
          }
          return clase
        })
      }
    })
  }

  const toggleEliminarClase = (claseId: string) => {
    setTablaClases(prev => {
      if (!prev) return prev
      
      return {
        ...prev,
        clases: prev.clases.map(clase => {
          if (clase.id === claseId) {
            return { ...clase, eliminada: !clase.eliminada }
          }
          return clase
        })
      }
    })
  }

  // Validaciones
  const validarConfiguracion = (): { valido: boolean; errores: string[] } => {
    const errores: string[] = []

    if (!periodoSeleccionadoId) {
      errores.push("Debe seleccionar un periodo")
    }

    if (semanaInicial < 1) {
      errores.push("La semana inicial debe ser mayor a 0")
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
    isGenerating,
    isImporting,
    resultadoImportacion,
    error,
    periodoSeleccionadoId,
    setPeriodoSeleccionadoId,
    
    // Configuraciones
    semanaInicial,
    setSemanaInicial,
    mapeoDisciplinas,
    instructoresCreados,
    tablaClases,
    
    // Stores
    periodos,
    disciplinas,
    instructores,
    isLoadingPeriodos,
    isLoadingDisciplinas,
    isLoadingInstructores,
    
    // Actions
    handleFileChange,
    generarTablaClases,
    procesarImportacion,
    actualizarMapeoDisciplinas,
    toggleInstructorCreado,
    validarConfiguracion,
    resetState,
    // Funciones de edición
    editarClase,
    toggleEliminarClase
  }
} 