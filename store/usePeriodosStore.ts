import { create } from "zustand"
import { periodosApi } from "@/lib/api/periodos-api"
import type { Periodo } from "@/types/schema"

interface PeriodosState {
  periodos: Periodo[]
  periodoSeleccionado: Periodo | null
  periodoSeleccionadoId: number | null
  isLoading: boolean
  error: string | null

  // Acciones
  fetchPeriodos: () => Promise<void>
  fetchPeriodo: (id: number) => Promise<void>
  crearPeriodo: (periodo: Omit<Periodo, "id">) => Promise<void>
  actualizarPeriodo: (id: number, periodo: Partial<Periodo>) => Promise<void>
  eliminarPeriodo: (id: number) => Promise<void>
  setPeriodoSeleccionado: (id: number | null) => void
  seleccionarPeriodoActual: () => void
}

export const usePeriodosStore = create<PeriodosState>((set, get) => ({
  periodos: [],
  periodoSeleccionado: null,
  periodoSeleccionadoId: null,
  isLoading: false,
  error: null,

  fetchPeriodos: async () => {
    set({ isLoading: true, error: null })
    try {
      const periodos = await periodosApi.getPeriodos()
      set({ periodos, isLoading: false })

      // Si hay un periodoSeleccionadoId pero no hay periodoSeleccionado, intentar establecerlo
      const { periodoSeleccionadoId } = get()
      if (periodoSeleccionadoId !== null && !get().periodoSeleccionado) {
        const periodoSeleccionado = periodos.find((p) => p.id === periodoSeleccionadoId) || null
        set({ periodoSeleccionado })
      } else if (periodoSeleccionadoId === null) {
        // Si no hay periodo seleccionado, seleccionar automáticamente el periodo actual
        get().seleccionarPeriodoActual()
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener periodos",
        isLoading: false,
      })
    }
  },

  fetchPeriodo: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const periodo = await periodosApi.getPeriodo(id)
      set({ periodoSeleccionado: periodo, periodoSeleccionadoId: id, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener el periodo",
        isLoading: false,
      })
    }
  },

  crearPeriodo: async (periodo: Omit<Periodo, "id">) => {
    set({ isLoading: true, error: null })
    try {
      const nuevoPeriodo = await periodosApi.crearPeriodo(periodo)
      set((state) => ({
        periodos: [...state.periodos, nuevoPeriodo],
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al crear el periodo",
        isLoading: false,
      })
    }
  },

  actualizarPeriodo: async (id: number, periodo: Partial<Periodo>) => {
    set({ isLoading: true, error: null })
    try {
      const periodoActualizado = await periodosApi.actualizarPeriodo(id, periodo)
      set((state) => ({
        periodos: state.periodos.map((p) => (p.id === id ? periodoActualizado : p)),
        periodoSeleccionado: state.periodoSeleccionado?.id === id ? periodoActualizado : state.periodoSeleccionado,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al actualizar el periodo",
        isLoading: false,
      })
    }
  },

  eliminarPeriodo: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      await periodosApi.eliminarPeriodo(id)
      set((state) => ({
        periodos: state.periodos.filter((p) => p.id !== id),
        periodoSeleccionado: state.periodoSeleccionado?.id === id ? null : state.periodoSeleccionado,
        periodoSeleccionadoId: state.periodoSeleccionadoId === id ? null : state.periodoSeleccionadoId,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al eliminar el periodo",
        isLoading: false,
      })
    }
  },

  setPeriodoSeleccionado: (id: number | null) => {
    const periodoSeleccionado = id !== null ? get().periodos.find((p) => p.id === id) || null : null
    set({ periodoSeleccionadoId: id, periodoSeleccionado })
  },

  seleccionarPeriodoActual: () => {
    const { periodos, setPeriodoSeleccionado } = get()

    if (periodos.length === 0) return

    const hoy = new Date()

    // Buscar el periodo que contiene la fecha actual
    const periodoActual = periodos.find((periodo) => {
      const fechaInicio = periodo.fechaInicio instanceof Date ? periodo.fechaInicio : new Date(periodo.fechaInicio)
      const fechaFin = periodo.fechaFin instanceof Date ? periodo.fechaFin : new Date(periodo.fechaFin)

      return hoy >= fechaInicio && hoy <= fechaFin
    })

    if (periodoActual) {
      setPeriodoSeleccionado(periodoActual.id)
    } else {
      // Si no hay un periodo actual, seleccionar el más cercano a la fecha actual
      const periodosOrdenados = [...periodos].sort((a, b) => {
        const fechaInicioA = a.fechaInicio instanceof Date ? a.fechaInicio : new Date(a.fechaInicio)
        const fechaInicioB = b.fechaInicio instanceof Date ? b.fechaInicio : new Date(b.fechaInicio)

        return Math.abs(fechaInicioA.getTime() - hoy.getTime()) - Math.abs(fechaInicioB.getTime() - hoy.getTime())
      })

      if (periodosOrdenados.length > 0) {
        setPeriodoSeleccionado(periodosOrdenados[0].id)
      }
    }
  },
}))

