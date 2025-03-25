"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useClasesStore } from "@/store/useClasesStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

export function ClassesOverview() {
  const { clases, isLoading } = useClasesStore()
  const { disciplinas, fetchDisciplinas } = useDisciplinasStore()
  const [stats, setStats] = useState({
    totalClases: 0,
    totalReservaciones: 0,
    ocupacionPromedio: 0,
    clasesCompletas: 0,
  })

  useEffect(() => {
    fetchDisciplinas()
  }, [fetchDisciplinas])

  useEffect(() => {
    if (clases.length > 0) {
      const totalClases = clases.length
      const totalReservaciones = clases.reduce((sum, clase) => sum + clase.reservaciones, 0)
      const totalCapacidad = clases.reduce((sum, clase) => sum + clase.capacidad, 0)
      const ocupacionPromedio = totalCapacidad > 0 ? (totalReservaciones / totalCapacidad) * 100 : 0
      const clasesCompletas = clases.filter((clase) => clase.reservaciones >= clase.capacidad).length

      setStats({
        totalClases,
        totalReservaciones,
        ocupacionPromedio,
        clasesCompletas,
      })
    }
  }, [clases])

  // Agrupar clases por disciplina
  const classesByDiscipline = clases.reduce(
    (acc, clase) => {
      const disciplinaId = clase.disciplinaId
      if (!acc[disciplinaId]) {
        acc[disciplinaId] = {
          count: 0,
          reservations: 0,
          capacity: 0,
          disciplina: disciplinas.find((d) => d.id === disciplinaId)?.nombre || "Desconocida",
        }
      }
      acc[disciplinaId].count += 1
      acc[disciplinaId].reservations += clase.reservaciones
      acc[disciplinaId].capacity += clase.capacidad
      return acc
    },
    {} as Record<number, { count: number; reservations: number; capacity: number; disciplina: string }>,
  )

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Clases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClases}</div>
            <p className="text-sm text-muted-foreground">
              {stats.clasesCompletas} clases completas (
              {Math.round((stats.clasesCompletas / stats.totalClases) * 100) || 0}%)
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Reservaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReservaciones}</div>
            <p className="text-sm text-muted-foreground">En {stats.totalClases} clases</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ocupación Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.ocupacionPromedio)}%</div>
            <Progress value={stats.ocupacionPromedio} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Clases Completas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clasesCompletas}</div>
            <p className="text-sm text-muted-foreground">De {stats.totalClases} clases</p>
          </CardContent>
        </Card>
      </div>

      {/* Resumen por disciplina */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Resumen por Disciplina</CardTitle>
          <CardDescription>Distribución de clases y reservaciones por disciplina.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.values(classesByDiscipline).map((data, index) => {
              const ocupacion = data.capacity > 0 ? (data.reservations / data.capacity) * 100 : 0
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{data.disciplina}</div>
                    <div className="text-sm text-muted-foreground">
                      {data.count} clases | {data.reservations} reservaciones
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={ocupacion} className="h-2 flex-1" />
                    <div className="text-sm font-medium w-12 text-right">{Math.round(ocupacion)}%</div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

