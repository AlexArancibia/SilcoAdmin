"use client"

import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import { usePagosStore } from "@/store/usePagosStore"
import { retencionValor } from "@/utils/const"
import type { PagoInstructor, TipoReajuste } from "@/types/schema"

export function useReajuste() {
  const { pagos, actualizarPago } = usePagosStore()

  // Estados para edición de reajuste
  const [editandoPagoId, setEditandoPagoId] = useState<number | null>(null)
  const [nuevoReajuste, setNuevoReajuste] = useState<number>(0)
  const [tipoReajuste, setTipoReajuste] = useState<TipoReajuste>("FIJO")
  const [isActualizandoReajuste, setIsActualizandoReajuste] = useState<boolean>(false)

  // Función para iniciar edición de reajuste
  const iniciarEdicionReajuste = (pago: PagoInstructor) => {
    setEditandoPagoId(pago.id)
    setNuevoReajuste(pago.reajuste)
    setTipoReajuste(pago.tipoReajuste)
  }

  // Función para cancelar edición de reajuste
  const cancelarEdicionReajuste = () => {
    setEditandoPagoId(null)
  }

  // Función para actualizar el reajuste
  const actualizarReajuste = async (pagoId: number) => {
    const pago = pagos.find((p) => p.id === pagoId)
    if (!pago) return

    setIsActualizandoReajuste(true)

    try {
      // Asegurarse de que el bono esté definido
      const bono = pago.bono || 0

      // Calculate the adjusted amount first
      const montoBase = pago.monto
      const reajusteCalculado = tipoReajuste === "PORCENTAJE" ? (montoBase * nuevoReajuste) / 100 : nuevoReajuste

      // Calculate the retention based on the adjusted amount INCLUDING the bonus
      const montoAjustado = montoBase + reajusteCalculado + bono
      const retencionCalculada = montoAjustado * retencionValor

      // Calculate the final payment
      const pagoFinal = montoAjustado - retencionCalculada

      const pagoActualizado = {
        ...pago,
        reajuste: nuevoReajuste,
        tipoReajuste: tipoReajuste,
        retencion: retencionCalculada,
        pagoFinal: pagoFinal,
      }

      await actualizarPago(pagoId, pagoActualizado)

      toast({
        title: "Reajuste actualizado",
        description: `El reajuste ha sido actualizado exitosamente.`,
      })

      setEditandoPagoId(null)
    } catch (error) {
      toast({
        title: "Error al actualizar reajuste",
        description: error instanceof Error ? error.message : "Error desconocido al actualizar reajuste",
        variant: "destructive",
      })
    } finally {
      setIsActualizandoReajuste(false)
    }
  }

  return {
    editandoPagoId,
    nuevoReajuste,
    tipoReajuste,
    isActualizandoReajuste,
    setNuevoReajuste,
    setTipoReajuste,
    iniciarEdicionReajuste,
    cancelarEdicionReajuste,
    actualizarReajuste,
  }
}
