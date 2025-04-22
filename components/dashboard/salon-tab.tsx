import { Building, Calendar, MapPin, Clock, TrendingUp } from "lucide-react"
 
import { COLORS } from "../../utils/format-utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts"
import { StatCard } from "./stat-card"
import { DashboardChart } from "./dashboard-chart"

interface SalonTabProps {
  filteredClases: any[]
  getPeriodoNombre: () => string
  isLoadingClases: boolean
}

export function SalonTab({ filteredClases, getPeriodoNombre, isLoadingClases }: SalonTabProps) {
  // Calculate salon stats
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
    diasMasPopulares: Array.from({ length: 7 })
      .map((_, i) => ({
        dia: i,
        nombre: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][i],
        count: filteredClases.filter((c) => new Date(c.fecha).getDay() === i).length,
        ocupacionPromedio:
          filteredClases.filter((c) => new Date(c.fecha).getDay() === i).length > 0
            ? Math.round(
                (filteredClases
                  .filter((c) => new Date(c.fecha).getDay() === i)
                  .reduce((acc, clase) => acc + clase.reservasTotales / (clase.lugares || 1), 0) /
                  filteredClases.filter((c) => new Date(c.fecha).getDay() === i).length) *
                  100,
              )
            : 0,
      }))
      .sort((a, b) => b.count - a.count),
    ocupacionPorSalon: [...new Set(filteredClases.map((c) => c.estudio))]
      .map((estudio) => {
        const clasesEstudio = filteredClases.filter((c) => c.estudio === estudio)
        const totalReservas = clasesEstudio.reduce((sum, c) => sum + c.reservasTotales, 0)
        const totalCapacidad = clasesEstudio.reduce((sum, c) => sum + c.lugares, 0)
        const ocupacion = totalCapacidad > 0 ? (totalReservas / totalCapacidad) * 100 : 0

        return {
          nombre: estudio,
          ocupacion: Math.round(ocupacion),
          clases: clasesEstudio.length,
        }
      })
      .sort((a, b) => b.ocupacion - a.ocupacion)
      .slice(0, 5),
  }

  // Calculate class stats
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
  }

  // Data for most used locations chart
  const localesMasUsadosData = salonStats.localesMasUsados.map((local) => ({
    name: local.nombre,
    clases: local.count,
    ocupacion: local.ocupacionPromedio,
  }))

  // Data for most popular schedules chart
  const horariosMasPopularesData = Object.entries(salonStats.horariosMasPopulares)
    .map(([hora, count]) => ({
      name: `${hora}:00`,
      value: count,
    }))
    .sort((a, b) => Number.parseInt(a.name) - Number.parseInt(b.name))

  // Data for cities chart
  const ciudadesMasPopularesData = salonStats.ciudadesMasPopulares.map((ciudad) => ({
    name: ciudad.nombre,
    clases: ciudad.count,
    ocupacion: ciudad.ocupacionPromedio,
  }))

  // Data for days of week chart
  const diasMasPopularesData = salonStats.diasMasPopulares
    .map((dia) => ({
      name: dia.nombre.substring(0, 3),
      clases: dia.count,
      ocupacion: dia.ocupacionPromedio,
    }))
    .sort((a, b) => {
      const order = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
      return order.indexOf(a.name) - order.indexOf(b.name)
    })

  return (
    <>
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Locales */}
        <StatCard
          title="Locales"
          icon={<Building />}
          value={salonStats.totalLocales}
          subtitle="Ciudades"
          subtitleValue={salonStats.ciudades}
          color="purple"
          footer={
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Clases por local</span>
              <span className="font-medium">
                {salonStats.totalLocales > 0 ? Math.round(filteredClases.length / salonStats.totalLocales) : 0}
              </span>
            </div>
          }
        />

        {/* Clases */}
        <StatCard
          title="Clases"
          icon={<Calendar />}
          value={filteredClases.length}
          subtitle="Ocupación"
          subtitleValue={`${clasesStats.ocupacionPromedio}%`}
          color="blue"
          footer={
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Clases llenas</span>
              <span className="font-medium">{clasesStats.clasesLlenas}</span>
            </div>
          }
        />

        {/* Países */}
        <StatCard
          title="Cobertura"
          icon={<MapPin />}
          value={salonStats.paises}
          subtitle="Países"
          subtitleValue={`${salonStats.ciudades} ciudades`}
          color="emerald"
          footer={
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Expansión</span>
              <span className="font-medium">
                {salonStats.ciudades > 0 ? Math.round(salonStats.totalLocales / salonStats.ciudades) : 0} locales/ciudad
              </span>
            </div>
          }
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        {/* Locales Más Utilizados */}
        <DashboardChart
          title="Locales Más Utilizados"
          icon={<MapPin className="h-4 w-4" />}
          description={getPeriodoNombre()}
          isEmpty={localesMasUsadosData.length === 0}
          emptyMessage="No hay datos de locales en este periodo"
          isLoading={isLoadingClases}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={localesMasUsadosData} layout="vertical">
              <CartesianGrid horizontal={true} vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={8} width={100} />
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
                        <div className="text-xs font-medium">{(payload[0]?.payload.ocupacion as number) || 0}%</div>
                      </div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="clases" name="Clases" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </DashboardChart>

        {/* Distribución de Horarios */}
        <DashboardChart
          title="Distribución de Horarios"
          icon={<Clock className="h-4 w-4" />}
          description={getPeriodoNombre()}
          isEmpty={horariosMasPopularesData.length === 0}
          emptyMessage="No hay datos de horarios en este periodo"
          isLoading={isLoadingClases}
        >
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
        </DashboardChart>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        {/* Ciudades con Más Clases */}
        <DashboardChart
          title="Ciudades con Más Clases"
          icon={<Building className="h-4 w-4" />}
          description={getPeriodoNombre()}
          isEmpty={ciudadesMasPopularesData.length === 0}
          emptyMessage="No hay datos de ciudades en este periodo"
          isLoading={isLoadingClases}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ciudadesMasPopularesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="clases"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {ciudadesMasPopularesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-md">
                      <div className="text-xs font-medium mb-1">{payload[0]?.name}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: payload[0]?.color || COLORS.primary }}
                          />
                          <span className="text-xs">Clases:</span>
                        </div>
                        <div className="text-xs font-medium">{(payload[0]?.value as number) || 0}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.info }} />
                          <span className="text-xs">Ocupación:</span>
                        </div>
                        <div className="text-xs font-medium">{(payload[0]?.payload?.ocupacion as number) || 0}%</div>
                      </div>
                    </div>
                  )
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </DashboardChart>

        {/* Ocupación por Día de la Semana */}
        <DashboardChart
          title="Ocupación por Día de la Semana"
          icon={<TrendingUp className="h-4 w-4" />}
          description={getPeriodoNombre()}
          isEmpty={diasMasPopularesData.length === 0}
          emptyMessage="No hay datos de ocupación por día en este periodo"
          isLoading={isLoadingClases}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={diasMasPopularesData}>
              <defs>
                <linearGradient id="colorOcupacion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-md">
                      <div className="text-xs font-medium mb-1">{payload[0]?.payload?.name}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.primary }} />
                          <span className="text-xs">Ocupación:</span>
                        </div>
                        <div className="text-xs font-medium">{(payload[0]?.payload?.ocupacion as number) || 0}%</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.secondary }} />
                          <span className="text-xs">Clases:</span>
                        </div>
                        <div className="text-xs font-medium">{(payload[0]?.payload?.clases as number) || 0}</div>
                      </div>
                    </div>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="ocupacion"
                name="Ocupación"
                stroke={COLORS.accent}
                fillOpacity={0.6}
                fill="url(#colorOcupacion)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </DashboardChart>
      </div>
    </>
  )
}
