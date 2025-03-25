"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { useClasesStore } from "@/store/useClasesStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RecentClasses } from "@/components/dashboard/recent-classes"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { format, subDays, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { Users, CalendarDays, Dumbbell, BarChart3 } from "lucide-react"

export function Overview() {
  const { instructores, isLoading: isLoadingInstructores, fetchInstructores } = useInstructoresStore()
  const { clases, isLoading: isLoadingClases, fetchClases } = useClasesStore()
  const {
    periodos,
    periodoSeleccionadoId,
    setPeriodoSeleccionado,
    isLoading: isLoadingPeriodos,
    fetchPeriodos,
  } = usePeriodosStore()
  const { disciplinas, isLoading: isLoadingDisciplinas, fetchDisciplinas } = useDisciplinasStore()

  const [activeTab, setActiveTab] = useState("general")
  const [classesByDay, setClassesByDay] = useState<any[]>([])
  const [classesByDiscipline, setClassesByDiscipline] = useState<any[]>([])
  const [reservationStats, setReservationStats] = useState<any[]>([])
  const [statsData, setStatsData] = useState({
    totalInstructors: 0,
    totalClasses: 0,
    totalDisciplines: 0,
    totalReservations: 0,
    avgOccupancy: 0,
    avgWaitlist: 0,
  })

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      const promises = []

      if (instructores.length === 0) {
        promises.push(fetchInstructores())
      }

      if (periodos.length === 0) {
        promises.push(fetchPeriodos())
      }

      if (disciplinas.length === 0) {
        promises.push(fetchDisciplinas())
      }

      if (promises.length > 0) {
        await Promise.all(promises)
      }
    }

    loadInitialData()
  }, [fetchInstructores, fetchPeriodos, fetchDisciplinas, instructores.length, periodos.length, disciplinas.length])

  // Cargar clases cuando cambie el periodo seleccionado
  useEffect(() => {
    if (periodoSeleccionadoId) {
      fetchClases({ periodoId: periodoSeleccionadoId })
    }
  }, [fetchClases, periodoSeleccionadoId])

  // Procesar datos para estadísticas cuando cambien las clases
  useEffect(() => {
    if (clases.length > 0) {
      // Preparar datos para el gráfico de clases por día
      const last14Days = Array.from({ length: 14 }, (_, i) => {
        const date = subDays(new Date(), i)
        return {
          date,
          day: format(date, "dd/MM", { locale: es }),
          classes: 0,
          reservations: 0,
        }
      }).reverse()

      // Contar clases y reservas por día
      clases.forEach((clase) => {
        const claseDate = new Date(clase.fecha)
        const dayData = last14Days.find((d) => isSameDay(d.date, claseDate))

        if (dayData) {
          dayData.classes++
          dayData.reservations += clase.reservasTotales
        }
      })

      setClassesByDay(last14Days)

      // Contar clases por disciplina
      const disciplineClassCount: Record<number, { count: number; name: string; reservations: number }> = {}

      clases.forEach((clase) => {
        if (!disciplineClassCount[clase.disciplinaId]) {
          disciplineClassCount[clase.disciplinaId] = {
            count: 0,
            name: clase.disciplina ? clase.disciplina.nombre : `Disciplina ID ${clase.disciplinaId}`,
            reservations: 0,
          }
        }
        disciplineClassCount[clase.disciplinaId].count++
        disciplineClassCount[clase.disciplinaId].reservations += clase.reservasTotales
      })

      // Convertir a array para el gráfico
      const disciplineClassArray = Object.entries(disciplineClassCount).map(([id, data]) => ({
        id: Number(id),
        name: data.name,
        classes: data.count,
        reservations: data.reservations,
        value: data.count, // Para el gráfico de pastel
      }))

      setClassesByDiscipline(disciplineClassArray)

      // Estadísticas de reservas
      const totalReservations = clases.reduce((sum, clase) => sum + clase.reservasTotales, 0)
      const totalCapacity = clases.reduce((sum, clase) => sum + clase.lugares, 0)
      const totalWaitlist = clases.reduce((sum, clase) => sum + clase.listasEspera, 0)

      const avgOccupancy = totalCapacity > 0 ? Math.round((totalReservations / totalCapacity) * 100) : 0

      const avgWaitlist = clases.length > 0 ? Math.round((totalWaitlist / clases.length) * 10) / 10 : 0

      // Datos para el gráfico de estadísticas de reservas
      const reservationData = [
        { name: "Reservas Totales", value: totalReservations },
        { name: "Reservas Pagadas", value: clases.reduce((sum, clase) => sum + clase.reservasPagadas, 0) },
        { name: "Cortesías", value: clases.reduce((sum, clase) => sum + clase.cortesias, 0) },
        { name: "Listas de Espera", value: totalWaitlist },
      ]

      setReservationStats(reservationData)

      // Actualizar estadísticas generales
      setStatsData({
        totalInstructors: instructores.length,
        totalClasses: clases.length,
        totalDisciplines: disciplinas.length,
        totalReservations,
        avgOccupancy,
        avgWaitlist,
      })
    }
  }, [clases, instructores.length, disciplinas.length])

  // Colores para los gráficos
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#FF6B6B",
    "#6B66FF",
    "#FFD166",
    "#06D6A0",
  ]

  const isLoading = isLoadingInstructores || isLoadingClases || isLoadingPeriodos || isLoadingDisciplinas

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-[250px]" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

        <div className="w-full sm:w-auto">
          <Select
            value={periodoSeleccionadoId?.toString() || ""}
            onValueChange={(value) => setPeriodoSeleccionado(value ? Number(value) : null)}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instructores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.totalInstructors}</div>
            <p className="text-xs text-muted-foreground">Total de instructores registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clases</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.totalClasses}</div>
            <p className="text-xs text-muted-foreground">En el periodo seleccionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disciplinas</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.totalDisciplines}</div>
            <p className="text-xs text-muted-foreground">Tipos de clases disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.avgOccupancy}%</div>
            <p className="text-xs text-muted-foreground">Promedio de ocupación de clases</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="reservas">Reservas</TabsTrigger>
          <TabsTrigger value="disciplinas">Disciplinas</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Clases y reservas en los últimos 14 días</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={classesByDay} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="classes" stroke="#8884d8" name="Clases" />
                  <Line yAxisId="right" type="monotone" dataKey="reservations" stroke="#82ca9d" name="Reservas" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Clases Recientes</CardTitle>
                <CardDescription>Últimas clases programadas</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentClasses periodoId={periodoSeleccionadoId || undefined} limit={5} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estadísticas de Reservas</CardTitle>
                <CardDescription>Desglose de reservas por tipo</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reservationStats}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {reservationStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reservas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Ocupación</CardTitle>
              <CardDescription>Análisis de reservas y listas de espera</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classesByDiscipline} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="classes" fill="#8884d8" name="Clases" />
                  <Bar dataKey="reservations" fill="#82ca9d" name="Reservas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen de Reservas</CardTitle>
              <CardDescription>Información detallada sobre las reservas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium">Reservas Totales</h3>
                  <p className="text-3xl font-bold">{statsData.totalReservations}</p>
                  <p className="text-sm text-muted-foreground">En el periodo seleccionado</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium">Ocupación Promedio</h3>
                  <p className="text-3xl font-bold">{statsData.avgOccupancy}%</p>
                  <p className="text-sm text-muted-foreground">De la capacidad total</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium">Lista de Espera Promedio</h3>
                  <p className="text-3xl font-bold">{statsData.avgWaitlist}</p>
                  <p className="text-sm text-muted-foreground">Personas por clase</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium">Reservas por Clase</h3>
                  <p className="text-3xl font-bold">
                    {statsData.totalClasses > 0
                      ? Math.round((statsData.totalReservations / statsData.totalClasses) * 10) / 10
                      : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Promedio de reservas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disciplinas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Clases por Disciplina</CardTitle>
              <CardDescription>Porcentaje de clases según la disciplina</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classesByDiscipline}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {classesByDiscipline.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

