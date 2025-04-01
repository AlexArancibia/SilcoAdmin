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
import { Loader2 } from "lucide-react"

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
  }, [periodos.length, instructores.length, disciplinas.length, clases.length, fetchPeriodos, fetchInstructores, fetchDisciplinas, fetchClases])

  // Extraer estudios únicos de las clases
  useEffect(() => {
    if (clases.length > 0) {
      const uniqueEstudios = Array.from(new Set(clases.map(clase => clase.estudio))).sort()
      setEstudios(uniqueEstudios)
    }
  }, [clases])

  // Aplicar filtros automáticamente cuando cambian los valores
  const applyFilters = (newPeriodoId?: number, newInstructorId?: number, newDisciplinaId?: number, newSemana?: number, newEstudio?: string) => {
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="space-y-2">
          <Label htmlFor="periodo">Periodo</Label>
          <Select
            value={periodoId?.toString() || ""}
            onValueChange={(value) => {
              const newPeriodoId = value && value !== "all" ? Number.parseInt(value) : undefined
              setPeriodoId(newPeriodoId)
              applyFilters(newPeriodoId, instructorId, disciplinaId, semana, estudio)
            }}
            disabled={isLoadingPeriodos}
          >
            <SelectTrigger id="periodo">
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

        <div className="space-y-2">
          <Label htmlFor="instructor">Instructor</Label>
          <Select
            value={instructorId?.toString() || ""}
            onValueChange={(value) => {
              const newInstructorId = value && value !== "all" ? Number.parseInt(value) : undefined
              setInstructorId(newInstructorId)
              applyFilters(periodoId, newInstructorId, disciplinaId, semana, estudio)
            }}
            disabled={isLoadingInstructores}
          >
            <SelectTrigger id="instructor">
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

        <div className="space-y-2">
          <Label htmlFor="disciplina">Disciplina</Label>
          <Select
            value={disciplinaId?.toString() || ""}
            onValueChange={(value) => {
              const newDisciplinaId = value && value !== "all" ? Number.parseInt(value) : undefined
              setDisciplinaId(newDisciplinaId)
              applyFilters(periodoId, instructorId, newDisciplinaId, semana, estudio)
            }}
            disabled={isLoadingDisciplinas}
          >
            <SelectTrigger id="disciplina">
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

        <div className="space-y-2">
          <Label htmlFor="semana">Semana</Label>
          <Select
            value={semana?.toString() || ""}
            onValueChange={(value) => {
              const newSemana = value && value !== "all" ? Number.parseInt(value) : undefined
              setSemana(newSemana)
              applyFilters(periodoId, instructorId, disciplinaId, newSemana, estudio)
            }}
          >
            <SelectTrigger id="semana">
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

        <div className="space-y-2">
          <Label htmlFor="estudio">Estudio</Label>
          <Select
            value={estudio || ""}
            onValueChange={(value) => {
              const newEstudio = value && value !== "all" ? value : undefined
              setEstudio(newEstudio)
              applyFilters(periodoId, instructorId, disciplinaId, semana, newEstudio)
            }}
            disabled={isLoadingClases || estudios.length === 0}
          >
            <SelectTrigger id="estudio">
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

      <div className="flex items-center justify-end space-x-2">
        <Button variant="outline" onClick={handleReset}>
          Reiniciar filtros
        </Button>
      </div>
    </div>
  )
}