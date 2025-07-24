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
import { 
  User, 
  CreditCard,
  DollarSign,
  FileText,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PagosFilterProps {
  initialPage?: number
  initialLimit?: number
  initialEstado?: string
  initialInstructorId?: number
  initialPeriodoId?: number
  initialBusqueda?: string
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
  const [busqueda, setBusqueda] = useState(initialBusqueda)

  // Debounced values for text inputs
  const debouncedBusqueda = useDebounce(busqueda, 300)

  const { rangoSeleccionado, getPeriodoQueryParams } = usePeriodosStore()
  const { instructores, isLoading: isLoadingInstructores } = useInstructoresStore()

  // Calculate active filters count
  const activeFiltersCount = [debouncedBusqueda, estado, instructorId, rangoSeleccionado].filter(Boolean).length

  // Auto-apply filters function
  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", "1")

    // Handle text filters
    if (debouncedBusqueda) params.set("busqueda", debouncedBusqueda); else params.delete("busqueda")

    // Handle select filters
    if (estado && estado !== 'all') params.set("estado", estado); else params.delete("estado")
    if (instructorId && instructorId.toString() !== 'all') params.set("instructorId", String(instructorId)); else params.delete("instructorId")
    if (limit !== 20) params.set("limit", String(limit)); else params.delete("limit")

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

    router.push(`${pathname}?${params.toString()}`)
  }, [debouncedBusqueda, estado, instructorId, limit, rangoSeleccionado, getPeriodoQueryParams, router, pathname, searchParams])

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
    setPage(1)
    setLimit(20)
    setEstado(undefined)
    setInstructorId(undefined)
    setBusqueda(undefined)
    router.push(pathname)
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "PAGADO":
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case "PENDIENTE":
        return <Clock className="h-3 w-3 text-yellow-500" />
      case "APROBADO":
        return <AlertCircle className="h-3 w-3 text-blue-500" />
      case "CANCELADO":
        return <XCircle className="h-3 w-3 text-red-500" />
      default:
        return <DollarSign className="h-3 w-3 text-muted-foreground" />
    }
  }

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "PAGADO":
        return "border-green-300 bg-green-50 dark:bg-green-900/20"
      case "PENDIENTE":
        return "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20"
      case "APROBADO":
        return "border-blue-300 bg-blue-50 dark:bg-blue-900/20"
      case "CANCELADO":
        return "border-red-300 bg-red-50 dark:bg-red-900/20"
      default:
        return "border-primary/30 bg-primary/5"
    }
  }

  return (
    <Card className="mb-6 border border-primary/10 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-primary">
                Filtros de Pagos
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
          {/* Search */}
          <div className="relative col-span-4">
            <FileText className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Buscar ID, nombre..."
              value={busqueda || ""}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-7 h-9 text-sm border-border/50 focus:border-primary"
            />
          </div>

          {/* Status */}
          <div className="relative col-span-2">
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
              {getEstadoIcon(estado || "")}
            </div>
            <Select
              value={estado || ""}
              onValueChange={(value) => setEstado(value || undefined)}
            >
              <SelectTrigger className={cn(
                "pl-7 h-9 text-sm border-border/50 focus:border-primary",
                estado && estado !== "all" && getEstadoBadgeColor(estado)
              )}>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs">Todos</span>
                  </div>
                </SelectItem>
                <SelectItem value="PENDIENTE">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs">Pendiente</span>
                  </div>
                </SelectItem>
                <SelectItem value="PAGADO">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-xs">Pagado</span>
                  </div>
                </SelectItem>
                <SelectItem value="APROBADO">
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-blue-500" />
                    <span className="text-xs">Aprobado</span>
                  </div>
                </SelectItem>
                <SelectItem value="CANCELADO">
                  <div className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-500" />
                    <span className="text-xs">Cancelado</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Instructor */}
          <div className="relative col-span-4">
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
                <SelectItem value="all">Todos los instructores</SelectItem>
                {instructores.map((i) => (
                  <SelectItem key={i.id} value={String(i.id)}>
                    {i.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items Per Page */}
          <div className="relative col-span-2">
            <FileText className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground z-10" />
            <Select
              value={limit.toString()}
              onValueChange={(value) => setLimit(Number(value))}
            >
              <SelectTrigger className={cn(
                "pl-7 h-9 text-sm border-border/50 focus:border-primary",
                limit !== 20 && "border-primary/30 bg-primary/5"
              )}>
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
    </Card>
  )
}
