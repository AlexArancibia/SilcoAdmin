"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CalendarRange, ChevronDown, ChevronUp, X, Check, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardHeaderProps {
  periodos: any[]
  periodoActual: any
  selectedPeriods: [number, number] | null
  setSelectedPeriods: (periods: [number, number] | null) => void
  getPeriodoNombre: () => string
}

export function DashboardHeader({
  periodos,
  periodoActual,
  selectedPeriods,
  setSelectedPeriods,
  getPeriodoNombre,
}: DashboardHeaderProps) {
  const [isPeriodsOpen, setIsPeriodsOpen] = useState(false)
  const [activePeriodsTab, setActivePeriodsTab] = useState<"individual" | "rango">("individual")
  const [tempStartPeriod, setTempStartPeriod] = useState<number | null>(null)
  const [tempEndPeriod, setTempEndPeriod] = useState<number | null>(null)

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
        <Popover open={isPeriodsOpen} onOpenChange={setIsPeriodsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "btn btn-outline btn-md w-full md:w-auto justify-between transition-all animate-fade-in",
                selectedPeriods
                  ? "border-border bg-card text-primary dark:text-accent dark:bg-card"
                  : "hover:border-primary/30 hover:bg-card/80 hover:text-primary",
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex-center size-7 rounded-full",
                    selectedPeriods
                      ? "bg-primary/10 text-primary dark:bg-primary/20"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <CalendarRange className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{getPeriodsDisplayText()}</span>
              </div>
              {isPeriodsOpen ? (
                <ChevronUp className="h-4 w-4 ml-1.5 opacity-70" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1.5 opacity-70" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[340px] p-0 shadow-lg border-border animate-fade-in" align="end">
            <div className="p-4 border-b border-border">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm text-primary">Selección de periodos</h3>
                </div>
                {selectedPeriods && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetPeriodSelection}
                    className="btn btn-ghost btn-sm h-7 px-2 text-muted-foreground hover:text-primary hover:bg-primary/5"
                  >
                    <X className="h-3 w-3 mr-1" />
                    <span className="text-xs">Resetear</span>
                  </Button>
                )}
              </div>

              <Tabs value={activePeriodsTab} onValueChange={(v) => setActivePeriodsTab(v as any)} className="mt-1">
                <TabsList className="tabs-list grid w-full grid-cols-2 mb-3 h-9 bg-muted/30 rounded-md">
                  <TabsTrigger
                    value="individual"
                    className="tab-trigger text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                  >
                    Periodo individual
                  </TabsTrigger>
                  <TabsTrigger
                    value="rango"
                    className="tab-trigger text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                  >
                    Rango de periodos
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="individual" className="mt-1 pt-1 animate-fade-in">
                  <ScrollArea className="h-[250px] pr-2">
                    <div className="space-y-1.5">
                      {periodos.map((periodo) => {
                        const isSelected =
                          selectedPeriods?.[0] === periodo.id && selectedPeriods?.[0] === selectedPeriods?.[1]
                        const isCurrentPeriod = periodo.id === periodoActual?.id

                        return (
                          <div
                            key={periodo.id}
                            onClick={() => handlePeriodSelection(periodo.id)}
                            className={cn(
                              "p-3 rounded-md cursor-pointer transition-all",
                              "hover:bg-primary/5 hover:shadow-sm",
                              isSelected && "bg-primary/10 shadow-sm",
                              isCurrentPeriod && "border-l-2 border-secondary",
                              isCurrentPeriod && !isSelected && "pl-2.5",
                            )}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "flex-center size-8 rounded-full border",
                                    isSelected
                                      ? "border-primary/30 bg-primary/10 text-primary"
                                      : "border-border bg-muted/20 text-muted-foreground",
                                  )}
                                >
                                  <span className="text-xs font-semibold">{periodo.numero}</span>
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-medium text-foreground">
                                      Periodo {periodo.numero}/{periodo.año}
                                    </span>
                                    {isCurrentPeriod && (
                                      <Badge
                                        variant="outline"
                                        className="badge badge-outline text-[9px] h-4 bg-secondary/10 border-secondary/30 text-secondary-foreground"
                                      >
                                        Actual
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {formatFecha(periodo.fechaInicio)} - {formatFecha(periodo.fechaFin)}
                                  </div>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="flex items-center">
                                  <span className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="h-3 w-3 text-primary-foreground" />
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="rango" className="mt-1 pt-1 animate-fade-in">
                  <div className="mb-3 p-2 bg-accent/5 rounded-md">
                    <div className="text-xs font-medium text-accent">
                      {!tempStartPeriod
                        ? "Selecciona un periodo inicial"
                        : !tempEndPeriod
                          ? "Ahora selecciona un periodo final"
                          : `Periodo ${periodos.find((p) => p.id === tempStartPeriod)?.numero}/${
                              periodos.find((p) => p.id === tempStartPeriod)?.año
                            } → ${periodos.find((p) => p.id === tempEndPeriod)?.numero}/${
                              periodos.find((p) => p.id === tempEndPeriod)?.año
                            }`}
                    </div>
                  </div>
                  <ScrollArea className="h-[200px] pr-2">
                    <div className="space-y-1.5">
                      {periodos.map((periodo) => {
                        const isStart = periodo.id === tempStartPeriod
                        const isEnd = periodo.id === tempEndPeriod
                        const isInRange =
                          tempStartPeriod &&
                          tempEndPeriod &&
                          periodo.id >= Math.min(tempStartPeriod, tempEndPeriod) &&
                          periodo.id <= Math.max(tempStartPeriod, tempEndPeriod)
                        const isSelectable = tempStartPeriod === null || tempEndPeriod === null
                        const isCurrentPeriod = periodo.id === periodoActual?.id

                        return (
                          <div
                            key={periodo.id}
                            onClick={() => {
                              if (isSelectable) {
                                if (tempStartPeriod === null) {
                                  handleRangeStartSelect(periodo.id)
                                } else {
                                  handleRangeEndSelect(periodo.id)
                                }
                              }
                            }}
                            className={cn(
                              "p-3 rounded-md transition-all",
                              isStart && "bg-primary/10 shadow-sm",
                              isEnd && "bg-primary/10 shadow-sm",
                              isInRange && !isStart && !isEnd && "bg-muted/30",
                              isSelectable ? "cursor-pointer hover:bg-primary/5 hover:shadow-sm" : "cursor-default",
                              isCurrentPeriod && "border-l-2 border-secondary",
                              isCurrentPeriod && !isStart && !isEnd && !isInRange && "pl-2.5",
                            )}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "flex-center size-8 rounded-full border",
                                    isStart || isEnd
                                      ? "border-primary/30 bg-primary/10 text-primary"
                                      : isInRange
                                        ? "border-primary/20 bg-primary/5 text-primary/80"
                                        : "border-border bg-muted/20 text-muted-foreground",
                                  )}
                                >
                                  <span className="text-xs font-semibold">{periodo.numero}</span>
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-medium text-foreground">
                                      Periodo {periodo.numero}/{periodo.año}
                                    </span>
                                    {isCurrentPeriod && (
                                      <Badge
                                        variant="outline"
                                        className="badge badge-outline text-[9px] h-4 bg-secondary/10 border-secondary/30 text-secondary-foreground"
                                      >
                                        Actual
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {formatFecha(periodo.fechaInicio)} - {formatFecha(periodo.fechaFin)}
                                  </div>
                                </div>
                              </div>
                              <div>
                                {isStart && <Badge className="badge badge-primary text-[9px] h-5 px-2">Inicio</Badge>}
                                {isEnd && <Badge className="badge badge-primary text-[9px] h-5 px-2">Fin</Badge>}
                                {isInRange && !isStart && !isEnd && (
                                  <Badge className="badge badge-secondary text-[9px] h-5 px-2">Incluido</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>

                  <div className="flex justify-between mt-4 pt-3 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTempStartPeriod(null)
                        setTempEndPeriod(null)
                      }}
                      disabled={!tempStartPeriod && !tempEndPeriod}
                      className="btn btn-outline btn-sm text-xs h-8"
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" />
                      Limpiar
                    </Button>
                    <Button
                      size="sm"
                      onClick={applyRangeSelection}
                      disabled={!tempStartPeriod}
                      className="btn btn-primary btn-sm text-xs h-8"
                    >
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      {tempStartPeriod && tempEndPeriod ? "Aplicar rango" : "Seleccionar"}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
