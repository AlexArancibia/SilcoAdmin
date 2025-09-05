import { create } from "zustand"
import { periodosApi } from "@/lib/api/periodos-api"
import type { Periodo } from "@/types/schema"

// Constante para la clave de localStorage
const PERIODO_SELECCIONADO_KEY = 'periodo-seleccionado'

// Tipos para la persistencia
interface PeriodoSeleccionadoPersistente {
  rangoSeleccionado: [number, number]
  timestamp: number
}

// Funciones para manejar localStorage
const guardarSeleccionPeriodo = (rango: [number, number]) => {
  try {
    const data: PeriodoSeleccionadoPersistente = {
      rangoSeleccionado: rango,
      timestamp: Date.now()
    }
    localStorage.setItem(PERIODO_SELECCIONADO_KEY, JSON.stringify(data))
  } catch (error) {
    console.warn('No se pudo guardar la selección de período en localStorage:', error)
  }
}

const cargarSeleccionPeriodo = (): [number, number] | null => {
  try {
    const data = localStorage.getItem(PERIODO_SELECCIONADO_KEY)
    if (!data) return null
    
    const parsed: PeriodoSeleccionadoPersistente = JSON.parse(data)
    return parsed.rangoSeleccionado
  } catch (error) {
    console.warn('No se pudo cargar la selección de período desde localStorage:', error)
    return null
  }
}

const limpiarSeleccionPeriodo = () => {
  try {
    localStorage.removeItem(PERIODO_SELECCIONADO_KEY)
  } catch (error) {
    console.warn('No se pudo limpiar la selección de período de localStorage:', error)
  }
}

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
  // Nueva función de utilidad
  getPeriodoQueryParams: () => { periodoId?: number; periodoInicio?: number; periodoFin?: number }
}

