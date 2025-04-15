"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { usePagosStore } from "@/store/usePagosStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { useClasesStore } from "@/store/useClasesStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { downloadPagoPDF, printPagoPDF } from "@/utils/pago-instructor-pdf"
import { downloadPagosPDF, printPagosPDF } from "@/utils/pagos-pdf"
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
  ArrowUpDown,
  Calendar,
  Check,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Filter,
  Loader2,
  Printer,
  Search,
  Users,
  X,
  Calculator,
} from "lucide-react"
import type { EstadoPago, TipoReajuste, PagoInstructor, CategoriaInstructor } from "@/types/schema"
import { useFormulasStore } from "@/store/useFormulaStore"
import { retencionValor } from "@/utils/const"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { calcularPago } from "@/lib/formula-evaluator"
import { instructoresApi } from "@/lib/api/instructores-api"
import type { JSX } from "react/jsx-runtime"
import { Switch } from "@/components/ui/switch"

export default function PagosPage() {
  // Add categoriaInstructor store to the hooks
  const { pagos, fetchPagos, actualizarPago, crearPago, isLoading: isLoadingPagos } = usePagosStore()
  const { periodos, periodosSeleccionados, periodoActual, actualizarPeriodo } = usePeriodosStore()
  const { instructores, fetchInstructores } = useInstructoresStore()
  const { clases, fetchClases } = useClasesStore()
  const { disciplinas, fetchDisciplinas } = useDisciplinasStore()
  const { formulas, fetchFormulas } = useFormulasStore()

  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [filtroInstructor, setFiltroInstructor] = useState<string>("todos")
  const [busqueda, setBusqueda] = useState<string>("")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "periodoId",
    direction: "desc",
  })
  const [isRecalculando, setIsRecalculando] = useState<boolean>(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false)
  const [paginaActual, setPaginaActual] = useState<number>(1)
  const [elementosPorPagina, setElementosPorPagina] = useState<number>(10)

  // Estados para edición de reajuste
  const [editandoPagoId, setEditandoPagoId] = useState<number | null>(null)
  const [nuevoReajuste, setNuevoReajuste] = useState<number>(0)
  const [tipoReajuste, setTipoReajuste] = useState<TipoReajuste>("FIJO")
  const [isActualizandoReajuste, setIsActualizandoReajuste] = useState<boolean>(false)

  // Add a new state for the calculate payments dialog
  const [showCalculateDialog, setShowCalculateDialog] = useState<boolean>(false)
  const [isCalculatingPayments, setIsCalculatingPayments] = useState<boolean>(false)
  const [selectedPeriodoId, setSelectedPeriodoId] = useState<number | null>(null)

  // Add state for process logs
  const [processLogs, setProcessLogs] = useState<string[]>([])
  const [showProcessLogsDialog, setShowProcessLogsDialog] = useState<boolean>(false)

  // Add a new state for the checkbox to calculate bonus
  const [calcularBonoEnPeriodo, setCalcularBonoEnPeriodo] = useState<boolean>(false)

  // Use useRouter hook
  const router = useRouter()

  // Cargar datos iniciales
  useEffect(() => {
    fetchInstructores()
    fetchDisciplinas()
    fetchFormulas()
    fetchPagos()
    fetchClases()
  }, [fetchInstructores, fetchDisciplinas, fetchPagos, fetchClases, fetchFormulas])

  // Filtrar pagos por periodos seleccionados y otros filtros
  const filteredPagos = pagos.filter((pago) => {
    // Filtrar por periodos seleccionados
    const periodoPago = periodos.find((p) => p.id === pago.periodoId)
    const enPeriodosSeleccionados =
      periodosSeleccionados.length === 0 || periodosSeleccionados.some((p) => p.id === pago.periodoId)

    if (!enPeriodosSeleccionados) return false

    // Resto de filtros
    if (filtroEstado !== "todos" && pago.estado !== filtroEstado) return false
    if (filtroInstructor !== "todos" && pago.instructorId !== Number.parseInt(filtroInstructor)) return false

    if (busqueda) {
      const instructor = instructores.find((i) => i.id === pago.instructorId)
      const instructorNombre = instructor ? instructor.nombre.toLowerCase() : ""
      const periodoNombre = periodoPago ? `Periodo ${periodoPago.numero} - ${periodoPago.año}`.toLowerCase() : ""

      if (
        !(
          instructorNombre.includes(busqueda.toLowerCase()) ||
          periodoNombre.includes(busqueda.toLowerCase()) ||
          pago.estado.toLowerCase().includes(busqueda.toLowerCase())
        )
      ) {
        return false
      }
    }

    return true
  })

  // Ordenar pagos
  const sortedPagos = [...filteredPagos].sort((a, b) => {
    if (sortConfig.key === "periodoId") {
      return sortConfig.direction === "asc" ? a.periodoId - b.periodoId : b.periodoId - a.periodoId
    }

    if (sortConfig.key === "instructorId") {
      const instructorA = instructores.find((i) => i.id === a.instructorId)?.nombre || ""
      const instructorB = instructores.find((i) => i.id === b.instructorId)?.nombre || ""
      return sortConfig.direction === "asc"
        ? instructorA.localeCompare(instructorB)
        : instructorB.localeCompare(instructorA)
    }

    if (sortConfig.key === "monto") {
      return sortConfig.direction === "asc" ? a.monto - b.monto : b.monto - a.monto
    }

    if (sortConfig.key === "estado") {
      return sortConfig.direction === "asc" ? a.estado.localeCompare(b.estado) : b.estado.localeCompare(a.estado)
    }

    if (sortConfig.key === "fecha") {
      const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(a.createdAt!)
      const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt!)
      return sortConfig.direction === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
    }

    return 0
  })

  // Paginación
  const totalPaginas = Math.ceil(sortedPagos.length / elementosPorPagina)
  const paginatedPagos = sortedPagos.slice((paginaActual - 1) * elementosPorPagina, paginaActual * elementosPorPagina)

  // Función para cambiar el ordenamiento
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  // Función para obtener el nombre del instructor
  const getNombreInstructor = (instructorId: number): string => {
    const instructor = instructores.find((i) => i.id === instructorId)
    return instructor ? instructor.nombre : `Instructor ${instructorId}`
  }

  // Función para obtener el nombre del periodo
  const getNombrePeriodo = (periodoId: number): string => {
    const periodo = periodos.find((p) => p.id === periodoId)
    return periodo ? `Periodo ${periodo.numero} - ${periodo.año}` : `Periodo ${periodoId}`
  }

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
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const calcularMontoFinal = (pago: PagoInstructor): number => {
    // Asegurarse de que el bono esté definido
    const bono = pago.bono || 0

    // Calcular el reajuste
    const reajusteCalculado = pago.tipoReajuste === "PORCENTAJE" ? (pago.monto * pago.reajuste) / 100 : pago.reajuste

    // Calcular el monto ajustado (incluyendo el bono)
    const montoAjustado = pago.monto + reajusteCalculado + bono

    // Aplicar retención al monto ajustado (incluyendo el bono)
    return montoAjustado - pago.retencion
  }

  // Función para iniciar edición de reajuste
  const iniciarEdicionReajuste = (pago: PagoInstructor) => {
    setEditandoPagoId(pago.id)
    setNuevoReajuste(pago.reajuste)
    setTipoReajuste(pago.tipoReajuste)
  }

  // Función para cancelar edición de reajuste
  const cancelarEdicionReajuste = () => {
    setEditandoPagoId(null)
  }

  // Función para actualizar el reajuste
  const actualizarReajuste = async (pagoId: number) => {
    const pago = pagos.find((p) => p.id === pagoId)
    if (!pago) return

    setIsActualizandoReajuste(true)

    try {
      // Asegurarse de que el bono esté definido
      const bono = pago.bono || 0

      // Calculate the adjusted amount first
      const montoBase = pago.monto
      const reajusteCalculado = tipoReajuste === "PORCENTAJE" ? (montoBase * nuevoReajuste) / 100 : nuevoReajuste

      // Calculate the retention based on the adjusted amount INCLUDING the bonus
      const montoAjustado = montoBase + reajusteCalculado + bono
      const retencionCalculada = montoAjustado * retencionValor

      // Calculate the final payment
      const pagoFinal = montoAjustado - retencionCalculada

      const pagoActualizado = {
        ...pago,
        reajuste: nuevoReajuste,
        tipoReajuste: tipoReajuste,
        retencion: retencionCalculada,
        pagoFinal: pagoFinal,
      }

      await actualizarPago(pagoId, pagoActualizado)

      toast({
        title: "Reajuste actualizado",
        description: `El reajuste ha sido actualizado exitosamente.`,
      })

      setEditandoPagoId(null)
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

  // Función para exportar un pago individual a PDF
  const exportarPagoPDF = (pagoId: number) => {
    const pago = pagos.find((p) => p.id === pagoId)
    if (!pago) return

    const instructor = instructores.find((i) => i.id === pago.instructorId)
    const periodo = periodos.find((p) => p.id === pago.periodoId)

    if (!instructor || !periodo) return

    const clasesInstructor = clases.filter(
      (c) => c.instructorId === pago.instructorId && c.periodoId === pago.periodoId,
    )

    downloadPagoPDF(pago, instructor, periodo, clasesInstructor, disciplinas)
  }

  // Función para imprimir un pago individual
  const imprimirPagoPDF = (pagoId: number) => {
    const pago = pagos.find((p) => p.id === pagoId)
    if (!pago) return

    const instructor = instructores.find((i) => i.id === pago.instructorId)
    const periodo = periodos.find((p) => p.id === pago.periodoId)

    if (!instructor || !periodo) return

    const clasesInstructor = clases.filter(
      (c) => c.instructorId === pago.instructorId && c.periodoId === pago.periodoId,
    )

    printPagoPDF(pago, instructor, periodo, clasesInstructor, disciplinas)
  }

  // Función para exportar todos los pagos filtrados a PDF
  const exportarTodosPagosPDF = () => {
    if (sortedPagos.length === 0) {
      toast({
        title: "No hay pagos para exportar",
        description: "No se encontraron pagos con los filtros seleccionados.",
        variant: "destructive",
      })
      return
    }

    // Preparar información de filtros para el PDF
    const filtrosInfo = {
      estado: filtroEstado,
      instructor: filtroInstructor,
      periodos:
        periodosSeleccionados.length > 0
          ? periodosSeleccionados.map((p) => `${p.numero}-${p.año}`).join(", ")
          : undefined,
    }

    downloadPagosPDF(sortedPagos, instructores, periodos, filtrosInfo)

    toast({
      title: "Reporte generado",
      description: `Se ha generado un PDF con ${sortedPagos.length} pagos.`,
    })
  }

  // Función para imprimir todos los pagos filtrados
  const imprimirTodosPagosPDF = () => {
    if (sortedPagos.length === 0) {
      toast({
        title: "No hay pagos para imprimir",
        description: "No se encontraron pagos con los filtros seleccionados.",
        variant: "destructive",
      })
      return
    }

    // Preparar información de filtros para el PDF
    const filtrosInfo = {
      estado: filtroEstado,
      instructor: filtroInstructor,
      periodos:
        periodosSeleccionados.length > 0
          ? periodosSeleccionados.map((p) => `${p.numero}-${p.año}`).join(", ")
          : undefined,
    }

    printPagosPDF(sortedPagos, instructores, periodos, filtrosInfo)
  }

  // Function to determine the appropriate category for an instructor based on metrics
  const determinarCategoria = (
    instructorId: number,
    disciplinaId: number,
    periodoId: number,
    formula: any,
  ): CategoriaInstructor => {
    // Get instructor's classes for this discipline and period
    const clasesInstructor = clases.filter(
      (c) => c.instructorId === instructorId && c.disciplinaId === disciplinaId && c.periodoId === periodoId,
    )

    // Get instructor data
    const instructor = instructores.find((i) => i.id === instructorId)
    if (!instructor) return "INSTRUCTOR"

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

    // Get instructor metrics
    const dobleteos = instructor.dobleteos || 0
    const horariosNoPrime = instructor.horariosNoPrime || 0
    const participacionEventos = instructor.participacionEventos || false
    const cumpleLineamientos = instructor.cumpleLineamientos || false

    // Check requirements for each category from highest to lowest
    const requisitos = formula.requisitosCategoria

    if (
      requisitos.EMBAJADOR_SENIOR &&
      ocupacion >= requisitos.EMBAJADOR_SENIOR.ocupacion &&
      totalClases >= requisitos.EMBAJADOR_SENIOR.clases &&
      localesEnLima >= requisitos.EMBAJADOR_SENIOR.localesEnLima &&
      dobleteos >= requisitos.EMBAJADOR_SENIOR.dobleteos &&
      horariosNoPrime >= requisitos.EMBAJADOR_SENIOR.horariosNoPrime &&
      participacionEventos >= requisitos.EMBAJADOR_SENIOR.participacionEventos &&
      cumpleLineamientos >= requisitos.EMBAJADOR_SENIOR.lineamientos
    ) {
      return "EMBAJADOR_SENIOR"
    }

    if (
      requisitos.EMBAJADOR &&
      ocupacion >= requisitos.EMBAJADOR.ocupacion &&
      totalClases >= requisitos.EMBAJADOR.clases &&
      localesEnLima >= requisitos.EMBAJADOR.localesEnLima &&
      dobleteos >= requisitos.EMBAJADOR.dobleteos &&
      horariosNoPrime >= requisitos.EMBAJADOR.horariosNoPrime &&
      participacionEventos >= requisitos.EMBAJADOR.participacionEventos &&
      cumpleLineamientos >= requisitos.EMBAJADOR.lineamientos
    ) {
      return "EMBAJADOR"
    }

    if (
      requisitos.EMBAJADOR_JUNIOR &&
      ocupacion >= requisitos.EMBAJADOR_JUNIOR.ocupacion &&
      totalClases >= requisitos.EMBAJADOR_JUNIOR.clases &&
      localesEnLima >= requisitos.EMBAJADOR_JUNIOR.localesEnLima &&
      dobleteos >= requisitos.EMBAJADOR_JUNIOR.dobleteos &&
      horariosNoPrime >= requisitos.EMBAJADOR_JUNIOR.horariosNoPrime &&
      (participacionEventos || !requisitos.EMBAJADOR_JUNIOR.participacionEventos) &&
      cumpleLineamientos >= requisitos.EMBAJADOR_JUNIOR.lineamientos
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

    // Check if instructor already has a category for this discipline and period
    const existingCategoria = instructor.categorias?.find(
      (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId,
    )

    if (existingCategoria) {
      addProcessLog(`✓ Instructor ${instructor.nombre} ya tiene categoría: ${existingCategoria.categoria}`)
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
      addProcessLog(`⏳ Creando categoría ${categoriaCalculada} para ${instructor.nombre}...`)

      // Prepare the new category object
      const nuevaCategoria = {
        disciplinaId,
        periodoId,
        categoria: categoriaCalculada,
        metricas: {
          ocupacion,
          clases: totalClases,
          localesEnLima,
          dobleteos: instructor.dobleteos || 0,
          horariosNoPrime: instructor.horariosNoPrime || 0,
          participacionEventos: instructor.participacionEventos || false,
        },
      }

      // Get existing categories or initialize empty array
      const categorias = instructor.categorias || []

      // Update instructor with the new category
      // We need to send all existing categories plus the new one
      await instructoresApi.actualizarInstructor(instructorId, {
        categorias: [...categorias, nuevaCategoria],
      })

      addProcessLog(`✓ Categoría ${categoriaCalculada} creada para ${instructor.nombre}`)

      // Return the newly created category
      return categoriaCalculada
    } catch (error) {
      addProcessLog(
        `❌ Error al crear categoría para ${instructor.nombre}: ${error instanceof Error ? error.message : "Error desconocido"}`,
      )
      return "INSTRUCTOR" // Default to INSTRUCTOR on error
    }
  }

  // Helper function to add process logs
  const addProcessLog = (message: string) => {
    setProcessLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  // Function to calculate and create payments for all instructors in a period
  const calcularPagosPeriodo = async () => {
    // Clear previous logs
    setProcessLogs([])
    setShowProcessLogsDialog(true)

    addProcessLog("🚀 Iniciando cálculo de pagos...")

    const periodoId = selectedPeriodoId || periodoActual?.id

    if (!periodoId) {
      addProcessLog("❌ Error: No hay periodo seleccionado")
      toast({
        title: "Error",
        description: "Debes seleccionar un periodo para calcular los pagos",
        variant: "destructive",
      })
      return
    }

    setIsCalculatingPayments(true)
    setShowCalculateDialog(false)

    try {
      addProcessLog(`📅 Calculando pagos para periodo ID: ${periodoId}`)

      // Get all instructors
      const todosInstructores = instructores
      addProcessLog(`👥 Total instructores: ${todosInstructores.length}`)

      // Get existing payments for this period
      const pagosPeriodo = pagos.filter((p) => p.periodoId === periodoId)
      const instructoresConPago = new Set(pagosPeriodo.map((p) => p.instructorId))

      addProcessLog(`💰 Instructores con pago existente: ${instructoresConPago.size}`)

      let pagosCreados = 0
      let pagosActualizados = 0
      let instructoresSinClases = 0
      const instructoresOmitidos = 0

      // STEP 1: First, ensure all instructors have categories for each discipline they teach
      addProcessLog("🔍 PASO 1: Verificando y asignando categorías a instructores...")

      // Get all instructor-discipline combinations for this period
      const instructorDisciplinaPairs: { instructorId: number; disciplinaId: number }[] = []

      clases.forEach((clase) => {
        if (clase.periodoId === periodoId) {
          const pair = { instructorId: clase.instructorId, disciplinaId: clase.disciplinaId }

          // Check if this pair already exists in our array
          const exists = instructorDisciplinaPairs.some(
            (p) => p.instructorId === pair.instructorId && p.disciplinaId === pair.disciplinaId,
          )

          if (!exists) {
            instructorDisciplinaPairs.push(pair)
          }
        }
      })

      addProcessLog(`🔄 Procesando ${instructorDisciplinaPairs.length} combinaciones instructor-disciplina...`)

      // Process each instructor-discipline pair to ensure they have categories
      for (const { instructorId, disciplinaId } of instructorDisciplinaPairs) {
        const instructor = instructores.find((i) => i.id === instructorId)
        const disciplina = disciplinas.find((d) => d.id === disciplinaId)

        if (!instructor || !disciplina) {
          addProcessLog(`⚠️ Instructor ID ${instructorId} o Disciplina ID ${disciplinaId} no encontrados, omitiendo...`)
          continue
        }

        addProcessLog(`👤 Procesando instructor ${instructor.nombre} para disciplina ${disciplina.nombre}...`)

        // Get formula for this discipline and period
        const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodoId)

        if (!formula) {
          addProcessLog(`⚠️ No se encontró fórmula para disciplina ${disciplina.nombre} en este periodo, omitiendo...`)
          continue
        }

        // Get or create category for this instructor-discipline-period combination
        await getOrCreateInstructorCategoria(instructorId, disciplinaId, periodoId, formula)
      }

      // Refresh instructors data to get updated categories
      addProcessLog("🔄 Actualizando datos de instructores con nuevas categorías...")
      await fetchInstructores()

      // STEP 2: Now calculate payments based on categories
      addProcessLog("💵 PASO 2: Calculando pagos basados en categorías...")

      for (const instructor of todosInstructores) {
        addProcessLog(`\n👤 Procesando instructor ${instructor.id} - ${instructor.nombre}`)

        // Get classes for this instructor in this period
        const clasesInstructor = clases.filter(
          (clase) => clase.instructorId === instructor.id && clase.periodoId === periodoId,
        )

        if (clasesInstructor.length === 0) {
          addProcessLog(`ℹ️ Instructor sin clases, no se creará pago`)
          instructoresSinClases++
          continue
        }

        // Check if instructor already has a payment for this period
        const pagoExistente = pagos.find((p) => p.instructorId === instructor.id && p.periodoId === periodoId)

        let montoTotal = 0
        const detallesClases = []

        // Group classes by discipline to calculate payments
        const disciplinasUnicas = [...new Set(clasesInstructor.map((c) => c.disciplinaId))]

        for (const disciplinaId of disciplinasUnicas) {
          const clasesDisciplina = clasesInstructor.filter((c) => c.disciplinaId === disciplinaId)
          const disciplina = disciplinas.find((d) => d.id === disciplinaId)

          if (!disciplina) {
            addProcessLog(`⚠️ Disciplina ID ${disciplinaId} no encontrada, omitiendo clases...`)
            continue
          }

          addProcessLog(`📊 Procesando ${clasesDisciplina.length} clases de ${disciplina.nombre}`)

          // Get formula for this discipline
          const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodoId)

          if (!formula) {
            addProcessLog(
              `⚠️ No se encontró fórmula para disciplina ${disciplina.nombre} en este periodo, omitiendo clases...`,
            )
            continue
          }

          // Get instructor category for this discipline
          const categoriaInstructor =
            instructor.categorias?.find((c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId)
              ?.categoria || "INSTRUCTOR"

          addProcessLog(`🏆 Categoría del instructor para ${disciplina.nombre}: ${categoriaInstructor}`)

          // Calculate payment for each class in this discipline
          for (const clase of clasesDisciplina) {
            try {
              // Calculate payment
              const resultado = calcularPago(clase, categoriaInstructor, formula)

              montoTotal += resultado.montoPago
              detallesClases.push({
                claseId: clase.id,
                montoCalculado: resultado.montoPago,
                disciplinaId: clase.disciplinaId,
                fechaClase: clase.fecha,
                detalleCalculo: resultado.detalleCalculo,
                categoria: categoriaInstructor,
              })

              addProcessLog(`💲 Clase ${clase.id}: ${resultado.montoPago} (${resultado.tipoTarifa})`)
            } catch (error) {
              addProcessLog(
                `❌ Error al calcular pago para clase ${clase.id}: ${error instanceof Error ? error.message : "Error desconocido"}`,
              )
            }
          }
        }

        // Calcular bonos para instructores con categorías especiales solo si se ha seleccionado la opción
        let bonoTotal = 0

        if (calcularBonoEnPeriodo) {
          // Solo calcular bonos si el instructor tiene categorías diferentes a INSTRUCTOR
          const tieneCategoriasEspeciales = instructor.categorias?.some(
            (cat) => cat.periodoId === periodoId && cat.categoria !== "INSTRUCTOR",
          )

          if (tieneCategoriasEspeciales) {
            addProcessLog(`🎯 Calculando bonos para instructor ${instructor.nombre} (categoría especial)`)

            // Recorrer todas las disciplinas únicas del instructor
            for (const disciplinaId of disciplinasUnicas) {
              // Obtener la categoría del instructor para esta disciplina
              const categoriaInfo = instructor.categorias?.find(
                (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId,
              )

              if (categoriaInfo && categoriaInfo.categoria !== "INSTRUCTOR") {
                // Obtener la fórmula para esta disciplina
                const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodoId)

                if (formula && formula.parametrosPago && formula.parametrosPago[categoriaInfo.categoria]?.bono) {
                  // Obtener el valor del bono por alumno
                  const valorBonoPorAlumno = formula.parametrosPago[categoriaInfo.categoria].bono

                  // Obtener las clases de esta disciplina
                  const clasesDisciplina = clasesInstructor.filter((c) => c.disciplinaId === disciplinaId)

                  // Calcular el bono para cada clase y sumarlo al total
                  for (const clase of clasesDisciplina) {
                    const bonoClase = valorBonoPorAlumno * clase.reservasTotales
                    bonoTotal += bonoClase

                    addProcessLog(
                      `💎 Bono para clase ${clase.id}: ${bonoClase} (${clase.reservasTotales} alumnos x ${valorBonoPorAlumno})`,
                    )
                  }
                }
              }
            }

            if (bonoTotal > 0) {
              addProcessLog(`💰 Bono total para ${instructor.nombre}: ${bonoTotal}`)
            }
          } else {
            addProcessLog(`ℹ️ Instructor ${instructor.nombre} no tiene categorías especiales, no aplica bono`)
          }
        } else {
          addProcessLog(`ℹ️ Cálculo de bonos desactivado para este periodo`)
        }

        // Calculate retention - IMPORTANTE: Primero calculamos el bono, luego aplicamos la retención al monto total + bono
        const retencionPorcentaje = retencionValor
        const montoConBono = montoTotal + bonoTotal
        const retencionCalculada = montoConBono * retencionPorcentaje

        // Calculate final payment (incluye el bono y luego resta la retención)
        const pagoFinal = montoConBono - retencionCalculada

        // Create or update payment
        try {
          if (pagoExistente) {
            addProcessLog(`🔄 Actualizando pago existente para instructor ${instructor.nombre}`)

            await actualizarPago(pagoExistente.id, {
              ...pagoExistente,
              monto: montoTotal,
              bono: bonoTotal,
              retencion: retencionCalculada,
              pagoFinal: pagoFinal,
              detalles: {
                clases: detallesClases,
                resumen: {
                  totalClases: detallesClases.length,
                  totalMonto: montoTotal,
                  bono: bonoTotal,
                  comentarios: `Actualizado el ${new Date().toLocaleDateString()}`,
                },
              },
            })

            pagosActualizados++
            addProcessLog(`✅ Pago actualizado para instructor ${instructor.nombre}`)
          } else {
            addProcessLog(`➕ Creando nuevo pago para instructor ${instructor.nombre}`)

            await crearPago({
              instructorId: instructor.id,
              periodoId: periodoId,
              monto: montoTotal,
              bono: bonoTotal,
              estado: "PENDIENTE",
              retencion: retencionCalculada,
              reajuste: 0,
              tipoReajuste: "FIJO",
              pagoFinal: pagoFinal,
              detalles: {
                clases: detallesClases,
                resumen: {
                  totalClases: detallesClases.length,
                  totalMonto: montoTotal,
                  bono: bonoTotal,
                  comentarios: `Calculado el ${new Date().toLocaleDateString()}`,
                },
              },
            })

            pagosCreados++
            addProcessLog(`✅ Pago creado para instructor ${instructor.nombre}`)
          }
        } catch (error) {
          addProcessLog(
            `❌ Error al procesar pago para instructor ${instructor.nombre}: ${error instanceof Error ? error.message : "Error desconocido"}`,
          )
        }
      }

      // Si se calcularon bonos, actualizar el periodo
      const periodoSeleccionado = periodos.find((p) => p.id === periodoId)
      if (calcularBonoEnPeriodo) {
        try {
          if (periodoSeleccionado) {
            addProcessLog(
              `🔄 Actualizando estado de bono calculado para periodo ${periodoSeleccionado.numero}-${periodoSeleccionado.año}`,
            )
            await actualizarPeriodo(periodoId, {
              ...periodoSeleccionado,
              bonoCalculado: true,
            })
            addProcessLog(`✅ Estado de bono actualizado correctamente`)
          }
        } catch (error) {
          addProcessLog(
            `❌ Error al actualizar estado de bono en periodo: ${error instanceof Error ? error.message : "Error desconocido"}`,
          )
        }
      } else {
        await actualizarPeriodo(periodoId, {
          ...periodoSeleccionado,
          bonoCalculado: false,
        })
      }

      addProcessLog("\n🏁 Proceso completado. Resumen:")
      addProcessLog(`✅ Pagos creados: ${pagosCreados}`)
      addProcessLog(`🔄 Pagos actualizados: ${pagosActualizados}`)
      addProcessLog(`ℹ️ Instructores sin clases: ${instructoresSinClases}`)
      addProcessLog(`👥 Total instructores: ${todosInstructores.length}`)
      if (calcularBonoEnPeriodo) {
        addProcessLog(`💰 Bonos calculados y aplicados en este periodo`)
      }

      await fetchPagos()
      toast({
        title: "Cálculo completado",
        description: `Se han creado ${pagosCreados} pagos y actualizado ${pagosActualizados}. ${instructoresSinClases} instructores sin clases.`,
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

  // Función para recalcular todos los pagos
  const recalcularTodosPagos = async () => {
    // Clear previous logs
    setProcessLogs([])
    setShowProcessLogsDialog(true)

    addProcessLog("🔄 Iniciando recálculo de pagos...")

    if (periodosSeleccionados.length === 0) {
      addProcessLog("❌ Error: No hay periodos seleccionados")
      toast({
        title: "Error",
        description: "Debes seleccionar al menos un periodo para recalcular los pagos",
        variant: "destructive",
      })
      return
    }

    setIsRecalculando(true)
    setShowConfirmDialog(false)

    try {
      // Use the same flow as calcularPagosPeriodo but for all selected periods
      for (const periodo of periodosSeleccionados) {
        addProcessLog(`\n📅 Procesando periodo ${periodo.numero} - ${periodo.año} (ID: ${periodo.id})`)

        // STEP 1: First, ensure all instructors have categories for each discipline they teach
        addProcessLog("🔍 PASO 1: Verificando y asignando categorías a instructores...")

        // Get all instructor-discipline combinations for this period
        const instructorDisciplinaPairs: { instructorId: number; disciplinaId: number }[] = []

        clases.forEach((clase) => {
          if (clase.periodoId === periodo.id) {
            const pair = { instructorId: clase.instructorId, disciplinaId: clase.disciplinaId }

            // Check if this pair already exists in our array
            const exists = instructorDisciplinaPairs.some(
              (p) => p.instructorId === pair.instructorId && p.disciplinaId === pair.disciplinaId,
            )

            if (!exists) {
              instructorDisciplinaPairs.push(pair)
            }
          }
        })

        addProcessLog(`Procesando ${instructorDisciplinaPairs.length} combinaciones instructor-disciplina...`)

        // Process each instructor-discipline pair to ensure they have categories
        for (const { instructorId, disciplinaId } of instructorDisciplinaPairs) {
          const instructor = instructores.find((i) => i.id === instructorId)
          const disciplina = disciplinas.find((d) => d.id === disciplinaId)

          if (!instructor || !disciplina) {
            addProcessLog(
              `⚠️ Instructor ID ${instructorId} o Disciplina ID ${disciplinaId} no encontrados, omitiendo...`,
            )
            continue
          }

          addProcessLog(`👤 Procesando instructor ${instructor.nombre} para disciplina ${disciplina.nombre}...`)

          // Get formula for this discipline and period
          const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodo.id)

          if (!formula) {
            addProcessLog(`⚠️ No se encontró fórmula para disciplina ${disciplina.nombre} en este periodo, omitiendo...`)
            continue
          }

          // Get or create category for this instructor-discipline-period combination
          await getOrCreateInstructorCategoria(instructorId, disciplinaId, periodo.id, formula)
        }

        // Refresh instructors data to get updated categories
        addProcessLog("🔄 Actualizando datos de instructores con nuevas categorías...")
        await fetchInstructores()

        // STEP 2: Now recalculate payments based on categories
        addProcessLog("💵 PASO 2: Recalculando pagos basados en categorías...")

        let pagosActualizados = 0
        let instructoresSinClases = 0

        // Get all instructors with classes in this period
        const instructoresConClases = [
          ...new Set(clases.filter((c) => c.periodoId === periodo.id).map((c) => c.instructorId)),
        ]

        addProcessLog(`👥 Instructores con clases en este periodo: ${instructoresConClases.length}`)

        for (const instructorId of instructoresConClases) {
          const instructor = instructores.find((i) => i.id === instructorId)

          if (!instructor) {
            addProcessLog(`⚠️ Instructor ID ${instructorId} no encontrado, omitiendo...`)
            continue
          }

          addProcessLog(`\n👤 Procesando instructor ${instructor.nombre} (ID: ${instructor.id})`)

          // Get classes for this instructor in this period
          const clasesInstructor = clases.filter(
            (clase) => clase.instructorId === instructor.id && clase.periodoId === periodo.id,
          )

          if (clasesInstructor.length === 0) {
            addProcessLog(`ℹ️ Instructor sin clases, omitiendo...`)
            instructoresSinClases++
            continue
          }

          // Check if instructor already has a payment for this period
          const pagoExistente = pagos.find((p) => p.instructorId === instructor.id && p.periodoId === periodo.id)

          if (!pagoExistente) {
            addProcessLog(`ℹ️ No existe pago para este instructor en este periodo, se creará uno nuevo...`)

            // Use the same logic as in calcularPagosPeriodo to create a new payment
            let montoTotal = 0
            const detallesClases = []

            // Group classes by discipline to calculate payments
            const disciplinasUnicas = [...new Set(clasesInstructor.map((c) => c.disciplinaId))]

            for (const disciplinaId of disciplinasUnicas) {
              const clasesDisciplina = clasesInstructor.filter((c) => c.disciplinaId === disciplinaId)
              const disciplina = disciplinas.find((d) => d.id === disciplinaId)

              if (!disciplina) {
                addProcessLog(`⚠️ Disciplina ID ${disciplinaId} no encontrada, omitiendo clases...`)
                continue
              }

              addProcessLog(`📊 Procesando ${clasesDisciplina.length} clases de ${disciplina.nombre}`)

              // Get formula for this discipline
              const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodo.id)

              if (!formula) {
                addProcessLog(
                  `⚠️ No se encontró fórmula para disciplina ${disciplina.nombre} en este periodo, omitiendo clases...`,
                )
                continue
              }

              // Get instructor category for this discipline
              const categoriaInstructor =
                instructor.categorias?.find((c) => c.disciplinaId === disciplinaId && c.periodoId === periodo.id)
                  ?.categoria || "INSTRUCTOR"

              addProcessLog(`🏆 Categoría del instructor para ${disciplina.nombre}: ${categoriaInstructor}`)

              // Calculate payment for each class in this discipline
              for (const clase of clasesDisciplina) {
                try {
                  // Calculate payment
                  const resultado = calcularPago(clase, categoriaInstructor, formula)

                  montoTotal += resultado.montoPago
                  detallesClases.push({
                    claseId: clase.id,
                    montoCalculado: resultado.montoPago,
                    disciplinaId: clase.disciplinaId,
                    fechaClase: clase.fecha,
                    detalleCalculo: resultado.detalleCalculo,
                    categoria: categoriaInstructor,
                  })

                  addProcessLog(`💲 Clase ${clase.id}: ${resultado.montoPago} (${resultado.tipoTarifa})`)
                } catch (error) {
                  addProcessLog(
                    `❌ Error al calcular pago para clase ${clase.id}: ${error instanceof Error ? error.message : "Error desconocido"}`,
                  )
                }
              }
            }

            // Calcular bonos para instructores con categorías especiales
            let bonoTotal = 0

            // Solo calcular bonos si el instructor tiene categorías diferentes a INSTRUCTOR
            const tieneCategoriasEspeciales = instructor.categorias?.some(
              (cat) => cat.periodoId === periodo.id && cat.categoria !== "INSTRUCTOR",
            )

            if (tieneCategoriasEspeciales) {
              // Recorrer todas las disciplinas únicas del instructor
              for (const disciplinaId of disciplinasUnicas) {
                // Obtener la categoría del instructor para esta disciplina
                const categoriaInfo = instructor.categorias?.find(
                  (c) => c.disciplinaId === disciplinaId && c.periodoId === periodo.id,
                )

                if (categoriaInfo && categoriaInfo.categoria !== "INSTRUCTOR") {
                  // Obtener la fórmula para esta disciplina
                  const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodo.id)

                  if (formula && formula.parametrosPago && formula.parametrosPago[categoriaInfo.categoria]?.bono) {
                    // Obtener el valor del bono por alumno
                    const valorBonoPorAlumno = formula.parametrosPago[categoriaInfo.categoria].bono

                    // Obtener las clases de esta disciplina
                    const clasesDisciplina = clasesInstructor.filter((c) => c.disciplinaId === disciplinaId)

                    // Calcular el bono para cada clase y sumarlo al total
                    for (const clase of clasesDisciplina) {
                      const bonoClase = valorBonoPorAlumno * clase.reservasTotales
                      bonoTotal += bonoClase

                      addProcessLog(
                        `💎 Bono para clase ${clase.id}: ${bonoClase} (${clase.reservasTotales} alumnos x ${valorBonoPorAlumno})`,
                      )
                    }
                  }
                }
              }

              if (bonoTotal > 0) {
                addProcessLog(`💰 Bono total para ${instructor.nombre}: ${bonoTotal}`)
              }
            }

            // Calculate retention - IMPORTANTE: Primero calculamos el bono, luego aplicamos la retención al monto total + bono
            const retencionPorcentaje = retencionValor
            const montoConBono = montoTotal + bonoTotal
            const retencionCalculada = montoConBono * retencionPorcentaje

            // Calculate final payment (incluye el bono y luego resta la retención)
            const pagoFinal = montoConBono - retencionCalculada

            // Create payment
            try {
              await crearPago({
                instructorId: instructor.id,
                periodoId: periodo.id,
                monto: montoTotal,
                bono: bonoTotal,
                estado: "PENDIENTE",
                retencion: retencionCalculada,
                reajuste: 0,
                tipoReajuste: "FIJO",
                pagoFinal: pagoFinal,
                detalles: {
                  clases: detallesClases,
                  resumen: {
                    totalClases: detallesClases.length,
                    totalMonto: montoTotal,
                    bono: bonoTotal,
                    comentarios: `Calculado el ${new Date().toLocaleDateString()}`,
                  },
                },
              })

              pagosActualizados++
              addProcessLog(`✅ Pago creado para instructor ${instructor.nombre}`)
            } catch (error) {
              addProcessLog(
                `❌ Error al crear pago para instructor ${instructor.nombre}: ${error instanceof Error ? error.message : "Error desconocido"}`,
              )
            }
          } else {
            addProcessLog(`🔄 Actualizando pago existente (ID: ${pagoExistente.id})`)

            // Recalculate payment
            let montoTotal = 0
            const detallesClases = []

            // Group classes by discipline to calculate payments
            const disciplinasUnicas = [...new Set(clasesInstructor.map((c) => c.disciplinaId))]

            for (const disciplinaId of disciplinasUnicas) {
              const clasesDisciplina = clasesInstructor.filter((c) => c.disciplinaId === disciplinaId)
              const disciplina = disciplinas.find((d) => d.id === disciplinaId)

              if (!disciplina) {
                addProcessLog(`⚠️ Disciplina ID ${disciplinaId} no encontrada, omitiendo clases...`)
                continue
              }

              addProcessLog(`📊 Procesando ${clasesDisciplina.length} clases de ${disciplina.nombre}`)

              // Get formula for this discipline
              const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodo.id)

              if (!formula) {
                addProcessLog(
                  `⚠️ No se encontró fórmula para disciplina ${disciplina.nombre} en este periodo, omitiendo clases...`,
                )
                continue
              }

              // Get instructor category for this discipline
              const categoriaInstructor =
                instructor.categorias?.find((c) => c.disciplinaId === disciplinaId && c.periodoId === periodo.id)
                  ?.categoria || "INSTRUCTOR"

              addProcessLog(`🏆 Categoría del instructor para ${disciplina.nombre}: ${categoriaInstructor}`)

              // Calculate payment for each class in this discipline
              for (const clase of clasesDisciplina) {
                try {
                  // Calculate payment
                  const resultado = calcularPago(clase, categoriaInstructor, formula)

                  montoTotal += resultado.montoPago
                  detallesClases.push({
                    claseId: clase.id,
                    montoCalculado: resultado.montoPago,
                    disciplinaId: clase.disciplinaId,
                    fechaClase: clase.fecha,
                    detalleCalculo: resultado.detalleCalculo,
                    categoria: categoriaInstructor,
                  })

                  addProcessLog(`💲 Clase ${clase.id}: ${resultado.montoPago} (${resultado.tipoTarifa})`)
                } catch (error) {
                  addProcessLog(
                    `❌ Error al calcular pago para clase ${clase.id}: ${error instanceof Error ? error.message : "Error desconocido"}`,
                  )
                }
              }
            }

            // Calcular bonos para instructores con categorías especiales
            let bonoTotal = 0

            // Solo calcular bonos si el instructor tiene categorías diferentes a INSTRUCTOR
            const tieneCategoriasEspeciales = instructor.categorias?.some(
              (cat) => cat.periodoId === periodo.id && cat.categoria !== "INSTRUCTOR",
            )

            if (tieneCategoriasEspeciales) {
              // Recorrer todas las disciplinas únicas del instructor
              for (const disciplinaId of disciplinasUnicas) {
                // Obtener la categoría del instructor para esta disciplina
                const categoriaInfo = instructor.categorias?.find(
                  (c) => c.disciplinaId === disciplinaId && c.periodoId === periodo.id,
                )

                if (categoriaInfo && categoriaInfo.categoria !== "INSTRUCTOR") {
                  // Obtener la fórmula para esta disciplina
                  const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodo.id)

                  if (formula && formula.parametrosPago && formula.parametrosPago[categoriaInfo.categoria]?.bono) {
                    // Obtener el valor del bono por alumno
                    const valorBonoPorAlumno = formula.parametrosPago[categoriaInfo.categoria].bono

                    // Obtener las clases de esta disciplina
                    const clasesDisciplina = clasesInstructor.filter((c) => c.disciplinaId === disciplinaId)

                    // Calcular el bono para cada clase y sumarlo al total
                    for (const clase of clasesDisciplina) {
                      const bonoClase = valorBonoPorAlumno * clase.reservasTotales
                      bonoTotal += bonoClase

                      addProcessLog(
                        `💎 Bono para clase ${clase.id}: ${bonoClase} (${clase.reservasTotales} alumnos x ${valorBonoPorAlumno})`,
                      )
                    }
                  }
                }
              }

              if (bonoTotal > 0) {
                addProcessLog(`💰 Bono total para ${instructor.nombre}: ${bonoTotal}`)
              }
            }

            // Calcular el reajuste
            const reajusteCalculado =
              pagoExistente.tipoReajuste === "PORCENTAJE"
                ? (montoTotal * pagoExistente.reajuste) / 100
                : pagoExistente.reajuste

            // Calcular el monto ajustado (primero calculamos el monto base + reajuste + bono)
            const montoAjustado = montoTotal + reajusteCalculado + bonoTotal

            // Calcular la retención basada en el monto ajustado (incluyendo el bono)
            const retencionPorcentaje = retencionValor
            const retencionCalculada = montoAjustado * retencionPorcentaje

            // Calcular el pago final (monto ajustado - retención)
            const pagoFinalCalculado = montoAjustado - retencionCalculada

            // Update payment
            try {
              await actualizarPago(pagoExistente.id, {
                ...pagoExistente,
                monto: montoTotal,
                bono: bonoTotal,
                retencion: retencionCalculada,
                pagoFinal: pagoFinalCalculado,
                detalles: {
                  ...pagoExistente.detalles,
                  clases: detallesClases,
                  resumen: {
                    ...pagoExistente.detalles?.resumen,
                    totalClases: detallesClases.length,
                    totalMonto: montoTotal,
                    bono: bonoTotal,
                    comentarios: `Recalculado el ${new Date().toLocaleDateString()}`,
                  },
                },
              })

              pagosActualizados++
              addProcessLog(`✅ Pago actualizado para instructor ${instructor.nombre}`)
            } catch (error) {
              addProcessLog(
                `❌ Error al actualizar pago para instructor ${instructor.nombre}: ${error instanceof Error ? error.message : "Error desconocido"}`,
              )
            }
          }
        }

        addProcessLog(
          `\n✅ Periodo ${periodo.numero} - ${periodo.año} procesado. Pagos actualizados: ${pagosActualizados}, Instructores sin clases: ${instructoresSinClases}`,
        )
      }

      await fetchPagos()
      toast({
        title: "Recálculo completado",
        description: `Se han actualizado los pagos para ${periodosSeleccionados.length} periodos.`,
      })
    } catch (error) {
      addProcessLog(`❌ Error en el proceso: ${error instanceof Error ? error.message : "Error desconocido"}`)
      toast({
        title: "Error al recalcular pagos",
        description: error instanceof Error ? error.message : "Error desconocido al recalcular pagos",
        variant: "destructive",
      })
    } finally {
      addProcessLog("🏁 Finalizando proceso")
      setIsRecalculando(false)
    }
  }

  // Función para obtener el nombre del instructor con su categoría
  const getNombreInstructorConCategoria = (instructorId: number, periodoId: number): JSX.Element => {
    const instructor = instructores.find((i) => i.id === instructorId)
    if (!instructor) return <span>{`Instructor ${instructorId}`}</span>

    // Buscar la categoría más alta del instructor para este periodo
    let categoriaAlta: CategoriaInstructor | null = null

    if (instructor.categorias && instructor.categorias.length > 0) {
      // Filtrar categorías para este periodo
      const categoriasPeriodo = instructor.categorias.filter((c) => c.periodoId === periodoId)

      // Orden de prioridad de categorías (de mayor a menor)
      const prioridadCategorias: CategoriaInstructor[] = [
        "EMBAJADOR_SENIOR",
        "EMBAJADOR",
        "EMBAJADOR_JUNIOR",
        "INSTRUCTOR",
      ]

      // Encontrar la categoría de mayor prioridad
      for (const cat of prioridadCategorias) {
        if (categoriasPeriodo.some((c) => c.categoria === cat)) {
          categoriaAlta = cat
          break
        }
      }
    }

    // Mostrar el nombre con o sin badge según la categoría
    return (
      <div className="flex items-center gap-2">
        <span className="font-medium">{instructor.nombre}</span>
        {categoriaAlta && categoriaAlta !== "INSTRUCTOR" && (
          <Badge
            variant="outline"
            className={
              categoriaAlta === "EMBAJADOR_SENIOR"
                ? "bg-purple-100 text-purple-800 border-purple-200 text-xs"
                : categoriaAlta === "EMBAJADOR"
                  ? "bg-blue-100 text-blue-800 border-blue-200 text-xs"
                  : "bg-teal-100 text-teal-800 border-teal-200 text-xs"
            }
          >
            {categoriaAlta === "EMBAJADOR_SENIOR" ? "Senior" : categoriaAlta === "EMBAJADOR" ? "Embajador" : "Junior"}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div className="p-10 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Gestión de Pagos</h1>
          <p className="text-muted-foreground">
            {periodosSeleccionados.length > 0
              ? `Mostrando pagos de ${periodosSeleccionados.length} periodos seleccionados`
              : "Mostrando todos los periodos (no hay selección)"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="mr-2">
                <Download className="mr-2 h-4 w-4" />
                Exportar Pagos
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="cursor-pointer" onClick={exportarTodosPagosPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Exportar a PDF
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={imprimirTodosPagosPDF}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="default" onClick={() => setShowCalculateDialog(true)} disabled={isCalculatingPayments}>
            {isCalculatingPayments ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Calculator className="mr-2 h-4 w-4" />
            )}
            Calcular Pagos
          </Button>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por instructor, periodo o estado..."
                className="pl-8 bg-background border-muted"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-[180px] bg-background border-muted">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                  <SelectItem value="APROBADO">Aprobados</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtroInstructor} onValueChange={setFiltroInstructor}>
                <SelectTrigger className="w-[180px] bg-background border-muted">
                  <Users className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Instructor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los instructores</SelectItem>
                  {instructores.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id.toString()}>
                      {instructor.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoadingPagos ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-lg border shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-foreground font-medium">
                        <Button
                          variant="ghost"
                          onClick={() => requestSort("instructorId")}
                          className="text-foreground group"
                        >
                          Instructor
                          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-foreground font-medium">
                        <Button
                          variant="ghost"
                          onClick={() => requestSort("periodoId")}
                          className="text-foreground group"
                        >
                          Periodo
                          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-foreground font-medium">
                        <Button variant="ghost" onClick={() => requestSort("monto")} className="text-foreground group">
                          Monto Base
                          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-foreground font-medium">Bono</TableHead>
                      <TableHead className="text-foreground font-medium">Reajuste</TableHead>
                      <TableHead className="text-foreground font-medium">Retención</TableHead>
                      <TableHead className="text-foreground font-medium">Monto Final</TableHead>
                      <TableHead className="text-foreground font-medium">
                        <Button variant="ghost" onClick={() => requestSort("estado")} className="text-primary group">
                          Estado
                          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right text-foreground font-medium">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPagos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                          No se encontraron pagos con los filtros seleccionados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedPagos.map((pago) => {
                        const montoFinal = calcularMontoFinal(pago)
                        const isEditing = editandoPagoId === pago.id

                        // Obtener el bono del pago
                        const bono = pago.bono || 0

                        return (
                          <TableRow key={pago.id} className="hover:bg-muted/20 transition-colors">
                            <TableCell>{getNombreInstructorConCategoria(pago.instructorId, pago.periodoId)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary/60" />
                                {getNombrePeriodo(pago.periodoId)}
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(pago.monto)}</TableCell>
                            <TableCell>
                              {bono > 0 ? (
                                <span className="text-green-600">{formatCurrency(bono)}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      value={nuevoReajuste}
                                      onChange={(e) => setNuevoReajuste(Number(e.target.value))}
                                      className="w-20 h-8 px-2 border rounded text-right"
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
                                            className="h-8 px-2 py-0"
                                            onClick={() => actualizarReajuste(pago.id)}
                                          >
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 px-2 py-0"
                                            onClick={cancelarEdicionReajuste}
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
                                      <RadioGroupItem value="FIJO" id={`fijo-${pago.id}`} className="h-3 w-3" />
                                      <Label htmlFor={`fijo-${pago.id}`} className="text-xs">
                                        Fijo
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <RadioGroupItem
                                        value="PORCENTAJE"
                                        id={`porcentaje-${pago.id}`}
                                        className="h-3 w-3"
                                      />
                                      <Label htmlFor={`porcentaje-${pago.id}`} className="text-xs">
                                        %
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {pago.reajuste > 0 ? (
                                    <div className="flex items-center gap-1">
                                      <span className="text-green-600">
                                        {pago.tipoReajuste === "PORCENTAJE"
                                          ? `+${pago.reajuste}%`
                                          : `+${formatCurrency(pago.reajuste)}`}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => iniciarEdicionReajuste(pago)}
                                      >
                                        <FileText className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : pago.reajuste < 0 ? (
                                    <div className="flex items-center gap-1">
                                      <span className="text-red-600">
                                        {pago.tipoReajuste === "PORCENTAJE"
                                          ? `${pago.reajuste}%`
                                          : formatCurrency(pago.reajuste)}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => iniciarEdicionReajuste(pago)}
                                      >
                                        <FileText className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <span className="text-muted-foreground">-</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => iniciarEdicionReajuste(pago)}
                                      >
                                        <FileText className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className={pago.retencion > 0 ? "text-red-600 " : ""}>
                              {pago.retencion > 0 ? `-${formatCurrency(pago.retencion)}` : "-"}
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(montoFinal)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getEstadoColor(pago.estado)}>
                                {pago.estado}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      className="cursor-pointer"
                                      onClick={() => exportarPagoPDF(pago.id)}
                                    >
                                      <FileText className="mr-2 h-4 w-4" />
                                      Exportar a PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="cursor-pointer"
                                      onClick={() => imprimirPagoPDF(pago.id)}
                                    >
                                      <Printer className="mr-2 h-4 w-4" />
                                      Imprimir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/pagos/${pago.id}`)}
                                  className="h-8 w-8 p-0 hover:bg-muted/50"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación mejorada */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Página {paginaActual} de {totalPaginas} • {sortedPagos.length} pagos
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaActual(paginaActual - 1)}
                      disabled={paginaActual === 1}
                      className="border-muted"
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                        let pageNum
                        if (totalPaginas <= 5) {
                          pageNum = i + 1
                        } else if (paginaActual <= 3) {
                          pageNum = i + 1
                        } else if (paginaActual >= totalPaginas - 2) {
                          pageNum = totalPaginas - 4 + i
                        } else {
                          pageNum = paginaActual - 2 + i
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === paginaActual ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPaginaActual(pageNum)}
                            className={pageNum === paginaActual ? "bg-primary text-primary-foreground" : "border-muted"}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                      {totalPaginas > 5 && paginaActual < totalPaginas - 2 && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      {totalPaginas > 5 && paginaActual < totalPaginas - 2 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaginaActual(totalPaginas)}
                          className="border-muted"
                        >
                          {totalPaginas}
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaActual(paginaActual + 1)}
                      disabled={paginaActual === totalPaginas}
                      className="border-muted"
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modificar este diálogo para incluir el checkbox */}
      <AlertDialog open={showCalculateDialog} onOpenChange={setShowCalculateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Calcular Pagos para Periodo</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción creará pagos para todos los instructores que no tengan pagos en el periodo seleccionado. Los
              montos se calcularán basados en las clases impartidas y las fórmulas de cada disciplina.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="periodo-calculo">Periodo para calcular pagos</Label>
              <Select
                value={selectedPeriodoId?.toString() || periodoActual?.id?.toString() || ""}
                onValueChange={(value) => setSelectedPeriodoId(Number(value))}
              >
                <SelectTrigger id="periodo-calculo" className="w-full mt-1">
                  <SelectValue placeholder="Seleccionar periodo" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((periodo) => (
                    <SelectItem key={periodo.id} value={periodo.id.toString()}>
                      Periodo {periodo.numero} - {periodo.año}
                      {periodo.id === periodoActual?.id ? " (Actual)" : ""}
                      {periodo.bonoCalculado ? " (Bono calculado)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch id="calcular-bono" checked={calcularBonoEnPeriodo} onCheckedChange={setCalcularBonoEnPeriodo} />
              <Label htmlFor="calcular-bono" className="cursor-pointer">
                Calcular bonos en este periodo
              </Label>
            </div>

            {selectedPeriodoId && (
              <div className="bg-muted/20 p-3 rounded-md text-sm">
                <p className="font-medium">Información de bonos:</p>
                {periodos.find((p) => p.id === selectedPeriodoId)?.bonoCalculado ? (
                  <p className="text-green-600 mt-1">✓ Ya se han calculado bonos para este periodo</p>
                ) : (
                  <p className="text-amber-600 mt-1">⚠️ No se han calculado bonos para este periodo</p>
                )}
                <p className="mt-2 text-muted-foreground">
                  Último periodo con bonos calculados:{" "}
                  {periodos.filter((p) => p.bonoCalculado).sort((a, b) => b.id - a.id)[0]
                    ? `Periodo ${periodos.filter((p) => p.bonoCalculado).sort((a, b) => b.id - a.id)[0].numero} - ${periodos.filter((p) => p.bonoCalculado).sort((a, b) => b.id - a.id)[0].año}`
                    : "Ninguno"}
                </p>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={calcularPagosPeriodo}>Calcular Pagos</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Process Logs Dialog */}
      <AlertDialog open={showProcessLogsDialog} onOpenChange={setShowProcessLogsDialog}>
        <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle>Proceso de Cálculo de Pagos</AlertDialogTitle>
            <AlertDialogDescription>Registro detallado del proceso de cálculo de pagos.</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex-1 overflow-y-auto my-4 p-4 bg-black/5 rounded-md font-mono text-sm">
            {processLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Iniciando proceso...
              </div>
            ) : (
              processLogs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogAction>Cerrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
