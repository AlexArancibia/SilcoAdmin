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
  lastParams: StatsQueryParams | null
  
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
  lastParams: null,

  // Actions
  fetchGeneralStats: async (params) => {
    const startTime = performance.now()
    console.log(`[StatsStore] ⏱️ fetchGeneralStats called with params:`, params)
    
    const { lastParams, generalStats, lastUpdated } = get()
    
    // Check if we already have data for these params and it's recent (less than 5 minutes)
    const isRecentData = lastUpdated && (Date.now() - lastUpdated.getTime()) < 5 * 60 * 1000
    const sameParams = JSON.stringify(params) === JSON.stringify(lastParams)
    
    if (generalStats && isRecentData && sameParams) {
      console.log(`[StatsStore] ⏭️ fetchGeneralStats skipped - data is recent and params match (${(performance.now() - startTime).toFixed(2)}ms)`)
      return
    }
    
    console.log(`[StatsStore] 📡 fetchGeneralStats proceeding with fetch at ${new Date().toISOString()}`)
    set({ isLoading: true, error: null })
    
    try {
      const queryParams = new URLSearchParams()
      if (params?.periodoId) queryParams.set('periodoId', params.periodoId.toString())
      if (params?.periodoInicio) queryParams.set('periodoInicio', params.periodoInicio.toString())
      if (params?.periodoFin) queryParams.set('periodoFin', params.periodoFin.toString())
      
      console.log(`[StatsStore] 🌐 Making request to /api/statistics/general with params: ${queryParams.toString()}`)
      const apiStartTime = performance.now()
      const response = await fetch(`/api/statistics/general?${queryParams}`)
      const apiEndTime = performance.now()
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const generalStats = await response.json()
      const totalTime = performance.now() - startTime
      console.log(`[StatsStore] ✅ fetchGeneralStats completed successfully - API: ${(apiEndTime - apiStartTime).toFixed(2)}ms, Total: ${totalTime.toFixed(2)}ms`)
      set({ generalStats, lastUpdated: new Date(), lastParams: params })
    } catch (error) {
      const totalTime = performance.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
      console.error(`[StatsStore] ❌ Error fetching general stats after ${totalTime.toFixed(2)}ms:`, error)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchInstructorStats: async (params) => {
    const startTime = performance.now()
    console.log(`[StatsStore] ⏱️ fetchInstructorStats called with params:`, params)
    
    const { lastParams, instructorStats, lastUpdated } = get()
    
    // Check if we already have data for these params and it's recent (less than 5 minutes)
    const isRecentData = lastUpdated && (Date.now() - lastUpdated.getTime()) < 5 * 60 * 1000
    const sameParams = JSON.stringify(params) === JSON.stringify(lastParams)
    
    if (instructorStats && isRecentData && sameParams) {
      console.log(`[StatsStore] ⏭️ fetchInstructorStats skipped - data is recent and params match (${(performance.now() - startTime).toFixed(2)}ms)`)
      return
    }
    
    console.log(`[StatsStore] 📡 fetchInstructorStats proceeding with fetch at ${new Date().toISOString()}`)
    
    try {
      const queryParams = new URLSearchParams()
      if (params?.periodoId) queryParams.set('periodoId', params.periodoId.toString())
      if (params?.periodoInicio) queryParams.set('periodoInicio', params.periodoInicio.toString())
      if (params?.periodoFin) queryParams.set('periodoFin', params.periodoFin.toString())
      
      console.log(`[StatsStore] 🌐 Making request to /api/statistics/instructors with params: ${queryParams.toString()}`)
      const apiStartTime = performance.now()
      const response = await fetch(`/api/statistics/instructors?${queryParams}`)
      const apiEndTime = performance.now()
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const instructorStats = await response.json()
      const totalTime = performance.now() - startTime
      console.log(`[StatsStore] ✅ fetchInstructorStats completed successfully - API: ${(apiEndTime - apiStartTime).toFixed(2)}ms, Total: ${totalTime.toFixed(2)}ms`)
      set({ instructorStats, lastUpdated: new Date(), lastParams: params })
    } catch (error) {
      const totalTime = performance.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
      console.error(`[StatsStore] ❌ Error fetching instructor stats after ${totalTime.toFixed(2)}ms:`, error)
    }
  },

  fetchClassStats: async (params) => {
    const startTime = performance.now()
    console.log(`[StatsStore] ⏱️ fetchClassStats called with params:`, params)
    
    const { lastParams, classStats, lastUpdated } = get()
    
    // Check if we already have data for these params and it's recent (less than 5 minutes)
    const isRecentData = lastUpdated && (Date.now() - lastUpdated.getTime()) < 5 * 60 * 1000
    const sameParams = JSON.stringify(params) === JSON.stringify(lastParams)
    
    if (classStats && isRecentData && sameParams) {
      console.log(`[StatsStore] ⏭️ fetchClassStats skipped - data is recent and params match (${(performance.now() - startTime).toFixed(2)}ms)`)
      return
    }
    
    console.log(`[StatsStore] 📡 fetchClassStats proceeding with fetch at ${new Date().toISOString()}`)
    
    try {
      const queryParams = new URLSearchParams()
      if (params?.periodoId) queryParams.set('periodoId', params.periodoId.toString())
      if (params?.periodoInicio) queryParams.set('periodoInicio', params.periodoInicio.toString())
      if (params?.periodoFin) queryParams.set('periodoFin', params.periodoFin.toString())
      
      console.log(`[StatsStore] 🌐 Making request to /api/statistics/classes with params: ${queryParams.toString()}`)
      const apiStartTime = performance.now()
      const response = await fetch(`/api/statistics/classes?${queryParams}`)
      const apiEndTime = performance.now()
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const classStats = await response.json()
      const totalTime = performance.now() - startTime
      console.log(`[StatsStore] ✅ fetchClassStats completed successfully - API: ${(apiEndTime - apiStartTime).toFixed(2)}ms, Total: ${totalTime.toFixed(2)}ms`)
      set({ classStats, lastUpdated: new Date(), lastParams: params })
    } catch (error) {
      const totalTime = performance.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
      console.error(`[StatsStore] ❌ Error fetching class stats after ${totalTime.toFixed(2)}ms:`, error)
    }
  },

  fetchVenueStats: async (params) => {
    const startTime = performance.now()
    console.log(`[StatsStore] ⏱️ fetchVenueStats called with params:`, params)
    
    const { lastParams, venueStats, lastUpdated } = get()
    
    // Check if we already have data for these params and it's recent (less than 5 minutes)
    const isRecentData = lastUpdated && (Date.now() - lastUpdated.getTime()) < 5 * 60 * 1000
    const sameParams = JSON.stringify(params) === JSON.stringify(lastParams)
    
    if (venueStats && isRecentData && sameParams) {
      console.log(`[StatsStore] ⏭️ fetchVenueStats skipped - data is recent and params match (${(performance.now() - startTime).toFixed(2)}ms)`)
      return
    }
    
    console.log(`[StatsStore] 📡 fetchVenueStats proceeding with fetch at ${new Date().toISOString()}`)
    
    try {
      const queryParams = new URLSearchParams()
      if (params?.periodoId) queryParams.set('periodoId', params.periodoId.toString())
      if (params?.periodoInicio) queryParams.set('periodoInicio', params.periodoInicio.toString())
      if (params?.periodoFin) queryParams.set('periodoFin', params.periodoFin.toString())
      
      console.log(`[StatsStore] 🌐 Making request to /api/statistics/venues with params: ${queryParams.toString()}`)
      const apiStartTime = performance.now()
      const response = await fetch(`/api/statistics/venues?${queryParams}`)
      const apiEndTime = performance.now()
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const venueStats = await response.json()
      const totalTime = performance.now() - startTime
      console.log(`[StatsStore] ✅ fetchVenueStats completed successfully - API: ${(apiEndTime - apiStartTime).toFixed(2)}ms, Total: ${totalTime.toFixed(2)}ms`)
      set({ venueStats, lastUpdated: new Date(), lastParams: params })
    } catch (error) {
      const totalTime = performance.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage })
      console.error(`[StatsStore] ❌ Error fetching venue stats after ${totalTime.toFixed(2)}ms:`, error)
    }
  },

  fetchAllStats: async (params) => {
    const startTime = performance.now()
    console.log(`[StatsStore] ⏱️ fetchAllStats called with params:`, params)
    
    const { lastParams, lastUpdated } = get()
    
    // Check if we already have recent data for these params
    const isRecentData = lastUpdated && (Date.now() - lastUpdated.getTime()) < 5 * 60 * 1000
    const sameParams = JSON.stringify(params) === JSON.stringify(lastParams)
    
    if (isRecentData && sameParams) {
      console.log(`[StatsStore] ⏭️ fetchAllStats skipped - data is recent and params match (${(performance.now() - startTime).toFixed(2)}ms)`)
      return
    }
    
    console.log(`[StatsStore] 📡 fetchAllStats proceeding with fetch at ${new Date().toISOString()}`)
    set({ isLoading: true, error: null })
    
    try {
      console.log(`[StatsStore] 🚀 Starting parallel fetch of all stats`)
      const parallelStartTime = performance.now()
      await Promise.all([
        get().fetchGeneralStats(params),
        get().fetchInstructorStats(params),
        get().fetchClassStats(params),
        get().fetchVenueStats(params),
      ])
      const parallelEndTime = performance.now()
      const totalTime = performance.now() - startTime
      console.log(`[StatsStore] ✅ fetchAllStats completed successfully - Parallel: ${(parallelEndTime - parallelStartTime).toFixed(2)}ms, Total: ${totalTime.toFixed(2)}ms`)
    } catch (error) {
      const totalTime = performance.now() - startTime
      // Individual errors are handled in each fetch function
      console.error(`[StatsStore] ❌ Error fetching all stats after ${totalTime.toFixed(2)}ms:`, error)
    } finally {
      set({ isLoading: false })
    }
  },

  // Reset
  resetStats: () => {
    console.log('[StatsStore] resetStats called - clearing all stats data')
    set({
      generalStats: null,
      instructorStats: null,
      classStats: null,
      venueStats: null,
      error: null,
      lastUpdated: null,
      lastParams: null,
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