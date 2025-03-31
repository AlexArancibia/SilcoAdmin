"use client"

import { useEffect, useState, useCallback } from "react"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Periodo } from "@/types/schema"

export function PeriodSelector() {
  const { periodos, periodoSeleccionadoId, setPeriodoSeleccionado, fetchPeriodos, isLoading } = usePeriodosStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchPeriodos()
  }, [fetchPeriodos])

  const determinarPeriodoActual = useCallback(() => {
    if (periodos.length === 0 || periodoSeleccionadoId !== null) return

    const hoy = new Date()
    const periodoActual = periodos.find(({ fechaInicio, fechaFin }) => {
      const inicio = new Date(fechaInicio)
      const fin = new Date(fechaFin)
      return hoy >= inicio && hoy <= fin
    })

    if (periodoActual) {
      setPeriodoSeleccionado(periodoActual.id)
    } else {
      const periodoCercano = [...periodos].sort((a, b) => {
        return Math.abs(new Date(a.fechaInicio).getTime() - hoy.getTime()) -
               Math.abs(new Date(b.fechaInicio).getTime() - hoy.getTime())
      })[0]
      if (periodoCercano) setPeriodoSeleccionado(periodoCercano.id)
    }
  }, [periodos, periodoSeleccionadoId, setPeriodoSeleccionado])

  useEffect(determinarPeriodoActual, [determinarPeriodoActual])

  const handlePeriodoChange = (value: string) => setPeriodoSeleccionado(Number(value))

  const formatFecha = (fecha: Date | string, formatStr: string) => {
    if (!mounted) return "Cargando..."
    const fechaObj = new Date(fecha)
    return isNaN(fechaObj.getTime()) ? "Fecha inválida" : format(fechaObj, formatStr, { locale: es })
  }

  return (
    <Select value={periodoSeleccionadoId?.toString()} onValueChange={handlePeriodoChange} disabled={isLoading}>
      <SelectTrigger className="w-full max-w-xs border border-gray-300 dark:border-gray-600 bg-background dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors p-2 rounded-md focus:ring-2 focus:ring-primary focus:outline-none">
        <SelectValue placeholder="Seleccionar periodo" />
      </SelectTrigger>
      <SelectContent className="w-full max-w-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow-lg rounded-md overflow-hidden">
        {periodos.map((periodo) => (
          <SelectItem key={periodo.id} value={periodo.id.toString()} className="py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <div className="flex flex-col">
              <span className="font-medium text-gray-900 dark:text-gray-100">Periodo {periodo.numero} - {periodo.año}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {formatFecha(periodo.fechaInicio, "dd MMM")} - {formatFecha(periodo.fechaFin, "dd MMM yyyy")}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}