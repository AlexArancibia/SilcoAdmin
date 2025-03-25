"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { Loader2 } from "lucide-react"

interface ClassesFilterProps {
  initialPeriodoId?: number
  initialInstructorId?: number
  initialDisciplinaId?: number
  initialSemana?: number
}

export function ClassesFilter({
  initialPeriodoId,
  initialInstructorId,
  initialDisciplinaId,
  initialSemana,
}: ClassesFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [periodoId, setPeriodoId] = useState<number | undefined>(initialPeriodoId)
  const [instructorId, setInstructorId] = useState<number | undefined>(initialInstructorId)
  const [disciplinaId, setDisciplinaId] = useState<number | undefined>(initialDisciplinaId)
  const [semana, setSemana] = useState<number | undefined>(initialSemana)

  const { periodos, fetchPeriodos, isLoading: isLoadingPeriodos } = usePeriodosStore()
  const { instructores, fetchInstructores, isLoading: isLoadingInstructores } = useInstructoresStore()
  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()

  useEffect(() => {
    if (periodos.length === 0) fetchPeriodos()
    if (instructores.length === 0) fetchInstructores()
    if (disciplinas.length === 0) fetchDisciplinas()
  }, [periodos.length, instructores.length, disciplinas.length, fetchPeriodos, fetchInstructores, fetchDisciplinas])

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (periodoId) {
      params.set("periodoId", periodoId.toString())
    } else {
      params.delete("periodoId")
    }

    if (instructorId) {
      params.set("instructorId", instructorId.toString())
    } else {
      params.delete("instructorId")
    }

    if (disciplinaId) {
      params.set("disciplinaId", disciplinaId.toString())
    } else {
      params.delete("disciplinaId")
    }

    if (semana) {
      params.set("semana", semana.toString())
    } else {
      params.delete("semana")
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  const handleReset = () => {
    setPeriodoId(undefined)
    setInstructorId(undefined)
    setDisciplinaId(undefined)
    setSemana(undefined)
    router.push(pathname)
  }

  const isLoading = isLoadingPeriodos || isLoadingInstructores || isLoadingDisciplinas

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="periodo">Periodo</Label>
          <Select
            value={periodoId?.toString() || ""}
            onValueChange={(value) => setPeriodoId(value ? Number.parseInt(value) : undefined)}
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
            onValueChange={(value) => setInstructorId(value ? Number.parseInt(value) : undefined)}
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
            onValueChange={(value) => setDisciplinaId(value ? Number.parseInt(value) : undefined)}
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
            onValueChange={(value) => setSemana(value ? Number.parseInt(value) : undefined)}
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
      </div>

      <div className="flex items-center justify-end space-x-2">
        <Button variant="outline" onClick={handleReset}>
          Reiniciar
        </Button>
        <Button onClick={handleFilter} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando...
            </>
          ) : (
            "Filtrar"
          )}
        </Button>
      </div>
    </div>
  )
}

