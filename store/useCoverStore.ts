import { create } from "zustand"
import { coversApi } from "@/lib/api/covers-api"
import type { Cover } from "@/types/schema"

interface CoversState {
  covers: Cover[]
  coverSeleccionado: Cover | null
  isLoading: boolean
  error: string | null

  // Acciones
  fetchCovers: (params?: {
    periodoId?: number
    instructorReemplazoId?: number
    claseId?: string
    justificacion?: boolean
    pagoBono?: boolean
    pagoFullHouse?: boolean
  }) => Promise<void>
  fetchCover: (id: number) => Promise<void>
  crearCover: (cover: Omit<Cover, "id" | "createdAt" | "updatedAt">) => Promise<Cover>
  actualizarCover: (id: number, cover: Partial<Cover>) => Promise<Cover>
  eliminarCover: (id: number) => Promise<void>
  setCoverSeleccionado: (cover: Cover | null) => void
  resetCovers: () => void
  
  // Acciones específicas para covers
  fetchCoversPorClase: (claseId: string) => Promise<void>
  fetchCoversPorInstructor: (instructorId: number, periodoId?: number) => Promise<void>
  fetchCoversPorPeriodo: (periodoId: number) => Promise<void>
  aprobarCover: (id: number) => Promise<Cover>
  rechazarCover: (id: number, comentarios?: string) => Promise<Cover>
  enlazarCovers: (periodoId: number) => Promise<number>
}

export const useCoversStore = create<CoversState>((set, get) => ({
  covers: [],
  coverSeleccionado: null,
  isLoading: false,
  error: null,

  fetchCovers: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const covers = await coversApi.getCovers(params)
      set({ covers, isLoading: false })
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
        covers: [...state.covers, nuevoCover],
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

  enlazarCovers: async (periodoId: number) => {
    set({ isLoading: true, error: null })
    
    try {
      // 1. Llamar al endpoint para enlazar los covers del período
      const { updatedCount } = await coversApi.enlazarCoversPeriodo(periodoId)
      
      // 2. Actualizar el estado local con los cambios
      const coversActualizados = await coversApi.getCovers({ periodoId })
      
      set((state) => ({
        covers: state.covers.map(cover => {
          // Reemplazar los covers del período con los actualizados
          if (cover.periodoId === periodoId) {
            const actualizado = coversActualizados.find(c => c.id === cover.id)
            return actualizado || cover
          }
          return cover
        }),
        isLoading: false
      }))
      
      // 3. Mostrar feedback al usuario
      if (updatedCount > 0) {
        console.log(`Se enlazaron ${updatedCount} covers correctamente`)
      } else {
        console.log('No se encontraron covers para enlazar en este período')
      }
      
      return updatedCount
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al enlazar covers'
      
      set({
        error: errorMessage,
        isLoading: false
      })
      
      console.error('Error en enlazarCovers:', error)
      throw new Error(errorMessage)
    }
  },

  setCoverSeleccionado: (cover) => {
    set({ coverSeleccionado: cover })
  },

  resetCovers: () => {
    set({ covers: [], error: null })
  },

  // Acciones específicas
  fetchCoversPorClase: async (claseId: string) => {
    await get().fetchCovers({ claseId })
  },

  fetchCoversPorInstructor: async (instructorId: number, periodoId?: number) => {
    await get().fetchCovers({ instructorReemplazoId: instructorId, periodoId })
  },

  fetchCoversPorPeriodo: async (periodoId: number) => {
    await get().fetchCovers({ periodoId })
  },

  aprobarCover: async (id: number) => {
    return await get().actualizarCover(id, { 
      justificacion: true,
      pagoBono: true 
    })
  },

  rechazarCover: async (id: number, comentarios?: string) => {
    return await get().actualizarCover(id, { 
      justificacion: false,
      pagoBono: false,
      comentarios 
    })
  },
}))