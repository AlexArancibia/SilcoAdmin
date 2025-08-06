"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { CalendarDays, LogOut, Calculator, Home, User, CreditCard, Sliders, File, ShieldAlert, UserCog, Award, Zap, GraduationCap } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { useRouter, usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "./mode-toggle"
import { type EstadoPago, Rol, type PagoInstructor } from "@/types/schema"

const protectedRoutes = {
  "/covers": [Rol.MANAGER, "instructor"],
  "/penalizaciones": [Rol.MANAGER],
  "/brandeos": [Rol.SUPER_ADMIN, Rol.ADMIN],
  "/theme-rides": [Rol.SUPER_ADMIN, Rol.ADMIN],
  "/workshops": [Rol.SUPER_ADMIN, Rol.ADMIN],
  "/": [Rol.SUPER_ADMIN, Rol.ADMIN, Rol.USUARIO],
  "/configuracion": [Rol.SUPER_ADMIN, Rol.ADMIN],
  "/importar": [Rol.SUPER_ADMIN, Rol.ADMIN, Rol.USUARIO],
  "/formulas": [Rol.SUPER_ADMIN, Rol.ADMIN, Rol.USUARIO],
  "/pagos": [Rol.SUPER_ADMIN, Rol.ADMIN, Rol.USUARIO],
  "/instructores": [...Object.values(Rol), "instructor"],
  "/clases": [Rol.SUPER_ADMIN, Rol.ADMIN, Rol.USUARIO],
}

