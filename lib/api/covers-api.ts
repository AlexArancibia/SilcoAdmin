import { ApiClient } from "./api-client"
import type { Cover, CoversQueryParams, PaginatedResponse } from "@/types/schema"

export class CoversApi extends ApiClient {
  constructor() {
    super("/api")
  }

  async getCovers(params?: CoversQueryParams): Promise<PaginatedResponse<Cover>> {
    return this.get("/covers", params)
  }

  async getCoverById(id: number): Promise<Cover> {
    return this.get(`/covers/${id}`)
  }

  async createCover(cover: {
    instructorOriginalId: number
    instructorReemplazoId: number
    disciplinaId: number
    periodoId: number
    fecha: Date | string
    hora: string
    claseId?: string
    comentarios?: string
    cambioDeNombre?: string
  }): Promise<Cover> {
    return this.post<typeof cover, Cover>("/covers", cover)
  }

  async updateCover(id: number, cover: Partial<Cover & { fecha?: string | Date }>): Promise<Cover> {
    return this.put<Partial<Cover & { fecha?: string | Date }>, Cover>(`/covers/${id}`, cover)
  }

  async deleteCover(id: number): Promise<{ success: boolean }> {
    return this.delete(`/covers/${id}`)
  }

  // Endpoint específico para instructores - solo ven covers donde fueron reemplazo
  async getMisReemplazos(params: CoversQueryParams & { instructorReemplazoId: number }): Promise<PaginatedResponse<Cover>> {
    return this.get("/covers/mis-reemplazos", params)
  }

  // Métodos específicos para covers con el nuevo modelo
  async getCoversByInstructorReemplazo(instructorReemplazoId: number, params?: Omit<CoversQueryParams, 'instructorReemplazoId'>): Promise<PaginatedResponse<Cover>> {
    return this.getMisReemplazos({ instructorReemplazoId, ...params })
  }

  async getCoversByInstructorOriginal(instructorOriginalId: number, params?: Omit<CoversQueryParams, 'instructorOriginalId'>): Promise<PaginatedResponse<Cover>> {
    return this.getCovers({ instructorOriginalId, ...params })
  }

  async getCoversByPeriodo(periodoId: number, params?: Omit<CoversQueryParams, 'periodoId'>): Promise<PaginatedResponse<Cover>> {
    return this.getCovers({ periodoId, ...params })
  }

  async getCoversByDisciplina(disciplinaId: number, params?: Omit<CoversQueryParams, 'disciplinaId'>): Promise<PaginatedResponse<Cover>> {
    return this.getCovers({ disciplinaId, ...params })
  }

  async getCoversByJustificacion(justificacion: "PENDIENTE" | "APROBADO" | "RECHAZADO", params?: Omit<CoversQueryParams, 'justificacion'>): Promise<PaginatedResponse<Cover>> {
    return this.getCovers({ justificacion, ...params })
  }

  async getCoversByFecha(fecha: string, params?: Omit<CoversQueryParams, 'fecha'>): Promise<PaginatedResponse<Cover>> {
    return this.getCovers({ fecha, ...params })
  }

  // Método para managers/admin para aprobar/rechazar covers
  async updateCoverJustificacion(id: number, justificacion: "PENDIENTE" | "APROBADO" | "RECHAZADO", comentarios?: string): Promise<Cover> {
    return this.updateCover(id, { justificacion, comentarios })
  }

  // Método para managers/admin para configurar pagos de covers
  async updateCoverPayments(id: number, payments: {
    pagoBono?: boolean
    pagoFullHouse?: boolean
  }): Promise<Cover> {
    return this.updateCover(id, payments)
  }

  // Método para enlazar un cover con una clase existente
  async enlazarCoverConClase(id: number, claseId: string): Promise<Cover> {
    return this.updateCover(id, { claseId })
  }

  // Búsqueda de covers
  async searchCovers(busqueda: string, params?: Omit<CoversQueryParams, 'busqueda'>): Promise<PaginatedResponse<Cover>> {
    return this.getCovers({ busqueda, ...params })
  }
}

// Instancia singleton para usar en toda la aplicación
export const coversApi = new CoversApi()