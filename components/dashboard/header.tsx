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
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-0 ", className)}>
      <div className="grid gap-1">
        <h2 className="heading-1">
          {heading}
        </h2>
        {text && <p className="text-small">{text}</p>}
      </div>
      {children}
    </div>
  )
}

