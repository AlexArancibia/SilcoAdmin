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
import { Loader2 } from "lucide-react"

interface PagosFilterProps {
  initialPage?: number
  initialLimit?: number
  initialEstado?: string
  initialInstructorId?: number
  initialPeriodoId?: number
  initialBusqueda?: string
}

export function PagosFilter({
  initialPage,
  initialLimit,
  initialEstado,
  initialInstructorId,
  initialPeriodoId,
  initialBusqueda,
}: PagosFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [page, setPage] = useState(initialPage || 1)
  const [limit, setLimit] = useState(initialLimit || 20)
  const [estado, setEstado] = useState(initialEstado)
  const [instructorId, setInstructorId] = useState(initialInstructorId)
  const [periodoId, setPeriodoId] = useState(initialPeriodoId)
  const [busqueda, setBusqueda] = useState(initialBusqueda)

  const { periodos, isLoading: isLoadingPeriodos } = usePeriodosStore()
  const { instructores, isLoading: isLoadingInstructores } = useInstructoresStore()

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", "1") // Reset page to 1 when filters change

    if (estado && estado !== 'all') params.set("estado", estado); else params.delete("estado")
    if (instructorId && instructorId.toString() !== 'all') params.set("instructorId", String(instructorId)); else params.delete("instructorId")
    if (periodoId && periodoId.toString() !== 'all') params.set("periodoId", String(periodoId)); else params.delete("periodoId")
    if (busqueda) params.set("busqueda", busqueda); else params.delete("busqueda")
    if (limit !== 20) params.set("limit", String(limit)); else params.delete("limit")

    router.push(`${pathname}?${params.toString()}`)
  }

  const handleReset = () => {
    setPage(1)
    setLimit(20)
    setEstado(undefined)
    setInstructorId(undefined)
    setPeriodoId(undefined)
    setBusqueda(undefined)
    router.push(pathname)
  }

  const isLoading = isLoadingPeriodos || isLoadingInstructores

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Filtros de Pagos</CardTitle>
        <CardDescription>Usa los filtros para encontrar pagos específicos.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Filtro por Búsqueda */}
          <div className="space-y-1">
            <Label htmlFor="busqueda">Búsqueda</Label>
            <Input
              id="busqueda"
              placeholder="Buscar por ID o nombre..."
              value={busqueda || ""}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {/* Filtro por Estado */}
          <div className="space-y-1">
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={estado || ""}
              onValueChange={(value) => setEstado(value || undefined)}
            >
              <SelectTrigger id="estado">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="PAGADO">Pagado</SelectItem>
                <SelectItem value="APROBADO">Aprobado</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
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

          {/* Filtro por Elementos por Página */}
          <div className="space-y-1">
            <Label htmlFor="limit">Elementos por página</Label>
            <Select
              value={limit.toString()}
              onValueChange={(value) => setLimit(Number(value))}
            >
              <SelectTrigger id="limit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
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
