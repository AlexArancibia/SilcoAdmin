"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { usePagosStore } from "@/store/usePagosStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useClasesStore } from "@/store/useClasesStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  Download,
  FileText,
  Info,
  Loader2,
  Percent,
  Printer,
  Users,
  X,
  Award,
  Edit,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCw,
  ArrowRight,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import type { EstadoPago, TipoReajuste, Instructor, Periodo, Clase, CategoriaInstructor } from "@/types/schema"
import { downloadPagoPDF, printPagoPDF } from "@/utils/pago-instructor-pdf"
import { retencionValor } from "@/utils/const"
import { useFormulasStore } from "@/store/useFormulaStore"

// Requisitos de ejemplo para cada categoría
// Remove this hardcoded object:
// Remove this entire block:
// Requisitos de ejemplo para cada categoría
// const requisitosCategoriaEjemplo = {
//   EMBAJADOR_SENIOR: {
//     ocupacion: 80,
//     clases: 9,
//     localesEnLima: 4,
//     dobleteos: 3,
//     horariosNoPrime: 4,
//     participacionEventos: true,
//   },
//   EMBAJADOR: {
//     ocupacion: 60,
//     clases: 6,
//     localesEnLima: 3,
//     dobleteos: 2,
//     horariosNoPrime: 3,
//     participacionEventos: true,
//   },
//   EMBAJADOR_JUNIOR: {
//     ocupacion: 40,
//     clases: 4,
//     localesEnLima: 2,
//     dobleteos: 1,
//     horariosNoPrime: 2,
//     participacionEventos: false,
//   },
//   INSTRUCTOR: {
//     ocupacion: 0,
//     clases: 0,
//     localesEnLima: 0,
//     dobleteos: 0,
//     horariosNoPrime: 0,
//     participacionEventos: false,
//   },
// }

// Add this after the other state declarations
// Remove these lines:
// const [formulasDisciplinas, setFormulasDisciplinas] = useState<any[]>([])
// const [requisitosCategoria, setRequisitosCategoria] = useState<any>({})

