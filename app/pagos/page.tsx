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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PagosTable } from "@/components/payments/pagos-table"
import { PagosFilter } from "@/components/payments/pagos-filter"
import { DashboardShell } from "@/components/dashboard/shell"
import type { EstadoPago } from "@/types/schema"
import { usePagosStore } from "@/store/usePagosStore"

export default function PagosPage() {
  // Dialog states
  const [showCalculateDialog, setShowCalculateDialog] = useState(false)
  const [showProcessLogsDialog, setShowProcessLogsDialog] = useState(false)

  // Data stores
  const { periodos, rangoSeleccionado, setSeleccion, fetchPeriodos } = usePeriodosStore()
  const { instructores, fetchInstructores } = useInstructoresStore()
  const { fetchPagos } = usePagosStore()

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

  const searchParams = useSearchParams();
  const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;
  const estado = (searchParams.get("estado") as EstadoPago) || undefined;
  const instructorId = searchParams.get("instructorId") ? parseInt(searchParams.get("instructorId")!) : undefined;
  const periodoId = searchParams.get("periodoId") ? parseInt(searchParams.get("periodoId")!) : undefined;
  const periodoInicio = searchParams.get("periodoInicio") ? parseInt(searchParams.get("periodoInicio")!) : undefined;
  const periodoFin = searchParams.get("periodoFin") ? parseInt(searchParams.get("periodoFin")!) : undefined;
  const busqueda = searchParams.get("busqueda") || undefined;

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
    <DashboardShell>
      <PageHeader
        periodosSeleccionados={[]}
        exportarTodosPagosPDF={() => {}}
        exportarTodosExcel={() => {}}
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

    </DashboardShell>
  );
}
