import { ApiClient } from "./api-client"
import type { PagoInstructor, PaginatedResponse, PagosQueryParams } from "@/types/schema"

export class PagosApi extends ApiClient {
  constructor() {
    super("/api")
  }

  async getPagos(params?: PagosQueryParams): Promise<PaginatedResponse<PagoInstructor>> {
    return this.get<PaginatedResponse<PagoInstructor>>("/pagos", params as Record<string, any>)
  }

  async getPago(id: number): Promise<PagoInstructor> {
    return this.get<PagoInstructor>(`/pagos/${id}`)
  }

  async crearPago(pago: Omit<PagoInstructor, "id" | "createdAt" | "updatedAt">): Promise<PagoInstructor> {
    return this.post<Omit<PagoInstructor, "id" | "createdAt" | "updatedAt">, PagoInstructor>("/pagos", pago)
  }

  async actualizarPago(id: number, pago: Partial<PagoInstructor>): Promise<PagoInstructor> {
    return this.put<Partial<PagoInstructor>, PagoInstructor>(`/pagos/${id}`, pago)
  }

  async eliminarPago(id: number): Promise<{ success: boolean }> {
    return this.delete(`/pagos/${id}`)
  }

  async exportarExcel(params?: PagosQueryParams): Promise<{ success: boolean; data: any[]; total: number }> {
    return this.post<PagosQueryParams, { success: boolean; data: any[]; total: number }>("/pagos/export/excel", params || {})
  }
}

// Instancia singleton para usar en toda la aplicación
export const pagosApi = new PagosApi()