export default function PagoDetallePage() {
  const router = useRouter()
  const params = useParams()
  const pagoId = Number.parseInt(params.id as string)

  const { pagos, pagoSeleccionado, fetchPagos, fetchPago, actualizarPago, isLoading: isLoadingPagos } = usePagosStore()

  const { instructores, fetchInstructores, actualizarInstructor, instructorSeleccionado, fetchInstructor } =
    useInstructoresStore()

  const { periodos, fetchPeriodos } = usePeriodosStore()
  const { clases, fetchClases, isLoading: isLoadingClases } = useClasesStore()
  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()
  const { formulas, fetchFormulas } = useFormulasStore()

  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [periodo, setPeriodo] = useState<Periodo | null>(null)
  const [clasesInstructor, setClasesInstructor] = useState<Clase[]>([])
  const [isActualizandoReajuste, setIsActualizandoReajuste] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>("detalles")
  const [editandoReajuste, setEditandoReajuste] = useState<boolean>(false)
  const [nuevoReajuste, setNuevoReajuste] = useState<number>(0)
  const [tipoReajuste, setTipoReajuste] = useState<TipoReajuste>("FIJO")

  // Estado para edición de categoría
  const [editandoCategoria, setEditandoCategoria] = useState<boolean>(false)
  const [isActualizandoInstructor, setIsActualizandoInstructor] = useState<boolean>(false)
  const [isActualizandoCategorias, setIsActualizandoCategorias] = useState<boolean>(false)
  const [categoriaCalculada, setCategoriaCalculada] = useState<CategoriaInstructor | null>(null)
  const [showCategoriaDialog, setShowCategoriaDialog] = useState<boolean>(false)
  const [categoriaPrevia, setCategoriaPrevia] = useState<CategoriaInstructor | null>(null)

  // Agregar estados para la disciplina y categoría seleccionadas
  const [disciplinaSeleccionada, setDisciplinaSeleccionada] = useState<any | undefined>(undefined)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<any | null>(null)

  // Estado para los factores editados
  const [factoresEditados, setFactoresEditados] = useState({
    dobleteos: 0,
    horariosNoPrime: 0,
    participacionEventos: false,
    cumpleLineamientos: false,
  })

  // Agregar un estado para el diálogo de resumen de cambios
  const [showResumenDialog, setShowResumenDialog] = useState<boolean>(false)
  const [cambiosCategorias, setCambiosCategorias] = useState<
    Array<{
      disciplina: string
      categoriaAnterior: CategoriaInstructor
      categoriaNueva: CategoriaInstructor
    }>
  >([])

  // Cargar datos iniciales
  useEffect(() => {
    fetchPago(pagoId)
    fetchInstructores()
    fetchPeriodos()
    fetchDisciplinas()
    fetchFormulas() // Add this line to fetch formulas
  }, [pagoId, fetchPago, fetchInstructores, fetchPeriodos, fetchDisciplinas, fetchFormulas])

  // Add this function after the other useEffect hooks
  // Remove the fetchFormulas function:
  // const fetchFormulas = async () => {
  //   try {
  //     // Assuming you have an API endpoint for formulas
  //     const response = await fetch("/api/formulas-disciplinas")
  //     const data = await response.json()
  //     setFormulasDisciplinas(data)

  //     // Process the formulas to create the requisitosCategoria object
  //     if (data.length > 0) {
  //       // Use the first formula's requirements as default (they should be the same across disciplines)
  //       const firstFormula = data[0]
  //       setRequisitosCategoria(firstFormula.requisitosCategoria)
  //     }
  //   } catch (error) {
  //     console.error("Error fetching formulas:", error)
  //     toast({
  //       title: "Error al cargar fórmulas",
  //       description: "No se pudieron cargar las fórmulas de cálculo",
  //       variant: "destructive",
  //     })
  //   }
  // }

  // Obtener instructor y periodo cuando se carguen los datos
  useEffect(() => {
    if (pagoSeleccionado && instructores.length > 0 && periodos.length > 0) {
      const instructorEncontrado = instructores.find((i) => i.id === pagoSeleccionado.instructorId) || null
      setInstructor(instructorEncontrado)

      if (instructorEncontrado) {
        setFactoresEditados({
          cumpleLineamientos: instructorEncontrado.cumpleLineamientos || false,
          dobleteos: instructorEncontrado.dobleteos || 0,
          horariosNoPrime: instructorEncontrado.horariosNoPrime || 0,
          participacionEventos: instructorEncontrado.participacionEventos || false,
        })

        // Cargar instructor completo con categorías
        fetchInstructor(instructorEncontrado.id)
      }

      setPeriodo(periodos.find((p) => p.id === pagoSeleccionado.periodoId) || null)

      // Cargar clases del instructor en este periodo
      if (pagoSeleccionado.instructorId && pagoSeleccionado.periodoId) {
        fetchClases({
          instructorId: pagoSeleccionado.instructorId,
          periodoId: pagoSeleccionado.periodoId,
        })
      }

      // Inicializar valores de reajuste
      setNuevoReajuste(pagoSeleccionado.reajuste)
      setTipoReajuste(pagoSeleccionado.tipoReajuste)
    }
  }, [pagoSeleccionado, instructores, periodos, fetchClases, fetchInstructor])

  // Actualizar clases del instructor cuando se carguen
  useEffect(() => {
    if (clases.length > 0 && pagoSeleccionado) {
      setClasesInstructor(
        clases.filter(
          (c) => c.instructorId === pagoSeleccionado.instructorId && c.periodoId === pagoSeleccionado.periodoId,
        ),
      )
    }
  }, [clases, pagoSeleccionado])

  // Función para formatear moneda
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Función para obtener el color del estado
  const getEstadoColor = (estado: EstadoPago): string => {
    switch (estado) {
      case "APROBADO":
        return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-800/50"
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-800/50"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
    }
  }

  // Función para calcular el monto final
  const calcularMontoFinal = (
    monto: number,
    retencion: number,
    reajuste: number,
    tipoReajuste: TipoReajuste,
  ): number => {
    const reajusteCalculado = tipoReajuste === "PORCENTAJE" ? (monto * reajuste) / 100 : reajuste
    const montoAjustado = monto + reajusteCalculado
    return montoAjustado - retencion
  }

  // Función para actualizar el reajuste
  const actualizarReajuste = async () => {
    if (!pagoSeleccionado) return

    setIsActualizandoReajuste(true)

    try {
      // Calculate the adjusted amount first
      const montoBase = pagoSeleccionado.monto
      const reajusteCalculado = tipoReajuste === "PORCENTAJE" ? (montoBase * nuevoReajuste) / 100 : nuevoReajuste

      // Calculate the retention based on the adjusted amount
      const montoAjustado = montoBase + reajusteCalculado
      const retencionPorcentaje = retencionValor
      const nuevaRetencion = montoAjustado * retencionPorcentaje

      // Calculate the final payment
      const pagoFinal = montoAjustado - nuevaRetencion

      const pagoActualizado = {
        ...pagoSeleccionado,
        reajuste: nuevoReajuste,
        tipoReajuste: tipoReajuste,
        retencion: nuevaRetencion,
        pagoFinal: pagoFinal,
      }

      await actualizarPago(pagoId, pagoActualizado)
      await fetchPago(pagoId)

      toast({
        title: "Reajuste actualizado",
        description: `El reajuste ha sido actualizado exitosamente.`,
      })

      setEditandoReajuste(false)
    } catch (error) {
      toast({
        title: "Error al actualizar reajuste",
        description: error instanceof Error ? error.message : "Error desconocido al actualizar reajuste",
        variant: "destructive",
      })
    } finally {
      setIsActualizandoReajuste(false)
    }
  }

  // Modificar la función calcularMetricas para incluir todas las propiedades requeridas
  const calcularMetricas = (clases: Clase[], disciplinaId?: number) => {
    // Si se proporciona un disciplinaId, filtrar solo las clases de esa disciplina
    const clasesFiltradas = disciplinaId ? clases.filter((c) => c.disciplinaId === disciplinaId) : clases

    if (clasesFiltradas.length === 0) {
      return {
        ocupacion: 0,
        clases: 0,
        localesEnLima: 0,
        dobleteos: 0,
        horariosNoPrime: 0,
        participacionEventos: false,
      }
    }

    // Calcular ocupación promedio
    const totalReservas = clasesFiltradas.reduce((sum, clase) => sum + clase.reservasTotales, 0)
    const totalCapacidad = clasesFiltradas.reduce((sum, clase) => sum + clase.lugares, 0)
    const ocupacionPromedio = totalCapacidad > 0 ? Math.round((totalReservas / totalCapacidad) * 100) : 0

    // Contar clases
    const totalClases = clasesFiltradas.length

    // Contar locales únicos en Lima
    const localesUnicos = new Set(clasesFiltradas.map((c) => c.estudio)).size

    return {
      ocupacion: ocupacionPromedio,
      clases: totalClases,
      localesEnLima: localesUnicos,
      dobleteos: 0,
      horariosNoPrime: 0,
      participacionEventos: false,
    }
  }

  // Replace the evaluarCategoriaInstructor function with this updated version
  const evaluarCategoriaInstructor = (
    metricas: {
      ocupacion: number
      clases: number
      localesEnLima: number
      dobleteos: number
      horariosNoPrime: number
      participacionEventos: boolean
    },
    instructorParams: {
      dobleteos: number
      horariosNoPrime: number
      participacionEventos: boolean
      cumpleLineamientos: boolean
    },
    disciplinaId?: number,
  ): CategoriaInstructor => {
    // Find the formula for this discipline
    const metricasCategoria = formulas.find((f) => f.disciplinaId === disciplinaId)

    // If no specific formula found for this discipline, use the first formula as default
    const requisitosCategoria =
      metricasCategoria?.requisitosCategoria || (formulas.length > 0 ? formulas[0].requisitosCategoria : null)

    // If no formulas available at all, return INSTRUCTOR
    if (!requisitosCategoria) {
      return "INSTRUCTOR"
    }

    // Si no cumple lineamientos, no puede ser más que INSTRUCTOR
    if (!instructorParams.cumpleLineamientos) return "INSTRUCTOR"

    // Verificar requisitos para EMBAJADOR_SENIOR
    if (
      metricas.ocupacion >= requisitosCategoria.EMBAJADOR_SENIOR.ocupacion &&
      metricas.clases >= requisitosCategoria.EMBAJADOR_SENIOR.clases &&
      metricas.localesEnLima >= requisitosCategoria.EMBAJADOR_SENIOR.localesEnLima &&
      instructorParams.dobleteos >= requisitosCategoria.EMBAJADOR_SENIOR.dobleteos &&
      instructorParams.horariosNoPrime >= requisitosCategoria.EMBAJADOR_SENIOR.horariosNoPrime &&
      (instructorParams.participacionEventos || !requisitosCategoria.EMBAJADOR_SENIOR.participacionEventos)
    ) {
      return "EMBAJADOR_SENIOR"
    }

    // Verificar requisitos para EMBAJADOR
    if (
      metricas.ocupacion >= requisitosCategoria.EMBAJADOR.ocupacion &&
      metricas.clases >= requisitosCategoria.EMBAJADOR.clases &&
      metricas.localesEnLima >= requisitosCategoria.EMBAJADOR.localesEnLima &&
      instructorParams.dobleteos >= requisitosCategoria.EMBAJADOR.dobleteos &&
      instructorParams.horariosNoPrime >= requisitosCategoria.EMBAJADOR.horariosNoPrime &&
      (instructorParams.participacionEventos || !requisitosCategoria.EMBAJADOR.participacionEventos)
    ) {
      return "EMBAJADOR"
    }

    // Verificar requisitos para EMBAJADOR_JUNIOR
    if (
      metricas.ocupacion >= requisitosCategoria.EMBAJADOR_JUNIOR.ocupacion &&
      metricas.clases >= requisitosCategoria.EMBAJADOR_JUNIOR.clases &&
      metricas.localesEnLima >= requisitosCategoria.EMBAJADOR_JUNIOR.localesEnLima &&
      instructorParams.dobleteos >= requisitosCategoria.EMBAJADOR_JUNIOR.dobleteos &&
      instructorParams.horariosNoPrime >= requisitosCategoria.EMBAJADOR_JUNIOR.horariosNoPrime &&
      (instructorParams.participacionEventos || !requisitosCategoria.EMBAJADOR_JUNIOR.participacionEventos)
    ) {
      return "EMBAJADOR_JUNIOR"
    }

    // Si no cumple con ninguna categoría superior, es INSTRUCTOR
    return "INSTRUCTOR"
  }

  // Modify the reevaluarTodasCategorias function to use discipline-specific formulas
  const reevaluarTodasCategorias = async () => {
    if (!instructor || !pagoSeleccionado || !periodo) return

    setIsActualizandoCategorias(true)

    try {
      // 1. Obtener todas las disciplinas que el instructor ha dictado en este periodo
      const disciplinasInstructor = new Set(clasesInstructor.map((c) => c.disciplinaId))

      // 2. Para cada disciplina, calcular métricas y evaluar categoría
      const categoriasPorDisciplina = instructor.categorias || []
      const nuevasCategorias = [...categoriasPorDisciplina]

      // Parámetros del instructor para evaluación
      const instructorParams = {
        dobleteos: instructor.dobleteos || 0,
        horariosNoPrime: instructor.horariosNoPrime || 0,
        participacionEventos: instructor.participacionEventos || false,
        cumpleLineamientos: instructor.cumpleLineamientos || false,
      }

      let cambiosRealizados = false
      const resumenCambios: Array<{
        disciplina: string
        categoriaAnterior: CategoriaInstructor
        categoriaNueva: CategoriaInstructor
      }> = []

      // Procesar cada disciplina que el instructor ha dictado
      for (const disciplinaId of disciplinasInstructor) {
        // Calcular métricas reales para esta disciplina
        const metricasBase = calcularMetricas(clasesInstructor, disciplinaId)

        // Combinar métricas base con parámetros del instructor
        const metricas = {
          ...metricasBase,
          dobleteos: instructorParams.dobleteos,
          horariosNoPrime: instructorParams.horariosNoPrime,
          participacionEventos: instructorParams.participacionEventos,
        }

        // Evaluar la categoría basada en las métricas y parámetros del instructor
        const categoriaCalculada = evaluarCategoriaInstructor(metricas, instructorParams, disciplinaId)

        // Buscar si ya existe una categoría para esta disciplina y periodo
        const categoriaExistente = categoriasPorDisciplina.find(
          (cat) => cat.disciplinaId === disciplinaId && cat.periodoId === pagoSeleccionado.periodoId,
        )

        // Obtener el nombre de la disciplina
        const disciplina = disciplinas.find((d) => d.id === disciplinaId)
        const nombreDisciplina = disciplina?.nombre || `Disciplina ${disciplinaId}`

        if (categoriaExistente) {
          // Si existe y es diferente, actualizarla
          if (categoriaExistente.categoria !== categoriaCalculada) {
            const index = nuevasCategorias.findIndex(
              (cat) => cat.disciplinaId === disciplinaId && cat.periodoId === pagoSeleccionado.periodoId,
            )

            // Guardar el cambio para el resumen
            resumenCambios.push({
              disciplina: nombreDisciplina,
              categoriaAnterior: categoriaExistente.categoria,
              categoriaNueva: categoriaCalculada,
            })

            nuevasCategorias[index] = {
              ...categoriaExistente,
              categoria: categoriaCalculada,
              metricas: metricas, // Actualizar métricas referenciales
            }

            cambiosRealizados = true
          }
        } else {
          // Si no existe, crear una nueva
          const disciplina = disciplinas.find((d) => d.id === disciplinaId)

          // Guardar el cambio para el resumen (nueva categoría)
          resumenCambios.push({
            disciplina: nombreDisciplina,
            categoriaAnterior: "INSTRUCTOR" as CategoriaInstructor, // Valor por defecto
            categoriaNueva: categoriaCalculada,
          })

          nuevasCategorias.push({
            id: Date.now(), // ID temporal
            instructorId: instructor.id,
            disciplinaId: disciplinaId,
            periodoId: pagoSeleccionado.periodoId,
            categoria: categoriaCalculada,
            metricas: metricas,
            disciplina: disciplina, // Use the complete disciplina object
          })

          cambiosRealizados = true
        }
      }

      // Si hubo cambios, actualizar el instructor
      if (cambiosRealizados) {
        const instructorActualizado = {
          ...instructor,
          categorias: nuevasCategorias,
        }

        await actualizarInstructor(instructor.id, instructorActualizado)
        await fetchInstructor(instructor.id)

        // Guardar los cambios para mostrar en el diálogo
        setCambiosCategorias(resumenCambios)
        setShowResumenDialog(true)
      } else {
        toast({
          title: "Categorías evaluadas",
          description: "Las categorías del instructor ya están correctamente asignadas.",
        })
      }
    } catch (error) {
      toast({
        title: "Error al reevaluar categorías",
        description: error instanceof Error ? error.message : "Error desconocido al reevaluar categorías",
        variant: "destructive",
      })
    } finally {
      setIsActualizandoCategorias(false)
    }
  }

  // Remove the evaluarCategoriaConRequisitos helper function:
  // const evaluarCategoriaConRequisitos = (
  //   metricas: {
  //     ocupacion: number
  //     clases: number
  //     localesEnLima: number
  //     dobleteos: number
  //     horariosNoPrime: number
  //     participacionEventos: boolean
  //   },
  //   instructorParams: {
  //     dobleteos: number
  //     horariosNoPrime: number
  //     participacionEventos: boolean
  //     cumpleLineamientos: boolean
  //   },
  //   requisitos: any,
  // ): CategoriaInstructor => {
  //   // Si no cumple lineamientos, no puede ser más que INSTRUCTOR
  //   if (!instructorParams.cumpleLineamientos) return "INSTRUCTOR"

  //   // Verificar requisitos para EMBAJADOR_SENIOR
  //   if (
  //     metricas.ocupacion >= requisitos.EMBAJADOR_SENIOR.ocupacion &&
  //     metricas.clases >= requisitos.EMBAJADOR_SENIOR.clases &&
  //     metricas.localesEnLima >= requisitos.EMBAJADOR_SENIOR.localesEnLima &&
  //     instructorParams.dobleteos >= requisitos.EMBAJADOR_SENIOR.dobleteos &&
  //     instructorParams.horariosNoPrime >= requisitos.EMBAJADOR_SENIOR.horariosNoPrime &&
  //     (instructorParams.participacionEventos || !requisitos.EMBAJADOR_SENIOR.participacionEventos)
  //   ) {
  //     return "EMBAJADOR_SENIOR"
  //   }

  //   // Verificar requisitos para EMBAJADOR
  //   if (
  //     metricas.ocupacion >= requisitos.EMBAJADOR.ocupacion &&
  //     metricas.clases >= requisitos.EMBAJADOR.clases &&
  //     metricas.localesEnLima >= requisitos.EMBAJADOR.localesEnLima &&
  //     instructorParams.dobleteos >= requisitos.EMBAJADOR.dobleteos &&
  //     instructorParams.horariosNoPrime >= requisitos.EMBAJADOR.horariosNoPrime &&
  //     (instructorParams.participacionEventos || !requisitos.EMBAJADOR.participacionEventos)
  //   ) {
  //     return "EMBAJADOR"
  //   }

  //   // Verificar requisitos para EMBAJADOR_JUNIOR
  //   if (
  //     metricas.ocupacion >= requisitos.EMBAJADOR_JUNIOR.ocupacion &&
  //     metricas.clases >= requisitos.EMBAJADOR_JUNIOR.clases &&
  //     metricas.localesEnLima >= requisitos.EMBAJADOR_JUNIOR.localesEnLima &&
  //     instructorParams.dobleteos >= requisitos.EMBAJADOR_JUNIOR.dobleteos &&
  //     instructorParams.horariosNoPrime >= requisitos.EMBAJADOR_JUNIOR.horariosNoPrime &&
  //     (instructorParams.participacionEventos || !requisitos.EMBAJADOR_JUNIOR.participacionEventos)
  //   ) {
  //     return "EMBAJADOR_JUNIOR"
  //   }

  //   // Si no cumple con ninguna categoría superior, es INSTRUCTOR
  //   return "INSTRUCTOR"
  // }

  // Modificar la función guardarFactoresEditados para que también reevalúe las categorías
  const guardarFactoresEditados = async () => {
    if (!instructor) return

    setIsActualizandoInstructor(true)

    try {
      // Create updated instructor object with all the necessary data
      const instructorActualizado = {
        ...instructor,
        ...factoresEditados,
      }

      // Update the instructor in the database
      await actualizarInstructor(instructor.id, instructorActualizado)

      // Update the instructor in the local state
      setInstructor(instructorActualizado)

      toast({
        title: "Factores actualizados",
        description: "Los factores de categorización han sido actualizados exitosamente.",
      })

      // Reload the instructor to get updated data
      await fetchInstructor(instructor.id)
      setEditandoCategoria(false)

      // Re-evaluate categories with the updated instructor data
      const updatedInstructor = {
        ...instructor,
        ...factoresEditados,
      }

      // Force re-evaluation of categories with the updated instructor data
      if (updatedInstructor && pagoSeleccionado && periodo) {
        // Get all disciplines the instructor has taught in this period
        const disciplinasInstructor = new Set(clasesInstructor.map((c) => c.disciplinaId))

        // For each discipline, calculate metrics and evaluate category
        const categoriasPorDisciplina = updatedInstructor.categorias || []
        const nuevasCategorias = [...categoriasPorDisciplina]

        // Instructor parameters for evaluation
        const instructorParams = {
          dobleteos: updatedInstructor.dobleteos || 0,
          horariosNoPrime: updatedInstructor.horariosNoPrime || 0,
          participacionEventos: updatedInstructor.participacionEventos || false,
          cumpleLineamientos: updatedInstructor.cumpleLineamientos || false,
        }

        let cambiosRealizados = false
        const resumenCambios = []

        // Process each discipline the instructor has taught
        for (const disciplinaId of disciplinasInstructor) {
          // Calculate real metrics for this discipline
          const metricasBase = calcularMetricas(clasesInstructor, disciplinaId)

          // Combine base metrics with instructor parameters
          const metricas = {
            ...metricasBase,
            dobleteos: instructorParams.dobleteos,
            horariosNoPrime: instructorParams.horariosNoPrime,
            participacionEventos: instructorParams.participacionEventos,
          }

          // Evaluate the category based on metrics and instructor parameters
          const categoriaCalculada = evaluarCategoriaInstructor(metricas, instructorParams, disciplinaId)

          // Find if a category already exists for this discipline and period
          const categoriaExistente = categoriasPorDisciplina.find(
            (cat) => cat.disciplinaId === disciplinaId && cat.periodoId === pagoSeleccionado.periodoId,
          )

          // Get the discipline name
          const disciplina = disciplinas.find((d) => d.id === disciplinaId)
          const nombreDisciplina = disciplina?.nombre || `Disciplina ${disciplinaId}`

          if (categoriaExistente) {
            // If it exists and is different, update it
            if (categoriaExistente.categoria !== categoriaCalculada) {
              const index = nuevasCategorias.findIndex(
                (cat) => cat.disciplinaId === disciplinaId && cat.periodoId === pagoSeleccionado.periodoId,
              )

              // Save the change for the summary
              resumenCambios.push({
                disciplina: nombreDisciplina,
                categoriaAnterior: categoriaExistente.categoria,
                categoriaNueva: categoriaCalculada,
              })

              nuevasCategorias[index] = {
                ...categoriaExistente,
                categoria: categoriaCalculada,
                metricas: metricas, // Update reference metrics
              }

              cambiosRealizados = true
            }
          } else {
            // If it doesn't exist, create a new one
            const disciplina = disciplinas.find((d) => d.id === disciplinaId)

            // Save the change for the summary (new category)
            resumenCambios.push({
              disciplina: nombreDisciplina,
              categoriaAnterior: "INSTRUCTOR" as CategoriaInstructor,
              categoriaNueva: categoriaCalculada,
            })

            nuevasCategorias.push({
              id: Date.now(), // Temporary ID
              instructorId: updatedInstructor.id,
              disciplinaId: disciplinaId,
              periodoId: pagoSeleccionado.periodoId,
              categoria: categoriaCalculada,
              metricas: metricas,
              disciplina: disciplina,
            })

            cambiosRealizados = true
          }
        }

        // If there were changes, update the instructor
        if (cambiosRealizados) {
          const instructorFinalActualizado = {
            ...updatedInstructor,
            categorias: nuevasCategorias,
          }

          await actualizarInstructor(updatedInstructor.id, instructorFinalActualizado)
          await fetchInstructor(updatedInstructor.id)

          // Save the changes to show in the dialog
          setCambiosCategorias(resumenCambios)
          setShowResumenDialog(true)
        } else {
          toast({
            title: "Categorías evaluadas",
            description: "Las categorías del instructor ya están correctamente asignadas.",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error al actualizar factores",
        description: error instanceof Error ? error.message : "Error desconocido al actualizar factores",
        variant: "destructive",
      })
    } finally {
      setIsActualizandoInstructor(false)
    }
  }

  // Modificar la función obtenerCategoriaInstructor para obtener todas las categorías del instructor
  const obtenerCategoriasInstructor = () => {
    if (!instructor || !instructor.categorias || !pagoSeleccionado) return []

    // Filtrar las categorías del instructor para el periodo actual
    return instructor.categorias.filter((cat) => cat.periodoId === pagoSeleccionado.periodoId)
  }

  // Reemplazar la variable categoriaActual con categoriasPorDisciplina
  const categoriasPorDisciplina = obtenerCategoriasInstructor()

  // Función para cambiar el estado del pago directamente
  const toggleEstadoPago = async () => {
    if (!pagoSeleccionado) return

    try {
      const nuevoEstado: EstadoPago = pagoSeleccionado.estado === "PENDIENTE" ? "APROBADO" : "PENDIENTE"

      const pagoActualizado = {
        ...pagoSeleccionado,
        estado: nuevoEstado,
      }

      await actualizarPago(pagoId, pagoActualizado)
      await fetchPago(pagoId)

      toast({
        title: "Estado actualizado",
        description: `El estado del pago ha sido actualizado a ${nuevoEstado}`,
      })
    } catch (error) {
      toast({
        title: "Error al actualizar estado",
        description: error instanceof Error ? error.message : "Error desconocido al actualizar estado",
        variant: "destructive",
      })
    }
  }

  // Función para exportar a PDF
  const handleExportPDF = () => {
    if (!pagoSeleccionado || !instructor || !periodo) return
    downloadPagoPDF(pagoSeleccionado, instructor, periodo, clasesInstructor, disciplinas)
  }

  const handlePrint = () => {
    if (!pagoSeleccionado || !instructor || !periodo) return
    printPagoPDF(pagoSeleccionado, instructor, periodo, clasesInstructor, disciplinas)
  }

  // Si está cargando, mostrar skeleton
  if (isLoadingPagos || !pagoSeleccionado || !instructor || !periodo) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card rounded-lg p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-md" />
            <Skeleton className="h-9 w-40 rounded-md" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-8 w-32 rounded-md" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-6 rounded-md" />
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-md" />
                  ))}
                </div>
              </div>
              <div>
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-md" />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calcular estadísticas
  const totalReservas = clasesInstructor.reduce((sum, clase) => sum + clase.reservasTotales, 0)
  const totalCapacidad = clasesInstructor.reduce((sum, clase) => sum + clase.lugares, 0)
  const ocupacionPromedio = totalCapacidad > 0 ? Math.round((totalReservas / totalCapacidad) * 100) : 0
  // Declare ocupacionPorcentaje here
  const ocupacionPorcentaje = totalCapacidad > 0 ? Math.round((totalReservas / totalCapacidad) * 100) : 0
  const montoFinalCalculado = calcularMontoFinal(
    pagoSeleccionado.monto,
    pagoSeleccionado.retencion,
    pagoSeleccionado.reajuste,
    pagoSeleccionado.tipoReajuste,
  )

  // Función para obtener el color de la categoría
  const getColorCategoria = (categoria: CategoriaInstructor) => {
    switch (categoria) {
      case "EMBAJADOR_SENIOR":
        return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800"
      case "EMBAJADOR":
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800"
      case "EMBAJADOR_JUNIOR":
        return "bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/50 dark:text-teal-300 dark:border-teal-800"
      case "INSTRUCTOR":
        return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
    }
  }

  // Función para verificar si un requisito se cumple
  const cumpleRequisito = (valor: number | boolean, requisito: number | boolean, esMinimo = true) => {
    if (typeof valor === "boolean" && typeof requisito === "boolean") {
      return valor === requisito
    }

    if (typeof valor === "number" && typeof requisito === "number") {
      return esMinimo ? valor >= requisito : valor <= requisito
    }

    return false
  }

  // Función para obtener el porcentaje de progreso para un requisito
  const getProgresoRequisito = (valor: number, requisito: number, max: number = requisito * 1.5) => {
    if (requisito === 0) return 100
    const progreso = (valor / requisito) * 100
    return Math.min(progreso, 100)
  }

  // Agregar una función para convertir la categoría a un valor numérico para comparaciones
  const getCategoriaValue = (categoria: CategoriaInstructor): number => {
    switch (categoria) {
      case "INSTRUCTOR":
        return 1
      case "EMBAJADOR_JUNIOR":
        return 2
      case "EMBAJADOR":
        return 3
      case "EMBAJADOR_SENIOR":
        return 4
      default:
        return 0
    }
  }

  // Agregar una función para formatear el nombre de la categoría
  const formatearCategoria = (categoria: CategoriaInstructor): string => {
    switch (categoria) {
      case "EMBAJADOR_SENIOR":
        return "Embajador Senior"
      case "EMBAJADOR":
        return "Embajador"
      case "EMBAJADOR_JUNIOR":
        return "Embajador Junior"
      case "INSTRUCTOR":
        return "Instructor"
      default:
        return categoria
    }
  }

  async function actualizarCategoriaInstructor() {
    if (!instructor || !categoriaSeleccionada || !categoriaCalculada) return

    try {
      // Actualizar la categoría en la base de datos
      const categoriaActualizada = {
        ...categoriaSeleccionada,
        categoria: categoriaCalculada,
      }

      // Actualizar la categoría en el array de categorías del instructor
      const categoriasPorDisciplina = instructor.categorias || []
      const nuevasCategorias = [...categoriasPorDisciplina]

      const index = nuevasCategorias.findIndex(
        (cat) =>
          cat.disciplinaId === categoriaSeleccionada.disciplinaId && cat.periodoId === categoriaSeleccionada.periodoId,
      )

      if (index !== -1) {
        nuevasCategorias[index] = categoriaActualizada
      }

      // Actualizar el instructor con las categorías actualizadas
      const instructorActualizado = {
        ...instructor,
        categorias: nuevasCategorias,
      }

      await actualizarInstructor(instructor.id, instructorActualizado)

      toast({
        title: "Categoría actualizada",
        description: `La categoría del instructor para ${disciplinaSeleccionada?.nombre || "esta disciplina"} ha sido actualizada de ${categoriaPrevia} a ${categoriaCalculada}.`,
      })

      // Recargar el instructor para obtener datos actualizados
      await fetchInstructor(instructor.id)
    } catch (error) {
      toast({
        title: "Error al actualizar categoría",
        description: error instanceof Error ? error.message : "Error desconocido al actualizar categoría",
        variant: "destructive",
      })
    } finally {
      setShowCategoriaDialog(false)
      setCategoriaCalculada(null)
      setCategoriaPrevia(null)
      setDisciplinaSeleccionada(undefined)
      setCategoriaSeleccionada(null)
    }
  }

  // Actualizar la función getOcupacionColor para usar colores globales

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card rounded-lg p-4 shadow-sm border">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/pagos")}
            className="h-10 w-10 shrink-0 bg-card border hover:bg-muted/10 hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Detalle de Pago</h1>
            <div className="flex items-center mt-1">
              <Badge variant="outline" className={`mr-2 font-medium ${getEstadoColor(pagoSeleccionado.estado)}`}>
                {pagoSeleccionado.estado}
              </Badge>
              <div className="flex items-center">
                <p className="text-muted-foreground">
                  {instructor.nombre} - {periodo ? `Periodo ${periodo.numero} - ${periodo.año}` : ""}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-6 w-6 p-0 rounded-full hover:bg-muted/10"
                  onClick={() => router.push(`/admin/instructores/${instructor.id}`)}
                  title="Ver perfil del instructor"
                >
                  <Users className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0 w-full md:w-auto justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 bg-card border hover:bg-muted/10">
                <Download className="mr-2 h-4 w-4" />
                Exportar
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border">
              <DropdownMenuItem className="cursor-pointer hover:bg-muted/10" onClick={handleExportPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Exportar a PDF
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-muted/10" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <Card className="border overflow-hidden bg-card">
        <CardHeader className="border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 bg-card">
          <div>
            <CardTitle className="text-xl text-foreground">Información del Pago</CardTitle>
            <CardDescription className="mt-1 text-muted-foreground">
              Detalles y estado del pago para {instructor.nombre}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted/10 rounded-md px-3 py-1.5 border">
              <span className="text-sm font-medium mr-2 text-muted-foreground">Estado:</span>
              <Badge variant="outline" className={`${getEstadoColor(pagoSeleccionado.estado)} ml-1`}>
                {pagoSeleccionado.estado}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleEstadoPago}
              className="bg-card border hover:bg-muted/10 hover:text-foreground"
            >
              {pagoSeleccionado.estado === "PENDIENTE" ? "Aprobar" : "Pendiente"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Custom Tabs */}
          <div className="w-full mb-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("detalles")}
                className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                  activeTab === "detalles" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Detalles del Pago
                </div>
                {activeTab === "detalles" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
              </button>
              <button
                onClick={() => setActiveTab("clases")}
                className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                  activeTab === "clases" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Clases Incluidas
                </div>
                {activeTab === "clases" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
              </button>
              <button
                onClick={() => setActiveTab("categoria")}
                className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                  activeTab === "categoria" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center">
                  <Award className="h-4 w-4 mr-2" />
                  Categoría y Métricas
                </div>
                {activeTab === "categoria" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-4">
            {/* Detalles Tab */}
            {activeTab === "detalles" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-foreground">Información General</h3>
                      <div className="ml-2 px-2 py-0.5 bg-primary/10 rounded text-xs font-medium text-primary">
                        ID: {pagoSeleccionado.id}
                      </div>
                    </div>
                    <Separator className="my-2 bg-border" />

                    <div className="grid grid-cols-1 gap-3 bg-muted/10 p-4 rounded-lg border">
                      <div className="flex justify-between items-center py-1 border-b border-dashed">
                        <div className="text-sm font-medium text-muted-foreground">Instructor:</div>
                        <div className="font-medium text-foreground">{instructor.nombre}</div>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-dashed">
                        <div className="text-sm font-medium text-muted-foreground">Periodo:</div>
                        <div>
                          <span className="px-2 py-0.5 bg-primary/10 rounded-full text-xs font-medium text-primary">
                            {periodo.numero} - {periodo.año}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-dashed">
                        <div className="text-sm font-medium text-muted-foreground">Estado:</div>
                        <Badge variant="outline" className={getEstadoColor(pagoSeleccionado.estado)}>
                          {pagoSeleccionado.estado}
                        </Badge>
                      </div>

                      <div className="mt-2 pt-2 border-t">
                        <div className="text-sm font-medium mb-2 text-muted-foreground">Desglose del Pago:</div>
                        <div className="space-y-2 bg-card p-3 rounded-md shadow-sm">
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">Monto Base:</div>
                            <div className="font-medium text-foreground">{formatCurrency(pagoSeleccionado.monto)}</div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">Retención:</div>
                            <div className="text-rose-600 font-medium">
                              -{formatCurrency(pagoSeleccionado.retencion)}
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">Reajuste:</div>
                            {editandoReajuste ? (
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={nuevoReajuste}
                                    onChange={(e) => setNuevoReajuste(Number(e.target.value))}
                                    className="w-24 h-8 px-2 border rounded text-right focus:outline-none focus:ring-primary focus:border-primary"
                                    step="0.01"
                                  />
                                  <div className="flex items-center">
                                    {isActualizandoReajuste ? (
                                      <div className="flex items-center justify-center w-8 h-8">
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                      </div>
                                    ) : (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8 px-2 py-0 border hover:bg-muted/10 hover:text-foreground"
                                          onClick={actualizarReajuste}
                                        >
                                          <Check className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 px-2 py-0 hover:bg-muted/10"
                                          onClick={() => setEditandoReajuste(false)}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <RadioGroup
                                  value={tipoReajuste}
                                  onValueChange={(value) => setTipoReajuste(value as TipoReajuste)}
                                  className="flex space-x-2"
                                >
                                  <div className="flex items-center space-x-1">
                                    <RadioGroupItem value="FIJO" id="fijo" className="h-4 w-4" />
                                    <Label htmlFor="fijo" className="text-xs text-muted-foreground">
                                      Fijo
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <RadioGroupItem value="PORCENTAJE" id="porcentaje" className="h-4 w-4" />
                                    <Label htmlFor="porcentaje" className="text-xs text-muted-foreground">
                                      Porcentaje
                                    </Label>
                                  </div>
                                </RadioGroup>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div
                                  className={
                                    pagoSeleccionado.reajuste >= 0
                                      ? "text-emerald-600 font-medium"
                                      : "text-rose-600 font-medium"
                                  }
                                >
                                  {pagoSeleccionado.tipoReajuste === "PORCENTAJE"
                                    ? `${pagoSeleccionado.reajuste >= 0 ? "+" : ""}${pagoSeleccionado.reajuste}%`
                                    : `${pagoSeleccionado.reajuste >= 0 ? "+" : ""}${formatCurrency(pagoSeleccionado.reajuste)}`}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-muted/10"
                                  onClick={() => {
                                    setNuevoReajuste(pagoSeleccionado.reajuste)
                                    setTipoReajuste(pagoSeleccionado.tipoReajuste)
                                    setEditandoReajuste(true)
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>

                          <Separator className="my-1 bg-border" />

                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium text-muted-foreground">Monto Final:</div>
                            <div className="font-bold text-lg text-primary">{formatCurrency(montoFinalCalculado)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center py-1 text-xs text-muted-foreground mt-2">
                        <div>Creado: {new Date(pagoSeleccionado.createdAt!).toLocaleDateString()}</div>
                        <div>
                          Actualizado:{" "}
                          {pagoSeleccionado.updatedAt ? new Date(pagoSeleccionado.updatedAt).toLocaleDateString() : "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-foreground">Resumen del Cálculo</h3>
                      <Separator className="my-2 bg-border" />
                    </div>

                    <div className="grid grid-cols-1 gap-3 bg-muted/10 p-4 rounded-lg border">
                      <div className="flex items-center justify-between py-2 border-b">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-primary" />
                          <span className="font-medium text-muted-foreground">Total de Clases:</span>
                        </div>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {pagoSeleccionado.detalles?.resumen?.totalClases || clasesInstructor.length}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-primary" />
                          <span className="font-medium text-muted-foreground">Ocupación Promedio:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative w-24 h-3 bg-border rounded-full overflow-hidden">
                            <div
                              className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                                ocupacionPromedio >= 80
                                  ? "bg-emerald-500"
                                  : ocupacionPromedio >= 50
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                              }`}
                              style={{ width: `${Math.min(ocupacionPromedio, 100)}%` }}
                            >
                              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-white">
                                {ocupacionPromedio}%
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`${
                              ocupacionPromedio >= 80
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                : ocupacionPromedio >= 50
                                  ? "bg-amber-50 text-amber-600 border-amber-200"
                                  : "bg-rose-50 text-rose-600 border-rose-200"
                            }`}
                          >
                            {ocupacionPromedio}%
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-primary" />
                          <span className="font-medium text-muted-foreground">Total Reservas:</span>
                        </div>
                        <div className="font-medium text-foreground">
                          {totalReservas} / {totalCapacidad}
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b">
                        <div className="flex items-center">
                          <Percent className="h-4 w-4 mr-2 text-primary" />
                          <span className="font-medium text-muted-foreground">Tipo de Reajuste:</span>
                        </div>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {pagoSeleccionado.tipoReajuste}
                        </Badge>
                      </div>

                      <div className="mt-2">
                        <div className="text-sm font-medium mb-2 text-muted-foreground">Comentarios:</div>
                        <div className="text-sm bg-card p-3 rounded-md shadow-sm text-muted-foreground">
                          {pagoSeleccionado.detalles?.resumen?.comentarios || "Sin comentarios"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Clases Tab */}
            {activeTab === "clases" && (
              <div className="space-y-6">
                {clasesInstructor.length === 0 ? (
                  <div className="text-center py-8 bg-muted/10 rounded-lg border">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium text-foreground">No hay clases registradas</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      El instructor no tiene clases asignadas en este periodo.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden bg-card">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-accent/5 border-b border-border/40">
                          <TableRow>
                            <TableHead className="text-accent font-medium whitespace-nowrap">Fecha</TableHead>
                            <TableHead className="text-accent font-medium whitespace-nowrap">Disciplina</TableHead>
                            <TableHead className="text-accent font-medium whitespace-nowrap">Estudio</TableHead>
                            <TableHead className="text-accent font-medium whitespace-nowrap">Reservas</TableHead>
                            <TableHead className="text-accent font-medium whitespace-nowrap">Lista Espera</TableHead>
                            <TableHead className="text-accent font-medium whitespace-nowrap">Cortesías</TableHead>
                            <TableHead className="text-accent font-medium whitespace-nowrap">Monto</TableHead>
                            <TableHead className="text-accent font-medium w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {clasesInstructor.map((clase) => {
                            // Buscar el detalle de la clase en el pago
                            const detalleClase = pagoSeleccionado.detalles?.clases?.find(
                              (d: any) => d.claseId === clase.id,
                            )

                            // Obtener la disciplina
                            const disciplina = disciplinas.find((d) => d.id === clase.disciplinaId)

                            // Calcular el porcentaje de ocupación
                            const ocupacionPorcentaje = Math.round((clase.reservasTotales / clase.lugares) * 100)

                            // Determinar el color basado en la ocupación
                            const getOcupacionColor = () => {
                              if (ocupacionPorcentaje >= 80)
                                return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/50"
                              if (ocupacionPorcentaje >= 50)
                                return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950/50"
                              return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/50"
                            }

                            return (
                              <TableRow
                                key={clase.id}
                                className="hover:bg-muted/5 transition-colors border-b border-border/30"
                              >
                                <TableCell className="font-medium whitespace-nowrap text-foreground">
                                  {new Date(clase.fecha).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="bg-primary/10 text-primary border-primary/20 font-medium"
                                    style={{
                                      backgroundColor: disciplina?.color ? `${disciplina.color}15` : undefined,
                                      color: disciplina?.color || undefined,
                                      borderColor: disciplina?.color ? `${disciplina.color}30` : undefined,
                                    }}
                                  >
                                    {disciplina?.nombre || `Disciplina ${clase.disciplinaId}`}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="text-foreground">{clase.estudio}</span>
                                    <span className="text-xs text-muted-foreground">{clase.salon}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    <div className="relative w-full max-w-[100px] bg-border rounded-full h-3 mr-2 overflow-hidden">
                                      <div
                                        className={`absolute top-0 left-0 h-full ${
                                          ocupacionPorcentaje >= 80
                                            ? "bg-green-500"
                                            : ocupacionPorcentaje >= 50
                                              ? "bg-yellow-500"
                                              : "bg-red-500"
                                        }`}
                                        style={{ width: `${Math.min(ocupacionPorcentaje, 100)}%` }}
                                      >
                                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-white">
                                          {ocupacionPorcentaje}%
                                        </span>
                                      </div>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getOcupacionColor()}`}>
                                      {clase.reservasTotales}/{clase.lugares}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  {clase.listasEspera > 0 ? (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                      {clase.listasEspera}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">0</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {clase.cortesias > 0 ? (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                      {clase.cortesias}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">0</span>
                                  )}
                                </TableCell>
                                <TableCell className="font-medium text-foreground">
                                  {detalleClase ? formatCurrency(detalleClase.montoCalculado) : "-"}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full hover:bg-muted/10"
                                  >
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Categoría Tab */}
            {activeTab === "categoria" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium flex items-center text-foreground">
                    <Award className="h-5 w-5 mr-2 text-primary" />
                    Categorías del Instructor por Disciplina
                  </h3>

                  <div className="flex items-center gap-2">
                    {editandoCategoria ? (
                      <div className="flex items-center gap-2 bg-card p-2 rounded-lg border shadow-sm">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <Label htmlFor="dobleteos" className="text-sm font-medium text-muted-foreground">
                              Dobleteos:
                            </Label>
                            <Input
                              id="dobleteos"
                              type="number"
                              value={factoresEditados.dobleteos}
                              onChange={(e) =>
                                setFactoresEditados({ ...factoresEditados, dobleteos: Number(e.target.value) })
                              }
                              className="w-20 h-8 border focus:ring-primary focus:border-primary"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <Label htmlFor="horariosNoPrime" className="text-sm font-medium text-muted-foreground">
                              Horarios No Prime:
                            </Label>
                            <Input
                              id="horariosNoPrime"
                              type="number"
                              value={factoresEditados.horariosNoPrime}
                              onChange={(e) =>
                                setFactoresEditados({ ...factoresEditados, horariosNoPrime: Number(e.target.value) })
                              }
                              className="w-20 h-8 border focus:ring-primary focus:border-primary"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <Label htmlFor="participacionEventos" className="text-sm font-medium text-muted-foreground">
                              Participación en Eventos:
                            </Label>
                            <Switch
                              id="participacionEventos"
                              checked={factoresEditados.participacionEventos}
                              onCheckedChange={(checked) =>
                                setFactoresEditados({ ...factoresEditados, participacionEventos: checked })
                              }
                              className="data-[state=checked]:bg-primary"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <Label htmlFor="cumpleLineamientos" className="text-sm font-medium text-muted-foreground">
                              Cumple Lineamientos:
                            </Label>
                            <Switch
                              id="cumpleLineamientos"
                              checked={factoresEditados.cumpleLineamientos}
                              onCheckedChange={(checked) =>
                                setFactoresEditados({ ...factoresEditados, cumpleLineamientos: checked })
                              }
                              className="data-[state=checked]:bg-primary"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={guardarFactoresEditados}
                            disabled={isActualizandoInstructor}
                            className="bg-primary hover:bg-primary/90"
                          >
                            {isActualizandoInstructor ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Check className="h-4 w-4 mr-1" />
                            )}
                            Guardar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditandoCategoria(false)}
                            disabled={isActualizandoInstructor}
                            className="border hover:bg-muted/10 text-muted-foreground"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 bg-card border hover:bg-muted/10 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditandoCategoria(true)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          <span>Editar Factores</span>
                        </Button>

                        <Button
                          variant="default"
                          size="sm"
                          className="flex items-center gap-1 bg-accent text-accent-foreground hover:bg-accent/90"
                          onClick={reevaluarTodasCategorias}
                          disabled={isActualizandoCategorias}
                        >
                          {isActualizandoCategorias ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <RotateCw className="h-4 w-4 mr-1" />
                          )}
                          <span>Reevaluar Categorías</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <Separator className="my-2 bg-border" />

                {categoriasPorDisciplina.length === 0 ? (
                  <div className="text-center py-8 bg-card rounded-lg border shadow-sm">
                    <Award className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium text-foreground">Sin categorías asignadas</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Este instructor no tiene categorías asignadas para el periodo actual.
                    </p>
                    <Button
                      variant="default"
                      size="sm"
                      className="mt-4 flex items-center gap-1 mx-auto bg-accent text-accent-foreground hover:bg-accent/90"
                      onClick={reevaluarTodasCategorias}
                      disabled={isActualizandoCategorias}
                    >
                      {isActualizandoCategorias ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <RotateCw className="h-4 w-4 mr-1" />
                      )}
                      <span>Generar Categorías</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {categoriasPorDisciplina.map((categoria, index) => {
                      // Obtener la disciplina asociada a esta categoría
                      const disciplina = disciplinas.find((d) => d.id === categoria.disciplinaId)

                      // Calcular métricas reales para esta disciplina
                      const metricasReales = calcularMetricas(clasesInstructor, categoria.disciplinaId)

                      return (
                        <Card key={index} className="border overflow-hidden bg-card shadow-sm">
                          <CardHeader className="border-b bg-card">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <div
                                  className="w-3 h-3 rounded-full mr-2"
                                  style={{
                                    backgroundColor: disciplina?.color || "#6366F1",
                                  }}
                                ></div>
                                <CardTitle className="text-lg text-foreground font-bold">
                                  {disciplina?.nombre || `Disciplina ${categoria.disciplinaId}`}
                                </CardTitle>
                              </div>
                              <Badge className={`${getColorCategoria(categoria.categoria)} text-sm px-3 py-1 border`}>
                                {formatearCategoria(categoria.categoria)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                              <div className="p-4 border-r border-b md:border-b-0 border">
                                <h4 className="text-sm font-medium mb-3 flex items-center text-foreground">
                                  <Users className="h-4 w-4 mr-2 text-primary" />
                                  Métricas de Rendimiento (Reales)
                                </h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Ocupación:</span>
                                    <div className="flex items-center gap-2">
                                      <div className="relative w-24 h-3 bg-border rounded-full overflow-hidden">
                                        <div
                                          className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                                            metricasReales.ocupacion >= 80
                                              ? "bg-emerald-500"
                                              : metricasReales.ocupacion >= 50
                                                ? "bg-amber-500"
                                                : "bg-rose-500"
                                          }`}
                                          style={{ width: `${Math.min(metricasReales.ocupacion, 100)}%` }}
                                        >
                                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-white">
                                            {metricasReales.ocupacion}%
                                          </span>
                                        </div>
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className={`${
                                          metricasReales.ocupacion >= 80
                                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                            : metricasReales.ocupacion >= 50
                                              ? "bg-amber-50 text-amber-600 border-amber-200"
                                              : "bg-rose-50 text-rose-600 border-rose-200"
                                        }`}
                                      >
                                        {metricasReales.ocupacion}%
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Total Clases:</span>
                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                      {metricasReales.clases}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Locales en Lima:</span>
                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                      {metricasReales.localesEnLima}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <div className="p-4">
                                <h4 className="text-sm font-medium mb-3 flex items-center text-foreground">
                                  <Award className="h-4 w-4 mr-2 text-primary" />
                                  Factores de Categorización
                                </h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Dobleteos:</span>
                                    <Badge
                                      variant="outline"
                                      className={
                                        cumpleRequisito(
                                          instructor.dobleteos || 0,
                                          formulas.length > 0 && categoria
                                            ? formulas.find((f) => f.disciplinaId === categoria.disciplinaId)
                                                ?.requisitosCategoria[categoria.categoria]?.dobleteos || 0
                                            : 0,
                                        )
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : "bg-amber-50 text-amber-700 border-amber-200"
                                      }
                                    >
                                      {instructor.dobleteos || 0}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Horarios No Prime:</span>
                                    <Badge
                                      variant="outline"
                                      className={
                                        cumpleRequisito(
                                          instructor.horariosNoPrime || 0,
                                          formulas.length > 0 && categoria
                                            ? formulas.find((f) => f.disciplinaId === categoria.disciplinaId)
                                                ?.requisitosCategoria[categoria.categoria]?.horariosNoPrime || 0
                                            : 0,
                                        )
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : "bg-amber-50 text-amber-700 border-amber-200"
                                      }
                                    >
                                      {instructor.horariosNoPrime || 0}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Participación en Eventos:</span>
                                    <div className="flex items-center">
                                      {instructor.participacionEventos ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mr-1" />
                                      ) : formulas.length > 0 &&
                                        categoria &&
                                        formulas.find((f) => f.disciplinaId === categoria.disciplinaId)
                                          ?.requisitosCategoria[categoria.categoria]?.participacionEventos ? (
                                        <XCircle className="h-4 w-4 text-rose-600 mr-1" />
                                      ) : (
                                        <Info className="h-4 w-4 text-muted-foreground mr-1" />
                                      )}
                                      <Badge
                                        variant="outline"
                                        className={
                                          instructor.participacionEventos
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : formulas.length > 0 &&
                                                categoria &&
                                                formulas.find((f) => f.disciplinaId === categoria.disciplinaId)
                                                  ?.requisitosCategoria[categoria.categoria]?.participacionEventos
                                              ? "bg-rose-50 text-rose-700 border-rose-200"
                                              : "bg-muted/10 text-muted-foreground border"
                                        }
                                      >
                                        {instructor.participacionEventos ? "Sí" : "No"}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Cumple Lineamientos:</span>
                                    <div className="flex items-center">
                                      {instructor.cumpleLineamientos ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mr-1" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-rose-600 mr-1" />
                                      )}
                                      <Badge
                                        variant="outline"
                                        className={
                                          instructor.cumpleLineamientos
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : "bg-rose-50 text-rose-700 border-rose-200"
                                        }
                                      >
                                        {instructor.cumpleLineamientos ? "Sí" : "No"}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 border-t bg-muted/10">
                              <div className="flex justify-between items-center">
                                <div className="text-xs text-muted-foreground">
                                  Última actualización:{" "}
                                  {categoria.updatedAt
                                    ? new Date(categoria.updatedAt).toLocaleDateString()
                                    : "No disponible"}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}

                    {/* Replace the section that shows the criteria with this updated version */}
                    <div className="bg-card p-4 rounded-lg border shadow-sm">
                      <h4 className="text-sm font-medium mb-3 text-foreground">
                        Criterios de Categorización por Disciplina
                      </h4>

                      {disciplinas.length > 0 && formulas.length > 0 ? (
                        <div className="space-y-4">
                          {disciplinas
                            .filter((d) =>
                              // Filter to only include disciplines that the instructor has taught
                              clasesInstructor.some((c) => c.disciplinaId === d.id),
                            )
                            .map((disciplina) => {
                              // Find the formula for this specific discipline
                              const disciplinaFormula =
                                formulas.find((f) => f.disciplinaId === disciplina.id) || formulas[0]
                              const requisitos = disciplinaFormula.requisitosCategoria

                              return (
                                <div key={disciplina.id} className="mb-4">
                                  <div className="flex items-center mb-2">
                                    <div
                                      className="w-3 h-3 rounded-full mr-2"
                                      style={{ backgroundColor: disciplina.color || "#6366F1" }}
                                    ></div>
                                    <h5 className="font-medium text-foreground">{disciplina.nombre}</h5>
                                  </div>

                                  <div className="space-y-2 bg-muted/10 p-3 rounded-md">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="font-medium flex items-center">
                                        <Badge className={`${getColorCategoria("EMBAJADOR_SENIOR")} mr-2 text-xs`}>
                                          Embajador Senior
                                        </Badge>
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        Ocupación ≥ {requisitos.EMBAJADOR_SENIOR.ocupacion}%, ≥{" "}
                                        {requisitos.EMBAJADOR_SENIOR.localesEnLima} locales, ≥{" "}
                                        {requisitos.EMBAJADOR_SENIOR.clases} clases, ≥{" "}
                                        {requisitos.EMBAJADOR_SENIOR.dobleteos} dobleteos, ≥{" "}
                                        {requisitos.EMBAJADOR_SENIOR.horariosNoPrime} horarios no prime
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                      <span className="font-medium flex items-center">
                                        <Badge className={`${getColorCategoria("EMBAJADOR")} mr-2 text-xs`}>
                                          Embajador
                                        </Badge>
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        Ocupación ≥ {requisitos.EMBAJADOR.ocupacion}%, ≥{" "}
                                        {requisitos.EMBAJADOR.localesEnLima} locales, ≥ {requisitos.EMBAJADOR.clases}{" "}
                                        clases, ≥ {requisitos.EMBAJADOR.dobleteos} dobleteos, ≥{" "}
                                        {requisitos.EMBAJADOR.horariosNoPrime} horarios no prime ≥{" "}
                                        {requisitos.EMBAJADOR.horariosNoPrime} horarios no prime
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                      <span className="font-medium flex items-center">
                                        <Badge className={`${getColorCategoria("EMBAJADOR_JUNIOR")} mr-2 text-xs`}>
                                          Embajador Junior
                                        </Badge>
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        Ocupación ≥ {requisitos.EMBAJADOR_JUNIOR.ocupacion}%, ≥{" "}
                                        {requisitos.EMBAJADOR_JUNIOR.localesEnLima} locales, ≥{" "}
                                        {requisitos.EMBAJADOR_JUNIOR.clases} clases, ≥{" "}
                                        {requisitos.EMBAJADOR_JUNIOR.dobleteos} dobleteos, ≥{" "}
                                        {requisitos.EMBAJADOR_JUNIOR.horariosNoPrime} horarios no prime
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                      <span className="font-medium flex items-center">
                                        <Badge className={`${getColorCategoria("INSTRUCTOR")} mr-2 text-xs`}>
                                          Instructor
                                        </Badge>
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        Ocupación {"< "}
                                        {requisitos.EMBAJADOR_JUNIOR.ocupacion}% o{"< "}
                                        {requisitos.EMBAJADOR_JUNIOR.clases} clases o no cumple lineamientos
                                      </span>
                                    </div>

                                    {/* Additional requirements specific to this discipline */}
 
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <div className="text-muted-foreground">Cargando información de requisitos...</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showCategoriaDialog} onOpenChange={setShowCategoriaDialog}>
        <AlertDialogContent className="bg-card border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-foreground">
              <RefreshCw className="h-5 w-5 mr-2 text-primary" />
              Cambio de Categoría Detectado
            </AlertDialogTitle>
            <div className="mb-2">
              <span className="font-medium text-muted-foreground">Disciplina:</span>{" "}
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {disciplinaSeleccionada?.nombre || "Disciplina"}
              </Badge>
            </div>
            <AlertDialogDescription className="text-muted-foreground">
              Basado en los parámetros actuales, la categoría del instructor debería cambiar de{" "}
              <Badge className={`${getColorCategoria(categoriaPrevia || "INSTRUCTOR")} mx-1`}>
                {formatearCategoria(categoriaPrevia || "INSTRUCTOR")}
              </Badge>
              a{" "}
              <Badge className={`${getColorCategoria(categoriaCalculada || "INSTRUCTOR")} mx-1`}>
                {formatearCategoria(categoriaCalculada || "INSTRUCTOR")}
              </Badge>
            </AlertDialogDescription>

            {categoriaCalculada && categoriaPrevia && (
              <div className="mt-2 flex items-center justify-center">
                {getCategoriaValue(categoriaCalculada) > getCategoriaValue(categoriaPrevia) ? (
                  <div className="flex items-center text-emerald-600">
                    <ArrowUpCircle className="h-5 w-5 mr-1" />
                    <span>Promoción</span>
                  </div>
                ) : (
                  <div className="flex items-center text-amber-600">
                    <ArrowDownCircle className="h-5 w-5 mr-1" />
                    <span>Descenso</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 p-3 bg-muted/10 rounded-md border text-sm">
              <p className="text-muted-foreground">Este cambio puede afectar:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                <li>La tarifa de pago por clase para esta disciplina</li>
                <li>El mínimo garantizado</li>
                <li>Los bonos aplicables</li>
                <li>Otros beneficios asociados a la categoría</li>
              </ul>
            </div>

            <AlertDialogDescription className="mt-4 text-muted-foreground">
              ¿Desea actualizar la categoría del instructor para esta disciplina?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border text-muted-foreground hover:bg-muted/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => actualizarCategoriaInstructor()}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Actualizar Categoría
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showResumenDialog} onOpenChange={setShowResumenDialog}>
        <AlertDialogContent className="bg-card border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-foreground">
              <RotateCw className="h-5 w-5 mr-2 text-primary" />
              Resumen de Cambios en Categorías
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Se han realizado los siguientes cambios en las categorías del instructor:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            {cambiosCategorias.length > 0 ? (
              <div className="space-y-3">
                {cambiosCategorias.map((cambio, index) => (
                  <div key={index} className="bg-muted/10 p-3 rounded-md border">
                    <div className="font-medium mb-1 text-foreground">{cambio.disciplina}</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Badge className={`${getColorCategoria(cambio.categoriaAnterior)} mr-2`}>
                          {formatearCategoria(cambio.categoriaAnterior)}
                        </Badge>
                      </div>
                      <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                      <div className="flex items-center">
                        <Badge className={`${getColorCategoria(cambio.categoriaNueva)}`}>
                          {formatearCategoria(cambio.categoriaNueva)}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {getCategoriaValue(cambio.categoriaNueva) > getCategoriaValue(cambio.categoriaAnterior) ? (
                        <div className="flex items-center text-emerald-600">
                          <ArrowUpCircle className="h-4 w-4 mr-1" />
                          <span>Promoción</span>
                        </div>
                      ) : getCategoriaValue(cambio.categoriaNueva) < getCategoriaValue(cambio.categoriaAnterior) ? (
                        <div className="flex items-center text-amber-600">
                          <ArrowDownCircle className="h-4 w-4 mr-1" />
                          <span>Descenso</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-blue-600">
                          <RefreshCw className="h-4 w-4 mr-1" />
                          <span>Sin cambio</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-muted-foreground">No se realizaron cambios en las categorías</div>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-accent text-accent-foreground hover:bg-accent/90">
              Aceptar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