export function AppSidebar() {
  const { user, userType, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const claseitem =
    "text-white hover:bg-secondary hover:text-gray-800 data-[active=true]:bg-card/90 dark:data-[active=true]:bg-background data-[active=true]:text-primary data-[active=true]:font-semibold transition-colors duration-200"

  // State for instructor payments
  const [pagosInstructor, setPagosInstructor] = useState<PagoInstructor[]>([])
  const [isLoadingPagos, setIsLoadingPagos] = useState(false)

  // Fetch instructor payments if user is an instructor
  useEffect(() => {
    const fetchInstructorPayments = async () => {
      if (userType !== "instructor" || !user?.id) {
        console.log('[Sidebar] No es instructor o no hay user ID:', { userType, userId: user?.id })
        return
      }

      console.log('[Sidebar] Iniciando fetch de pagos para instructor:', user.id)
      setIsLoadingPagos(true)
      try {
        const url = `/api/pagos?instructorId=${user.id}&limit=10`
        console.log('[Sidebar] Fetching URL:', url)
        
        const response = await fetch(url)
        const data = await response.json()
        
        console.log('[Sidebar] Response status:', response.status)
        console.log('[Sidebar] Response data:', data)
        
        if (response.ok) {
          // Sort payments by most recent first
          const sortedPagos = data.data.sort((a: PagoInstructor, b: PagoInstructor) => {
            const dateA = new Date(b.updatedAt || b.createdAt || 0)
            const dateB = new Date(a.updatedAt || a.createdAt || 0)
            return dateA.getTime() - dateB.getTime()
          })
          console.log('[Sidebar] Pagos ordenados:', sortedPagos.length, sortedPagos)
          setPagosInstructor(sortedPagos)
        } else {
          console.error('[Sidebar] Error fetching instructor payments:', data.error)
          setPagosInstructor([])
        }
      } catch (error) {
        console.error('[Sidebar] Error fetching instructor payments:', error)
        setPagosInstructor([])
      } finally {
        setIsLoadingPagos(false)
      }
    }

    // Add a small delay to ensure user data is loaded
    const timer = setTimeout(fetchInstructorPayments, 100)
    return () => clearTimeout(timer)
  }, [userType, user?.id, isAuthenticated])

  const [isAuthChecking, setIsAuthChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      setIsAuthChecking(false)
    }
    checkAuth()
  }, [])

  useEffect(() => {
    if (isAuthChecking) return

    if (!isAuthenticated) {
      if (pathname !== "/login") {
        router.push(`/login?from=${pathname}`)
      }
      return
    }

    if (isAuthenticated && pathname === "/login") {
      if (userType === "instructor") {
        router.push(`/instructores/${user?.id}`)
      } else {
        router.push(user?.rol === Rol.MANAGER ? "/covers" : "/")
      }
      return
    }

    // Redirect manager if trying to access unauthorized routes
    if (user?.rol === Rol.MANAGER && !pathname.startsWith("/covers") && !pathname.startsWith("/penalizaciones")) {
      router.push("/covers")
    }

    if (userType === "instructor") {
      // Don't redirect while payments are loading to avoid interrupting navigation
      if (isLoadingPagos && pathname.startsWith("/pagos/")) {
        console.log('[Sidebar] Skipping redirect while payments are loading')
        return
      }
      
      // Allow instructor profile, covers, and any payment route
      const allowedPaths = [
        `/instructores/${user?.id}`,
        "/covers",
        "/pagos/" // Allow any payment route for instructors
      ]
      
      const isAllowedRoute = allowedPaths.some((path) => {
        if (path === "/pagos/") {
          // Allow any payment route that starts with /pagos/
          return pathname.startsWith(path)
        }
        return pathname === path || pathname.startsWith(`${path}/`)
      })
      
      if (!isAllowedRoute) {
        console.log('[Sidebar] Redirecting instructor to profile, current path:', pathname)
        router.push(`/instructores/${user?.id}`)
      }
    }
  }, [pathname, isAuthenticated, userType, user?.id, router, isLoadingPagos, isAuthChecking])

  if (isAuthChecking) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary/10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated || !user) return null

  const isAdmin = () => user?.rol === Rol.ADMIN
  const isSuperAdmin = () => user?.rol === Rol.SUPER_ADMIN
  const isManager = () => user?.rol === Rol.MANAGER
  const isInstructor = () => userType === "instructor"

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/"
    return pathname.startsWith(path)
  }

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString("es-ES", { month: "short", year: "numeric" })
  }

  const getEstadoColor = (estado: EstadoPago) => {
    switch (estado) {
      case "PAGADO":
        return "text-green-400"
      case "APROBADO":
        return "text-blue-400"
      case "PENDIENTE":
        return "text-yellow-400"
      case "CANCELADO":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  // Manager-specific sidebar (only shows Covers and Penalizaciones)
  if (isManager()) {
    return (
      <Sidebar variant="sidebar" collapsible="icon" className="bg-primary border-r">
        <SidebarHeader className="px-5 pt-3.5 pb-3.5 border-b border-border/40">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-left">
              {isCollapsed ? (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                  S
                </div>
              ) : (
                <div className="flex justify-between items-center w-full">
                  <h1 className="text-xl font-bold items-start text-white">Siclo Admin</h1>
                  <ModeToggle />
                </div>
              )}
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-white/70">ADMINISTRACIÓN</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Covers"
                    isActive={isActive("/covers")}
                    className={claseitem}
                  >
                    <Link href="/covers">
                      <UserCog className="h-5 w-5" />
                      <span>Covers</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Penalizaciones"
                    isActive={isActive("/penalizaciones")}
                    className={claseitem}
                  >
                    <Link href="/penalizaciones">
                      <ShieldAlert className="h-5 w-5" />
                      <span>Penalizaciones</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-border/40">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                className="hover:bg-destructive/10 text-accent font-bold hover:text-destructive transition-colors duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span>Cerrar Sesión</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    )
  }

  // Instructor-specific sidebar
  if (isInstructor()) {
    return (
      <Sidebar variant="sidebar" collapsible="icon" className="bg-primary border-r">
        <SidebarHeader className="px-5 pt-3.5 pb-3.5 border-b border-border/40">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-left">
              {isCollapsed ? (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                  S
                </div>
              ) : (
                <div className="flex justify-between items-center w-full">
                  <h1 className="text-xl font-bold items-start text-white">Siclo Admin</h1>
                  <ModeToggle />
                </div>
              )}
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Mi perfil"
                  isActive={isActive(`/instructores/${user?.id}`)}
                  className={claseitem}
                >
                  <Link href={`/instructores/${user?.id}`}>
                    <User className="h-5 w-5" />
                    <span>Mi perfil</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Mis Covers"
                  isActive={isActive("/covers")}
                  className={claseitem}
                >
                  <Link href="/covers">
                    <UserCog className="h-5 w-5" />
                    <span>Mis Covers</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {userType === "instructor" && (
                <>
                  <Separator className="my-2 bg-white/20" />
                  <SidebarGroupLabel className="text-xs font-semibold text-white/70">
                    MIS PAGOS {isLoadingPagos && "(Cargando...)"}
                  </SidebarGroupLabel>
                  {isLoadingPagos && (
                    <SidebarMenuItem>
                      <div className="flex items-center gap-2 px-3 py-2 text-white/60">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white/60"></div>
                        <span className="text-xs">Cargando pagos...</span>
                      </div>
                    </SidebarMenuItem>
                  )}
                  {!isLoadingPagos && pagosInstructor.length === 0 && (
                    <SidebarMenuItem>
                      <div className="px-3 py-2 text-white/60 text-xs">
                        No hay pagos registrados
                      </div>
                    </SidebarMenuItem>
                  )}
                  {!isLoadingPagos && pagosInstructor.length > 0 && pagosInstructor.map((pago) => (
                    <SidebarMenuItem key={pago.id}>
                      <SidebarMenuButton asChild isActive={isActive(`/pagos/${pago.id}`)} className={claseitem}>
                        <Link href={`/pagos/${pago.id}`}>
                          <CreditCard className="h-5 w-5" />
                          <div className="flex flex-col">
                            <span>Pago {formatDate(pago.periodo?.fechaFin)}</span>
                            <span className={`text-xs ${getEstadoColor(pago.estado)}`}>
                              {pago.estado} - S/ {pago.pagoFinal?.toFixed(2)}
                            </span>
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </>
              )}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-border/40">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                className="hover:bg-destructive/10 text-accent font-bold hover:text-destructive transition-colors duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span>Cerrar Sesión</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    )
  }

  // Admin/Super Admin/User sidebar
  return (
    <Sidebar variant="sidebar" collapsible="icon" className="bg-primary border-r">
      <SidebarHeader className="px-5 pt-3.5 pb-3.5 border-b border-border/40">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-left">
            {isCollapsed ? (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                S
              </div>
            ) : (
              <div className="flex justify-between items-center w-full">
                <h1 className="text-xl font-bold items-start text-white">Siclo Admin</h1>
                <ModeToggle />
              </div>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-white/70">GESTIÓN</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Panel de Control"
                  isActive={isActive("/")}
                  className={claseitem}
                >
                  <Link href="/">
                    <Home className="h-5 w-5" />
                    <span>Panel de Control</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Instructores"
                  isActive={isActive("/instructores")}
                  className={claseitem}
                >
                  <Link href="/instructores">
                    <User className="h-5 w-5" />
                    <span>Instructores</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Clases" isActive={isActive("/clases")} className={claseitem}>
                  <Link href="/clases">
                    <CalendarDays className="h-5 w-5" />
                    <span>Clases</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-white/70">FINANZAS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Pagos" isActive={isActive("/pagos")} className={claseitem}>
                  <Link href="/pagos">
                    <CreditCard className="h-5 w-5" />
                    <span>Pagos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Importar Datos"
                  isActive={isActive("/importar")}
                  className={claseitem}
                >
                  <Link href="/importar">
                    <File className="h-5 w-5" />
                    <span>Importar Datos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Fórmulas"
                  isActive={isActive("/formulas")}
                  className={claseitem}
                >
                  <Link href="/formulas">
                    <Calculator className="h-5 w-5" />
                    <span>Fórmulas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(isAdmin() || isSuperAdmin()) && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-white/70">ADMINISTRACIÓN</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Covers"
                    isActive={isActive("/covers")}
                    className={claseitem}
                  >
                    <Link href="/covers">
                      <UserCog className="h-5 w-5" />
                      <span>Covers</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Penalizaciones"
                    isActive={isActive("/penalizaciones")}
                    className={claseitem}
                  >
                    <Link href="/penalizaciones">
                      <ShieldAlert className="h-5 w-5" />
                      <span>Penalizaciones</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Brandeos"
                    isActive={isActive("/brandeos")}
                    className={claseitem}
                  >
                    <Link href="/brandeos">
                      <Award className="h-5 w-5" />
                      <span>Brandeos</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Theme Rides"
                    isActive={isActive("/theme-rides")}
                    className={claseitem}
                  >
                    <Link href="/theme-rides">
                      <Zap className="h-5 w-5" />
                      <span>Theme Rides</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Workshops"
                    isActive={isActive("/workshops")}
                    className={claseitem}
                  >
                    <Link href="/workshops">
                      <GraduationCap className="h-5 w-5" />
                      <span>Workshops</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Configuración"
                    isActive={isActive("/configuracion")}
                    className={claseitem}
                  >
                    <Link href="/configuracion">
                      <Sliders className="h-5 w-5" />
                      <span>Configuración</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/40">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="hover:bg-destructive/10 text-accent font-bold hover:text-destructive transition-colors duration-200"
            >
              <LogOut className="h-5 w-5" />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}