"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, DollarSign, Eye, ArrowRight, AlertCircle, CheckCircle, Star, Clock, Percent, Hash } from "lucide-react"
import { usePagosStore } from "@/store/usePagosStore"
import type { EstadoPago, PagoInstructor, TipoReajuste } from "@/types/schema"
import Link from "next/link"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useEffect } from "react"

interface PagosProps {
  pagos: PagoInstructor[] | null
}

export function InstructorPaymentHistory({ pagos }: PagosProps) {
  const { isLoading, error } = usePagosStore()
  const { fetchPeriodos } = usePeriodosStore()
  
  useEffect(() => {
    fetchPeriodos()
  }, [fetchPeriodos])

  const formatDate = (date: Date | undefined) => {
    if (!date) return "N/A"
    return format(new Date(date), "dd MMM, yyyy", { locale: es })
  }

  const formatAmount = (amount: number | undefined, currency = "PEN") => {
    if (amount === undefined || isNaN(amount)) return "N/A"
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusBadge = (estado: EstadoPago) => {
    switch (estado) {
      case "APROBADO":
        return { color: "bg-green-100 text-green-800", text: "Aprobado" }
      case "PENDIENTE":
        return { color: "bg-yellow-100 text-yellow-800", text: "Pendiente" }
      default:
        return { color: "bg-gray-100 text-gray-800", text: "Desconocido" }
    }
  }

  const renderReajusteValue = (pago: PagoInstructor) => {
    if (pago.reajuste === undefined) return "N/A"
    if (pago.tipoReajuste === "PORCENTAJE") {
      return `${Math.abs(pago.reajuste)}%`
    }
    return formatAmount(pago.reajuste)
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-destructive mb-2">Error al cargar el historial de pagos</p>
      </div>
    )
  }

  if (pagos && pagos.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <DollarSign className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="text-lg">No hay pagos registrados</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Este instructor no tiene pagos registrados en el sistema.
          </p>
          <Button className="mt-4" size="sm">
            Calcular nuevo pago
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Versión móvil - Cards */}
      <div className="md:hidden space-y-3">
        {pagos && pagos.map((pago) => {
          const statusBadge = getStatusBadge(pago.estado)
          
          return (
            <Card key={pago.id} className="overflow-hidden">
              <CardContent className="p-4 grid gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">
                      {pago.periodo ? 
                        `Periodo ${pago.periodo.numero} - ${pago.periodo.año}` : 
                        `Periodo ${pago.periodoId}`
                      }
                    </h4>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Calendar className="mr-1 h-3.5 w-3.5" />
                      {formatDate(pago.createdAt)}
                    </div>
                  </div>
                  <Badge className={statusBadge.color}>{statusBadge.text}</Badge>
                </div>

                {/* Indicadores rápidos */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {pago.cumpleLineamientos && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Lineamientos
                    </Badge>
                  )}
                  {pago.participacionEventos && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      Eventos
                    </Badge>
                  )}
                  {(pago.dobleteos ?? 0) > 0 && (
                    <Badge variant="outline" className="border-gray-200">
                      {pago.dobleteos} dobleteo{pago.dobleteos && pago.dobleteos > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {(pago.horariosNoPrime ?? 0) > 0 && (
                    <Badge variant="outline" className="border-gray-200">
                      {pago.horariosNoPrime} no prime
                    </Badge>
                  )}
                </div>

                {/* Resumen financiero */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Base</p>
                    <p className="font-medium">{formatAmount(pago.monto)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Retención</p>
                    <p className="text-destructive">{formatAmount(pago.retencion)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Reajuste</p>
                    <p className={(pago.reajuste ?? 0) >= 0 ? "text-green-600" : "text-destructive"}>
                      {renderReajusteValue(pago)}
                    </p>
                  </div>
 
                  <div>
                    <p className="text-muted-foreground text-xs">Cover</p>
                    <p className="text-green-600">{formatAmount(pago.cover)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Penalización</p>
                    <p className="text-destructive">{formatAmount(pago.penalizacion)}</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t">
                    <p className="text-muted-foreground text-xs">Total</p>
                    <div className="flex items-center font-medium text-lg">
                      <ArrowRight className="mr-1 h-4 w-4 text-muted-foreground" />
                      {formatAmount(pago.pagoFinal)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  {pago.comentarios && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {pago.comentarios}
                    </p>
                  )}
                  <Link href={`/pagos/${pago.id}`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Eye className="h-4 w-4" />
                      Detalles
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Versión desktop - Tabla */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Periodo</TableHead>
              <TableHead className="min-w-[100px]">Fecha</TableHead>
              <TableHead>Base</TableHead>
              <TableHead>Retención</TableHead>
              <TableHead>Reajuste</TableHead>
              <TableHead>Cover</TableHead>
              <TableHead>Penalización</TableHead>
              <TableHead className="whitespace-nowrap">Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagos && pagos.map((pago) => {
              const statusBadge = getStatusBadge(pago.estado)
              
              return (
                <TableRow key={pago.id}>
                  <TableCell className="whitespace-nowrap">
                    {pago.periodo ? (
                      <div className="font-medium">
                        Periodo {pago.periodo.numero} - {pago.periodo.año}
                      </div>
                    ) : (
                      <div className="font-medium">Periodo {pago.periodoId}</div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {pago.cumpleLineamientos ? 'Cumple' : 'No cumple'} lineamientos
                      {(pago.dobleteos ?? 0) > 0 && ` • ${pago.dobleteos} dobleteo${pago.dobleteos && pago.dobleteos > 1 ? 's' : ''}`}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                      {formatDate(pago.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="font-medium">{formatAmount(pago.monto)}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="text-destructive">
                      {formatAmount(pago.retencion)}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className={(pago.reajuste ?? 0) >= 0 ? "text-green-600" : "text-destructive"}>
                      {renderReajusteValue(pago)}
                    </div>
                  </TableCell>
 
                  <TableCell className="whitespace-nowrap">
                    <div className="text-green-600">
                      {formatAmount(pago.cover)}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="text-destructive">
                      {formatAmount(pago.penalizacion)}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center font-medium">
                      <ArrowRight className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                      {formatAmount(pago.pagoFinal)}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge className={statusBadge.color}>{statusBadge.text}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/pagos/${pago.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver detalles</span>
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}