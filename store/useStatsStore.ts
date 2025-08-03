import { create } from "zustand"

export interface GeneralStats {
  instructores: {
    total: number
    activos: number
    inactivos: number
    conDisciplinas: number
    sinDisciplinas: number
    nuevos: number
  }
  disciplinas: {
    total: number
    activas: number
    inactivas: number
  }
  clases: {
    total: number
    ocupacionPromedio: number
    clasesLlenas: number
    porcentajeClasesLlenas: number
    reservasTotales: number
  }
  pagos: {
    total: number
    pendientes: number
    pagados: number
    montoTotal: number
    montoPagado: number
    montoPendiente: number
    montoPromedio: number
    porcentajePagado: number
    porcentajePendiente: number
  }
}

export interface InstructorStats {
  topPorIngresos: Array<{
    id: number
    nombre: string
    ingresos: number
    ocupacion: number
    clases: number
  }>
  topPorClases: Array<{
    id: number
    nombre: string
    clases: number
    reservas: number
    ocupacion: number
  }>
  distribucionOcupacion: Array<{
    rango: string
    count: number
  }>
}

export interface ClassStats {
  porDisciplina: Array<{
    disciplinaId: number
    nombre: string
    color: string
    count: number
    ocupacionPromedio: number
  }>
  porDia: Array<{
    dia: number
    nombre: string
    count: number
    reservas: number
  }>
  porHorario: Array<{
    hora: string
    count: number
    reservas: number
  }>
  reservasPorHorario: Array<{
    hora: string
    reservas: number
    ocupacionPromedio: number
  }>
}

export interface VenueStats {
  totalLocales: number
  masUsados: Array<{
    nombre: string
    count: number
    ocupacionPromedio: number
    reservasTotales: number
    instructores: number
  }>
  ocupacionPorSalon: Array<{
    nombre: string
    ocupacion: number
    clases: number
  }>
  ingresosPorSalon: Array<{
    nombre: string
    ingresos: number
    clases: number
    reservas: number
    instructores: number
  }>
  disciplinasPorSalon: Array<{
    nombre: string
    disciplinas: Array<{
      disciplinaId: number
      nombre: string
      count: number
      color: string
    }>
  }>
}

export interface StatsQueryParams {
  periodoId?: number
  periodoInicio?: number
  periodoFin?: number
}

interface StatsStore {
  // Data
  generalStats: GeneralStats | null
  instructorStats: InstructorStats | null
  classStats: ClassStats | null
  venueStats: VenueStats | null
  
  // UI State
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  
  // Actions
  fetchGeneralStats: (params?: StatsQueryParams) => Promise<void>
  fetchInstructorStats: (params?: StatsQueryParams) => Promise<void>
  fetchClassStats: (params?: StatsQueryParams) => Promise<void>
  fetchVenueStats: (params?: StatsQueryParams) => Promise<void>
  fetchAllStats: (params?: StatsQueryParams) => Promise<void>
  
  // Reset
  resetStats: () => void
  
  // Utilities
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
}

export const useStatsStore = create<StatsStore>((set, get) => ({
  // Initial state
  generalStats: null,
  instructorStats: null,
  classStats: null,
  venueStats: null,
  isLoading: false,
  error: null,
  lastUpdated: null,

  // Actions
  fetchGeneralStats: async (params) => {
    set({ isLoading: true, error: null })
    
    try {
      const queryParams = new URLSearchParams()
      if (params?.periodoId) queryParams.set('periodoId', params.periodoId.toString())
      if (params?.periodoInicio) queryParams.set('periodoInicio', params.periodoInicio.toString())
      if (params?.periodoFin) queryParams.set('periodoFin', params.periodoFin.toString())
      
      const response = await fetch(`/api/statistics/general?${queryParams}`)
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const generalStats = await response.json()
      set({ generalStats, lastUpdated: new Date() })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
      console.error('Error fetching general stats:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchInstructorStats: async (params) => {
    try {
      const queryParams = new URLSearchParams()
      if (params?.periodoId) queryParams.set('periodoId', params.periodoId.toString())
      if (params?.periodoInicio) queryParams.set('periodoInicio', params.periodoInicio.toString())
      if (params?.periodoFin) queryParams.set('periodoFin', params.periodoFin.toString())
      
      const response = await fetch(`/api/statistics/instructors?${queryParams}`)
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const instructorStats = await response.json()
      set({ instructorStats, lastUpdated: new Date() })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
      console.error('Error fetching instructor stats:', error)
    }
  },

  fetchClassStats: async (params) => {
    try {
      const queryParams = new URLSearchParams()
      if (params?.periodoId) queryParams.set('periodoId', params.periodoId.toString())
      if (params?.periodoInicio) queryParams.set('periodoInicio', params.periodoInicio.toString())
      if (params?.periodoFin) queryParams.set('periodoFin', params.periodoFin.toString())
      
      const response = await fetch(`/api/statistics/classes?${queryParams}`)
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const classStats = await response.json()
      set({ classStats, lastUpdated: new Date() })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
      console.error('Error fetching class stats:', error)
    }
  },

  fetchVenueStats: async (params) => {
    try {
      const queryParams = new URLSearchParams()
      if (params?.periodoId) queryParams.set('periodoId', params.periodoId.toString())
      if (params?.periodoInicio) queryParams.set('periodoInicio', params.periodoInicio.toString())
      if (params?.periodoFin) queryParams.set('periodoFin', params.periodoFin.toString())
      
      const response = await fetch(`/api/statistics/venues?${queryParams}`)
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const venueStats = await response.json()
      set({ venueStats, lastUpdated: new Date() })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
      console.error('Error fetching venue stats:', error)
    }
  },

  fetchAllStats: async (params) => {
    set({ isLoading: true, error: null })
    
    try {
      await Promise.all([
        get().fetchGeneralStats(params),
        get().fetchInstructorStats(params),
        get().fetchClassStats(params),
        get().fetchVenueStats(params),
      ])
    } catch (error) {
      // Individual errors are handled in each fetch function
      console.error('Error fetching all stats:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  // Reset
  resetStats: () => {
    set({
      generalStats: null,
      instructorStats: null,
      classStats: null,
      venueStats: null,
      error: null,
      lastUpdated: null,
    })
  },

  // Utilities
  setError: (error) => {
    set({ error })
  },

  setLoading: (loading) => {
    set({ isLoading: loading })
  },
})) 