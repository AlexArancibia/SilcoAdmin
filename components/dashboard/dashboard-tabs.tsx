"use client"

import type { ReactNode } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import React from "react"

interface DashboardTabsProps {
  activeTab: string
  onTabChange: (value: string) => void
  children: ReactNode | ReactNode[]
}

export function DashboardTabs({ activeTab, onTabChange, children }: DashboardTabsProps) {
  const childrenArray = React.Children.toArray(children) as ReactNode[]

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="tabs space-y-6">
      <TabsList className="tabs-list grid grid-cols-3 w-full mb-4 bg-muted/30 p-1 rounded-lg">
        <TabsTrigger
          value="general"
          className="tab-trigger text-accent data-[state=active]:bg-background dark:data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md transition-all"
        >
          General
        </TabsTrigger>
 
        <TabsTrigger
          value="salon"
          className="tab-trigger text-accent data-[state=active]:bg-background dark:data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md transition-all"
        >
          Salón
        </TabsTrigger>
        <TabsTrigger
          value="pagos"
          className="tab-trigger text-accent data-[state=active]:bg-background dark:data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md transition-all"
        >
          Pagos
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="tab-content space-y-6 animate-fade-in">
        {childrenArray[0]}
      </TabsContent>
 
      <TabsContent value="salon" className="tab-content space-y-6 animate-fade-in">
        {childrenArray[2]}
      </TabsContent>
      <TabsContent value="pagos" className="tab-content space-y-6 animate-fade-in">
        {childrenArray[3]}
      </TabsContent>
    </Tabs>
  )
}
