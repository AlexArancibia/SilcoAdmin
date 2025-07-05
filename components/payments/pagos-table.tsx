"use client"

import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowUpDown, Calendar, Download, Eye, FileText, Printer } from "lucide-react"
import { ReajusteEditor } from "./reajuste-editor"
import type { PagoInstructor, Instructor, Periodo, EstadoPago } from "@/types/schema"
import { InstructorWithCategory } from "./instructor-with-category"
import { useReajuste } from "@/hooks/use-reajuste"

interface PagosTableProps {
  paginatedPagos: PagoInstructor[]
  requestSort: (key: string) => void
  sortConfig: { key: string; direction: "asc" | "desc" }
  instructores: Instructor[]
  periodosSeleccionados: Periodo[]
  exportarPagoPDF: (pagoId: number) => void
  imprimirPagoPDF: (pagoId: number) => void
}

export function PagosTable({
  paginatedPagos,
  requestSort,
  sortConfig,
  instructores,
  periodosSeleccionados,
  exportarPagoPDF,
  imprimirPagoPDF,
}: PagosTableProps) {
  const router = useRouter()
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

  // Helper functions
  const getNombrePeriodo = (periodoId: number): string => {
    const periodo = periodosSeleccionados.find((p) => p.id === periodoId)
    return periodo ? `${periodo.numero}-${periodo.año}` : `${periodoId}`
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

  const calcularMontoFinal = (pago: PagoInstructor): number => {
    const bono = pago.bono || 0
    const reajusteCalculado = pago.tipoReajuste === "PORCENTAJE" ? (pago.monto * pago.reajuste) / 100 : pago.reajuste
    const penalizacion = pago.penalizacion || 0
    const cover = pago.cover || 0
    
    const montoAjustado = pago.monto + reajusteCalculado + bono + cover - penalizacion - pago.retencion
    return pago.pagoFinal !== undefined ? pago.pagoFinal : montoAjustado
  }

  const filteredPaginatedPagos = paginatedPagos.filter((pago) => {
    return periodosSeleccionados.length === 0 || periodosSeleccionados.some((periodo) => periodo.id === pago.periodoId)
  })

  return (
    <div className="rounded-lg border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-foreground font-medium">
                <Button variant="ghost" onClick={() => requestSort("instructorId")} className="text-foreground group">
                  Instructor
                  <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Button>
              </TableHead>
              <TableHead className="text-foreground font-medium">
                <Button variant="ghost" onClick={() => requestSort("periodoId")} className="text-foreground group">
                  Periodo
                  <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Button>
              </TableHead>
              <TableHead className="text-foreground font-medium">
                <Button variant="ghost" onClick={() => requestSort("monto")} className="text-foreground group">
                  Monto
                  <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Button>
              </TableHead>
              <TableHead className="text-foreground font-medium">Reajuste</TableHead>
              <TableHead className="text-foreground font-medium">Final</TableHead>
              <TableHead className="text-foreground font-medium">
                <Button variant="ghost" onClick={() => requestSort("estado")} className="text-primary group">
                  Estado
                  <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Button>
              </TableHead>
              <TableHead className="text-right text-foreground font-medium">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPaginatedPagos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No se encontraron pagos
                </TableCell>
              </TableRow>
            ) : (
              filteredPaginatedPagos.map((pago) => {
                const montoFinal = calcularMontoFinal(pago)
                const isEditing = editandoPagoId === pago.id
                const bono = pago.bono || 0
                const penalizacion = pago.penalizacion || 0
                const cover = pago.cover || 0

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
                      <div className="flex flex-col">
                        <span>{formatCurrency(pago.monto)}</span>
                        {bono > 0 && (
                          <Badge
                            variant="outline"
                            className="mt-1 w-fit bg-green-50 text-green-700 border-green-200 hover:bg-green-100 text-xs"
                          >
                            +{formatCurrency(bono)}
                          </Badge>
                        )}
                      </div>
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
                          actualizarReajuste={actualizarReajuste}
                          cancelarEdicionReajuste={cancelarEdicionReajuste}
                        />
                      ) : (
                        <div className="flex items-center gap-1">
                          {pago.reajuste > 0 ? (
                            <span className="text-green-600 text-sm">
                              {pago.tipoReajuste === "PORCENTAJE"
                                ? `+${pago.reajuste}%`
                                : `+${formatCurrency(pago.reajuste)}`}
                            </span>
                          ) : pago.reajuste < 0 ? (
                            <span className="text-red-600 text-sm">
                              {pago.tipoReajuste === "PORCENTAJE" ? `${pago.reajuste}%` : formatCurrency(pago.reajuste)}
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
                    <TableCell className="font-medium text-sm">
                      {formatCurrency(montoFinal)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getEstadoColor(pago.estado)}`}>
                        {pago.estado === "APROBADO" ? "APR" : "PEN"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-[150px]">
                            <DropdownMenuItem 
                              className="cursor-pointer text-sm"
                              onClick={() => exportarPagoPDF(pago.id)}
                            >
                              <FileText className="mr-2 h-3 w-3" />
                              Exportar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer text-sm"
                              onClick={() => imprimirPagoPDF(pago.id)}
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
  )
}