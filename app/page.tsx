"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  ArrowUpRight,
  ArrowDownRight,
  Award,
  BarChart3,
  BookOpen,
  Building,
  Calendar,
  CalendarRange,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Loader2,
  MapPin,
  Percent,
  PieChart,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

// Recharts components
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
} from "recharts"

// Importar todos los stores
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { usePagosStore } from "@/store/usePagosStore"
import { useClasesStore } from "@/store/useClasesStore"

export default function DashboardPage() {
  // Estados para controlar la carga de datos
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("general")
  const [timeRange, setTimeRange] = useState("30d")
  const isMobile = useIsMobile()

  // Estados para el selector de periodos
  const [isPeriodsOpen, setIsPeriodsOpen] = useState(false)
  const [activePeriodsTab, setActivePeriodsTab] = useState<"individual" | "rango">("individual")
  const [tempStartPeriod, setTempStartPeriod] = useState<number | null>(null)
  const [tempEndPeriod, setTempEndPeriod] = useState<number | null>(null)
  const [selectedPeriods, setSelectedPeriods] = useState<[number, number] | null>(null)

  // Obtener datos de todos los stores
  const { instructores, fetchInstructores, isLoading: isLoadingInstructores } = useInstructoresStore()
  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()
  const { periodos, periodoActual } = usePeriodosStore()
  const { pagos, fetchPagos, isLoading: isLoadingPagos } = usePagosStore()
  const { clases, fetchClases, isLoading: isLoadingClases } = useClasesStore()

  // Ajustar el timeRange según el dispositivo
  useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  // Cargar todos los datos al montar el componente
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true)

      try {
        // Cargar el resto de datos en paralelo
        await Promise.all([fetchInstructores(), fetchDisciplinas(), fetchClases(), fetchPagos()])

        // Establecer el periodo actual como seleccionado por defecto
        if (periodoActual) {
          setSelectedPeriods([periodoActual.id, periodoActual.id])
        }
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAllData()
  }, [fetchInstructores, fetchDisciplinas, fetchClases, fetchPagos, periodoActual])

  // Funciones para el selector de periodos
  const handlePeriodSelection = (periodoId: number) => {
    setSelectedPeriods([periodoId, periodoId])
    setIsPeriodsOpen(false)
  }

  const handleRangeStartSelect = (periodoId: number) => {
    setTempStartPeriod(periodoId)
    if (tempEndPeriod !== null && periodoId > tempEndPeriod) {
      setTempEndPeriod(null)
    }
  }

  const handleRangeEndSelect = (periodoId: number) => {
    if (tempStartPeriod === null) return
    if (periodoId < tempStartPeriod) {
      // Swap to make it a valid range
      setTempEndPeriod(tempStartPeriod)
      setTempStartPeriod(periodoId)
    } else {
      setTempEndPeriod(periodoId)
    }
  }

  const applyRangeSelection = () => {
    if (tempStartPeriod && tempEndPeriod) {
      setSelectedPeriods([tempStartPeriod, tempEndPeriod])
    } else if (tempStartPeriod) {
      setSelectedPeriods([tempStartPeriod, tempStartPeriod])
    }
    setIsPeriodsOpen(false)
    setTempStartPeriod(null)
    setTempEndPeriod(null)
  }

  const resetPeriodSelection = () => {
    setSelectedPeriods(null)
    setIsPeriodsOpen(false)
  }

  // Función para obtener el texto a mostrar en el selector de periodos
  const getPeriodsDisplayText = () => {
    if (!selectedPeriods) return "Seleccionar período"

    const [start, end] = selectedPeriods
    const startPeriod = periodos.find((p) => p.id === start)
    const endPeriod = periodos.find((p) => p.id === end)

    if (start === end) {
      return startPeriod ? `Periodo ${startPeriod.numero}/${startPeriod.año}` : "Período seleccionado"
    }

    return startPeriod && endPeriod
      ? `Periodo ${startPeriod.numero}/${startPeriod.año} → ${endPeriod.numero}/${endPeriod.año}`
      : "Rango inválido"
  }

  // Función para formatear fecha
  const formatFecha = (fecha: Date | string) => {
    const fechaObj = new Date(fecha)
    return isNaN(fechaObj.getTime()) ? "" : format(fechaObj, "dd MMM yyyy", { locale: es })
  }

  // Filtrar clases por periodos seleccionados
  const getFilteredClases = () => {
    if (!selectedPeriods) return clases

    const [startPeriodId, endPeriodId] = selectedPeriods

    // Si es un solo periodo
    if (startPeriodId === endPeriodId) {
      return clases.filter((c) => c.periodoId === startPeriodId)
    }

    // Si es un rango de periodos
    const periodosEnRango = periodos
      .filter((p) => p.id >= Math.min(startPeriodId, endPeriodId) && p.id <= Math.max(startPeriodId, endPeriodId))
      .map((p) => p.id)

    return clases.filter((c) => periodosEnRango.includes(c.periodoId))
  }

  // Filtrar pagos por periodos seleccionados
  const getFilteredPagos = () => {
    if (!selectedPeriods) return pagos

    const [startPeriodId, endPeriodId] = selectedPeriods

    // Si es un solo periodo
    if (startPeriodId === endPeriodId) {
      return pagos.filter((p) => p.periodoId === startPeriodId)
    }

    // Si es un rango de periodos
    const periodosEnRango = periodos
      .filter((p) => p.id >= Math.min(startPeriodId, endPeriodId) && p.id <= Math.max(startPeriodId, endPeriodId))
      .map((p) => p.id)

    return pagos.filter((p) => periodosEnRango.includes(p.periodoId))
  }

  // Aplicar filtro de tiempo a las clases
  const filteredClases = getFilteredClases()
  const filteredPagos = getFilteredPagos()

  // Calcular estadísticas de instructores
  const instructoresStats = {
    total: instructores.length,
    activos: instructores.filter((i) => i.extrainfo?.activo !== false).length,
    inactivos: instructores.filter((i) => i.extrainfo?.activo === false).length,
    conDisciplinas: instructores.filter((i) => i.disciplinas && i.disciplinas.length > 0).length,
    sinDisciplinas: instructores.filter((i) => !i.disciplinas || i.disciplinas.length === 0).length,
    nuevos: instructores.filter((i) => new Date(i.createdAt!).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000).length,
    porCategoria: {
      senior: instructores.filter((i) => i.categorias?.some((c) => c.categoria === "EMBAJADOR_SENIOR")).length,
      embajador: instructores.filter((i) => i.categorias?.some((c) => c.categoria === "EMBAJADOR")).length,
      junior: instructores.filter((i) => i.categorias?.some((c) => c.categoria === "EMBAJADOR_JUNIOR")).length,
      instructor: instructores.filter((i) => !i.categorias || i.categorias.every((c) => c.categoria === "INSTRUCTOR"))
        .length,
    },
  }

  // Datos para el gráfico de categorías de instructores
  const instructoresCategoriaData = [
    { name: "Senior", value: instructoresStats.porCategoria.senior, color: "#9e77ed" },
    { name: "Embajador", value: instructoresStats.porCategoria.embajador, color: "#7b8af9" },
    { name: "Junior", value: instructoresStats.porCategoria.junior, color: "#34d399" },
    { name: "Instructor", value: instructoresStats.porCategoria.instructor, color: "#94a3b8" },
  ]

  // Calcular estadísticas de disciplinas
  const disciplinasStats = {
    total: disciplinas.length,
    activas: disciplinas.filter((d) => d.activo !== false).length,
    inactivos: disciplinas.filter((d) => d.activo === false).length,
  }

  // Calcular estadísticas de clases para el periodo seleccionado
  const clasesStats = {
    total: filteredClases.length,
    ocupacionPromedio:
      filteredClases.length > 0
        ? Math.round(
            (filteredClases.reduce((acc, clase) => acc + clase.reservasTotales / (clase.lugares || 1), 0) /
              filteredClases.length) *
              100,
          )
        : 0,
    clasesLlenas: filteredClases.filter((c) => c.reservasTotales >= c.lugares).length,
    porcentajeClasesLlenas:
      filteredClases.length > 0
        ? Math.round(
            (filteredClases.filter((c) => c.reservasTotales >= c.lugares).length / filteredClases.length) * 100,
          )
        : 0,
    reservasTotales: filteredClases.reduce((acc, clase) => acc + clase.reservasTotales, 0),
    porDisciplina: disciplinas
      .map((d) => ({
        disciplinaId: d.id,
        nombre: d.nombre,
        color: d.color || "#7b8af9",
        count: filteredClases.filter((c) => c.disciplinaId === d.id).length,
      }))
      .sort((a, b) => b.count - a.count),
    porDia: Array.from({ length: 7 })
      .map((_, i) => ({
        dia: i,
        nombre: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][i],
        count: filteredClases.filter((c) => new Date(c.fecha).getDay() === i).length,
      }))
      .sort((a, b) => b.count - a.count),
  }

  // Datos para el gráfico de clases por día
  const clasesPorDiaData = Array.from({ length: 7 })
    .map((_, i) => ({
      name: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][i],
      value: filteredClases.filter((c) => new Date(c.fecha).getDay() === i).length,
    }))
    .sort(
      (a, b) =>
        ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].indexOf(a.name) -
        ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].indexOf(b.name),
    )

  // Datos para el gráfico de disciplinas
  const disciplinasData = clasesStats.porDisciplina.slice(0, 5).map((d) => ({
    name: d.nombre,
    value: d.count,
    color: d.color,
  }))

  // Calcular estadísticas de pagos para el periodo seleccionado
  const pagosStats = {
    total: filteredPagos.length,
    pendientes: filteredPagos.filter((p) => p.estado === "PENDIENTE").length,
    pagados: filteredPagos.filter((p) => p.estado === "APROBADO").length,
    montoTotal: filteredPagos.reduce((acc, pago) => acc + pago.pagoFinal, 0),
    montoPagado: filteredPagos.filter((p) => p.estado === "APROBADO").reduce((acc, pago) => acc + pago.pagoFinal, 0),
    montoPendiente: filteredPagos
      .filter((p) => p.estado === "PENDIENTE")
      .reduce((acc, pago) => acc + pago.pagoFinal, 0),
    montoPromedio:
      filteredPagos.length > 0
        ? filteredPagos.reduce((acc, pago) => acc + pago.pagoFinal, 0) / filteredPagos.length
        : 0,
    ultimoPago:
      filteredPagos.length > 0
        ? [...filteredPagos]
            .filter((p) => p.estado === "APROBADO")
            .sort(
              (a, b) =>
                new Date(b.updatedAt! || b.createdAt).getTime() - new Date(a.updatedAt! || a.createdAt).getTime(),
            )[0]
        : null,
    proximoPago: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    porcentajePagado: 0,
    porcentajePendiente: 0,
    distribucionPorMonto: [
      {
        rango: "0-500",
        count: filteredPagos.filter((p) => p.pagoFinal <= 500).length,
      },
      {
        rango: "501-1000",
        count: filteredPagos.filter((p) => p.pagoFinal > 500 && p.pagoFinal <= 1000).length,
      },
      {
        rango: "1001-2000",
        count: filteredPagos.filter((p) => p.pagoFinal > 1000 && p.pagoFinal <= 2000).length,
      },
      {
        rango: "2001+",
        count: filteredPagos.filter((p) => p.pagoFinal > 2000).length,
      },
    ],
  }

  pagosStats.porcentajePagado = filteredPagos.length > 0 ? (pagosStats.pagados / filteredPagos.length) * 100 : 0
  pagosStats.porcentajePendiente = filteredPagos.length > 0 ? (pagosStats.pendientes / filteredPagos.length) * 100 : 0

  // Datos para el gráfico de estado de pagos
  const estadoPagosData = [
    { name: "Pagados", value: pagosStats.pagados, color: "#34d399" },
    { name: "Pendientes", value: pagosStats.pendientes, color: "#fbbf24" },
  ]

  // Datos para el gráfico de distribución por monto
  const distribucionMontoData = pagosStats.distribucionPorMonto.map((item) => ({
    name: item.rango,
    value: item.count,
  }))

  // Calcular estadísticas del salón
  const salonStats = {
    totalLocales: [...new Set(filteredClases.map((c) => c.estudio))].length,
    ciudades: [...new Set(filteredClases.map((c) => c.ciudad))].length,
    paises: [...new Set(filteredClases.map((c) => c.pais))].length,
    localesMasUsados: [...new Set(filteredClases.map((c) => c.estudio))]
      .map((estudio) => ({
        nombre: estudio,
        count: filteredClases.filter((c) => c.estudio === estudio).length,
        ocupacionPromedio:
          filteredClases.filter((c) => c.estudio === estudio).length > 0
            ? Math.round(
                (filteredClases
                  .filter((c) => c.estudio === estudio)
                  .reduce((acc, clase) => acc + clase.reservasTotales / (clase.lugares || 1), 0) /
                  filteredClases.filter((c) => c.estudio === estudio).length) *
                  100,
              )
            : 0,
        reservasTotales: filteredClases
          .filter((c) => c.estudio === estudio)
          .reduce((acc, clase) => acc + clase.reservasTotales, 0),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    horariosMasPopulares: filteredClases
      .map((c) => new Date(c.fecha).getHours())
      .reduce(
        (acc, hour) => {
          acc[hour] = (acc[hour] || 0) + 1
          return acc
        },
        {} as Record<number, number>,
      ),
    ciudadesMasPopulares: [...new Set(filteredClases.map((c) => c.ciudad))]
      .map((ciudad) => ({
        nombre: ciudad,
        count: filteredClases.filter((c) => c.ciudad === ciudad).length,
        ocupacionPromedio:
          filteredClases.filter((c) => c.ciudad === ciudad).length > 0
            ? Math.round(
                (filteredClases
                  .filter((c) => c.ciudad === ciudad)
                  .reduce((acc, clase) => acc + clase.reservasTotales / (clase.lugares || 1), 0) /
                  filteredClases.filter((c) => c.ciudad === ciudad).length) *
                  100,
              )
            : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  }

  // Datos para el gráfico de locales más usados
  const localesMasUsadosData = salonStats.localesMasUsados.map((local) => ({
    name: local.nombre,
    clases: local.count,
    ocupacion: local.ocupacionPromedio,
  }))

  // Datos para el gráfico de horarios más populares
  const horariosMasPopularesData = Object.entries(salonStats.horariosMasPopulares)
    .map(([hora, count]) => ({
      name: `${hora}:00`,
      value: count,
    }))
    .sort((a, b) => Number.parseInt(a.name) - Number.parseInt(b.name))

  // Corregir el cálculo de estadísticas de instructores por ocupación
  const instructoresPorOcupacion = instructores.map((instructor) => {
    const clasesInstructor = filteredClases.filter((c) => c.instructorId === instructor.id)
    const ocupacionTotal = clasesInstructor.reduce((acc, clase) => {
      return acc + clase.reservasTotales / clase.lugares
    }, 0)
    const ocupacionPromedio = clasesInstructor.length > 0 ? (ocupacionTotal / clasesInstructor.length) * 100 : 0

    // Usar los pagos reales en lugar de calcular ingresos estimados
    const pagosTotales = filteredPagos
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

  // Datos para el gráfico de instructores top
  const instructoresTopData = instructoresPorOcupacion
    .sort((a, b) => b.ingresoTotal - a.ingresoTotal)
    .slice(0, 5)
    .map((instructor) => ({
      name: instructor.nombre,
      ingresos: instructor.ingresoTotal,
      ocupacion: instructor.ocupacionPromedio,
    }))

  // Formatear moneda
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Obtener el nombre del periodo seleccionado
  const getPeriodoNombre = (): string => {
    if (!selectedPeriods) return "Todos los periodos"

    const [startId, endId] = selectedPeriods
    if (startId === endId) {
      const periodo = periodos.find((p) => p.id === startId)
      return periodo ? `Periodo ${periodo.numero}/${periodo.año}` : "Periodo seleccionado"
    }

    return "Rango de periodos seleccionado"
  }

  // Colores para los gráficos - más sutiles
  const COLORS = {
    primary: "#7b8af9",
    secondary: "#9e77ed",
    accent: "#f0abfc",
    success: "#34d399",
    warning: "#fbbf24",
    danger: "#f87171",
    info: "#60a5fa",
    muted: "#94a3b8",
  }

  // Renderizar estado de carga
  if (isLoading || isLoadingInstructores || isLoadingDisciplinas) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>

        <div className="mb-6">
          <div className="grid grid-cols-4 gap-1 w-full">
            <Skeleton className="h-9 rounded-lg" />
            <Skeleton className="h-9 rounded-lg" />
            <Skeleton className="h-9 rounded-lg" />
            <Skeleton className="h-9 rounded-lg" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-28" />
                </div>
                <Skeleton className="h-7 w-20" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
 

  return (
    <div className="container py-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight  text-accent">
            Dashboard Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {getPeriodoNombre()} • Última actualización: {format(new Date(), "dd MMM yyyy, HH:mm", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Selector de periodos */}
          <Popover open={isPeriodsOpen} onOpenChange={setIsPeriodsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full md:w-auto justify-between border transition-colors",
                  selectedPeriods ? "border-purple-100 text-foreground" : "",
                )}
                size="sm"
              >
                <div className="flex items-center gap-1.5">
                  <CalendarRange className={cn("h-3.5 w-3.5", selectedPeriods ? "text-purple-500" : "")} />
                  <span className="text-sm">{getPeriodsDisplayText()}</span>
                </div>
                {isPeriodsOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 ml-1.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="end">
              <div className="p-3 border-b">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-sm">Selección de periodos</h3>
                  {selectedPeriods && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetPeriodSelection}
                      className="h-7 px-2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3 mr-1" />
                      <span className="text-xs">Resetear</span>
                    </Button>
                  )}
                </div>

                <Tabs value={activePeriodsTab} onValueChange={(v) => setActivePeriodsTab(v as any)} className="mt-1">
                  <TabsList className="grid w-full grid-cols-2 mb-2 h-8">
                    <TabsTrigger value="individual" className="text-xs">
                      Periodo individual
                    </TabsTrigger>
                    <TabsTrigger value="rango" className="text-xs">
                      Rango de periodos
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="individual" className="mt-1 pt-1">
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-1 pr-3">
                        {periodos.map((periodo) => {
                          const isSelected =
                            selectedPeriods?.[0] === periodo.id && selectedPeriods?.[0] === selectedPeriods?.[1]
                          const isCurrentPeriod = periodo.id === periodoActual?.id

                          return (
                            <div
                              key={periodo.id}
                              onClick={() => handlePeriodSelection(periodo.id)}
                              className={cn(
                                "p-2 rounded-md cursor-pointer transition-all hover:bg-purple-50/50 dark:hover:bg-purple-950/20",
                                isSelected && "bg-purple-50/80 dark:bg-purple-900/20 font-medium",
                                isCurrentPeriod && "border-l-2 border-purple-400",
                                !isSelected && isCurrentPeriod && "pl-1.5",
                              )}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium">
                                    Periodo {periodo.numero}/{periodo.año}
                                  </span>
                                  {isCurrentPeriod && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] h-4 bg-purple-50/50 border-purple-100 text-purple-600 dark:bg-purple-950/20 dark:border-purple-800 dark:text-purple-400"
                                    >
                                      Actual
                                    </Badge>
                                  )}
                                </div>
                                {isSelected && (
                                  <div className="flex items-center">
                                    <span className="h-4 w-4 rounded-full bg-purple-500 flex items-center justify-center">
                                      <Check className="h-2.5 w-2.5 text-white" />
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {formatFecha(periodo.fechaInicio)} - {formatFecha(periodo.fechaFin)}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="rango" className="mt-1 pt-1">
                    <div className="mb-2 text-xs text-muted-foreground">
                      {!tempStartPeriod
                        ? "Selecciona un periodo inicial"
                        : !tempEndPeriod
                          ? "Ahora selecciona un periodo final"
                          : `Periodo ${periodos.find((p) => p.id === tempStartPeriod)?.numero}/${
                              periodos.find((p) => p.id === tempStartPeriod)?.año
                            } → ${periodos.find((p) => p.id === tempEndPeriod)?.numero}/${
                              periodos.find((p) => p.id === tempEndPeriod)?.año
                            }`}
                    </div>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-1 pr-3">
                        {periodos.map((periodo) => {
                          const isStart = periodo.id === tempStartPeriod
                          const isEnd = periodo.id === tempEndPeriod
                          const isInRange =
                            tempStartPeriod &&
                            tempEndPeriod &&
                            periodo.id >= Math.min(tempStartPeriod, tempEndPeriod) &&
                            periodo.id <= Math.max(tempStartPeriod, tempEndPeriod)
                          const isSelectable = tempStartPeriod === null || tempEndPeriod === null
                          const isCurrentPeriod = periodo.id === periodoActual?.id

                          return (
                            <div
                              key={periodo.id}
                              onClick={() => {
                                if (isSelectable) {
                                  if (tempStartPeriod === null) {
                                    handleRangeStartSelect(periodo.id)
                                  } else {
                                    handleRangeEndSelect(periodo.id)
                                  }
                                }
                              }}
                              className={cn(
                                "p-2 rounded-md transition-all",
                                isStart && "bg-purple-50/80 dark:bg-purple-900/20",
                                isEnd && "bg-purple-100/80 dark:bg-purple-800/20",
                                isInRange && !isStart && !isEnd && "bg-purple-50/30 dark:bg-purple-950/10",
                                isSelectable
                                  ? "cursor-pointer hover:bg-purple-50/50 dark:hover:bg-purple-950/20"
                                  : "cursor-default",
                                isCurrentPeriod && "border-l-2 border-purple-400",
                                isCurrentPeriod && !isStart && !isEnd && !isInRange && "pl-1.5",
                              )}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium">
                                    Periodo {periodo.numero}/{periodo.año}
                                  </span>
                                  {isCurrentPeriod && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] h-4 bg-purple-50/50 border-purple-100 text-purple-600 dark:bg-purple-950/20 dark:border-purple-800 dark:text-purple-400"
                                    >
                                      Actual
                                    </Badge>
                                  )}
                                </div>
                                {isStart && (
                                  <Badge className="text-[9px] h-4 bg-purple-500 hover:bg-purple-600">Inicio</Badge>
                                )}
                                {isEnd && (
                                  <Badge className="text-[9px] h-4 bg-purple-600 hover:bg-purple-700">Fin</Badge>
                                )}
                                {isInRange && !isStart && !isEnd && (
                                  <Badge className="text-[9px] h-4 bg-purple-300 hover:bg-purple-400">Incluido</Badge>
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {formatFecha(periodo.fechaInicio)} - {formatFecha(periodo.fechaFin)}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>

                    <div className="flex justify-between mt-3 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTempStartPeriod(null)
                          setTempEndPeriod(null)
                        }}
                        disabled={!tempStartPeriod && !tempEndPeriod}
                        className="text-xs h-7"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Limpiar
                      </Button>
                      <Button
                        size="sm"
                        onClick={applyRangeSelection}
                        disabled={!tempStartPeriod}
                        className="bg-purple-500 hover:bg-purple-600 text-xs h-7"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        {tempStartPeriod && tempEndPeriod ? "Aplicar rango" : "Seleccionar"}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full mb-4 bg-muted/30 p-1 rounded-lg">
          <TabsTrigger
            value="general"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-purple-500 data-[state=active]:shadow-sm rounded-md transition-all"
          >
            General
          </TabsTrigger>
          <TabsTrigger
            value="instructores"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-purple-500 data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Instructores
          </TabsTrigger>
          <TabsTrigger
            value="salon"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-purple-500 data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Salón
          </TabsTrigger>
          <TabsTrigger
            value="pagos"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-purple-500 data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Pagos
          </TabsTrigger>
        </TabsList>

        {/* Pestaña General */}
        <TabsContent value="general" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Instructores */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-br from-purple-50/70 to-slate-50/70 dark:from-purple-950/20 dark:to-slate-950/20 p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-purple-100/80 dark:bg-purple-900/30">
                      <Users className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                    </div>
                    <span>Instructores</span>
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="bg-purple-50/50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:border-purple-800 dark:text-purple-400 text-[10px]"
                  >
                    {instructoresStats.nuevos} nuevos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-3">
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">{instructoresStats.total}</div>
                  <div className="flex flex-col items-end">
                    <div className="text-xs text-muted-foreground">Activos</div>
                    <div className="text-sm font-medium">
                      {instructoresStats.activos} (
                      {Math.round((instructoresStats.activos / instructoresStats.total) * 100)}%)
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Embajadores</span>
                    <span className="font-medium">
                      {instructoresStats.porCategoria.senior +
                        instructoresStats.porCategoria.embajador +
                        instructoresStats.porCategoria.junior}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disciplinas */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-br from-indigo-50/70 to-slate-50/70 dark:from-indigo-950/20 dark:to-slate-950/20 p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-indigo-100/80 dark:bg-indigo-900/30">
                      <BookOpen className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <span>Disciplinas</span>
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="bg-indigo-50/50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-800 dark:text-indigo-400 text-[10px]"
                  >
                    {disciplinasStats.activas} activas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-3">
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">{disciplinasStats.total}</div>
                  <div className="flex flex-col items-end">
                    <div className="text-xs text-muted-foreground">Más popular</div>
                    <div className="text-sm font-medium">
                      {disciplinasData.length > 0 ? disciplinasData[0].name : "N/A"}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Clases por disciplina</span>
                    <span className="font-medium">
                      {disciplinasStats.total > 0 ? Math.round(filteredClases.length / disciplinasStats.total) : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clases */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-br from-blue-50/70 to-slate-50/70 dark:from-blue-950/20 dark:to-slate-950/20 p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-blue-100/80 dark:bg-blue-900/30">
                      <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    </div>
                    <span>Clases</span>
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="bg-blue-50/50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-400 text-[10px]"
                  >
                    {clasesStats.clasesLlenas} llenas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-3">
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">{clasesStats.total}</div>
                  <div className="flex flex-col items-end">
                    <div className="text-xs text-muted-foreground">Ocupación</div>
                    <div className="text-sm font-medium">{clasesStats.ocupacionPromedio}%</div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Reservas totales</span>
                    <span className="font-medium">{clasesStats.reservasTotales}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pagos */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-br from-emerald-50/70 to-slate-50/70 dark:from-emerald-950/20 dark:to-slate-950/20 p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-900/30">
                      <DollarSign className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <span>Pagos</span>
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="bg-emerald-50/50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400 text-[10px]"
                  >
                    {Math.round(pagosStats.porcentajePagado)}% completado
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-3">
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">{formatCurrency(pagosStats.montoTotal)}</div>
                  <div className="flex flex-col items-end">
                    <div className="text-xs text-muted-foreground">Pendiente</div>
                    <div className="text-sm font-medium">{formatCurrency(pagosStats.montoPendiente)}</div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Promedio por pago</span>
                    <span className="font-medium">{formatCurrency(pagosStats.montoPromedio)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Disciplinas Populares */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  Disciplinas Más Impartidas
                </CardTitle>
                <CardDescription className="text-xs">{getPeriodoNombre()}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {isLoadingClases ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : disciplinasData.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No hay clases registradas en este periodo
                  </div>
                ) : (
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={disciplinasData}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                        <Tooltip
                          cursor={false}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-md">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center gap-1">
                                    <div
                                      className="h-2 w-2 rounded-full"
                                      style={{ backgroundColor: payload[0]?.payload?.color || COLORS.primary }}
                                    />
                                    <span className="text-xs font-medium">{payload[0]?.name}:</span>
                                  </div>
                                  <div className="text-xs font-medium">{(payload[0]?.value as number) || 0} clases</div>
                                </div>
                              </div>
                            )
                          }}
                        />
                        <Bar dataKey="value" name="Clases" radius={[4, 4, 0, 0]} fillOpacity={0.9}>
                          {disciplinasData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS.primary} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Clases por Día */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  Clases por Día
                </CardTitle>
                <CardDescription className="text-xs">{getPeriodoNombre()}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {isLoadingClases ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : clasesPorDiaData.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No hay clases registradas en este periodo
                  </div>
                ) : (
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={clasesPorDiaData}>
                        <defs>
                          <linearGradient id="fillArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.6} />
                            <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                        <Tooltip
                          cursor={false}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-md">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center gap-1">
                                    <div
                                      className="h-2 w-2 rounded-full"
                                      style={{ backgroundColor: COLORS.secondary }}
                                    />
                                    <span className="text-xs font-medium">{payload[0]?.name}:</span>
                                  </div>
                                  <div className="text-xs font-medium">{(payload[0]?.value as number) || 0} clases</div>
                                </div>
                              </div>
                            )
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          name="Clases"
                          stroke={COLORS.secondary}
                          fill="url(#fillArea)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Metrics Row */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Métricas de Ocupación */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 md:col-span-1">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Percent className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  Métricas de Ocupación
                </CardTitle>
                <CardDescription className="text-xs">{getPeriodoNombre()}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs">Clases llenas</span>
                      <span className="text-xs font-medium">{clasesStats.porcentajeClasesLlenas}%</span>
                    </div>
                    <Progress
                      value={clasesStats.porcentajeClasesLlenas}
                      className="h-1.5"
                      style={
                        {
                          "--progress-background": "hsl(var(--muted))",
                          "--progress-foreground": COLORS.success,
                        } as React.CSSProperties
                      }
                    />
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {clasesStats.clasesLlenas} de {clasesStats.total} clases
                    </div>
                  </div>

                  <div className="pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">Total reservas</span>
                      <span className="text-xs font-medium">{clasesStats.reservasTotales}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Promedio: {Math.round(clasesStats.reservasTotales / (clasesStats.total || 1))} por clase
                    </div>
                  </div>

                  <div className="pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">Ocupación promedio</span>
                      <span className="text-xs font-medium">{clasesStats.ocupacionPromedio}%</span>
                    </div>
                    <Progress
                      value={clasesStats.ocupacionPromedio}
                      className="h-1.5 mt-1"
                      style={
                        {
                          "--progress-background": "hsl(var(--muted))",
                          "--progress-foreground": COLORS.info,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categorías de Instructores */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 md:col-span-2">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  Categorías de Instructores
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={instructoresCategoriaData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {instructoresCategoriaData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color || Object.values(COLORS)[index % Object.values(COLORS).length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-md">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-1">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: payload[0]?.payload?.color || COLORS.primary }}
                                  />
                                  <span className="text-xs font-medium">{payload[0]?.name}:</span>
                                </div>
                                <div className="text-xs font-medium">
                                  {(payload[0]?.value as number) || 0} instructores
                                </div>
                              </div>
                            </div>
                          )
                        }}
                      />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pagos Row */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Estado de Pagos */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  Estado de Pagos
                </CardTitle>
                <CardDescription className="text-xs">{getPeriodoNombre()}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {isLoadingPagos ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : estadoPagosData.reduce((sum, item) => sum + item.value, 0) === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No hay pagos registrados en este periodo
                  </div>
                ) : (
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={estadoPagosData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {estadoPagosData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color || Object.values(COLORS)[index % Object.values(COLORS).length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-md">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center gap-1">
                                    <div
                                      className="h-2 w-2 rounded-full"
                                      style={{ backgroundColor: payload[0]?.payload?.color || COLORS.primary }}
                                    />
                                    <span className="text-xs font-medium">{payload[0]?.name}:</span>
                                  </div>
                                  <div className="text-xs font-medium">{(payload[0]?.value as number) || 0} pagos</div>
                                </div>
                              </div>
                            )
                          }}
                        />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-emerald-50/50 to-slate-50/50 dark:from-emerald-950/10 dark:to-slate-950/10 p-2.5 rounded-lg">
                    <div className="text-xs text-muted-foreground">Monto pagado</div>
                    <div className="text-sm font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(pagosStats.montoPagado)}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50/50 to-slate-50/50 dark:from-amber-950/10 dark:to-slate-950/10 p-2.5 rounded-lg">
                    <div className="text-xs text-muted-foreground">Monto pendiente</div>
                    <div className="text-sm font-bold mt-1 text-amber-600 dark:text-amber-400">
                      {formatCurrency(pagosStats.montoPendiente)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Distribución por Monto */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  Distribución por Monto
                </CardTitle>
                <CardDescription className="text-xs">{getPeriodoNombre()}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {isLoadingPagos ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : distribucionMontoData.reduce((sum, item) => sum + item.value, 0) === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No hay pagos registrados en este periodo
                  </div>
                ) : (
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distribucionMontoData}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                        <Tooltip
                          cursor={false}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-md">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center gap-1">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.info }} />
                                    <span className="text-xs font-medium">Rango {payload[0]?.name}:</span>
                                  </div>
                                  <div className="text-xs font-medium">{(payload[0]?.value as number) || 0} pagos</div>
                                </div>
                              </div>
                            )
                          }}
                        />
                        <Bar dataKey="value" name="Pagos" fill={COLORS.info} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="mt-3 bg-gradient-to-br from-blue-50/50 to-slate-50/50 dark:from-blue-950/10 dark:to-slate-950/10 p-2.5 rounded-lg">
                  <div className="text-xs text-muted-foreground">Monto promedio por pago</div>
                  <div className="text-sm font-bold mt-1 text-blue-600 dark:text-blue-400">
                    {formatCurrency(pagosStats.montoPromedio)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pestaña Instructores */}
        <TabsContent value="instructores" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Instructores */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-br from-purple-50/70 to-slate-50/70 dark:from-purple-950/20 dark:to-slate-950/20 p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-purple-100/80 dark:bg-purple-900/30">
                      <Users className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                    </div>
                    <span>Total Instructores</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-3">
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">{instructoresStats.total}</div>
                  <div className="flex flex-col items-end">
                    <div className="text-xs text-muted-foreground">Activos</div>
                    <div className="text-sm font-medium">
                      {instructoresStats.activos} (
                      {Math.round((instructoresStats.activos / instructoresStats.total) * 100)}%)
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Nuevos (30d)</span>
                    <span className="font-medium">{instructoresStats.nuevos}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Embajadores */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-br from-indigo-50/70 to-slate-50/70 dark:from-indigo-950/20 dark:to-slate-950/20 p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-indigo-100/80 dark:bg-indigo-900/30">
                      <Award className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <span>Embajadores</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-3">
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">
                    {instructoresStats.porCategoria.senior +
                      instructoresStats.porCategoria.embajador +
                      instructoresStats.porCategoria.junior}
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-xs text-muted-foreground">Senior</div>
                    <div className="text-sm font-medium">{instructoresStats.porCategoria.senior}</div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Instructores</span>
                    <span className="font-medium">{instructoresStats.porCategoria.instructor}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clases Impartidas */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-br from-blue-50/70 to-slate-50/70 dark:from-blue-950/20 dark:to-slate-950/20 p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-blue-100/80 dark:bg-blue-900/30">
                      <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    </div>
                    <span>Clases Impartidas</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-3">
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">{filteredClases.length}</div>
                  <div className="flex flex-col items-end">
                    <div className="text-xs text-muted-foreground">Ocupación</div>
                    <div className="text-sm font-medium">{clasesStats.ocupacionPromedio}%</div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Reservas totales</span>
                    <span className="font-medium">{clasesStats.reservasTotales}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pagos a Instructores */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-br from-emerald-50/70 to-slate-50/70 dark:from-emerald-950/20 dark:to-slate-950/20 p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-900/30">
                      <DollarSign className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <span>Pagos a Instructores</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-3">
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">{formatCurrency(pagosStats.montoTotal)}</div>
                  <div className="flex flex-col items-end">
                    <div className="text-xs text-muted-foreground">Pendiente</div>
                    <div className="text-sm font-medium">{formatCurrency(pagosStats.montoPendiente)}</div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Promedio por instructor</span>
                    <span className="font-medium">
                      {formatCurrency(instructores.length > 0 ? pagosStats.montoTotal / instructores.length : 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Instructores por Ingresos */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  Top Instructores por Ingresos
                </CardTitle>
                <CardDescription className="text-xs">{getPeriodoNombre()}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {instructoresTopData.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No hay datos de ingresos para instructores en este periodo
                  </div>
                ) : (
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={instructoresTopData} layout="vertical">
                        <CartesianGrid
                          horizontal={true}
                          vertical={false}
                          strokeDasharray="3 3"
                          stroke="hsl(var(--muted))"
                        />
                        <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          width={80}
                        />
                        <Tooltip
                          cursor={false}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-md">
                                <div className="text-xs font-medium mb-1">{payload[0]?.payload?.name}</div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center gap-1">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.primary }} />
                                    <span className="text-xs">Ingresos:</span>
                                  </div>
                                  <div className="text-xs font-medium">
                                    {formatCurrency((payload[0]?.payload?.ingresos as number) || 0)}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center gap-1">
                                    <div
                                      className="h-2 w-2 rounded-full"
                                      style={{ backgroundColor: COLORS.secondary }}
                                    />
                                    <span className="text-xs">Ocupación:</span>
                                  </div>
                                  <div className="text-xs font-medium">
                                    {(payload[0]?.payload?.ocupacion as number) || 0}%
                                  </div>
                                </div>
                              </div>
                            )
                          }}
                        />
                        <Bar dataKey="ingresos" name="Ingresos" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Categorías de Instructores */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  Distribución por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={instructoresCategoriaData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {instructoresCategoriaData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color || Object.values(COLORS)[index % Object.values(COLORS).length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-md">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-1">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: payload[0]?.payload?.color || COLORS.primary }}
                                  />
                                  <span className="text-xs font-medium">{payload[0]?.name}:</span>
                                </div>
                                <div className="text-xs font-medium">
                                  {(payload[0]?.value as number) || 0} instructores
                                </div>
                              </div>
                            </div>
                          )
                        }}
                      />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pestaña Salón */}
        <TabsContent value="salon" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Locales */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-br from-purple-50/70 to-slate-50/70 dark:from-purple-950/20 dark:to-slate-950/20 p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-purple-100/80 dark:bg-purple-900/30">
                      <Building className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                    </div>
                    <span>Locales</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-3">
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">{salonStats.totalLocales}</div>
                  <div className="flex flex-col items-end">
                    <div className="text-xs text-muted-foreground">Ciudades</div>
                    <div className="text-sm font-medium">{salonStats.ciudades}</div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Clases por local</span>
                    <span className="font-medium">
                      {salonStats.totalLocales > 0 ? Math.round(filteredClases.length / salonStats.totalLocales) : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clases */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-br from-blue-50/70 to-slate-50/70 dark:from-blue-950/20 dark:to-slate-950/20 p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-blue-100/80 dark:bg-blue-900/30">
                      <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    </div>
                    <span>Clases</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-3">
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">{filteredClases.length}</div>
                  <div className="flex flex-col items-end">
                    <div className="text-xs text-muted-foreground">Ocupación</div>
                    <div className="text-sm font-medium">{clasesStats.ocupacionPromedio}%</div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Clases llenas</span>
                    <span className="font-medium">{clasesStats.clasesLlenas}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Países */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-br from-emerald-50/70 to-slate-50/70 dark:from-emerald-950/20 dark:to-slate-950/20 p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-900/30">
                      <MapPin className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <span>Cobertura</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-3">
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">{salonStats.paises}</div>
                  <div className="flex flex-col items-end">
                    <div className="text-xs text-muted-foreground">Países</div>
                    <div className="text-sm font-medium">{salonStats.ciudades} ciudades</div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Expansión</span>
                    <span className="font-medium">
                      {salonStats.ciudades > 0 ? Math.round(salonStats.totalLocales / salonStats.ciudades) : 0}{" "}
                      locales/ciudad
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Locales Más Utilizados */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  Locales Más Utilizados
                </CardTitle>
                <CardDescription className="text-xs">{getPeriodoNombre()}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {localesMasUsadosData.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No hay datos de locales en este periodo
                  </div>
                ) : (
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={localesMasUsadosData} layout="vertical">
                        <CartesianGrid
                          horizontal={true}
                          vertical={false}
                          strokeDasharray="3 3"
                          stroke="hsl(var(--muted))"
                        />
                        <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          width={100}
                        />
                        <Tooltip
                          cursor={false}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-md">
                                <div className="text-xs font-medium mb-1">{payload[0]?.payload.name}</div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center gap-1">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.primary }} />
                                    <span className="text-xs">Clases:</span>
                                  </div>
                                  <div className="text-xs font-medium">{(payload[0]?.value as number) || 0}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center gap-1">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.info }} />
                                    <span className="text-xs">Ocupación:</span>
                                  </div>
                                  <div className="text-xs font-medium">
                                    {(payload[0]?.payload.ocupacion as number) || 0}%
                                  </div>
                                </div>
                              </div>
                            )
                          }}
                        />
                        <Bar dataKey="clases" name="Clases" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Distribución de Horarios */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  Distribución de Horarios
                </CardTitle>
                <CardDescription className="text-xs">{getPeriodoNombre()}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {horariosMasPopularesData.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No hay datos de horarios en este periodo
                  </div>
                ) : (
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={horariosMasPopularesData}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                        <Tooltip
                          cursor={false}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-md">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center gap-1">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.info }} />
                                    <span className="text-xs font-medium">{payload[0]?.name}:</span>
                                  </div>
                                  <div className="text-xs font-medium">{(payload[0]?.value as number) || 0} clases</div>
                                </div>
                              </div>
                            )
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          name="Clases"
                          stroke={COLORS.info}
                          strokeWidth={2}
                          dot={{ r: 3, fill: COLORS.info }}
                          activeDot={{ r: 5, fill: COLORS.info }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pestaña Pagos */}
        <TabsContent value="pagos" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Pagos */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-br from-purple-50/70 to-slate-50/70 dark:from-purple-950/20 dark:to-slate-950/20 p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-purple-100/80 dark:bg-purple-900/30">
                      <DollarSign className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                    </div>
                    <span>Total Pagos</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-3">
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">{formatCurrency(pagosStats.montoTotal)}</div>
                  <div className="flex flex-col items-end">
                    <div className="text-xs text-muted-foreground">Cantidad</div>
                    <div className="text-sm font-medium">{pagosStats.total} pagos</div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Promedio</span>
                    <span className="font-medium">{formatCurrency(pagosStats.montoPromedio)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pagos Aprobados */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-br from-emerald-50/70 to-slate-50/70 dark:from-emerald-950/20 dark:to-slate-950/20 p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-900/30">
                      <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <span>Pagos Aprobados</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-3">
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">{formatCurrency(pagosStats.montoPagado)}</div>
                  <div className="flex flex-col items-end">
                    <div className="text-xs text-muted-foreground">Cantidad</div>
                    <div className="text-sm font-medium">{pagosStats.pagados} pagos</div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Tendencia</span>
                    <div className="flex items-center text-emerald-600 dark:text-emerald-400">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      <span className="font-medium">+{Math.round(pagosStats.porcentajePagado)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pagos Pendientes */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-br from-amber-50/70 to-slate-50/70 dark:from-amber-950/20 dark:to-slate-950/20 p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-amber-100/80 dark:bg-amber-900/30">
                      <X className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                    </div>
                    <span>Pagos Pendientes</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-3">
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">{formatCurrency(pagosStats.montoPendiente)}</div>
                  <div className="flex flex-col items-end">
                    <div className="text-xs text-muted-foreground">Cantidad</div>
                    <div className="text-sm font-medium">{pagosStats.pendientes} pagos</div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Tendencia</span>
                    <div className="flex items-center text-amber-600 dark:text-amber-400">
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                      <span className="font-medium">-{Math.round(pagosStats.porcentajePagado)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Eficiencia */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-br from-blue-50/70 to-slate-50/70 dark:from-blue-950/20 dark:to-slate-950/20 p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-blue-100/80 dark:bg-blue-900/30">
                      <Zap className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    </div>
                    <span>Eficiencia</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-3">
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">
                    {pagosStats.total > 0 ? Math.round((pagosStats.pagados / pagosStats.total) * 100) : 0}%
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-xs text-muted-foreground">Aprobación</div>
                    <div className="text-sm font-medium">{pagosStats.porcentajePagado.toFixed(1)}%</div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Tiempo promedio</span>
                    <span className="font-medium">3.2 días</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Estado de Pagos */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  Estado de Pagos
                </CardTitle>
                <CardDescription className="text-xs">{getPeriodoNombre()}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {estadoPagosData.reduce((sum, item) => sum + item.value, 0) === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No hay pagos registrados en este periodo
                  </div>
                ) : (
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={estadoPagosData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {estadoPagosData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color || Object.values(COLORS)[index % Object.values(COLORS).length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-md">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center gap-1">
                                    <div
                                      className="h-2 w-2 rounded-full"
                                      style={{ backgroundColor: payload[0]?.payload?.color || COLORS.primary }}
                                    />
                                    <span className="text-xs font-medium">{payload[0]?.name}:</span>
                                  </div>
                                  <div className="text-xs font-medium">{(payload[0]?.value as number) || 0} pagos</div>
                                </div>
                              </div>
                            )
                          }}
                        />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-emerald-50/50 to-slate-50/50 dark:from-emerald-950/10 dark:to-slate-950/10 p-2.5 rounded-lg">
                    <div className="text-xs text-muted-foreground">Monto pagado</div>
                    <div className="text-sm font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(pagosStats.montoPagado)}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50/50 to-slate-50/50 dark:from-amber-950/10 dark:to-slate-950/10 p-2.5 rounded-lg">
                    <div className="text-xs text-muted-foreground">Monto pendiente</div>
                    <div className="text-sm font-bold mt-1 text-amber-600 dark:text-amber-400">
                      {formatCurrency(pagosStats.montoPendiente)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Distribución por Monto */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  Distribución por Monto
                </CardTitle>
                <CardDescription className="text-xs">{getPeriodoNombre()}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {distribucionMontoData.reduce((sum, item) => sum + item.value, 0) === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No hay pagos registrados en este periodo
                  </div>
                ) : (
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distribucionMontoData}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                        <Tooltip
                          cursor={false}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-md">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center gap-1">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.info }} />
                                    <span className="text-xs font-medium">Rango {payload[0]?.name}:</span>
                                  </div>
                                  <div className="text-xs font-medium">{(payload[0]?.value as number) || 0} pagos</div>
                                </div>
                              </div>
                            )
                          }}
                        />
                        <Bar dataKey="value" name="Pagos" fill={COLORS.info} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="mt-3 bg-gradient-to-br from-blue-50/50 to-slate-50/50 dark:from-blue-950/10 dark:to-slate-950/10 p-2.5 rounded-lg">
                  <div className="text-xs text-muted-foreground">Monto promedio por pago</div>
                  <div className="text-sm font-bold mt-1 text-blue-600 dark:text-blue-400">
                    {formatCurrency(pagosStats.montoPromedio)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
