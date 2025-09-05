import { create } from "zustand"
import { instructoresApi } from "@/lib/api/instructores-api"
import type { Instructor } from "@/types/schema"

interface InstructoresState {
  instructores: Instructor[]
  instructorSeleccionado: Instructor | null
  isLoading: boolean
  error: string | null

  // Acciones
  fetchInstructores: () => Promise<void>
  fetchInstructor: (id: number) => Promise<void>
  crearInstructor: (instructor: Omit<Instructor, "id" | "createdAt" | "updatedAt">) => Promise<Instructor>
  actualizarInstructor: (id: number, instructor: Partial<Instructor>) => Promise<Instructor>
  eliminarInstructor: (id: number) => Promise<void>
  setInstructorSeleccionado: (instructor: Instructor | null) => void
  resetInstructores: () => void
}

export const useInstructoresStore = create<InstructoresState>((set, get) => ({
  instructores: [],
  instructorSeleccionado: null,
  isLoading: false,
  error: null,

  fetchInstructores: async () => {
    const startTime = performance.now()
    console.log(`[InstructoresStore] ⏱️ fetchInstructores called`)
    
    const { instructores, isLoading } = get()
    
    // Check if we already have instructores and we're not currently loading
    if (instructores.length > 0 && !isLoading) {
      console.log(`[InstructoresStore] ⏭️ fetchInstructores skipped - instructores already loaded (${instructores.length} items) - ${(performance.now() - startTime).toFixed(2)}ms`)
      return
    }
    
    console.log(`[InstructoresStore] 📡 fetchInstructores proceeding with fetch at ${new Date().toISOString()}`)
    set({ isLoading: true, error: null })
    try {
      console.log(`[InstructoresStore] 🌐 Making API request to get all instructores`)
      const apiStartTime = performance.now()
      const instructores = await instructoresApi.getInstructores()
      const apiEndTime = performance.now()
      const totalTime = performance.now() - startTime
      console.log(`[InstructoresStore] ✅ Successfully obtained ${instructores.length} instructores - API: ${(apiEndTime - apiStartTime).toFixed(2)}ms, Total: ${totalTime.toFixed(2)}ms`)
      set({ instructores, isLoading: false })
    } catch (error) {
      const totalTime = performance.now() - startTime
      console.error(`[InstructoresStore] ❌ Error fetching instructores after ${totalTime.toFixed(2)}ms:`, error)
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener instructores",
        isLoading: false,
      })
    }
  },

  fetchInstructor: async (id: number) => {
    console.log(`[InstructoresStore] Iniciando fetchInstructor con ID: ${id}`)
    set({ isLoading: true, error: null })
    try {
      console.log(`[InstructoresStore] Realizando petición a la API para instructor ID: ${id}`)
      const instructor = await instructoresApi.getInstructor(id)
      console.log(`[InstructoresStore] Respuesta exitosa:`, instructor)
      set({ instructorSeleccionado: instructor, isLoading: false })
    } catch (error) {
      console.error(`[InstructoresStore] Error al obtener el instructor con ID ${id}:`, error)
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener el instructor",
        isLoading: false,
      })
    }
  },

  crearInstructor: async (instructor) => {
    console.log(`[InstructoresStore] Iniciando crearInstructor:`, instructor)
    set({ isLoading: true, error: null })
    try {
      console.log(`[InstructoresStore] Realizando petición a la API para crear instructor`)
      const nuevoInstructor = await instructoresApi.crearInstructor(instructor)
      console.log(`[InstructoresStore] Instructor creado exitosamente:`, nuevoInstructor)

      set((state) => ({
        instructores: [...state.instructores, nuevoInstructor],
        isLoading: false,
      }))

      return nuevoInstructor
    } catch (error) {
      console.error(`[InstructoresStore] Error al crear instructor:`, error)
      set({
        error: error instanceof Error ? error.message : "Error desconocido al crear el instructor",
        isLoading: false,
      })
      throw error
    }
  },

  actualizarInstructor: async (id, instructor) => {
    console.log(`[InstructoresStore] Iniciando actualizarInstructor para ID ${id}:`, instructor)
    set({ isLoading: true, error: null })
    try {
      console.log(`[InstructoresStore] Realizando petición a la API para actualizar instructor ID: ${id}`)
      const instructorActualizado = await instructoresApi.actualizarInstructor(id, instructor)
      console.log(`[InstructoresStore] Instructor actualizado exitosamente:`, instructorActualizado)

      set((state) => ({
        instructores: state.instructores.map((i) => (i.id === id ? instructorActualizado : i)),
        instructorSeleccionado:
          state.instructorSeleccionado?.id === id ? instructorActualizado : state.instructorSeleccionado,
        isLoading: false,
      }))

      return instructorActualizado
    } catch (error) {
      console.error(`[InstructoresStore] Error al actualizar instructor:`, error)
      set({
        error: error instanceof Error ? error.message : "Error desconocido al actualizar el instructor",
        isLoading: false,
      })
      throw error
    }
  },

  eliminarInstructor: async (id) => {
    console.log(`[InstructoresStore] Iniciando eliminarInstructor con ID: ${id}`)
    set({ isLoading: true, error: null })
    try {
      console.log(`[InstructoresStore] Realizando petición a la API para eliminar instructor ID: ${id}`)
      await instructoresApi.eliminarInstructor(id)
      console.log(`[InstructoresStore] Instructor eliminado exitosamente`)

      set((state) => ({
        instructores: state.instructores.filter((i) => i.id !== id),
        instructorSeleccionado: state.instructorSeleccionado?.id === id ? null : state.instructorSeleccionado,
        isLoading: false,
      }))
    } catch (error) {
      console.error(`[InstructoresStore] Error al eliminar instructor:`, error)
      set({
        error: error instanceof Error ? error.message : "Error desconocido al eliminar el instructor",
        isLoading: false,
      })
      throw error
    }
  },

  setInstructorSeleccionado: (instructor) => {
    set({ instructorSeleccionado: instructor })
  },

  resetInstructores: () => {
    set({ instructores: [], error: null })
  },
}))

