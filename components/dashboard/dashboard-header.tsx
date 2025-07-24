"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CalendarRange, ChevronDown, ChevronUp, X, Check, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { PeriodSelector } from "../period-selector"

interface DashboardHeaderProps {
  selectedPeriods: [number, number] | null
  setSelectedPeriods: (periods: [number, number] | null) => void
  getPeriodoNombre: () => string
}

export function DashboardHead({
  selectedPeriods,
  setSelectedPeriods,
  getPeriodoNombre,
}: DashboardHeaderProps) {
  const {periodoActual,periodos,fetchPeriodos} = usePeriodosStore()
  const [isPeriodsOpen, setIsPeriodsOpen] = useState(false)
  const [activePeriodsTab, setActivePeriodsTab] = useState<"individual" | "rango">("individual")
  const [tempStartPeriod, setTempStartPeriod] = useState<number | null>(null)
  const [tempEndPeriod, setTempEndPeriod] = useState<number | null>(null)
  // useEffect(() => {
  //     const loadAllData = async () => {
  
  //       try {
  //         // Load data in parallel
  //         await  fetchPeriodos()
  
  //         // Set current period as default
  //       } catch (error) {
  //         console.error("Error loading initial data:", error)
  //       }  
  //     }
  
  //     loadAllData()
  //   }, [  fetchPeriodos ])
  
  // Period selection functions
  const handlePeriodSelection = (periodoId: number) => {
    setSelectedPeriods([periodoId, periodoId])
    setIsPeriodsOpen(false)
  }

  const handleRangeStartSelect = (periodoId: number) => {
    setTempStartPeriod(periodoId)
    if (tempEndPeriod !== null && periodoId > tempEndPeriod) {
      setTempEndPeriod(null)
    }
  }

  const handleRangeEndSelect = (periodoId: number) => {
    if (tempStartPeriod === null) return
    if (periodoId < tempStartPeriod) {
      // Swap to make it a valid range
      setTempEndPeriod(tempStartPeriod)
      setTempStartPeriod(periodoId)
    } else {
      setTempEndPeriod(periodoId)
    }
  }

  const applyRangeSelection = () => {
    if (tempStartPeriod && tempEndPeriod) {
      setSelectedPeriods([tempStartPeriod, tempEndPeriod])
    } else if (tempStartPeriod) {
      setSelectedPeriods([tempStartPeriod, tempStartPeriod])
    }
    setIsPeriodsOpen(false)
    setTempStartPeriod(null)
    setTempEndPeriod(null)
  }

  const resetPeriodSelection = () => {
    setSelectedPeriods(null)
    setIsPeriodsOpen(false)
  }

  // Format date
  const formatFecha = (fecha: Date | string) => {
    const fechaObj = new Date(fecha)
    return isNaN(fechaObj.getTime()) ? "" : format(fechaObj, "dd MMM yyyy", { locale: es })
  }

  // Get periods display text
  const getPeriodsDisplayText = () => {
    if (!selectedPeriods) return "Seleccionar período"

    const [start, end] = selectedPeriods
    const startPeriod = periodos.find((p) => p.id === start)
    const endPeriod = periodos.find((p) => p.id === end)

    if (start === end) {
      return startPeriod ? `Periodo ${startPeriod.numero}/${startPeriod.año}` : "Período seleccionado"
    }

    return startPeriod && endPeriod
      ? `Periodo ${startPeriod.numero}/${startPeriod.año} → ${endPeriod.numero}/${endPeriod.año}`
      : "Rango inválido"
  }

  // Get selected periods date range
  const getSelectedPeriodsDateRange = () => {
    if (!selectedPeriods) return null

    const [startId, endId] = selectedPeriods
    const startPeriod = periodos.find((p) => p.id === startId)
    const endPeriod = periodos.find((p) => p.id === endId)

    if (!startPeriod || !endPeriod) return null

    return {
      start: startPeriod.fechaInicio,
      end: endPeriod.fechaFin,
    }
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3  ">
      <div>
        <h1 className="heading-1">Estadisticas Generales</h1>
        <p className="text-small mt-0.5">
          {selectedPeriods ? (
            <>
              {getPeriodsDisplayText()} • {(() => {
                const dateRange = getSelectedPeriodsDateRange()
                return dateRange
                  ? `${formatFecha(dateRange.start)} - ${formatFecha(dateRange.end)}`
                  : "Rango de fechas no disponible"
              })()}
            </>
          ) : (
            <>
              {getPeriodoNombre()} •{" "}
              {periodoActual
                ? `${formatFecha(periodoActual.fechaInicio)} - ${formatFecha(periodoActual.fechaFin)}`
                : "Sin período seleccionado"}
            </>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2 w-full md:w-auto">
        {/* Period selector */}
        <PeriodSelector />
      </div>
    </div>
  )
}
