"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { downloadPagoPDF, printPagoPDF } from "@/utils/pago-instructor-pdf"
import { retencionValor } from "@/utils/const"
import type { EstadoPago, TipoReajuste, Instructor, Periodo, Clase, CategoriaInstructor } from "@/types/schema"

// Store imports
import { usePagosStore } from "@/store/usePagosStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useClasesStore } from "@/store/useClasesStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { useFormulasStore } from "@/store/useFormulaStore"
import { useAuthStore } from "@/store/useAuthStore"

// Update the component imports to use the correct paths
import { PageHeader } from "@/components/payments/pago-detail/page-header"
import { LoadingSkeleton } from "@/components/payments/pago-detail/loading-skeleton"
import { PaymentDetails } from "@/components/payments/pago-detail/payment-detail"
import { ClassesTab } from "@/components/payments/pago-detail/clases-tab"
import { CategoryTab } from "@/components/payments/pago-detail/category-tab"

// UI components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, Award, ArrowRight, Lock } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

// CategoryChangeDialog component
import { mostrarCategoriaVisual } from "@/utils/config"
import { DashboardShell } from "@/components/dashboard/shell"

interface CategoryChangeDialogProps {
  showCategoriaDialog: boolean
  setShowCategoriaDialog: (show: boolean) => void
  disciplinaSeleccionada: any | undefined
  categoriaPrevia: CategoriaInstructor | null
  categoriaCalculada: CategoriaInstructor | null
  getColorCategoria: (categoria: CategoriaInstructor) => string
  formatearCategoria: (categoria: CategoriaInstructor) => string
  getCategoriaValue: (categoria: CategoriaInstructor) => number
  actualizarCategoriaInstructor: () => Promise<void>
}

