import { create } from "zustand"
import { disciplinasApi } from "@/lib/api/disciplinas-api"
import type { Disciplina } from "@/types/schema"

interface DisciplinasState {
  disciplinas: Disciplina[]
  disciplinaSeleccionada: Disciplina | null
  isLoading: boolean
  error: string | null

  // Acciones
  fetchDisciplinas: () => Promise<void>
  fetchDisciplina: (id: number) => Promise<void>
  crearDisciplina: (disciplina: Omit<Disciplina, "id">) => Promise<void>
  actualizarDisciplina: (id: number, disciplina: Partial<Disciplina>) => Promise<void>
  eliminarDisciplina: (id: number) => Promise<void>
  setDisciplinaSeleccionada: (disciplina: Disciplina | null) => void
}

export const useDisciplinasStore = create<DisciplinasState>((set, get) => ({
  disciplinas: [],
  disciplinaSeleccionada: null,
  isLoading: false,
  error: null,

  fetchDisciplinas: async () => {
    const startTime = performance.now()
    console.log(`[DisciplinasStore] ⏱️ fetchDisciplinas called`)
    
    const { disciplinas, isLoading } = get()
    
    // Check if we already have disciplinas and we're not currently loading
    if (disciplinas.length > 0 && !isLoading) {
      console.log(`[DisciplinasStore] ⏭️ fetchDisciplinas skipped - disciplinas already loaded (${disciplinas.length} items) - ${(performance.now() - startTime).toFixed(2)}ms`)
      return
    }
    
    console.log(`[DisciplinasStore] 📡 fetchDisciplinas proceeding with fetch at ${new Date().toISOString()}`)
    set({ isLoading: true, error: null })
    try {
      console.log(`[DisciplinasStore] 🌐 Making API request to get all disciplinas`)
      const apiStartTime = performance.now()
      const disciplinas = await disciplinasApi.getDisciplinas()
      const apiEndTime = performance.now()
      const totalTime = performance.now() - startTime
      console.log(`[DisciplinasStore] ✅ Successfully obtained ${disciplinas.length} disciplinas - API: ${(apiEndTime - apiStartTime).toFixed(2)}ms, Total: ${totalTime.toFixed(2)}ms`)
      set({ disciplinas, isLoading: false })
    } catch (error) {
      const totalTime = performance.now() - startTime
      console.error(`[DisciplinasStore] ❌ Error fetching disciplinas after ${totalTime.toFixed(2)}ms:`, error)
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener disciplinas",
        isLoading: false,
      })
    }
  },

  fetchDisciplina: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const disciplina = await disciplinasApi.getDisciplina(id)
      set({ disciplinaSeleccionada: disciplina, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener la disciplina",
        isLoading: false,
      })
    }
  },

  crearDisciplina: async (disciplina: Omit<Disciplina, "id">) => {
    set({ isLoading: true, error: null })
    try {
      const nuevaDisciplina = await disciplinasApi.crearDisciplina(disciplina)
      set((state) => ({
        disciplinas: [...state.disciplinas, nuevaDisciplina],
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al crear la disciplina",
        isLoading: false,
      })
    }
  },

  actualizarDisciplina: async (id: number, disciplina: Partial<Disciplina>) => {
    set({ isLoading: true, error: null })
    try {
      const disciplinaActualizada = await disciplinasApi.actualizarDisciplina(id, disciplina)
      set((state) => ({
        disciplinas: state.disciplinas.map((d) => (d.id === id ? disciplinaActualizada : d)),
        disciplinaSeleccionada:
          state.disciplinaSeleccionada?.id === id ? disciplinaActualizada : state.disciplinaSeleccionada,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al actualizar la disciplina",
        isLoading: false,
      })
    }
  },

  eliminarDisciplina: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      await disciplinasApi.eliminarDisciplina(id)
      set((state) => ({
        disciplinas: state.disciplinas.filter((d) => d.id !== id),
        disciplinaSeleccionada: state.disciplinaSeleccionada?.id === id ? null : state.disciplinaSeleccionada,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al eliminar la disciplina",
        isLoading: false,
      })
    }
  },

  setDisciplinaSeleccionada: (disciplina: Disciplina | null) => {
    set({ disciplinaSeleccionada: disciplina })
  },
}))

