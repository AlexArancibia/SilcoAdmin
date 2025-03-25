import { ApiClient } from "./api-client"
import type { Disciplina } from "@/types/schema"

export class DisciplinasApi extends ApiClient {
  constructor() {
    super("/api")
  }

  async getDisciplinas(): Promise<Disciplina[]> {
    return this.get<Disciplina[]>("/disciplinas")
  }

  async getDisciplina(id: number): Promise<Disciplina> {
    return this.get<Disciplina>(`/disciplinas/${id}`)
  }

  async crearDisciplina(disciplina: Omit<Disciplina, "id">): Promise<Disciplina> {
    return this.post<Omit<Disciplina, "id">, Disciplina>("/disciplinas", disciplina)
  }

  async actualizarDisciplina(id: number, disciplina: Partial<Disciplina>): Promise<Disciplina> {
    return this.put<Partial<Disciplina>, Disciplina>(`/disciplinas/${id}`, disciplina)
  }

  async eliminarDisciplina(id: number): Promise<{ success: boolean }> {
    return this.delete(`/disciplinas/${id}`)
  }
}

// Instancia singleton para usar en toda la aplicación
export const disciplinasApi = new DisciplinasApi()

