"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"
import { useIsMobile } from "@/hooks/use-mobile"
import { TabsContent } from "@/components/ui/tabs"

// Dashboard components
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs"
import { GeneralTab } from "@/components/dashboard/general-tabs"
import { EstudiosTab } from "@/components/dashboard/estudios-tab"
import { DashboardHead } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/shell"

// Stores
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { usePagosStore } from "@/store/usePagosStore"
import { useClasesStore } from "@/store/useClasesStore"

export default function DashboardPage() {
  // States
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("general")
  const [timeRange, setTimeRange] = useState("30d")
  const isMobile = useIsMobile()

  // Stores
  const { instructores, fetchInstructores, isLoading: isLoadingInstructores } = useInstructoresStore()
  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()
  const { periodos, rangoSeleccionado, setSeleccion, fetchPeriodos, getPeriodoQueryParams } = usePeriodosStore()
  const { pagos, fetchPagos, isLoading: isLoadingPagos } = usePagosStore()
  const { clases, fetchClases, isLoading: isLoadingClases } = useClasesStore()

  // Adjust timeRange based on device
  useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  // Load all data when component mounts
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true)

      try {
        // Load basic data first
        await Promise.all([
          fetchInstructores(),
          fetchDisciplinas(), 
          fetchPeriodos(), // La persistencia se maneja automáticamente en el store
        ])
      } catch (error) {
        console.error("Error loading initial data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAllData()
  }, [fetchInstructores, fetchDisciplinas, fetchPeriodos])

  // Load filtered data when period selection changes
  useEffect(() => {
    const loadFilteredData = async () => {
      if (rangoSeleccionado) {
        const periodoParams = getPeriodoQueryParams()
        
        try {
          await Promise.all([
            fetchClases(periodoParams),
            fetchPagos(periodoParams),
          ])
        } catch (error) {
          console.error("Error loading filtered data:", error)
        }
      }
    }

    loadFilteredData()
  }, [rangoSeleccionado, fetchClases, fetchPagos, getPeriodoQueryParams])

  // Filter functions are now simplified since we get pre-filtered data
  const getFilteredClases = () => clases
  const getFilteredPagos = () => pagos

  // Get period name for display
  const getPeriodoNombre = (): string => {
    if (!rangoSeleccionado) {
      return "Todos los periodos"
    }

    const [startId, endId] = rangoSeleccionado
    if (startId === endId) {
      const periodo = periodos.find((p) => p.id === startId)
      return periodo ? `Periodo ${periodo.numero}/${periodo.año}` : "Periodo seleccionado"
    }

    const startPeriodo = periodos.find((p) => p.id === startId)
    const endPeriodo = periodos.find((p) => p.id === endId)
    return startPeriodo && endPeriodo 
      ? `Periodo ${startPeriodo.numero}/${startPeriodo.año} → ${endPeriodo.numero}/${endPeriodo.año}`
      : "Rango de periodos seleccionado"
  }

  // Format date safely
  const formatFecha = (fecha: Date | string) => {
    try {
      const fechaObj = new Date(fecha)
      return isNaN(fechaObj.getTime()) ? "" : format(fechaObj, "dd MMM yyyy", { locale: es })
    } catch {
      return ""
    }
  }

  // Loading state
  if (isLoading || isLoadingInstructores || isLoadingDisciplinas) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>

        <div className="mb-6">
          <div className="grid grid-cols-4 gap-1 w-full">
            <Skeleton className="h-9 rounded-lg" />
            <Skeleton className="h-9 rounded-lg" />
            <Skeleton className="h-9 rounded-lg" />
            <Skeleton className="h-9 rounded-lg" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-28" />
                </div>
                <Skeleton className="h-7 w-20" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Wrapper function to match DashboardHead's expected interface
  const handleSetSelectedPeriods = (periods: [number, number] | null) => {
    if (periods) {
      const [inicio, fin] = periods;
      setSeleccion(inicio, fin);
    }
    // Note: Si periods es null, no hacemos nada ya que la persistencia maneja la selección automáticamente
  }

  return (
    <DashboardShell>
      <DashboardHead
        selectedPeriods={rangoSeleccionado}
        setSelectedPeriods={handleSetSelectedPeriods}
        getPeriodoNombre={getPeriodoNombre}
      />


      <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab}>
         <TabsContent value="general">
          <GeneralTab
            instructores={instructores}
            disciplinas={disciplinas}
            filteredClases={getFilteredClases()}
            filteredPagos={getFilteredPagos()}
            periodos={periodos}
            getPeriodoNombre={getPeriodoNombre}
            formatFecha={formatFecha}
            isLoadingClases={isLoadingClases}
            isLoadingPagos={isLoadingPagos}
          />
        </TabsContent>

        <TabsContent value="estudios">
          <EstudiosTab
            filteredClases={getFilteredClases()}
            filteredPagos={getFilteredPagos()}
            disciplinas={disciplinas}
            instructores={instructores}
            getPeriodoNombre={getPeriodoNombre}
            formatFecha={formatFecha}
            isLoadingClases={isLoadingClases}
            isLoadingPagos={isLoadingPagos}
          />
        </TabsContent>
      </DashboardTabs>
</DashboardShell>
  )
}