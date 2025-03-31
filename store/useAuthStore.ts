import { AuthUser } from "@/lib/api/auth-api"
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  userType: "usuario" | "instructor" | null // Explicit userType at the top level

  // Actions
  login: (identifier: string, password: string) => Promise<void>
  register: (
    userType: "usuario" | "instructor",
    userData: {
      nombre: string
      email?: string
      password: string
      rol?: string
    },
  ) => Promise<void>
  logout: () => void
  clearError: () => void
  setUser: (user: AuthUser, token: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      userType: null, // Add userType to initial state

      setUser: (user, token) => {
        set({
          user,
          token,
          userType: user.userType, // Set userType from user object
          isAuthenticated: true,
          error: null,
        })
      },

      login: async (identifier, password) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ identifier, password }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.message || "Failed to login")
          }

          set({
            user: data.user,
            token: data.token,
            userType: data.user.userType, // Set userType from user object
            isAuthenticated: true,
            isLoading: false,
          })

          // Set the auth cookie for the middleware
          document.cookie = `auth-token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "An error occurred",
            isLoading: false,
            isAuthenticated: false,
          })
        }
      },

      register: async (userType, userData) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userType, ...userData }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.message || "Failed to register")
          }

          set({
            user: data.user,
            token: data.token,
            userType: data.user.userType, // Set userType from user object
            isAuthenticated: true,
            isLoading: false,
          })

          // Set the auth cookie for the middleware
          document.cookie = `auth-token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "An error occurred",
            isLoading: false,
          })
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          userType: null, // Clear userType on logout
          isAuthenticated: false,
          error: null,
        })

        // Remove the auth cookie
        document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        userType: state.userType, // Include userType in persisted state
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

