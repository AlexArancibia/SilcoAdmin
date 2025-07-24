"use client"

import React, { useState, useMemo, useEffect } from "react"
import { Search, Download, FileSpreadsheet, ArrowUpDown } from "lucide-react"
import { formatCurrency } from "../../utils/format-utils"
import { exportToExcel } from "../../utils/excel-utils"

// UI Components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useStatsStore } from "@/store/useStatsStore"

interface EstudiosTabProps {
  periodoFilter?: {
    periodoId?: number
    periodoInicio?: number
    periodoFin?: number
  }
  getPeriodoNombre: () => string
  formatFecha: (fecha: Date | string) => string
}

export function EstudiosTab({
  periodoFilter,
  getPeriodoNombre,
  formatFecha,
}: EstudiosTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" } | null>(null)
  
  const {
    venueStats,
    isLoading,
    error,
    fetchVenueStats,
  } = useStatsStore()

  // Load venue stats when component mounts or period changes
  useEffect(() => {
    fetchVenueStats(periodoFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoFilter])

  // Use venue stats from store for basic data
  const estadisticasPorEstudio = useMemo(() => {
    if (!venueStats) return []

    // Combine data from different venue stats arrays
    const estudiosMap = new Map()

    // Add data from masUsados
    venueStats.masUsados.forEach(venue => {
      estudiosMap.set(venue.nombre, {
        nombre: venue.nombre,
        clases: venue.count,
        reservas: venue.reservasTotales,
        ocupacion: venue.ocupacionPromedio,
        pagoTotal: 0, // Will be filled from ingresosPorSalon
        instructores: 0,
        disciplinas: 0,
        porcentajeTotal: 0,
        promedioPorClase: 0,
      })
    })

    // Add revenue data from ingresosPorSalon
    venueStats.ingresosPorSalon.forEach(venue => {
      const existing = estudiosMap.get(venue.nombre) || {
        nombre: venue.nombre,
        clases: venue.clases,
        reservas: venue.reservas,
        ocupacion: 0,
        instructores: 0,
        disciplinas: 0,
        porcentajeTotal: 0,
        promedioPorClase: 0,
      }
      
      existing.pagoTotal = venue.ingresos
      existing.promedioPorClase = venue.clases > 0 ? venue.ingresos / venue.clases : 0
      estudiosMap.set(venue.nombre, existing)
    })

    // Add discipline count from disciplinasPorSalon
    venueStats.disciplinasPorSalon.forEach(venue => {
      const existing = estudiosMap.get(venue.nombre)
      if (existing) {
        existing.disciplinas = venue.disciplinas.length
      }
    })

    return Array.from(estudiosMap.values())
  }, [venueStats])

  // Calcular estadísticas por disciplina para cada estudio
  const disciplinasPorEstudio = useMemo(() => {
    if (!venueStats?.disciplinasPorSalon) return []

    return venueStats.disciplinasPorSalon.map((venue) => ({
      nombre: venue.nombre,
      disciplinas: venue.disciplinas.map(d => ({
        disciplinaId: d.disciplinaId,
        nombre: d.nombre,
        color: d.color,
        clases: d.count,
        porcentaje: venue.disciplinas.reduce((total, disc) => total + disc.count, 0) > 0 
          ? (d.count / venue.disciplinas.reduce((total, disc) => total + disc.count, 0)) * 100 
          : 0,
        // Default values for missing data
        ocupacion: 0,
        pagoTotal: 0,
        instructores: 0,
        promedioPorClase: 0,
      }))
    }))
  }, [venueStats])

  // Filtrar estudios basándose en el término de búsqueda
  const filteredEstadisticas = useMemo(() => {
    return estadisticasPorEstudio.filter((estudio) =>
      estudio.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [estadisticasPorEstudio, searchTerm])

  // Ordenar estudios
  const sortedEstadisticas = useMemo(() => {
    if (!sortConfig) return filteredEstadisticas

    return [...filteredEstadisticas].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof typeof a]
      const bValue = b[sortConfig.key as keyof typeof b]

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "ascending" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      const aNum = Number(aValue) || 0
      const bNum = Number(bValue) || 0

      return sortConfig.direction === "ascending" ? aNum - bNum : bNum - aNum
    })
  }, [filteredEstadisticas, sortConfig])

  const handleSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const handleExport = () => {
    const exportData = sortedEstadisticas.map((estudio) => ({
      Estudio: estudio.nombre,
      Clases: estudio.clases,
      Reservas: estudio.reservas,
      "Ocupación (%)": estudio.ocupacion,
      "Pago Total": estudio.pagoTotal,
      Instructores: estudio.instructores,
      Disciplinas: estudio.disciplinas,
      "% del Total": estudio.porcentajeTotal.toFixed(1),
      "Promedio por Clase": estudio.promedioPorClase.toFixed(2),
    }))

    exportToExcel(exportData, `estudios-${getPeriodoNombre()}-${new Date().toISOString().split("T")[0]}`)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-destructive mb-2">Error al cargar estadísticas de estudios</div>
          <div className="text-sm text-muted-foreground">{error}</div>
          <button 
            onClick={() => fetchVenueStats(periodoFilter)}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con búsqueda y exportación */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar estudio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      {/* Tabla de estadísticas generales por estudio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Estadísticas por Estudio - {getPeriodoNombre()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">
                    <Button variant="ghost" onClick={() => handleSort("nombre")} className="h-auto p-0 font-semibold">
                      Estudio
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button variant="ghost" onClick={() => handleSort("clases")} className="h-auto p-0 font-semibold">
                      Clases
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button variant="ghost" onClick={() => handleSort("reservas")} className="h-auto p-0 font-semibold">
                      Reservas
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button variant="ghost" onClick={() => handleSort("ocupacion")} className="h-auto p-0 font-semibold">
                      Ocupación
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button variant="ghost" onClick={() => handleSort("pagoTotal")} className="h-auto p-0 font-semibold">
                      Ingresos
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("instructores")}
                      className="h-auto p-0 font-semibold"
                    >
                      Instructores
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("disciplinas")}
                      className="h-auto p-0 font-semibold"
                    >
                      Disciplinas
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("porcentajeTotal")}
                      className="h-auto p-0 font-semibold"
                    >
                      % Total
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("promedioPorClase")}
                      className="h-auto p-0 font-semibold"
                    >
                      Promedio/Clase
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEstadisticas.map((estudio) => (
                  <TableRow key={estudio.nombre} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{estudio.nombre}</TableCell>
                    <TableCell className="text-center">{estudio.clases}</TableCell>
                    <TableCell className="text-center">{estudio.reservas}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          estudio.ocupacion >= 80
                            ? "bg-green-100 text-green-800"
                            : estudio.ocupacion >= 60
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {estudio.ocupacion}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-medium">{formatCurrency(estudio.pagoTotal)}</TableCell>
                    <TableCell className="text-center">{estudio.instructores}</TableCell>
                    <TableCell className="text-center">{estudio.disciplinas}</TableCell>
                    <TableCell className="text-center">{estudio.porcentajeTotal.toFixed(1)}%</TableCell>
                    <TableCell className="text-center">{formatCurrency(estudio.promedioPorClase)}</TableCell>
                  </TableRow>
                ))}
                {sortedEstadisticas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "No se encontraron estudios que coincidan con la búsqueda" : "No hay datos disponibles"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detalles por disciplina */}
      <div className="grid gap-6">
        {disciplinasPorEstudio.map((estudio) => (
          <Card key={estudio.nombre}>
            <CardHeader>
              <CardTitle className="text-lg">
                {estudio.nombre} - Disciplinas
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({estudio.disciplinas.length} disciplinas)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Disciplina</TableHead>
                      <TableHead className="text-center">Clases</TableHead>
                      <TableHead className="text-center">% del Estudio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estudio.disciplinas.map((disciplina) => (
                      <TableRow key={`${estudio.nombre}-${disciplina.disciplinaId}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: disciplina.color }}
                            />
                            <span className="font-medium">{disciplina.nombre}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{disciplina.clases}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-medium">
                            {disciplina.porcentaje.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {estudio.disciplinas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                          No hay disciplinas registradas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
