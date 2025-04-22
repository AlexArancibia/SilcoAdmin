"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Search, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Instructor } from "@/types/schema"

interface FilterBarProps {
  busqueda: string
  setBusqueda: (value: string) => void
  filtroEstado: string
  setFiltroEstado: (value: string) => void
  filtroInstructor: string
  setFiltroInstructor: (value: string) => void
  instructores: Instructor[]
}

export function FilterBar({
  busqueda,
  setBusqueda,
  filtroEstado,
  setFiltroEstado,
  filtroInstructor,
  setFiltroInstructor,
  instructores,
}: FilterBarProps) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por instructor, periodo o estado..."
              className="pl-8 bg-background border-muted"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[180px] bg-background border-muted">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                <SelectItem value="APROBADO">Aprobados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroInstructor} onValueChange={setFiltroInstructor}>
              <SelectTrigger className="w-[180px] bg-background border-muted">
                <Users className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Instructor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los instructores</SelectItem>
                {instructores.map((instructor) => (
                  <SelectItem key={instructor.id} value={instructor.id.toString()}>
                    {instructor.nombre}
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
