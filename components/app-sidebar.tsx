// components/AppSidebar.js
"use client"
import Link from "next/link";
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from "@/components/ui/sidebar";
import { BarChart3, Users, CalendarDays, DollarSign, FileSpreadsheet, Settings, LogOut, Calculator, Home, User, Clock, BookOpen, CreditCard , Sliders, File } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { PeriodSelector } from "@/components/period-selector";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export function AppSidebar() {
  const { user, userType, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()

  if (!isAuthenticated || !user) return null

  const isAdmin = () => user?.rol === "ADMIN"
  const isSuperAdmin = () => user?.rol === "SUPER_ADMIN"
  const isInstructor = () => userType === "instructor"

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <Sidebar variant="sidebar" collapsible="offcanvas" className="bg-gradient-to-b from-primary/5 to-background border-r">
      <SidebarHeader className="px-4 py-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarFallback className="bg-primary/10 font-medium">
                {user.nombre?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">Silco Admin</h1>
 
            </div>
          </div>
          
          <Separator className="my-1" />
          
          <div className="flex items-center gap-2">
  {!isInstructor() && (
    <>
      <div className="flex flex-col">
        <PeriodSelector />
      </div>
      <div>
      <ModeToggle /></div>
    </>
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
                  className="hover:bg-primary/10 data-[active=true]:bg-primary/10"
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
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    tooltip="Panel de Control"
                    className="hover:bg-primary/10 data-[active=true]:bg-primary/10"
                  >
                    <Link href="/">
                      <Home className="h-5 w-5" />
                      <span>Panel de Control</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-3">
                Gestión
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Instructores"
                      className="hover:bg-primary/10 data-[active=true]:bg-primary/10"
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
                      className="hover:bg-primary/10 data-[active=true]:bg-primary/10"
                    >
                      <Link href="/clases">
                        <CalendarDays className="h-5 w-5" />
                        <span>Clases</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Horarios"
                      className="hover:bg-primary/10 data-[active=true]:bg-primary/10"
                    >
                      <Link href="/horarios">
                        <Clock className="h-5 w-5" />
                        <span>Horarios</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Disciplinas"
                      className="hover:bg-primary/10 data-[active=true]:bg-primary/10"
                    >
                      <Link href="/disciplinas">
                        <BookOpen className="h-5 w-5" />
                        <span>Disciplinas</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-3">
                Finanzas
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      tooltip="Pagos"
                      className="hover:bg-primary/10 data-[active=true]:bg-primary/10"
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
                      className="hover:bg-primary/10 data-[active=true]:bg-primary/10"
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
                      className="hover:bg-primary/10 data-[active=true]:bg-primary/10"
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
                <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-3">
                  Administración
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        asChild 
                        tooltip="Configuración"
                        className="hover:bg-primary/10 data-[active=true]:bg-primary/10"
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

      <SidebarFooter className="p-4 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              tooltip="Cerrar Sesión"
              className="hover:bg-destructive/10 text-destructive hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}