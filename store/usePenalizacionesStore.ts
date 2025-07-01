import { create } from "zustand"
import { penalizacionesApi } from "@/lib/api/penalizaciones-api"
import type { Penalizacion, TipoPenalizacion } from "@/types/schema"

interface PenalizacionesState {
  penalizaciones: Penalizacion[]
  penalizacionSeleccionada: Penalizacion | null
  isLoading: boolean
  error: string | null

  // Acciones básicas CRUD
  fetchPenalizaciones: (params?: {
    instructorId?: number
    disciplinaId?: number
    periodoId?: number
    tipo?: TipoPenalizacion
    activa?: boolean
  }) => Promise<void>
  fetchPenalizacion: (id: number) => Promise<void>
  crearPenalizacion: (penalizacion: Omit<Penalizacion, "id" | "createdAt" | "updatedAt">) => Promise<Penalizacion>
  actualizarPenalizacion: (id: number, penalizacion: Partial<Penalizacion>) => Promise<Penalizacion>
  eliminarPenalizacion: (id: number) => Promise<void>
  setPenalizacionSeleccionada: (penalizacion: Penalizacion | null) => void
  resetPenalizaciones: () => void
  
  // Acciones específicas para penalizaciones
  fetchPenalizacionesPorInstructor: (instructorId: number, periodoId?: number) => Promise<void>
  fetchPenalizacionesPorPeriodo: (periodoId: number) => Promise<void>
  fetchPenalizacionesPorDisciplina: (disciplinaId: number, periodoId?: number) => Promise<void>
  fetchPenalizacionesPorTipo: (tipo: TipoPenalizacion, periodoId?: number) => Promise<void>
  fetchPenalizacionesActivas: (periodoId?: number) => Promise<void>
  activarPenalizacion: (id: number) => Promise<Penalizacion>
  desactivarPenalizacion: (id: number) => Promise<Penalizacion>
  
  // Métodos para cálculos y estadísticas
  calcularPuntosTotalesPorInstructor: (instructorId: number, periodoId: number) => Promise<{
    totalPuntos: number
    penalizaciones: Penalizacion[]
  }>
}

