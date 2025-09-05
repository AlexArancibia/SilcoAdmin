"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowUpDown, Calendar, Download, Eye, FileText, Printer, Calculator, RefreshCw, HelpCircle, MoreHorizontal } from "lucide-react"
import { usePagosStore } from "@/store/usePagosStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { ReajusteEditor } from "./reajuste-editor"
import type { PagoInstructor, Instructor, Periodo, EstadoPago, TipoReajuste } from "@/types/schema"
import { InstructorWithCategory } from "./instructor-with-category"
import { useReajuste } from "@/hooks/use-reajuste"
import { useToast } from "@/components/ui/use-toast"
import { ScrollableTable, ScrollableTableColumn, TableCellComponents } from "@/components/ui/scrollable-table"



export function PagosTable() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const {
    pagos,
    pagination,
    isLoading,
    error,
    fetchPagos,
  } = usePagosStore()
  const { instructores, fetchInstructores } = useInstructoresStore()
  const { periodos, fetchPeriodos } = usePeriodosStore()

  const {
    editandoPagoId,
    nuevoReajuste,
    tipoReajuste,
    isActualizandoReajuste,
    setNuevoReajuste,
    setTipoReajuste,
    iniciarEdicionReajuste,
    cancelarEdicionReajuste,
    actualizarReajuste,
  } = useReajuste()

  // Estado para recálculo
  const [recalculandoPagoId, setRecalculandoPagoId] = useState<number | null>(null)

  useEffect(() => {
    if (instructores.length === 0) {
      fetchInstructores()
    }
    if (periodos.length === 0) {
      fetchPeriodos()
    }
  }, [instructores.length, periodos.length, fetchInstructores, fetchPeriodos])

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  // Función para recalcular un pago específico
  const recalcularPago = async (pagoInstructor: PagoInstructor) => {
    setRecalculandoPagoId(pagoInstructor.id)
    
    try {
      const response = await fetch(`/api/pagos/calculo/${pagoInstructor.instructorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          periodoId: pagoInstructor.periodoId,
          categoriasManuales: {},
        }),
      })

      if (response.ok) {
        const resultado = await response.json()
        toast({
          title: "Recálculo completado",
          description: `Pago recalculado correctamente para ${getNombreInstructor(pagoInstructor.instructorId)}`,
        })
        
        // Refrescar la lista de pagos
        fetchPagos({
          page: pagination?.page,
          limit: pagination?.limit,
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al recalcular')
      }
    } catch (error) {
      console.error('Error al recalcular pago:', error)
      toast({
        title: "Error en recálculo",
        description: error instanceof Error ? error.message : "Error desconocido al recalcular el pago",
        variant: "destructive",
      })
    } finally {
      setRecalculandoPagoId(null)
    }
  }

  // Función modificada para actualizar reajuste y recalcular automáticamente
  const actualizarReajusteYRecalcular = async (pagoId: number, nuevoReajusteValor: number, tipoReajusteValor: TipoReajuste) => {
    try {
      // Setear los valores globales antes de actualizar
      setNuevoReajuste(nuevoReajusteValor)
      setTipoReajuste(tipoReajusteValor)
      // Solo actualizar el reajuste, no recalcular aquí
      await actualizarReajuste(pagoId)
      // Refrescar la lista de pagos después de actualizar el reajuste
      fetchPagos({
        page: pagination?.page,
        limit: pagination?.limit,
      })
    } catch (error) {
      console.error('Error al actualizar reajuste:', error)
      toast({
        title: "Error",
        description: "Error al actualizar el reajuste",
        variant: "destructive",
      })
    }
  }

  // Función para generar páginas visibles con ellipsis cuando sea necesario
  const getVisiblePages = () => {
    if (!pagination || pagination.totalPages <= 1) return []

    const current = pagination.page
    const total = pagination.totalPages
    const pages: (number | string)[] = []

    if (total <= 7) {
      // Si hay 7 páginas o menos, mostrar todas
      for (let i = 1; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // Siempre mostrar la primera página
      pages.push(1)

      if (current <= 4) {
        // Si estamos cerca del inicio
        for (let i = 2; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(total)
      } else if (current >= total - 3) {
        // Si estamos cerca del final
        pages.push('...')
        for (let i = total - 4; i <= total; i++) {
          pages.push(i)
        }
      } else {
        // Si estamos en el medio
        pages.push('...')
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(total)
      }
    }

    return pages
  }

  // Helper functions
  const getNombrePeriodo = (periodoId: number): string => {
    const periodo = periodos.find((p) => p.id === periodoId)
    return periodo ? `${periodo.numero}-${periodo.año}` : `${periodoId}`
  }

  const getNombreInstructor = (instructorId: number): string => {
    const instructor = instructores.find((i) => i.id === instructorId)
    return instructor?.nombre || `Instructor ${instructorId}`
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getEstadoColor = (estado: EstadoPago): string => {
    switch (estado) {
      case "APROBADO":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  // Configuración de columnas para ScrollableTable
  const columns: ScrollableTableColumn<PagoInstructor>[] = useMemo(() => [
    {
      key: "instructor",
      header: "Instructor",
      cell: (pago) => (
        <InstructorWithCategory
          instructorId={pago.instructorId}
          periodoId={pago.periodoId}
          instructores={instructores}
        />
      ),
      sortable: true,
      width: "200px",
    },
    {
      key: "periodo",
      header: "Periodo",
      cell: (pago) => (
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-primary/60" />
          <span>{getNombrePeriodo(pago.periodoId)}</span>
        </div>
      ),
      sortable: true,
      width: "150px",
    },
    {
      key: "monto",
      header: "Monto Base",
      cell: (pago) => (
        <TableCellComponents.Currency amount={pago.monto} />
      ),
      sortable: true,
      width: "120px",
    },
    {
      key: "bonos",
      header: "Bonos",
      cell: (pago) => {
        const bono = pago.bono ?? 0
        const cover = pago.cover ?? 0
        const brandeo = pago.brandeo ?? 0
        const themeRide = pago.themeRide ?? 0
        const workshop = pago.workshop ?? 0
        const versus = pago.bonoVersus ?? 0
        const totalBonos = bono + cover + brandeo + themeRide + workshop + versus

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help flex items-center gap-1">
                  {totalBonos > 0 ? (
                    <span className="text-green-600 text-sm font-medium">
                      +{formatCurrency(totalBonos)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                  <HelpCircle className="h-3 w-3 text-muted-foreground opacity-60" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <div className="font-medium text-xs">Detalle de Bonos:</div>
                  {cover > 0 && (
                    <div className="text-xs">
                      <span className="text-green-600">Cover:</span> +{formatCurrency(cover)}
                    </div>
                  )}
                  {brandeo > 0 && (
                    <div className="text-xs">
                      <span className="text-green-600">Brandeo:</span> +{formatCurrency(brandeo)}
                    </div>
                  )}
                  {themeRide > 0 && (
                    <div className="text-xs">
                      <span className="text-green-600">Theme Ride:</span> +{formatCurrency(themeRide)}
                    </div>
                  )}
                  {workshop > 0 && (
                    <div className="text-xs">
                      <span className="text-green-600">Workshop:</span> +{formatCurrency(workshop)}
                    </div>
                  )}
                  {versus > 0 && (
                    <div className="text-xs">
                      <span className="text-green-600">Versus:</span> +{formatCurrency(versus)}
                    </div>
                  )}
                  {totalBonos === 0 && (
                    <div className="text-xs text-muted-foreground">Sin bonos aplicados</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
      width: "150px",
    },
    {
      key: "reajuste",
      header: "Reajuste",
      cell: (pago) => {
        const isEditing = editandoPagoId === pago.id
        const reajusteCalculado = pago.tipoReajuste === "PORCENTAJE"
          ? (pago.monto * pago.reajuste) / 100
          : pago.reajuste

        return isEditing ? (
          <ReajusteEditor
            nuevoReajuste={nuevoReajuste}
            setNuevoReajuste={setNuevoReajuste}
            tipoReajuste={tipoReajuste}
            setTipoReajuste={setTipoReajuste}
            isActualizandoReajuste={isActualizandoReajuste}
            pagoId={pago.id}
            actualizarReajuste={(pagoId: number): void => {
              void actualizarReajusteYRecalcular(pagoId, nuevoReajuste, tipoReajuste)
            }}
            cancelarEdicionReajuste={cancelarEdicionReajuste}
          />
        ) : (
          <div className="flex items-center gap-1">
            {reajusteCalculado > 0 ? (
              <span className="text-green-600 text-sm">
                {pago.tipoReajuste === "PORCENTAJE"
                  ? `+${pago.reajuste}%`
                  : `+${formatCurrency(pago.reajuste)}`}
              </span>
            ) : reajusteCalculado < 0 ? (
              <span className="text-red-600 text-sm">
                {pago.tipoReajuste === "PORCENTAJE"
                  ? `${pago.reajuste}%`
                  : formatCurrency(pago.reajuste)}
              </span>
            ) : (
              <span className="text-muted-foreground text-sm">-</span>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0"
              onClick={() => iniciarEdicionReajuste(pago)}
            >
              <FileText className="h-3 w-3" />
            </Button>
          </div>
        )
      },
      width: "150px",
    },
    {
      key: "penalizacion",
      header: "Penalización",
      cell: (pago) => {
        const penalizacion = pago.penalizacion ?? 0
        const reajusteCalculado = pago.tipoReajuste === "PORCENTAJE"
          ? (pago.monto * pago.reajuste) / 100
          : pago.reajuste
        const bono = pago.bono ?? 0
        const cover = pago.cover ?? 0
        const brandeo = pago.brandeo ?? 0
        const themeRide = pago.themeRide ?? 0
        const workshop = pago.workshop ?? 0
        const versus = pago.bonoVersus ?? 0
        const totalBonos = bono + cover + brandeo + themeRide + workshop + versus

        return penalizacion > 0 ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help flex flex-col">
                  <span className="text-red-600 text-sm">-{formatCurrency(penalizacion)}</span>
                  <span className="text-[10px] text-muted-foreground">
                    ({pago.detalles?.penalizaciones?.descuento || ((penalizacion / (pago.monto + reajusteCalculado + totalBonos)) * 100).toFixed(1)}%)
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-2">
                  <div className="font-medium text-xs">Detalle de Penalización:</div>
                  {pago.detalles?.penalizaciones?.detalle ? (
                    <div className="space-y-1">
                      <div className="text-xs">
                        <span className="font-medium">Puntos totales:</span> {pago.detalles.penalizaciones.puntos}
                      </div>
                      <div className="text-xs">
                        <span className="font-medium">Puntos permitidos:</span> {pago.detalles.penalizaciones.maxPermitidos}
                      </div>
                      <div className="text-xs">
                        <span className="font-medium">Puntos excedentes:</span> {pago.detalles.penalizaciones.excedentes}
                      </div>
                      <div className="text-xs">
                        <span className="font-medium">Descuento aplicado:</span> {pago.detalles.penalizaciones.descuento}%
                      </div>
                      {pago.detalles.penalizaciones.detalle && pago.detalles.penalizaciones.detalle.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-medium">Penalizaciones aplicadas:</div>
                          <div className="space-y-1 max-h-20 overflow-y-auto">
                            {pago.detalles.penalizaciones.detalle.map((pen: any, index: number) => (
                              <div key={index} className="text-xs text-muted-foreground">
                                • {pen.tipo}: {pen.puntos} pts - {pen.descripcion}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Sin detalles de penalización disponibles
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )
      },
      width: "150px",
    },
    {
      key: "retencion",
      header: "Retención",
      cell: (pago) => {
        const retencion = pago.retencion ?? 0
        return retencion > 0 ? (
          <span className="text-red-600 text-sm">-{formatCurrency(retencion)}</span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )
      },
      width: "120px",
    },
    {
      key: "total",
      header: "Total",
      cell: (pago) => (
        <span className="font-medium">
          {formatCurrency(pago.pagoFinal)}
        </span>
      ),
      sortable: true,
      width: "120px",
    },
    {
      key: "estado",
      header: "Estado",
      cell: (pago) => (
        <Badge
          variant="outline"
          className={`text-xs ${getEstadoColor(pago.estado)}`}
        >
          {pago.estado === "APROBADO" ? "APR" : "PEN"}
        </Badge>
      ),
      sortable: true,
      width: "100px",
    },
    {
      key: "actions",
      header: "Acciones",
      cell: (pago) => {
        const isRecalculating = recalculandoPagoId === pago.id
        return (
          <TableCellComponents.Actions>
            {/* Botón de recálculo */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-muted/50"
              onClick={() => recalcularPago(pago)}
              disabled={isRecalculating}
              title="Recalcular pago"
            >
              {isRecalculating ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Calculator className="h-3 w-3" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[150px]">
                <DropdownMenuItem
                  className="cursor-pointer text-sm"
                  onClick={() => router.push(`/pagos/${pago.id}/exportar`)}
                >
                  <FileText className="mr-2 h-3 w-3" />
                  Exportar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-sm"
                  onClick={() => router.push(`/pagos/${pago.id}/imprimir`)}
                >
                  <Printer className="mr-2 h-3 w-3" />
                  Imprimir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/pagos/${pago.id}`)}
              className="h-7 w-7 p-0 hover:bg-muted/50"
            >
              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </TableCellComponents.Actions>
        )
      },
      width: "150px",
      sticky: "right",
    },
  ], [
    instructores,
    editandoPagoId,
    nuevoReajuste,
    setNuevoReajuste,
    tipoReajuste,
    setTipoReajuste,
    isActualizandoReajuste,
    actualizarReajusteYRecalcular,
    cancelarEdicionReajuste,
    iniciarEdicionReajuste,
    recalcularPago,
    recalculandoPagoId,
    router
  ]);

  // Los estados de carga, error y vacío ahora se manejan en ScrollableTable

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagos de Instructores</CardTitle>
        <CardDescription>
          {pagination ? `Mostrando ${pagination.page} de ${pagination.totalPages} páginas (${pagination.total} pagos total)` : "Cargando..."}
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto w-fit">
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="">
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-foreground font-medium">
                <Button
                  variant="ghost"
                  onClick={() => router.push(`${pathname}?sort=instructorId`)}
                  className="text-foreground group"
                >
                  Instructor
                  <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Button>
              </TableHead>
              <TableHead className="text-foreground font-medium">
                <Button
                  variant="ghost"
                  onClick={() => router.push(`${pathname}?sort=periodoId`)}
                  className="text-foreground group"
                >
                  Periodo
                  <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Button>
              </TableHead>
              <TableHead className="text-foreground font-medium">
                <Button
                  variant="ghost"
                  onClick={() => router.push(`${pathname}?sort=monto`)}
                  className="text-foreground group"
                >
                  Monto Base
                  <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Button>
              </TableHead>
              <TableHead className="text-foreground font-medium">
                <div className="flex items-center gap-1">
                  Bonos
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">Hover para ver el detalle de cada bono</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
              <TableHead className="text-foreground font-medium">Reajuste</TableHead>
              <TableHead className="text-foreground font-medium w-32">Penalización</TableHead>
              <TableHead className="text-foreground font-medium">Retención</TableHead>
              <TableHead className="text-foreground font-medium">Total</TableHead>
              <TableHead className="text-foreground font-medium">
                <Button
                  variant="ghost"
                  onClick={() => router.push(`${pathname}?sort=estado`)}
                  className="text-primary group"
                >
                  Estado
                  <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Button>
              </TableHead>
              <TableHead className="text-right text-foreground font-medium">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                  No se encontraron pagos
                </TableCell>
              </TableRow>
            ) : (
              pagos.map((pago) => {
                const isEditing = editandoPagoId === pago.id
                const isRecalculating = recalculandoPagoId === pago.id
                const bono = pago.bono ?? 0
                const penalizacion = pago.penalizacion ?? 0
                const cover = pago.cover ?? 0
                const brandeo = pago.brandeo ?? 0
                const themeRide = pago.themeRide ?? 0
                const workshop = pago.workshop ?? 0
                const versus = pago.bonoVersus ?? 0
                
                // Calcular total de bonos
                const totalBonos = bono + cover + brandeo + themeRide + workshop + versus
                
                // El campo penalizacion ya contiene el monto calculado por el backend
                const montoPenalizacion = penalizacion
                
                const reajusteCalculado = pago.tipoReajuste === "PORCENTAJE"
                  ? (pago.monto * pago.reajuste) / 100
                  : pago.reajuste
                const retencion = pago.retencion ?? 0
                const total = pago.pagoFinal

                return (
                  <TableRow key={pago.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <InstructorWithCategory
                        instructorId={pago.instructorId}
                        periodoId={pago.periodoId}
                        instructores={instructores}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-primary/60" />
                        <span>{getNombrePeriodo(pago.periodoId)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(pago.monto)}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help flex items-center gap-1">
                              {cover + brandeo + themeRide + workshop + versus > 0 ? (
                                <span className="text-green-600 text-sm font-medium">
                                  +{formatCurrency(cover + brandeo + themeRide + workshop + versus)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                              <HelpCircle className="h-3 w-3 text-muted-foreground opacity-60" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="space-y-1">
                              <div className="font-medium text-xs">Detalle de Bonos:</div>
                              {cover > 0 && (
                                <div className="text-xs">
                                  <span className="text-green-600">Cover:</span> +{formatCurrency(cover)}
                                </div>
                              )}
                              {brandeo > 0 && (
                                <div className="text-xs">
                                  <span className="text-green-600">Brandeo:</span> +{formatCurrency(brandeo)}
                                </div>
                              )}
                              {themeRide > 0 && (
                                <div className="text-xs">
                                  <span className="text-green-600">Theme Ride:</span> +{formatCurrency(themeRide)}
                                </div>
                              )}
                              {workshop > 0 && (
                                <div className="text-xs">
                                  <span className="text-green-600">Workshop:</span> +{formatCurrency(workshop)}
                                </div>
                              )}
                              {versus > 0 && (
                                <div className="text-xs">
                                  <span className="text-green-600">Versus:</span> +{formatCurrency(versus)}
                                </div>
                              )}
                              {(cover === 0 && brandeo === 0 && themeRide === 0 && workshop === 0 && versus === 0) && (
                                <div className="text-xs text-muted-foreground">Sin bonos aplicados</div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <ReajusteEditor
                          nuevoReajuste={nuevoReajuste}
                          setNuevoReajuste={setNuevoReajuste}
                          tipoReajuste={tipoReajuste}
                          setTipoReajuste={setTipoReajuste}
                          isActualizandoReajuste={isActualizandoReajuste}
                          pagoId={pago.id}
                          actualizarReajuste={(pagoId: number): void => {
                            void actualizarReajusteYRecalcular(pagoId, nuevoReajuste, tipoReajuste)
                          }}
                          cancelarEdicionReajuste={cancelarEdicionReajuste}
                        />
                      ) : (
                        <div className="flex items-center gap-1">
                          {reajusteCalculado > 0 ? (
                            <span className="text-green-600 text-sm">
                              {pago.tipoReajuste === "PORCENTAJE"
                                ? `+${pago.reajuste}%`
                                : `+${formatCurrency(pago.reajuste)}`}
                            </span>
                          ) : reajusteCalculado < 0 ? (
                            <span className="text-red-600 text-sm">
                              {pago.tipoReajuste === "PORCENTAJE"
                                ? `${pago.reajuste}%`
                                : formatCurrency(pago.reajuste)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={() => iniciarEdicionReajuste(pago)}
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="w-32">
                      {montoPenalizacion > 0 ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help flex flex-col">
                                <span className="text-red-600 text-sm">-{formatCurrency(montoPenalizacion)}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  ({pago.detalles?.penalizaciones?.descuento || ((montoPenalizacion / (pago.monto + reajusteCalculado + totalBonos)) * 100).toFixed(1)}%)
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-2">
                                <div className="font-medium text-xs">Detalle de Penalización:</div>
                                {pago.detalles?.penalizaciones?.detalle ? (
                                  <div className="space-y-1">
                                    <div className="text-xs">
                                      <span className="font-medium">Puntos totales:</span> {pago.detalles.penalizaciones.puntos}
                                    </div>
                                    <div className="text-xs">
                                      <span className="font-medium">Puntos permitidos:</span> {pago.detalles.penalizaciones.maxPermitidos}
                                    </div>
                                    <div className="text-xs">
                                      <span className="font-medium">Puntos excedentes:</span> {pago.detalles.penalizaciones.excedentes}
                                    </div>
                                    <div className="text-xs">
                                      <span className="font-medium">Descuento aplicado:</span> {pago.detalles.penalizaciones.descuento}%
                                    </div>
                                    {pago.detalles.penalizaciones.detalle && pago.detalles.penalizaciones.detalle.length > 0 && (
                                      <div className="mt-2">
                                        <div className="text-xs font-medium">Penalizaciones aplicadas:</div>
                                        <div className="space-y-1 max-h-20 overflow-y-auto">
                                          {pago.detalles.penalizaciones.detalle.map((pen: any, index: number) => (
                                            <div key={index} className="text-xs text-muted-foreground">
                                              • {pen.tipo}: {pen.puntos} pts - {pen.descripcion}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground">
                                    Sin detalles de penalización disponibles
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {retencion > 0 ? (
                        <span className="text-red-600 text-sm">-{formatCurrency(retencion)}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getEstadoColor(pago.estado)}`}
                      >
                        {pago.estado === "APROBADO" ? "APR" : "PEN"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Botón de recálculo */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-muted/50"
                          onClick={() => recalcularPago(pago)}
                          disabled={isRecalculating}
                          title="Recalcular pago"
                        >
                          {isRecalculating ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Calculator className="h-3 w-3" />
                          )}
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-[150px]">
                            <DropdownMenuItem
                              className="cursor-pointer text-sm"
                              onClick={() => router.push(`/pagos/${pago.id}/exportar`)}
                            >
                              <FileText className="mr-2 h-3 w-3" />
                              Exportar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-sm"
                              onClick={() => router.push(`/pagos/${pago.id}/imprimir`)}
                            >
                              <Printer className="mr-2 h-3 w-3" />
                              Imprimir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/pagos/${pago.id}`)}
                          className="h-7 w-7 p-0 hover:bg-muted/50"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
            </Table>
          </div>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (pagination.hasPrev) {
                      handlePageChange(pagination.page - 1)
                    }
                  }}
                  className={!pagination.hasPrev ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {getVisiblePages().map((page, index) => (
                <PaginationItem key={index}>
                  {page === "..." ? (
                    <span className="mx-1 px-2">...</span>
                  ) : (
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(Number(page))
                      }}
                      isActive={pagination.page === page}
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (pagination.hasNext) {
                      handlePageChange(pagination.page + 1)
                    }
                  }}
                  className={!pagination.hasNext ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  )
}