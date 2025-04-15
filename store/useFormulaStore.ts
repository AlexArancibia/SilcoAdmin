import { create } from "zustand"
import { FormulasApi } from "@/lib/api/formulas-api"
 
import type { FormulaDB, RequisitosCategoria, ParametrosPago } from "@/types/schema"

// Actualizar la interfaz FormulasState para usar el tipo CategoriaInstructor en lugar de string
interface FormulasState {
  formulas: FormulaDB[]
  formulaSeleccionada: FormulaDB | null
  isLoading: boolean
  error: string | null
  fetchFormulas: () => Promise<void>
  fetchFormulasPorDisciplina: (disciplinaId: number) => Promise<void>
  fetchFormulasPorPeriodo: (periodoId: number) => Promise<void>
  fetchFormulaPorDisciplinaYPeriodo: (disciplinaId: number, periodoId: number) => Promise<FormulaDB | null>
  seleccionarFormula: (formula: FormulaDB | null) => void
  crearFormula: (formula: Omit<FormulaDB, "id">) => Promise<FormulaDB>
  actualizarFormula: (id: number,formula: Partial<FormulaDB>  ) => Promise<FormulaDB>
  eliminarFormula: (id: number) => Promise<void>
}

const formulasApi = new FormulasApi()

export const useFormulasStore = create<FormulasState>((set, get) => ({
  formulas: [],
  formulaSeleccionada: null,
  isLoading: false,
  error: null,

  fetchFormulas: async () => {
    set({ isLoading: true, error: null })
    try {
      const formulas = await formulasApi.obtenerFormulas()
      set({ formulas, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cargar fórmulas",
        isLoading: false,
      })
    }
  },

  fetchFormulasPorDisciplina: async (disciplinaId) => {
    set({ isLoading: true, error: null })
    try {
      const formulas = await formulasApi.obtenerFormulasPorDisciplina(disciplinaId)
      set({ formulas, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cargar fórmulas por disciplina",
        isLoading: false,
      })
    }
  },

  fetchFormulasPorPeriodo: async (periodoId) => {
    set({ isLoading: true, error: null })
    try {
      const formulas = await formulasApi.obtenerFormulasPorPeriodo(periodoId)
      set({ formulas, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cargar fórmulas por periodo",
        isLoading: false,
      })
    }
  },

  fetchFormulaPorDisciplinaYPeriodo: async (disciplinaId, periodoId) => {
    set({ isLoading: true, error: null })
    try {
      const formula = await formulasApi.obtenerFormulaPorDisciplinaYPeriodo(disciplinaId, periodoId)
      if (formula) {
        set({ formulaSeleccionada: formula })
      }
      set({ isLoading: false })
      return formula
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cargar fórmula",
        isLoading: false,
      })
      return null
    }
  },

  seleccionarFormula: (formula) => {
    set({ formulaSeleccionada: formula })
  },

  crearFormula: async (formula) => {
    set({ isLoading: true, error: null })
    try {
      const nuevaFormula = await formulasApi.crearFormula(formula)
      set((state) => ({
        formulas: [...state.formulas, nuevaFormula],
        isLoading: false,
      }))
      return nuevaFormula
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al crear fórmula",
        isLoading: false,
      })
      throw error
    }
  },

  actualizarFormula: async (id, datos) => {
    set({ isLoading: true, error: null })
    try {
      // Usamos el endpoint general con el ID en el cuerpo
      const formulaActualizada = await formulasApi.actualizarFormula(id, datos)
      set((state) => ({
        formulas: state.formulas.map((f) => (f.id === id ? formulaActualizada : f)),
        formulaSeleccionada: state.formulaSeleccionada?.id === id ? formulaActualizada : state.formulaSeleccionada,
        isLoading: false,
      }))
      return formulaActualizada
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al actualizar fórmula",
        isLoading: false,
      })
      throw error
    }
  },

  eliminarFormula: async (id) => {
    set({ isLoading: true, error: null })
    try {
      // Usamos el endpoint general con el ID en el cuerpo
      await formulasApi.eliminarFormula(id)
      set((state) => ({
        formulas: state.formulas.filter((f) => f.id !== id),
        formulaSeleccionada: state.formulaSeleccionada?.id === id ? null : state.formulaSeleccionada,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al eliminar fórmula",
        isLoading: false,
      })
      throw error
    }
  },
}))
