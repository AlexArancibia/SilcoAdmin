"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { usePagosStore } from "@/store/usePagosStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { useClasesStore } from "@/store/useClasesStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { evaluarFormula } from "@/lib/formula-evaluator"
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
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react"
import type { EstadoPago, TipoReajuste, PagoInstructor } from "@/types/schema"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFormulasStore } from "@/store/useFormulaStore"
import { retencionValor } from "@/utils/const"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function PagosPage() {
  const router = useRouter()
  const { pagos, fetchPagos, actualizarPago, isLoading: isLoadingPagos } = usePagosStore()
  const { periodos, periodosSeleccionados, periodoActual } = usePeriodosStore()
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
  const elementosPorPagina = 10

  // Estados para edición de reajuste
  const [editandoPagoId, setEditandoPagoId] = useState<number | null>(null)
  const [nuevoReajuste, setNuevoReajuste] = useState<number>(0)
  const [tipoReajuste, setTipoReajuste] = useState<TipoReajuste>("FIJO")
  const [isActualizandoReajuste, setIsActualizandoReajuste] = useState<boolean>(false)

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

  // Función para calcular el monto final con retención y reajuste
  const calcularMontoFinal = (pago: PagoInstructor): number => {
    // Calcular el reajuste
    const reajusteCalculado = pago.tipoReajuste === "PORCENTAJE" ? (pago.monto * pago.reajuste) / 100 : pago.reajuste

    // Calcular el monto ajustado
    const montoAjustado = pago.monto + reajusteCalculado

    // Aplicar retención al monto ajustado
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
      // Calculate the adjusted amount first
      const montoBase = pago.monto
      const reajusteCalculado = tipoReajuste === "PORCENTAJE" ? (montoBase * nuevoReajuste) / 100 : nuevoReajuste

      // Calculate the retention based on the adjusted amount
      const montoAjustado = montoBase + reajusteCalculado
      const retencionPorcentaje = pago.retencion / pago.monto
      const nuevaRetencion = montoAjustado * retencionPorcentaje

      // Calculate the final payment
      const pagoFinal = montoAjustado - nuevaRetencion

      const pagoActualizado = {
        ...pago,
        reajuste: nuevoReajuste,
        tipoReajuste: tipoReajuste,
        retencion: nuevaRetencion,
        pagoFinal: pagoFinal,
      }

      await actualizarPago(pagoId, pagoActualizado)

      // Update only the specific payment in the local state
      const updatedPagos = pagos.map((p) => (p.id === pagoId ? pagoActualizado : p))

      // Update the pagos store directly without fetching all payments again
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

  // Función para recalcular todos los pagos
  const recalcularTodosPagos = async () => {
    console.log("[Recalcular] Iniciando recálculo de pagos...")
    console.log("[Recalcular] Periodo actual:", periodoActual?.id, periodoActual?.numero)

    if (periodosSeleccionados.length === 0) {
      console.error("[Recalcular] Error: No hay periodos seleccionados")
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
      console.log("[Recalcular] Obteniendo instructores...")
      const todosInstructores = instructores
      console.log("[Recalcular] Total instructores:", todosInstructores.length)

      let pagosActualizados = 0
      let instructoresSinClases = 0

      for (const instructor of todosInstructores) {
        console.log(`\n[Recalcular] Procesando instructor ${instructor.id} - ${instructor.nombre}`)

        const pagoExistente = pagos.find((p) => p.instructorId === instructor.id && p.periodoId === periodoActual!.id)

        if (!pagoExistente) {
          console.error(
            `[Recalcular] ERROR: No se encontró pago existente para instructor ${instructor.id} en periodo ${periodoActual!.id}`,
          )
          continue
        }

        console.log(
          `[Recalcular] Pago existente encontrado (ID: ${pagoExistente.id}) con monto actual:`,
          pagoExistente.monto,
        )

        const clasesInstructor = clases.filter(
          (clase) => clase.instructorId === instructor.id && clase.periodoId === periodoActual?.id,
        )

        if (clasesInstructor.length === 0) {
          console.log(`[Recalcular] Instructor sin clases, actualizando pago a monto 0`)
          instructoresSinClases++

          await actualizarPago(pagoExistente.id, {
            ...pagoExistente,
            monto: 0,
            pagoFinal: 0,
            detalles: {
              ...pagoExistente.detalles,
              clases: [],
              resumen: {
                ...pagoExistente.detalles?.resumen,
                totalClases: 0,
                totalMonto: 0,
                comentarios: `Recalculado sin clases el ${new Date().toLocaleDateString()}`,
              },
            },
          })
          continue
        }

        let montoTotal = 0
        const detallesClases = []

        for (const clase of clasesInstructor) {
          const formula = formulas.find(
            (f) => f.disciplinaId === clase.disciplinaId && f.periodoId === periodoActual?.id,
          )

          let montoCalculado = 0
          if (formula) {
            try {
              const resultado = evaluarFormula(formula.parametros.formula, {
                reservaciones: Number(clase.reservasTotales) || 0,
                listaEspera: Number(clase.listasEspera) || 0,
                cortesias: Number(clase.cortesias) || 0,
                capacidad: Number(clase.lugares) || 0,
                reservasPagadas: Number(clase.reservasPagadas) || 0,
                lugares: Number(clase.lugares) || 0,
              })
              montoCalculado = resultado.valor
            } catch (error) {
              console.error("[Recalcular] Error al evaluar fórmula:", error)
            }
          }

          montoTotal += montoCalculado
          detallesClases.push({
            claseId: clase.id,
            montoCalculado,
            disciplinaId: clase.disciplinaId,
            fechaClase: clase.fecha,
          })
        }

        // Calcular el reajuste
        const reajusteCalculado =
          pagoExistente.tipoReajuste === "PORCENTAJE"
            ? (montoTotal * pagoExistente.reajuste) / 100
            : pagoExistente.reajuste

        // Calcular el monto ajustado
        const montoAjustado = montoTotal + reajusteCalculado

        // Calcular la retención basada en el porcentaje actual
        const retencionPorcentaje = retencionValor
        const retencionCalculada = montoAjustado * retencionPorcentaje

        // Calcular el pago final
        const pagoFinalCalculado = montoAjustado - retencionCalculada

        await actualizarPago(pagoExistente.id, {
          ...pagoExistente,
          monto: montoTotal,
          retencion: retencionCalculada,
          pagoFinal: pagoFinalCalculado,
          detalles: {
            ...pagoExistente.detalles,
            clases: detallesClases,
            resumen: {
              ...pagoExistente.detalles?.resumen,
              totalClases: detallesClases.length,
              totalMonto: montoTotal,
              comentarios: `Recalculado el ${new Date().toLocaleDateString()}`,
            },
          },
        })
        pagosActualizados++
      }

      console.log("\n[Recalcular] Proceso completado. Resumen:", {
        pagosActualizados,
        instructoresSinClases,
        totalInstructores: todosInstructores.length,
      })

      await fetchPagos()
      toast({
        title: "Recálculo completado",
        description: `Se han actualizado ${pagosActualizados} pagos. ${instructoresSinClases} instructores sin clases.`,
      })
    } catch (error) {
      console.error("[Recalcular] Error en el proceso:", error)
      toast({
        title: "Error al recalcular pagos",
        description: error instanceof Error ? error.message : "Error desconocido al recalcular pagos",
        variant: "destructive",
      })
    } finally {
      console.log("[Recalcular] Finalizando proceso")
      setIsRecalculando(false)
    }
  }

  return (
    <div className="px-6 py-6 space-y-6">
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

          <Button
            variant="default"
            onClick={() => setShowConfirmDialog(true)}
            disabled={isRecalculando || periodosSeleccionados.length === 0}
          >
            {isRecalculando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Recalcular Periodo Actual
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
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                          No se encontraron pagos con los filtros seleccionados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedPagos.map((pago) => {
                        const montoFinal = calcularMontoFinal(pago)
                        const isEditing = editandoPagoId === pago.id

                        return (
                          <TableRow key={pago.id} className="hover:bg-muted/20 transition-colors">
                            <TableCell className="font-medium">{getNombreInstructor(pago.instructorId)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary/60" />
                                {getNombrePeriodo(pago.periodoId)}
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(pago.monto)}</TableCell>
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

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar recálculo del Periodo Actual</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción recalculará los pagos de todos los instructores para los periodos seleccionados. Los montos se
              actualizarán basados en las clases impartidas y las fórmulas de cada disciplina. ¿Estás seguro de que
              deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={recalcularTodosPagos}>Recalcular Pagos</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

