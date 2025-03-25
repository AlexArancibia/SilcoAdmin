"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, Calculator, Save, Download, FileText, Printer, AlertCircle, Info } from "lucide-react"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useClasesStore } from "@/store/useClasesStore"
import { usePagosStore } from "@/store/usePagosStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore" // Importar solo el store de disciplinas
import { toast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
import { EstadoPago } from "@/types/schema"

// Actualizar la interfaz InstructorPaymentCalculatorProps
interface InstructorPaymentCalculatorProps {
  instructorId: number
  instructorName: string
}

// Actualizar la interfaz ClassPaymentDetail para adaptarla al nuevo formato de detalles JSON
interface ClassPaymentDetail {
  claseId: number
  fecha: Date
  disciplina: string
  disciplinaId: number
  estudio: string
  reservas: number
  capacidad: number
  montoCalculado: number
  detalleCalculo?: any
  detalles?: string
}

interface PaymentSummary {
  totalClases: number
  totalMonto: number
}

export function InstructorPaymentCalculator({ instructorId, instructorName }: InstructorPaymentCalculatorProps) {
  const { periodos, periodoSeleccionadoId, setPeriodoSeleccionado, fetchPeriodos } = usePeriodosStore()
  const { clases, isLoading: isLoadingClases, fetchClases } = useClasesStore()
  const { crearPago, isLoading: isCreatingPago } = usePagosStore()
  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()

  const [activeTab, setActiveTab] = useState("calculo")
  const [paymentDetails, setPaymentDetails] = useState<ClassPaymentDetail[]>([])
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    totalClases: 0,
    totalMonto: 0,
  })
  const [comentarios, setComentarios] = useState("")
  const [estadoPago, setEstadoPago] = useState<EstadoPago>(EstadoPago.PENDIENTE)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const moneda = "PEN" // Moneda fija: Sol peruano

  // Cargar periodos y disciplinas al inicio
  useEffect(() => {
    fetchPeriodos()
    fetchDisciplinas()
  }, [fetchPeriodos, fetchDisciplinas])

  // Cargar clases cuando cambie el periodo seleccionado
  useEffect(() => {
    if (periodoSeleccionadoId) {
      fetchClases({ periodoId: periodoSeleccionadoId, instructorId })
    }
  }, [fetchClases, periodoSeleccionadoId, instructorId])

  // Calcular pagos cuando cambien las clases o se carguen las disciplinas
  useEffect(() => {
    if (clases.length > 0 && !isLoadingDisciplinas) {
      calculatePayments()
    } else {
      setPaymentDetails([])
      setPaymentSummary({
        totalClases: 0,
        totalMonto: 0,
      })
    }
  }, [clases, disciplinas, isLoadingDisciplinas])

  // Función para calcular los pagos de las clases usando las fórmulas de las disciplinas
  const calculatePayments = () => {
    const details: ClassPaymentDetail[] = []
    let totalMonto = 0

    clases.forEach((clase) => {
      // Obtener la disciplina
      const disciplina = disciplinas.find((d) => d.id === clase.disciplinaId)

      // Obtener la fórmula de la disciplina
      const formula = disciplina?.parametros?.formula || null

      // Datos para evaluar la fórmula
      const datosEvaluacion = {
        reservaciones: clase.reservasTotales,
        listaEspera: clase.listasEspera,
        cortesias: clase.cortesias,
        capacidad: clase.lugares,
        reservasPagadas: clase.reservasPagadas,
        lugares: clase.lugares,
      }

      let montoCalculado = 0
      let detalleCalculo = null

      // Evaluar la fórmula si existe
      if (formula) {
        try {
          const resultado = evaluarFormula(formula, datosEvaluacion)
          montoCalculado = resultado.valor
          detalleCalculo = resultado
        } catch (error) {
          console.error(`Error al evaluar fórmula para clase ${clase.id}:`, error)
          montoCalculado = 0
          detalleCalculo = { error: error instanceof Error ? error.message : "Error desconocido" }
        }
      } else {
        // Si no hay fórmula, registrar un error
        montoCalculado = 0
        detalleCalculo = { error: "No hay fórmula definida para esta disciplina" }
      }

      // Agregar a los totales
      totalMonto += montoCalculado

      // Agregar detalle de pago
      details.push({
        claseId: clase.id,
        fecha: clase.fecha,
        disciplina: disciplina?.nombre || `Disciplina ${clase.disciplinaId}`,
        disciplinaId: clase.disciplinaId,
        estudio: clase.estudio,
        reservas: clase.reservasTotales,
        capacidad: clase.lugares,
        montoCalculado,
        detalleCalculo,
      })
    })

    // Ordenar por fecha
    details.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

    setPaymentDetails(details)
    setPaymentSummary({
      totalClases: details.length,
      totalMonto,
    })
  }

  // Formatear fecha
  const formatDate = (date: Date) => {
    return format(new Date(date), "dd MMMM, yyyy", { locale: es })
  }

  // Formatear monto
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: moneda,
    }).format(amount)
  }

  // Actualizar la función handleSavePago para usar el nuevo formato
  const handleSavePago = async () => {
    if (!periodoSeleccionadoId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un periodo para guardar el pago",
        variant: "destructive",
      })
      return
    }

    try {
      // Crear objeto de pago con el nuevo formato
      const nuevoPago = {
        instructorId,
        periodoId: periodoSeleccionadoId,
        monto: paymentSummary.totalMonto,
        estado: estadoPago,
        detalles: {
          clases: paymentDetails.map((detail) => ({
            claseId: detail.claseId,
            montoCalculado: detail.montoCalculado,
            detalleCalculo: detail.detalleCalculo,
          })),
          resumen: {
            totalClases: paymentSummary.totalClases,
            totalMonto: paymentSummary.totalMonto,
            comentarios: comentarios,
            moneda: moneda,
          },
        },
      }

      // Guardar pago
      await crearPago(nuevoPago)

      toast({
        title: "Pago guardado",
        description: "El cálculo de pago ha sido guardado exitosamente",
      })

      setShowConfirmation(true)
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: error instanceof Error ? error.message : "Error desconocido al guardar el pago",
        variant: "destructive",
      })
    }
  }

  if (isLoadingClases || isLoadingDisciplinas) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="periodo">Periodo:</Label>
          <Select
            value={periodoSeleccionadoId?.toString() || ""}
            onValueChange={(value) => setPeriodoSeleccionado(value ? Number(value) : null)}
          >
            <SelectTrigger id="periodo" className="w-[200px]">
              <SelectValue placeholder="Seleccionar periodo" />
            </SelectTrigger>
            <SelectContent>
              {periodos.map((periodo) => (
                <SelectItem key={periodo.id} value={periodo.id.toString()}>
                  Periodo {periodo.numero} - {periodo.año}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" onClick={calculatePayments}>
          <Calculator className="mr-1 h-4 w-4" />
          Recalcular
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculo">Cálculo</TabsTrigger>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="guardar">Guardar</TabsTrigger>
        </TabsList>

        <TabsContent value="calculo">
          {clases.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-medium">No hay clases en este periodo</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  El instructor no tiene clases asignadas en el periodo seleccionado.
                </p>
                <Button className="mt-4" size="sm" onClick={() => setPeriodoSeleccionado(null)}>
                  Seleccionar otro periodo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Estudio</TableHead>
                    <TableHead>Reservas</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentDetails.map((detail) => (
                    <TableRow key={detail.claseId}>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                          {formatDate(detail.fecha)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{detail.disciplina}</Badge>
                      </TableCell>
                      <TableCell>{detail.estudio}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center">
                              {detail.reservas} / {detail.capacidad}
                              <Info className="ml-1 h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ocupación: {Math.round((detail.reservas / detail.capacidad) * 100)}%</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center justify-end">
                              {formatAmount(detail.montoCalculado)}
                              <Info className="ml-1 h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="w-64 max-w-sm">
                              {detail.detalleCalculo?.error ? (
                                <p className="text-red-500">Error: {detail.detalleCalculo.error}</p>
                              ) : detail.detalleCalculo?.mensaje ? (
                                <p>{detail.detalleCalculo.mensaje}</p>
                              ) : detail.detalleCalculo?.pasos ? (
                                <div className="space-y-1">
                                  <p className="font-semibold">Pasos de cálculo:</p>
                                  <ul className="text-xs space-y-1">
                                    {detail.detalleCalculo.pasos.map((paso: any, idx: number) => (
                                      <li key={idx}>{paso.descripcion}</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <p>No hay detalles disponibles</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="resumen">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total de clases:</span>
                    <span className="font-medium">{paymentSummary.totalClases}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium">Total a pagar:</span>
                    <span className="text-xl font-bold">{formatAmount(paymentSummary.totalMonto)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Información del pago</h3>
                    <p className="text-sm text-muted-foreground">Resumen del cálculo de pago para {instructorName}</p>
                  </div>

                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Instructor:</span>
                      <span>{instructorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Periodo:</span>
                      <span>
                        {periodoSeleccionadoId && periodos.find((p) => p.id === periodoSeleccionadoId)
                          ? `Periodo ${periodos.find((p) => p.id === periodoSeleccionadoId)?.numero} - ${periodos.find((p) => p.id === periodoSeleccionadoId)?.año}`
                          : "No seleccionado"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha de cálculo:</span>
                      <span>{formatDate(new Date())}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      <Printer className="mr-1 h-4 w-4" />
                      Imprimir
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="mr-1 h-4 w-4" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="guardar">
          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="comentarios">Comentarios</Label>
                <Textarea
                  id="comentarios"
                  placeholder="Añade comentarios o notas sobre este pago..."
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Estado del pago</Label>
                <Select value={estadoPago} onValueChange={(value) => setEstadoPago(value as EstadoPago)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                    <SelectItem value="APROBADO">Aprobado</SelectItem>
                    <SelectItem value="RECHAZADO">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border bg-muted/50 p-4">
              <div className="flex items-start gap-4">
                <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />
                <div className="space-y-1">
                  <h4 className="font-medium">Importante</h4>
                  <p className="text-sm text-muted-foreground">
                    Al guardar este cálculo, se registrará un nuevo pago en el sistema. Asegúrate de que todos los datos
                    son correctos antes de continuar.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("resumen")}>
                Volver al resumen
              </Button>
              <Button
                onClick={handleSavePago}
                disabled={isCreatingPago || paymentSummary.totalClases === 0 || !periodoSeleccionadoId}
              >
                {isCreatingPago ? (
                  <>Guardando...</>
                ) : (
                  <>
                    <Save className="mr-1 h-4 w-4" />
                    Guardar pago
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pago guardado exitosamente</AlertDialogTitle>
            <AlertDialogDescription>
              El cálculo de pago para {instructorName} ha sido guardado correctamente en el sistema. ¿Qué deseas hacer a
              continuación?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="outline">
                <FileText className="mr-1 h-4 w-4" />
                Ver recibo
              </Button>
            </AlertDialogAction>
            <AlertDialogAction asChild>
              <Button>
                <Calculator className="mr-1 h-4 w-4" />
                Nuevo cálculo
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

