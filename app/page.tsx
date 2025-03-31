"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  DollarSign,
  Download,
  Loader2,
  Users,
  ChevronDown,
  Calculator,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PeriodSelector } from "@/components/period-selector"
import type { EstadoPago, Instructor, Disciplina, Periodo, Clase, PagoInstructor } from "@/types/schema"

// Importar stores
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { usePagosStore } from "@/store/usePagosStore"
import { useClasesStore } from "@/store/useClasesStore"

export default function DashboardPage() {
  // Estados para controlar la carga de datos
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("general")
  const [currentPage, setCurrentPage] = useState(1)
  const [instructorFilter, setInstructorFilter] = useState("ocupacion")
  const itemsPerPage = 15

  // Obtener datos de todos los stores
  const { instructores, fetchInstructores, isLoading: isLoadingInstructores } = useInstructoresStore()
  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()
  const {
    periodos,
    periodoActual,
    rangoSeleccionado,
    periodosSeleccionados,
    fetchPeriodos,
    isLoading: isLoadingPeriodos,
  } = usePeriodosStore()
  const { pagos, fetchPagos, isLoading: isLoadingPagos } = usePagosStore()
  const { clases, fetchClases, isLoading: isLoadingClases } = useClasesStore()

  // Cargar todos los datos al montar el componente
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true)

      try {
        // Cargar periodos primero para poder seleccionar el actual
        await fetchPeriodos()

        // Cargar el resto de datos en paralelo
        await Promise.all([fetchInstructores(), fetchDisciplinas(), fetchClases(), fetchPagos()])
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos iniciales",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadAllData()
  }, [fetchInstructores, fetchDisciplinas, fetchPeriodos, fetchClases, fetchPagos])

  // Cargar pagos y clases cuando cambia la selección de periodos
  useEffect(() => {
    if (periodosSeleccionados.length > 0) {
      const periodosIds = periodosSeleccionados.map(p => p.id)
      fetchPagos()
      fetchClases( })
    }
  }, [periodosSeleccionados, fetchPagos, fetchClases])

  // Calcular estadísticas de instructores
  const instructoresStats = {
    total: instructores.length,
    activos: instructores.filter((i) => i.extrainfo?.activo !== false).length,
    inactivos: instructores.filter((i) => i.extrainfo?.activo === false).length,
    conDisciplinas: instructores.filter((i) => i.disciplinas && i.disciplinas.length > 0).length,
    sinDisciplinas: instructores.filter((i) => !i.disciplinas || i.disciplinas.length === 0).length,
  }

  // Calcular estadísticas de disciplinas
  const disciplinasStats = {
    total: disciplinas.length,
    activas: disciplinas.filter((d) => d.activo !== false).length,
    inactivas: disciplinas.filter((d) => d.activo === false).length,
  }

  // Calcular estadísticas de clases para los periodos seleccionados
  const clasesStats = {
    total: clases.length,
    ocupacionPromedio:
      clases.length > 0
        ? Math.round(
            (clases.reduce((acc, clase) => acc + (clase.reservasTotales / (clase.lugares || 1)), 0) / clases.length) *
              100,
          )
        : 0,
    conListaEspera: clases.filter((c) => c.listasEspera > 0).length,
    porDisciplina: disciplinas
      .map((d) => ({
        disciplinaId: d.id,
        nombre: d.nombre,
        color: d.color,
        count: clases.filter((c) => c.disciplinaId === d.id).length,
      }))
      .sort((a, b) => b.count - a.count),
  }

  // Calcular estadísticas de pagos para los periodos seleccionados
  const pagosStats = {
    total: pagos.length,
    pendientes: pagos.filter((p) => p.estado === "PENDIENTE").length,
    pagados: pagos.filter((p) => p.estado === "APROBADO").length,
    montoTotal: pagos.reduce((acc, pago) => acc + pago.pagoFinal, 0),
    montoPagado: pagos.filter((p) => p.estado === "APROBADO").reduce((acc, pago) => acc + pago.pagoFinal, 0),
    montoPendiente: pagos.filter((p) => p.estado === "PENDIENTE").reduce((acc, pago) => acc + pago.pagoFinal, 0),
    ultimoPago:
      pagos.length > 0
        ? [...pagos]
            .filter((p) => p.estado === "APROBADO")
            .sort(
              (a, b) => new Date(b.updatedAt! || b.createdAt).getTime() - new Date(a.updatedAt! || a.createdAt).getTime(),
            )[0]
        : null,
    proximoPago: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  }

  // Calcular estadísticas de instructores por ocupación
  const instructoresPorOcupacion = instructores.map((instructor) => {
    const clasesInstructor = clases.filter((c) => c.instructorId === instructor.id)
    const ocupacionTotal = clasesInstructor.reduce((acc, clase) => {
      return acc + (clase.reservasTotales / (clase.lugares || 1))
    }, 0)
    const ocupacionPromedio = clasesInstructor.length > 0 ? (ocupacionTotal / clasesInstructor.length) * 100 : 0

    const pagosTotales = pagos
      .filter((p) => p.instructorId === instructor.id)
      .reduce((acc, pago) => acc + pago.pagoFinal, 0)

    return {
      ...instructor,
      clasesCount: clasesInstructor.length,
      ocupacionPromedio: Math.round(ocupacionPromedio),
      reservasTotal: clasesInstructor.reduce((acc, clase) => acc + clase.reservasTotales, 0),
      ingresoTotal: pagosTotales,
    }
  })

  // Función para filtrar instructores según el criterio seleccionado
  const getFilteredInstructors = () => {
    const sortedInstructors = [...instructoresPorOcupacion]

    switch (instructorFilter) {
      case "ocupacion":
        return sortedInstructors.sort((a, b) => b.ocupacionPromedio - a.ocupacionPromedio)
      case "ingresos":
        return sortedInstructors.sort((a, b) => b.ingresoTotal - a.ingresoTotal)
      case "reservas":
        return sortedInstructors.sort((a, b) => b.reservasTotal - a.reservasTotal)
      case "clases":
        return sortedInstructors.sort((a, b) => b.clasesCount - a.clasesCount)
      default:
        return sortedInstructors
    }
  }

  // Calcular pagos paginados
  const paginatedPagos = pagos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(pagos.length / itemsPerPage)

  // Formatear moneda
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Obtener el nombre del periodo/rango seleccionado
  const getPeriodoNombre = (): string => {
    if (periodosSeleccionados.length === 0) return "No seleccionado"
    
    if (periodosSeleccionados.length === 1) {
      const periodo = periodosSeleccionados[0]
      return `Periodo ${periodo.numero} - ${periodo.año}`
    } else {
      const first = periodosSeleccionados[0]
      const last = periodosSeleccionados[periodosSeleccionados.length - 1]
      return `${first.numero}/${first.año} - ${last.numero}/${last.año}`
    }
  }

  // Renderizar estado de carga
  if (isLoading || isLoadingInstructores || isLoadingDisciplinas || isLoadingPeriodos) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Skeleton para las pestañas */}
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-1 w-full">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
        </div>

        {/* Skeleton para las tarjetas de estadísticas */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-8 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton para la tabla principal */}
        <div className="border rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-9 w-40" />
            </div>

            <div className="space-y-3 pt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skeleton para la tabla secundaria */}
        <div className="border rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>

            <div className="space-y-2 pt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Administrativo</h1>
          <p className="text-muted-foreground mt-1">Resumen general del sistema y estadísticas clave</p>
        </div>
        <PeriodSelector />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full mb-4">
          <TabsTrigger
            value="general"
            className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
          >
            General
          </TabsTrigger>
          <TabsTrigger
            value="instructores"
            className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
          >
            Instructores
          </TabsTrigger>
          <TabsTrigger
            value="pagos"
            className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
          >
            Pagos
          </TabsTrigger>
        </TabsList>

        {/* Pestaña General */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Tarjeta de Instructores */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  Instructores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{instructoresStats.total}</div>
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <Badge variant="outline" className="bg-secondary/10 text-secondary-foreground border-secondary/20">
                    {instructoresStats.activos} activos
                  </Badge>
                  <Badge variant="outline" className="bg-muted text-muted-foreground border-muted/50">
                    {instructoresStats.inactivos} inactivos
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link
                  href="/instructores"
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center"
                >
                  Ver todos <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </CardFooter>
            </Card>

            {/* Tarjeta de Disciplinas */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  Disciplinas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{disciplinasStats.total}</div>
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <Badge variant="outline" className="bg-secondary/10 text-secondary-foreground border-secondary/20">
                    {disciplinasStats.activas} activas
                  </Badge>
                  <Badge variant="outline" className="bg-muted text-muted-foreground border-muted/50">
                    {disciplinasStats.inactivas} inactivas
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link
                  href="/disciplinas"
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center"
                >
                  Ver todas <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </CardFooter>
            </Card>

            {/* Tarjeta de Clases */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  Clases
                </CardTitle>
                <CardDescription className="text-xs">{getPeriodoNombre()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{clasesStats.total}</div>
                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ocupación promedio:</span>
                    <span className="font-medium">{clasesStats.ocupacionPromedio}%</span>
                  </div>
                  <Progress value={clasesStats.ocupacionPromedio} className="h-1.5" />
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href="/clases" className="text-sm text-muted-foreground hover:text-foreground flex items-center">
                  Ver todas <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </CardFooter>
            </Card>

            {/* Tarjeta de Pagos */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  Pagos
                </CardTitle>
                <CardDescription className="text-xs">{getPeriodoNombre()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(pagosStats.montoTotal)}</div>
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-muted/50">
                    {pagosStats.pendientes} pendientes
                  </Badge>
                  <Badge variant="outline" className="bg-secondary/10 text-secondary-foreground border-secondary/20">
                    {pagosStats.pagados} aprobados
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href="/pagos" className="text-sm text-muted-foreground hover:text-foreground flex items-center">
                  Ver todos <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </CardFooter>
            </Card>
          </div>

          {/* Tarjeta de Disciplinas Populares */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Disciplinas Más Impartidas</CardTitle>
              <CardDescription>{getPeriodoNombre()}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingClases ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : clasesStats.porDisciplina.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hay clases registradas en este periodo</div>
              ) : (
                <div className="space-y-4">
                  {clasesStats.porDisciplina.slice(0, 5).map((disciplina) => (
                    <div key={disciplina.disciplinaId} className="flex items-center gap-4">
                      <div
                        className="w-3 h-3 rounded-full opacity-60"
                        style={{ backgroundColor: disciplina.color || "#888" }}
                      />
                      <div className="flex-1 flex items-center justify-between">
                        <span className="font-medium">{disciplina.nombre}</span>
                        <span className="text-muted-foreground">{disciplina.count} clases</span>
                      </div>
                      <div className="w-1/3">
                        <Progress
                          value={(disciplina.count / clasesStats.total) * 100}
                          className="h-2"
                          style={
                            {
                              backgroundColor: "hsl(var(--muted))",
                              "--tw-progress-fill": disciplina.color
                                ? `${disciplina.color}60`
                                : "hsl(var(--secondary))",
                            } as React.CSSProperties
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ocupación por Disciplina */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Ocupación por Disciplina</CardTitle>
              <CardDescription>{getPeriodoNombre()}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingClases ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : clasesStats.porDisciplina.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay disciplinas con clases en este periodo
                </div>
              ) : (
                <div className="space-y-3">
                  {clasesStats.porDisciplina.slice(0, 5).map((disciplina) => {
                    const disciplinaClases = clases.filter((c) => c.disciplinaId === disciplina.disciplinaId)
                    const ocupacionPromedio =
                      disciplinaClases.length > 0
                        ? Math.round(
                            (disciplinaClases.reduce((acc, clase) => acc + (clase.reservasTotales / (clase.lugares || 1)), 0) /
                              disciplinaClases.length) *
                              100,
                          )
                        : 0

                    return (
                      <div key={disciplina.disciplinaId} className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full opacity-60"
                          style={{ backgroundColor: disciplina.color || "#888" }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{disciplina.nombre}</span>
                            <span className="text-muted-foreground">{ocupacionPromedio}% ocupación</span>
                          </div>
                          <Progress
                            value={ocupacionPromedio}
                            className="h-2 mt-1"
                            style={
                              {
                                backgroundColor: "hsl(var(--muted))",
                                "--tw-progress-fill": disciplina.color
                                  ? `${disciplina.color}60`
                                  : "hsl(var(--secondary))",
                              } as React.CSSProperties
                            }
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña Instructores */}
        <TabsContent value="instructores" className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Rendimiento de Instructores</CardTitle>
                <CardDescription>Análisis comparativo de los instructores según diferentes métricas</CardDescription>
              </div>
              <Select value={instructorFilter} onValueChange={setInstructorFilter}>
                <SelectTrigger className="w-[200px] bg-background border-muted">
                  <SelectValue placeholder="Filtrar por métrica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ocupacion">Mayor ocupación</SelectItem>
                  <SelectItem value="ingresos">Mayor ingreso</SelectItem>
                  <SelectItem value="reservas">Mayor cantidad de reservas</SelectItem>
                  <SelectItem value="clases">Mayor cantidad de clases</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Clases</TableHead>
                      <TableHead>Ocupación</TableHead>
                      <TableHead>Reservas</TableHead>
                      <TableHead>Ingresos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instructoresPorOcupacion.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No hay datos de instructores disponibles
                        </TableCell>
                      </TableRow>
                    ) : (
                      getFilteredInstructors()
                        .slice(0, 10)
                        .map((instructor) => (
                          <TableRow key={instructor.id}>
                            <TableCell className="font-medium">
                              <Link href={`/instructores/${instructor.id}`} className="hover:underline text-foreground">
                                {instructor.nombre}
                              </Link>
                            </TableCell>
                            <TableCell>{instructor.clasesCount}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{instructor.ocupacionPromedio}%</span>
                                <Progress
                                  value={instructor.ocupacionPromedio}
                                  className="h-2 w-16"
                                  style={{
                                    backgroundColor: "hsl(var(--muted))",
                                  }}
                                />
                              </div>
                            </TableCell>
                            <TableCell>{instructor.reservasTotal}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(instructor.ingresoTotal)}</TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña Pagos */}
        <TabsContent value="pagos" className="space-y-6">
          <div className="grid gap-6 grid-cols-1">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Resumen de Pagos</CardTitle>
                <CardDescription>{getPeriodoNombre()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingPagos ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="bg-card p-4 rounded-lg border">
                      <div className="text-sm text-muted-foreground mb-1">Total de pagos</div>
                      <div className="text-2xl font-bold">{pagosStats.total}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {pagosStats.pagados} aprobados, {pagosStats.pendientes} pendientes
                      </div>
                    </div>
                    <div className="bg-card p-4 rounded-lg border">
                      <div className="text-sm text-muted-foreground mb-1">Monto total</div>
                      <div className="text-2xl font-bold">{formatCurrency(pagosStats.montoTotal)}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {pagosStats.ultimoPago
                          ? `Último pago: ${new Date(pagosStats.ultimoPago.updatedAt! || pagosStats.ultimoPago.createdAt).toLocaleDateString()}`
                          : "Sin pagos realizados"}
                      </div>
                    </div>
                    <div className="bg-card p-4 rounded-lg border">
                      <div className="text-sm text-muted-foreground mb-1">Próximo pago</div>
                      <div className="text-2xl font-bold text-yellow-600">
                        {formatCurrency(pagosStats.montoPendiente)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Fecha estimada: {pagosStats.proximoPago}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Todos los Pagos</CardTitle>
                  <CardDescription>{getPeriodoNombre()}</CardDescription>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    toast({
                      title: "Actualizando pagos",
                      description: "Calculando pagos para todos los instructores...",
                    })
                  }}
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Actualizar Pagos
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingPagos ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : pagos.length === 0 ? (
                  <Alert className="bg-muted/20 border-muted">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <AlertTitle className="text-foreground">No hay pagos registrados</AlertTitle>
                    <AlertDescription className="text-muted-foreground">
                      No se encontraron pagos para el periodo seleccionado.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                      <div className="flex-1">
                        <Select defaultValue="todos">
                          <SelectTrigger className="w-full bg-background border-muted">
                            <SelectValue placeholder="Filtrar por estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos los estados</SelectItem>
                            <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                            <SelectItem value="APROBADO">Aprobados</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Select defaultValue="todos">
                          <SelectTrigger className="w-full bg-background border-muted">
                            <SelectValue placeholder="Filtrar por instructor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos los instructores</SelectItem>
                            {instructores.slice(0, 10).map((instructor) => (
                              <SelectItem key={instructor.id} value={instructor.id.toString()}>
                                {instructor.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Select defaultValue="recientes">
                          <SelectTrigger className="w-full bg-background border-muted">
                            <SelectValue placeholder="Ordenar por" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="recientes">Más recientes</SelectItem>
                            <SelectItem value="antiguos">Más antiguos</SelectItem>
                            <SelectItem value="monto-mayor">Mayor monto</SelectItem>
                            <SelectItem value="monto-menor">Menor monto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Instructor</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Clases</TableHead>
                            <TableHead>Última Actualización</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedPagos.map((pago) => {
                            const instructor = instructores.find((i) => i.id === pago.instructorId)
                            const estadoColor =
                              pago.estado === "APROBADO"
                                ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
                                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200"

                            // Obtener el número de clases del instructor en este periodo
                            const clasesInstructor = clases.filter((c) => c.instructorId === pago.instructorId).length

                            return (
                              <TableRow key={pago.id}>
                                <TableCell className="font-medium">
                                  <Link
                                    href={`/instructores/${pago.instructorId}`}
                                    className="hover:underline text-foreground"
                                  >
                                    {instructor?.nombre || `Instructor ${pago.instructorId}`}
                                  </Link>
                                </TableCell>
                                <TableCell className="font-medium">{formatCurrency(pago.pagoFinal)}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={estadoColor}>
                                    {pago.estado}
                                  </Badge>
                                </TableCell>
                                <TableCell>{clasesInstructor} clases</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {pago.updatedAt
                                    ? new Date(pago.updatedAt).toLocaleDateString()
                                    : new Date(pago.createdAt!).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted transition-colors">
                                        <span className="sr-only">Abrir menú</span>
                                        <ChevronDown className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40 rounded-lg">
                                      <DropdownMenuItem asChild className="cursor-pointer">
                                        <Link href={`/pagos/${pago.id}`}>Ver detalles</Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="cursor-pointer">Descargar recibo</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {Math.min(pagos.length, currentPage * itemsPerPage)} de {pagos.length} pagos
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="border-muted"
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="border-muted"
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" className="border-muted" asChild>
                  <Link href="/pagos">Ver todos</Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/pagos/exportar">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar reporte
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}