"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { usePagosStore } from "@/store/usePagosStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useClasesStore } from "@/store/useClasesStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { evaluarFormula } from "@/lib/formula-evaluator"
 
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
  RefreshCw,
  Users,
  X,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { EstadoPago, TipoReajuste, Instructor, Periodo, Clase } from "@/types/schema"
import { downloadPagoPDF, printPagoPDF } from "@/utils/pago-instructor-pdf"
import { retencionValor } from "@/utils/const"
 
 

export default function PagoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const pagoId = Number.parseInt(resolvedParams.id)

  const { pagos, pagoSeleccionado, fetchPagos, fetchPago, actualizarPago, isLoading: isLoadingPagos } = usePagosStore()

  const { instructores, fetchInstructores } = useInstructoresStore()
  const { periodos, fetchPeriodos } = usePeriodosStore()
  const { clases, fetchClases, isLoading: isLoadingClases } = useClasesStore()
  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()

  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [periodo, setPeriodo] = useState<Periodo | null>(null)
  const [clasesInstructor, setClasesInstructor] = useState<Clase[]>([])
  const [isRecalculando, setIsRecalculando] = useState<boolean>(false)
  const [isActualizandoReajuste, setIsActualizandoReajuste] = useState<boolean>(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>("detalles")
  const [editandoReajuste, setEditandoReajuste] = useState<boolean>(false)
  const [nuevoReajuste, setNuevoReajuste] = useState<number>(0)
  const [tipoReajuste, setTipoReajuste] = useState<TipoReajuste>("FIJO")

  // Cargar datos iniciales
  useEffect(() => {
    fetchPago(pagoId)
    fetchInstructores()
    fetchPeriodos()
    fetchDisciplinas()
  }, [pagoId, fetchPago, fetchInstructores, fetchPeriodos, fetchDisciplinas])

  // Obtener instructor y periodo cuando se carguen los datos
  useEffect(() => {
    if (pagoSeleccionado && instructores.length > 0 && periodos.length > 0) {
      setInstructor(instructores.find((i) => i.id === pagoSeleccionado.instructorId) || null)
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
  }, [pagoSeleccionado, instructores, periodos, fetchClases])

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
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  // Función para obtener la fórmula de una disciplina para un periodo específico
  const getFormulaDisciplina = (disciplinaId: number, periodoId: number) => {
    const disciplina = disciplinas.find((d) => d.id === disciplinaId)
    if (!disciplina || !disciplina.formulas) return null

    const formulaDB = disciplina.formulas.find((f) => f.periodoId === periodoId)
    return formulaDB ? formulaDB.parametros.formula : null
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
    if (!pagoSeleccionado || !instructor || !periodo) return;
    downloadPagoPDF(pagoSeleccionado, instructor, periodo, clasesInstructor, disciplinas);
  };
  
  const handlePrint = () => {
    if (!pagoSeleccionado || !instructor || !periodo) return;
    printPagoPDF(pagoSeleccionado, instructor, periodo, clasesInstructor, disciplinas);
  };

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
  const reajusteCalculado =
    pagoSeleccionado.tipoReajuste === "PORCENTAJE"
      ? (pagoSeleccionado.monto * pagoSeleccionado.reajuste) / 100
      : pagoSeleccionado.reajuste
  const montoFinalCalculado = calcularMontoFinal(
    pagoSeleccionado.monto,
    pagoSeleccionado.retencion,
    pagoSeleccionado.reajuste,
    pagoSeleccionado.tipoReajuste,
  )

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card rounded-lg p-4 shadow-sm border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/pagos")} className="h-10 w-10 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Detalle de Pago</h1>
            <div className="flex items-center mt-1">
              <Badge variant="outline" className="mr-2 font-medium">
                {pagoSeleccionado.estado}
              </Badge>
              <div className="flex items-center">
                <p className="text-muted-foreground">
                  {instructor.nombre} - {periodo ? `Periodo ${periodo.numero} - ${periodo.año}` : ""}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-6 w-6 p-0 rounded-full"
                  onClick={() => router.push(`/instructores/${instructor.id}`)}
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
              <Button variant="outline" size="sm" className="h-9">
                <Download className="mr-2 h-4 w-4" />
                Exportar
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="cursor-pointer" onClick={handleExportPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Exportar a PDF
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

 
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="bg-muted/10 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-xl text-primary">Información del Pago</CardTitle>
            <CardDescription className="mt-1">Detalles y estado del pago para {instructor.nombre}</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-card rounded-md px-3 py-1.5 border shadow-sm">
              <span className="text-sm font-medium mr-2">Estado:</span>
              <Badge variant="outline" className={`${getEstadoColor(pagoSeleccionado.estado)} ml-1`}>
                {pagoSeleccionado.estado}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={toggleEstadoPago}>
              {pagoSeleccionado.estado === "PENDIENTE" ? "Aprobar" : "Pendiente"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex flex-wrap mb-6 bg-muted/30 p-1 rounded-lg">
              <TabsTrigger
                value="detalles"
                className="flex-1 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                <FileText className="h-4 w-4 mr-2 hidden sm:inline-block" />
                Detalles del Pago
              </TabsTrigger>
              <TabsTrigger
                value="clases"
                className="flex-1 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                <Calendar className="h-4 w-4 mr-2 hidden sm:inline-block" />
                Clases Incluidas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="detalles" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium">Información General</h3>
                    <div className="ml-2 px-2 py-0.5 bg-primary/10 rounded text-xs font-medium text-primary">
                      ID: {pagoSeleccionado.id}
                    </div>
                  </div>
                  <Separator className="my-2" />

                  <div className="grid grid-cols-1 gap-3 bg-muted/5 p-4 rounded-lg border">
                    <div className="flex justify-between items-center py-1 border-b border-dashed">
                      <div className="text-sm font-medium">Instructor:</div>
                      <div className="font-medium">{instructor.nombre}</div>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-dashed">
                      <div className="text-sm font-medium">Periodo:</div>
                      <div>
                        <span className="px-2 py-0.5 bg-primary/10 rounded-full text-xs font-medium text-primary">
                          {periodo.numero} - {periodo.año}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-dashed">
                      <div className="text-sm font-medium">Estado:</div>
                      <Badge variant="outline" className={getEstadoColor(pagoSeleccionado.estado)}>
                        {pagoSeleccionado.estado}
                      </Badge>
                    </div>

                    <div className="mt-2 pt-2 border-t">
                      <div className="text-sm font-medium mb-2">Desglose del Pago:</div>
                      <div className="space-y-2 bg-card p-3 rounded-md shadow-sm">
                        <div className="flex justify-between items-center">
                          <div className="text-sm">Monto Base:</div>
                          <div className="font-medium">{formatCurrency(pagoSeleccionado.monto)}</div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="text-sm">Retención:</div>
                          <div className="text-red-600 font-medium">-{formatCurrency(pagoSeleccionado.retencion)}</div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="text-sm">Reajuste:</div>
                          {editandoReajuste ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={nuevoReajuste}
                                  onChange={(e) => setNuevoReajuste(Number(e.target.value))}
                                  className="w-24 h-8 px-2 border rounded text-right"
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
                                        onClick={actualizarReajuste}
                                      >
                                        <Check className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 px-2 py-0"
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
                                  <Label htmlFor="fijo" className="text-xs">
                                    Fijo
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <RadioGroupItem value="PORCENTAJE" id="porcentaje" className="h-4 w-4" />
                                  <Label htmlFor="porcentaje" className="text-xs">
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
                                    ? "text-green-600 font-medium"
                                    : "text-red-600 font-medium"
                                }
                              >
                                {pagoSeleccionado.tipoReajuste === "PORCENTAJE"
                                  ? `${pagoSeleccionado.reajuste >= 0 ? "+" : ""}${pagoSeleccionado.reajuste}%`
                                  : `${pagoSeleccionado.reajuste >= 0 ? "+" : ""}${formatCurrency(pagoSeleccionado.reajuste)}`}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  setNuevoReajuste(pagoSeleccionado.reajuste)
                                  setTipoReajuste(pagoSeleccionado.tipoReajuste)
                                  setEditandoReajuste(true)
                                }}
                              >
                                <FileText className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>

                        <Separator className="my-1" />

                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium">Monto Final:</div>
                          <div className="font-bold text-lg">
                            {formatCurrency(
                              calcularMontoFinal(
                                pagoSeleccionado.monto,
                                pagoSeleccionado.retencion,
                                pagoSeleccionado.reajuste,
                                pagoSeleccionado.tipoReajuste,
                              ),
                            )}
                          </div>
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
                    <h3 className="text-lg font-medium">Resumen del Cálculo</h3>
                    <Separator className="my-2" />
                  </div>

                  <div className="grid grid-cols-1 gap-3 bg-muted/5 p-4 rounded-lg border">
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                        <span className="font-medium">Total de Clases:</span>
                      </div>
                      <Badge variant="outline" className="bg-primary/5">
                        {pagoSeleccionado.detalles?.resumen?.totalClases || clasesInstructor.length}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-primary" />
                        <span className="font-medium">Ocupación Promedio:</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`${
                          ocupacionPromedio >= 80
                            ? "bg-green-100 text-green-800"
                            : ocupacionPromedio >= 50
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {ocupacionPromedio}%
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-primary" />
                        <span className="font-medium">Total Reservas:</span>
                      </div>
                      <div className="font-medium">
                        {totalReservas} / {totalCapacidad}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center">
                        <Percent className="h-4 w-4 mr-2 text-primary" />
                        <span className="font-medium">Tipo de Reajuste:</span>
                      </div>
                      <Badge variant="outline" className="bg-primary/5">
                        {pagoSeleccionado.tipoReajuste}
                      </Badge>
                    </div>

                    <div className="mt-2">
                      <div className="text-sm font-medium mb-2">Comentarios:</div>
                      <div className="text-sm bg-muted/20 p-3 rounded-md">
                        {pagoSeleccionado.detalles?.resumen?.comentarios || "Sin comentarios"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="clases" className="space-y-6">
              {clasesInstructor.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">No hay clases registradas</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    El instructor no tiene clases asignadas en este periodo.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="text-primary font-medium whitespace-nowrap">Fecha</TableHead>
                          <TableHead className="text-primary font-medium whitespace-nowrap">Disciplina</TableHead>
                          <TableHead className="text-primary font-medium whitespace-nowrap">Estudio</TableHead>
                          <TableHead className="text-primary font-medium whitespace-nowrap">Reservas</TableHead>
                          <TableHead className="text-primary font-medium whitespace-nowrap">Lista Espera</TableHead>
                          <TableHead className="text-primary font-medium whitespace-nowrap">Cortesías</TableHead>
                          <TableHead className="text-primary font-medium whitespace-nowrap">Monto</TableHead>
                          <TableHead className="text-primary font-medium w-10"></TableHead>
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
                            if (ocupacionPorcentaje >= 80) return "text-green-600 bg-green-50"
                            if (ocupacionPorcentaje >= 50) return "text-amber-600 bg-amber-50"
                            return "text-red-600 bg-red-50"
                          }

                          return (
                            <TableRow key={clase.id} className="hover:bg-muted/10 transition-colors">
                              <TableCell className="font-medium whitespace-nowrap">
                                {new Date(clase.fecha).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                                  {disciplina?.nombre || `Disciplina ${clase.disciplinaId}`}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span>{clase.estudio}</span>
                                  <span className="text-xs text-muted-foreground">{clase.salon}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <div className="w-full max-w-[100px] bg-muted rounded-full h-2 mr-2">
                                    <div
                                      className="bg-primary h-2 rounded-full"
                                      style={{ width: `${Math.min(ocupacionPorcentaje, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${getOcupacionColor()}`}>
                                    {clase.reservasTotales}/{clase.lugares}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {clase.listasEspera > 0 ? (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-700">
                                    {clase.listasEspera}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">0</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {clase.cortesias > 0 ? (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                    {clase.cortesias}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">0</span>
                                )}
                              </TableCell>
                              <TableCell className="font-medium">
                                {detalleClase ? formatCurrency(detalleClase.montoCalculado) : "-"}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                                  <Info className="h-4 w-4" />
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

 
    </div>
  )
}

