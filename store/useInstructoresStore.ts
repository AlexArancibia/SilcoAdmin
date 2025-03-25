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
    console.log(`[InstructoresStore] Iniciando fetchInstructores`)
    set({ isLoading: true, error: null })
    try {
      console.log(`[InstructoresStore] Realizando petición a la API para obtener todos los instructores`)
      const instructores = await instructoresApi.getInstructores()
      console.log(`[InstructoresStore] Respuesta exitosa, obtenidos ${instructores.length} instructores`)
      set({ instructores, isLoading: false })
    } catch (error) {
      console.error(`[InstructoresStore] Error al obtener instructores:`, error)
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

