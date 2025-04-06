"use client"
import Link from "next/link"
import type React from "react"

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
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { usePathname } from "next/navigation"
import { ModeToggle } from "./mode-toggle"

export function AppSidebar() {
  const { user, userType, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const claseitem = "text-white hover:bg-secondary hover:text-gray-800 data-[active=true]:bg-card/90 dark:data-[active=true]:bg-background data-[active=true]:text-primary data-[active=true]:font-semibold transition-colors duration-200"


  if (!isAuthenticated || !user) return null

  const isAdmin = () => user?.rol === "ADMIN"
  const isSuperAdmin = () => user?.rol === "SUPER_ADMIN"
  const isInstructor = () => userType === "instructor"

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  // Check if a path is active
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === path
    }
    return pathname.startsWith(path)
  }

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="bg-primary border-r"
    >
      <SidebarHeader className="px-5 pt-3.5 pb-3.5 border-b border-border/40">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-left">
            {isCollapsed ? (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                S
              </div>
            ) : (
              <div className="flex justify-between items-center w-full">
                <h1 className="text-xl font-bold items-start text-white">Siclo Admin </h1>
                <ModeToggle />
              </div>
            )}
          </div>
     
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {isInstructor() ? (
          // Vista para instructores (solo acceso a Instructores)
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Mi perfil"
                  isActive={isActive("/instructores")}
                  className={claseitem}
                >
                  <Link href="/instructores">
                    <User className="h-5 w-5" />
                    <span>Mi perfil</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        ) : (
          // Vista para administradores y otros roles
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold   text-white/70">
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
              <SidebarGroupLabel className="text-xs font-semibold   text-white/70">
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
                <SidebarGroupLabel className="text-xs font-semibold   text-white/70">
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

      <SidebarFooter className="p-4 border-t border-border/40 ">
        <SidebarMenu className="">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Cerrar Sesión"
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

