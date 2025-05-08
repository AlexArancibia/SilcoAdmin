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
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
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
  const [selectedPeriods, setSelectedPeriods] = useState<[number, number] | null>(null)
  const isMobile = useIsMobile()

  // Stores
  const { instructores, fetchInstructores, isLoading: isLoadingInstructores } = useInstructoresStore()
  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()
  const { periodos, periodoActual } = usePeriodosStore()
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
        // Load data in parallel
        await Promise.all([fetchInstructores(), fetchDisciplinas(), fetchClases(), fetchPagos()])

        // Set current period as default
        if (periodoActual) {
          setSelectedPeriods([periodoActual.id, periodoActual.id])
        }
      } catch (error) {
        console.error("Error loading initial data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAllData()
  }, [fetchInstructores, fetchDisciplinas, fetchClases, fetchPagos, periodoActual])

  // Filter classes by selected periods
  const getFilteredClases = () => {
    if (!selectedPeriods) return clases

    const [startPeriodId, endPeriodId] = selectedPeriods

    // If single period
    if (startPeriodId === endPeriodId) {
      return clases.filter((c) => c.periodoId === startPeriodId)
    }

    // If period range
    const periodosEnRango = periodos
      .filter((p) => p.id >= Math.min(startPeriodId, endPeriodId) && p.id <= Math.max(startPeriodId, endPeriodId))
      .map((p) => p.id)

    return clases.filter((c) => periodosEnRango.includes(c.periodoId))
  }

  // Filter payments by selected periods
  const getFilteredPagos = () => {
    if (!selectedPeriods) return pagos

    const [startPeriodId, endPeriodId] = selectedPeriods

    // If single period
    if (startPeriodId === endPeriodId) {
      return pagos.filter((p) => p.periodoId === startPeriodId)
    }

    // If period range
    const periodosEnRango = periodos
      .filter((p) => p.id >= Math.min(startPeriodId, endPeriodId) && p.id <= Math.max(startPeriodId, endPeriodId))
      .map((p) => p.id)

    return pagos.filter((p) => periodosEnRango.includes(p.periodoId))
  }

  const filteredClases = getFilteredClases()
  const filteredPagos = getFilteredPagos()

  // Get period name for display
  const getPeriodoNombre = (): string => {
    if (!selectedPeriods) return "Todos los periodos"

    const [startId, endId] = selectedPeriods
    if (startId === endId) {
      const periodo = periodos.find((p) => p.id === startId)
      return periodo ? `Periodo ${periodo.numero}/${periodo.año}` : "Periodo seleccionado"
    }

    return "Rango de periodos seleccionado"
  }

  // Format date
  const formatFecha = (fecha: Date | string) => {
    const fechaObj = new Date(fecha)
    return isNaN(fechaObj.getTime()) ? "" : format(fechaObj, "dd MMM yyyy", { locale: es })
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

  return (
    <DashboardShell>
      <DashboardHeader
        periodos={periodos}
        periodoActual={periodoActual}
        selectedPeriods={selectedPeriods}
        setSelectedPeriods={setSelectedPeriods}
        getPeriodoNombre={getPeriodoNombre}
      />

      <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab}>
        <TabsContent value="general">
          <GeneralTab
            instructores={instructores}
            disciplinas={disciplinas}
            filteredClases={filteredClases}
            filteredPagos={filteredPagos}
            periodos={periodos}
            getPeriodoNombre={getPeriodoNombre}
            formatFecha={formatFecha}
            isLoadingClases={isLoadingClases}
            isLoadingPagos={isLoadingPagos}
          />
        </TabsContent>

        <TabsContent value="estudios">
          <EstudiosTab
            filteredClases={filteredClases}
            filteredPagos={filteredPagos}
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
