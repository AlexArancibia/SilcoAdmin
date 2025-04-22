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

interface GeneralTabProps {
  instructores: any[]
  disciplinas: any[]
  filteredClases: any[]
  filteredPagos: any[]
  periodos: any[]
  getPeriodoNombre: () => string
  formatFecha: (fecha: Date | string) => string
  isLoadingClases: boolean
  isLoadingPagos: boolean
}

export function GeneralTab({
  instructores,
  disciplinas,
  filteredClases,
  filteredPagos,
  periodos,
  getPeriodoNombre,
  formatFecha,
  isLoadingClases,
  isLoadingPagos,
}: GeneralTabProps) {
  // Calculate instructor stats
  const instructoresStats = {
    total: instructores.length,
    activos: instructores.filter((i) => i.extrainfo?.activo !== false).length,
    inactivos: instructores.filter((i) => i.extrainfo?.activo === false).length,
    conDisciplinas: instructores.filter((i) => i.disciplinas && i.disciplinas.length > 0).length,
    sinDisciplinas: instructores.filter((i) => !i.disciplinas || i.disciplinas.length === 0).length,
    nuevos: instructores.filter((i) => new Date(i.createdAt!).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000).length,
  }

  // Calculate discipline stats
  const disciplinasStats = {
    total: disciplinas.length,
    activas: disciplinas.filter((d) => d.activo !== false).length,
    inactivos: disciplinas.filter((d) => d.activo === false).length,
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

  // Data for classes by day chart
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

  // Data for disciplines chart
  const disciplinasData = clasesStats.porDisciplina.slice(0, 5).map((d) => ({
    name: d.nombre,
    value: d.count,
    color: d.color,
  }))

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

  // Modify the data for classes by hour chart to add 5 hours to each time
  const clasesPorHoraData = Array.from({ length: 24 })
    .map((_, i) => {
      // Add 5 hours, handling the 24-hour wrap around
      const adjustedHour = (i + 5) % 24
      return {
        name: `${String(adjustedHour).padStart(2, "0")}:00`,
        originalHour: i,
        value: filteredClases.filter((c) => new Date(c.fecha).getHours() === i).length,
      }
    })
    .filter((hour) => hour.value > 0) // Only show hours with classes

  // Venue (Salon) related data
  const salonStats = {
    totalLocales: [...new Set(filteredClases.map((c) => c.estudio))].length,
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
    // Salon occupation rate
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

  // Data for venues most used
  const localesMasUsadosData = salonStats.localesMasUsados.map((local) => ({
    name: local.nombre,
    value: local.count,
  }))

  // Data for venue occupation
  const ocupacionPorSalonData = salonStats.ocupacionPorSalon.map((salon) => ({
    name: salon.nombre,
    ocupacion: salon.ocupacion,
    clases: salon.clases,
  }))

  // Modify the data for reservations by hour chart to add 5 hours to each time
  const reservasPorHoraData = Array.from({ length: 24 })
    .map((_, i) => {
      // Add 5 hours, handling the 24-hour wrap around
      const adjustedHour = (i + 5) % 24
      return {
        name: `${String(adjustedHour).padStart(2, "0")}:00`,
        originalHour: i,
        value: filteredClases
          .filter((c) => new Date(c.fecha).getHours() === i)
          .reduce((acc, clase) => acc + clase.reservasTotales, 0),
      }
    })
    .filter((hour) => hour.value > 0) // Only show hours with reservations


    const instructoresPorOcupacion = instructores.map((instructor) => {
      const clasesInstructor = filteredClases.filter((c) => c.instructorId === instructor.id)
      const ocupacionTotal = clasesInstructor.reduce((acc, clase) => {
        return acc + clase.reservasTotales / clase.lugares
      }, 0)
      const ocupacionPromedio = clasesInstructor.length > 0 ? (ocupacionTotal / clasesInstructor.length) * 100 : 0
  
      // Use real payments instead of estimated income
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
  
    // Data for top instructors chart
    const instructoresTopData = instructoresPorOcupacion
      .sort((a, b) => b.ingresoTotal - a.ingresoTotal)
      .slice(0, 8)
      .map((instructor) => ({
        name: instructor.nombre,
        ingresos: instructor.ingresoTotal,
        ocupacion: instructor.ocupacionPromedio,
      }))
  
    // Data for top instructors by class count
    const instructoresTopClasesData = instructoresPorOcupacion
      .sort((a, b) => b.clasesCount - a.clasesCount)
      .slice(0, 8)
      .map((instructor) => ({
        name: instructor.nombre,
        clases: instructor.clasesCount,
        reservas: instructor.reservasTotal,
      }))
  

  return (
    <>
      {/* KPI Cards */}
      <div className="grid-auto-fit gap-4">
        {/* Instructores */}
        <StatCard
          title="Instructores"
          icon={<Users className="h-4 w-4" />}
          value={instructoresStats.total}
          subtitle="Activos"
          subtitleValue={`${instructoresStats.activos} (${Math.round((instructoresStats.activos / instructoresStats.total) * 100)}%)`}
          badge={`${instructoresStats.nuevos} nuevos`}
          color="purple"
          footer={
            <div className="flex-between text-xs">
              <span className="text-muted-foreground">Con disciplinas</span>
              <span className="font-medium">{instructoresStats.conDisciplinas}</span>
            </div>
          }
        />

        {/* Disciplinas */}
        <StatCard
          title="Disciplinas"
          icon={<BookOpen className="h-4 w-4" />}
          value={disciplinasStats.total}
          subtitle="Más popular"
          subtitleValue={disciplinasData.length > 0 ? disciplinasData[0].name : "N/A"}
          badge={`${disciplinasStats.activas} activas`}
          color="indigo"
          footer={
            <div className="flex-between text-xs">
              <span className=" text-muted-foreground">Clases por disciplina</span>
              <span className="font-medium">
                {disciplinasStats.total > 0 ? Math.round(filteredClases.length / disciplinasStats.total) : 0}
              </span>
            </div>
          }
        />

        {/* Clases */}
        <StatCard
          title="Clases"
          icon={<Calendar className="h-4 w-4" />}
          value={clasesStats.total}
          subtitle="Ocupación"
          subtitleValue={`${clasesStats.ocupacionPromedio}%`}
          badge={`${clasesStats.clasesLlenas} llenas`}
          color="blue"
          footer={
            <div className="flex-between text-xs">
              <span className=" text-muted-foreground">Reservas totales</span>
              <span className="font-medium">{clasesStats.reservasTotales}</span>
            </div>
          }
        />

        {/* Pagos */}
        <StatCard
          title="Pagos"
          icon={<DollarSign className="h-4 w-4" />}
          value={formatCurrency(pagosStats.montoTotal)}
          subtitle="Pendiente"
          subtitleValue={formatCurrency(pagosStats.montoPendiente)}
          badge={`${Math.round(pagosStats.porcentajePagado)}% completado`}
          color="emerald"
          footer={
            <div className="flex-between text-xs">
              <span className=" text-muted-foreground">Promedio por pago</span>
              <span className="font-medium">{formatCurrency(pagosStats.montoPromedio)}</span>
            </div>
          }
        />
      </div>

      {/* First Row of Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Disciplinas Populares */}
        <DashboardChart
          title="Disciplinas Más Impartidas"
          icon={<BarChart3 className="h-4 w-4" />}
          description={getPeriodoNombre()}
          isLoading={isLoadingClases}
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
          isLoading={isLoadingClases}
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
      <div className="grid gap-4 md:grid-cols-2">
        {/* Clases por Horario */}
        <DashboardChart
          title="Clases por Horario"
          icon={<Clock className="h-4 w-4" />}
          description={getPeriodoNombre()}
          isLoading={isLoadingClases}
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
                dataKey="name"
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
                          <span className="text-xs font-medium">Hora {payload[0]?.payload.name}:</span>
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
          isLoading={isLoadingClases}
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
                dataKey="name"
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
                          <span className="text-xs font-medium">Hora {payload[0]?.name}:</span>
                        </div>
                        <div className="text-xs font-medium">{(payload[0]?.value as number) || 0} reservas</div>
                      </div>
                    </div>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                name="Reservas"
                stroke="hsl(var(--accent))"
                fill="url(#fillAreaReservas)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </DashboardChart>
      </div>


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
              <YAxis tickLine={false} axisLine={false} tickMargin={8} style={{ fontSize: "14px" }}/>
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

      {/* Estatus de Pagos */}
 
      <div className="grid gap-4 md:grid-cols-2">
        {/* Salones Más Utilizados */}
        <DashboardChart
          title="Salones Más Utilizados"
          icon={<Building className="h-4 w-4" />}
          description={getPeriodoNombre()}
          isLoading={isLoadingClases}
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
          isLoading={isLoadingClases}
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
