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
  Check,
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
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

import { calcularPago } from "@/lib/formula-evaluator"
import { useInstructoresStore } from "@/store/useInstructoresStore"

interface ClassesTabProps {
  clasesInstructor: Clase[]
  pagoSeleccionado: PagoInstructor
  disciplinas: Disciplina[]
  formatCurrency: (amount: number) => string
  formulas: FormulaDB[]
}

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

type SortField = "fecha" | "horario" | "estudio" | "disciplina" | "reservas" | "cortesias" | "monto" | null
type SortDirection = "asc" | "desc"

const ITEMS_PER_PAGE_MOBILE = 10
const ITEMS_PER_PAGE_DESKTOP = 15

const HORAS_DISPONIBLES = [
  "00:00",
  "01:00",
  "02:00",
  "03:00",
  "04:00",
  "05:00",
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

export function ClassesTab({
  clasesInstructor,
  pagoSeleccionado,
  disciplinas,
  formatCurrency,
  formulas,
}: ClassesTabProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    semanas: [],
    estudios: [],
    disciplinas: [],
    horario: "todos",
    ocupacionMin: 0,
    ocupacionMax: 120,
    conCortesias: false,
    horaInicio: "00:00",
    horaFin: "23:59",
  })

  const [showStats, setShowStats] = useState(false)
  const { instructores } = useInstructoresStore()
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
    setCurrentPage(1)
  }

  const obtenerHora = (fecha: any): string => {
    try {
      const dateObj = new Date(fecha)
      if (isNaN(dateObj.getTime())) {
        throw new Error('Fecha inválida')
      }
      return dateObj.toLocaleTimeString('es-PE', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false, 
        timeZone: 'America/Lima' 
      })
    } catch (error) {
      console.error("Error al obtener hora:", error)
      return "00:00"
    }
  }

  const esClaseHorarioNoPrime = (clase: Clase): boolean => {
    const esSiclo = disciplinas.find((d) => d.id === clase.disciplinaId)?.nombre === "Síclo"
    if (!esSiclo) return false

    const hora = obtenerHora(clase.fecha)
    const estudio = clase.estudio || ""
    return esHorarioNoPrime(estudio, hora)
  }

  const estaEnRangoHorario = (hora: string, inicio: string, fin: string): boolean => {
    const convertirAMinutos = (h: string) => {
      const [horas, minutos] = h.split(":").map(Number)
      return horas * 60 + minutos
    }

    const minHora = convertirAMinutos(hora)
    const minInicio = convertirAMinutos(inicio)
    const minFin = convertirAMinutos(fin)

    if (minFin < minInicio) {
      return minHora >= minInicio || minHora <= minFin
    }

    return minHora >= minInicio && minHora <= minFin
  }

  const estudiosUnicos = useMemo(() => {
    const estudios = new Set<string>()
    clasesInstructor.forEach((clase) => {
      if (clase.estudio) estudios.add(clase.estudio)
    })
    return Array.from(estudios).sort()
  }, [clasesInstructor])

  const semanasUnicas = useMemo(() => {
    const semanas = new Set<number>()
    clasesInstructor.forEach((clase) => {
      if (clase.semana) semanas.add(clase.semana)
    })
    return Array.from(semanas).sort((a, b) => a - b)
  }, [clasesInstructor])

  const clasesFiltradas = useMemo(() => {
    return clasesInstructor.filter((clase) => {
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

      if (filters.semanas.length > 0 && !filters.semanas.includes(clase.semana)) {
        return false
      }

      if (filters.estudios.length > 0 && !filters.estudios.includes(clase.estudio || "")) {
        return false
      }

      if (filters.disciplinas.length > 0 && !filters.disciplinas.includes(clase.disciplinaId)) {
        return false
      }

      if (filters.horario === "prime" && esClaseHorarioNoPrime(clase)) {
        return false
      }
      if (filters.horario === "noPrime" && !esClaseHorarioNoPrime(clase)) {
        return false
      }

      const horaClase = obtenerHora(clase.fecha)
      if (!estaEnRangoHorario(horaClase, filters.horaInicio, filters.horaFin)) {
        return false
      }

      const ocupacionPorcentaje = Math.round((clase.reservasTotales / clase.lugares) * 100)
      if (ocupacionPorcentaje < filters.ocupacionMin || ocupacionPorcentaje > filters.ocupacionMax) {
        return false
      }

      if (filters.conCortesias && clase.cortesias <= 0) {
        return false
      }

      return true
    })
  }, [clasesInstructor, filters, disciplinas])

  const clasesOrdenadas = useMemo(() => {
    const clases = [...clasesFiltradas]

    if (!sortField) {
      return clases.sort((a, b) => {
        const fechaA = new Date(a.fecha)
        const fechaB = new Date(b.fecha)
        const comparacionFecha = fechaA.getTime() - fechaB.getTime()

        if (comparacionFecha !== 0) {
          return comparacionFecha
        }

        const estudioA = a.estudio || ""
        const estudioB = b.estudio || ""
        const comparacionEstudio = estudioA.localeCompare(estudioB)

        if (comparacionEstudio === 0) {
          const horaA = obtenerHora(a.fecha)
          const horaB = obtenerHora(b.fecha)
          return horaA.localeCompare(horaB)
        }

        return comparacionEstudio
      })
    }

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

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [clasesFiltradas, sortField, sortDirection, disciplinas, pagoSeleccionado.detalles?.clases])

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
      stats.totalReservas += clase.reservasTotales

      const ocupacionPorcentaje = Math.round((clase.reservasTotales / clase.lugares) * 100)
      sumaOcupacion += ocupacionPorcentaje

      stats.totalListaEspera += clase.listasEspera
      stats.totalCortesias += clase.cortesias

      const detalleClase = pagoSeleccionado.detalles?.clases?.find((d: any) => d.claseId === clase.id)
      if (detalleClase && detalleClase.montoCalculado) {
        stats.totalMonto += detalleClase.montoCalculado
      }

      const estudio = clase.estudio || "Sin estudio"
      stats.clasesPorEstudio[estudio] = (stats.clasesPorEstudio[estudio] || 0) + 1

      const disciplinaId = clase.disciplinaId
      stats.clasesPorDisciplina[disciplinaId] = (stats.clasesPorDisciplina[disciplinaId] || 0) + 1

      if (esClaseHorarioNoPrime(clase)) {
        stats.clasesNoPrime++
      } else {
        stats.clasesPrime++
      }
    })

    stats.promedioOcupacion = clasesOrdenadas.length > 0 ? Math.round(sumaOcupacion / clasesOrdenadas.length) : 0

    return stats
  }, [clasesOrdenadas, pagoSeleccionado.detalles?.clases])

  const limpiarFiltros = () => {
    setFilters({
      search: "",
      semanas: [],
      estudios: [],
      disciplinas: [],
      horario: "todos",
      ocupacionMin: 0,
      ocupacionMax: 120,
      conCortesias: false,
      horaInicio: "00:00",
      horaFin: "23:59",
    })
    setCurrentPage(1)
  }

  const contarFiltrosActivos = (): number => {
    let count = 0
    if (filters.search) count++
    if (filters.semanas.length > 0) count++
    if (filters.estudios.length > 0) count++
    if (filters.disciplinas.length > 0) count++
    if (filters.horario !== "todos") count++
    if (filters.ocupacionMin > 0 || filters.ocupacionMax < 120) count++
    if (filters.conCortesias) count++
    if (filters.horaInicio !== "00:00" || filters.horaFin !== "23:59") count++
    return count
  }

  const filtrosActivos = contarFiltrosActivos()
  const itemsPerPage = ITEMS_PER_PAGE_MOBILE
  const totalPages = Math.ceil(clasesOrdenadas.length / itemsPerPage)
  const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1))
  if (validCurrentPage !== currentPage) {
    setCurrentPage(validCurrentPage)
  }

  const clasesEnPaginaActual = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage
    return clasesOrdenadas.slice(startIndex, startIndex + itemsPerPage)
  }, [clasesOrdenadas, validCurrentPage, itemsPerPage])

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

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null

    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 inline" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 inline" />
    )
  }

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
            className="pl-9 text-sm md:text-base"
          />
          <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Mobile Filter Button */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" className="gap-1.5">
                <Filter className="h-4 w-4" />
                Filtros
                {filtrosActivos > 0 && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {filtrosActivos}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh]">
              
              <div className="h-full flex flex-col">
                <SheetTitle className="sr-only">Filtros avanzados</SheetTitle>
                <div className="border-b p-4 bg-muted/30">
                  <h4 className="font-medium leading-none">Filtros avanzados</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configura los filtros para encontrar clases específicas
                  </p>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {/* Filtro por semana */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Semanas</Label>
                      <div className="grid grid-cols-3 gap-2">
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
                                setCurrentPage(1)
                              }}
                            />
                            <Label htmlFor={`semana-${semana}`} className="text-sm cursor-pointer">
                              Semana {semana}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Filtro por estudio */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Estudios</Label>
                      <div className="grid grid-cols-2 gap-2">
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
                                setCurrentPage(1)
                              }}
                            />
                            <Label htmlFor={`estudio-${estudio}`} className="text-sm cursor-pointer">
                              {estudio}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Filtro por disciplina */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Disciplinas</Label>
                      <div className="grid grid-cols-2 gap-2">
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
                                setCurrentPage(1)
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
                          setCurrentPage(1)
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
                        max={120}
                        step={5}
                        onValueChange={(values) => {
                          setFilters({
                            ...filters,
                            ocupacionMin: values[0],
                            ocupacionMax: values[1],
                          })
                          setCurrentPage(1)
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

                    {/* Checkbox para cortesías */}
                    <div className="mt-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="conCortesias"
                          checked={filters.conCortesias}
                          onCheckedChange={(checked) => {
                            setFilters({ ...filters, conCortesias: !!checked })
                            setCurrentPage(1)
                          }}
                        />
                        <Label htmlFor="conCortesias" className="text-sm cursor-pointer">
                          Con cortesías
                        </Label>
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                <div className="flex justify-between p-4 border-t bg-muted/30">
                  <Button variant="outline" size="sm" onClick={limpiarFiltros}>
                    Limpiar filtros
                  </Button>
                  <Button variant="default" size="sm" onClick={() => document.body.click()}>
                    Aplicar
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Filter Button */}
          <Popover>
            <PopoverTrigger asChild className="hidden md:flex">
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
                                  setCurrentPage(1)
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
                                  setCurrentPage(1)
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
                                  setCurrentPage(1)
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
                          setCurrentPage(1)
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
                        max={120}
                        step={5}
                        onValueChange={(values) => {
                          setFilters({
                            ...filters,
                            ocupacionMin: values[0],
                            ocupacionMax: values[1],
                          })
                          setCurrentPage(1)
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
                          setCurrentPage(1)
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

          {(filters.ocupacionMin > 0 || filters.ocupacionMax < 120) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Ocupación: {filters.ocupacionMin}% - {filters.ocupacionMax}%
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => {
                  setFilters({ ...filters, ocupacionMin: 0, ocupacionMax: 120 })
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

          {(filters.horaInicio !== "00:00" || filters.horaFin !== "23:59") && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Horario: {filters.horaInicio} - {filters.horaFin}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => {
                  setFilters({ ...filters, horaInicio: "00:00", horaFin: "23:59" })
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
                  <TableHead className="text-accent font-medium whitespace-nowrap w-[80px]">
                    ID
                  </TableHead>
                  <TableHead
                    className="text-accent font-medium whitespace-nowrap cursor-pointer w-[120px]"
                    onClick={() => toggleSort("fecha")}
                  >
                    Fecha {renderSortIndicator("fecha")}
                  </TableHead>
                  <TableHead
                    className="text-accent font-medium whitespace-nowrap cursor-pointer hidden md:table-cell w-[140px]"
                    onClick={() => toggleSort("horario")}
                  >
                    Horario {renderSortIndicator("horario")}
                  </TableHead>
                  <TableHead
                    className="text-accent font-medium whitespace-nowrap cursor-pointer hidden md:table-cell w-[160px]"
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
                  <TableHead className="text-accent font-medium whitespace-nowrap cursor-pointer hidden md:table-cell w-[100px]">
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
  const instructorId = pagoSeleccionado.instructorId;
  const detalleClase = pagoSeleccionado.detalles?.clases?.find((d: any) => d.claseId === clase.id);
  const disciplina = disciplinas.find((d) => d.id === clase.disciplinaId);
  const reservasCompletas = clase.reservasTotales >= clase.lugares;
  const esNoPrime = esClaseHorarioNoPrime(clase);
  const hora = obtenerHora(clase.fecha);
  const esFullHouse = detalleClase?.esFullHouse || false;

  return (
    <TableRow key={clase.id} className="hover:bg-muted/5 transition-colors border-b border-border/30">
      <TableCell className="text-xs font-mono text-muted-foreground">
        {clase.id}
      </TableCell>
      <TableCell className="font-medium whitespace-nowrap text-foreground">
        <div>
          {new Date(clase.fecha).toLocaleDateString()}
          <div className="text-xs text-muted-foreground mt-1 md:hidden">
            {hora} • {clase.estudio}
            {esNoPrime && (
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/70 ml-1 text-xs"
              >
                NP
              </Badge>
            )}
            {esFullHouse && (
              <Badge
                variant="outline"
                className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/70 ml-1 text-xs"
              >
                FH
              </Badge>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
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
          {esFullHouse && (
            <Badge
              variant="outline"
              className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/70 ml-1 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Full House
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex flex-col">
          <span className="text-foreground">{clase.estudio}</span>
          <span className="text-xs text-muted-foreground">{clase.salon}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
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
          {clase.esVersus && clase.vsNum && clase.vsNum > 1 && (
            <Badge
              variant="secondary"
              className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/70 text-xs"
            >
              VS {clase.vsNum}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-left">
        <span
          className={
            reservasCompletas || esFullHouse ? "text-emerald-600 font-medium pl-4" : "pl-4"
          }
        >
          {esFullHouse ? clase.lugares : clase.reservasTotales}
          {esFullHouse && (
            <span className="text-xs text-green-600 ml-1">(FH)</span>
          )}
          <span className="text-muted-foreground text-xs ml-1 md:hidden">/ {clase.lugares}</span>
        </span>
      </TableCell>
      <TableCell className="text-left pl-8 hidden md:table-cell">{clase.lugares}</TableCell>
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
                    const formulaParaDisciplina = formulas.find(
                      (f) => f.disciplinaId === clase.disciplinaId,
                    )

                    if (!formulaParaDisciplina) {
                      throw new Error("No se encontró fórmula para esta disciplina")
                    }

                    const categoriaInstructor =
                      instructores
                        .find((i) => i.id === pagoSeleccionado.instructorId)
                        ?.categorias?.find(
                          (c) =>
                            c.disciplinaId === clase.disciplinaId &&
                            c.periodoId === pagoSeleccionado.periodoId,
                        )?.categoria || "INSTRUCTOR"

                    const claseParaCalculo = { 
                      ...clase,
                      reservasTotales: esFullHouse ? clase.lugares : clase.reservasTotales
                    }
                    const resultadoCalculo = calcularPago(
                      claseParaCalculo,
                      categoriaInstructor,
                      formulaParaDisciplina,
                    )
                    
                    // Usar el monto real calculado en lugar del recalculado
                    const montoCalculado = detalleClase.montoCalculado
                    const detalleCalculo = {
                      mensaje: clase.esVersus && clase.vsNum && clase.vsNum > 1 
                        ? `Clase Versus: ${clase.reservasTotales} reservas × S/.${resultadoCalculo.tarifaAplicada.toFixed(2)} = S/.${(clase.reservasTotales * resultadoCalculo.tarifaAplicada).toFixed(2)}`
                        : resultadoCalculo.detalleCalculo,
                      pasos: [
                        {
                          descripcion: `Tarifa aplicada: ${resultadoCalculo.tarifaAplicada} (${resultadoCalculo.tipoTarifa})`,
                        },
                        {
                          descripcion: `Reservas: ${esFullHouse ? clase.lugares + ' (Full House)' : clase.reservasTotales} de ${clase.lugares} lugares`,
                        },
                        { descripcion: `Monto base: ${(clase.reservasTotales * resultadoCalculo.tarifaAplicada).toFixed(2)}` },
                        { descripcion: `División entre ${clase.vsNum || 1} instructores: ${((clase.reservasTotales * resultadoCalculo.tarifaAplicada) / (clase.vsNum || 1)).toFixed(2)}` },
                        { descripcion: `Monto final aplicado: ${montoCalculado.toFixed(2)}` },
                      ],
                    }

                    if (esFullHouse) {
                      detalleCalculo.pasos.unshift({
                        descripcion: `Clase considerada FULL HOUSE (ocupación al 100%)`,
                      })
                    }

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

                    if (resultadoCalculo.bonoAplicado) {
                      detalleCalculo.pasos.push({
                        descripcion: `Bono aplicable: ${resultadoCalculo.bonoAplicado.toFixed(2)} (no incluido en el total)`,
                      })
                    }

                    return (
                      <div className="space-y-1">
                        <p className="font-semibold">Detalle de cálculo:</p>
                        {clase.esVersus && clase.vsNum && clase.vsNum > 1 && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-xs border border-purple-200 dark:border-purple-800/50">
                            <span className="font-medium text-purple-700 dark:text-purple-300">
                              Clase Versus ({clase.vsNum} instructores)
                            </span>
                            <p className="text-purple-600 dark:text-purple-400 mt-1">
                              Los valores mostrados ya están ajustados para el cálculo individual
                            </p>
                          </div>
                        )}
                        {esFullHouse && (
                          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-xs border border-green-200 dark:border-green-800/50 mb-2">
                            <span className="font-medium text-green-700 dark:text-green-300">
                              <Check className="h-3 w-3 inline mr-1" />
                              Clase FULL HOUSE
                            </span>
                            <p className="text-green-600 dark:text-green-400 mt-1">
                              Se considera al 100% de ocupación para el cálculo
                            </p>
                          </div>
                        )}
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

                {/* Mostrar números de página solo en desktop */}
                <div className="hidden md:flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1

                    if (totalPages > 5) {
                      if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
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