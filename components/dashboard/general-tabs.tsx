import { useEffect, useState, useRef } from "react"
import { Users, BookOpen, Calendar, DollarSign, BarChart3, TrendingUp, Clock, Building, MapPin } from "lucide-react"

import { formatCurrency, COLORS } from "../../utils/format-utils"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { StatCard } from "./stat-card"
import { DashboardChart } from "./dashboard-chart"
import { useStatsStore } from "@/store/useStatsStore"

interface GeneralTabProps {
  periodoFilter?: {
    periodoId?: number
    periodoInicio?: number
    periodoFin?: number
  }
  getPeriodoNombre: () => string
}

export function GeneralTab({
  periodoFilter,
  getPeriodoNombre,
}: GeneralTabProps) {
  console.log('[GeneralTab] Component rendering with periodoFilter:', periodoFilter)
  
  const {
    generalStats,
    instructorStats,
    classStats,
    venueStats,
    isLoading,
    error,
    fetchAllStats,
  } = useStatsStore()

  // Track if we've already fetched for this period
  const [lastFetchedPeriod, setLastFetchedPeriod] = useState<string | null>(null)
  const hasFetchedRef = useRef<string | null>(null)

  // Load stats when component mounts or period changes
  useEffect(() => {
    console.log('[GeneralTab] useEffect triggered with periodoFilter:', periodoFilter)
    
    // Only fetch if we have a valid period filter and haven't fetched for this period yet
    if (periodoFilter) {
      const periodKey = JSON.stringify(periodoFilter)
      if (hasFetchedRef.current !== periodKey) {
        console.log('[GeneralTab] Fetching stats for new period:', periodKey)
        hasFetchedRef.current = periodKey
        setLastFetchedPeriod(periodKey)
        fetchAllStats(periodoFilter)
      } else {
        console.log('[GeneralTab] Already fetched for this period, skipping')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoFilter])

  // Prepare chart data
  const disciplinasData = classStats?.porDisciplina.slice(0, 5).map((d) => ({
    name: d.nombre,
    value: d.count,
    color: d.color,
  })) || []

  const clasesPorDiaData = classStats?.porDia
    .map((d) => ({
      name: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][d.dia],
      value: d.count,
    }))
    .sort(
      (a, b) =>
        ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].indexOf(a.name) -
        ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].indexOf(b.name),
    ) || []

  const clasesPorHoraData = classStats?.porHorario || []
  const reservasPorHoraData = classStats?.reservasPorHorario || []

  const instructoresTopData = instructorStats?.topPorIngresos.map((instructor) => ({
    name: instructor.nombre,
    ingresos: instructor.ingresos,
    ocupacion: instructor.ocupacion,
  })) || []

  const instructoresTopClasesData = instructorStats?.topPorClases.map((instructor) => ({
    name: instructor.nombre,
    clases: instructor.clases,
    reservas: instructor.reservas,
  })) || []

  const localesMasUsadosData = venueStats?.masUsados.map((local) => ({
    name: local.nombre,
    value: local.count,
  })) || []

  const ocupacionPorSalonData = venueStats?.ocupacionPorSalon.map((salon) => ({
    name: salon.nombre,
    ocupacion: salon.ocupacion,
    clases: salon.clases,
  })) || []

  // Loading state
  if (isLoading) {
    return (
      <div className="grid-auto-fit gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2" />
            <div className="h-8 bg-muted rounded w-1/2 mb-2" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-destructive mb-2">Error al cargar estadísticas</div>
          <div className="text-sm text-muted-foreground">{error}</div>
          <button 
            onClick={() => fetchAllStats(periodoFilter)}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* KPI Cards */}
      <div className="grid-auto-fit gap-4">
        {/* Instructores */}
        <StatCard
          title="Instructores"
          icon={<Users className="h-4 w-4" />}
          value={generalStats?.instructores.total || 0}
          subtitle="Activos"
          subtitleValue={`${generalStats?.instructores.activos || 0} (${generalStats?.instructores.total ? Math.round((generalStats.instructores.activos / generalStats.instructores.total) * 100) : 0}%)`}
          badge={`${generalStats?.instructores.nuevos || 0} nuevos`}
          color="purple"
          footer={
            <div className="flex-between text-xs">
              <span className="text-muted-foreground">Con disciplinas</span>
              <span className="font-medium">{generalStats?.instructores.conDisciplinas || 0}</span>
            </div>
          }
        />

        {/* Disciplinas */}
        <StatCard
          title="Disciplinas"
          icon={<BookOpen className="h-4 w-4" />}
          value={generalStats?.disciplinas.total || 0}
          subtitle="Más popular"
          subtitleValue={disciplinasData.length > 0 ? disciplinasData[0].name : "N/A"}
          badge={`${generalStats?.disciplinas.activas || 0} activas`}
          color="indigo"
          footer={
            <div className="flex-between text-xs">
              <span className=" text-muted-foreground">Clases por disciplina</span>
              <span className="font-medium">
                {generalStats?.disciplinas.total && generalStats?.clases.total 
                  ? Math.round(generalStats.clases.total / generalStats.disciplinas.total) 
                  : 0}
              </span>
            </div>
          }
        />

        {/* Clases */}
        <StatCard
          title="Clases"
          icon={<Calendar className="h-4 w-4" />}
          value={generalStats?.clases.total || 0}
          subtitle="Ocupación"
          subtitleValue={`${generalStats?.clases.ocupacionPromedio || 0}%`}
          badge={`${generalStats?.clases.clasesLlenas || 0} llenas`}
          color="blue"
          footer={
            <div className="flex-between text-xs">
              <span className=" text-muted-foreground">Reservas totales</span>
              <span className="font-medium">{generalStats?.clases.reservasTotales || 0}</span>
            </div>
          }
        />

        {/* Pagos */}
        <StatCard
          title="Pagos"
          icon={<DollarSign className="h-4 w-4" />}
          value={formatCurrency(generalStats?.pagos.montoTotal || 0)}
          subtitle="Pendiente"
          subtitleValue={formatCurrency(generalStats?.pagos.montoPendiente || 0)}
          badge={`${Math.round(generalStats?.pagos.porcentajePagado || 0)}% completado`}
          color="emerald"
          footer={
            <div className="flex-between text-xs">
              <span className=" text-muted-foreground">Promedio por pago</span>
              <span className="font-medium">{formatCurrency(generalStats?.pagos.montoPromedio || 0)}</span>
            </div>
          }
        />
      </div>

      {/* First Row of Charts */}
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        {/* Disciplinas Populares */}
        <DashboardChart
          title="Disciplinas Más Impartidas"
          icon={<BarChart3 className="h-4 w-4" />}
          description={getPeriodoNombre()}
          isLoading={isLoading}
          isEmpty={disciplinasData.length === 0}
          emptyMessage="No hay clases registradas en este periodo"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={disciplinasData} className="animate-fade-in">
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} style={{ fontSize: "14px" }} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} style={{ fontSize: "14px" }} />
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="card p-2 shadow-md">
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
        </DashboardChart>

        {/* Clases por Día */}
        <DashboardChart
          title="Clases por Día"
          icon={<TrendingUp className="h-4 w-4" />}
          description={getPeriodoNombre()}
          isLoading={isLoading}
          isEmpty={clasesPorDiaData.length === 0}
          emptyMessage="No hay clases registradas en este periodo"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={clasesPorDiaData} className="animate-fade-in">
              <defs>
                <linearGradient id="fillAreaDias" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} style={{ fontSize: "14px" }} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} style={{ fontSize: "14px" }} />
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="card p-2 shadow-md">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(var(--primary))" }} />
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
                stroke="hsl(var(--primary))"
                fill="url(#fillAreaDias)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </DashboardChart>
      </div>

      {/* Second Row of Charts */}
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        {/* Clases por Horario */}
        <DashboardChart
          title="Clases por Horario"
          icon={<Clock className="h-4 w-4" />}
          description={getPeriodoNombre()}
          isLoading={isLoading}
          isEmpty={clasesPorHoraData.length === 0}
          emptyMessage="No hay clases registradas en este periodo"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={clasesPorHoraData} className="animate-fade-in">
              <defs>
                <linearGradient id="fillAreaHoras" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis
                dataKey="hora"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.substring(0, 2)}
                style={{ fontSize: "14px" }}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} style={{ fontSize: "14px" }} />
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="card p-2 shadow-md">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(var(--secondary))" }} />
                          <span className="text-xs font-medium">Hora {payload[0]?.payload.hora}:</span>
                        </div>
                        <div className="text-xs font-medium">{(payload[0]?.value as number) || 0} clases</div>
                      </div>
                    </div>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="Clases"
                stroke="hsl(var(--secondary))"
                fill="url(#fillAreaHoras)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </DashboardChart>

        {/* Reservas por Horario */}
        <DashboardChart
          title="Reservas por Horario"
          icon={<TrendingUp className="h-4 w-4" />}
          description={getPeriodoNombre()}
          isLoading={isLoading}
          isEmpty={reservasPorHoraData.length === 0}
          emptyMessage="No hay clases registradas en este periodo"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={reservasPorHoraData} className="animate-fade-in">
              <defs>
                <linearGradient id="fillAreaReservas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis
                dataKey="hora"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.substring(0, 2)}
                style={{ fontSize: "14px" }}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} style={{ fontSize: "14px" }} />
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="card p-2 shadow-md">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(var(--accent))" }} />
                          <span className="text-xs font-medium">Hora {payload[0]?.payload.hora}:</span>
                        </div>
                        <div className="text-xs font-medium">{(payload[0]?.value as number) || 0} reservas</div>
                      </div>
                    </div>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="reservas"
                name="Reservas"
                stroke="hsl(var(--accent))"
                fill="url(#fillAreaReservas)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </DashboardChart>
      </div>

      {/* Third Row of Charts */}
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        {/* Top Instructores por Ingresos */}
        <DashboardChart
          title="Top Instructores por Ingresos"
          icon={<BarChart3 className="h-4 w-4" />}
          description={getPeriodoNombre()}
          isEmpty={instructoresTopData.length === 0}
          emptyMessage="No hay datos de ingresos para instructores en este periodo"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={instructoresTopData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                angle={-45}
                textAnchor="end"
                height={70}
                style={{ fontSize: "14px" }}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} style={{ fontSize: "14px" }} />
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
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.secondary }} />
                          <span className="text-xs">Ocupación:</span>
                        </div>
                        <div className="text-xs font-medium">{(payload[0]?.payload?.ocupacion as number) || 0}%</div>
                      </div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="ingresos" name="Ingresos" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </DashboardChart>

        {/* Top Instructores por Clases */}
        <DashboardChart
          title="Top Instructores por Clases"
          icon={<BookOpen className="h-4 w-4" />}
          description={getPeriodoNombre()}
          isEmpty={instructoresTopClasesData.length === 0}
          emptyMessage="No hay datos de clases para instructores en este periodo"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={instructoresTopClasesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                angle={-45}
                textAnchor="end"
                height={70}
                style={{ fontSize: "14px" }}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} style={{ fontSize: "14px" }} />
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-md">
                      <div className="text-xs font-medium mb-1">{payload[0]?.payload?.name}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.secondary }} />
                          <span className="text-xs">Clases:</span>
                        </div>
                        <div className="text-xs font-medium">{(payload[0]?.payload?.clases as number) || 0}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.accent }} />
                          <span className="text-xs">Reservas:</span>
                        </div>
                        <div className="text-xs font-medium">{(payload[0]?.payload?.reservas as number) || 0}</div>
                      </div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="clases" name="Clases" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </DashboardChart>
      </div>

      {/* Fourth Row of Charts - Venues */}
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        {/* Salones Más Utilizados */}
        <DashboardChart
          title="Salones Más Utilizados"
          icon={<Building className="h-4 w-4" />}
          description={getPeriodoNombre()}
          isLoading={isLoading}
          isEmpty={localesMasUsadosData.length === 0}
          emptyMessage="No hay datos de salones registrados en este periodo"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={localesMasUsadosData} layout="vertical" className="animate-fade-in">
              <CartesianGrid horizontal={true} vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} style={{ fontSize: "14px" }} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={120}
                style={{ fontSize: "14px" }}
              />
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="card p-2 shadow-md">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.primary }} />
                          <span className="text-xs font-medium">{payload[0]?.name}:</span>
                        </div>
                        <div className="text-xs font-medium">{(payload[0]?.value as number) || 0} clases</div>
                      </div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="value" name="Clases" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </DashboardChart>

        {/* Ocupación por Salón */}
        <DashboardChart
          title="Ocupación por Salón"
          icon={<MapPin className="h-4 w-4" />}
          description={getPeriodoNombre()}
          isLoading={isLoading}
          isEmpty={ocupacionPorSalonData.length === 0}
          emptyMessage="No hay datos de ocupación por salón para este periodo"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ocupacionPorSalonData} layout="vertical" className="animate-fade-in">
              <CartesianGrid horizontal={true} vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                style={{ fontSize: "14px" }}
              />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={120}
                style={{ fontSize: "14px" }}
              />
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="card p-2 shadow-md">
                      <div className="text-xs font-medium mb-1">{payload[0]?.payload.name}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.success }} />
                          <span className="text-xs">Ocupación:</span>
                        </div>
                        <div className="text-xs font-medium">{(payload[0]?.payload.ocupacion as number) || 0}%</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.primary }} />
                          <span className="text-xs">Clases:</span>
                        </div>
                        <div className="text-xs font-medium">{(payload[0]?.payload.clases as number) || 0}</div>
                      </div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="ocupacion" name="Porcentaje ocupación" fill={COLORS.success} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </DashboardChart>
      </div>
    </>
  )
}
