import { create } from "zustand"
import { pagosApi } from "@/lib/api/pagos-api"
import type { PagoInstructor } from "@/types/schema"

interface PagosState {
  pagos: PagoInstructor[]
  pagoSeleccionado: PagoInstructor | null
  isLoading: boolean
  error: string | null

  // Acciones
  fetchPagos: (params?: { periodoId?: number; instructorId?: number }) => Promise<void>
  fetchPago: (id: number) => Promise<void>
  crearPago: (pago: Omit<PagoInstructor, "id" | "createdAt" | "updatedAt">) => Promise<PagoInstructor>
  actualizarPago: (id: number, pago: Partial<PagoInstructor>) => Promise<PagoInstructor>
  eliminarPago: (id: number) => Promise<void>
  setPagoSeleccionado: (pago: PagoInstructor | null) => void
}

export const usePagosStore = create<PagosState>((set, get) => ({
  pagos: [],
  pagoSeleccionado: null,
  isLoading: false,
  error: null,

  fetchPagos: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const pagos = await pagosApi.getPagos(params)
      set({ pagos, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener pagos",
        isLoading: false,
      })
      console.error("Error al obtener pagos:", error)
    }
  },

  fetchPago: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const pago = await pagosApi.getPago(id)
      set({ pagoSeleccionado: pago, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener el pago",
        isLoading: false,
      })
      console.error(`Error al obtener el pago con ID ${id}:`, error)
    }
  },

  crearPago: async (pago: Omit<PagoInstructor, "id" | "createdAt" | "updatedAt">) => {
    try {
      set({ isLoading: true })
      const nuevoPago = await pagosApi.crearPago(pago)
      set((state) => ({
        pagos: [...state.pagos, nuevoPago],
        isLoading: false,
      }))
      return nuevoPago
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : "Error al crear el pago" })
      throw error
    }
  },

  actualizarPago: async (id, pago) => {
    set({ isLoading: true, error: null })
    try {
      const pagoActualizado = await pagosApi.actualizarPago(id, pago)
      set((state) => ({
        pagos: state.pagos.map((p) => (p.id === id ? pagoActualizado : p)),
        pagoSeleccionado: state.pagoSeleccionado?.id === id ? pagoActualizado : state.pagoSeleccionado,
        isLoading: false,
      }))
      return pagoActualizado
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al actualizar el pago",
        isLoading: false,
      })
      console.error(`Error al actualizar el pago con ID ${id}:`, error)
      throw error
    }
  },

  eliminarPago: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await pagosApi.eliminarPago(id)
      set((state) => ({
        pagos: state.pagos.filter((p) => p.id !== id),
        pagoSeleccionado: state.pagoSeleccionado?.id === id ? null : state.pagoSeleccionado,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al eliminar el pago",
        isLoading: false,
      })
      console.error(`Error al eliminar el pago con ID ${id}:`, error)
      throw error
    }
  },

  setPagoSeleccionado: (pago) => {
    set({ pagoSeleccionado: pago })
  },
}))

