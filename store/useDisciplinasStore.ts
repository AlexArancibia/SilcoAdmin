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
    set({ isLoading: true, error: null })
    try {
      const disciplinas = await disciplinasApi.getDisciplinas()
      set({ disciplinas, isLoading: false })
    } catch (error) {
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

