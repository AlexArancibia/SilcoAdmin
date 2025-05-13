"use client"

import { useState } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { usePagosData } from "@/hooks/use-pagos-data"
import { useFilters } from "@/hooks/use-filters"
import { usePagination } from "@/hooks/use-pagination"
import { useCalculation } from "@/hooks/use-calculation"
import { PageHeader } from "@/components/payments/page-header"
import { FilterBar } from "@/components/payments/filter-bar"
import { PagosTable } from "@/components/payments/pagos-table"
import { Pagination } from "@/components/payments/pagination"
import { CalculateDialog } from "@/components/payments/dialogs/calculate-dialog"
import { ProcessLogsDialog } from "@/components/payments/dialogs/process-logs-dialog"
import { FormulaDuplicationDialog } from "@/components/payments/dialogs/formula-duplication-dialog"
import { CalculateBonosDialog } from "@/components/payments/dialogs/calculate-bonos-dialog"
import { DashboardShell } from "@/components/dashboard/shell"

export default function PagosPage() {
  // State for dialogs
  const [showCalculateDialog, setShowCalculateDialog] = useState<boolean>(false)
  const [showProcessLogsDialog, setShowProcessLogsDialog] = useState<boolean>(false)
  const [showCalculateBonosDialog, setShowCalculateBonosDialog] = useState<boolean>(false)

  // Custom hooks
  const {
    pagos,
    instructores,
    periodos,
    periodosSeleccionados,
    isLoadingPagos,
    exportarPagoPDF,
    imprimirPagoPDF,
    exportarTodosPagosPDF,
    imprimirTodosPagosPDF,
    periodoActual,
  } = usePagosData()

  const {
    filtroEstado,
    setFiltroEstado,
    filtroInstructor,
    setFiltroInstructor,
    busqueda,
    setBusqueda,
    sortConfig,
    setSortConfig,
    filteredPagos,
    sortedPagos,
    requestSort,
  } = useFilters(pagos, instructores, periodos)

  const { paginaActual, setPaginaActual, elementosPorPagina, setElementosPorPagina, totalPaginas, paginatedPagos } =
    usePagination(sortedPagos)

  const {
    isCalculatingPayments,
    processLogs,
    setProcessLogs,
    calcularPagosPeriodo,
    selectedPeriodoId,
    setSelectedPeriodoId,
    calcularBonoEnPeriodo,
    setCalcularBonoEnPeriodo,
    showFormulaDuplicationDialog,
    setShowFormulaDuplicationDialog,
    periodoOrigenFormulas,
    isDuplicatingFormulas,
    handleDuplicateFormulas,
    // Nuevas propiedades para el cálculo de bonos
    isCalculatingBonuses,
    periodosSeleccionadosParaBono,
    setPeriodosSeleccionadosParaBono,
    verificarBonoCalculado,
    obtenerPeriodosDisponiblesParaBono,
    togglePeriodoParaBono,
    calcularBonosPeriodo,
  } = useCalculation(setShowProcessLogsDialog, setShowCalculateDialog)

  // Create wrapper functions for PDF exports
  const handleExportTodosPagosPDF = () => {
    exportarTodosPagosPDF(sortedPagos, filtroEstado, filtroInstructor)
  }

  const handleImprimirTodosPagosPDF = () => {
    imprimirTodosPagosPDF(sortedPagos, filtroEstado, filtroInstructor)
  }

  // Añadir esta función para manejar la apertura del diálogo
  const handleOpenCalculateDialog = () => {
    // Si hay un periodo actual y no hay un periodo seleccionado, establecer el periodo actual
    if (periodoActual && selectedPeriodoId === null) {
      setSelectedPeriodoId(periodoActual.id)
    }
    setShowCalculateDialog(true)
  }

  // Añadir esta función para manejar la apertura del diálogo de cálculo de bonos
  const handleOpenCalculateBonosDialog = () => {
    // Si hay un periodo actual y no hay un periodo seleccionado, establecer el periodo actual
    if (periodoActual && selectedPeriodoId === null) {
      setSelectedPeriodoId(periodoActual.id)
    }
    setShowCalculateBonosDialog(true)
  }

  return (
    <DashboardShell>
      <PageHeader
        periodosSeleccionados={periodosSeleccionados}
        exportarTodosPagosPDF={handleExportTodosPagosPDF}
        imprimirTodosPagosPDF={handleImprimirTodosPagosPDF}
        isCalculatingPayments={isCalculatingPayments || isCalculatingBonuses}
        setShowCalculateDialog={handleOpenCalculateDialog}
        setShowCalculateBonosDialog={handleOpenCalculateBonosDialog}
      />

      <FilterBar
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
        filtroInstructor={filtroInstructor}
        setFiltroInstructor={setFiltroInstructor}
        instructores={instructores}
      />

      {isLoadingPagos ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <>
          <PagosTable
            paginatedPagos={paginatedPagos}
            requestSort={requestSort}
            sortConfig={sortConfig}
            instructores={instructores}
            periodosSeleccionados={periodosSeleccionados}
            exportarPagoPDF={exportarPagoPDF}
            imprimirPagoPDF={imprimirPagoPDF}
          />

          {totalPaginas > 1 && (
            <Pagination
              paginaActual={paginaActual}
              setPaginaActual={setPaginaActual}
              totalPaginas={totalPaginas}
              totalItems={sortedPagos.length}
            />
          )}
        </>
      )}

      <CalculateDialog
        showCalculateDialog={showCalculateDialog}
        setShowCalculateDialog={setShowCalculateDialog}
        periodos={periodos}
        selectedPeriodoId={selectedPeriodoId}
        setSelectedPeriodoId={setSelectedPeriodoId}
        calcularPagosPeriodo={calcularPagosPeriodo}
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
    </DashboardShell>
  )
}
