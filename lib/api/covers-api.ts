import { ApiClient } from "./api-client"
import type { Cover } from "@/types/schema"

export class CoversApi extends ApiClient {
  constructor() {
    super("/api")
  }

  async getCovers(params?: {
    periodoId?: number
    instructorReemplazoId?: number
    claseId?: string
    disciplinaId?: number
  }): Promise<Cover[]> {
    return this.get("/covers", params)
  }

  async getCoverById(id: number): Promise<Cover> {
    return this.get(`/covers/${id}`)
  }

  async createCover(cover: Omit<Cover, "id" | "createdAt" | "updatedAt">): Promise<Cover> {
    return this.post<Omit<Cover, "id" | "createdAt" | "updatedAt">, Cover>("/covers", cover)
  }

  async updateCover(id: number, cover: Partial<Cover>): Promise<Cover> {
    return this.put<Partial<Cover>, Cover>(`/covers/${id}`, cover)
  }

  async deleteCover(id: number): Promise<{ success: boolean }> {
    return this.delete(`/covers/${id}`)
  }

  // Métodos específicos para covers
  async getCoversByClase(claseId: string): Promise<Cover[]> {
    return this.getCovers({ claseId })
  }

  async getCoversByInstructor(instructorReemplazoId: number, periodoId?: number): Promise<Cover[]> {
    return this.getCovers({ instructorReemplazoId, periodoId })
  }

  async getCoversByPeriodo(periodoId: number): Promise<Cover[]> {
    return this.getCovers({ periodoId })
  }

   async enlazarCoversPeriodo(periodoId: number): Promise<{ updatedCount: number }> {
    return this.post<{ periodoId: number }, { updatedCount: number }>(
      "/covers/enlazar",
      { periodoId }
    )
  }
  
  async getCoversByDisciplina(disciplinaId: number, periodoId?: number): Promise<Cover[]> {
    return this.getCovers({ disciplinaId, periodoId })
  }
}

// Instancia singleton para usar en toda la aplicación
export const coversApi = new CoversApi()