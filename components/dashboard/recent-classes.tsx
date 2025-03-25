"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useClasesStore } from "@/store/useClasesStore"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays, Clock, MapPin, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface RecentClassesProps {
  periodoId?: number
  limit?: number
}

export function RecentClasses({ periodoId, limit = 5 }: RecentClassesProps) {
  const { clases, isLoading, error, fetchClases } = useClasesStore()
  const [recentClases, setRecentClases] = useState<typeof clases>([])

  useEffect(() => {
    // Cargar clases cuando cambie el periodo seleccionado
    fetchClases({ periodoId })
  }, [fetchClases, periodoId])

  // Actualizar las clases recientes cuando cambien las clases cargadas
  useEffect(() => {
    if (clases.length > 0) {
      // Ordenar por fecha (más reciente primero) y limitar al número especificado
      const sorted = [...clases]
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, limit)

      setRecentClases(sorted)
    } else {
      setRecentClases([])
    }
  }, [clases, limit])

  const formatDate = (date: Date) => {
    return format(new Date(date), "EEEE d MMMM, yyyy", { locale: es })
  }

  const formatTime = (date: Date) => {
    return format(new Date(date), "HH:mm", { locale: es })
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-destructive mb-2">Error al cargar las clases recientes</p>
        <Button variant="outline" size="sm" onClick={() => fetchClases({ periodoId })}>
          Reintentar
        </Button>
      </div>
    )
  }

  if (recentClases.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hay clases recientes para mostrar</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Instructor</TableHead>
            <TableHead>Disciplina</TableHead>
            <TableHead>Estudio</TableHead>
            <TableHead className="text-right">Reservas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentClases.map((clase) => (
            <TableRow key={clase.id}>
              <TableCell>
                <div className="flex flex-col">
                  <div className="flex items-center font-medium">
                    <CalendarDays className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    {formatDate(clase.fecha)}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(clase.fecha)}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Link href={`/instructores/${clase.instructorId}`} className="font-medium hover:underline">
                  {clase.instructor?.nombre || `Instructor ID: ${clase.instructorId}`}
                </Link>
              </TableCell>
              <TableCell>
                <Badge
 
                >
                  {clase.disciplina?.nombre || `Disciplina ID: ${clase.disciplinaId}`}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{clase.estudio}</span>
                  <span className="text-xs text-muted-foreground flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {clase.ciudad}, {clase.pais}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-col items-end">
                  <div className="flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    <span>
                      {clase.reservasTotales} / {clase.lugares}
                    </span>
                  </div>
                  {clase.listasEspera > 0 && (
                    <span className="text-xs text-amber-500 mt-1">+{clase.listasEspera} en espera</span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-end">
        <Button variant="link" size="sm" asChild>
          <Link href="/clases">Ver todas las clases</Link>
        </Button>
      </div>
    </div>
  )
}

