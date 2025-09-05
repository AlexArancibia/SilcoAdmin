"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
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
import { useStatsStore } from "@/store/useStatsStore"

export default function DashboardPage() {
  console.log('[DashboardPage] Component rendering')
  
  // States
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("general")
  const [timeRange, setTimeRange] = useState("30d")
  const [hasInitialized, setHasInitialized] = useState(false)
  const isMobile = useIsMobile()

  // Stores
  const { instructores, fetchInstructores, isLoading: isLoadingInstructores } = useInstructoresStore()
  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()
  const { periodos, rangoSeleccionado, setSeleccion, fetchPeriodos, getPeriodoQueryParams } = usePeriodosStore()
  const { isLoading: isLoadingStats, resetStats } = useStatsStore()

  // Adjust timeRange based on device
  useEffect(() => {
    console.log('[DashboardPage] Mobile detection effect', { isMobile })
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  // Use ref to ensure loadBasicData only runs once
  const hasLoadedRef = useRef(false)

  // Load all basic data when component mounts - OPTIMIZED
  useEffect(() => {
    console.log('[DashboardPage] Main data loading effect starting')
    
    // Only run if not already loaded
    if (hasLoadedRef.current) {
      console.log('[DashboardPage] Already loaded, skipping data load')
      return
    }

    const loadBasicData = async () => {
      const startTime = performance.now()
      console.log(`[DashboardPage] ⏱️ Starting loadBasicData at ${new Date().toISOString()}`)
      hasLoadedRef.current = true
      setHasInitialized(true)
      setIsLoading(true)

      try {
        // Check if data is already loaded to avoid unnecessary fetches
        const needsInstructores = instructores.length === 0
        const needsDisciplinas = disciplinas.length === 0
        const needsPeriodos = periodos.length === 0

        console.log('[DashboardPage] Data needs check:', {
          needsInstructores,
          needsDisciplinas,
          needsPeriodos,
          currentInstructores: instructores.length,
          currentDisciplinas: disciplinas.length,
          currentPeriodos: periodos.length
        })

        const fetchPromises = []

        if (needsInstructores) {
          console.log('[DashboardPage] 📡 Fetching instructores...')
          fetchPromises.push(fetchInstructores())
        }

        if (needsDisciplinas) {
          console.log('[DashboardPage] 📡 Fetching disciplinas...')
          fetchPromises.push(fetchDisciplinas())
        }

        if (needsPeriodos) {
          console.log('[DashboardPage] 📡 Fetching periodos...')
          fetchPromises.push(fetchPeriodos())
        }

        if (fetchPromises.length > 0) {
          console.log(`[DashboardPage] 🚀 Executing ${fetchPromises.length} fetch operations in parallel`)
          const fetchStartTime = performance.now()
          await Promise.all(fetchPromises)
          const fetchEndTime = performance.now()
          console.log(`[DashboardPage] ✅ All fetch operations completed in ${(fetchEndTime - fetchStartTime).toFixed(2)}ms`)
        } else {
          console.log('[DashboardPage] ⏭️ No fetch operations needed - data already loaded')
        }
      } catch (error) {
        console.error("[DashboardPage] ❌ Error loading initial data:", error)
      } finally {
        const endTime = performance.now()
        console.log(`[DashboardPage] ⏱️ loadBasicData completed in ${(endTime - startTime).toFixed(2)}ms`)
        console.log('[DashboardPage] Setting loading to false')
        setIsLoading(false)
      }
    }

    loadBasicData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - only run once on mount

  // Reset stats when period selection changes (they'll be loaded by the components)
  useEffect(() => {
    console.log('[DashboardPage] Period selection changed, resetting stats', { rangoSeleccionado })
    resetStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangoSeleccionado])

  // Get period filter for statistics - memoized to prevent infinite loops
  const periodoFilter = useMemo(() => {
    console.log('[DashboardPage] Computing periodoFilter', { rangoSeleccionado })
    
    if (!rangoSeleccionado) {
      console.log('[DashboardPage] No rangoSeleccionado, returning undefined')
      return undefined
    }

    const [startId, endId] = rangoSeleccionado
    if (startId === endId) {
      console.log('[DashboardPage] Single period selected:', startId)
      return { periodoId: startId }
    } else {
      console.log('[DashboardPage] Period range selected:', { startId, endId })
      return { 
        periodoInicio: startId,
        periodoFin: endId 
      }
    }
  }, [rangoSeleccionado])

  // Get period name for display - memoized for performance
 const periodoNombre = useMemo((): string => {
    console.log('[DashboardPage] Computing periodoNombre', { rangoSeleccionado, periodosCount: periodos.length })
    
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
  }, [rangoSeleccionado, periodos])

  // Format date safely - memoized for performance
  const formatFecha = useCallback((fecha: Date | string) => {
    try {
      const fechaObj = new Date(fecha)
      return isNaN(fechaObj.getTime()) ? "" : format(fechaObj, "dd MMM yyyy", { locale: es })
    } catch {
      return ""
    }
  }, [])

  // Wrapper function to match DashboardHead's expected interface - memoized
  const handleSetSelectedPeriods = useCallback((periods: [number, number] | null) => {
    console.log('[DashboardPage] handleSetSelectedPeriods called with:', periods)
    if (periods) {
      const [inicio, fin] = periods;
      setSeleccion(inicio, fin);
    }
    // Note: Si periods es null, no hacemos nada ya que la persistencia maneja la selección automáticamente
  }, [setSeleccion])

  // Compute loading state
  const isAnyLoading = isLoading || isLoadingInstructores || isLoadingDisciplinas
  
  console.log('[DashboardPage] Render state:', {
    isLoading,
    isLoadingInstructores,
    isLoadingDisciplinas,
    isAnyLoading,
    instructoresCount: instructores.length,
    disciplinasCount: disciplinas.length,
    periodosCount: periodos.length,
    rangoSeleccionado,
    activeTab
  })

  // Loading state
  if (isAnyLoading) {
    console.log('[DashboardPage] Rendering loading state')
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

  console.log('[DashboardPage] Rendering main content')

  return (
    <DashboardShell>
      <DashboardHead
        selectedPeriods={rangoSeleccionado}
        setSelectedPeriods={handleSetSelectedPeriods}
        getPeriodoNombre={() => periodoNombre}
      />

      <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab}>
         <TabsContent value="general">
          <GeneralTab
            periodoFilter={periodoFilter}
            getPeriodoNombre={() => periodoNombre}
          />
        </TabsContent>

        <TabsContent value="estudios">
          <EstudiosTab
            periodoFilter={periodoFilter}
            getPeriodoNombre={() => periodoNombre}
            formatFecha={formatFecha}
          />
        </TabsContent>
      </DashboardTabs>  
</DashboardShell>
  )
}