import { create } from "zustand"
import { pagosApi } from "@/lib/api/pagos-api"

import type { PagoInstructor, PaginatedResponse, PagosQueryParams } from "@/types/schema"

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PagosState {
  pagos: PagoInstructor[]
  pagoSeleccionado: PagoInstructor | null
  pagination: PaginationState
  isLoading: boolean
  error: string | null

  // Acciones
  fetchPagos: (params?: PagosQueryParams) => Promise<void>
  fetchPago: (id: number) => Promise<void>
  crearPago: (pago: Omit<PagoInstructor, "id" | "createdAt" | "updatedAt">) => Promise<PagoInstructor>
  actualizarPago: (id: number, pago: Partial<PagoInstructor>) => Promise<PagoInstructor>
  eliminarPago: (id: number) => Promise<void>
  setPagoSeleccionado: (pago: PagoInstructor | null) => void
  exportarExcel: (params?: PagosQueryParams) => Promise<{ success: boolean; data: any[]; total: number }>
}

const initialPaginationState: PaginationState = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};


export const usePagosStore = create<PagosState>((set, get) => ({
  pagos: [],
  pagoSeleccionado: null,
  pagination: initialPaginationState,
  isLoading: false,
  error: null,

  fetchPagos: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const response: PaginatedResponse<PagoInstructor> = await pagosApi.getPagos(params);
      set({ 
        pagos: response.data, 
        pagination: response.pagination, 
        isLoading: false 
      });
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
      console.log("🔍 [DEBUG PAGO] Pago obtenido:", pago)
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener el pago",
        isLoading: false,
      })
      console.error(`Error al obtener el pago con ID ${id}:`, error)
    }
  },

  crearPago: async (pago) => {
    set({ isLoading: true, error: null })
    try {
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

  exportarExcel: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const result = await pagosApi.exportarExcel(params)
      set({ isLoading: false })
      return result
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al exportar a Excel",
        isLoading: false,
      })
      console.error("Error al exportar pagos a Excel:", error)
      throw error
    }
  },
}))

