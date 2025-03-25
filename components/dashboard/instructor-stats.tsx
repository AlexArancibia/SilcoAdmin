"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { useClasesStore } from "@/store/useClasesStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Users, CalendarDays, TrendingUp, Award } from "lucide-react"

export function InstructorStats() {
  const { instructores, isLoading: isLoadingInstructores, fetchInstructores } = useInstructoresStore()
  const { clases, isLoading: isLoadingClases, fetchClases } = useClasesStore()
  const {
    periodos,
    periodoSeleccionadoId,
    setPeriodoSeleccionado,
    isLoading: isLoadingPeriodos,
    fetchPeriodos,
  } = usePeriodosStore()

  const [activeTab, setActiveTab] = useState("general")
  const [topInstructors, setTopInstructors] = useState<any[]>([])
  const [classesByDiscipline, setClassesByDiscipline] = useState<any[]>([])
  const [classesByDay, setClassesByDay] = useState<any[]>([])
  const [statsData, setStatsData] = useState({
    totalInstructors: 0,
    activeInstructors: 0,
    totalClasses: 0,
    avgClassesPerInstructor: 0,
    maxClassesPerInstructor: 0,
    instructorWithMostClasses: "",
  })

  // Cargar datos iniciales
  useEffect(() => {
    if (instructores.length === 0) {
      fetchInstructores()
    }

    if (periodos.length === 0) {
      fetchPeriodos()
    }
  }, [fetchInstructores, fetchPeriodos, instructores.length, periodos.length])

  // Cargar clases cuando cambie el periodo seleccionado
  useEffect(() => {
    if (periodoSeleccionadoId) {
      fetchClases({ periodoId: periodoSeleccionadoId })
    }
  }, [fetchClases, periodoSeleccionadoId])

  // Procesar datos para estadísticas cuando cambien las clases o instructores
  useEffect(() => {
    if (clases.length > 0 && instructores.length > 0) {
      // Contar clases por instructor
      const instructorClassCount: Record<number, { count: number; name: string }> = {}

      clases.forEach((clase) => {
        if (!instructorClassCount[clase.instructorId]) {
          const instructor = instructores.find((i) => i.id === clase.instructorId)
          instructorClassCount[clase.instructorId] = {
            count: 0,
            name: instructor ? instructor.nombre : `Instructor ID ${clase.instructorId}`,
          }
        }
        instructorClassCount[clase.instructorId].count++
      })

      // Convertir a array para ordenar
      const instructorClassArray = Object.entries(instructorClassCount).map(([id, data]) => ({
        id: Number(id),
        name: data.name,
        classes: data.count,
      }))

      // Ordenar por número de clases (descendente)
      instructorClassArray.sort((a, b) => b.classes - a.classes)

      // Tomar los 10 primeros para el gráfico
      setTopInstructors(instructorClassArray.slice(0, 10))

      // Contar clases por disciplina
      const disciplineClassCount: Record<number, { count: number; name: string }> = {}

      clases.forEach((clase) => {
        if (!disciplineClassCount[clase.disciplinaId]) {
          disciplineClassCount[clase.disciplinaId] = {
            count: 0,
            name: clase.disciplina ? clase.disciplina.nombre : `Disciplina ID ${clase.disciplinaId}`,
          }
        }
        disciplineClassCount[clase.disciplinaId].count++
      })

      // Convertir a array para el gráfico de pastel
      const disciplineClassArray = Object.entries(disciplineClassCount).map(([id, data]) => ({
        id: Number(id),
        name: data.name,
        value: data.count,
      }))

      setClassesByDiscipline(disciplineClassArray)

      // Contar clases por día de la semana
      const dayClassCount: Record<string, number> = {
        LUNES: 0,
        MARTES: 0,
        MIERCOLES: 0,
        JUEVES: 0,
        VIERNES: 0,
        SABADO: 0,
        DOMINGO: 0,
      }

      clases.forEach((clase) => {
        const date = new Date(clase.fecha)
        const dayOfWeek = getDayOfWeek(date)
        dayClassCount[dayOfWeek]++
      })

      // Convertir a array para el gráfico
      const dayClassArray = Object.entries(dayClassCount).map(([day, count]) => ({
        day,
        classes: count,
      }))

      setClassesByDay(dayClassArray)

      // Calcular estadísticas generales
      const activeInstructors = instructores.filter(
        (i) => i.extrainfo?.estado === "ACTIVO" || i.extrainfo?.activo === true,
      ).length

      const instructorWithMostClasses = instructorClassArray.length > 0 ? instructorClassArray[0].name : "N/A"

      const maxClassesPerInstructor = instructorClassArray.length > 0 ? instructorClassArray[0].classes : 0

      const avgClassesPerInstructor =
        instructorClassArray.length > 0 ? Math.round((clases.length / instructorClassArray.length) * 10) / 10 : 0

      setStatsData({
        totalInstructors: instructores.length,
        activeInstructors,
        totalClasses: clases.length,
        avgClassesPerInstructor,
        maxClassesPerInstructor,
        instructorWithMostClasses,
      })
    }
  }, [clases, instructores])

  // Función para obtener el día de la semana en español
  const getDayOfWeek = (date: Date): string => {
    const days = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"]
    return days[date.getDay()]
  }

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

  const isLoading = isLoadingInstructores || isLoadingClases || isLoadingPeriodos

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
        <h2 className="text-3xl font-bold tracking-tight">Estadísticas de Instructores</h2>

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
            <CardTitle className="text-sm font-medium">Total Instructores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.totalInstructors}</div>
            <p className="text-xs text-muted-foreground">
              {statsData.activeInstructors} activos (
              {Math.round((statsData.activeInstructors / statsData.totalInstructors) * 100)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clases</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.totalClasses}</div>
            <p className="text-xs text-muted-foreground">En el periodo seleccionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Clases</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.avgClassesPerInstructor}</div>
            <p className="text-xs text-muted-foreground">Clases por instructor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instructor Top</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.maxClassesPerInstructor}</div>
            <p className="text-xs text-muted-foreground truncate" title={statsData.instructorWithMostClasses}>
              {statsData.instructorWithMostClasses}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="instructores">Instructores</TabsTrigger>
          <TabsTrigger value="disciplinas">Disciplinas</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clases por Día de la Semana</CardTitle>
              <CardDescription>Distribución de clases según el día de la semana</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classesByDay} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="classes" fill="#8884d8" name="Clases" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instructores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Instructores por Número de Clases</CardTitle>
              <CardDescription>Instructores con mayor cantidad de clases asignadas</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topInstructors} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip />
                  <Bar dataKey="classes" fill="#82ca9d" name="Clases" />
                </BarChart>
              </ResponsiveContainer>
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

