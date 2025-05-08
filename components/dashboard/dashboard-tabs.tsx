"use client"

import type React from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, LayoutDashboard } from "lucide-react"

interface DashboardTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  children: React.ReactNode
}

export function DashboardTabs({ activeTab, setActiveTab, children }: DashboardTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-6 w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
        <div className="flex border-b w-full">
          <TabsTrigger
            value="general"
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-4 font-medium"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard General</span>
          </TabsTrigger>
          <TabsTrigger
            value="estudios"
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-4 font-medium"
          >
            <Building className="h-4 w-4" />
            <span>Análisis por Estudio</span>
          </TabsTrigger>
        </div>
      </TabsList>
      {children}
    </Tabs>
  )
}
