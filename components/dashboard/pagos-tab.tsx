import { DollarSign, Check, X, Zap, PieChart, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react"
 
import { formatCurrency, COLORS } from "../../utils/format-utils"
import {
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
} from "recharts"
import { StatCard } from "./stat-card"
import { DashboardChart } from "./dashboard-chart"

interface PagosTabProps {
  filteredPagos: any[]
  instructores: any[]
  getPeriodoNombre: () => string
  isLoadingPagos: boolean
}

export function PagosTab({ filteredPagos, instructores, getPeriodoNombre, isLoadingPagos }: PagosTabProps) {
  // Calculate payment stats
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
    porcentajePagado:
      filteredPagos.length > 0
        ? (filteredPagos.filter((p) => p.estado === "APROBADO").length / filteredPagos.length) * 100
        : 0,
    porcentajePendiente:
      filteredPagos.length > 0
        ? (filteredPagos.filter((p) => p.estado === "PENDIENTE").length / filteredPagos.length) * 100
        : 0,
  }

  // Data for payment status chart
  const estadoPagosData = [
    { name: "Pagados", value: pagosStats.pagados, color: "#34d399" },
    { name: "Pendientes", value: pagosStats.pendientes, color: "#fbbf24" },
  ]

  // Data for payment distribution chart
  const distribucionMontoData = [
    {
      rango: "0-500",
      value: filteredPagos.filter((p) => p.pagoFinal <= 500).length,
    },
    {
      rango: "501-1000",
      value: filteredPagos.filter((p) => p.pagoFinal > 500 && p.pagoFinal <= 1000).length,
    },
    {
      rango: "1001-2000",
      value: filteredPagos.filter((p) => p.pagoFinal > 1000 && p.pagoFinal <= 2000).length,
    },
    {
      rango: "2001+",
      value: filteredPagos.filter((p) => p.pagoFinal > 2000).length,
    },
  ].map((item) => ({
    name: item.rango,
    value: item.value,
  }))

  return (
    <>
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Pagos */}
        <StatCard
          title="Total Pagos"
          icon={<DollarSign />}
          value={formatCurrency(pagosStats.montoTotal)}
          subtitle="Cantidad"
          subtitleValue={`${pagosStats.total} pagos`}
          color="purple"
          footer={
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Promedio</span>
              <span className="font-medium">{formatCurrency(pagosStats.montoPromedio)}</span>
            </div>
          }
        />

        {/* Pagos Aprobados */}
        <StatCard
          title="Pagos Aprobados"
          icon={<Check />}
          value={formatCurrency(pagosStats.montoPagado)}
          subtitle="Cantidad"
          subtitleValue={`${pagosStats.pagados} pagos`}
          color="emerald"
          footer={
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Tendencia</span>
              <div className="flex items-center text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                <span className="font-medium">+{Math.round(pagosStats.porcentajePagado)}%</span>
              </div>
            </div>
          }
        />

        {/* Pagos Pendientes */}
        <StatCard
          title="Pagos Pendientes"
          icon={<X />}
          value={formatCurrency(pagosStats.montoPendiente)}
          subtitle="Cantidad"
          subtitleValue={`${pagosStats.pendientes} pagos`}
          color="amber"
          footer={
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Tendencia</span>
              <div className="flex items-center text-amber-600 dark:text-amber-400">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                <span className="font-medium">-{Math.round(pagosStats.porcentajePagado)}%</span>
              </div>
            </div>
          }
        />

        {/* Eficiencia */}
        <StatCard
          title="Eficiencia"
          icon={<Zap />}
          value={`${pagosStats.total > 0 ? Math.round((pagosStats.pagados / pagosStats.total) * 100) : 0}%`}
          subtitle="Aprobación"
          subtitleValue={`${pagosStats.porcentajePagado.toFixed(1)}%`}
          color="blue"
          footer={
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Tiempo promedio</span>
              <span className="font-medium">3.2 días</span>
            </div>
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Estado de Pagos */}
        <DashboardChart
          title="Estado de Pagos"
          icon={<PieChart className="h-4 w-4" />}
          description={getPeriodoNombre()}
          isLoading={isLoadingPagos}
          isEmpty={estadoPagosData.reduce((sum, item) => sum + item.value, 0) === 0}
          emptyMessage="No hay pagos registrados en este periodo"
          footer={
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
          }
        >
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
        </DashboardChart>

        {/* Distribución por Monto */}
        <DashboardChart
          title="Distribución por Monto"
          icon={<BarChart3 className="h-4 w-4" />}
          description={getPeriodoNombre()}
          isLoading={isLoadingPagos}
          isEmpty={distribucionMontoData.reduce((sum, item) => sum + item.value, 0) === 0}
          emptyMessage="No hay pagos registrados en este periodo"
          footer={
            <div className="mt-3 bg-gradient-to-br from-blue-50/50 to-slate-50/50 dark:from-blue-950/10 dark:to-slate-950/10 p-2.5 rounded-lg">
              <div className="text-xs text-muted-foreground">Monto promedio por pago</div>
              <div className="text-sm font-bold mt-1 text-blue-600 dark:text-blue-400">
                {formatCurrency(pagosStats.montoPromedio)}
              </div>
            </div>
          }
        >
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
        </DashboardChart>
      </div>
    </>
  )
}
