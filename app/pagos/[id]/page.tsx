"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Calculator,
  Check,
  ChevronDown,
  Download,
  FileText,
  Info,
  Loader2,
  Printer,
  RefreshCw,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { EstadoPago } from "@/types/schema"
import { PagoDetalleStats } from "@/components/payments/pago-detalle-stats"

interface PagoDetallePageProps {
  params: {
    id: string
  }
}

export default function PagoDetallePage({ params }: PagoDetallePageProps) {
  const router = useRouter()
  const pagoId = Number.parseInt(params.id)

  const { pagos, fetchPagos, actualizarPago, isLoading: isLoadingPagos } = usePagosStore()
  const { instructores, fetchInstructores } = useInstructoresStore()
  const { periodos, fetchPeriodos } = usePeriodosStore()
  const { clases, fetchClases, isLoading: isLoadingClases } = useClasesStore()
  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()

  const [pago, setPago] = useState<any | null>(null)
  const [instructor, setInstructor] = useState<any | null>(null)
  const [periodo, setPeriodo] = useState<any | null>(null)
  const [clasesInstructor, setClasesInstructor] = useState<any[]>([])
  const [isRecalculando, setIsRecalculando] = useState<boolean>(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false)
  const [showEstadoDialog, setShowEstadoDialog] = useState<boolean>(false)
  const [nuevoEstado, setNuevoEstado] = useState<EstadoPago | null>(null)
  const [activeTab, setActiveTab] = useState<string>("detalles")

  // Cargar datos iniciales
  useEffect(() => {
    fetchPagos()
    fetchInstructores()
    fetchPeriodos()
    fetchDisciplinas()
  }, [fetchPagos, fetchInstructores, fetchPeriodos, fetchDisciplinas])

  // Obtener pago, instructor y periodo cuando se carguen los datos
  useEffect(() => {
    if (pagos.length > 0 && instructores.length > 0 && periodos.length > 0) {
      const pagoActual = pagos.find((p) => p.id === pagoId)
      if (pagoActual) {
        setPago(pagoActual)
        setInstructor(instructores.find((i) => i.id === pagoActual.instructorId) || null)
        setPeriodo(periodos.find((p) => p.id === pagoActual.periodoId) || null)

        // Cargar clases del instructor en este periodo
        if (pagoActual.instructorId && pagoActual.periodoId) {
          fetchClases({
            instructorId: pagoActual.instructorId,
            periodoId: pagoActual.periodoId,
          })
        }
      } else {
        toast({
          title: "Error",
          description: "No se encontró el pago solicitado",
          variant: "destructive",
        })
        router.push("/pagos")
      }
    }
  }, [pagos, instructores, periodos, pagoId, router, fetchClases])

  // Actualizar clases del instructor cuando se carguen
  useEffect(() => {
    if (clases.length > 0 && pago) {
      setClasesInstructor(clases.filter((c) => c.instructorId === pago.instructorId && c.periodoId === pago.periodoId))
    }
  }, [clases, pago])

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
      case "PAGADO":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case "RECHAZADO":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  // Función para recalcular el pago
  const recalcularPago = async () => {
    if (!pago || !instructor || !periodo) {
      toast({
        title: "Error",
        description: "No se puede recalcular el pago sin la información completa",
        variant: "destructive",
      })
      return
    }

    setIsRecalculando(true)
    setShowConfirmDialog(false)

    try {
      // Verificar que tenemos las clases y disciplinas
      if (isLoadingClases || isLoadingDisciplinas) {
        throw new Error("Cargando datos necesarios para el cálculo")
      }

      if (clasesInstructor.length === 0) {
        throw new Error("El instructor no tiene clases en este periodo")
      }

      // Calcular el monto total
      let montoTotal = 0
      const detallesClases = []

      for (const clase of clasesInstructor) {
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
        montoTotal += montoCalculado

        // Agregar detalle de clase
        detallesClases.push({
          claseId: clase.id,
          montoCalculado,
          detalleCalculo,
        })
      }

      // Actualizar pago
      const pagoActualizado = {
        ...pago,
        monto: montoTotal,
        detalles: {
          ...pago.detalles,
          clases: detallesClases,
          resumen: {
            ...pago.detalles?.resumen,
            totalClases: clasesInstructor.length,
            totalMonto: montoTotal,
            comentarios: `Pago recalculado manualmente el ${new Date().toLocaleDateString()}`,
          },
        },
      }

      await actualizarPago(instructor.id,pagoActualizado)

      // Recargar pago
      await fetchPagos()
      const pagoActualizado2 = pagos.find((p) => p.id === pagoId)
      if (pagoActualizado2) {
        setPago(pagoActualizado2)
      }

      toast({
        title: "Recálculo completado",
        description: `El pago ha sido recalculado exitosamente. Nuevo monto: ${formatCurrency(montoTotal)}`,
      })
    } catch (error) {
      toast({
        title: "Error al recalcular pago",
        description: error instanceof Error ? error.message : "Error desconocido al recalcular pago",
        variant: "destructive",
      })
    } finally {
      setIsRecalculando(false)
    }
  }

  // Función para cambiar el estado del pago
  const cambiarEstadoPago = async () => {
    if (!pago || !nuevoEstado) {
      return
    }

    try {
      const pagoActualizado = {
        ...pago,
        estado: nuevoEstado,
        updatedAt: new Date().toISOString(),
      }

      await actualizarPago(instructor.id,pagoActualizado)

      // Recargar pago
      await fetchPagos()
      const pagoActualizado2 = pagos.find((p) => p.id === pagoId)
      if (pagoActualizado2) {
        setPago(pagoActualizado2)
      }

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
    } finally {
      setShowEstadoDialog(false)
      setNuevoEstado(null)
    }
  }

  // Si está cargando, mostrar skeleton
  if (isLoadingPagos || !pago || !instructor || !periodo) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/pagos")} className="h-10 w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Detalle de Pago</h1>
            <p className="text-muted-foreground">
              {instructor.nombre} - {periodo ? `Periodo ${periodo.numero} - ${periodo.año}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                Exportar a PDF
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="default" onClick={() => setShowConfirmDialog(true)} disabled={isRecalculando}>
            {isRecalculando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Recalcular Pago
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PagoDetalleStats pago={pago} instructor={instructor} periodo={periodo} clases={clasesInstructor} />
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="bg-muted/20 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl text-primary">Información del Pago</CardTitle>
            <CardDescription>Detalles y estado del pago para {instructor.nombre}</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getEstadoColor(pago.estado)}>
              {pago.estado}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setShowEstadoDialog(true)}>
              Cambiar Estado
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger
                value="detalles"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Detalles del Pago
              </TabsTrigger>
              <TabsTrigger
                value="clases"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Clases Incluidas
              </TabsTrigger>
              <TabsTrigger
                value="historial"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Historial de Cambios
              </TabsTrigger>
            </TabsList>

            <TabsContent value="detalles" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Información General</h3>
                    <Separator className="my-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-muted-foreground">ID del Pago:</div>
                    <div>{pago.id}</div>

                    <div className="text-muted-foreground">Instructor:</div>
                    <div>{instructor.nombre}</div>

                    <div className="text-muted-foreground">Periodo:</div>
                    <div>
                      Periodo {periodo.numero} - {periodo.año}
                    </div>

                    <div className="text-muted-foreground">Estado:</div>
                    <div>
                      <Badge variant="outline" className={getEstadoColor(pago.estado)}>
                        {pago.estado}
                      </Badge>
                    </div>

                    <div className="text-muted-foreground">Monto Total:</div>
                    <div className="font-bold">{formatCurrency(pago.monto)}</div>

                    <div className="text-muted-foreground">Fecha de Creación:</div>
                    <div>{new Date(pago.createdAt).toLocaleDateString()}</div>

                    <div className="text-muted-foreground">Última Actualización:</div>
                    <div>{pago.updatedAt ? new Date(pago.updatedAt).toLocaleDateString() : "-"}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Resumen del Cálculo</h3>
                    <Separator className="my-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-muted-foreground">Total de Clases:</div>
                    <div>{pago.detalles?.resumen?.totalClases || clasesInstructor.length}</div>

                    <div className="text-muted-foreground">Moneda:</div>
                    <div>{pago.detalles?.resumen?.moneda || "PEN"}</div>

                    <div className="text-muted-foreground">Comentarios:</div>
                    <div className="col-span-2 text-sm bg-muted/20 p-2 rounded-md">
                      {pago.detalles?.resumen?.comentarios || "Sin comentarios"}
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-lg font-medium">Acciones</h3>
                    <Separator className="my-2" />
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button variant="outline" size="sm">
                        <Calculator className="mr-2 h-4 w-4" />
                        Ver Calculadora
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileText className="mr-2 h-4 w-4" />
                        Generar Recibo
                      </Button>
                      <Button variant="outline" size="sm">
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                      </Button>
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
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="text-primary font-medium">Fecha</TableHead>
                        <TableHead className="text-primary font-medium">Disciplina</TableHead>
                        <TableHead className="text-primary font-medium">Estudio</TableHead>
                        <TableHead className="text-primary font-medium">Reservas</TableHead>
                        <TableHead className="text-primary font-medium">Monto</TableHead>
                        <TableHead className="text-primary font-medium">Detalles</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clasesInstructor.map((clase) => {
                        // Buscar el detalle de la clase en el pago
                        const detalleClase = pago.detalles?.clases?.find((d: any) => d.claseId === clase.id)

                        // Obtener la disciplina
                        const disciplina = disciplinas.find((d) => d.id === clase.disciplinaId)

                        return (
                          <TableRow key={clase.id} className="hover:bg-muted/20 transition-colors">
                            <TableCell>{new Date(clase.fecha).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {disciplina?.nombre || `Disciplina ${clase.disciplinaId}`}
                              </Badge>
                            </TableCell>
                            <TableCell>{clase.estudio}</TableCell>
                            <TableCell>
                              {clase.reservasTotales} / {clase.lugares}(
                              {Math.round((clase.reservasTotales / clase.lugares) * 100)}%)
                            </TableCell>
                            <TableCell>{detalleClase ? formatCurrency(detalleClase.montoCalculado) : "-"}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Info className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="historial" className="space-y-6">
              <div className="rounded-lg border shadow-sm p-6">
                <h3 className="text-lg font-medium mb-4">Historial de Cambios</h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 pb-4 border-b">
                    <div className="bg-primary/10 rounded-full p-2">
                      <RefreshCw className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-medium">Pago recalculado</h4>
                        <span className="text-sm text-muted-foreground">
                          {new Date(pago.updatedAt || pago.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        El pago fue recalculado con un total de {pago.detalles?.resumen?.totalClases || 0} clases. Monto
                        actualizado: {formatCurrency(pago.monto)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 rounded-full p-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-medium">Pago creado</h4>
                        <span className="text-sm text-muted-foreground">
                          {new Date(pago.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Se creó el pago para el instructor {instructor.nombre} en el periodo {periodo.numero} -{" "}
                        {periodo.año}. Estado inicial: {pago.estado}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar recálculo de pago</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción recalculará el pago para {instructor.nombre} en el periodo {periodo.numero} - {periodo.año}.
              El monto se actualizará basado en las clases impartidas y las fórmulas de cada disciplina. ¿Estás seguro
              de que deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={recalcularPago}>Recalcular Pago</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showEstadoDialog} onOpenChange={setShowEstadoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambiar estado del pago</AlertDialogTitle>
            <AlertDialogDescription>
              Selecciona el nuevo estado para el pago de {instructor.nombre}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select onValueChange={(value) => setNuevoEstado(value as EstadoPago)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar nuevo estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="PAGADO">Pagado</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={cambiarEstadoPago} disabled={!nuevoEstado}>
              Guardar Cambios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

