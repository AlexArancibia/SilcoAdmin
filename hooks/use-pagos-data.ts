"use client"

import { useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { usePagosStore } from "@/store/usePagosStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { useClasesStore } from "@/store/useClasesStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { useFormulasStore } from "@/store/useFormulaStore"
import { downloadPagoPDF, printPagoPDF } from "@/utils/pago-instructor-pdf"
import { downloadPagosPDF, printPagosPDF } from "@/utils/pagos-pdf"

export function usePagosData() {
  const { pagos, fetchPagos, isLoading: isLoadingPagos } = usePagosStore()
  const { periodos, periodosSeleccionados, periodoActual } = usePeriodosStore()
  const { instructores, fetchInstructores } = useInstructoresStore()
  const { clases, fetchClases } = useClasesStore()
  const { disciplinas, fetchDisciplinas } = useDisciplinasStore()
  const { formulas, fetchFormulas } = useFormulasStore()

  // Cargar datos iniciales
  useEffect(() => {
    fetchInstructores()
    fetchDisciplinas()
    fetchFormulas()
    fetchPagos()
    fetchClases()
  }, [fetchInstructores, fetchDisciplinas, fetchPagos, fetchClases, fetchFormulas])

  // Función para exportar un pago individual a PDF
  const exportarPagoPDF = (pagoId: number) => {
    const pago = pagos.find((p) => p.id === pagoId)
    if (!pago) return

    const instructor = instructores.find((i) => i.id === pago.instructorId)
    const periodo = periodos.find((p) => p.id === pago.periodoId)

    if (!instructor || !periodo) return

    const clasesInstructor = clases.filter(
      (c) => c.instructorId === pago.instructorId && c.periodoId === pago.periodoId,
    )

    downloadPagoPDF(pago, instructor, periodo, clasesInstructor, disciplinas)
  }

  // Función para imprimir un pago individual
  const imprimirPagoPDF = (pagoId: number) => {
    const pago = pagos.find((p) => p.id === pagoId)
    if (!pago) return

    const instructor = instructores.find((i) => i.id === pago.instructorId)
    const periodo = periodos.find((p) => p.id === pago.periodoId)

    if (!instructor || !periodo) return

    const clasesInstructor = clases.filter(
      (c) => c.instructorId === pago.instructorId && c.periodoId === pago.periodoId,
    )

    printPagoPDF(pago, instructor, periodo, clasesInstructor, disciplinas)
  }

  // Función para exportar todos los pagos filtrados a PDF
  const exportarTodosPagosPDF = (filteredPagos: any[], filtroEstado: string, filtroInstructor: string) => {
    if (filteredPagos.length === 0) {
      toast({
        title: "No hay pagos para exportar",
        description: "No se encontraron pagos con los filtros seleccionados.",
        variant: "destructive",
      })
      return
    }

    // Preparar información de filtros para el PDF
    const filtrosInfo = {
      estado: filtroEstado,
      instructor: filtroInstructor,
      periodos:
        periodosSeleccionados.length > 0
          ? periodosSeleccionados.map((p) => `${p.numero}-${p.año}`).join(", ")
          : undefined,
    }

    downloadPagosPDF(filteredPagos, instructores, periodos, filtrosInfo)

    toast({
      title: "Reporte generado",
      description: `Se ha generado un PDF con ${filteredPagos.length} pagos.`,
    })
  }

  // Función para imprimir todos los pagos filtrados
  const imprimirTodosPagosPDF = (filteredPagos: any[], filtroEstado: string, filtroInstructor: string) => {
    if (filteredPagos.length === 0) {
      toast({
        title: "No hay pagos para imprimir",
        description: "No se encontraron pagos con los filtros seleccionados.",
        variant: "destructive",
      })
      return
    }

    // Preparar información de filtros para el PDF
    const filtrosInfo = {
      estado: filtroEstado,
      instructor: filtroInstructor,
      periodos:
        periodosSeleccionados.length > 0
          ? periodosSeleccionados.map((p) => `${p.numero}-${p.año}`).join(", ")
          : undefined,
    }

    printPagosPDF(filteredPagos, instructores, periodos, filtrosInfo)
  }

  return {
    pagos,
    instructores,
    periodos,
    periodosSeleccionados,
    periodoActual,
    isLoadingPagos,
    exportarPagoPDF,
    imprimirPagoPDF,
    exportarTodosPagosPDF,
    imprimirTodosPagosPDF,
  }
}
