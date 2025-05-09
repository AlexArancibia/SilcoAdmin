"use client"
import Link from "next/link"
import { useEffect } from "react"
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
import { CalendarDays, LogOut, Calculator, Home, User, CreditCard, Sliders, File } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePagosStore } from "@/store/usePagosStore"
import { useRouter, usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "./mode-toggle"
import { EstadoPago, Rol } from "@/types/schema"

const protectedRoutes = {
  "/": [Rol.SUPER_ADMIN, Rol.ADMIN, Rol.USUARIO],
  "/configuracion": [Rol.SUPER_ADMIN, Rol.ADMIN],
  "/importar": [Rol.SUPER_ADMIN, Rol.ADMIN, Rol.USUARIO],
  "/formulas": [Rol.SUPER_ADMIN, Rol.ADMIN, Rol.USUARIO],
  "/pagos": [Rol.SUPER_ADMIN, Rol.ADMIN, Rol.USUARIO],
  "/instructores": [...Object.values(Rol), "instructor"],
  "/clases": [Rol.SUPER_ADMIN, Rol.ADMIN, Rol.USUARIO]
}

export function AppSidebar() {
  const { user, userType, isAuthenticated, logout } = useAuthStore()
  const { pagos } = usePagosStore()
  const router = useRouter()
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const claseitem = "text-white hover:bg-secondary hover:text-gray-800 data-[active=true]:bg-card/90 dark:data-[active=true]:bg-background data-[active=true]:text-primary data-[active=true]:font-semibold transition-colors duration-200"

  // Filtrar y ordenar pagos del instructor
  const pagosInstructor = userType === "instructor" 
    ? [...pagos]
        .filter(pago => pago.instructorId === user?.id)
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    : []

  // Efecto para manejar redirecciones
  useEffect(() => {
    // Si no está autenticado, redirigir a login
    if (!isAuthenticated) {
      if (pathname !== '/login') {
        router.push(`/login?from=${pathname}`)
      }
      return
    }

    // Si está autenticado y está en la página de login, redirigir según rol
    if (isAuthenticated && pathname === '/login') {
      if (userType === "instructor") {
        router.push(`/instructores/${user?.id}`)
      } else {
        router.push("/") // Redirigir a home para otros roles
      }
      return
    }

    // Si es instructor pero no está en su perfil o pagos, redirigir
    if (userType === "instructor") {
      const allowedPaths = [
        `/instructores/${user?.id}`,
        ...pagosInstructor.map(pago => `/pagos/${pago.id}`)
      ]

      if (!allowedPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
        router.push(`/instructores/${user?.id}`)
      }
    }
  }, [pathname, isAuthenticated, userType, user?.id, router, pagosInstructor])

  if (!isAuthenticated || !user) return null

  const isAdmin = () => user?.rol === Rol.ADMIN
  const isSuperAdmin = () => user?.rol === Rol.SUPER_ADMIN
  const isInstructor = () => userType === "instructor"

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const isActive = (path: string) => pathname.startsWith(path)

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
  }

  const getEstadoColor = (estado: EstadoPago) => {
    switch (estado) {
      case 'PAGADO': return 'text-green-400'
      case 'APROBADO': return 'text-blue-400'
      case 'PENDIENTE': return 'text-yellow-400'
      case 'CANCELADO': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

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
        {isInstructor() ? (
          <SidebarGroup>
            <SidebarMenu>
              {/* Item de perfil - Siempre visible */}
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

              {/* Sección de pagos - Solo si existen */}
              {pagosInstructor.length > 0 && (
                <>
                  <Separator className="my-2 bg-white/20" />
                  <SidebarGroupLabel className="text-xs font-semibold text-white/70">
                    MIS PAGOS
                  </SidebarGroupLabel>
                  {pagosInstructor.map(pago => (
                    <SidebarMenuItem key={pago.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(`/pagos/${pago.id}`)}
                        className={claseitem}
                      >
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
        ) : (
          // Vista para administradores y otros roles
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-white/70">
                GESTIÓN
              </SidebarGroupLabel>
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
                    <SidebarMenuButton
                      asChild
                      tooltip="Clases"
                      isActive={isActive("/clases")}
                      className={claseitem}
                    >
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
              <SidebarGroupLabel className="text-xs font-semibold text-white/70">
                FINANZAS
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Pagos"
                      isActive={isActive("/pagos")}
                      className={claseitem}
                    >
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
                <SidebarGroupLabel className="text-xs font-semibold text-white/70">
                  ADMINISTRACIÓN
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
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
          </>
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