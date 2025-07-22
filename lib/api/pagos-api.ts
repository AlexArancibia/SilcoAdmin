import { ApiClient } from "./api-client"
import type { PagoInstructor, PaginatedResponse } from "@/types/schema"

export class PagosApi extends ApiClient {
  constructor() {
    super("/api")
  }

    async getPagos(params?: { periodoId?: number; instructorId?: number }): Promise<PaginatedResponse<PagoInstructor>> {
    return this.get<PaginatedResponse<PagoInstructor>>("/pagos", params)
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
}

// Instancia singleton para usar en toda la aplicación
export const pagosApi = new PagosApi()

