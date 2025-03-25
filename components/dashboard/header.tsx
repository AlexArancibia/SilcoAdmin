import type React from "react"
import { cn } from "@/lib/utils"

interface DashboardHeaderProps {
  heading: string
  text?: string
  children?: React.ReactNode
  className?: string
}

export function DashboardHeader({ heading, text, children, className }: DashboardHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-0 mb-6", className)}>
      <div className="grid gap-1">
        <h1 className="font-heading text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text">
          {heading}
        </h1>
        {text && <p className="text-base text-muted-foreground">{text}</p>}
      </div>
      {children}
    </div>
  )
}

