"use client"

import React, { useState, useMemo } from "react"
import { Search, Download, FileSpreadsheet, ArrowUpDown } from "lucide-react"
import { formatCurrency } from "../../utils/format-utils"
import { exportToExcel } from "../../utils/excel-utils"

// UI Components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface EstudiosTabProps {
  filteredClases: any[]
  filteredPagos: any[]
  disciplinas: any[]
  instructores: any[]
  getPeriodoNombre: () => string
  formatFecha: (fecha: Date | string) => string
  isLoadingClases: boolean
  isLoadingPagos: boolean
}

export function EstudiosTab({
  filteredClases,
  filteredPagos,
  disciplinas,
  instructores,
  getPeriodoNombre,
  formatFecha,
  isLoadingClases,
  isLoadingPagos,
}: EstudiosTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" } | null>(null)

  // Obtener lista de estudios únicos
  const estudios = [...new Set(filteredClases.map((c) => c.estudio))].sort()

  // Calcular estadísticas generales por estudio
  const estadisticasPorEstudio = estudios.map((estudio) => {
    const clasesEnEstudio = filteredClases.filter((c) => c.estudio === estudio)
    const instructoresIds = [...new Set(clasesEnEstudio.map((c) => c.instructorId))]
    const disciplinasIds = [...new Set(clasesEnEstudio.map((c) => c.disciplinaId))]

    // Calcular ocupación promedio
    const totalReservas = clasesEnEstudio.reduce((sum, c) => sum + c.reservasTotales, 0)
    const totalCapacidad = clasesEnEstudio.reduce((sum, c) => sum + c.lugares, 0)
    const ocupacionPromedio = totalCapacidad > 0 ? (totalReservas / totalCapacidad) * 100 : 0

    // Calcular pagos para este estudio
    const pagosPorEstudio = filteredPagos
      .filter((p) => instructoresIds.includes(p.instructorId))
      .map((pago) => {
        // Proporción de clases del instructor en este estudio
        const clasesTotalesInstructor = filteredClases.filter((c) => c.instructorId === pago.instructorId).length
        const clasesEnEsteEstudio = clasesEnEstudio.filter((c) => c.instructorId === pago.instructorId).length
        const proporcion = clasesTotalesInstructor > 0 ? clasesEnEsteEstudio / clasesTotalesInstructor : 0

        // Pagos proporcionales
        return {
          pagoFinal: pago.pagoFinal * proporcion,
          retencion: pago.retencion * proporcion,
          pagoTotal: (pago.pagoFinal + pago.retencion) * proporcion,
        }
      })

    const pagoFinalTotal = pagosPorEstudio.reduce((acc, pago) => acc + pago.pagoFinal, 0)
    const retencionTotal = pagosPorEstudio.reduce((acc, pago) => acc + pago.retencion, 0)
    const pagoTotal = pagoFinalTotal + retencionTotal

    return {
      nombre: estudio,
      clases: clasesEnEstudio.length,
      reservas: totalReservas,
      ocupacion: Math.round(ocupacionPromedio),
      pagoTotal: Math.round(pagoTotal),
      instructores: instructoresIds.length,
      disciplinas: disciplinasIds.length,
      porcentajeTotal: filteredClases.length > 0 ? (clasesEnEstudio.length / filteredClases.length) * 100 : 0,
      promedioPorClase: clasesEnEstudio.length > 0 ? pagoTotal / clasesEnEstudio.length : 0,
    }
  })

  // Calcular estadísticas por disciplina para cada estudio
  const disciplinasPorEstudio = estudios.map((estudio) => {
    const clasesEnEstudio = filteredClases.filter((c) => c.estudio === estudio)
    const disciplinasIds = [...new Set(clasesEnEstudio.map((c) => c.disciplinaId))]

    const estadisticasDisciplinas = disciplinasIds.map((disciplinaId) => {
      const disciplina = disciplinas.find((d) => d.id === disciplinaId)
      const clasesEnDisciplina = clasesEnEstudio.filter((c) => c.disciplinaId === disciplinaId)
      const instructoresIds = [...new Set(clasesEnDisciplina.map((c) => c.instructorId))]

      // Calcular ocupación promedio para esta disciplina
      const totalReservas = clasesEnDisciplina.reduce((sum, c) => sum + c.reservasTotales, 0)
      const totalCapacidad = clasesEnDisciplina.reduce((sum, c) => sum + c.lugares, 0)
      const ocupacionPromedio = totalCapacidad > 0 ? (totalReservas / totalCapacidad) * 100 : 0

      // Calcular pagos para esta disciplina en este estudio
      const pagosPorDisciplina = filteredPagos
        .filter((p) => instructoresIds.includes(p.instructorId))
        .map((pago) => {
          // Proporción de clases del instructor en esta disciplina y estudio
          const clasesTotalesInstructor = filteredClases.filter((c) => c.instructorId === pago.instructorId).length
          const clasesEnEstaDisciplina = clasesEnDisciplina.filter((c) => c.instructorId === pago.instructorId).length
          const proporcion = clasesTotalesInstructor > 0 ? clasesEnEstaDisciplina / clasesTotalesInstructor : 0

          // Pagos proporcionales
          return {
            pagoFinal: pago.pagoFinal * proporcion,
            retencion: pago.retencion * proporcion,
            pagoTotal: (pago.pagoFinal + pago.retencion) * proporcion,
          }
        })

      const pagoFinalTotal = pagosPorDisciplina.reduce((acc, pago) => acc + pago.pagoFinal, 0)
      const retencionTotal = pagosPorDisciplina.reduce((acc, pago) => acc + pago.retencion, 0)
      const pagoTotal = pagoFinalTotal + retencionTotal

      return {
        disciplinaId,
        nombre: disciplina?.nombre || "Desconocida",
        color: disciplina?.color || "#6366f1",
        clases: clasesEnDisciplina.length,
        reservas: totalReservas,
        ocupacion: Math.round(ocupacionPromedio),
        pagoTotal: Math.round(pagoTotal),
        instructores: instructoresIds.length,
        porcentajeDelEstudio:
          clasesEnEstudio.length > 0 ? (clasesEnDisciplina.length / clasesEnEstudio.length) * 100 : 0,
        promedioPorClase: clasesEnDisciplina.length > 0 ? pagoTotal / clasesEnDisciplina.length : 0,
      }
    })

    return {
      estudio,
      disciplinas: estadisticasDisciplinas,
    }
  })

  // Función para ordenar datos
  const sortData = (data: any[], key: string, direction: "ascending" | "descending") => {
    return [...data].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === "ascending" ? -1 : 1
      }
      if (a[key] > b[key]) {
        return direction === "ascending" ? 1 : -1
      }
      return 0
    })
  }

  // Aplicar búsqueda y ordenamiento
  const filteredEstudios = useMemo(() => {
    let result = [...estadisticasPorEstudio]

    // Aplicar búsqueda
    if (searchTerm) {
      result = result.filter((estudio) => estudio.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Aplicar ordenamiento
    if (sortConfig) {
      result = sortData(result, sortConfig.key, sortConfig.direction)
    } else {
      // Por defecto ordenar por pago total descendente
      result = sortData(result, "pagoTotal", "descending")
    }

    return result
  }, [estadisticasPorEstudio, searchTerm, sortConfig])

  // Función para manejar el ordenamiento
  const handleSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig && sortConfig.key === key) {
      direction = sortConfig.direction === "ascending" ? "descending" : "ascending"
    } else {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  // Calcular totales generales
  const totalesGenerales = useMemo(() => {
    return {
      clases: filteredClases.length,
      reservas: filteredClases.reduce((sum, c) => sum + c.reservasTotales, 0),
      ocupacion:
        filteredClases.length > 0
          ? Math.round(
              (filteredClases.reduce((sum, c) => sum + c.reservasTotales, 0) /
                filteredClases.reduce((sum, c) => sum + c.lugares, 0)) *
                100,
            )
          : 0,
      pagoTotal: Math.round(filteredPagos.reduce((sum, p) => sum + p.pagoFinal + p.retencion, 0)),
      promedioPorClase:
        filteredClases.length > 0
          ? Math.round(filteredPagos.reduce((sum, p) => sum + p.pagoFinal + p.retencion, 0) / filteredClases.length)
          : 0,
    }
  }, [filteredClases, filteredPagos])

  // Función para preparar datos de estudio para exportación
  const prepareEstudioDataForExport = (estudio: string) => {
    const estadisticasEstudio = estadisticasPorEstudio.find((e) => e.nombre === estudio)
    if (!estadisticasEstudio) return []

    const disciplinasEstudio = disciplinasPorEstudio.find((e) => e.estudio === estudio)?.disciplinas || []

    return disciplinasEstudio.map((disciplina) => ({
      Estudio: estudio,
      Disciplina: disciplina.nombre,
      Clases: disciplina.clases,
      "% del Estudio": `${Math.round(disciplina.porcentajeDelEstudio)}%`,
      Reservas: disciplina.reservas,
      Ocupación: `${disciplina.ocupacion}%`,
      "Promedio por Clase": disciplina.promedioPorClase,
      "Pago Total": disciplina.pagoTotal,
    }))
  }

  // Función para preparar todos los datos para exportación
  const prepareAllDataForExport = () => {
    let allData: any[] = []

    estudios.forEach((estudio) => {
      const estudioData = prepareEstudioDataForExport(estudio)
      allData = [...allData, ...estudioData]
    })

    return allData
  }

  // Función para exportar datos de un estudio específico
  const exportEstudioData = (estudio: string) => {
    const data = prepareEstudioDataForExport(estudio)
    exportToExcel(data, `Estudio_${estudio.replace(/\s+/g, "_")}_${getPeriodoNombre().replace(/\s+/g, "_")}`)
  }

  // Función para exportar todos los datos
  const exportAllData = () => {
    const data = prepareAllDataForExport()
    exportToExcel(data, `Todos_Los_Estudios_${getPeriodoNombre().replace(/\s+/g, "_")}`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Pagos a Instructores por Estudio</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar estudio..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={exportAllData}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar todo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingPagos || isLoadingClases ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : estadisticasPorEstudio.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-6">
              <p className="text-sm text-muted-foreground">No hay datos de estudios para este periodo</p>
            </div>
          ) : (
            <div className="w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" className="p-0 h-auto font-semibold" onClick={() => handleSort("nombre")}>
                        Estudio <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" className="p-0 h-auto font-semibold" onClick={() => handleSort("clases")}>
                        Clases <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-semibold"
                        onClick={() => handleSort("ocupacion")}
                      >
                        Ocupación <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-semibold"
                        onClick={() => handleSort("promedioPorClase")}
                      >
                        Promedio/Clase <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-semibold"
                        onClick={() => handleSort("pagoTotal")}
                      >
                        Pago Total <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">Exportar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEstudios.map((estudio) => (
                    <TableRow key={estudio.nombre} className="hover:bg-muted/15">
                      <TableCell className="font-medium">{estudio.nombre}</TableCell>
                      <TableCell className="text-right">{estudio.clases}</TableCell>
                      <TableCell className="text-right">{estudio.ocupacion}%</TableCell>
                      <TableCell className="text-right">{formatCurrency(estudio.promedioPorClase)}</TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {formatCurrency(estudio.pagoTotal)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => exportEstudioData(estudio.nombre)}
                        >
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Exportar a Excel</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Fila de totales */}
                  <TableRow className="bg-muted/15 font-semibold">
                    <TableCell>TOTALES</TableCell>
                    <TableCell className="text-right">{totalesGenerales.clases}</TableCell>
                    <TableCell className="text-right">{totalesGenerales.ocupacion}%</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalesGenerales.promedioPorClase)}</TableCell>
                    <TableCell className="text-right font-bold text-primary text-lg">
                      {formatCurrency(totalesGenerales.pagoTotal)}
                    </TableCell>
                    <TableCell className="text-center"></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de disciplinas por estudio */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Total de Clases por Estudio y Disciplina</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingPagos || isLoadingClases ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : disciplinasPorEstudio.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-6">
              <p className="text-sm text-muted-foreground">No hay datos de disciplinas para este periodo</p>
            </div>
          ) : (
            <div className="w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudio</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead className="text-right">Clases</TableHead>
                    <TableHead className="text-right">Ocupación</TableHead>
                    <TableHead className="text-right">Promedio/Clase</TableHead>
                    <TableHead className="text-right">Pago Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disciplinasPorEstudio.map((estudioData) => {
                    // Ordenar disciplinas por pago total
                    const sortedDisciplinas = [...estudioData.disciplinas].sort((a, b) => b.pagoTotal - a.pagoTotal)

                    // Calcular totales para este estudio
                    const totalClases = sortedDisciplinas.reduce((sum, d) => sum + d.clases, 0)
                    const totalPago = sortedDisciplinas.reduce((sum, d) => sum + d.pagoTotal, 0)
                    const promedioOcupacion =
                      sortedDisciplinas.length > 0
                        ? Math.round(
                            sortedDisciplinas.reduce((sum, d) => sum + d.ocupacion, 0) / sortedDisciplinas.length,
                          )
                        : 0
                    const promedioPorClase = totalClases > 0 ? totalPago / totalClases : 0

                    return (
                      <React.Fragment key={estudioData.estudio}>
                        {/* Filas de disciplinas */}
                        {sortedDisciplinas.map((disciplina, index) => (
                          <TableRow key={`${estudioData.estudio}-${disciplina.disciplinaId}`}>
                            {index === 0 ? (
                              <TableCell className="font-medium border-r" rowSpan={sortedDisciplinas.length}>
                                {estudioData.estudio}
                              </TableCell>
                            ) : null}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: disciplina.color }}
                                ></div>
                                {disciplina.nombre}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{disciplina.clases}</TableCell>
                            <TableCell className="text-right">{disciplina.ocupacion}%</TableCell>
                            <TableCell className="text-right">{formatCurrency(disciplina.promedioPorClase)}</TableCell>
                            <TableCell className="text-right font-medium text-primary">
                              {formatCurrency(disciplina.pagoTotal)}
                            </TableCell>
                          </TableRow>
                        ))}

                        {/* Fila de totales por estudio */}
                        <TableRow className="bg-muted/15 border-t border-b">
                          <TableCell colSpan={2} className="font-semibold">
                            TOTAL {estudioData.estudio}
                          </TableCell>
                          <TableCell className="text-right font-semibold">{totalClases}</TableCell>
                          <TableCell className="text-right font-semibold">{promedioOcupacion}%</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(promedioPorClase)}</TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            {formatCurrency(totalPago)}
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
