"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart3, Users, CalendarDays, DollarSign, FileSpreadsheet, Settings } from "lucide-react"

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  const routes = [
    {
      href: "/",
      label: "Panel de Control",
      icon: BarChart3,
      active: pathname === "/",
    },
    {
      href: "/instructores",
      label: "Instructores",
      icon: Users,
      active: pathname === "/instructores" || pathname.startsWith("/instructores/"),
    },
    {
      href: "/estudiantes",
      label: "Estudiantes",
      icon: Users,
      active: pathname === "/estudiantes" || pathname.startsWith("/estudiantes/"),
    },
    {
      href: "/clases",
      label: "Clases",
      icon: CalendarDays,
      active: pathname === "/clases" || pathname.startsWith("/clases/"),
    },
    {
      href: "/pagos",
      label: "Pagos",
      icon: DollarSign,
      active: pathname === "/pagos" || pathname.startsWith("/pagos/"),
    },
    {
      href: "/importar",
      label: "Importar Datos",
      icon: FileSpreadsheet,
      active: pathname === "/importar",
    },
    {
      href: "/configuracion",
      label: "Configuración",
      icon: Settings,
      active: pathname === "/configuracion",
    },
  ]

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)} {...props}>
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "flex items-center text-sm font-medium transition-colors hover:text-primary",
            route.active ? "text-primary" : "text-muted-foreground",
          )}
        >
          <route.icon className="mr-2 h-4 w-4" />
          {route.label}
        </Link>
      ))}
    </nav>
  )
}

