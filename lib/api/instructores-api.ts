import { ApiClient } from "./api-client"
import type { Instructor, Disciplina } from "@/types/schema"

export class InstructoresApi extends ApiClient {
  constructor() {
    super("/api")
  }

  async getInstructores(params?: {
    nombre?: string
    estado?: string
    especialidad?: string
    activo?: boolean
    disciplinaId?: number
  }): Promise<Instructor[]> {
    console.log(`[InstructoresApi] Iniciando getInstructores con parámetros:`, params)
    try {
      let url = "/instructores"
      if (params) {
        const searchParams = new URLSearchParams()
        if (params.nombre) searchParams.append("nombre", params.nombre)
        if (params.estado) searchParams.append("estado", params.estado)
        if (params.especialidad) searchParams.append("especialidad", params.especialidad)
        if (params.activo !== undefined) searchParams.append("activo", params.activo.toString())
        if (params.disciplinaId) searchParams.append("disciplinaId", params.disciplinaId.toString())
        const queryString = searchParams.toString()
        if (queryString) url += `?${queryString}`
      }

      const instructores = await this.get<Instructor[]>(url)
      console.log(`[InstructoresApi] Respuesta exitosa, obtenidos ${instructores.length} instructores`)
      return instructores
    } catch (error) {
      console.error(`[InstructoresApi] Error en getInstructores:`, error)
      throw error
    }
  }

  async getInstructor(id: number): Promise<Instructor> {
    console.log(`[InstructoresApi] Iniciando getInstructor con ID: ${id}`)
    try {
      const instructor = await this.get<Instructor>(`/instructores/${id}`)
      console.log(`[InstructoresApi] Respuesta exitosa para instructor ID: ${id}`)
      return instructor
    } catch (error) {
      console.error(`[InstructoresApi] Error en getInstructor para ID ${id}:`, error)
      throw error
    }
  }

  async crearInstructor(instructor: {
    nombre: string
    password?: string
    extrainfo?: Record<string, any>
    ultimoBono?: Record<number, number> // { [disciplinaId]: periodoId }
    cumpleLineamientos?: boolean
    dobleteos?: number
    horariosNoPrime?: number
    participacionEventos?: boolean
    disciplinaIds?: number[]
    categoriasIds?: number[]
  }): Promise<Instructor> {
    console.log(`[InstructoresApi] Iniciando crearInstructor:`, instructor)
    try {
      const nuevoInstructor = await this.post<typeof instructor, Instructor>("/instructores", instructor)
      console.log(`[InstructoresApi] Instructor creado exitosamente:`, nuevoInstructor)
      return nuevoInstructor
    } catch (error) {
      console.error(`[InstructoresApi] Error en crearInstructor:`, error)
      throw error
    }
  }

  async actualizarInstructor(
    id: number,
    instructor: {
      nombre?: string
      password?: string
      extrainfo?: Record<string, any>
      ultimoBono?: Record<number, number>
      disciplinaIds?: number[]
      categoriasIds?: number[]
      categorias?: Array<{
        disciplinaId: number
        periodoId: number
        categoria: string
        metricas?: Record<string, any>
      }>
      cumpleLineamientos?: boolean
      dobleteos?: number
      horariosNoPrime?: number
      participacionEventos?: boolean
    },
  ): Promise<Instructor> {
    console.log(`[InstructoresApi] Iniciando actualizarInstructor para ID ${id}:`, instructor)
    try {
      const instructorActualizado = await this.put<typeof instructor, Instructor>(`/instructores/${id}`, instructor)
      console.log(`[InstructoresApi] Instructor actualizado exitosamente:`, instructorActualizado)
      return instructorActualizado
    } catch (error) {
      console.error(`[InstructoresApi] Error en actualizarInstructor para ID ${id}:`, error)
      throw error
    }
  }

  async eliminarInstructor(id: number): Promise<{ message: string }> {
    console.log(`[InstructoresApi] Iniciando eliminarInstructor para ID: ${id}`)
    try {
      const resultado = await this.delete<{ message: string }>(`/instructores/${id}`)
      console.log(`[InstructoresApi] Instructor eliminado exitosamente`)
      return resultado
    } catch (error) {
      console.error(`[InstructoresApi] Error en eliminarInstructor para ID ${id}:`, error)
      throw error
    }
  }

  async asignarDisciplinasInstructor(instructorId: number, disciplinaIds: number[]): Promise<Instructor> {
    console.log(`[InstructoresApi] Asignando disciplinas al instructor ${instructorId}:`, disciplinaIds)
    try {
      const instructor = await this.actualizarInstructor(instructorId, { disciplinaIds })
      console.log(`[InstructoresApi] Disciplinas asignadas exitosamente`)
      return instructor
    } catch (error) {
      console.error(`[InstructoresApi] Error al asignar disciplinas:`, error)
      throw error
    }
  }

  async getDisciplinasInstructor(instructorId: number): Promise<Disciplina[]> {
    console.log(`[InstructoresApi] Obteniendo disciplinas del instructor ${instructorId}`)
    try {
      const instructor = await this.getInstructor(instructorId)
      console.log(`[InstructoresApi] Obtenidas ${instructor.disciplinas?.length || 0} disciplinas`)
      return instructor.disciplinas || []
    } catch (error) {
      console.error(`[InstructoresApi] Error al obtener disciplinas:`, error)
      throw error
    }
  }
}

// Instancia singleton
export const instructoresApi = new InstructoresApi()
