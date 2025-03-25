import { ApiClient } from "./api-client"
import type { Usuario, Rol } from "@/types/schema"

export class UsuariosApi extends ApiClient {
  constructor() {
    super("/api")
  }

  async getUsuarios(params?: { rol?: Rol; nombre?: string }): Promise<Usuario[]> {
    return this.get<Usuario[]>("/usuarios", params)
  }

  async getUsuario(id: number): Promise<Usuario> {
    return this.get<Usuario>(`/usuarios/${id}`)
  }

  async buscarInstructorPorNombre(nombre: string): Promise<Usuario | null> {
    const instructores = await this.getUsuarios({
      rol: Rol.INSTRUCTOR,
      nombre,
    })

    // Buscar coincidencia exacta
    return instructores.find((i) => i.nombre.toLowerCase() === nombre.toLowerCase()) || null
  }

  async crearUsuario(usuario: Omit<Usuario, "id">): Promise<Usuario> {
    return this.post<Omit<Usuario, "id">, Usuario>("/usuarios", usuario)
  }

  async actualizarUsuario(id: number, usuario: Partial<Usuario>): Promise<Usuario> {
    return this.put<Partial<Usuario>, Usuario>(`/usuarios/${id}`, usuario)
  }

  async eliminarUsuario(id: number): Promise<{ success: boolean }> {
    return this.delete(`/usuarios/${id}`)
  }
}

// Instancia singleton para usar en toda la aplicación
export const usuariosApi = new UsuariosApi()

