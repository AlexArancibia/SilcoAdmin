import type { ReactNode } from "react"

interface StatCardProps {
  icon: ReactNode
  title: string
  value: string | number
  description: string
  color?: string
  secondaryIcon?: ReactNode
}

export function StatCard({ icon, title, value, description, color = "text-primary", secondaryIcon }: StatCardProps) {
  return (
    <div className="card p-4 border shadow-sm hover:shadow-md transition-all">
      <div className={`size-10 rounded-full bg-primary/10 flex-center ${color}`}>{icon}</div>
      <div className="mt-2">
        <p className="text-sm text-accent">{title}</p>
        <p className="text-xl font-bold">{value}</p>
        <div className="flex items-center gap-1 mt-0.5">
          {secondaryIcon && <div className="mr-1">{secondaryIcon}</div>}
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  )
}
