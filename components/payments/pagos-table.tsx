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
  periodos: Periodo[]
  exportarPagoPDF: (pagoId: number) => void
  imprimirPagoPDF: (pagoId: number) => void
}

export function PagosTable({
  paginatedPagos,
  requestSort,
  sortConfig,
  instructores,
  periodos,
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
    const periodo = periodos.find((p) => p.id === periodoId)
    return periodo ? `Periodo ${periodo.numero} - ${periodo.año}` : `Periodo ${periodoId}`
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
    const montoAjustado = pago.monto + reajusteCalculado + bono
    return montoAjustado - pago.retencion
  }

  return (
    <div className="rounded-lg border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="text-foreground font-medium">
              <Button variant="ghost" onClick={() => requestSort("instructorId")} className="text-foreground group">
                Instructor
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              </Button>
            </TableHead>
            <TableHead className="text-foreground font-medium">
              <Button variant="ghost" onClick={() => requestSort("periodoId")} className="text-foreground group">
                Periodo
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              </Button>
            </TableHead>
            <TableHead className="text-foreground font-medium">
              <Button variant="ghost" onClick={() => requestSort("monto")} className="text-foreground group">
                Monto Base
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              </Button>
            </TableHead>
            <TableHead className="text-foreground font-medium">Reajuste</TableHead>
            <TableHead className="text-foreground font-medium">Retención</TableHead>
            <TableHead className="text-foreground font-medium">Monto Final</TableHead>
            <TableHead className="text-foreground font-medium">
              <Button variant="ghost" onClick={() => requestSort("estado")} className="text-primary group">
                Estado
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              </Button>
            </TableHead>
            <TableHead className="text-right text-foreground font-medium">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedPagos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                No se encontraron pagos con los filtros seleccionados.
              </TableCell>
            </TableRow>
          ) : (
            paginatedPagos.map((pago) => {
              const montoFinal = calcularMontoFinal(pago)
              const isEditing = editandoPagoId === pago.id
              const bono = pago.bono || 0

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
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary/60" />
                      {getNombrePeriodo(pago.periodoId)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {formatCurrency(pago.monto)}
                      {bono > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          title={`Bono: ${formatCurrency(bono)}`}
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
                      <div className="flex items-center gap-2">
                        {pago.reajuste > 0 ? (
                          <div className="flex items-center gap-1">
                            <span className="text-green-600">
                              {pago.tipoReajuste === "PORCENTAJE"
                                ? `+${pago.reajuste}%`
                                : `+${formatCurrency(pago.reajuste)}`}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => iniciarEdicionReajuste(pago)}
                            >
                              <FileText className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : pago.reajuste < 0 ? (
                          <div className="flex items-center gap-1">
                            <span className="text-red-600">
                              {pago.tipoReajuste === "PORCENTAJE" ? `${pago.reajuste}%` : formatCurrency(pago.reajuste)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => iniciarEdicionReajuste(pago)}
                            >
                              <FileText className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">-</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => iniciarEdicionReajuste(pago)}
                            >
                              <FileText className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className={pago.retencion > 0 ? "text-red-600 " : ""}>
                    {pago.retencion > 0 ? `-${formatCurrency(pago.retencion)}` : "-"}
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(montoFinal)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getEstadoColor(pago.estado)}>
                      {pago.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Download className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer" onClick={() => exportarPagoPDF(pago.id)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Exportar a PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer" onClick={() => imprimirPagoPDF(pago.id)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/pagos/${pago.id}`)}
                        className="h-8 w-8 p-0 hover:bg-muted/50"
                      >
                        <Eye className="h-4 w-4" />
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
  )
}
