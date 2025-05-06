"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Calendar,
  Info,
  Clock,
  AlertTriangle,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  ArrowUp,
} from "lucide-react"
import type { Clase, Disciplina, PagoInstructor, FormulaDB } from "@/types/schema"
import { esHorarioNoPrime } from "@/utils/config"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Importar la función calcularPago al inicio del archivo
import { calcularPago } from "@/lib/formula-evaluator"
import { useInstructoresStore } from "@/store/useInstructoresStore"

// Actualizar la interfaz ClassesTabProps para recibir formulas en lugar de categoriaInstructor y formula
interface ClassesTabProps {
  clasesInstructor: Clase[]
  pagoSeleccionado: PagoInstructor
  disciplinas: Disciplina[]
  formatCurrency: (amount: number) => string
  formulas: FormulaDB[]
}

// Definir tipos para los filtros
interface FilterState {
  search: string
  semanas: number[]
  estudios: string[]
  disciplinas: number[]
  horario: "todos" | "prime" | "noPrime"
  ocupacionMin: number
  ocupacionMax: number
  conCortesias: boolean
  horaInicio: string
  horaFin: string
}

// Definir tipos para las estadísticas
interface StatsData {
  totalClases: number
  totalReservas: number
  promedioOcupacion: number
  totalListaEspera: number
  totalCortesias: number
  totalMonto: number
  clasesPorEstudio: Record<string, number>
  clasesPorDisciplina: Record<string, number>
  clasesPrime: number
  clasesNoPrime: number
}

// Tipo para el ordenamiento
type SortField = "fecha" | "horario" | "estudio" | "disciplina" | "reservas" | "cortesias" | "monto" | null
type SortDirection = "asc" | "desc"

// Elementos por página para la paginación
const ITEMS_PER_PAGE = 15

// Horas disponibles para el filtro de rango horario
const HORAS_DISPONIBLES = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
]

