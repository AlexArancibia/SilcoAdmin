"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/useAuthStore"


interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DashboardShell({ children, className, ...props }: DashboardShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, userType, isAuthenticated } = useAuthStore()
  const [isAuthorized, setIsAuthorized] = useState(true)
  
  // Verificación inmediata al montar el componente
  useEffect(() => {
    // Verificar si es instructor y si está en una ruta permitida
    if (isAuthenticated && userType === "instructor" && user) {
      const instructorId = user.id
      const instructorRoute = `/instructores/${instructorId}`
      const paymentsRoute = `/pagos/${instructorId}`
      
      const isInstructorRoute = pathname === instructorRoute || pathname.startsWith(`${instructorRoute}/`)
      const isPaymentsRoute = pathname === paymentsRoute || pathname.startsWith(`${paymentsRoute}/`)
      
      if (!isInstructorRoute && !isPaymentsRoute) {
        console.log(`[DashboardShell] Forzando redirección a ${instructorRoute}`)
        setIsAuthorized(false)
        
        // Forzar la redirección con un pequeño retraso para asegurar que el estado se actualiza
        setTimeout(() => {
          router.replace(instructorRoute)
        }, 100)
      } else {
        setIsAuthorized(true)
      }
    }
  }, [pathname, router, user, userType, isAuthenticated])
  
  // Verificación continua para evitar manipulaciones del DOM o cambios de ruta
  useEffect(() => {
    if (!isAuthenticated || userType !== "instructor" || !user) return
    
    const checkRouteAccess = () => {
      const instructorId = user.id
      const instructorRoute = `/instructores/${instructorId}`
      const paymentsRoute = `/pagos/${instructorId}`
      
      const currentPath = window.location.pathname
      
      const isInstructorRoute = currentPath === instructorRoute || currentPath.startsWith(`${instructorRoute}/`)
      const isPaymentsRoute = currentPath === paymentsRoute || currentPath.startsWith(`${paymentsRoute}/`)
      
      if (!isInstructorRoute && !isPaymentsRoute) {
        console.log(`[DashboardShell] Detectada navegación no autorizada. Redirigiendo a ${instructorRoute}`)
        window.location.href = instructorRoute // Usar cambio directo de ubicación para forzar recarga
      }
    }
    
    // Verificar cada 300ms
    const intervalId = setInterval(checkRouteAccess, 300)
    
    return () => clearInterval(intervalId)
  }, [user, userType, isAuthenticated])
  
  return (
    <div className={cn("grid items-start gap-8 w-full max-w-full p-10", className)} {...props}>
      {isAuthorized ? (
        children
      ) : (
        <div className="flex items-center justify-center w-full h-32">
          <p className="text-lg text-gray-500">Redirigiendo a tu página de instructor...</p>
        </div>
      )}
    </div>
  )
}