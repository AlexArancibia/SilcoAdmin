"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, X } from "lucide-react"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useClasesStore } from "@/store/useClasesStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { useUsuariosStore } from "@/store/useUsuariosStore"

export function ClassesFilters() {
  const { periodos, periodoSeleccionadoId } = usePeriodosStore()
  const { fetchClases } = useClasesStore()
  const { disciplinas, fetchDisciplinas } = useDisciplinasStore()
  const { instructores, fetchInstructores } = useUsuariosStore()

  const [filters, setFilters] = useState({
    semana: "all",
    disciplinaId: "all",
    instructorId: "all",
    estudio: "all",
    searchTerm: "",
  })

  useEffect(() => {
    fetchDisciplinas()
    fetchInstructores()
  }, [fetchDisciplinas, fetchInstructores])

  useEffect(() => {
    if (periodoSeleccionadoId) {
      applyFilters()
    }
  }, [periodoSeleccionadoId, filters.semana, filters.disciplinaId, filters.instructorId, filters.estudio])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters()
  }

  const clearFilters = () => {
    setFilters({
      semana: "all",
      disciplinaId: "all",
      instructorId: "all",
      estudio: "all",
      searchTerm: "",
    })
  }

  const applyFilters = () => {
    if (!periodoSeleccionadoId) return

    const apiFilters: Record<string, any> = { periodoId: periodoSeleccionadoId }

    if (filters.semana !== "all") {
      apiFilters.semana = Number.parseInt(filters.semana)
    }

    if (filters.disciplinaId !== "all") {
      apiFilters.disciplinaId = Number.parseInt(filters.disciplinaId)
    }

    if (filters.instructorId !== "all") {
      apiFilters.instructorId = Number.parseInt(filters.instructorId)
    }

    if (filters.estudio !== "all") {
      apiFilters.estudio = filters.estudio
    }

    if (filters.searchTerm) {
      apiFilters.searchTerm = filters.searchTerm
    }

    fetchClases(apiFilters)
  }

  // Obtener estudios únicos de los periodos actuales
  const estudios = [
    ...new Set(
      periodos
        .filter((p) => p.id === periodoSeleccionadoId)
        .flatMap((p) => ["Síclo Reducto", "Síclo San Isidro", "Síclo Primavera", "Síclo La Estancia", "Síclo Asia"]),
    ),
  ]

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="grid gap-1.5 flex-1">
            <label className="text-sm font-medium">Buscar</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar clases..."
                className="pl-8"
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Semana</label>
            <Select value={filters.semana} onValueChange={(value) => handleFilterChange("semana", value)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Semana" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="1">Semana 1</SelectItem>
                <SelectItem value="2">Semana 2</SelectItem>
                <SelectItem value="3">Semana 3</SelectItem>
                <SelectItem value="4">Semana 4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Disciplina</label>
            <Select value={filters.disciplinaId} onValueChange={(value) => handleFilterChange("disciplinaId", value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {disciplinas.map((disciplina) => (
                  <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                    {disciplina.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Instructor</label>
            <Select value={filters.instructorId} onValueChange={(value) => handleFilterChange("instructorId", value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Instructor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {instructores.map((instructor) => (
                  <SelectItem key={instructor.id} value={instructor.id.toString()}>
                    {instructor.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Estudio</label>
            <Select value={filters.estudio} onValueChange={(value) => handleFilterChange("estudio", value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estudio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {estudios.map((estudio) => (
                  <SelectItem key={estudio} value={estudio}>
                    {estudio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="icon" variant="default">
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filtrar</span>
            </Button>
            <Button type="button" size="icon" variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4" />
              <span className="sr-only">Limpiar filtros</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