// Actualizar la desestructuración de props en la función del componente
export function ClassesTab({
  clasesInstructor,
  pagoSeleccionado,
  disciplinas,
  formatCurrency,
  formulas,
}: ClassesTabProps) {
  // Estado para los filtros
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    semanas: [],
    estudios: [],
    disciplinas: [],
    horario: "todos",
    ocupacionMin: 0,
    ocupacionMax: 110, // Cambiado de 200 a 110
    conCortesias: false,
    horaInicio: "06:00",
    horaFin: "23:00",
  })

  // Estado para mostrar/ocultar estadísticas
  const [showStats, setShowStats] = useState(false)

  const { instructores } = useInstructoresStore()
  // Estado para la paginación
  const [currentPage, setCurrentPage] = useState(1)

  // Estado para el ordenamiento
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  // Función para cambiar el ordenamiento
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      // Si ya estamos ordenando por este campo, cambiamos la dirección
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Si es un nuevo campo, lo establecemos como el campo de ordenamiento y dirección ascendente
      setSortField(field)
      setSortDirection("asc")
    }
    // Resetear a la primera página al cambiar el ordenamiento
    setCurrentPage(1)
  }

  // Función para obtener la hora de una fecha
  const obtenerHora = (fecha: any): string => {
    try {
      let hours = 0
      let minutes = 0

      if (fecha instanceof Date) {
        // Get UTC hours and minutes to avoid timezone conversion
        hours = fecha.getUTCHours()
        minutes = fecha.getUTCMinutes()
      } else {
        // If it's a string or another format, create a Date object
        const dateObj = new Date(fecha)
        if (!isNaN(dateObj.getTime())) {
          // Get UTC hours and minutes to avoid timezone conversion
          hours = dateObj.getUTCHours()
          minutes = dateObj.getUTCMinutes()
        }
      }

      // Format as HH:MM
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
    } catch (error) {
      console.error("Error al obtener hora:", error)
      return "00:00"
    }
  }

  // Función para verificar si una clase es en horario no prime
  const esClaseHorarioNoPrime = (clase: Clase): boolean => {
    const esSiclo = disciplinas.find((d) => d.id === clase.disciplinaId)?.nombre === "Síclo"

    // Si no es Síclo, no es horario no prime
    if (!esSiclo) return false

    // Si es Síclo, entonces verificar el horario
    const hora = obtenerHora(clase.fecha)
    const estudio = clase.estudio || ""
    return esHorarioNoPrime(estudio, hora)
  }

  // Función para verificar si una hora está dentro de un rango
  const estaEnRangoHorario = (hora: string, inicio: string, fin: string): boolean => {
    // Convertir a minutos para facilitar la comparación
    const convertirAMinutos = (h: string) => {
      const [horas, minutos] = h.split(":").map(Number)
      return horas * 60 + minutos
    }

    const minHora = convertirAMinutos(hora)
    const minInicio = convertirAMinutos(inicio)
    const minFin = convertirAMinutos(fin)

    // Si el rango cruza la medianoche (fin < inicio), ajustar la lógica
    if (minFin < minInicio) {
      return minHora >= minInicio || minHora <= minFin
    }

    // Caso normal
    return minHora >= minInicio && minHora <= minFin
  }

  // Obtener lista única de estudios
  const estudiosUnicos = useMemo(() => {
    const estudios = new Set<string>()
    clasesInstructor.forEach((clase) => {
      if (clase.estudio) estudios.add(clase.estudio)
    })
    return Array.from(estudios).sort()
  }, [clasesInstructor])

  // Reemplazar la función para obtener fechas únicas por una para obtener semanas únicas
  const semanasUnicas = useMemo(() => {
    const semanas = new Set<number>()
    clasesInstructor.forEach((clase) => {
      if (clase.semana) semanas.add(clase.semana)
    })
    return Array.from(semanas).sort((a, b) => a - b)
  }, [clasesInstructor])

  // Filtrar clases según los criterios seleccionados
  const clasesFiltradas = useMemo(() => {
    return clasesInstructor.filter((clase) => {
      // Filtro por texto de búsqueda
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const estudioMatch = (clase.estudio || "").toLowerCase().includes(searchLower)
        const salonMatch = (clase.salon || "").toLowerCase().includes(searchLower)
        const disciplinaMatch = disciplinas
          .find((d) => d.id === clase.disciplinaId)
          ?.nombre.toLowerCase()
          .includes(searchLower)

        if (!estudioMatch && !salonMatch && !disciplinaMatch) {
          return false
        }
      }

      // Filtro por semana
      if (filters.semanas.length > 0 && !filters.semanas.includes(clase.semana)) {
        return false
      }

      // Filtro por estudios
      if (filters.estudios.length > 0 && !filters.estudios.includes(clase.estudio || "")) {
        return false
      }

      // Filtro por disciplinas
      if (filters.disciplinas.length > 0 && !filters.disciplinas.includes(clase.disciplinaId)) {
        return false
      }

      // Filtro por horario (prime/no prime)
      if (filters.horario === "prime" && esClaseHorarioNoPrime(clase)) {
        return false
      }
      if (filters.horario === "noPrime" && !esClaseHorarioNoPrime(clase)) {
        return false
      }

      // Filtro por rango de horario
      const horaClase = obtenerHora(clase.fecha)
      if (!estaEnRangoHorario(horaClase, filters.horaInicio, filters.horaFin)) {
        return false
      }

      // Filtro por ocupación
      const ocupacionPorcentaje = Math.round((clase.reservasTotales / clase.lugares) * 100)
      if (ocupacionPorcentaje < filters.ocupacionMin || ocupacionPorcentaje > filters.ocupacionMax) {
        return false
      }

      // Filtro por cortesías
      if (filters.conCortesias && clase.cortesias <= 0) {
        return false
      }

      return true
    })
  }, [clasesInstructor, filters, disciplinas])

  // Ordenar clases según el campo y dirección seleccionados
  const clasesOrdenadas = useMemo(() => {
    const clases = [...clasesFiltradas]

    if (!sortField) {
      // Ordenamiento por defecto: fecha, estudio, hora
      return clases.sort((a, b) => {
        // Primero ordenar por fecha
        const fechaA = new Date(a.fecha)
        const fechaB = new Date(b.fecha)
        const comparacionFecha = fechaA.getTime() - fechaB.getTime()

        if (comparacionFecha !== 0) {
          return comparacionFecha
        }

        // Si las fechas son iguales, ordenar por estudio
        const estudioA = a.estudio || ""
        const estudioB = b.estudio || ""
        const comparacionEstudio = estudioA.localeCompare(estudioB)

        // Si los estudios son iguales, ordenar por hora
        if (comparacionEstudio === 0) {
          const horaA = obtenerHora(a.fecha)
          const horaB = obtenerHora(b.fecha)
          return horaA.localeCompare(horaB)
        }

        return comparacionEstudio
      })
    }

    // Ordenamiento según el campo seleccionado
    return clases.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "fecha":
          const fechaA = new Date(a.fecha)
          const fechaB = new Date(b.fecha)
          comparison = fechaA.getTime() - fechaB.getTime()
          break
        case "horario":
          const horaA = obtenerHora(a.fecha)
          const horaB = obtenerHora(b.fecha)
          comparison = horaA.localeCompare(horaB)
          break
        case "estudio":
          const estudioA = a.estudio || ""
          const estudioB = b.estudio || ""
          comparison = estudioA.localeCompare(estudioB)
          break
        case "disciplina":
          const disciplinaA = disciplinas.find((d) => d.id === a.disciplinaId)?.nombre || ""
          const disciplinaB = disciplinas.find((d) => d.id === b.disciplinaId)?.nombre || ""
          comparison = disciplinaA.localeCompare(disciplinaB)
          break
        case "reservas":
          const ocupacionA = Math.round((a.reservasTotales / a.lugares) * 100)
          const ocupacionB = Math.round((b.reservasTotales / b.lugares) * 100)
          comparison = ocupacionA - ocupacionB
          break
        case "cortesias":
          comparison = a.cortesias - b.cortesias
          break
        case "monto":
          const montoA = pagoSeleccionado.detalles?.clases?.find((d: any) => d.claseId === a.id)?.montoCalculado || 0
          const montoB = pagoSeleccionado.detalles?.clases?.find((d: any) => d.claseId === b.id)?.montoCalculado || 0
          comparison = montoA - montoB
          break
      }

      // Invertir la comparación si la dirección es descendente
      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [clasesFiltradas, sortField, sortDirection, disciplinas, pagoSeleccionado.detalles?.clases])

  // Calcular estadísticas de las clases filtradas
  const estadisticas = useMemo((): StatsData => {
    const stats: StatsData = {
      totalClases: clasesOrdenadas.length,
      totalReservas: 0,
      promedioOcupacion: 0,
      totalListaEspera: 0,
      totalCortesias: 0,
      totalMonto: 0,
      clasesPorEstudio: {},
      clasesPorDisciplina: {},
      clasesPrime: 0,
      clasesNoPrime: 0,
    }

    let sumaOcupacion = 0

    clasesOrdenadas.forEach((clase) => {
      // Contar reservas
      stats.totalReservas += clase.reservasTotales

      // Calcular ocupación
      const ocupacionPorcentaje = Math.round((clase.reservasTotales / clase.lugares) * 100)
      sumaOcupacion += ocupacionPorcentaje

      // Contar listas de espera y cortesías
      stats.totalListaEspera += clase.listasEspera
      stats.totalCortesias += clase.cortesias

      // Sumar montos
      const detalleClase = pagoSeleccionado.detalles?.clases?.find((d: any) => d.claseId === clase.id)
      if (detalleClase && detalleClase.montoCalculado) {
        stats.totalMonto += detalleClase.montoCalculado
      }

      // Contar por estudio
      const estudio = clase.estudio || "Sin estudio"
      stats.clasesPorEstudio[estudio] = (stats.clasesPorEstudio[estudio] || 0) + 1

      // Contar por disciplina
      const disciplinaId = clase.disciplinaId
      stats.clasesPorDisciplina[disciplinaId] = (stats.clasesPorDisciplina[disciplinaId] || 0) + 1

      // Contar prime vs no prime
      if (esClaseHorarioNoPrime(clase)) {
        stats.clasesNoPrime++
      } else {
        stats.clasesPrime++
      }
    })

    // Calcular promedio de ocupación
    stats.promedioOcupacion = clasesOrdenadas.length > 0 ? Math.round(sumaOcupacion / clasesOrdenadas.length) : 0

    return stats
  }, [clasesOrdenadas, pagoSeleccionado.detalles?.clases])

  // Actualizar la función para limpiar filtros
  const limpiarFiltros = () => {
    setFilters({
      search: "",
      semanas: [],
      estudios: [],
      disciplinas: [],
      horario: "todos",
      ocupacionMin: 0,
      ocupacionMax: 110, // Cambiado de 200% a 110%
      conCortesias: false,
      horaInicio: "06:00",
      horaFin: "23:00",
    })
    setCurrentPage(1) // Resetear a la primera página al limpiar filtros
  }

  // Actualizar la función para contar filtros activos
  const contarFiltrosActivos = (): number => {
    let count = 0
    if (filters.search) count++
    if (filters.semanas.length > 0) count++
    if (filters.estudios.length > 0) count++
    if (filters.disciplinas.length > 0) count++
    if (filters.horario !== "todos") count++
    if (filters.ocupacionMin > 0 || filters.ocupacionMax < 110) count++ // Cambiado de 200% a 110%
    if (filters.conCortesias) count++
    if (filters.horaInicio !== "06:00" || filters.horaFin !== "23:00") count++
    return count
  }

  const filtrosActivos = contarFiltrosActivos()

  // Calcular el total de páginas
  const totalPages = Math.ceil(clasesOrdenadas.length / ITEMS_PER_PAGE)

  // Asegurarse de que la página actual es válida
  const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1))
  if (validCurrentPage !== currentPage) {
    setCurrentPage(validCurrentPage)
  }

  // Obtener las clases para la página actual
  const clasesEnPaginaActual = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE
    return clasesOrdenadas.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [clasesOrdenadas, validCurrentPage])

  // Funciones para la navegación de páginas
  const irAPaginaAnterior = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const irAPaginaSiguiente = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const irAPagina = (pagina: number) => {
    if (pagina >= 1 && pagina <= totalPages) {
      setCurrentPage(pagina)
    }
  }

  // Renderizar indicador de ordenamiento
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null

    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 inline" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 inline" />
    )
  }

  // Podemos eliminarla o reemplazarla con una versión más sutil
  // Reemplazar la función getReservasColor:
  const getReservasColor = () => {
    return ""
  }

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="relative w-full md:w-64">
          <Input
            placeholder="Buscar por estudio, salón..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-9"
          />
          <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Popover de filtros */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-1.5">
                <Filter className="h-4 w-4" />
                Filtros
                {filtrosActivos > 0 && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {filtrosActivos}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[600px] p-0" align="start">
              <div className="border-b p-4 bg-muted/30">
                <h4 className="font-medium leading-none">Filtros avanzados</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Configura los filtros para encontrar clases específicas
                </p>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Primera columna */}
                  <div className="space-y-4">
                    {/* Filtro por semana */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Semanas</Label>
                      <ScrollArea className="h-30 rounded-md border">
                        <div className="p-2 space-y-1">
                          {semanasUnicas.map((semana) => (
                            <div key={semana} className="flex items-center space-x-2">
                              <Checkbox
                                id={`semana-${semana}`}
                                checked={filters.semanas.includes(semana)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFilters({
                                      ...filters,
                                      semanas: [...filters.semanas, semana],
                                    })
                                  } else {
                                    setFilters({
                                      ...filters,
                                      semanas: filters.semanas.filter((s) => s !== semana),
                                    })
                                  }
                                  setCurrentPage(1) // Resetear a la primera página al cambiar filtros
                                }}
                              />
                              <Label htmlFor={`semana-${semana}`} className="text-sm cursor-pointer">
                                Semana {semana}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Filtro por estudio */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Estudios</Label>
                      <ScrollArea className="h-30 rounded-md border">
                        <div className="p-2 space-y-1">
                          {estudiosUnicos.map((estudio) => (
                            <div key={estudio} className="flex items-center space-x-2">
                              <Checkbox
                                id={`estudio-${estudio}`}
                                checked={filters.estudios.includes(estudio)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFilters({
                                      ...filters,
                                      estudios: [...filters.estudios, estudio],
                                    })
                                  } else {
                                    setFilters({
                                      ...filters,
                                      estudios: filters.estudios.filter((e) => e !== estudio),
                                    })
                                  }
                                  setCurrentPage(1) // Resetear a la primera página al cambiar filtros
                                }}
                              />
                              <Label htmlFor={`estudio-${estudio}`} className="text-sm cursor-pointer">
                                {estudio}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>

                  {/* Segunda columna */}
                  <div className="space-y-4">
                    {/* Filtro por disciplina */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Disciplinas</Label>
                      <ScrollArea className="h-30 rounded-md border">
                        <div className="p-2 space-y-1">
                          {disciplinas.map((disciplina) => (
                            <div key={disciplina.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`disciplina-${disciplina.id}`}
                                checked={filters.disciplinas.includes(disciplina.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFilters({
                                      ...filters,
                                      disciplinas: [...filters.disciplinas, disciplina.id],
                                    })
                                  } else {
                                    setFilters({
                                      ...filters,
                                      disciplinas: filters.disciplinas.filter((id) => id !== disciplina.id),
                                    })
                                  }
                                  setCurrentPage(1) // Resetear a la primera página al cambiar filtros
                                }}
                              />
                              <Label
                                htmlFor={`disciplina-${disciplina.id}`}
                                className="text-sm cursor-pointer flex items-center"
                              >
                                <span
                                  className="inline-block w-3 h-3 rounded-full mr-1.5"
                                  style={{ backgroundColor: disciplina.color || "#888" }}
                                ></span>
                                {disciplina.nombre}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Filtro por horario */}
                    <div className="space-y-2">
                      <Label htmlFor="horario" className="text-sm font-medium">
                        Tipo de Horario
                      </Label>
                      <Select
                        value={filters.horario}
                        onValueChange={(value: "todos" | "prime" | "noPrime") => {
                          setFilters({ ...filters, horario: value })
                          setCurrentPage(1) // Resetear a la primera página al cambiar filtros
                        }}
                      >
                        <SelectTrigger id="horario">
                          <SelectValue placeholder="Seleccionar horario" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos los horarios</SelectItem>
                          <SelectItem value="prime">Solo Prime</SelectItem>
                          <SelectItem value="noPrime">Solo No Prime</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Filtros adicionales en una fila */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Filtro por ocupación */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-sm font-medium">Ocupación</Label>
                        <span className="text-sm text-muted-foreground">
                          {filters.ocupacionMin}% - {filters.ocupacionMax}%
                        </span>
                      </div>
                      <Slider
                        defaultValue={[filters.ocupacionMin, filters.ocupacionMax]}
                        min={0}
                        max={110} // Cambiado de 200 a 110
                        step={5}
                        onValueChange={(values) => {
                          setFilters({
                            ...filters,
                            ocupacionMin: values[0],
                            ocupacionMax: values[1],
                          })
                          setCurrentPage(1) // Resetear a la primera página al cambiar filtros
                        }}
                        className="py-4"
                      />
                    </div>

                    {/* Filtro por rango de horario */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Rango de Horario</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="horaInicio" className="text-xs text-muted-foreground">
                            Desde
                          </Label>
                          <Select
                            value={filters.horaInicio}
                            onValueChange={(value) => {
                              setFilters({ ...filters, horaInicio: value })
                              setCurrentPage(1)
                            }}
                          >
                            <SelectTrigger id="horaInicio">
                              <SelectValue placeholder="Hora inicio" />
                            </SelectTrigger>
                            <SelectContent>
                              {HORAS_DISPONIBLES.map((hora) => (
                                <SelectItem key={`inicio-${hora}`} value={hora}>
                                  {hora}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="horaFin" className="text-xs text-muted-foreground">
                            Hasta
                          </Label>
                          <Select
                            value={filters.horaFin}
                            onValueChange={(value) => {
                              setFilters({ ...filters, horaFin: value })
                              setCurrentPage(1)
                            }}
                          >
                            <SelectTrigger id="horaFin">
                              <SelectValue placeholder="Hora fin" />
                            </SelectTrigger>
                            <SelectContent>
                              {HORAS_DISPONIBLES.map((hora) => (
                                <SelectItem key={`fin-${hora}`} value={hora}>
                                  {hora}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Checkbox para cortesías */}
                  <div className="mt-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="conCortesias"
                        checked={filters.conCortesias}
                        onCheckedChange={(checked) => {
                          setFilters({ ...filters, conCortesias: !!checked })
                          setCurrentPage(1) // Resetear a la primera página al cambiar filtros
                        }}
                      />
                      <Label htmlFor="conCortesias" className="text-sm cursor-pointer">
                        Con cortesías
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between p-4 border-t bg-muted/30">
                <Button variant="outline" size="sm" onClick={limpiarFiltros}>
                  Limpiar filtros
                </Button>
                <Button variant="default" size="sm" onClick={() => document.body.click()}>
                  Aplicar
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Botón para mostrar/ocultar estadísticas */}
          {/* <Button
            variant={showStats ? "default" : "outline"}
            onClick={() => setShowStats(!showStats)}
            className="gap-1.5"
          >
            <BarChart2 className="h-4 w-4" />
            Estadísticas
          </Button> */}
        </div>
      </div>

      {/* Indicadores de filtros activos */}
      {filtrosActivos > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium mr-2">Filtros activos:</span>

          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Búsqueda: {filters.search}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => {
                  setFilters({ ...filters, search: "" })
                  setCurrentPage(1)
                }}
              />
            </Badge>
          )}

          {filters.semanas.length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Semanas: {filters.semanas.join(", ")}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => {
                  setFilters({ ...filters, semanas: [] })
                  setCurrentPage(1)
                }}
              />
            </Badge>
          )}

          {filters.estudios.length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Estudios: {filters.estudios.length}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => {
                  setFilters({ ...filters, estudios: [] })
                  setCurrentPage(1)
                }}
              />
            </Badge>
          )}

          {filters.disciplinas.length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Disciplinas: {filters.disciplinas.length}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => {
                  setFilters({ ...filters, disciplinas: [] })
                  setCurrentPage(1)
                }}
              />
            </Badge>
          )}

          {filters.horario !== "todos" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Horario: {filters.horario === "prime" ? "Prime" : "No Prime"}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => {
                  setFilters({ ...filters, horario: "todos" })
                  setCurrentPage(1)
                }}
              />
            </Badge>
          )}

          {(filters.ocupacionMin > 0 || filters.ocupacionMax < 110) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Ocupación: {filters.ocupacionMin}% - {filters.ocupacionMax}%
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => {
                  setFilters({ ...filters, ocupacionMin: 0, ocupacionMax: 110 })
                  setCurrentPage(1)
                }}
              />
            </Badge>
          )}

          {filters.conCortesias && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Con cortesías
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => {
                  setFilters({ ...filters, conCortesias: false })
                  setCurrentPage(1)
                }}
              />
            </Badge>
          )}

          {(filters.horaInicio !== "06:00" || filters.horaFin !== "23:00") && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Horario: {filters.horaInicio} - {filters.horaFin}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => {
                  setFilters({ ...filters, horaInicio: "06:00", horaFin: "23:00" })
                  setCurrentPage(1)
                }}
              />
            </Badge>
          )}

          <Button variant="ghost" size="sm" onClick={limpiarFiltros} className="h-7 px-2 text-xs">
            Limpiar todos
          </Button>
        </div>
      )}

      {/* Contador de clases y resultados */}
      <div className="text-sm text-muted-foreground">
        Mostrando {clasesEnPaginaActual.length} de {clasesOrdenadas.length} clases
        {clasesOrdenadas.length !== clasesInstructor.length && <span> (de un total de {clasesInstructor.length})</span>}
      </div>

      {/* Panel de estadísticas */}
      {/* {showStats && (
        <Card className="bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BarChart2 className="h-5 w-5 mr-2" />
              Estadísticas de clases
            </CardTitle>
            <CardDescription>Resumen de las {clasesOrdenadas.length} clases filtradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Información general</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Total clases:</div>
                  <div className="font-medium">{estadisticas.totalClases}</div>

                  <div>Total reservas:</div>
                  <div className="font-medium">{estadisticas.totalReservas}</div>

                  <div>Ocupación promedio:</div>
                  <div className="font-medium">{estadisticas.promedioOcupacion}%</div>

                  <div>Total lista espera:</div>
                  <div className="font-medium">{estadisticas.totalListaEspera}</div>

                  <div>Total cortesías:</div>
                  <div className="font-medium">{estadisticas.totalCortesias}</div>

                  <div>Monto total:</div>
                  <div className="font-medium">{formatCurrency(estadisticas.totalMonto)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Distribución por horario</h4>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-muted/70 rounded-full h-4 overflow-hidden">
                    {estadisticas.totalClases > 0 && (
                      <>
                        <div
                          className="h-full bg-green-500/90"
                          style={{
                            width: `${(estadisticas.clasesPrime / estadisticas.totalClases) * 100}%`,
                            float: "left",
                          }}
                        />
                        <div
                          className="h-full bg-amber-500/90"
                          style={{
                            width: `${(estadisticas.clasesNoPrime / estadisticas.totalClases) * 100}%`,
                            float: "left",
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-green-500/90 mr-1.5"></span>
                    Prime:
                  </div>
                  <div className="font-medium">
                    {estadisticas.clasesPrime} (
                    {estadisticas.totalClases > 0
                      ? Math.round((estadisticas.clasesPrime / estadisticas.totalClases) * 100)
                      : 0}
                    %)
                  </div>

                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-amber-500/90 mr-1.5"></span>
                    No Prime:
                  </div>
                  <div className="font-medium">
                    {estadisticas.clasesNoPrime} (
                    {estadisticas.totalClases > 0
                      ? Math.round((estadisticas.clasesNoPrime / estadisticas.totalClases) * 100)
                      : 0}
                    %)
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Distribución por disciplina</h4>
                <ScrollArea className="h-30">
                  <div className="space-y-1.5">
                    {Object.entries(estadisticas.clasesPorDisciplina).map(([disciplinaId, count]) => {
                      const disciplina = disciplinas.find((d) => d.id === Number(disciplinaId))
                      return (
                        <div key={disciplinaId} className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <span className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: "#888" }}></span>
                            {disciplina?.nombre || `Disciplina ${disciplinaId}`}:
                          </div>
                          <div className="font-medium">{count}</div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>
      )} */}

      {clasesOrdenadas.length === 0 ? (
        <div className="text-center py-8 bg-muted/10 rounded-lg border">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">No hay clases que coincidan con los filtros</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Intenta ajustar los criterios de filtrado para ver resultados.
          </p>
          {filtrosActivos > 0 && (
            <Button variant="outline" className="mt-4" onClick={limpiarFiltros}>
              Limpiar todos los filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-accent/5 border-b border-border/40">
                <TableRow>
                  <TableHead
                    className="text-accent font-medium whitespace-nowrap cursor-pointer w-[120px]"
                    onClick={() => toggleSort("fecha")}
                  >
                    Fecha {renderSortIndicator("fecha")}
                  </TableHead>
                  <TableHead
                    className="text-accent font-medium whitespace-nowrap cursor-pointer w-[140px]"
                    onClick={() => toggleSort("horario")}
                  >
                    Horario {renderSortIndicator("horario")}
                  </TableHead>
                  <TableHead
                    className="text-accent font-medium whitespace-nowrap cursor-pointer w-[160px]"
                    onClick={() => toggleSort("estudio")}
                  >
                    Estudio {renderSortIndicator("estudio")}
                  </TableHead>
                  <TableHead
                    className="text-accent font-medium whitespace-nowrap cursor-pointer w-[150px]"
                    onClick={() => toggleSort("disciplina")}
                  >
                    Disciplina {renderSortIndicator("disciplina")}
                  </TableHead>
                  <TableHead
                    className="text-accent font-medium whitespace-nowrap cursor-pointer w-[100px]"
                    onClick={() => toggleSort("reservas")}
                  >
                    Reservas {renderSortIndicator("reservas")}
                  </TableHead>
                  <TableHead className="text-accent font-medium whitespace-nowrap cursor-pointer w-[100px]">
                    Lugares
                  </TableHead>

                  <TableHead
                    className="text-accent font-medium whitespace-nowrap cursor-pointer w-[120px]"
                    onClick={() => toggleSort("monto")}
                  >
                    Monto {renderSortIndicator("monto")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clasesEnPaginaActual.map((clase) => {
                  // Find class detail
                  const detalleClase = pagoSeleccionado.detalles?.clases?.find((d: any) => d.claseId === clase.id)

                  // Get the discipline
                  const disciplina = disciplinas.find((d) => d.id === clase.disciplinaId)

                  // Check if reservations are equal to or greater than places
                  const reservasCompletas = clase.reservasTotales >= clase.lugares

                  // Determine color based on reservations vs places
                  const getReservasColor = () => {
                    if (reservasCompletas) {
                      return "text-emerald-600 font-medium"
                    }
                    return ""
                  }

                  // Check if class is in non-prime hour
                  const esNoPrime = esClaseHorarioNoPrime(clase)
                  const hora = obtenerHora(clase.fecha)

                  return (
                    <TableRow key={clase.id} className="hover:bg-muted/5 transition-colors border-b border-border/30">
                      <TableCell className="font-medium whitespace-nowrap text-foreground">
                        {new Date(clase.fecha).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{hora}</span>
                          {esNoPrime && (
                            <Badge
                              variant="outline"
                              className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/70 ml-1 text-xs"
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              No Prime
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-foreground">{clase.estudio}</span>
                          <span className="text-xs text-muted-foreground">{clase.salon}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-primary/20 text-slate-800 dark:text-accent border-primary/30 font-medium"
                          style={{
                            backgroundColor: disciplina?.color ? `${disciplina.color}40` : undefined,
                            borderColor: disciplina?.color ? `${disciplina.color}50` : undefined,
                          }}
                        >
                          {disciplina?.nombre || `Disciplina ${clase.disciplinaId}`}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-left">
                        <span className={clase.reservasTotales >= clase.lugares ? "text-emerald-600 font-medium pl-4" : "pl-4"}>
                          {clase.reservasTotales}
                        </span>
                      </TableCell>
                      <TableCell className="text-left pl-8">{clase.lugares}</TableCell>

                      {/* Actualizar la celda del monto en la tabla para usar la fórmula correcta según la disciplina */}
                      <TableCell className="font-medium text-foreground">
                        {detalleClase ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1">
                                <span>{formatCurrency(detalleClase.montoCalculado)}</span>
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent className="w-64 max-w-sm">
                                {(() => {
                                  try {
                                    // Encontrar la fórmula correcta para esta disciplina
                                    const formulaParaDisciplina = formulas.find(
                                      (f) => f.disciplinaId === clase.disciplinaId,
                                    )

                                    if (!formulaParaDisciplina) {
                                      throw new Error("No se encontró fórmula para esta disciplina")
                                    }

                                    // Obtener la categoría del instructor para esta disciplina desde el pago seleccionado
                                    const categoriaInstructor =
                                      instructores
                                        .find((i) => i.id === pagoSeleccionado.instructorId)
                                        ?.categorias?.find((c) => c.disciplinaId === clase.disciplinaId)?.categoria ||
                                      "INSTRUCTOR"

                                    // Usar la función calcularPago con la fórmula correcta
                                    const resultadoCalculo = calcularPago(
                                      clase,
                                      categoriaInstructor,
                                      formulaParaDisciplina,
                                    )
                                    const montoCalculado = resultadoCalculo.montoPago
                                    const detalleCalculo = {
                                      mensaje: resultadoCalculo.detalleCalculo,
                                      pasos: [
                                        {
                                          descripcion: `Tarifa aplicada: ${resultadoCalculo.tarifaAplicada} (${resultadoCalculo.tipoTarifa})`,
                                        },
                                        {
                                          descripcion: `Reservas: ${clase.reservasTotales} de ${clase.lugares} lugares`,
                                        },
                                        { descripcion: `Monto calculado: ${resultadoCalculo.montoPago.toFixed(2)}` },
                                      ],
                                    }

                                    // Agregar información sobre mínimo/máximo si aplica
                                    if (resultadoCalculo.minimoAplicado) {
                                      detalleCalculo.pasos.push({
                                        descripcion: `Se aplicó el mínimo garantizado`,
                                      })
                                    }

                                    if (resultadoCalculo.maximoAplicado) {
                                      detalleCalculo.pasos.push({
                                        descripcion: `Se aplicó el máximo permitido`,
                                      })
                                    }

                                    // Agregar información sobre bono si existe
                                    if (resultadoCalculo.bonoAplicado) {
                                      detalleCalculo.pasos.push({
                                        descripcion: `Bono aplicable: ${resultadoCalculo.bonoAplicado.toFixed(2)} (no incluido en el total)`,
                                      })
                                    }

                                    return (
                                      <div className="space-y-1">
                                        <p className="font-semibold">Detalle de cálculo:</p>
                                        {detalleCalculo.mensaje && (
                                          <p className="text-xs text-muted-foreground">{detalleCalculo.mensaje}</p>
                                        )}
                                        <ul className="text-xs space-y-1">
                                          {detalleCalculo.pasos.map((paso, idx) => (
                                            <li key={idx} className="flex items-start gap-1">
                                              <span className="text-primary">•</span>
                                              <span>{paso.descripcion}</span>
                                            </li>
                                          ))}
                                        </ul>
                                        {resultadoCalculo.bonoAplicado && (
                                          <div className="mt-2 pt-2 border-t text-xs">
                                            <span className="font-medium text-green-600">Bono potencial: </span>
                                            {formatCurrency(resultadoCalculo.bonoAplicado)}
                                            <p className="text-muted-foreground mt-1">
                                              El bono se aplica al final del periodo según cumplimiento de requisitos
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  } catch (error) {
                                    console.error(`Error al calcular pago para clase ${clase.id}:`, error)
                                    return (
                                      <p className="text-red-500">
                                        Error: {error instanceof Error ? error.message : "Error desconocido"}
                                      </p>
                                    )
                                  }
                                })()}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span>-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={irAPaginaAnterior}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Mostrar números de página */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Lógica para mostrar las páginas cercanas a la actual
                    let pageNum = i + 1

                    if (totalPages > 5) {
                      if (currentPage <= 3) {
                        // Estamos cerca del inicio
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        // Estamos cerca del final
                        pageNum = totalPages - 4 + i
                      } else {
                        // Estamos en el medio
                        pageNum = currentPage - 2 + i
                      }
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => irAPagina(pageNum)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={irAPaginaSiguiente}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
