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
  const instructorSeleccionado = instructores.find(
    (instructor) => instructor.id.toString() === filtroInstructor,
  )?.nombre

  const hayFiltrosActivos = busqueda !== "" || filtroEstado !== "todos" || filtroInstructor !== "todos"

  return (
    <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm transition-all duration-200">
      <CardContent className="p-2 sm:p-4">
        <div className="flex flex-col gap-3">
          {/* Barra principal de búsqueda y filtros */}
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className={cn(
                  "pl-9 pr-8 h-10 bg-background border-0 shadow-sm rounded-full transition-all w-full",
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

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger
                  className={cn(
                    "w-full sm:w-[140px] h-10 bg-background border-0 shadow-sm rounded-full transition-all",
                    filtroEstado !== "todos" && "ring-1 ring-primary/20 text-primary",
                  )}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                  <SelectItem value="APROBADO">Aprobados</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtroInstructor} onValueChange={setFiltroInstructor}>
                <SelectTrigger
                  className={cn(
                    "w-full sm:w-[160px] h-10 bg-background border-0 shadow-sm rounded-full transition-all",
                    filtroInstructor !== "todos" && "ring-1 ring-primary/20 text-primary",
                  )}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Instructor" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="todos">Todos</SelectItem>
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
              <div className="flex flex-wrap items-center gap-2">
                <span className="hidden sm:inline">Filtros:</span>
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
                    {instructorSeleccionado.length > 12 
                      ? `${instructorSeleccionado.substring(0, 10)}...`
                      : instructorSeleccionado}
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
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs sm:ml-auto hover:bg-destructive/10 hover:text-destructive w-full sm:w-auto"
                onClick={() => {
                  setBusqueda("")
                  setFiltroEstado("todos")
                  setFiltroInstructor("todos")
                }}
              >
                Limpiar todos
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}