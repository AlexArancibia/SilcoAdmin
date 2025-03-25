import { ApiClient } from "./api-client"
import type { Clase } from "@/types/schema"

export class ClasesApi extends ApiClient {
  constructor() {
    super("/api")
  }

  async getClases(params?: {
    periodoId?: number
    instructorId?: number
    disciplinaId?: number
    semana?: number
    fecha?: string
  }): Promise<Clase[]> {
    return this.get<Clase[]>("/clases", params)
  }

  async getClaseById(id: number): Promise<Clase> {
    return this.get<Clase>(`/clases/${id}`)
  }

  async createClase(clase: Omit<Clase, "id" | "createdAt" | "updatedAt">): Promise<Clase> {
    return this.post<Omit<Clase, "id" | "createdAt" | "updatedAt">, Clase>("/clases", clase)
  }

  async updateClase(id: number, clase: Partial<Clase>): Promise<Clase> {
    return this.put<Partial<Clase>, Clase>(`/clases/${id}`, clase)
  }

  async deleteClase(id: number): Promise<{ success: boolean }> {
    return this.delete(`/clases/${id}`)
  }

  async deleteClasesByPeriodoAndSemana(periodoId: number, semana: number): Promise<{ count: number }> {
    // First get all classes for this period and week
    const clases = await this.getClases({ periodoId, semana })

    // Then delete each class
    const deletePromises = clases.map((clase) => this.deleteClase(clase.id))
    await Promise.all(deletePromises)

    return { count: clases.length }
  }
}

// Instancia singleton para usar en toda la aplicación
export const clasesApi = new ClasesApi()

