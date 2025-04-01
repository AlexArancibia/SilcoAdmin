import { create } from "zustand"
import { periodosApi } from "@/lib/api/periodos-api"
import type { Periodo } from "@/types/schema"

interface PeriodosState {
  periodos: Periodo[]
  periodoActual: Periodo | null
  rangoSeleccionado: [number, number] | null
  periodosSeleccionados: Periodo[]
  isLoading: boolean
  error: string | null

  // Acciones
  fetchPeriodos: () => Promise<void>
  fetchPeriodo: (id: number) => Promise<void>
  crearPeriodo: (periodo: Omit<Periodo, "id">) => Promise<void>
  actualizarPeriodo: (id: number, periodo: Partial<Periodo>) => Promise<void>
  eliminarPeriodo: (id: number) => Promise<void>
  setSeleccion: (inicio: number, fin?: number) => void // Permite selección simple o rango
  resetearSeleccion: () => void
}

export const usePeriodosStore = create<PeriodosState>((set, get) => ({
  periodos: [],
  periodoActual: null,
  rangoSeleccionado: null,
  periodosSeleccionados: [],
  isLoading: false,
  error: null,

  fetchPeriodos: async () => {
    set({ isLoading: true, error: null })
    try {
      const periodos = await periodosApi.getPeriodos()
      set({ periodos, isLoading: false })
      
      // Establecer periodo actual y selección inicial
      const hoy = new Date()
      const periodoActual = periodos.find(p => {
        const inicio = p.fechaInicio instanceof Date ? p.fechaInicio : new Date(p.fechaInicio)
        const fin = p.fechaFin instanceof Date ? p.fechaFin : new Date(p.fechaFin)
        return hoy >= inicio && hoy <= fin
      }) || periodos.sort((a, b) => {
        // Ordenar por proximidad a la fecha actual si no hay periodo actual
        const fechaA = a.fechaInicio instanceof Date ? a.fechaInicio : new Date(a.fechaInicio)
        const fechaB = b.fechaInicio instanceof Date ? b.fechaInicio : new Date(b.fechaInicio)
        return Math.abs(fechaA.getTime() - hoy.getTime()) - Math.abs(fechaB.getTime() - hoy.getTime())
      })[0]

      if (periodoActual) {
        set({ 
          periodoActual,
          rangoSeleccionado: [periodoActual.id, periodoActual.id],
          periodosSeleccionados: [periodoActual]
        })
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
      set({ 
        rangoSeleccionado: [id, id],
        periodosSeleccionados: [periodo],
        isLoading: false 
      })
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
      // Verificar si el nuevo periodo debería ser el actual
      const hoy = new Date()
      const inicio = nuevoPeriodo.fechaInicio instanceof Date ? nuevoPeriodo.fechaInicio : new Date(nuevoPeriodo.fechaInicio)
      const fin = nuevoPeriodo.fechaFin instanceof Date ? nuevoPeriodo.fechaFin : new Date(nuevoPeriodo.fechaFin)
      
      if (hoy >= inicio && hoy <= fin) {
        set({
          periodoActual: nuevoPeriodo,
          rangoSeleccionado: [nuevoPeriodo.id, nuevoPeriodo.id],
          periodosSeleccionados: [nuevoPeriodo]
        })
      }
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
      set((state) => {
        const nuevosPeriodos = state.periodos.map(p => p.id === id ? periodoActualizado : p)
        const periodoActual = state.periodoActual?.id === id ? periodoActualizado : state.periodoActual
        
        // Actualizar la selección si está afectada
        let nuevosSeleccionados = state.periodosSeleccionados
        if (state.periodosSeleccionados.some(p => p.id === id)) {
          nuevosSeleccionados = state.periodosSeleccionados.map(p => 
            p.id === id ? periodoActualizado : p
          )
        }
        
        return {
          periodos: nuevosPeriodos,
          periodoActual,
          periodosSeleccionados: nuevosSeleccionados,
          isLoading: false,
        }
        
      })
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
      set((state) => {
        const nuevosPeriodos = state.periodos.filter(p => p.id !== id)
        const periodoActual = state.periodoActual?.id === id ? null : state.periodoActual
        
        // Resetear selección si el periodo eliminado estaba seleccionado
        let rangoSeleccionado = state.rangoSeleccionado
        let periodosSeleccionados = state.periodosSeleccionados.filter(p => p.id !== id)
        
        if (state.rangoSeleccionado && 
            (id >= state.rangoSeleccionado[0] && id <= state.rangoSeleccionado[1])) {
          // Si el periodo eliminado estaba dentro del rango, actualizar la selección
          if (nuevosPeriodos.length > 0) {
            // Seleccionar automáticamente el primer periodo disponible
            rangoSeleccionado = [nuevosPeriodos[0].id, nuevosPeriodos[0].id]
            periodosSeleccionados = [nuevosPeriodos[0]]
          } else {
            rangoSeleccionado = null
            periodosSeleccionados = []
          }
        }
        
        return {
          periodos: nuevosPeriodos,
          periodoActual,
          rangoSeleccionado,
          periodosSeleccionados,
          isLoading: false,
        }
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al eliminar el periodo",
        isLoading: false,
      })
    }
  },

  // Unifica la selección individual y por rango
  setSeleccion: (inicio: number, fin?: number) => {
    const { periodos } = get()
    const end = fin !== undefined ? fin : inicio
    
    // Ordenar el rango
    const idInicio = Math.min(inicio, end)
    const idFin = Math.max(inicio, end)
    
    const periodosEnRango = periodos
      .filter(p => p.id >= idInicio && p.id <= idFin)
      .sort((a, b) => a.id - b.id)
    
    set({
      rangoSeleccionado: [idInicio, idFin],
      periodosSeleccionados: periodosEnRango
    })
    console.log(get().periodosSeleccionados)

  },

  resetearSeleccion: () => {
    const { periodoActual, periodos } = get()
    if (periodoActual) {
      set({
        rangoSeleccionado: [periodoActual.id, periodoActual.id],
        periodosSeleccionados: [periodoActual]
      })
    } else if (periodos.length > 0) {
      // Si no hay periodo actual, seleccionar el primero
      set({
        rangoSeleccionado: [periodos[0].id, periodos[0].id],
        periodosSeleccionados: [periodos[0]]
      })
    }
  },
}))