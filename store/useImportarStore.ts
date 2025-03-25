import { create } from "zustand"
import { importarApi } from "@/lib/api/importar-api"
import type { DatosExcelClase, ResultadoImportacion } from "@/types/importacion"

interface ImportarState {
  isImporting: boolean
  progress: number
  resultado: ResultadoImportacion | null
  error: string | null
  importarDatos: (datos: DatosExcelClase[], periodoId: number, semana: number) => Promise<ResultadoImportacion>
  resetState: () => void
}

export const useImportarStore = create<ImportarState>((set, get) => ({
  isImporting: false,
  progress: 0,
  resultado: null,
  error: null,

  importarDatos: async (datos, periodoId, semana) => {
    try {
      // Resetear el estado antes de comenzar
      set({
        isImporting: true,
        progress: 0,
        resultado: null,
        error: null,
      })

      // Simular progreso incremental
      const progressInterval = setInterval(() => {
        const currentProgress = get().progress
        if (currentProgress < 90) {
          set({ progress: currentProgress + 5 })
        }
      }, 300)

      // Llamar a la API para importar los datos
      const resultado = await importarApi.importarDatos(datos, periodoId, semana)

      // Limpiar el intervalo y establecer el progreso al 100%
      clearInterval(progressInterval)
      set({
        isImporting: false,
        progress: 100,
        resultado,
      })

      return resultado
    } catch (error) {
      // Manejar errores
      set({
        isImporting: false,
        progress: 0,
        error: error instanceof Error ? error.message : "Error desconocido durante la importación",
      })
      throw error
    }
  },

  resetState: () => {
    set({
      isImporting: false,
      progress: 0,
      resultado: null,
      error: null,
    })
  },
}))