export const usePenalizacionesStore = create<PenalizacionesState>((set, get) => ({
  penalizaciones: [],
  penalizacionSeleccionada: null,
  isLoading: false,
  error: null,

  fetchPenalizaciones: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const penalizaciones = await penalizacionesApi.getPenalizaciones(params)
      set({ penalizaciones, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener penalizaciones",
        isLoading: false,
      })
      console.error("Error al obtener penalizaciones:", error)
    }
  },

  fetchPenalizacion: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const penalizacion = await penalizacionesApi.getPenalizacionById(id)
      set({ penalizacionSeleccionada: penalizacion, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener la penalización",
        isLoading: false,
      })
      console.error(`Error al obtener la penalización con ID ${id}:`, error)
    }
  },

  crearPenalizacion: async (penalizacion) => {
    set({ isLoading: true, error: null })
    try {
      const nuevaPenalizacion = await penalizacionesApi.createPenalizacion(penalizacion)
      set((state) => ({
        penalizaciones: [...state.penalizaciones, nuevaPenalizacion],
        isLoading: false,
      }))
      return nuevaPenalizacion
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al crear la penalización",
        isLoading: false,
      })
      console.error("Error al crear la penalización:", error)
      throw error
    }
  },

  actualizarPenalizacion: async (id, penalizacion) => {
    set({ isLoading: true, error: null })
    try {
      const penalizacionActualizada = await penalizacionesApi.updatePenalizacion(id, penalizacion)
      set((state) => ({
        penalizaciones: state.penalizaciones.map((p) => (p.id === id ? penalizacionActualizada : p)),
        penalizacionSeleccionada: state.penalizacionSeleccionada?.id === id ? penalizacionActualizada : state.penalizacionSeleccionada,
        isLoading: false,
      }))
      return penalizacionActualizada
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al actualizar la penalización",
        isLoading: false,
      })
      console.error(`Error al actualizar la penalización con ID ${id}:`, error)
      throw error
    }
  },

  eliminarPenalizacion: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await penalizacionesApi.deletePenalizacion(id)
      set((state) => ({
        penalizaciones: state.penalizaciones.filter((p) => p.id !== id),
        penalizacionSeleccionada: state.penalizacionSeleccionada?.id === id ? null : state.penalizacionSeleccionada,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al eliminar la penalización",
        isLoading: false,
      })
      console.error(`Error al eliminar la penalización con ID ${id}:`, error)
      throw error
    }
  },

  setPenalizacionSeleccionada: (penalizacion) => {
    set({ penalizacionSeleccionada: penalizacion })
  },

  resetPenalizaciones: () => {
    set({ penalizaciones: [], penalizacionSeleccionada: null, error: null })
  },

  // Acciones específicas - usando los métodos de la API
  fetchPenalizacionesPorInstructor: async (instructorId: number, periodoId?: number) => {
    set({ isLoading: true, error: null })
    try {
      const penalizaciones = await penalizacionesApi.getPenalizacionesByInstructor(instructorId, periodoId)
      set({ penalizaciones, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener penalizaciones por instructor",
        isLoading: false,
      })
      console.error("Error al obtener penalizaciones por instructor:", error)
    }
  },

  fetchPenalizacionesPorPeriodo: async (periodoId: number) => {
    set({ isLoading: true, error: null })
    try {
      const penalizaciones = await penalizacionesApi.getPenalizacionesByPeriodo(periodoId)
      set({ penalizaciones, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener penalizaciones por período",
        isLoading: false,
      })
      console.error("Error al obtener penalizaciones por período:", error)
    }
  },

  fetchPenalizacionesPorDisciplina: async (disciplinaId: number, periodoId?: number) => {
    set({ isLoading: true, error: null })
    try {
      const penalizaciones = await penalizacionesApi.getPenalizacionesByDisciplina(disciplinaId, periodoId)
      set({ penalizaciones, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener penalizaciones por disciplina",
        isLoading: false,
      })
      console.error("Error al obtener penalizaciones por disciplina:", error)
    }
  },

  fetchPenalizacionesPorTipo: async (tipo: TipoPenalizacion, periodoId?: number) => {
    set({ isLoading: true, error: null })
    try {
      const penalizaciones = await penalizacionesApi.getPenalizacionesByTipo(tipo, periodoId)
      set({ penalizaciones, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener penalizaciones por tipo",
        isLoading: false,
      })
      console.error("Error al obtener penalizaciones por tipo:", error)
    }
  },

  fetchPenalizacionesActivas: async (periodoId?: number) => {
    set({ isLoading: true, error: null })
    try {
      const penalizaciones = await penalizacionesApi.getPenalizacionesActivas(periodoId)
      set({ penalizaciones, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener penalizaciones activas",
        isLoading: false,
      })
      console.error("Error al obtener penalizaciones activas:", error)
    }
  },

  activarPenalizacion: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const penalizacionActualizada = await penalizacionesApi.reactivarPenalizacion(id)
      set((state) => ({
        penalizaciones: state.penalizaciones.map((p) => (p.id === id ? penalizacionActualizada : p)),
        penalizacionSeleccionada: state.penalizacionSeleccionada?.id === id ? penalizacionActualizada : state.penalizacionSeleccionada,
        isLoading: false,
      }))
      return penalizacionActualizada
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al activar la penalización",
        isLoading: false,
      })
      console.error(`Error al activar la penalización con ID ${id}:`, error)
      throw error
    }
  },

  desactivarPenalizacion: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const penalizacionActualizada = await penalizacionesApi.desactivarPenalizacion(id)
      set((state) => ({
        penalizaciones: state.penalizaciones.map((p) => (p.id === id ? penalizacionActualizada : p)),
        penalizacionSeleccionada: state.penalizacionSeleccionada?.id === id ? penalizacionActualizada : state.penalizacionSeleccionada,
        isLoading: false,
      }))
      return penalizacionActualizada
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al desactivar la penalización",
        isLoading: false,
      })
      console.error(`Error al desactivar la penalización con ID ${id}:`, error)
      throw error
    }
  },

  calcularPuntosTotalesPorInstructor: async (instructorId: number, periodoId: number) => {
    set({ isLoading: true, error: null })
    try {
      const resultado = await penalizacionesApi.getPuntosTotalesByInstructor(instructorId, periodoId)
      set({ isLoading: false })
      return resultado
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al calcular puntos totales",
        isLoading: false,
      })
      console.error("Error al calcular puntos totales por instructor:", error)
      throw error
    }
  },
}))