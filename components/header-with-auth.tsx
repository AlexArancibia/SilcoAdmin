"use client"

import { useAuthStore } from "@/store/useAuthStore"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { UserInfo } from "@/components/ui/user-info"

export function HeaderWithAuth() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  // No renderizar el header si no hay usuario autenticado
  if (!isAuthenticated) {
    return null
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 bg-background/95 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="hover:bg-primary/10 hover:text-primary transition-colors" />
        <Separator orientation="vertical" className="h-4 mr-2" />
        {/* <CurrentPeriodDisplay /> */}
      </div>
      <div className="flex items-center gap-4">
        <UserInfo />
      </div>
    </header>
  )
}
