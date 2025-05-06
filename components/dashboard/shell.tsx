"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/useAuthStore"
import { usePagosStore } from "@/store/usePagosStore"
import { PagoInstructor } from "@/types/schema"

interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DashboardShell({ children, className, ...props }: DashboardShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { pagos } = usePagosStore()
  const { user, userType, isAuthenticated } = useAuthStore()

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [pagosPermitidos, setPagosPermitidos] = useState<number[] | null>(null)
  const [shouldReload, setShouldReload] = useState(false)

  // Filtrar pagos del instructor
  useEffect(() => {
    console.log('[DashboardShell] Efecto para filtrar pagos iniciado')
    
    if (isAuthenticated && userType === "instructor" && user) {
      const instructorId = user.id
      console.log(`[DashboardShell] Filtrando pagos para instructor ID: ${instructorId}`)
      
      const filteredPagos = pagos.filter(pago => pago.instructorId === instructorId)
      console.log(`[DashboardShell] Pagos encontrados: ${filteredPagos.length}`)
      
      const pagoIds = filteredPagos.map(pago => pago.id)
      console.log(`[DashboardShell] IDs de pagos permitidos: ${JSON.stringify(pagoIds)}`)
      
      setPagosPermitidos(pagoIds)
    } else {
      console.log('[DashboardShell] No es instructor o no está autenticado')
      setPagosPermitidos([])
    }
  }, [pagos, user, userType, isAuthenticated])

  // Efecto para manejar redirecciones con recarga
  useEffect(() => {
    if (shouldReload && user) {
      const instructorRoute = `/instructores/${user.id}`
      console.log(`[DashboardShell] Redirigiendo con recarga a: ${instructorRoute}`)
      
      // Forzar recarga completa de la página
      window.location.href = instructorRoute
    }
  }, [shouldReload, user])

  // Verificar acceso a rutas
  useEffect(() => {
    console.log('[DashboardShell] Efecto para verificar rutas iniciado')
    console.log(`[DashboardShell] Ruta actual: ${pathname}`)

    // No aplicar restricciones si no es instructor
    if (!isAuthenticated || userType !== "instructor" || !user) {
      console.log('[DashboardShell] No se aplican restricciones: no es instructor autenticado')
      setIsAuthorized(true)
      return
    }

    // Esperar a que los pagos permitidos estén cargados
    if (pagosPermitidos === null) {
      console.log('[DashboardShell] Esperando carga de pagos permitidos...')
      setIsAuthorized(null)
      return
    }

    const instructorId = user.id
    const instructorRoute = `/instructores/${instructorId}`
    const isInstructorRoute = pathname === instructorRoute || pathname.startsWith(`${instructorRoute}/`)
    console.log(`[DashboardShell] ¿Es ruta de instructor? ${isInstructorRoute}`)
    
    // Verificar si es una ruta de pago permitido
    let isPagoPermitido = false
    if (pathname.startsWith('/pagos/')) {
      const pagoIdStr = pathname.split('/')[2]
      const pagoId = parseInt(pagoIdStr, 10)
      console.log(`[DashboardShell] ID de pago en ruta: ${pagoId}`)
      
      isPagoPermitido = !isNaN(pagoId) && pagosPermitidos.includes(pagoId)
      console.log(`[DashboardShell] ¿Pago permitido? ${isPagoPermitido}`)
    }

    // Rutas permitidas para instructores
    const isAllowedRoute = isInstructorRoute || isPagoPermitido
    console.log(`[DashboardShell] ¿Ruta permitida? ${isAllowedRoute}`)

    if (!isAllowedRoute) {
      console.log(`[DashboardShell] Ruta no permitida. Preparando recarga de página`)
      setIsAuthorized(false)
      setShouldReload(true) // Esto activará el efecto de recarga
    } else {
      console.log('[DashboardShell] Ruta permitida')
      setIsAuthorized(true)
      setShouldReload(false)
    }
  }, [pathname, user, userType, isAuthenticated, pagosPermitidos])
  
  // Estados de carga
  if (isAuthorized === null || pagosPermitidos === null) {
    console.log('[DashboardShell] Mostrando pantalla de carga')
    return (
      <div className={cn("grid items-start gap-4 w-full max-w-full p-10", className)} {...props}>
        <div className="flex items-center justify-center w-full h-32">
          <p className="text-lg text-gray-500">Cargando pagos permitidos...</p>
        </div>
      </div>
    )
  }
  
  // Contenido no autorizado (antes de redirección)
  if (!isAuthorized) {
    console.log('[DashboardShell] Mostrando mensaje de redirección')
    return (
      <div className={cn("grid items-start gap-4 w-full max-w-full p-10", className)} {...props}>
        <div className="flex items-center justify-center w-full h-32">
          <p className="text-lg text-gray-500">Redirigiendo a tu página de instructor...</p>
        </div>
      </div>
    )
  }
  
  console.log(`[DashboardShell] Renderizando contenido autorizado`)
  return (
    <div className={cn("grid items-start gap-4 w-full max-w-full p-10", className)} {...props}>
      {children}
    </div>
  )
}