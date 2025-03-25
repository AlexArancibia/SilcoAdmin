import { ApiClient } from "./api-client"
import type { Periodo } from "@/types/schema"

export class PeriodosApi extends ApiClient {
  constructor() {
    super("/api")
  }

  async getPeriodos(): Promise<Periodo[]> {
    return this.get<Periodo[]>("/periodos")
  }

  async getPeriodo(id: number): Promise<Periodo> {
    return this.get<Periodo>(`/periodos/${id}`)
  }

  async crearPeriodo(periodo: Omit<Periodo, "id">): Promise<Periodo> {
    return this.post<Omit<Periodo, "id">, Periodo>("/periodos", periodo)
  }

  async actualizarPeriodo(id: number, periodo: Partial<Periodo>): Promise<Periodo> {
    return this.put<Partial<Periodo>, Periodo>(`/periodos/${id}`, periodo)
  }

  async eliminarPeriodo(id: number): Promise<{ success: boolean }> {
    return this.delete(`/periodos/${id}`)
  }
}

// Instancia singleton para usar en toda la aplicación
export const periodosApi = new PeriodosApi()

