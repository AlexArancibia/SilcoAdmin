"use client"

import { useEffect, useState } from "react"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Asegurarnos de que estamos usando la interfaz correcta
import type { Periodo } from "@/types/schema"

export function PeriodSelector() {
  const { periodos, periodoSeleccionadoId, setPeriodoSeleccionado, fetchPeriodos, isLoading } = usePeriodosStore()
  const [mounted, setMounted] = useState(false)

  // Marcar como montado en el cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  // Cargar periodos al montar el componente
  useEffect(() => {
    fetchPeriodos()
  }, [fetchPeriodos])

  // Encontrar el periodo actual basado en la fecha actual
  useEffect(() => {
    if (periodos.length > 0 && periodoSeleccionadoId === null) {
      const hoy = new Date()

      // Buscar el periodo que contiene la fecha actual
      const periodoActual = periodos.find((periodo) => {
        // Asegurarnos de que las fechas son instancias de Date
        const fechaInicio = periodo.fechaInicio instanceof Date ? periodo.fechaInicio : new Date(periodo.fechaInicio)
        const fechaFin = periodo.fechaFin instanceof Date ? periodo.fechaFin : new Date(periodo.fechaFin)

        return hoy >= fechaInicio && hoy <= fechaFin
      })

      if (periodoActual) {
        setPeriodoSeleccionado(periodoActual.id)
      } else {
        // Si no hay un periodo actual, seleccionar el más cercano a la fecha actual
        const periodosOrdenados = [...periodos].sort((a, b) => {
          const fechaInicioA = a.fechaInicio instanceof Date ? a.fechaInicio : new Date(a.fechaInicio)
          const fechaInicioB = b.fechaInicio instanceof Date ? b.fechaInicio : new Date(b.fechaInicio)

          return Math.abs(fechaInicioA.getTime() - hoy.getTime()) - Math.abs(fechaInicioB.getTime() - hoy.getTime())
        })

        if (periodosOrdenados.length > 0) {
          setPeriodoSeleccionado(periodosOrdenados[0].id)
        }
      }
    }
  }, [periodos, periodoSeleccionadoId, setPeriodoSeleccionado])

  const handlePeriodoChange = (value: string) => {
    setPeriodoSeleccionado(Number.parseInt(value))
  }

  // Función mejorada para formatear fechas que valida la fecha
  const formatFecha = (fecha: Date | string, formatStr: string) => {
    if (!mounted) return "" // No formatear en el servidor o durante la hidratación
    try {
      // Asegurarnos de que fecha es una instancia de Date
      const fechaObj = fecha instanceof Date ? fecha : new Date(fecha)

      // Verificar si la fecha es válida antes de formatear
      if (isNaN(fechaObj.getTime())) {
        console.warn("Fecha inválida:", fecha)
        return "Fecha inválida"
      }

      return format(fechaObj, formatStr, { locale: es })
    } catch (error) {
      console.error("Error al formatear fecha:", error)
      return "Fecha inválida"
    }
  }

  // Función para obtener el nombre del periodo
  const getNombrePeriodo = (periodo: Periodo): string => {
    return `Periodo ${periodo.numero} - ${periodo.año}`
  }

  return (
    <Select value={periodoSeleccionadoId?.toString()} onValueChange={handlePeriodoChange} disabled={isLoading}>
      <SelectTrigger className="w-[200px] border-input bg-muted/50 text-muted-foreground font-medium hover:bg-muted transition-colors">
        <SelectValue placeholder="Seleccionar periodo" />
      </SelectTrigger>
      <SelectContent className="bg-background border-border shadow-md">
        {periodos.map((periodo) => {
          const isSelected = periodo.id === periodoSeleccionadoId
          return (
            <SelectItem
              key={periodo.id}
              value={periodo.id.toString()}
              className={`py-2 ${isSelected ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
            >
              <div className="flex flex-col">
                <span className="font-medium">{getNombrePeriodo(periodo)}</span>
                {mounted ? (
                  <span className="text-xs text-muted-foreground">
                    {formatFecha(periodo.fechaInicio, "dd MMM")} - {formatFecha(periodo.fechaFin, "dd MMM yyyy")}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Cargando fechas...</span>
                )}
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

