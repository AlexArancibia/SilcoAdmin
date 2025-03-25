"use client"

import { useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, DollarSign, FileText, Download, Eye } from "lucide-react"
import { usePagosStore } from "@/store/usePagosStore"
import type { EstadoPago } from "@/types/schema"

interface InstructorPaymentHistoryProps {
  instructorId: number
}

export function InstructorPaymentHistory({ instructorId }: InstructorPaymentHistoryProps) {
  const { pagos, isLoading, error, fetchPagos } = usePagosStore()

  useEffect(() => {
    fetchPagos({ instructorId })
  }, [fetchPagos, instructorId])

  // Formatear fecha
  const formatDate = (date: Date | undefined) => {
    if (!date) return "N/A"
    return format(new Date(date), "dd MMMM, yyyy", { locale: es })
  }

  // Formatear monto
  const formatAmount = (amount: number, currency = "MXN") => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency,
    }).format(amount)
  }

  // Obtener color y texto según el estado del pago
  const getStatusBadge = (estado: EstadoPago) => {
    switch (estado) {
      case "APROBADO":
        return { color: "bg-green-100 text-green-800", text: "Aprobado" }
      case "PENDIENTE":
        return { color: "bg-yellow-100 text-yellow-800", text: "Pendiente" }
      case "RECHAZADO":
        return { color: "bg-red-100 text-red-800", text: "Rechazado" }
      default:
        return { color: "bg-gray-100 text-gray-800", text: "Desconocido" }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-destructive mb-2">Error al cargar el historial de pagos</p>
        <Button variant="outline" size="sm" onClick={() => fetchPagos({ instructorId })}>
          Reintentar
        </Button>
      </div>
    )
  }

  if (pagos.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <DollarSign className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-medium">No hay pagos registrados</h3>
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Periodo</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagos.map((pago) => {
              const statusBadge = getStatusBadge(pago.estado)
              return (
                <TableRow key={pago.id}>
                  <TableCell>
                    {pago.periodo ? (
                      <div className="font-medium">
                        Periodo {pago.periodo.numero} - {pago.periodo.año}
                      </div>
                    ) : (
                      <div className="font-medium">Periodo {pago.periodoId}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                      {formatDate(pago.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatAmount(pago.monto)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusBadge.color}>{statusBadge.text}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver detalles</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <FileText className="h-4 w-4" />
                        <span className="sr-only">Ver recibo</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Descargar</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => (window.location.href = `/pagos?instructorId=${instructorId}`)}>
          Ver todos los pagos
        </Button>
      </div>
    </div>
  )
}

