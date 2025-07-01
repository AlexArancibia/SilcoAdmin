import { ApiClient } from "./api-client"
import type { Penalizacion } from "@/types/schema"

// Tipos para los parámetros de filtrado
export type TipoPenalizacion = 
  | "CANCELACION_FIJA"
  | "CANCELACION_FUERA_TIEMPO" 
  | "CANCELAR_MENOS_24HRS"
  | "COVER_DEL_COVER"
  | "SALIR_TARDE"
  | "PERSONALIZADA"

export class PenalizacionesApi extends ApiClient {
  constructor() {
    super("/api")
  }

  async getPenalizaciones(params?: {
    periodoId?: number
    instructorId?: number
    disciplinaId?: number
    tipo?: TipoPenalizacion
    activa?: boolean
  }): Promise<Penalizacion[]> {
    return this.get("/penalizaciones", params)
  }

  async getPenalizacionById(id: number): Promise<Penalizacion> {
    return this.get(`/penalizaciones/${id}`)
  }

  async createPenalizacion(penalizacion: Omit<Penalizacion, "id" | "createdAt" | "updatedAt">): Promise<Penalizacion> {
    return this.post<Omit<Penalizacion, "id" | "createdAt" | "updatedAt">, Penalizacion>("/penalizaciones", penalizacion)
  }

  async updatePenalizacion(id: number, penalizacion: Partial<Penalizacion>): Promise<Penalizacion> {
    return this.put<Partial<Penalizacion>, Penalizacion>(`/penalizaciones/${id}`, penalizacion)
  }

  async deletePenalizacion(id: number): Promise<{ success: boolean }> {
    return this.delete(`/penalizaciones/${id}`)
  }

  // Métodos específicos para penalizaciones
  async getPenalizacionesByInstructor(instructorId: number, periodoId?: number): Promise<Penalizacion[]> {
    return this.getPenalizaciones({ instructorId, periodoId })
  }

  async getPenalizacionesByPeriodo(periodoId: number): Promise<Penalizacion[]> {
    return this.getPenalizaciones({ periodoId })
  }

  async getPenalizacionesByDisciplina(disciplinaId: number, periodoId?: number): Promise<Penalizacion[]> {
    return this.getPenalizaciones({ disciplinaId, periodoId })
  }

  async getPenalizacionesByTipo(tipo: TipoPenalizacion, periodoId?: number): Promise<Penalizacion[]> {
    return this.getPenalizaciones({ tipo, periodoId })
  }

  async getPenalizacionesActivas(periodoId?: number): Promise<Penalizacion[]> {
    return this.getPenalizaciones({ activa: true, periodoId })
  }

  async getPuntosTotalesByInstructor(instructorId: number, periodoId: number): Promise<{ totalPuntos: number, penalizaciones: Penalizacion[] }> {
    const penalizaciones = await this.getPenalizacionesByInstructor(instructorId, periodoId)
    const penalizacionesActivas = penalizaciones.filter(p => p.activa)
    const totalPuntos = penalizacionesActivas.reduce((sum, p) => sum + p.puntos, 0)
    
    return {
      totalPuntos,
      penalizaciones: penalizacionesActivas
    }
  }

  // Método para desactivar penalización (soft delete)
  async desactivarPenalizacion(id: number): Promise<Penalizacion> {
    return this.updatePenalizacion(id, { activa: false })
  }

  // Método para reactivar penalización
  async reactivarPenalizacion(id: number): Promise<Penalizacion> {
    return this.updatePenalizacion(id, { activa: true })
  }
}

// Instancia singleton para usar en toda la aplicación
export const penalizacionesApi = new PenalizacionesApi()