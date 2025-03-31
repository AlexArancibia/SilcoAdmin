"use client"

import { useEffect, useState } from "react"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronDown, ChevronUp } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function PeriodSelector() {
  const {
    periodos,
    rangoSeleccionado,
    setSeleccion,
    resetearSeleccion,
    fetchPeriodos,
    isLoading,
    periodoActual
  } = usePeriodosStore()
  
  const [activeTab, setActiveTab] = useState<"individual" | "rango">("individual")
  const [tempStart, setTempStart] = useState<number | null>(null)
  const [tempEnd, setTempEnd] = useState<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchPeriodos()
  }, [fetchPeriodos])

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
    setTempEnd(periodoId)
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
    const startPeriod = periodos.find(p => p.id === start)
    const endPeriod = periodos.find(p => p.id === end)
    
    if (start === end) {
      return startPeriod ? `${startPeriod.numero}/${startPeriod.año}` : "Período seleccionado"
    }
    
    return startPeriod && endPeriod 
      ? `${startPeriod.numero}/${startPeriod.año} → ${endPeriod.numero}/${endPeriod.año}`
      : "Rango inválido"
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{getDisplayText()}</span>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {isOpen && (
        <Card className="absolute z-10 mt-1 w-[320px] p-3 shadow-lg">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual">Individual</TabsTrigger>
              <TabsTrigger value="rango">Rango</TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="mt-3">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {periodos.map((periodo) => (
                  <div
                    key={periodo.id}
                    onClick={() => handleIndividualSelect(periodo.id)}
                    className={cn(
                      "p-2 rounded-md cursor-pointer hover:bg-accent transition-colors",
                      rangoSeleccionado?.[0] === periodo.id && "bg-blue-100 dark:bg-blue-900 font-medium",
                      periodo.id === periodoActual?.id && "border-l-4 border-blue-500"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <span>Período {periodo.numero}/{periodo.año}</span>
                      {rangoSeleccionado?.[0] === periodo.id && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                          Seleccionado
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatFecha(periodo.fechaInicio)} - {formatFecha(periodo.fechaFin)}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="rango" className="mt-3">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {periodos.map((periodo) => {
                  const isStart = periodo.id === tempStart
                  const isEnd = periodo.id === tempEnd
                  const isInRange = tempStart && tempEnd && 
                    periodo.id >= tempStart && periodo.id <= tempEnd
                  
                  return (
                    <div
                      key={periodo.id}
                      onClick={() => {
                        if (tempStart === null || (tempStart && tempEnd)) {
                          handleRangeStartSelect(periodo.id)
                        } else {
                          handleRangeEndSelect(periodo.id)
                        }
                      }}
                      className={cn(
                        "p-2 rounded-md cursor-pointer transition-colors",
                        isStart && "bg-green-100 dark:bg-green-900",
                        isEnd && "bg-red-100 dark:bg-red-900",
                        isInRange && "bg-blue-50 dark:bg-blue-800",
                        !isStart && !isEnd && !isInRange && "hover:bg-accent"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <span>Período {periodo.numero}/{periodo.año}</span>
                        {isStart && <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">Inicio</span>}
                        {isEnd && <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">Fin</span>}
                        {isInRange && !isStart && !isEnd && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">En rango</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatFecha(periodo.fechaInicio)} - {formatFecha(periodo.fechaFin)}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-between mt-4 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTempStart(null)
                    setTempEnd(null)
                  }}
                  disabled={!tempStart && !tempEnd}
                >
                  Limpiar
                </Button>
                <Button
                  size="sm"
                  onClick={applyRangeSelection}
                  disabled={!tempStart}
                >
                  {tempStart && tempEnd ? "Aplicar rango" : "Seleccionar"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  )
}