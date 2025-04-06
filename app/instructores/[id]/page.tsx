"use client"

import { useEffect, useState, useMemo, useCallback, useRef, use } from "react"
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
  Phone,
  BookOpen,
  Star,
  Percent,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { evaluarFormula } from "@/lib/formula-evaluator"
import type { Instructor, PagoInstructor, EstadoPago, TipoReajuste, Clase } from "@/types/schema"
import { toast } from "@/components/ui/use-toast"
import { useFormulasStore } from "@/store/useFormulaStore"
import { Progress } from "@/components/ui/progress"
import { PeriodSelector } from "@/components/period-selector"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DashboardShell } from "@/components/dashboard/shell"
import { IconLeft, IconRight } from "react-day-picker"

export default function InstructorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const instructorId = Number.parseInt(resolvedParams.id)
  const { fetchInstructor, instructorSeleccionado, isLoading, error } = useInstructoresStore()
  const { fetchClases, clases, isLoading: isLoadingClases } = useClasesStore()
  const { periodos, periodosSeleccionados, fetchPeriodos } = usePeriodosStore()
  const { pagos, fetchPagos, isLoading: isLoadingPagos, actualizarPago } = usePagosStore()
  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()
  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [activeTab, setActiveTab] = useState("clases-pagos")
  const { formulas, fetchFormulas } = useFormulasStore()
  const [paymentDetails, setPaymentDetails] = useState<any[]>([])
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null)
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false)
  const [clasesPeriodo, setClasesPeriodo] = useState<Clase[]>([])
  const [pagosPeriodo, setPagosPeriodo] = useState<PagoInstructor[]>([])
  const dataLoaded = useRef(false)
  

  // Load initial data
  useEffect(() => {
    if (isNaN(instructorId)) notFound()
    if (dataLoaded.current) return
    dataLoaded.current = true
    
    const loadData = async () => {
      try {
        await Promise.all([
          fetchInstructor(instructorId),
          fetchDisciplinas(),
          fetchFormulas(),
          fetchClases(),
          fetchPagos()
        ])
      } catch (error) {
        console.error("Error al cargar datos:", error)
      }
    }

    loadData()
  }, [instructorId, fetchInstructor, fetchDisciplinas, fetchFormulas, fetchClases, fetchPagos])

  // Update instructor state when instructorSeleccionado changes
  useEffect(() => {
    if (instructorSeleccionado) {
      setInstructor(instructorSeleccionado)
    }
  }, [instructorSeleccionado])

  // Filter classes and payments when periods change
  useEffect(() => {
    // Solo actualizar si tenemos datos válidos
    if (clases.length > 0 && periodosSeleccionados.length > 0) {
      const filteredClases = clases.filter(clase =>
        clase.instructorId === instructorId && 
        periodosSeleccionados.some(p => p.id === clase.periodoId)
      )
      
      const filteredPagos = pagos.filter(pago =>
        pago.instructorId === instructorId && 
        periodosSeleccionados.some(p => p.id === pago.periodoId)
      )
      
      setClasesPeriodo(filteredClases)
      setPagosPeriodo(filteredPagos)
    } else {
      // Reiniciar a arreglos vacíos si no hay datos o periodos seleccionados
      setClasesPeriodo([])
      setPagosPeriodo([])
    }
  }, [clases, pagos, periodosSeleccionados, instructorId])

  // Calculate payments when relevant data changes
  const calculatePayments = useCallback(() => {
    if (!clasesPeriodo || clasesPeriodo.length === 0 || isLoadingDisciplinas || !disciplinas.length) {
      setPaymentDetails([])
      return
    }

    const details: any[] = []
    setUltimaActualizacion(new Date())

    clasesPeriodo.forEach((clase) => {
      const disciplina = disciplinas.find((d) => d.id === clase.disciplinaId)
      const formula = formulas.find(f => 
        f.disciplinaId === disciplina?.id && 
        f.periodoId === clase.periodoId
      )
      
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

      if (formula) {
        try {
          const resultado = evaluarFormula(formula.parametros.formula, datosEvaluacion)
          montoCalculado = resultado.valor
          detalleCalculo = resultado
        } catch (error) {
          console.error(`Error al evaluar fórmula para clase ${clase.id}:`, error)
          montoCalculado = 0
          detalleCalculo = { error: error instanceof Error ? error.message : "Error desconocido" }
        }
      } else {
        montoCalculado = 0
        detalleCalculo = { error: "No hay fórmula definida para esta disciplina" }
      }

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

    details.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    setPaymentDetails(details)
  }, [clasesPeriodo, disciplinas, formulas, isLoadingDisciplinas])

  // Execute calculatePayments when filtered data changes
  useEffect(() => {
    calculatePayments()
  }, [calculatePayments])

 

  const formatDate = (date: Date | undefined) => {
    if (!date) return "N/A"
    return format(new Date(date), "dd MMMM, yyyy", { locale: es })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount)
  }
  
  // Derived calculations
  const totalClases = clasesPeriodo.length
  const clasesCompletadas = clasesPeriodo.filter((c) => new Date(c.fecha) < new Date()).length
  
  const ocupacionPromedio = clasesPeriodo.length > 0
    ? Math.round(clasesPeriodo.reduce((sum, c) => sum + (c.reservasTotales / c.lugares) * 100, 0) / clasesPeriodo.length)
    : 0

  const montoPendiente = pagosPeriodo.find((p) => p.estado === "PENDIENTE")?.monto || 0
  const montoAprobado = pagosPeriodo.find((p) => p.estado === "APROBADO")?.monto || 0
  const totalMonto = paymentDetails.reduce((sum, detail) => sum + detail.montoCalculado, 0)

  const telefono = instructor?.extrainfo?.telefono || "No disponible"
  const especialidad = instructor?.extrainfo?.especialidad || "No especificada"
  const estado = instructor?.extrainfo?.activo ? "activo" : "inactivo"
  const foto = instructor?.extrainfo?.foto
  const biografia = instructor?.extrainfo?.biografia || "Sin biografia"
  const experiencia = instructor?.extrainfo?.experiencia || 0
  const disciplinasInstructor = instructor?.disciplinas?.map((d) => d.nombre || `Disciplina ${d.id}`) || []
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(paymentDetails.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = paymentDetails.slice(startIndex, endIndex);
  return (
    <DashboardShell>
      {/* Header Section */}
      <div className="bg-card rounded-xl p-6 border ">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-accent">
              <AvatarImage src={foto} alt={instructor?.nombre} />
              <AvatarFallback className="text-xl font-bold bg-primary/10">
                {instructor?.nombre?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{instructor?.nombre}</h1>
              </div>
     
              <div className="flex flex-wrap gap-2 mt-2">
                {disciplinasInstructor.map((disciplina, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {disciplina}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <PeriodSelector />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <StatCard 
            icon={<Calendar className="h-5 w-5" />} 
            title="Clases" 
            value={totalClases} 
            description={`${clasesCompletadas} completadas`}
            color="text-blue-500"
          />
          
          <StatCard 
            icon={<Users className="h-5 w-5" />} 
            title="Ocupación" 
            value={`${ocupacionPromedio}%`} 
            description="Promedio"
            color="text-green-500"
          />
          
          <StatCard 
            icon={<DollarSign className="h-5 w-5" />} 
            title="Pendiente" 
            value={formatAmount(montoPendiente)} 
            description="Por pagar"
            color="text-amber-500"
          />
          
          <StatCard 
            icon={<Calculator className="h-5 w-5" />} 
            title="Total calculado" 
            value={formatAmount(totalMonto)} 
            description="Este periodo"
            color="text-purple-500"
          />
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="  bg-transparent ">
          <TabsTrigger value="clases-pagos" className="px-10 py-3 rounded-none data-[state=active]:border-b-[3px] data-[state=active]:border-accent ">
            <Calendar className="h-4 w-4 mr-2" />
            Clases y Pagos
          </TabsTrigger>
          <TabsTrigger value="rendimiento" className="px-10 py-3 rounded-none data-[state=active]:border-b-[3px] data-[state=active]:border-accent ">
            <BarChart3 className="h-4 w-4 mr-2" />
            Rendimiento
          </TabsTrigger>
        </TabsList>

        {/* Clases y Pagos Tab */}
        <TabsContent value="clases-pagos" className="space-y-6">
          <Card className="border-none shadow-sm ">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Clases y cálculo de pagos
                </CardTitle>
                <CardDescription className=" mt-2 mb-3">Listado de clases y cálculo de pagos para el instructor</CardDescription>
              </div>
              
              {/* <div className="flex items-center gap-2">
                {ultimaActualizacion && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Actualizado: {format(ultimaActualizacion, "dd/MM/yyyy HH:mm", { locale: es })}</span>
                  </div>
                )}
              </div> */}
            </CardHeader>
            
            <CardContent>
              {isLoadingClases || isLoadingDisciplinas ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : clasesPeriodo.length === 0 ? (
                <EmptyState 
                  icon={<Calendar className="h-12 w-12" />}
                  title="No hay clases"
                  description="No hay clases asignadas en el periodo seleccionado."
                />
              ) : (
                <>
                  {/* <div className="flex justify-between items-center mb-4 bg-gradient-to-r from-primary/5 to-background p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total calculado para este periodo</p>
                        <p className="text-2xl font-bold">{formatAmount(totalMonto)}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Total de clases: <span className="font-medium">{totalClases}</span>
                      </p>
                    </div>
                  </div> */}
                  
                  <div className="rounded-lg border overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Disciplina</TableHead>
                            <TableHead>Estudio</TableHead>
                            <TableHead>Ocupación</TableHead>
                            <TableHead className="">Monto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentPayments.map((detail) => (
                            <TableRow key={detail.claseId}>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex items-center">
                                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                  {formatDate(detail.fecha)}
                                </div>
                              </TableCell>
                              <TableCell>
 
                                  {detail.disciplina}
                         
                              </TableCell>
                              <TableCell>{detail.estudio}</TableCell>
                              <TableCell>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="flex items-center">
                                      <div className="flex items-center w-full max-w-[160px]">
                                        <Progress 
                                          value={(detail.reservas / detail.capacidad) * 100} 
                                          className="h-2 mr-2" 
                                        />
                                        <span className="text-sm">
                                          {Math.round((detail.reservas / detail.capacidad) * 100)}%
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{detail.reservas} reservas de {detail.capacidad} lugares</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell className="text-rght font-medium whitespace-nowrap">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="flex items-center justify-end gap-1">
                                      {formatAmount(detail.montoCalculado)}
                                      <Info className="h-3 w-3 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent className="w-64 max-w-sm">
                                      {detail.detalleCalculo?.error ? (
                                        <p className="text-red-500">Error: {detail.detalleCalculo.error}</p>
                                      ) : detail.detalleCalculo?.mensaje ? (
                                        <p>{detail.detalleCalculo.mensaje}</p>
                                      ) : detail.detalleCalculo?.pasos ? (
                                        <div className="space-y-1">
                                          <p className="font-semibold">Detalle de cálculo:</p>
                                          <ul className="text-xs space-y-1">
                                            {detail.detalleCalculo.pasos.map((paso: any, idx: number) => (
                                              <li key={idx} className="flex items-start gap-1">
                                                <span className="text-primary">•</span>
                                                <span>{paso.descripcion}</span>
                                              </li>
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
                    
                  </div>
                  <div className="flex items-center justify-end space-x-2 py-4">
                  <div className="flex items-center justify-end gap-4 py-4">
    <div className="flex items-center gap-2">
      <button
        className="p-2 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed hover:text-white"
        onClick={() => setCurrentPage(old => Math.max(old - 1, 0))}
        disabled={currentPage === 0}
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      
      <span className="text-sm text-muted-foreground">
        {currentPage + 1} / {totalPages}
      </span>

      <button
        className="p-2 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed hover:text-white"
        onClick={() => setCurrentPage(old => old + 1)}
        disabled={currentPage >= totalPages - 1}
        aria-label="Siguiente página"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  </div>
 
  </div>
                </>
              )}
            </CardContent>
            
              
          </Card>

          {/* Payment Status Card */}
          {/* <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Estado del pago actual
              </CardTitle>
              <CardDescription>Información del pago para el periodo actual</CardDescription>
            </CardHeader>
            
            <CardContent>
              {isLoadingPagos ? (
                <div className="space-y-2">
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              ) : pagosPeriodo.length === 0 ? (
                <EmptyState 
                  icon={<AlertCircle className="h-12 w-12" />}
                  title="No hay pagos registrados"
                  description="Utilice el botón 'Actualizar pago' para crear un nuevo pago para este periodo."
                />
              ) : (
                <div className="space-y-4">
                  {pagosPeriodo.map((pago) => (
                    <div key={pago.id} className="bg-gradient-to-r from-secondary/5 to-secondary/5 p-4 rounded-lg border">
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
          </Card> */}

          {/* Payment History Card */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Historial de pagos
              </CardTitle>
              <CardDescription>Registro de todos los pagos realizados</CardDescription>
            </CardHeader>
            
            <CardContent>
              <InstructorPaymentHistory pagos={pagosPeriodo} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rendimiento Tab */}
        <TabsContent value="rendimiento" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <PerformanceCard 
              icon={<Percent className="h-5 w-5 text-primary" />}
              title="Ocupación por clase"
              description="Porcentaje de ocupación de tus clases"
              value={`${ocupacionPromedio}%`}
              progressValue={ocupacionPromedio}
            />
            
            <PerformanceCard 
              icon={<Briefcase className="h-5 w-5 text-primary" />}
              title="Clases por disciplina"
              description="Distribución de clases por disciplina"
              value={totalClases?.toString() || "0"}
              secondaryValue={`${clasesCompletadas} completadas`}
            />
            
            <PerformanceCard 
              icon={<DollarSign className="h-5 w-5 text-primary" />}
              title="Ingresos mensuales"
              description="Evolución de tus ingresos por mes"
              value={formatAmount(montoPendiente + montoAprobado)}
            />
            
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Rendimiento general
                </CardTitle>
                <CardDescription>Métricas clave de tu desempeño</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Ocupación promedio</span>
                    <span className="text-sm font-medium">{ocupacionPromedio}%</span>
                  </div>
                  <Progress value={ocupacionPromedio} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Clases completadas</span>
                    <span className="text-sm font-medium">
                      {clasesCompletadas} / {totalClases}
                    </span>
                  </div>
                  {totalClases && clasesCompletadas &&
                  <Progress 
                    value={totalClases > 0 ? (clasesCompletadas / totalClases) * 100 : 0} 
                    className="h-2" 
                  />}
                </div>

                <div className="pt-4">
                  <h4 className="text-sm font-medium mb-3">Logros</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AchievementCard 
                      icon={<Award className="h-5 w-5 text-yellow-500" />}
                      title="Instructor destacado"
                      description="Ocupación superior al 80%"
                      achieved={ocupacionPromedio >= 80}
                    />
                    
                    <AchievementCard 
                      icon={<Users className="h-5 w-5 text-blue-500" />}
                      title="Clases llenas"
                      description="5 clases con 100% de ocupación"
                      achieved={clases.filter(c => (c.reservasTotales / c.lugares) >= 1).length >= 5}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </DashboardShell>
  )
}

// Componentes auxiliares para mejorar la legibilidad

function StatCard({ icon, title, value, description, color }: { 
  icon: React.ReactNode, 
  title: string, 
  value: string | number, 
  description: string,
  color?: string 
}) {
  return (
    <div className="bg-background/20 rounded-lg p-4 border flex items-center gap-3 hover:shadow-sm transition-shadow">
      <div className={`h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function EmptyState({ icon, title, description }: { 
  icon: React.ReactNode, 
  title: string, 
  description: string 
}) {
  return (
    <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
      <div className="mx-auto h-12 w-12 text-muted-foreground opacity-50">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function PerformanceCard({ 
  icon, 
  title, 
  description, 
  value, 
  secondaryValue,
  progressValue 
}: { 
  icon: React.ReactNode, 
  title: string, 
  description: string, 
  value: string,
  secondaryValue?: string,
  progressValue?: number
}) {
  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="text-center py-6">
          <p className="text-3xl font-bold">{value}</p>
          {secondaryValue && <p className="text-sm text-muted-foreground mt-1">{secondaryValue}</p>}
          
          {progressValue !== undefined && (
            <div className="mt-4">
              <Progress value={progressValue} className="h-2" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function AchievementCard({ 
  icon, 
  title, 
  description, 
  achieved 
}: { 
  icon: React.ReactNode, 
  title: string, 
  description: string, 
  achieved: boolean 
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${achieved ? ' ' : 'bg-muted/20'}`}>
      <div className={`h-10 w-10 rounded-full ${achieved ? ' bg-muted/20' : 'bg-muted'} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
        {achieved && (
          <Badge variant="outline" className="mt-1 text-green-600 border-green-300">
            Completado
          </Badge>
        )}
      </div>
    </div>
  )
}

function InstructorDetailSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
        
        <div className="md:w-2/3 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}