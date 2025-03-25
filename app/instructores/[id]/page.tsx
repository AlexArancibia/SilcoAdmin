"use client"

import { use, useEffect, useState } from "react"
import { notFound } from "next/navigation"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { useClasesStore } from "@/store/useClasesStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { usePagosStore } from "@/store/usePagosStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InstructorPaymentHistory } from "@/components/instructors/instructor-payment-history"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Calendar,
  DollarSign,
  Users,
  BarChart3,
  Award,
  Briefcase,
  Calculator,
  Info,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { evaluarFormula } from "@/lib/formula-evaluator"
import type { Instructor, PagoInstructor } from "@/types/schema"
import { motion } from "framer-motion"
import { toast } from "@/components/ui/use-toast"

export default function InstructorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const instructorId = Number.parseInt(resolvedParams.id)
  const { fetchInstructor, instructorSeleccionado, isLoading, error } = useInstructoresStore()
  const { fetchClases, clases, isLoading: isLoadingClases } = useClasesStore()
  const { periodos, periodoSeleccionadoId, setPeriodoSeleccionado, fetchPeriodos } = usePeriodosStore()
  const { pagos, fetchPagos, isLoading: isLoadingPagos, actualizarPago } = usePagosStore()
  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()
  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [activeTab, setActiveTab] = useState("clases-pagos")
  const [paymentDetails, setPaymentDetails] = useState<any[]>([])
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null)
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false)

  useEffect(() => {
    if (isNaN(instructorId)) {
      notFound()
    }

    const loadData = async () => {
      try {
        await fetchInstructor(instructorId)
        await fetchPeriodos()
        await fetchDisciplinas()
        if (periodoSeleccionadoId) {
          await fetchClases({ instructorId, periodoId: periodoSeleccionadoId })
          await fetchPagos({ periodoId: periodoSeleccionadoId, instructorId })
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
      }
    }

    loadData()
  }, [instructorId, fetchInstructor, fetchPeriodos, fetchDisciplinas, fetchClases, fetchPagos, periodoSeleccionadoId])

  // Actualizar el estado local cuando cambie instructorSeleccionado
  useEffect(() => {
    if (instructorSeleccionado) {
      setInstructor(instructorSeleccionado)
    }
  }, [instructorSeleccionado])

  // Calcular pagos cuando cambien las clases o se carguen las disciplinas
  useEffect(() => {
    if (clases.length > 0 && !isLoadingDisciplinas) {
      calculatePayments()
    }
  }, [clases, disciplinas, isLoadingDisciplinas])

  // Función para calcular los pagos de las clases usando las fórmulas de las disciplinas
  const calculatePayments = () => {
    const details: any[] = []

    // Registrar la fecha de actualización
    setUltimaActualizacion(new Date())

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
  }

  // Función para actualizar el pago
  const handleUpdatePayment = async () => {
    if (!instructor || !periodoSeleccionadoId) {
      toast({
        title: "Error",
        description: "No se puede actualizar el pago sin instructor o periodo seleccionado",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingPayment(true)
    try {
      // Calcular el monto total
      const totalMonto = paymentDetails.reduce((sum, detail) => sum + detail.montoCalculado, 0)

      // Buscar el pago existente para este instructor y periodo
      const existingPago = pagos.find((p) => p.instructorId === instructorId && p.periodoId === periodoSeleccionadoId)

      if (!existingPago) {
        toast({
          title: "Error",
          description: "No se encontró un pago existente para actualizar",
          variant: "destructive",
        })
        return
      }

      // Datos actualizados del pago
      const pagoData: Partial<PagoInstructor> = {
        monto: totalMonto,
        detalles: {
          clases: paymentDetails.map((detail) => ({
            claseId: detail.claseId,
            monto: detail.montoCalculado,
            fecha: detail.fecha,
            disciplina: detail.disciplina,
          })),
        },
      }

      // Actualizar el pago existente
      await actualizarPago(existingPago.id, pagoData)

      toast({
        title: "Pago actualizado",
        description: `Se ha actualizado el pago por un monto de ${formatAmount(totalMonto)}`,
        variant: "default",
      })

      // Actualizar la lista de pagos
      await fetchPagos({ periodoId: periodoSeleccionadoId, instructorId })

      setUltimaActualizacion(new Date())
    } catch (error) {
      console.error("Error al actualizar pago:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el pago. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingPayment(false)
    }
  }

  if (isLoading || !instructor) {
    return <InstructorDetailSkeleton />
  }

  if (error) {
    notFound()
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return "N/A"
    return format(new Date(date), "dd MMMM, yyyy", { locale: es })
  }

  // Formatear monto
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount)
  }

  // Calcular estadísticas básicas
  const totalClases = clases.length
  const clasesCompletadas = clases.filter((c) => new Date(c.fecha) < new Date()).length
  const ocupacionPromedio =
    clases.length > 0
      ? Math.round(clases.reduce((sum, c) => sum + (c.reservasTotales / c.lugares) * 100, 0) / clases.length)
      : 0

  // Calcular monto total pendiente (simplificado)
  const montoPendiente = pagos.find((p) => p.estado === "PENDIENTE")?.monto || 0
  const montoAprobado = pagos.find((p) => p.estado === "APROBADO")?.monto || 0
  const totalMonto = paymentDetails.reduce((sum, detail) => sum + detail.montoCalculado, 0)

  // Obtener datos del instructor
  const telefono = instructor.extrainfo?.telefono || "No disponible"
  const especialidad = instructor.extrainfo?.especialidad || "No especificada"
  const estado = instructor.extrainfo?.activo ? "activo" : "inactivo"
  const foto = instructor.extrainfo?.foto
  const biografia = instructor.extrainfo?.biografia || "Sin biografia"
  const experiencia = instructor.extrainfo?.experiencia || 0

  // Obtener disciplinas
  const disciplinasInstructor = instructor.disciplinas?.map((d) => d.nombre || `Disciplina ${d.id}`) || []

  const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 },
  }

  return (
    <motion.div className="container mx-auto py-6" {...fadeIn}>
      {/* Header con selector de periodo e información principal */}
      <div className="bg-card rounded-lg p-6 mb-6 border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={foto || `/placeholder.svg?height=48&width=48`} alt={instructor.nombre} />
                <AvatarFallback className="text-lg">{instructor.nombre.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{instructor.nombre}</h1>
                <div className="text-muted-foreground flex items-center gap-1 text-sm">
                  <Badge variant={estado === "activo" ? "default" : "secondary"} className="mr-2">
                    {estado === "activo" ? "Activo" : "Inactivo"}
                  </Badge>
                  {disciplinasInstructor.length > 0 && (
                    <span>
                      {disciplinasInstructor[0]}
                      {disciplinasInstructor.length > 1 ? ` +${disciplinasInstructor.length - 1} más` : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right mr-2">
              <p className="text-sm text-muted-foreground">Periodo actual</p>
              <p className="font-medium">
                {periodoSeleccionadoId
                  ? periodos.find((p) => p.id === periodoSeleccionadoId)?.numero +
                    " - " +
                    periodos.find((p) => p.id === periodoSeleccionadoId)?.año
                  : "No seleccionado"}
              </p>
            </div>
            <Select
              value={periodoSeleccionadoId?.toString() || ""}
              onValueChange={(value) => setPeriodoSeleccionado(value ? Number(value) : null)}
            >
              <SelectTrigger className="w-[180px]">
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
        </div>

        {/* Resumen de estadísticas clave */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-background rounded-md p-3 border flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clases</p>
              <p className="text-lg font-bold">{totalClases}</p>
            </div>
          </div>
          <div className="bg-background rounded-md p-3 border flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ocupación</p>
              <p className="text-lg font-bold">{ocupacionPromedio}%</p>
            </div>
          </div>
          <div className="bg-background rounded-md p-3 border flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendiente</p>
              <p className="text-lg font-bold">{formatAmount(montoPendiente)}</p>
            </div>
          </div>
          <div className="bg-background rounded-md p-3 border flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{formatAmount(totalMonto)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="clases-pagos">Clases y Pagos</TabsTrigger>
          <TabsTrigger value="rendimiento">Rendimiento</TabsTrigger>
        </TabsList>

        {/* Tab de Clases y Pagos (combinado) */}
        <TabsContent value="clases-pagos">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Clases y cálculo de pagos</CardTitle>
                  <CardDescription>Listado de clases y cálculo de pagos para el instructor</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground flex items-center">
                    {ultimaActualizacion && (
                      <div className="flex items-center mr-3">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Actualizado: {format(ultimaActualizacion, "dd/MM/yyyy HH:mm", { locale: es })}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUpdatePayment}
                    disabled={isUpdatingPayment || !periodoSeleccionadoId || clases.length === 0}
                    className="flex items-center gap-1"
                  >
                    {isUpdatingPayment ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Actualizar pago
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingClases || isLoadingDisciplinas ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : clases.length === 0 ? (
                  <div className="text-center py-6">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-medium">No hay clases</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      No hay clases asignadas en el periodo seleccionado.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-4 bg-muted/30 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total calculado</p>
                          <p className="text-xl font-bold">{formatAmount(totalMonto)}</p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>
                          Total de clases: <span className="font-medium">{totalClases}</span>
                        </p>
                        <p>
                          Periodo:{" "}
                          <span className="font-medium">
                            {periodoSeleccionadoId
                              ? periodos.find((p) => p.id === periodoSeleccionadoId)?.numero +
                                " - " +
                                periodos.find((p) => p.id === periodoSeleccionadoId)?.año
                              : "No seleccionado"}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="rounded-md border overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="py-3 px-4 text-left font-medium">Fecha</th>
                            <th className="py-3 px-4 text-left font-medium">Disciplina</th>
                            <th className="py-3 px-4 text-left font-medium">Estudio</th>
                            <th className="py-3 px-4 text-left font-medium">Reservas</th>
                            <th className="py-3 px-4 text-right font-medium">Monto calculado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {paymentDetails.map((detail) => (
                            <tr key={detail.claseId} className="hover:bg-muted/30">
                              <td className="py-3 px-4">
                                <div className="flex items-center">
                                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                  {formatDate(detail.fecha)}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant="outline">{detail.disciplina}</Badge>
                              </td>
                              <td className="py-3 px-4">{detail.estudio}</td>
                              <td className="py-3 px-4">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="flex items-center">
                                      <div className="flex items-center">
                                        <div className="w-16 bg-gray-200 rounded-full h-2 dark:bg-gray-700 mr-2">
                                          <div
                                            className="bg-primary h-2 rounded-full"
                                            style={{
                                              width: `${Math.round((detail.reservas / detail.capacidad) * 100)}%`,
                                            }}
                                          ></div>
                                        </div>
                                        <span>
                                          {detail.reservas} / {detail.capacidad}
                                        </span>
                                        <Info className="ml-1 h-3 w-3 text-muted-foreground" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Ocupación: {Math.round((detail.reservas / detail.capacidad) * 100)}%</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </td>
                              <td className="py-3 px-4 text-right font-medium">
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
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Periodo actual:{" "}
                    {periodoSeleccionadoId
                      ? periodos.find((p) => p.id === periodoSeleccionadoId)?.numero +
                        " - " +
                        periodos.find((p) => p.id === periodoSeleccionadoId)?.año
                      : "No seleccionado"}
                  </p>
                </div>
                <Button
                  onClick={handleUpdatePayment}
                  disabled={isUpdatingPayment || !periodoSeleccionadoId || clases.length === 0}
                  className="flex items-center gap-2"
                >
                  {isUpdatingPayment ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Actualizando pago...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4" />
                      Actualizar pago
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Estado del pago actual</CardTitle>
                  <CardDescription>Información del pago para el periodo actual</CardDescription>
                </div>
                {ultimaActualizacion && (
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Actualizado: {format(ultimaActualizacion, "dd/MM/yyyy HH:mm", { locale: es })}</span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {isLoadingPagos ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : pagos.length === 0 ? (
                  <div className="text-center py-6 bg-muted/20 rounded-lg border border-dashed">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-medium">No hay pagos registrados</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Utilice el botón "Actualizar pago" para crear un nuevo pago para este periodo.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pagos.map((pago) => (
                      <div key={pago.id} className="bg-muted/20 p-4 rounded-lg border">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            {pago.estado === "APROBADO" ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <Clock className="h-5 w-5 text-amber-500" />
                            )}
                            <h3 className="text-lg font-medium">
                              Pago {pago.estado === "APROBADO" ? "aprobado" : "pendiente"}
                            </h3>
                          </div>
                          <Badge
                            variant={
                              pago.estado === "APROBADO"
                                ? "default"
                                : pago.estado === "PENDIENTE"
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {pago.estado}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Monto</p>
                            <p className="text-xl font-bold">{formatAmount(pago.monto)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Fecha de pago</p>
                            <p className="font-medium">
                              {pago.periodo?.fechaPago ? formatDate(pago.periodo.fechaPago) : "Pendiente"}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>
                            Periodo: {pago.periodo?.numero} - {pago.periodo?.año}
                          </p>
                          <p>ID de pago: {pago.id}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historial de pagos</CardTitle>
                <CardDescription>Registro de todos los pagos realizados</CardDescription>
              </CardHeader>
              <CardContent>
                <InstructorPaymentHistory instructorId={instructorId} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab de Rendimiento */}
        <TabsContent value="rendimiento">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ocupación por clase</CardTitle>
                <CardDescription>Porcentaje de ocupación de tus clases</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
                    <p className="mt-4 text-muted-foreground">Ocupación promedio: {ocupacionPromedio}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Clases por disciplina</CardTitle>
                <CardDescription>Distribución de clases por disciplina</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Briefcase className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
                    <p className="mt-4 text-muted-foreground">{totalClases} clases en total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ingresos mensuales</CardTitle>
                <CardDescription>Evolución de tus ingresos por mes</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <DollarSign className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
                    <p className="mt-4 text-muted-foreground">Total: {formatAmount(montoPendiente + montoAprobado)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rendimiento general</CardTitle>
                <CardDescription>Métricas clave de tu desempeño</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Ocupación</span>
                      <span className="text-sm font-medium">{ocupacionPromedio}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${ocupacionPromedio}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Clases completadas</span>
                      <span className="text-sm font-medium">
                        {clasesCompletadas} / {totalClases}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${totalClases > 0 ? (clasesCompletadas / totalClases) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h4 className="text-sm font-medium mb-3">Logros</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 p-3 rounded-lg border">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Award className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">Instructor destacado</div>
                          <div className="text-xs text-muted-foreground">Ocupación superior al 80%</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg border">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">Clases llenas</div>
                          <div className="text-xs text-muted-foreground">5 clases con 100% de ocupación</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

function InstructorDetailSkeleton() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <Skeleton className="h-10 w-1/3 mb-4" />
        <Skeleton className="h-6 w-2/3" />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-2">
          <Skeleton className="h-[500px] w-full rounded-lg" />
        </div>
        <div className="md:col-span-5">
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-[500px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

