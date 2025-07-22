"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from 'next/navigation'
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { useCalculation } from "@/hooks/use-calculation"
import { CalculateDialog } from "@/components/payments/dialogs/calculate-dialog"
import { ProcessLogsDialog } from "@/components/payments/dialogs/process-logs-dialog"
import { FormulaDuplicationDialog } from "@/components/payments/dialogs/formula-duplication-dialog"
import { CalculateBonosDialog } from "@/components/payments/dialogs/calculate-bonos-dialog"
import { PageHeader } from "@/components/payments/page-header"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PagosTable } from "@/components/payments/pagos-table"
import { PagosFilter } from "@/components/payments/pagos-filter"
import { DashboardShell } from "@/components/dashboard/shell"
import type { EstadoPago } from "@/types/schema"
import { usePagosStore } from "@/store/usePagosStore"

export default function PagosPage() {
  const [showCalculateDialog, setShowCalculateDialog] = useState(false)
  const [showProcessLogsDialog, setShowProcessLogsDialog] = useState(false)
  const [showCalculateBonosDialog, setShowCalculateBonosDialog] = useState(false)
  const { pagos } = usePagosStore()
  const { periodos, fetchPeriodos } = usePeriodosStore()
  const { instructores, fetchInstructores } = useInstructoresStore()

  const {
    isCalculatingPayments,
    processLogs,
    selectedPeriodoId,
    setSelectedPeriodoId,
    calcularPagosPeriodo,
    showFormulaDuplicationDialog,
    setShowFormulaDuplicationDialog,
    periodoOrigenFormulas,
    isDuplicatingFormulas,
    handleDuplicateFormulas,
    selectedInstructorId,
    setSelectedInstructorId,
    selectedDisciplinaId,
    setSelectedDisciplinaId,
    manualCategoria,
    setManualCategoria,
    manualCategorias,
    agregarCategoriaManual,
    eliminarCategoriaManual,
    aplicarCategoriasManual,
    isCalculatingBonuses,
    periodosSeleccionadosParaBono,
    setPeriodosSeleccionadosParaBono,
    verificarBonoCalculado,
    obtenerPeriodosDisponiblesParaBono,
    togglePeriodoParaBono,
    calcularBonosPeriodo,
  } = useCalculation(setShowProcessLogsDialog, setShowCalculateDialog)

  const searchParams = useSearchParams();
  const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;
  const estado = (searchParams.get("estado") as EstadoPago) || undefined;
  const instructorId = searchParams.get("instructorId") ? parseInt(searchParams.get("instructorId")!) : undefined;
  const periodoId = searchParams.get("periodoId") ? parseInt(searchParams.get("periodoId")!) : undefined;
  const busqueda = searchParams.get("busqueda") || undefined;
  const { fetchPagos } = usePagosStore()

  useEffect(() => {
    fetchPagos({ page, limit, estado, instructorId, periodoId, busqueda })
  }, [page, limit, estado, instructorId, periodoId, busqueda, fetchPagos])

  useEffect(() => {
    if (periodos.length === 0) {
      fetchPeriodos()
    }
    if (instructores.length === 0) {
      fetchInstructores()
    }
  }, [periodos.length, instructores.length, fetchPeriodos, fetchInstructores])

  return (
    <DashboardShell>
      <PageHeader
        periodosSeleccionados={[]}
        exportarTodosPagosPDF={() => {}}
        exportarTodosExcel={() => {}}
        imprimirTodosPagosPDF={() => {}}
        isCalculatingPayments={isCalculatingPayments}
        setShowCalculateDialog={() => setShowCalculateDialog(true)}
        setShowCalculateBonosDialog={() => setShowCalculateBonosDialog(true)}
      />
      <div className="grid gap-4">


        <PagosFilter
          initialPage={page}
          initialLimit={limit}
          initialEstado={estado}
          initialInstructorId={instructorId}
          initialPeriodoId={periodoId}
          initialBusqueda={busqueda}
        />

        <Suspense
          key={`${page}-${limit}-${estado}-${instructorId}-${periodoId}-${busqueda}`}
          fallback={
            <Card>
              <CardHeader>
                <CardTitle>Pagos</CardTitle>
                <CardDescription>Cargando pagos...</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: limit }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          }
        >
          <PagosTable />
        </Suspense>
      </div>
      <CalculateDialog
        showCalculateDialog={showCalculateDialog}
        setShowCalculateDialog={setShowCalculateDialog}
        periodos={periodos}
        selectedPeriodoId={selectedPeriodoId}
        setSelectedPeriodoId={setSelectedPeriodoId}
        calcularPagosPeriodo={calcularPagosPeriodo}
        instructores={instructores}
        selectedInstructorId={selectedInstructorId}
        setSelectedInstructorId={setSelectedInstructorId}
        selectedDisciplinaId={selectedDisciplinaId}
        setSelectedDisciplinaId={setSelectedDisciplinaId}
        manualCategoria={manualCategoria}
        setManualCategoria={setManualCategoria}
        manualCategorias={manualCategorias}
        agregarCategoriaManual={agregarCategoriaManual}
        eliminarCategoriaManual={eliminarCategoriaManual}
        aplicarCategoriasManual={aplicarCategoriasManual}
        isCalculatingPayments={isCalculatingPayments}
      />
      <ProcessLogsDialog
        showProcessLogsDialog={showProcessLogsDialog}
        setShowProcessLogsDialog={setShowProcessLogsDialog}
        processLogs={processLogs}
      />
      <FormulaDuplicationDialog
        showDialog={showFormulaDuplicationDialog}
        setShowDialog={setShowFormulaDuplicationDialog}
        selectedPeriodoId={selectedPeriodoId}
        periodoOrigen={periodoOrigenFormulas}
        isDuplicating={isDuplicatingFormulas}
        handleDuplicateFormulas={handleDuplicateFormulas}
      />
      <CalculateBonosDialog
        showCalculateBonosDialog={showCalculateBonosDialog}
        setShowCalculateBonosDialog={setShowCalculateBonosDialog}
        periodos={periodos}
        selectedPeriodoId={selectedPeriodoId}
        setSelectedPeriodoId={setSelectedPeriodoId}
        calcularBonosPeriodo={calcularBonosPeriodo}
        periodosSeleccionadosParaBono={periodosSeleccionadosParaBono}
        setPeriodosSeleccionadosParaBono={setPeriodosSeleccionadosParaBono}
        verificarBonoCalculado={verificarBonoCalculado}
        obtenerPeriodosDisponiblesParaBono={obtenerPeriodosDisponiblesParaBono}
        togglePeriodoParaBono={togglePeriodoParaBono}
      />
    </DashboardShell>
  );
}
