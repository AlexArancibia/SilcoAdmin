"use client"

import { useEffect, useState, useRef } from "react"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronDown, ChevronUp, Check, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export function PeriodSelector() {
  const { periodos, rangoSeleccionado, setSeleccion, resetearSeleccion, fetchPeriodos, isLoading, periodoActual } =
    usePeriodosStore()

  const [activeTab, setActiveTab] = useState<"individual" | "rango">("individual")
  const [tempStart, setTempStart] = useState<number | null>(null)
  const [tempEnd, setTempEnd] = useState<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    fetchPeriodos()
  }, [fetchPeriodos])

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  const formatFecha = (fecha: Date | string) => {
    const fechaObj = new Date(fecha)
    return isNaN(fechaObj.getTime()) ? "" : format(fechaObj, "dd MMM yyyy", { locale: es })
  }

  const handleIndividualSelect = (periodoId: number) => {
    setSeleccion(periodoId)
    setIsOpen(false)
  }

  const handleRangeStartSelect = (periodoId: number) => {
    setTempStart(periodoId)
    if (tempEnd !== null && periodoId > tempEnd) {
      setTempEnd(null)
    }
  }

  const handleRangeEndSelect = (periodoId: number) => {
    if (tempStart === null) return
    if (periodoId < tempStart) {
      // Swap to make it a valid range
      setTempEnd(tempStart)
      setTempStart(periodoId)
    } else {
      setTempEnd(periodoId)
    }
  }

  const applyRangeSelection = () => {
    if (tempStart && tempEnd) {
      setSeleccion(tempStart, tempEnd)
    } else if (tempStart) {
      setSeleccion(tempStart)
    }
    setIsOpen(false)
    setTempStart(null)
    setTempEnd(null)
  }

  const getDisplayText = () => {
    if (!rangoSeleccionado) return "Seleccionar período"

    const [start, end] = rangoSeleccionado
    const startPeriod = periodos.find((p) => p.id === start)
    const endPeriod = periodos.find((p) => p.id === end)

    if (start === end) {
      return startPeriod ? `Periodo ${startPeriod.numero}/${startPeriod.año}` : "Período seleccionado"
    }

    return startPeriod && endPeriod
      ? `Periodo ${startPeriod.numero}/${startPeriod.año} → ${endPeriod.numero}/${endPeriod.año}`
      : "Rango inválido"
  }

  const resetSelection = () => {
    resetearSeleccion()
    setIsOpen(false)
  }

  // Calculate dropdown position with improved logic
  const getDialogPosition = () => {
    if (!buttonRef.current) return {}

    const buttonRect = buttonRef.current.getBoundingClientRect()
    const dropdownWidth = 380 // Slightly wider for better desktop experience
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Calculate right position with boundary check
    let right = viewportWidth - buttonRect.right
    if (right < 16) right = 16 // Ensure minimum margin from viewport edge

    // Calculate top position with boundary check
    let top = buttonRect.bottom + window.scrollY
    const dropdownHeight = 500 // Estimated max height
    if (top + dropdownHeight > viewportHeight + window.scrollY) {
      // If dropdown would go below viewport, show above button
      top = buttonRect.top + window.scrollY - dropdownHeight - 8
    }

    return {
      position: "fixed" as const,
      top: `${top}px`,
      right: `${right}px`,
      width: `${dropdownWidth}px`,
      maxHeight: "70vh",
      overflowY: "auto" as const,
    }
  }

  // Auto-scroll to selected item when dropdown opens
  useEffect(() => {
    if (isOpen && rangoSeleccionado) {
      setTimeout(() => {
        const selectedElement = document.querySelector(
          activeTab === "individual"
            ? `[data-periodo-id="${rangoSeleccionado[0]}"]`
            : `[data-periodo-id="${tempStart || rangoSeleccionado[0]}"]`,
        )

        if (selectedElement) {
          selectedElement.scrollIntoView({ behavior: "smooth", block: "nearest" })
        }
      }, 100)
    }
  }, [isOpen, activeTab, rangoSeleccionado, tempStart])

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full justify-between border transition-colors",
          "min-w-[240px] max-w-[400px]", // Better width control for desktop
          rangoSeleccionado 
            ? "border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200" 
            : "hover:bg-slate-50 dark:hover:bg-slate-800",
          isLoading ? "opacity-70 cursor-not-allowed" : "",
        )}
        disabled={isLoading}
        ref={buttonRef}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          <Calendar className={cn("h-4 w-4 flex-shrink-0", rangoSeleccionado ? "text-slate-500" : "")} />
          <span className="truncate">{isLoading ? "Cargando períodos..." : getDisplayText()}</span>
        </div>
        {isLoading ? (
          <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
        ) : isOpen ? (
          <ChevronUp className="h-4 w-4 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        )}
      </Button>

      {isOpen && (
        <Card
          className={cn(
            "absolute z-50 p-4 shadow-lg border-slate-200 dark:border-slate-700",
            "animate-in fade-in zoom-in-95 duration-200", // Smoother animation
          )}
          style={getDialogPosition()}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-base">Selección de periodos</h3>
            {rangoSeleccionado && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetSelection}
                className="h-8 px-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Resetear</span>
              </Button>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-2">
            <TabsList className="grid w-full grid-cols-2 mb-3 bg-slate-100 dark:bg-slate-800">
              <TabsTrigger value="individual" className="text-sm py-1.5">
                Periodo individual
              </TabsTrigger>
              <TabsTrigger value="rango" className="text-sm py-1.5">
                Rango de periodos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="mt-2 pt-1">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                  {periodos.map((periodo) => {
                    const isSelected =
                      rangoSeleccionado?.[0] === periodo.id && rangoSeleccionado?.[0] === rangoSeleccionado?.[1]
                    const isCurrent = periodo.id === periodoActual?.id

                    return (
                      <div
                        key={periodo.id}
                        data-periodo-id={periodo.id}
                        onClick={() => handleIndividualSelect(periodo.id)}
                        className={cn(
                          "p-2.5 rounded-md cursor-pointer transition-all",
                          "hover:bg-slate-50 dark:hover:bg-slate-700/50 group",
                          "flex flex-col",
                          isSelected && "bg-slate-100 dark:bg-slate-700 font-medium",
                          isCurrent && "border-l-2 border-slate-300 dark:border-slate-500",
                          !isSelected && isCurrent && "pl-2",
                        )}
                        aria-selected={isSelected}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              Periodo {periodo.numero}/{periodo.año}
                            </span>
                            {isCurrent && (
                              <Badge
                                variant="outline"
                                className="text-[10px] h-5 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-600"
                              >
                                Actual
                              </Badge>
                            )}
                          </div>
                          {isSelected && (
                            <div className="flex items-center">
                              <span className="h-5 w-5 rounded-full bg-slate-500 flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatFecha(periodo.fechaInicio)} - {formatFecha(periodo.fechaFin)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="rango" className="mt-2 pt-1">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="mb-3 text-sm text-slate-500 dark:text-slate-400 px-1">
                    {!tempStart
                      ? "Selecciona un periodo inicial"
                      : !tempEnd
                        ? "Ahora selecciona un periodo final"
                        : `Periodo ${periodos.find((p) => p.id === tempStart)?.numero}/${periodos.find((p) => p.id === tempStart)?.año} → ${periodos.find((p) => p.id === tempEnd)?.numero}/${periodos.find((p) => p.id === tempEnd)?.año}`}
                  </div>
                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                    {periodos.map((periodo) => {
                      const isStart = periodo.id === tempStart
                      const isEnd = periodo.id === tempEnd
                      const isInRange =
                        tempStart &&
                        tempEnd &&
                        periodo.id >= Math.min(tempStart, tempEnd) &&
                        periodo.id <= Math.max(tempStart, tempEnd)
                      const isSelectable = tempStart === null || tempEnd === null

                      return (
                        <div
                          key={periodo.id}
                          data-periodo-id={periodo.id}
                          onClick={() => {
                            if (isSelectable) {
                              if (tempStart === null) {
                                handleRangeStartSelect(periodo.id)
                              } else {
                                handleRangeEndSelect(periodo.id)
                              }
                            }
                          }}
                          className={cn(
                            "p-2.5 rounded-md transition-all flex flex-col",
                            isStart && "bg-slate-100 dark:bg-slate-700",
                            isEnd && "bg-slate-200 dark:bg-slate-600",
                            isInRange && !isStart && !isEnd && "bg-slate-50 dark:bg-slate-800/50",
                            isSelectable
                              ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
                              : "cursor-default",
                            periodo.id === periodoActual?.id && "border-l-2 border-slate-300 dark:border-slate-500",
                            periodo.id === periodoActual?.id && !isStart && !isEnd && !isInRange && "pl-2",
                          )}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                Periodo {periodo.numero}/{periodo.año}
                              </span>
                              {periodo.id === periodoActual?.id && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] h-5 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-600"
                                >
                                  Actual
                                </Badge>
                              )}
                            </div>
                            {isStart && <Badge className="bg-slate-500 hover:bg-slate-600">Inicio</Badge>}
                            {isEnd && <Badge className="bg-slate-600 hover:bg-slate-700">Fin</Badge>}
                            {isInRange && !isStart && !isEnd && (
                              <Badge className="bg-slate-400 hover:bg-slate-500 text-slate-700 dark:text-slate-200">
                                Incluido
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {formatFecha(periodo.fechaInicio)} - {formatFecha(periodo.fechaFin)}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex justify-between mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTempStart(null)
                        setTempEnd(null)
                      }}
                      disabled={!tempStart && !tempEnd}
                      className="text-sm"
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" />
                      Limpiar
                    </Button>
                    <Button
                      size="sm"
                      onClick={applyRangeSelection}
                      disabled={!tempStart}
                      className="bg-slate-600 hover:bg-slate-700 text-sm"
                    >
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      {tempStart && tempEnd ? "Aplicar rango" : "Seleccionar"}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  )
}