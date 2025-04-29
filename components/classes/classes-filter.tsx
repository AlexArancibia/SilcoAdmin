"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { useClasesStore } from "@/store/useClasesStore"
import { Loader2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ClassesFilterProps {
  initialPeriodoId?: number
  initialInstructorId?: number
  initialDisciplinaId?: number
  initialSemana?: number
  initialEstudio?: string
}

export function ClassesFilter({
  initialPeriodoId,
  initialInstructorId,
  initialDisciplinaId,
  initialSemana,
  initialEstudio,
}: ClassesFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [periodoId, setPeriodoId] = useState<number | undefined>(initialPeriodoId)
  const [instructorId, setInstructorId] = useState<number | undefined>(initialInstructorId)
  const [disciplinaId, setDisciplinaId] = useState<number | undefined>(initialDisciplinaId)
  const [semana, setSemana] = useState<number | undefined>(initialSemana)
  const [estudio, setEstudio] = useState<string | undefined>(initialEstudio)

  const { periodos, fetchPeriodos, isLoading: isLoadingPeriodos } = usePeriodosStore()
  const { instructores, fetchInstructores, isLoading: isLoadingInstructores } = useInstructoresStore()
  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()
  const { clases, fetchClases, isLoading: isLoadingClases } = useClasesStore()

  // Lista de estudios únicos extraída de las clases
  const [estudios, setEstudios] = useState<string[]>([])

  useEffect(() => {
    if (periodos.length === 0) fetchPeriodos()
    if (instructores.length === 0) fetchInstructores()
    if (disciplinas.length === 0) fetchDisciplinas()

    // Obtener clases para extraer estudios únicos
    if (clases.length === 0) fetchClases()
  }, [
    periodos.length,
    instructores.length,
    disciplinas.length,
    clases.length,
    fetchPeriodos,
    fetchInstructores,
    fetchDisciplinas,
    fetchClases,
  ])

  // Extraer estudios únicos de las clases
  useEffect(() => {
    if (clases.length > 0) {
      const uniqueEstudios = Array.from(new Set(clases.map((clase) => clase.estudio)))
        .filter(Boolean)
        .sort()
      setEstudios(uniqueEstudios)
    }
  }, [clases])

  // Aplicar filtros automáticamente cuando cambian los valores
  const applyFilters = (
    newPeriodoId?: number,
    newInstructorId?: number,
    newDisciplinaId?: number,
    newSemana?: number,
    newEstudio?: string,
  ) => {
    const params = new URLSearchParams(searchParams.toString())

    if (newPeriodoId) {
      params.set("periodoId", newPeriodoId.toString())
    } else {
      params.delete("periodoId")
    }

    if (newInstructorId) {
      params.set("instructorId", newInstructorId.toString())
    } else {
      params.delete("instructorId")
    }

    if (newDisciplinaId) {
      params.set("disciplinaId", newDisciplinaId.toString())
    } else {
      params.delete("disciplinaId")
    }

    if (newSemana) {
      params.set("semana", newSemana.toString())
    } else {
      params.delete("semana")
    }

    if (newEstudio) {
      params.set("estudio", newEstudio)
    } else {
      params.delete("estudio")
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  const handleReset = () => {
    setPeriodoId(undefined)
    setInstructorId(undefined)
    setDisciplinaId(undefined)
    setSemana(undefined)
    setEstudio(undefined)
    router.push(pathname)
  }

  const isLoading = isLoadingPeriodos || isLoadingInstructores || isLoadingDisciplinas || isLoadingClases

  // Obtener nombres de los filtros seleccionados
  const selectedPeriodo = periodos.find((p) => p.id === periodoId)
  const selectedInstructor = instructores.find((i) => i.id === instructorId)
  const selectedDisciplina = disciplinas.find((d) => d.id === disciplinaId)

  // Contar filtros activos
  const activeFiltersCount = [
    periodoId !== undefined,
    instructorId !== undefined,
    disciplinaId !== undefined,
    semana !== undefined,
    estudio !== undefined,
  ].filter(Boolean).length

  return (
    <div className="mb-4">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-5 mb-3">
        <div className="space-y-1">
          <Label htmlFor="periodo" className="text-xs">
            Periodo
          </Label>
          <Select
            value={periodoId?.toString() || ""}
            onValueChange={(value) => {
              const newPeriodoId = value && value !== "all" ? Number.parseInt(value) : undefined
              setPeriodoId(newPeriodoId)
              applyFilters(newPeriodoId, instructorId, disciplinaId, semana, estudio)
            }}
            disabled={isLoadingPeriodos}
          >
            <SelectTrigger id="periodo" className="h-8 text-sm">
              <SelectValue placeholder="Seleccionar periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los periodos</SelectItem>
              {periodos.map((periodo) => (
                <SelectItem key={periodo.id} value={periodo.id.toString()}>
                  Periodo {periodo.numero} - {periodo.año}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="instructor" className="text-xs">
            Instructor
          </Label>
          <Select
            value={instructorId?.toString() || ""}
            onValueChange={(value) => {
              const newInstructorId = value && value !== "all" ? Number.parseInt(value) : undefined
              setInstructorId(newInstructorId)
              applyFilters(periodoId, newInstructorId, disciplinaId, semana, estudio)
            }}
            disabled={isLoadingInstructores}
          >
            <SelectTrigger id="instructor" className="h-8 text-sm">
              <SelectValue placeholder="Seleccionar instructor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los instructores</SelectItem>
              {instructores.map((instructor) => (
                <SelectItem key={instructor.id} value={instructor.id.toString()}>
                  {instructor.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="disciplina" className="text-xs">
            Disciplina
          </Label>
          <Select
            value={disciplinaId?.toString() || ""}
            onValueChange={(value) => {
              const newDisciplinaId = value && value !== "all" ? Number.parseInt(value) : undefined
              setDisciplinaId(newDisciplinaId)
              applyFilters(periodoId, instructorId, newDisciplinaId, semana, estudio)
            }}
            disabled={isLoadingDisciplinas}
          >
            <SelectTrigger id="disciplina" className="h-8 text-sm">
              <SelectValue placeholder="Seleccionar disciplina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las disciplinas</SelectItem>
              {disciplinas.map((disciplina) => (
                <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                  {disciplina.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="semana" className="text-xs">
            Semana
          </Label>
          <Select
            value={semana?.toString() || ""}
            onValueChange={(value) => {
              const newSemana = value && value !== "all" ? Number.parseInt(value) : undefined
              setSemana(newSemana)
              applyFilters(periodoId, instructorId, disciplinaId, newSemana, estudio)
            }}
          >
            <SelectTrigger id="semana" className="h-8 text-sm">
              <SelectValue placeholder="Seleccionar semana" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las semanas</SelectItem>
              <SelectItem value="1">Semana 1</SelectItem>
              <SelectItem value="2">Semana 2</SelectItem>
              <SelectItem value="3">Semana 3</SelectItem>
              <SelectItem value="4">Semana 4</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="estudio" className="text-xs">
            Estudio
          </Label>
          <Select
            value={estudio || ""}
            onValueChange={(value) => {
              const newEstudio = value && value !== "all" ? value : undefined
              setEstudio(newEstudio)
              applyFilters(periodoId, instructorId, disciplinaId, semana, newEstudio)
            }}
            disabled={isLoadingClases || estudios.length === 0}
          >
            <SelectTrigger id="estudio" className="h-8 text-sm">
              <SelectValue placeholder="Seleccionar estudio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estudios</SelectItem>
              {estudios.map((studio) => (
                <SelectItem key={studio} value={studio}>
                  {studio}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Indicadores de filtros activos */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-1 items-center mb-3">
          {periodoId !== undefined && selectedPeriodo && (
            <Badge variant="secondary" className="flex items-center gap-1 h-6 text-xs">
              Periodo {selectedPeriodo.numero}/{selectedPeriodo.año}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => {
                  setPeriodoId(undefined)
                  applyFilters(undefined, instructorId, disciplinaId, semana, estudio)
                }}
              />
            </Badge>
          )}

          {instructorId !== undefined && selectedInstructor && (
            <Badge variant="secondary" className="flex items-center gap-1 h-6 text-xs">
              {selectedInstructor.nombre}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => {
                  setInstructorId(undefined)
                  applyFilters(periodoId, undefined, disciplinaId, semana, estudio)
                }}
              />
            </Badge>
          )}

          {disciplinaId !== undefined && selectedDisciplina && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 h-6 text-xs"
              style={{
                backgroundColor: selectedDisciplina.color ? `${selectedDisciplina.color}20` : undefined,
              }}
            >
              {selectedDisciplina.nombre}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => {
                  setDisciplinaId(undefined)
                  applyFilters(periodoId, instructorId, undefined, semana, estudio)
                }}
              />
            </Badge>
          )}

          {semana !== undefined && (
            <Badge variant="secondary" className="flex items-center gap-1 h-6 text-xs">
              Semana {semana}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => {
                  setSemana(undefined)
                  applyFilters(periodoId, instructorId, disciplinaId, undefined, estudio)
                }}
              />
            </Badge>
          )}

          {estudio !== undefined && (
            <Badge variant="secondary" className="flex items-center gap-1 h-6 text-xs">
              {estudio}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => {
                  setEstudio(undefined)
                  applyFilters(periodoId, instructorId, disciplinaId, semana, undefined)
                }}
              />
            </Badge>
          )}

          <Button variant="ghost" size="sm" onClick={handleReset} className="h-6 px-2 text-xs">
            Limpiar todos
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
          Cargando...
        </div>
      )}
    </div>
  )
}
