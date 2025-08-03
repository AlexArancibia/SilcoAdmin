"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from 'next/navigation'
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"

import { CalculateDialog } from "@/components/payments/dialogs/calculate-dialog"
import { ProcessLogsDialog } from "@/components/payments/dialogs/process-logs-dialog"
import { FormulaDuplicationDialog } from "@/components/payments/dialogs/formula-duplication-dialog"
import { toast } from "@/hooks/use-toast"
import { PageHeader } from "@/components/payments/page-header"
import { exportToExcel } from "@/utils/excel-utils"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PagosTable } from "@/components/payments/pagos-table"
import { PagosFilter } from "@/components/payments/pagos-filter"
import { DashboardShell } from "@/components/dashboard/shell"
import type { EstadoPago } from "@/types/schema"
import { usePagosStore } from "@/store/usePagosStore"

// Component that uses useSearchParams - will be wrapped in Suspense
function PagosContent() {
  const searchParams = useSearchParams();
  const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;
  const estado = (searchParams.get("estado") as EstadoPago) || undefined;
  const instructorId = searchParams.get("instructorId") ? parseInt(searchParams.get("instructorId")!) : undefined;
  const periodoId = searchParams.get("periodoId") ? parseInt(searchParams.get("periodoId")!) : undefined;
  const periodoInicio = searchParams.get("periodoInicio") ? parseInt(searchParams.get("periodoInicio")!) : undefined;
  const periodoFin = searchParams.get("periodoFin") ? parseInt(searchParams.get("periodoFin")!) : undefined;
  const busqueda = searchParams.get("busqueda") || undefined;

  // Data stores
  const { periodos, rangoSeleccionado, setSeleccion, fetchPeriodos } = usePeriodosStore()
  const { instructores, fetchInstructores } = useInstructoresStore()
  const { fetchPagos, exportarExcel } = usePagosStore()

  // Dialog states
  const [showCalculateDialog, setShowCalculateDialog] = useState(false)
  const [showProcessLogsDialog, setShowProcessLogsDialog] = useState(false)

  // Calculation state
  const [isCalculating, setIsCalculating] = useState(false)
  const [processLogs, setProcessLogs] = useState<string[]>([])

  // Manual categories state
  const [manualCategorias, setManualCategorias] = useState<any[]>([])
  const [selectedInstructorId, setSelectedInstructorId] = useState<number | null>(null)
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<number | null>(null)
  const [manualCategoria, setManualCategoria] = useState<any>(null)

  // Get the selected period ID (first element of the range for single period operations)
  const selectedPeriodoId = rangoSeleccionado ? rangoSeleccionado[0] : null;

  const agregarCategoriaManual = () => {
    if (selectedInstructorId && selectedDisciplinaId && manualCategoria) {
      const nuevaCategoria = {
        instructorId: selectedInstructorId,
        disciplinaId: selectedDisciplinaId,
        categoria: manualCategoria,
      }
      setManualCategorias((prev) => [...prev.filter((c) => c.instructorId !== selectedInstructorId || c.disciplinaId !== selectedDisciplinaId), nuevaCategoria])
      toast({ title: "Categoría manual agregada" })
    }
  }

  const eliminarCategoriaManual = (instructorId: number, disciplinaId: number) => {
    setManualCategorias((prev) => prev.filter((c) => c.instructorId !== instructorId || c.disciplinaId !== disciplinaId))
    toast({ title: "Categoría manual eliminada" })
  }

  // Main calculation function
  const handleCalculatePagos = async () => {
    if (!selectedPeriodoId) {
      toast({ title: "Error", description: "No se ha seleccionado un período.", variant: "destructive" })
      return
    }

    setIsCalculating(true)
    setProcessLogs([])
    setShowProcessLogsDialog(true)

    const addProcessLog = (log: string) => setProcessLogs((prev) => [...prev, log])

    addProcessLog(`🚀 Iniciando proceso de cálculo para el período ID: ${selectedPeriodoId}`)
    addProcessLog(`Total de instructores a procesar: ${instructores.length}`)
    addProcessLog("-".repeat(50))

    try {
      const response = await fetch('/api/pagos/calculo/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodoId: selectedPeriodoId,
          manualCategorias,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        if (result.logs) setProcessLogs(prevLogs => [...prevLogs, ...result.logs]);
        toast({ title: "Cálculo completado", description: "Se han procesado los instructores con clases en el periodo." });
      } else {
        addProcessLog(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      addProcessLog(`❌ Error fatal en la comunicación con la API: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    addProcessLog("🏁 Proceso de cálculo finalizado.")
    setIsCalculating(false)
    fetchPagos({ page, limit, estado, instructorId, periodoId, busqueda })
    toast({ title: "Cálculo completado", description: "Se han procesado todos los instructores." })
  }

  // Excel export function
  const handleExportarExcel = async () => {
    try {
      // Build query params for export (without pagination)
      const exportParams: any = { estado, instructorId, busqueda }
      
      // Handle period parameters (prioritize individual period over range)
      if (periodoId) {
        exportParams.periodoId = periodoId
      } else if (periodoInicio || periodoFin) {
        if (periodoInicio) exportParams.periodoInicio = periodoInicio
        if (periodoFin) exportParams.periodoFin = periodoFin
      }

      toast({ title: "Exportando a Excel...", description: "Preparando los datos para la exportación." })
      
      const result = await exportarExcel(exportParams)
      
      if (result.success && result.data.length > 0) {
        // Generate filename based on current filters
        let filename = "pagos_instructores"
        if (periodoId) {
          const periodo = periodos.find(p => p.id === periodoId)
          if (periodo) {
            filename += `_periodo_${periodo.numero}_${periodo.año}`
          }
        } else if (periodoInicio || periodoFin) {
          filename += "_rango_periodos"
        }
        if (instructorId) {
          const instructor = instructores.find(i => i.id === instructorId)
          if (instructor) {
            filename += `_${instructor.nombre.replace(/\s+/g, '_')}`
          }
        }
        if (estado) {
          filename += `_${estado.toLowerCase()}`
        }
        
        await exportToExcel(result.data, filename)
        toast({ title: "Exportación completada", description: `Se exportaron ${result.total} registros a Excel.` })
      } else {
        toast({ title: "No hay datos", description: "No se encontraron pagos para exportar con los filtros actuales.", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      toast({ 
        title: "Error en la exportación", 
        description: "No se pudo exportar a Excel. Por favor, inténtelo de nuevo.", 
        variant: "destructive" 
      })
    }
  }

  useEffect(() => {
    // Build query params with support for period ranges
    const queryParams: any = { page, limit, estado, instructorId, busqueda }
    
    // Handle period parameters (prioritize individual period over range)
    if (periodoId) {
      queryParams.periodoId = periodoId
    } else if (periodoInicio || periodoFin) {
      if (periodoInicio) queryParams.periodoInicio = periodoInicio
      if (periodoFin) queryParams.periodoFin = periodoFin
    }
    
    fetchPagos(queryParams)
  }, [page, limit, estado, instructorId, periodoId, periodoInicio, periodoFin, busqueda, fetchPagos])

  useEffect(() => {
    if (periodos.length === 0) fetchPeriodos()
    if (instructores.length === 0) fetchInstructores()
  }, [fetchPeriodos, fetchInstructores])

  // Wrapper function for setting selected period in dialogs
  const handleSetSelectedPeriodoId = (periodoId: number | null) => {
    if (periodoId) {
      setSeleccion(periodoId, periodoId);
    }
  }

  return (
    <>
      <PageHeader
        periodosSeleccionados={[]}
        exportarTodosPagosPDF={() => {}}
        exportarTodosExcel={handleExportarExcel}
        imprimirTodosPagosPDF={() => {}}
        isCalculatingPayments={isCalculating}
        setShowCalculateDialog={() => {
          // No necesitamos lógica manual aquí, la persistencia maneja la selección automáticamente
          setShowCalculateDialog(true)
        }}
        setShowCalculateBonosDialog={() => { 
          toast({ title: "Función no implementada", description: "El cálculo de bonos se encuentra en desarrollo."})
        }}
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
        setSelectedPeriodoId={handleSetSelectedPeriodoId}
        calcularPagosPeriodo={handleCalculatePagos}
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
        aplicarCategoriasManual={() => {}}
        isCalculatingPayments={isCalculating}
      />
      <ProcessLogsDialog
        showProcessLogsDialog={showProcessLogsDialog}
        setShowProcessLogsDialog={setShowProcessLogsDialog}
        processLogs={processLogs}
      />
    </>
  );
}

// Main page component with Suspense boundary
export default function PagosPage() {
  return (
    <DashboardShell>
      <Suspense fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full" />
          <Card>
            <CardHeader>
              <CardTitle>Pagos</CardTitle>
              <CardDescription>Cargando...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      }>
        <PagosContent />
      </Suspense>
    </DashboardShell>
  );
}
