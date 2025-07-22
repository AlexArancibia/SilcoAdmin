import { ApiClient } from "./api-client"
import type { Clase, PaginatedResponse, ClasesQueryParams } from "@/types/schema"

export class ClasesApi extends ApiClient {
  constructor() {
    super("/api")
  }

  async getClases(
    params?: ClasesQueryParams
  ): Promise<PaginatedResponse<Clase>> {
    return this.get<PaginatedResponse<Clase>>("/clases", params as Record<string, any>)
  }

  async getClaseById(id: string): Promise<Clase> {
    return this.get<Clase>(`/clases/${id}`)
  }

  async createClase(clase: Omit<Clase,   "createdAt" | "updatedAt">): Promise<Clase> {
    return this.post<Omit<Clase, "id" | "createdAt" | "updatedAt">, Clase>("/clases", clase)
  }

  async updateClase(id: string, clase: Partial<Clase>): Promise<Clase> {
    return this.put<Partial<Clase>, Clase>(`/clases/${id}`, clase)
  }

  async deleteClase(id: string): Promise<{ success: boolean }> {
    return this.delete(`/clases/${id}`)
  }

  async deleteClasesByPeriodoAndSemana(periodoId: number, semana: number): Promise<{ count: number }> {
    // First get all classes for this period and week
    const response = await this.getClases({ periodoId, semana });
    const clases = response.data;

    // Then delete each class
    const deletePromises = clases.map((clase: Clase) => this.deleteClase(clase.id));
    await Promise.all(deletePromises);

    return { count: clases.length };
  }
}

// Instancia singleton para usar en toda la aplicación
export const clasesApi = new ClasesApi()