export const usePeriodosStore = create<PeriodosState>((set, get) => ({
  periodos: [],
  periodoActual: null,
  rangoSeleccionado: null,
  periodosSeleccionados: [],
  isLoading: false,
  error: null,

  fetchPeriodos: async () => {
    const startTime = performance.now()
    console.log('[PeriodosStore] ⏱️ fetchPeriodos called')
    
    const { periodos, isLoading } = get()
    
    // Check if we already have periodos and we're not currently loading
    if (periodos.length > 0 && !isLoading) {
      console.log(`[PeriodosStore] ⏭️ fetchPeriodos skipped - periodos already loaded (${periodos.length} items) - ${(performance.now() - startTime).toFixed(2)}ms`)
      return
    }
    
    console.log(`[PeriodosStore] 📡 fetchPeriodos proceeding with fetch at ${new Date().toISOString()}`)
    set({ isLoading: true, error: null });
    try {
      console.log(`[PeriodosStore] 🌐 Making API request to get all periodos`)
      const apiStartTime = performance.now()
      const periodos = await periodosApi.getPeriodos();
      const apiEndTime = performance.now()
      
      // Calcular periodoActual
      const hoy = new Date();
      const periodoActual = periodos.find(p => {
        const inicio = p.fechaInicio instanceof Date ? p.fechaInicio : new Date(p.fechaInicio);
        const fin = p.fechaFin instanceof Date ? p.fechaFin : new Date(p.fechaFin);
        return hoy >= inicio && hoy <= fin;
      }) || periodos.sort((a, b) => {
        const fechaA = a.fechaInicio instanceof Date ? a.fechaInicio : new Date(a.fechaInicio);
        const fechaB = b.fechaInicio instanceof Date ? b.fechaInicio : new Date(b.fechaInicio);
        return Math.abs(fechaA.getTime() - hoy.getTime()) - Math.abs(fechaB.getTime() - hoy.getTime());
      })[0];

      // Intentar cargar selección guardada
      const seleccionGuardada = cargarSeleccionPeriodo();
      let rangoSeleccionado: [number, number] | null = null;
      let periodosSeleccionados: Periodo[] = [];

      if (seleccionGuardada) {
        // Verificar si los períodos guardados aún existen
        const [inicio, fin] = seleccionGuardada;
        const inicioExiste = periodos.some(p => p.id === inicio);
        const finExiste = periodos.some(p => p.id === fin);
        
        if (inicioExiste && finExiste) {
          // La selección guardada es válida, usar esa
          rangoSeleccionado = seleccionGuardada;
          const periodosEnRango = periodos
            .filter(p => p.id >= inicio && p.id <= fin)
            .sort((a, b) => a.id - b.id);
          periodosSeleccionados = periodosEnRango;
        } else {
          // La selección guardada no es válida, limpiar localStorage
          limpiarSeleccionPeriodo();
        }
      }

      // Si no hay selección válida guardada, usar el período actual
      if (!rangoSeleccionado && periodoActual) {
        rangoSeleccionado = [periodoActual.id, periodoActual.id];
        periodosSeleccionados = [periodoActual];
        // Guardar esta selección automática
        guardarSeleccionPeriodo(rangoSeleccionado);
      }
  
      // Actualizar el estado
      const totalTime = performance.now() - startTime
      console.log(`[PeriodosStore] ✅ Successfully obtained ${periodos.length} periodos - API: ${(apiEndTime - apiStartTime).toFixed(2)}ms, Total: ${totalTime.toFixed(2)}ms`)
      set({
        periodos,
        periodoActual,
        rangoSeleccionado,
        periodosSeleccionados,
        isLoading: false,
        error: null
      });
      
    } catch (error) {
      const totalTime = performance.now() - startTime
      console.error(`[PeriodosStore] ❌ Error fetching periodos after ${totalTime.toFixed(2)}ms:`, error)
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener periodos",
        isLoading: false,
      });
    }
  },
  fetchPeriodo: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const periodo = await periodosApi.getPeriodo(id)
      const nuevoRango: [number, number] = [id, id];
      set({ 
        rangoSeleccionado: nuevoRango,
        periodosSeleccionados: [periodo],
        isLoading: false 
      })
      // Guardar la selección en localStorage
      guardarSeleccionPeriodo(nuevoRango);
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
        const nuevoRango: [number, number] = [nuevoPeriodo.id, nuevoPeriodo.id];
        set({
          periodoActual: nuevoPeriodo,
          rangoSeleccionado: nuevoRango,
          periodosSeleccionados: [nuevoPeriodo]
        })
        // Guardar la nueva selección automática en localStorage
        guardarSeleccionPeriodo(nuevoRango);
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
            // Seleccionar automáticamente el período actual o el primero disponible
            const nuevoPeriodoActual = periodoActual || nuevosPeriodos[0];
            rangoSeleccionado = [nuevoPeriodoActual.id, nuevoPeriodoActual.id]
            periodosSeleccionados = [nuevoPeriodoActual]
            // Actualizar localStorage con la nueva selección
            guardarSeleccionPeriodo(rangoSeleccionado);
          } else {
            rangoSeleccionado = null
            periodosSeleccionados = []
            // Limpiar localStorage si no hay más períodos
            limpiarSeleccionPeriodo();
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
    
    const nuevoRango: [number, number] = [idInicio, idFin];
    
    set({
      rangoSeleccionado: nuevoRango,
      periodosSeleccionados: periodosEnRango
    })

    // Guardar la selección en localStorage
    guardarSeleccionPeriodo(nuevoRango);
    
    console.log(get().periodosSeleccionados)
  },

  resetearSeleccion: () => {
    const { periodoActual, periodos } = get()
    let nuevoRango: [number, number] | null = null;
    
    if (periodoActual) {
      nuevoRango = [periodoActual.id, periodoActual.id];
      set({
        rangoSeleccionado: nuevoRango,
        periodosSeleccionados: [periodoActual]
      })
    } else if (periodos.length > 0) {
      // Si no hay periodo actual, seleccionar el primero
      nuevoRango = [periodos[0].id, periodos[0].id];
      set({
        rangoSeleccionado: nuevoRango,
        periodosSeleccionados: [periodos[0]]
      })
    }

    // Actualizar localStorage
    if (nuevoRango) {
      guardarSeleccionPeriodo(nuevoRango);
    } else {
      limpiarSeleccionPeriodo();
    }
  },

  // Nueva función de utilidad para convertir rangoSeleccionado a parámetros de query
  getPeriodoQueryParams: () => {
    const { rangoSeleccionado } = get();
    
    if (!rangoSeleccionado) {
      return {};
    }

    const [inicio, fin] = rangoSeleccionado;

    // Si es un período único, usar periodoId para compatibilidad
    if (inicio === fin) {
      return { periodoId: inicio };
    }

    // Si es un rango, usar periodoInicio y periodoFin
    return {
      periodoInicio: inicio,
      periodoFin: fin
    };
  },
}))