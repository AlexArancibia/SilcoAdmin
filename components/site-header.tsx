"use client"

import { UserNav } from "@/components/user-nav"
import { PeriodSelector } from "@/components/period-selector"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Menu } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white shadow-sm">
      <div className="flex h-14 items-center justify-between w-full px-4">
        <div className="flex items-center">
          <SidebarTrigger className="text-primary md:text-foreground hover:bg-primary/10 md:hover:bg-accent">
            <Menu className="h-5 w-5" />
          </SidebarTrigger>
        </div>
        <div className="flex items-center space-x-4">
          <PeriodSelector />
          <UserNav />
        </div>
      </div>
    </header>
  )
}

