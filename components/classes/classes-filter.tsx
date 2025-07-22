"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { Loader2 } from "lucide-react"

interface ClassesFilterProps {
  initialPeriodoId?: number
  initialInstructorId?: number
  initialDisciplinaId?: number
  initialSemana?: number
  initialEstudio?: string
  initialId?: string
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

  const [periodoId, setPeriodoId] = useState(initialPeriodoId)
  const [instructorId, setInstructorId] = useState(initialInstructorId)
  const [disciplinaId, setDisciplinaId] = useState(initialDisciplinaId)
  const [semana, setSemana] = useState(initialSemana)
  const [estudio, setEstudio] = useState(initialEstudio)
  const [id, setId] = useState(initialId)

  const { periodos, fetchPeriodos, isLoading: isLoadingPeriodos } = usePeriodosStore()
  const { instructores, fetchInstructores, isLoading: isLoadingInstructores } = useInstructoresStore()
  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()

  useEffect(() => {
    if (periodos.length === 0) fetchPeriodos()
    if (instructores.length === 0) fetchInstructores()
    if (disciplinas.length === 0) fetchDisciplinas()
  }, [periodos.length, instructores.length, disciplinas.length, fetchPeriodos, fetchInstructores, fetchDisciplinas])

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", "1") // Reset page to 1 when filters change

    if (id) params.set("id", id); else params.delete("id")
    if (periodoId) params.set("periodoId", String(periodoId)); else params.delete("periodoId")
    if (instructorId) params.set("instructorId", String(instructorId)); else params.delete("instructorId")
    if (disciplinaId) params.set("disciplinaId", String(disciplinaId)); else params.delete("disciplinaId")
    if (semana) params.set("semana", String(semana)); else params.delete("semana")
    if (estudio) params.set("estudio", estudio); else params.delete("estudio")

    router.push(`${pathname}?${params.toString()}`)
  }

  const handleReset = () => {
    setPeriodoId(undefined)
    setInstructorId(undefined)
    setDisciplinaId(undefined)
    setSemana(undefined)
    setEstudio(undefined)
    setId(undefined)
    router.push(pathname)
  }

  const isLoading = isLoadingPeriodos || isLoadingInstructores || isLoadingDisciplinas

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Filtros de Clases</CardTitle>
        <CardDescription>Usa los filtros para encontrar clases específicas.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Filtro por ID de Clase */}
          <div className="space-y-1">
            <Label htmlFor="clase-id">ID de Clase</Label>
            <Input
              id="clase-id"
              placeholder="Buscar por ID..."
              value={id || ""}
              onChange={(e) => setId(e.target.value)}
            />
          </div>

          {/* Filtro por Periodo */}
          <div className="space-y-1">
            <Label htmlFor="periodo">Periodo</Label>
            <Select
              value={periodoId?.toString() || ""}
              onValueChange={(value) => setPeriodoId(value ? Number(value) : undefined)}
              disabled={isLoadingPeriodos}
            >
              <SelectTrigger id="periodo">
                <SelectValue placeholder="Seleccionar periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los periodos</SelectItem>
                {periodos.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    Periodo {p.numero} - {p.año}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Instructor */}
          <div className="space-y-1">
            <Label htmlFor="instructor">Instructor</Label>
            <Select
              value={instructorId?.toString() || ""}
              onValueChange={(value) => setInstructorId(value ? Number(value) : undefined)}
              disabled={isLoadingInstructores}
            >
              <SelectTrigger id="instructor">
                <SelectValue placeholder="Seleccionar instructor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los instructores</SelectItem>
                {instructores.map((i) => (
                  <SelectItem key={i.id} value={String(i.id)}>
                    {i.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Disciplina */}
          <div className="space-y-1">
            <Label htmlFor="disciplina">Disciplina</Label>
            <Select
              value={disciplinaId?.toString() || ""}
              onValueChange={(value) => setDisciplinaId(value ? Number(value) : undefined)}
              disabled={isLoadingDisciplinas}
            >
              <SelectTrigger id="disciplina">
                <SelectValue placeholder="Seleccionar disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las disciplinas</SelectItem>
                {disciplinas.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Semana */}
          <div className="space-y-1">
            <Label htmlFor="semana">Semana</Label>
            <Select
              value={semana?.toString() || ""}
              onValueChange={(value) => setSemana(value ? Number(value) : undefined)}
            >
              <SelectTrigger id="semana">
                <SelectValue placeholder="Seleccionar semana" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las semanas</SelectItem>
                {[...Array(4).keys()].map((i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    Semana {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Estudio */}
          <div className="space-y-1">
            <Label htmlFor="estudio">Estudio</Label>
            <Input
              id="estudio"
              placeholder="Buscar por estudio..."
              value={estudio || ""}
              onChange={(e) => setEstudio(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleReset} disabled={isLoading}>
          Limpiar
        </Button>
        <Button onClick={handleApplyFilters} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Aplicar Filtros
        </Button>
      </CardFooter>
    </Card>
  )
}
