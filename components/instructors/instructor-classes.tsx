"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Calendar, ChevronLeft, ChevronRight, Info } from "lucide-react"
import type { Clase } from "@/types/schema"
import { EmptyState } from "./empty-state"

interface InstructorClassesProps {
  isLoadingClases: boolean
  isLoadingDisciplinas: boolean
  clasesPeriodo: Clase[]
  paymentDetails: any[]
  currentPayments: any[]
  currentPage: number
  setCurrentPage: (page: number) => void
  totalPages: number
}

export function InstructorClasses({
  isLoadingClases,
  isLoadingDisciplinas,
  clasesPeriodo,
  paymentDetails,
  currentPayments,
  currentPage,
  setCurrentPage,
  totalPages,
}: InstructorClassesProps) {
  const formatDate = (date: Date | undefined) => {
    if (!date) return "N/A"
    return format(new Date(date), "dd MMM yyyy", { locale: es })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount)
  }

  return (
    <Card className="card border border-border shadow-sm">
      <CardHeader className="pb-2 px-4 pt-3">
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle className="flex items-center gap-1.5 text-lg">
              <Calendar className="h-4 w-4 text-primary" />
              Clases y cálculo de pagos
            </CardTitle>
            <CardDescription className="text-sm mt-0.5">
              Listado de clases y cálculo de pagos para el instructor
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 pt-2 pb-3">
        {isLoadingClases || isLoadingDisciplinas ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : clasesPeriodo.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-12 w-12" />}
            title="No hay clases"
            description="No hay clases asignadas en el periodo seleccionado."
          />
        ) : (
          <>
            <div className="rounded-lg border border-border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Fecha</TableHead>
                      <TableHead>Disciplina</TableHead>
                      <TableHead>Estudio</TableHead>
                      <TableHead className="w-[180px]">Ocupación</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPayments.map((detail) => (
                      <TableRow key={detail.claseId} className="hover:bg-muted/20">
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            {formatDate(detail.fecha)}
                          </div>
                        </TableCell>
                        <TableCell>{detail.disciplina}</TableCell>
                        <TableCell>{detail.estudio}</TableCell>
                        <TableCell className="w-[180px]">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="flex items-center w-full">
                                <div className="flex items-center w-full">
                                  <Progress
                                    value={(detail.reservas / detail.capacidad) * 100}
                                    className="h-2 mr-2 w-[60px]"
                                  />
                                  <span className="text-xs whitespace-nowrap">
                                    {Math.round((detail.reservas / detail.capacidad) * 100)}% ({detail.reservas}/
                                    {detail.capacidad})
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {detail.reservas} reservas de {detail.capacidad} lugares
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-right font-medium whitespace-nowrap">
                          <TooltipProvider>
                            <Tooltip>
                            <TooltipTrigger className="ml-auto flex items-center gap-1">
                            <span>{formatAmount(detail.montoCalculado)}</span>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent className="w-64 max-w-sm">
                                {detail.detalleCalculo?.error ? (
                                  <p className="text-red-500">Error: {detail.detalleCalculo.error}</p>
                                ) : detail.resultadoCalculo ? (
                                  <div className="space-y-1">
                                    <p className="font-semibold">Detalle de cálculo:</p>
                                    <ul className="text-xs space-y-1">
                                      {detail.detalleCalculo.pasos.map((paso: any, idx: number) => (
                                        <li key={idx} className="flex items-start gap-1">
                                          <span className="text-primary">•</span>
                                          <span>{paso.descripcion}</span>
                                        </li>
                                      ))}
                                    </ul>
                                    {detail.resultadoCalculo.bonoAplicado && (
                                      <div className="mt-2 pt-2 border-t text-xs">
                                        <span className="font-medium text-green-600">Bono potencial: </span>
                                        {formatAmount(detail.resultadoCalculo.bonoAplicado)}
                                        <p className="text-muted-foreground mt-1">
                                          El bono se aplica al final del periodo según cumplimiento de requisitos
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p>No hay detalles disponibles</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 py-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(Math.max(currentPage - 1, 0))}
                  disabled={currentPage === 0}
                  aria-label="Página anterior"
                  className="btn btn-outline btn-icon"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="text-sm text-muted">
                  {currentPage + 1} / {Math.max(1, totalPages)}
                </span>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages - 1))}
                  disabled={currentPage >= totalPages - 1 || totalPages === 0}
                  aria-label="Siguiente página"
                  className="btn btn-outline btn-icon"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
