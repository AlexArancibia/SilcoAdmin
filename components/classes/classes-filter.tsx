"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PeriodSelector } from "@/components/period-selector"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { 
  Hash, 
  User, 
  GraduationCap, 
  Calendar, 
  MapPin, 
  Filter,
  RotateCcw
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ClassesFilterProps {
  initialPeriodoId?: number
  initialInstructorId?: number
  initialDisciplinaId?: number
  initialSemana?: number
  initialEstudio?: string
  initialId?: string
}

// Custom hook for debounced value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function ClassesFilter({
  initialPeriodoId,
  initialInstructorId,
  initialDisciplinaId,
  initialSemana,
  initialEstudio,
  initialId,
}: ClassesFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [instructorId, setInstructorId] = useState(initialInstructorId)
  const [disciplinaId, setDisciplinaId] = useState(initialDisciplinaId)
  const [semana, setSemana] = useState(initialSemana)
  const [estudio, setEstudio] = useState(initialEstudio)
  const [id, setId] = useState(initialId)

  // Debounced values for text inputs
  const debouncedEstudio = useDebounce(estudio, 300)
  const debouncedId = useDebounce(id, 300)

  const { rangoSeleccionado, getPeriodoQueryParams } = usePeriodosStore()
  const { instructores, fetchInstructores, isLoading: isLoadingInstructores } = useInstructoresStore()
  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()

  // Calculate active filters count
  const activeFiltersCount = [debouncedId, instructorId, disciplinaId, semana, debouncedEstudio, rangoSeleccionado].filter(Boolean).length

  useEffect(() => {
    if (instructores.length === 0) fetchInstructores()
    if (disciplinas.length === 0) fetchDisciplinas()
  }, [instructores.length, disciplinas.length, fetchInstructores, fetchDisciplinas])

  // Auto-apply filters function
  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", "1")

    // Handle text filters
    if (debouncedId) params.set("id", debouncedId); else params.delete("id")
    if (debouncedEstudio) params.set("estudio", debouncedEstudio); else params.delete("estudio")

    // Handle period filters
    const periodoParams = getPeriodoQueryParams()
    params.delete("periodoId")
    params.delete("periodoInicio") 
    params.delete("periodoFin")
    
    if (periodoParams.periodoId) {
      params.set("periodoId", String(periodoParams.periodoId))
    } else if (periodoParams.periodoInicio || periodoParams.periodoFin) {
      if (periodoParams.periodoInicio) params.set("periodoInicio", String(periodoParams.periodoInicio))
      if (periodoParams.periodoFin) params.set("periodoFin", String(periodoParams.periodoFin))
    }

    // Handle select filters
    if (instructorId) params.set("instructorId", String(instructorId)); else params.delete("instructorId")
    if (disciplinaId) params.set("disciplinaId", String(disciplinaId)); else params.delete("disciplinaId")
    if (semana) params.set("semana", String(semana)); else params.delete("semana")

    router.push(`${pathname}?${params.toString()}`)
  }, [debouncedId, debouncedEstudio, instructorId, disciplinaId, semana, rangoSeleccionado, getPeriodoQueryParams, router, pathname, searchParams])

  // Auto-apply filters when values change
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // Update period parameters when period selection changes
  useEffect(() => {
    if (rangoSeleccionado) {
      applyFilters()
    }
  }, [rangoSeleccionado, applyFilters])

  const handleReset = () => {
    setInstructorId(undefined)
    setDisciplinaId(undefined)
    setSemana(undefined)
    setEstudio(undefined)
    setId(undefined)
    router.push(pathname)
  }

  return (
    <Card className="mb-6 border border-primary/10 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Filter className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-primary">
                Filtros de Clases
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Filtros aplicados automáticamente
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground border-secondary/30">
                {activeFiltersCount}
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleReset}
              className="h-8 px-2"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
            
            {/* Period selector in top right */}
            <div className="relative z-50 min-w-[200px]">
              <PeriodSelector />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Single Row - All Filters */}
        <div className="grid grid-cols-12 gap-3">
          {/* ID - Short field */}
          <div className="relative col-span-2">
            <Hash className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="ID"
              value={id || ""}
              onChange={(e) => setId(e.target.value)}
              className="pl-7 h-9 text-sm border-border/50 focus:border-primary"
            />
          </div>

          {/* Studio */}
          <div className="relative col-span-3">
            <MapPin className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Estudio"
              value={estudio || ""}
              onChange={(e) => setEstudio(e.target.value)}
              className="pl-7 h-9 text-sm border-border/50 focus:border-primary"
            />
          </div>

          {/* Instructor */}
          <div className="relative col-span-3">
            <User className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground z-10" />
            <Select
              value={instructorId?.toString() || ""}
              onValueChange={(value) => setInstructorId(value ? Number(value) : undefined)}
              disabled={isLoadingInstructores}
            >
              <SelectTrigger className={cn(
                "pl-7 h-9 text-sm border-border/50 focus:border-primary",
                instructorId && "border-primary/30 bg-primary/5"
              )}>
                <SelectValue placeholder="Instructor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {instructores.map((i) => (
                  <SelectItem key={i.id} value={String(i.id)}>
                    {i.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Discipline */}
          <div className="relative col-span-2">
            <GraduationCap className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground z-10" />
            <Select
              value={disciplinaId?.toString() || ""}
              onValueChange={(value) => setDisciplinaId(value ? Number(value) : undefined)}
              disabled={isLoadingDisciplinas}
            >
              <SelectTrigger className={cn(
                "pl-7 h-9 text-sm border-border/50 focus:border-primary",
                disciplinaId && "border-primary/30 bg-primary/5"
              )}>
                <SelectValue placeholder="Disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {disciplinas.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Week */}
          <div className="relative col-span-2">
            <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground z-10" />
            <Select
              value={semana?.toString() || ""}
              onValueChange={(value) => setSemana(value ? Number(value) : undefined)}
            >
              <SelectTrigger className={cn(
                "pl-7 h-9 text-sm border-border/50 focus:border-primary",
                semana && "border-primary/30 bg-primary/5"
              )}>
                <SelectValue placeholder="Semana" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {[...Array(4).keys()].map((i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    Semana {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
