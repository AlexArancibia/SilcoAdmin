"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/shell"
 
import { InstructorPaymentHistory } from "@/components/instructors/instructor-payment-history"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Calendar, CreditCard, ChevronLeft, ChevronRight } from "lucide-react"
import { useInstructorDetail } from "@/hooks/use-instructor-detail"
import { InstructorDetailSkeleton } from "@/components/instructors/instructor-detail-skeleton"
import { InstructorHeader } from "@/components/instructors/instructor-header"
import { InstructorInfo } from "@/components/instructors/instructor-info"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

export default function InstructorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const instructorId = Number.parseInt(resolvedParams.id)

  if (isNaN(instructorId)) notFound()

  const {
    instructor,
    isLoading,
    isEditing,
    isSaving,
    editedInstructor,
    editedPaymentMetrics,
    handleEditToggle,
    handleSaveChanges,
    handleInputChange,
    handleExtraInfoChange,
    handlePaymentMetricChange,
    pagosPeriodo,
    allPagosInstructor,
    isLoadingAllPagos,
    currentPage,
    setCurrentPage,
    totalPages,
    totalClases,
    clasesCompletadas,
    totalReservas,
    totalLugares,
    totalMonto,
    ocupacionPromedio,
    totalPotentialBonus,
    getCategoriesByDiscipline,
    isLoadingClases,
    isLoadingDisciplinas,
  } = useInstructorDetail(instructorId)

  if (isLoading) {
    return <InstructorDetailSkeleton />
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendiente</Badge>
      case "APROBADO":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Aprobado</Badge>
      case "PAGADO":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Pagado</Badge>
      case "CANCELADO":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelado</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  return (
    <DashboardShell>
      {/* Header Section */}
      <InstructorHeader instructor={instructor} isEditing={isEditing} handleEditToggle={handleEditToggle} />
      
      <InstructorInfo
        instructor={instructor}
        isEditing={isEditing}
        isSaving={isSaving}
        editedInstructor={editedInstructor}
        editedPaymentMetrics={editedPaymentMetrics}
        handleSaveChanges={handleSaveChanges}
        handleInputChange={handleInputChange}
        handleExtraInfoChange={handleExtraInfoChange}
        handlePaymentMetricChange={handlePaymentMetricChange}
        pagosPeriodo={pagosPeriodo}
      />

      {/* Payments Section */}
      <div className="space-y-6">
        <Card className="border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Historial de Pagos
            </CardTitle>
            <CardDescription>
              Registro completo de todos los pagos realizados ({allPagosInstructor.length} pagos)
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isLoadingAllPagos ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : allPagosInstructor.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay pagos registrados para este instructor</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Periodo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Monto Base</TableHead>
                        <TableHead className="text-right">Pago Final</TableHead>
                        <TableHead className="text-right">Retención</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allPagosInstructor.slice(currentPage * 10, (currentPage + 1) * 10).map((pago) => (
                        <TableRow key={pago.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {pago.periodo?.numero ? `Periodo ${pago.periodo.numero}` : `ID ${pago.periodoId}`}
                              </span>
                              {pago.periodo?.año && (
                                <span className="text-sm text-muted-foreground">
                                  {pago.periodo.año}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getEstadoBadge(pago.estado)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            S/ {pago.monto.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            S/ {pago.pagoFinal.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-red-600">
                            -S/ {pago.retencion.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {pago.updatedAt 
                              ? format(new Date(pago.updatedAt), 'dd/MM/yyyy', { locale: es })
                              : format(new Date(pago.createdAt!), 'dd/MM/yyyy', { locale: es })
                            }
                          </TableCell>
                          <TableCell>
                            <Link href={`/pagos/${pago.id}`}>
                              <Button variant="ghost" size="sm">
                                Ver
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {currentPage * 10 + 1} - {Math.min((currentPage + 1) * 10, allPagosInstructor.length)} de {allPagosInstructor.length} pagos
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Página {currentPage + 1} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                        disabled={currentPage === totalPages - 1}
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
