"use client"

import { useEffect } from "react"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

export function CurrentPeriodDisplay({ className }: { className?: string }) {
  const {
    fetchPeriodos,
    isLoading,
    periodoActual
  } = usePeriodosStore()
  
  useEffect(() => {
    fetchPeriodos()
  }, [fetchPeriodos])

  const formatFecha = (fecha: Date | string) => {
    const fechaObj = new Date(fecha)
    return isNaN(fechaObj.getTime()) ? "" : format(fechaObj, "dd MMM yyyy", { locale: es })
  }

  if (isLoading) {
    return (
      <div className={cn(
        "bg-card text-card-foreground shadow-sm rounded-lg p-3 my-2 w-full",
        "flex items-center justify-center",
        className
      )}>
        <span className="text-muted-foreground animate-pulse">Cargando período...</span>
      </div>
    )
  }

  if (!periodoActual) {
    return (
      <div className={cn(
        "bg-card text-card-foreground shadow-sm rounded-lg p-3 my-2 w-full",
        "flex items-center justify-center",
        className
      )}>
        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
        <span className="text-muted-foreground">No hay período activo</span>
      </div>
    )
  }

  return (
    <div className={cn(
      "text-card-foreground rounded-lg  my-2 w-full",
      "flex items-center justify-between",
      className
    )}>
      <div className="flex items-center space-x-3 overflow-hidden">
        <div className={cn(
          "flex-shrink-0 flex items-center justify-center p-2 rounded-full",
          "bg-primary/10 text-primary"
        )}>
          <Calendar className="h-4 w-4" />
        </div>
        
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium truncate">
            Período Actual : {periodoActual.numero}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {formatFecha(periodoActual.fechaInicio)} - {formatFecha(periodoActual.fechaFin)}
          </span>
        </div>
      </div>
      
 
    </div>
  )
}