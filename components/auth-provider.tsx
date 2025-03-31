"use client"

import { useAuthStore } from "@/store/useAuthStore"
import type React from "react"

import { useEffect } from "react"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated, setUser } = useAuthStore()

  useEffect(() => {
    const checkAuth = async () => {
      if (token && !isAuthenticated) {
        try {
          const response = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const { user } = await response.json()
            setUser(user, token)
            // userType is now set in the setUser function
          } else {
            // Token is invalid, clear it
            useAuthStore.getState().logout()
          }
        } catch (error) {
          console.error("Failed to validate token:", error)
          useAuthStore.getState().logout()
        }
      }
    }

    checkAuth()
  }, [token, isAuthenticated, setUser])

  return <>{children}</>
}

