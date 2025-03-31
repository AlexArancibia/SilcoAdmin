import type { Usuario, Rol } from "./schema"

export interface LoginCredentials {
  correo: string
  password: string
}

export interface RegisterData {
  nombre: string
  correo: string
  password: string
  telefono?: string
  rol?: Rol
}

export interface AuthResponse {
  token: string
  user: Usuario
}

export interface JwtPayload {
  userId: number
  email: string
  role: Rol
  iat: number
  exp: number
}

export interface AuthState {
  user: Usuario | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

