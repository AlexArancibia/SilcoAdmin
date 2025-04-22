"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Search, Users, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Instructor } from "@/types/schema"
import { cn } from "@/lib/utils"

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
  // Obtener el nombre del instructor seleccionado
  const instructorSeleccionado = instructores.find(
    (instructor) => instructor.id.toString() === filtroInstructor,
  )?.nombre

  // Verificar si hay filtros activos
  const hayFiltrosActivos = busqueda !== "" || filtroEstado !== "todos" || filtroInstructor !== "todos"

  return (
    <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm transition-all duration-200">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col gap-4">
          {/* Barra principal de búsqueda y filtros */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por instructor, periodo o estado..."
                className={cn(
                  "pl-9 pr-8 h-10 bg-background border-0 shadow-sm rounded-full transition-all",
                  busqueda && "ring-1 ring-primary/20",
                )}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              {busqueda && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setBusqueda("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger
                  className={cn(
                    "w-[140px] sm:w-[160px] h-10 bg-background border-0 shadow-sm rounded-full transition-all",
                    filtroEstado !== "todos" && "ring-1 ring-primary/20 text-primary",
                  )}
                >
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
                <SelectTrigger
                  className={cn(
                    "w-[140px] sm:w-[160px] h-10 bg-background border-0 shadow-sm rounded-full transition-all",
                    filtroInstructor !== "todos" && "ring-1 ring-primary/20 text-primary",
                  )}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Instructor" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
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

          {/* Filtros activos */}
          {hayFiltrosActivos && (
            <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
              <span>Filtros:</span>
              {busqueda && (
                <Badge variant="outline" className="rounded-full bg-background border-0 shadow-sm gap-1 pl-2 pr-1 py-0">
                  "{busqueda}"
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 hover:bg-muted"
                    onClick={() => setBusqueda("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {filtroEstado !== "todos" && (
                <Badge variant="outline" className="rounded-full bg-background border-0 shadow-sm gap-1 pl-2 pr-1 py-0">
                  {filtroEstado === "PENDIENTE" ? "Pendientes" : "Aprobados"}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 hover:bg-muted"
                    onClick={() => setFiltroEstado("todos")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {filtroInstructor !== "todos" && instructorSeleccionado && (
                <Badge variant="outline" className="rounded-full bg-background border-0 shadow-sm gap-1 pl-2 pr-1 py-0">
                  {instructorSeleccionado}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 hover:bg-muted"
                    onClick={() => setFiltroInstructor("todos")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {hayFiltrosActivos && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs ml-auto hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    setBusqueda("")
                    setFiltroEstado("todos")
                    setFiltroInstructor("todos")
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
