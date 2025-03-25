"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useClasesStore } from "@/store/useClasesStore"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface InstructorClassesProps {
  instructorId: number
  periodoId?: number
}

export function InstructorClasses({ instructorId, periodoId }: InstructorClassesProps) {
  const { clases, isLoading, error, fetchClases } = useClasesStore()

  useEffect(() => {
    fetchClases({ instructorId, periodoId })
  }, [fetchClases, instructorId, periodoId])

  const formatDate = (date: Date) => {
    return format(new Date(date), "EEEE d MMMM, yyyy", { locale: es })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Clases</CardTitle>
          <CardDescription>Cargando clases del instructor...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Clases</CardTitle>
          <CardDescription>Error al cargar las clases</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (clases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Clases</CardTitle>
          <CardDescription>No hay clases para mostrar</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Este instructor no tiene clases asignadas en el período seleccionado.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clases</CardTitle>
        <CardDescription>Mostrando {clases.length} clases del instructor</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Disciplina</TableHead>
              <TableHead>Estudio</TableHead>
              <TableHead>Salón</TableHead>
              <TableHead>Reservas</TableHead>
              <TableHead>Capacidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clases.map((clase) => (
              <TableRow key={clase.id}>
                <TableCell className="font-medium">{formatDate(clase.fecha)}</TableCell>
                <TableCell>
                  <Badge
 
                  >
                    {clase.disciplina?.nombre}
                  </Badge>
                </TableCell>
                <TableCell>{clase.estudio}</TableCell>
                <TableCell>{clase.salon}</TableCell>
                <TableCell>
                  {clase.reservasTotales} / {clase.lugares}
                  {clase.listasEspera > 0 && (
                    <span className="ml-2 text-amber-500">(+{clase.listasEspera} en espera)</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className="bg-primary h-2.5 rounded-full"
                      style={{
                        width: `${Math.min((clase.reservasTotales / clase.lugares) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

