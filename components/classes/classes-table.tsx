"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useClasesStore } from "@/store/useClasesStore"
import type { Clase } from "@/types/schema"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface ClassesTableProps {
  periodoId?: number
  instructorId?: number
  disciplinaId?: number
  semana?: number
  estudio?: string
}

export function ClassesTable({ periodoId, instructorId, disciplinaId, semana, estudio }: ClassesTableProps) {
  const { clases, isLoading, error, fetchClases } = useClasesStore()
  const [filteredClases, setFilteredClases] = useState<Clase[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchClases()
  }, [fetchClases])

  // Filtrar las clases en el cliente en lugar de volver a cargarlas
  useEffect(() => {
    let result = [...clases]

    if (periodoId) {
      result = result.filter(clase => clase.periodoId === periodoId)
    }

    if (instructorId) {
      result = result.filter(clase => clase.instructorId === instructorId)
    }

    if (disciplinaId) {
      result = result.filter(clase => clase.disciplinaId === disciplinaId)
    }

    if (semana) {
      result = result.filter(clase => clase.semana === semana)
    }

    if (estudio) {
      // Coincidencia exacta para el estudio
      result = result.filter(clase => clase.estudio === estudio)
    }

    setFilteredClases(result)
    setCurrentPage(1) // Reset to first page when filters change
  }, [clases, periodoId, instructorId, disciplinaId, semana, estudio])

  const formatDate = (date: Date) => {
    return format(new Date(date), "EEEE d MMMM, yyyy", { locale: es })
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredClases.length / itemsPerPage)
  const paginatedClases = filteredClases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Función para generar páginas visibles con ellipsis cuando sea necesario
  const getVisiblePages = () => {
    const delta = 2; // Número de páginas a mostrar a cada lado de la página actual
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Clases</CardTitle>
          <CardDescription>Cargando clases...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
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
          <CardTitle>Error</CardTitle>
          <CardDescription>No se pudieron cargar las clases</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
          <Button onClick={() => fetchClases()} className="mt-4">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (filteredClases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Clases</CardTitle>
          <CardDescription>No hay clases para mostrar</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No se encontraron clases con los filtros seleccionados.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clases</CardTitle>
        <CardDescription>Mostrando {filteredClases.length} clases</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead>Disciplina</TableHead>
              <TableHead>Estudio</TableHead>
              <TableHead>Salón</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Reservas</TableHead>
              <TableHead>Capacidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedClases.map((clase) => (
              <TableRow key={clase.id}>
                <TableCell className="font-medium">{formatDate(clase.fecha)}</TableCell>
                <TableCell>{clase.instructor?.nombre}</TableCell>
                <TableCell>
                  <Badge
                    style={{
                      backgroundColor: clase.disciplina?.color ? `${clase.disciplina.color}33` : "#88888833", // 20% de opacidad
                      color:   "#555",
                      borderColor: clase.disciplina?.color ? `${clase.disciplina.color}80` : "#88888880", // 50% de opacidad
                      borderWidth: "1px",
                    }}
                  >
                    {clase.disciplina?.nombre}
                  </Badge>
                </TableCell>
                <TableCell>{clase.estudio}</TableCell>
                <TableCell>{clase.salon}</TableCell>
                <TableCell>
                  {clase.ciudad}, {clase.pais}
                </TableCell>
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

        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) setCurrentPage(currentPage - 1)
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {getVisiblePages().map((page, index) => (
                <PaginationItem key={index}>
                  {page === '...' ? (
                    <span className="mx-1 px-2">...</span>
                  ) : (
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage(Number(page))
                      }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  )
}