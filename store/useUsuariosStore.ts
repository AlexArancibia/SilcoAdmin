import { create } from "zustand"
import { usuariosApi } from "@/lib/api/usuarios-api"
import type { Usuario, Rol } from "@/types/schema"

interface UsuariosState {
  usuarios: Usuario[]
  instructores: Usuario[]
  usuarioSeleccionado: Usuario | null
  isLoading: boolean
  error: string | null

  // Acciones
  fetchUsuarios: (params?: { rol?: Rol; nombre?: string }) => Promise<void>
  fetchInstructores: () => Promise<void>
  fetchUsuario: (id: number) => Promise<void>
  buscarInstructorPorNombre: (nombre: string) => Promise<Usuario | null>
  crearUsuario: (usuario: Omit<Usuario, "id">) => Promise<void>
  actualizarUsuario: (id: number, usuario: Partial<Usuario>) => Promise<void>
  eliminarUsuario: (id: number) => Promise<void>
  setUsuarioSeleccionado: (usuario: Usuario | null) => void
}

export const useUsuariosStore = create<UsuariosState>((set, get) => ({
  usuarios: [],
  instructores: [],
  usuarioSeleccionado: null,
  isLoading: false,
  error: null,

  fetchUsuarios: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const usuarios = await usuariosApi.getUsuarios(params)
      set({ usuarios, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener usuarios",
        isLoading: false,
      })
    }
  },

  fetchInstructores: async () => {
    set({ isLoading: true, error: null })
    try {
      const instructores = await usuariosApi.getUsuarios({ rol: Rol.INSTRUCTOR })
      set({ instructores, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener instructores",
        isLoading: false,
      })
    }
  },

  fetchUsuario: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const usuario = await usuariosApi.getUsuario(id)
      set({ usuarioSeleccionado: usuario, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener el usuario",
        isLoading: false,
      })
    }
  },

  buscarInstructorPorNombre: async (nombre: string) => {
    set({ isLoading: true, error: null })
    try {
      const instructor = await usuariosApi.buscarInstructorPorNombre(nombre)
      set({ isLoading: false })
      return instructor
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al buscar el instructor",
        isLoading: false,
      })
      return null
    }
  },

  crearUsuario: async (usuario: Omit<Usuario, "id">) => {
    set({ isLoading: true, error: null })
    try {
      const nuevoUsuario = await usuariosApi.crearUsuario(usuario)
      set((state) => {
        const nuevosUsuarios = [...state.usuarios, nuevoUsuario]
        const nuevosInstructores =
          usuario.rol === Rol.INSTRUCTOR ? [...state.instructores, nuevoUsuario] : state.instructores

        return {
          usuarios: nuevosUsuarios,
          instructores: nuevosInstructores,
          isLoading: false,
        }
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al crear el usuario",
        isLoading: false,
      })
    }
  },

  actualizarUsuario: async (id: number, usuario: Partial<Usuario>) => {
    set({ isLoading: true, error: null })
    try {
      const usuarioActualizado = await usuariosApi.actualizarUsuario(id, usuario)
      set((state) => {
        const nuevosUsuarios = state.usuarios.map((u) => (u.id === id ? usuarioActualizado : u))
        const nuevosInstructores = state.instructores.map((i) =>
          i.id === id && usuarioActualizado.rol === Rol.INSTRUCTOR ? usuarioActualizado : i,
        )

        return {
          usuarios: nuevosUsuarios,
          instructores: nuevosInstructores,
          usuarioSeleccionado: state.usuarioSeleccionado?.id === id ? usuarioActualizado : state.usuarioSeleccionado,
          isLoading: false,
        }
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al actualizar el usuario",
        isLoading: false,
      })
    }
  },

  eliminarUsuario: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      await usuariosApi.eliminarUsuario(id)
      set((state) => {
        const usuario = state.usuarios.find((u) => u.id === id)

        return {
          usuarios: state.usuarios.filter((u) => u.id !== id),
          instructores:
            usuario?.rol === Rol.INSTRUCTOR ? state.instructores.filter((i) => i.id !== id) : state.instructores,
          usuarioSeleccionado: state.usuarioSeleccionado?.id === id ? null : state.usuarioSeleccionado,
          isLoading: false,
        }
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al eliminar el usuario",
        isLoading: false,
      })
    }
  },

  setUsuarioSeleccionado: (usuario: Usuario | null) => {
    set({ usuarioSeleccionado: usuario })
  },
}))

