import { create } from "zustand"
import { coversApi } from "@/lib/api/covers-api"
import type { Cover, CoversQueryParams, PaginatedResponse, StatusCover } from "@/types/schema"

interface CoversState {
  // Data state
  covers: Cover[]
  coverSeleccionado: Cover | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  } | null
  
  // UI state
  isLoading: boolean
  error: string | null

  // Actions - General
  fetchCovers: (params?: CoversQueryParams) => Promise<void>
  fetchCover: (id: number) => Promise<void>
  crearCover: (cover: {
    instructorOriginalId: number
    instructorReemplazoId: number
    disciplinaId: number
    periodoId: number
    fecha: Date | string
    hora: string
    claseId?: string
    comentarios?: string
    cambioDeNombre?: string
  }) => Promise<Cover>
  actualizarCover: (id: number, cover: Partial<Cover>) => Promise<Cover>
  eliminarCover: (id: number) => Promise<void>
  setCoverSeleccionado: (cover: Cover | null) => void
  resetCovers: () => void
  
  // Actions - Instructor specific (solo ven covers donde fueron reemplazo)
  fetchMisReemplazos: (instructorReemplazoId: number, params?: Omit<CoversQueryParams, 'instructorReemplazoId'>) => Promise<void>
  crearMiCover: (cover: {
    instructorOriginalId: number
    instructorReemplazoId: number
    disciplinaId: number
    periodoId: number
    fecha: Date | string
    hora: string
    claseId?: string
    comentarios?: string
    cambioDeNombre?: string
  }) => Promise<Cover>
  
  // Actions - Manager/Admin specific
  fetchCoversByInstructorOriginal: (instructorOriginalId: number, params?: Omit<CoversQueryParams, 'instructorOriginalId'>) => Promise<void>
  fetchCoversByJustificacion: (justificacion: StatusCover, params?: Omit<CoversQueryParams, 'justificacion'>) => Promise<void>
  updateCoverJustificacion: (id: number, justificacion: StatusCover, comentarios?: string) => Promise<Cover>
  updateCoverPayments: (id: number, payments: {
    pagoBono?: boolean
    pagoFullHouse?: boolean
  }) => Promise<Cover>
  enlazarCoverConClase: (id: number, claseId: string) => Promise<Cover>
  
  // Actions - Search and filters
  searchCovers: (busqueda: string, params?: Omit<CoversQueryParams, 'busqueda'>) => Promise<void>
  fetchCoversByPeriodo: (periodoId: number, params?: Omit<CoversQueryParams, 'periodoId'>) => Promise<void>
  fetchCoversByDisciplina: (disciplinaId: number, params?: Omit<CoversQueryParams, 'disciplinaId'>) => Promise<void>
  fetchCoversByFecha: (fecha: string, params?: Omit<CoversQueryParams, 'fecha'>) => Promise<void>
}

export const useCoversStore = create<CoversState>((set, get) => ({
  // Initial state
  covers: [],
  coverSeleccionado: null,
  pagination: null,
  isLoading: false,
  error: null,

  // General actions
  fetchCovers: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const response = await coversApi.getCovers(params)
      set({ 
        covers: response.data, 
        pagination: response.pagination,
        isLoading: false 
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener covers",
        isLoading: false,
      })
      console.error("Error al obtener covers:", error)
    }
  },

  fetchCover: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const cover = await coversApi.getCoverById(id)
      set({ coverSeleccionado: cover, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener el cover",
        isLoading: false,
      })
      console.error(`Error al obtener el cover con ID ${id}:`, error)
    }
  },

  crearCover: async (cover) => {
    set({ isLoading: true, error: null })
    try {
      const nuevoCover = await coversApi.createCover(cover)
      set((state) => ({
        covers: [nuevoCover, ...state.covers],
        pagination: state.pagination ? {
          ...state.pagination,
          total: state.pagination.total + 1
        } : null,
        isLoading: false,
      }))
      return nuevoCover
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al crear el cover",
        isLoading: false,
      })
      console.error("Error al crear el cover:", error)
      throw error
    }
  },

  actualizarCover: async (id, cover) => {
    set({ isLoading: true, error: null })
    try {
      const coverActualizado = await coversApi.updateCover(id, cover)
      set((state) => ({
        covers: state.covers.map((c) => (c.id === id ? coverActualizado : c)),
        coverSeleccionado: state.coverSeleccionado?.id === id ? coverActualizado : state.coverSeleccionado,
        isLoading: false,
      }))
      return coverActualizado
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al actualizar el cover",
        isLoading: false,
      })
      console.error(`Error al actualizar el cover con ID ${id}:`, error)
      throw error
    }
  },

  eliminarCover: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await coversApi.deleteCover(id)
      set((state) => ({
        covers: state.covers.filter((c) => c.id !== id),
        coverSeleccionado: state.coverSeleccionado?.id === id ? null : state.coverSeleccionado,
        pagination: state.pagination ? {
          ...state.pagination,
          total: Math.max(0, state.pagination.total - 1)
        } : null,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al eliminar el cover",
        isLoading: false,
      })
      console.error(`Error al eliminar el cover con ID ${id}:`, error)
      throw error
    }
  },

  setCoverSeleccionado: (cover) => {
    set({ coverSeleccionado: cover })
  },

  resetCovers: () => {
    set({ covers: [], pagination: null, error: null })
  },

  // Instructor specific actions
  fetchMisReemplazos: async (instructorReemplazoId: number, params) => {
    set({ isLoading: true, error: null })
    try {
      const response = await coversApi.getMisReemplazos({ instructorReemplazoId, ...params })
      set({ 
        covers: response.data, 
        pagination: response.pagination,
        isLoading: false 
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener mis reemplazos",
        isLoading: false,
      })
      console.error("Error al obtener mis reemplazos:", error)
    }
  },

  crearMiCover: async (cover) => {
    return await get().crearCover(cover)
  },

  // Manager/Admin specific actions
  fetchCoversByInstructorOriginal: async (instructorOriginalId: number, params) => {
    await get().fetchCovers({ instructorOriginalId, ...params })
  },

  fetchCoversByJustificacion: async (justificacion: StatusCover, params) => {
    await get().fetchCovers({ justificacion, ...params })
  },

  updateCoverJustificacion: async (id: number, justificacion: StatusCover, comentarios?: string) => {
    return await get().actualizarCover(id, { justificacion, comentarios })
  },

  updateCoverPayments: async (id: number, payments) => {
    return await get().actualizarCover(id, payments)
  },

  enlazarCoverConClase: async (id: number, claseId: string) => {
    return await get().actualizarCover(id, { claseId })
  },

  // Search and filter actions
  searchCovers: async (busqueda: string, params) => {
    await get().fetchCovers({ busqueda, ...params })
  },

  fetchCoversByPeriodo: async (periodoId: number, params) => {
    await get().fetchCovers({ periodoId, ...params })
  },

  fetchCoversByDisciplina: async (disciplinaId: number, params) => {
    await get().fetchCovers({ disciplinaId, ...params })
  },

  fetchCoversByFecha: async (fecha: string, params) => {
    await get().fetchCovers({ fecha, ...params })
  },
}))