function CategoryChangeDialogComponent({
  showCategoriaDialog,
  setShowCategoriaDialog,
  disciplinaSeleccionada,
  categoriaPrevia,
  categoriaCalculada,
  getColorCategoria,
  formatearCategoria,
  getCategoriaValue,
  actualizarCategoriaInstructor,
}: CategoryChangeDialogProps) {
  return (
    <AlertDialog open={showCategoriaDialog} onOpenChange={setShowCategoriaDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar cambio de categoría</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Basado en los parámetros actuales, la categoría del instructor debería cambiar de{" "}
            {/* Category badges hidden */}
            <span className="font-medium">{formatearCategoria(categoriaPrevia || "INSTRUCTOR")}</span>a{" "}
            <span className="font-medium">{formatearCategoria(categoriaCalculada || "INSTRUCTOR")}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowCategoriaDialog(false)}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={actualizarCategoriaInstructor}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ChangeSummaryDialog component
interface ChangeSummaryDialogProps {
  showResumenDialog: boolean
  setShowResumenDialog: (show: boolean) => void
  cambiosCategorias: Array<{
    disciplina: string
    categoriaAnterior: CategoriaInstructor
    categoriaNueva: CategoriaInstructor
  }>
  getColorCategoria: (categoria: CategoriaInstructor) => string
  formatearCategoria: (categoria: CategoriaInstructor) => string
  getCategoriaValue: (categoria: CategoriaInstructor) => number
  disciplinas: any[]
}

function ChangeSummaryDialogComponent({
  showResumenDialog,
  setShowResumenDialog,
  cambiosCategorias,
  getColorCategoria,
  formatearCategoria,
  getCategoriaValue,
  disciplinas,
}: ChangeSummaryDialogProps) {
  // Filter the changes to only include disciplines with visual categories
  const filteredCambios = cambiosCategorias.filter((cambio) => {
    // Find the discipline in the disciplinas array
    const disciplina = disciplinas.find((d) => d.nombre === cambio.disciplina)
    // Only include if the discipline should have a visual category
    return disciplina && mostrarCategoriaVisual(disciplina.nombre)
  })

  return (
    <AlertDialog open={showResumenDialog} onOpenChange={setShowResumenDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resumen de cambios de categoría</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Se han detectado los siguientes cambios en las categorías de los instructores.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          {filteredCambios.length > 0 ? (
            <div className="grid gap-4">
              {filteredCambios.map((cambio, index) => (
                <div key={index} className="grid grid-cols-[2fr_1fr_2fr] gap-2 items-center">
                  <div className="text-sm font-medium text-muted-foreground">{cambio.disciplina}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {/* Category badges hidden */}
                      <span className="font-medium">{formatearCategoria(cambio.categoriaAnterior)}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                    <div className="flex items-center">
                      {/* Category badges hidden */}
                      <span className="font-medium">{formatearCategoria(cambio.categoriaNueva)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-muted-foreground">
                {cambiosCategorias.length > 0
                  ? "No hay cambios en disciplinas con categorización visual."
                  : "No se realizaron cambios en las categorías."}
              </div>
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setShowResumenDialog(false)}>Aceptar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default function PagoDetallePage() {
  const router = useRouter()
  const params = useParams()
  const pagoId = Number.parseInt(params.id as string)

  // Store hooks
  const { pagoSeleccionado, fetchPago, actualizarPago, isLoading: isLoadingPagos } = usePagosStore()
  const { instructores, fetchInstructores, actualizarInstructor, fetchInstructor } = useInstructoresStore()
  const { periodos, fetchPeriodos } = usePeriodosStore()
  const { clases, fetchClases, isLoading: isLoadingClases } = useClasesStore()
  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()
  const { formulas, fetchFormulas } = useFormulasStore()

  // Auth store para verificar si el usuario es un instructor
  const userType = useAuthStore((state) => state.userType)
  const isInstructor = userType === "instructor"

  // Local state
  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [periodo, setPeriodo] = useState<Periodo | null>(null)
  const [clasesInstructor, setClasesInstructor] = useState<Clase[]>([])
  const [isActualizandoReajuste, setIsActualizandoReajuste] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>("detalles")
  const [editandoReajuste, setEditandoReajuste] = useState<boolean>(false)
  const [nuevoReajuste, setNuevoReajuste] = useState<number>(0)
  const [tipoReajuste, setTipoReajuste] = useState<TipoReajuste>("FIJO")

  // Category editing state
  const [editandoCategoria, setEditandoCategoria] = useState<boolean>(false)
  const [isActualizandoInstructor, setIsActualizandoInstructor] = useState<boolean>(false)
  const [isActualizandoCategorias, setIsActualizandoCategorias] = useState<boolean>(false)
  const [categoriaCalculada, setCategoriaCalculada] = useState<CategoriaInstructor | null>(null)
  const [showCategoriaDialog, setShowCategoriaDialog] = useState<boolean>(false)
  const [categoriaPrevia, setCategoriaPrevia] = useState<CategoriaInstructor | null>(null)
  const [disciplinaSeleccionada, setDisciplinaSeleccionada] = useState<any | undefined>(undefined)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<any | null>(null)

  // Edited factors state
  const [factoresEditados, setFactoresEditados] = useState({
    dobleteos: 0,
    horariosNoPrime: 0,
    participacionEventos: false,
    cumpleLineamientos: false,
  })

  // Change summary dialog state
  const [showResumenDialog, setShowResumenDialog] = useState<boolean>(false)
  const [cambiosCategorias, setCambiosCategorias] = useState<
    Array<{
      disciplina: string
      categoriaAnterior: CategoriaInstructor
      categoriaNueva: CategoriaInstructor
    }>
  >([])

  // Load initial data
  useEffect(() => {
    fetchPago(pagoId)
    fetchInstructores()
    fetchPeriodos()
    fetchDisciplinas()
    fetchFormulas()
  }, [pagoId, fetchPago, fetchInstructores, fetchPeriodos, fetchDisciplinas, fetchFormulas])

  useEffect(() => {
    if (
      activeTab === "categoria" &&
      disciplinas.length > 0 &&
      !disciplinas.some((d) => mostrarCategoriaVisual(d.nombre))
    ) {
      setActiveTab("detalles")
    }
  }, [activeTab, disciplinas])

  // Set instructor and period when data is loaded
  useEffect(() => {
    if (pagoSeleccionado && instructores.length > 0 && periodos.length > 0) {
      const instructorEncontrado = instructores.find((i) => i.id === pagoSeleccionado.instructorId) || null
      setInstructor(instructorEncontrado)

      if (instructorEncontrado) {
        setFactoresEditados({
          cumpleLineamientos: pagoSeleccionado.cumpleLineamientos || false,
          dobleteos: pagoSeleccionado.dobleteos || 0,
          horariosNoPrime: pagoSeleccionado.horariosNoPrime || 0,
          participacionEventos: pagoSeleccionado.participacionEventos || false,
        })

        // Load complete instructor with categories
        fetchInstructor(instructorEncontrado.id)
      }

      setPeriodo(periodos.find((p) => p.id === pagoSeleccionado.periodoId) || null)

      // Load instructor's classes for this period
      if (pagoSeleccionado.instructorId && pagoSeleccionado.periodoId) {
        fetchClases({
          instructorId: pagoSeleccionado.instructorId,
          periodoId: pagoSeleccionado.periodoId,
        })
      }

      // Initialize reajuste values
      setNuevoReajuste(pagoSeleccionado.reajuste)
      setTipoReajuste(pagoSeleccionado.tipoReajuste)
    }
  }, [pagoSeleccionado, instructores, periodos, fetchClases, fetchInstructor])

  // Update instructor classes when classes are loaded
  useEffect(() => {
    if (clases.length > 0 && pagoSeleccionado) {
      setClasesInstructor(
        clases.filter(
          (c) => c.instructorId === pagoSeleccionado.instructorId && c.periodoId === pagoSeleccionado.periodoId,
        ),
      )
    }
  }, [clases, pagoSeleccionado])

  // Helper functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(amount)
  }

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

  const calcularMontoFinal = (
    monto: number,
    retencion: number,
    reajuste: number,
    tipoReajuste: TipoReajuste,
    bono = 0,
  ): number => {
    const reajusteCalculado = tipoReajuste === "PORCENTAJE" ? (monto * reajuste) / 100 : reajuste
    const montoAjustado = monto + reajusteCalculado + bono
    return montoAjustado - retencion
  }

  // Function to update reajuste
  const actualizarReajuste = async () => {
    if (!pagoSeleccionado) return

    setIsActualizandoReajuste(true)

    try {
      // Calculate the adjusted amount first
      const montoBase = pagoSeleccionado.monto
      const bono = pagoSeleccionado.bono || 0
      const reajusteCalculado = tipoReajuste === "PORCENTAJE" ? (montoBase * nuevoReajuste) / 100 : nuevoReajuste

      // Calculate the retention based on the adjusted amount
      const montoAjustado = montoBase + reajusteCalculado + bono
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

  // Function to calculate metrics
  const calcularMetricas = (clases: Clase[], disciplinaId?: number) => {
    // If disciplinaId is provided, filter only classes for that discipline
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

    // Calculate average occupancy
    const totalReservas = clasesFiltradas.reduce((sum, clase) => sum + clase.reservasTotales, 0)
    const totalCapacidad = clasesFiltradas.reduce((sum, clase) => sum + clase.lugares, 0)
    const ocupacionPromedio = totalCapacidad > 0 ? Math.round((totalReservas / totalCapacidad) * 100) : 0

    // Count classes
    const totalClases = clasesFiltradas.length / 4

    // Count unique locations in Lima
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

  // Function to evaluate instructor category
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

    // If doesn't meet guidelines, can't be more than INSTRUCTOR
    if (!instructorParams.cumpleLineamientos) return "INSTRUCTOR"

    // Check requirements for EMBAJADOR_SENIOR
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

    // Check requirements for EMBAJADOR
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

    // Check requirements for EMBAJADOR_JUNIOR
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

    // If doesn't meet any higher category, it's INSTRUCTOR
    return "INSTRUCTOR"
  }

  // Function to reevaluate all categories
  const reevaluarTodasCategorias = async () => {
    if (!instructor || !pagoSeleccionado || !periodo) return

    setIsActualizandoCategorias(true)

    try {
      // 1. Get all disciplines the instructor has taught in this period
      const disciplinasInstructor = new Set(clasesInstructor.map((c) => c.disciplinaId))

      // 2. For each discipline, calculate metrics and evaluate category
      const categoriasPorDisciplina = instructor.categorias || []
      const nuevasCategorias = [...categoriasPorDisciplina]

      // Instructor parameters for evaluation
      const instructorParams = {
        dobleteos: pagoSeleccionado.dobleteos || 0,
        horariosNoPrime: pagoSeleccionado.horariosNoPrime || 0,
        participacionEventos: pagoSeleccionado.participacionEventos || false,
        cumpleLineamientos: pagoSeleccionado.cumpleLineamientos || false,
      }

      let cambiosRealizados = false
      const resumenCambios: Array<{
        disciplina: string
        categoriaAnterior: CategoriaInstructor
        categoriaNueva: CategoriaInstructor
      }> = []

      // Process each discipline the instructor has taught
      for (const disciplinaId of disciplinasInstructor) {
        // Get the discipline
        const disciplina = disciplinas.find((d) => d.id === disciplinaId)
        const nombreDisciplina = disciplina?.nombre || `Disciplina ${disciplinaId}`

        // Always calculate and update categories for all disciplines
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

        if (categoriaExistente) {
          // If it exists and is different, update it
          if (categoriaExistente.categoria !== categoriaCalculada) {
            const index = nuevasCategorias.findIndex(
              (cat) => cat.disciplinaId === disciplinaId && cat.periodoId === pagoSeleccionado.periodoId,
            )

            // Save the change for the summary (only if it should have visual category)
            if (disciplina && mostrarCategoriaVisual(disciplina.nombre)) {
              resumenCambios.push({
                disciplina: nombreDisciplina,
                categoriaAnterior: categoriaExistente.categoria,
                categoriaNueva: categoriaCalculada,
              })
            }

            nuevasCategorias[index] = {
              ...categoriaExistente,
              categoria: categoriaCalculada,
              metricas: metricas, // Update reference metrics
            }

            cambiosRealizados = true
          }
        } else {
          // If it doesn't exist, create a new one
          // Save the change for the summary (only if it should have visual category)
          if (disciplina && mostrarCategoriaVisual(disciplina.nombre)) {
            resumenCambios.push({
              disciplina: nombreDisciplina,
              categoriaAnterior: "INSTRUCTOR" as CategoriaInstructor, // Default value
              categoriaNueva: categoriaCalculada,
            })
          }

          nuevasCategorias.push({
            id: Date.now(), // Temporary ID
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

      // If there were changes, update the instructor
      if (cambiosRealizados) {
        const instructorActualizado = {
          ...instructor,
          categorias: nuevasCategorias,
        }

        await actualizarInstructor(instructor.id, instructorActualizado)
        await fetchInstructor(instructor.id)

        // Save the changes to show in the dialog
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

  // Function to save edited factors
  const guardarFactoresEditados = async () => {
    if (!pagoSeleccionado) return

    setIsActualizandoInstructor(true)

    try {
      // Get the current horariosNoPrime value from the payment
      const currentHorariosNoPrime = pagoSeleccionado.horariosNoPrime || 0

      // Create updated payment object with the edited factors
      const pagoActualizado = {
        ...pagoSeleccionado,
        dobleteos: factoresEditados.dobleteos,
        participacionEventos: factoresEditados.participacionEventos,
        cumpleLineamientos: factoresEditados.cumpleLineamientos,
        // Keep the current horariosNoPrime value as it's calculated automatically
        horariosNoPrime: currentHorariosNoPrime,
      }

      console.log("Actualizando pago con factores:", pagoActualizado)

      // Update the payment using the pagosStore
      await actualizarPago(pagoSeleccionado.id, pagoActualizado)
      console.log("Pago actualizado exitosamente")

      // Fetch the updated payment to refresh the UI
      await fetchPago(pagoSeleccionado.id)
      console.log("Pago recargado exitosamente")

      toast({
        title: "Factores actualizados",
        description: "Los factores de categorización han sido actualizados exitosamente.",
      })

      setEditandoCategoria(false)

      // Re-evaluate categories with the updated payment data in a separate try/catch
      try {
        console.log("Iniciando reevaluación de categorías")
        await reevaluarTodasCategorias()
        console.log("Reevaluación de categorías completada")
      } catch (categoryError) {
        console.error("Error al reevaluar categorías:", categoryError)
        toast({
          title: "Advertencia",
          description:
            "Los factores se actualizaron pero hubo un error al reevaluar las categorías. Por favor, intente reevaluar manualmente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al actualizar factores:", error)
      toast({
        title: "Error al actualizar factores",
        description: error instanceof Error ? error.message : "Error desconocido al actualizar factores",
        variant: "destructive",
      })
    } finally {
      setIsActualizandoInstructor(false)
    }
  }

  // Function to get instructor categories
  const obtenerCategoriasInstructor = () => {
    if (!instructor || !instructor.categorias || !pagoSeleccionado) return []

    // Filter instructor categories for the current period and only include disciplines with visual categories
    return instructor.categorias.filter((cat) => {
      const disciplina = disciplinas.find((d) => d.id === cat.disciplinaId)
      return cat.periodoId === pagoSeleccionado.periodoId && disciplina && mostrarCategoriaVisual(disciplina.nombre)
    })
  }

  // Replace categoriaActual with categoriasPorDisciplina
  const categoriasPorDisciplina = obtenerCategoriasInstructor()

  // Function to toggle payment status
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

  // Function to export to PDF
  const handleExportPDF = () => {
    if (!pagoSeleccionado || !instructor || !periodo) return
    downloadPagoPDF(pagoSeleccionado, instructor, periodo, clasesInstructor, disciplinas)
  }

  // Function to print
  const handlePrint = () => {
    if (!pagoSeleccionado || !instructor || !periodo) return
    printPagoPDF(pagoSeleccionado, instructor, periodo, clasesInstructor, disciplinas)
  }

  // Function to update instructor category
  const actualizarCategoriaInstructor = async () => {
    if (!instructor || !categoriaSeleccionada || !categoriaCalculada) return

    try {
      // Update the category in the database
      const categoriaActualizada = {
        ...categoriaSeleccionada,
        categoria: categoriaCalculada,
      }

      // Update the category in the instructor's categories array
      const categoriasPorDisciplina = instructor.categorias || []
      const nuevasCategorias = [...categoriasPorDisciplina]

      const index = nuevasCategorias.findIndex(
        (cat) =>
          cat.disciplinaId === categoriaSeleccionada.disciplinaId && cat.periodoId === categoriaSeleccionada.periodoId,
      )

      if (index !== -1) {
        nuevasCategorias[index] = categoriaActualizada
      }

      // Update the instructor with the updated categories
      const instructorActualizado = {
        ...instructor,
        categorias: nuevasCategorias,
      }

      await actualizarInstructor(instructor.id, instructorActualizado)

      toast({
        title: "Categoría actualizada",
        description: `La categoría del instructor para ${disciplinaSeleccionada?.nombre || "esta disciplina"} ha sido actualizada de ${categoriaPrevia} a ${categoriaCalculada}.`,
      })

      // Reload the instructor to get updated data
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

  // Function to get category color
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

  // Function to check if a requirement is met
  const cumpleRequisito = (valor: number | boolean, requisito: number | boolean, esMinimo = true) => {
    if (typeof valor === "boolean" && typeof requisito === "boolean") {
      return valor === requisito
    }

    if (typeof valor === "number" && typeof requisito === "number") {
      return esMinimo ? valor >= requisito : valor <= requisito
    }

    return false
  }

  // Function to get progress percentage for a requirement
  const getProgresoRequisito = (valor: number, requisito: number, max: number = requisito * 1.5) => {
    if (requisito === 0) return 100
    const progreso = (valor / requisito) * 100
    return Math.min(progreso, 100)
  }

  // Function to convert category to numeric value for comparisons
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

  // Function to format category name
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

  // If loading, show skeleton
  if (isLoadingPagos || !pagoSeleccionado || !instructor || !periodo) {
    return <LoadingSkeleton />
  }

  // Calculate statistics
  const totalReservas = clasesInstructor.reduce((sum, clase) => sum + clase.reservasTotales, 0)
  const totalCapacidad = clasesInstructor.reduce((sum, clase) => sum + clase.lugares, 0)
  const ocupacionPromedio = totalCapacidad > 0 ? Math.round((totalReservas / totalCapacidad) * 100) : 0
  const ocupacionPorcentaje = totalCapacidad > 0 ? Math.round((totalReservas / totalCapacidad) * 100) : 0
  const montoFinalCalculado = calcularMontoFinal(
    pagoSeleccionado.monto,
    pagoSeleccionado.retencion,
    pagoSeleccionado.reajuste,
    pagoSeleccionado.tipoReajuste,
    pagoSeleccionado.bono || 0,
  )

  // Fix the closing tag issue
  return (
    <DashboardShell>
      {/* Header */}
      <PageHeader
        instructor={instructor}
        periodo={periodo}
        pagoSeleccionado={pagoSeleccionado}
        getEstadoColor={getEstadoColor}
        toggleEstadoPago={toggleEstadoPago}
        handleExportPDF={handleExportPDF}
        handlePrint={handlePrint}
        router={router}
      />

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
            {!isInstructor ? (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleEstadoPago}
                className="bg-card border hover:bg-muted/10 hover:text-foreground"
              >
                {pagoSeleccionado.estado === "PENDIENTE" ? "Aprobar" : "Pendiente"}
              </Button>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-muted-foreground">
                      <Lock className="h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p>Los instructores no pueden cambiar el estado del pago</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
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

              {/* Only show the Categoría tab if there are disciplines with visual categories */}
              {disciplinas.some((d) => mostrarCategoriaVisual(d.nombre)) && (
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
                  {activeTab === "categoria" && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-4">
            {/* Detalles Tab */}
            {/* Asegurarnos de pasar disciplinas al componente PaymentDetails */}
            {activeTab === "detalles" && (
              <PaymentDetails
                pagoSeleccionado={pagoSeleccionado}
                instructor={instructor}
                periodo={periodo}
                disciplinas={disciplinas}
                editandoReajuste={editandoReajuste}
                setEditandoReajuste={setEditandoReajuste}
                nuevoReajuste={nuevoReajuste}
                setNuevoReajuste={setNuevoReajuste}
                tipoReajuste={tipoReajuste}
                setTipoReajuste={setTipoReajuste}
                isActualizandoReajuste={isActualizandoReajuste}
                actualizarReajuste={actualizarReajuste}
                formatCurrency={formatCurrency}
                montoFinalCalculado={montoFinalCalculado}
                ocupacionPromedio={ocupacionPromedio}
                clasesInstructor={clasesInstructor}
                totalReservas={totalReservas}
                totalCapacidad={totalCapacidad}
              />
            )}

            {/* Clases Tab */}
            {activeTab === "clases" && (
              <ClassesTab
                clasesInstructor={clasesInstructor}
                pagoSeleccionado={pagoSeleccionado}
                formulas={formulas}
                disciplinas={disciplinas}
                formatCurrency={formatCurrency}
              />
            )}

            {/* Categoría Tab */}
            {activeTab === "categoria" && (
              <CategoryTab
                instructor={instructor}
                pagoSeleccionado={pagoSeleccionado}
                categoriasPorDisciplina={categoriasPorDisciplina}
                disciplinas={disciplinas}
                clasesInstructor={clasesInstructor}
                formulas={formulas}
                editandoCategoria={editandoCategoria}
                setEditandoCategoria={setEditandoCategoria}
                factoresEditados={factoresEditados}
                setFactoresEditados={setFactoresEditados}
                isActualizandoInstructor={isActualizandoInstructor}
                guardarFactoresEditados={guardarFactoresEditados}
                isActualizandoCategorias={isActualizandoCategorias}
                reevaluarTodasCategorias={reevaluarTodasCategorias}
                getColorCategoria={getColorCategoria}
                formatearCategoria={formatearCategoria}
                calcularMetricas={calcularMetricas}
                cumpleRequisito={cumpleRequisito}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CategoryChangeDialogComponent
        showCategoriaDialog={showCategoriaDialog}
        setShowCategoriaDialog={setShowCategoriaDialog}
        disciplinaSeleccionada={disciplinaSeleccionada}
        categoriaPrevia={categoriaPrevia}
        categoriaCalculada={categoriaCalculada}
        getColorCategoria={getColorCategoria}
        formatearCategoria={formatearCategoria}
        getCategoriaValue={getCategoriaValue}
        actualizarCategoriaInstructor={actualizarCategoriaInstructor}
      />

      <ChangeSummaryDialogComponent
        showResumenDialog={showResumenDialog}
        setShowResumenDialog={setShowResumenDialog}
        cambiosCategorias={cambiosCategorias}
        getColorCategoria={getColorCategoria}
        formatearCategoria={formatearCategoria}
        getCategoriaValue={getCategoriaValue}
        disciplinas={disciplinas}
      />
    </DashboardShell>
  )
}