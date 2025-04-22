import type { ReactNode } from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface StatCardProps {
  title: string
  icon: ReactNode
  value: string | number
  subtitle?: string
  subtitleValue?: string | number
  badge?: string
  color?: "purple" | "indigo" | "blue" | "emerald" | "amber"
  footer?: ReactNode
}

export function StatCard({
  title,
  icon,
  value,
  subtitle,
  subtitleValue,
  badge,
  color = "purple",
  footer,
}: StatCardProps) {
  const colorClasses = {
    purple: {
      header: "from-purple-50/70 to-slate-50/70 dark:from-purple-950/20 dark:to-slate-950/20",
      iconBg: "bg-purple-100/80 dark:bg-purple-900/30",
      iconColor: "text-purple-500 dark:text-purple-400",
      badge:
        "bg-purple-50/50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:border-purple-800 dark:text-purple-400",
    },
    indigo: {
      header: "from-indigo-50/70 to-slate-50/70 dark:from-indigo-950/20 dark:to-slate-950/20",
      iconBg: "bg-indigo-100/80 dark:bg-indigo-900/30",
      iconColor: "text-indigo-500 dark:text-indigo-400",
      badge:
        "bg-indigo-50/50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-800 dark:text-indigo-400",
    },
    blue: {
      header: "from-blue-50/70 to-slate-50/70 dark:from-blue-950/20 dark:to-slate-950/20",
      iconBg: "bg-blue-100/80 dark:bg-blue-900/30",
      iconColor: "text-blue-500 dark:text-blue-400",
      badge: "bg-blue-50/50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-400",
    },
    emerald: {
      header: "from-emerald-50/70 to-slate-50/70 dark:from-emerald-950/20 dark:to-slate-950/20",
      iconBg: "bg-emerald-100/80 dark:bg-emerald-900/30",
      iconColor: "text-emerald-500 dark:text-emerald-400",
      badge:
        "bg-emerald-50/50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400",
    },
    amber: {
      header: "from-amber-50/70 to-slate-50/70 dark:from-amber-950/20 dark:to-slate-950/20",
      iconBg: "bg-amber-100/80 dark:bg-amber-900/30",
      iconColor: "text-amber-500 dark:text-amber-400",
      badge:
        "bg-amber-50/50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400",
    },
  }

  return (
    <Card className="card shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
      <CardHeader className={`pb-2 bg-gradient-to-br ${colorClasses[color].header} p-4`}>
        <div className="flex-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className={`flex-center size-7 rounded-full ${colorClasses[color].iconBg}`}>
              <div className={`h-4 w-4 ${colorClasses[color].iconColor}`}>{icon}</div>
            </div>
            <span>{title}</span>
          </CardTitle>
          {badge && (
            <Badge variant="outline" className={`badge badge-outline ${colorClasses[color].badge} text-[10px]`}>
              {badge}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-3">
        <div className="flex-between">
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && subtitleValue && (
            <div className="flex flex-col items-end">
              <div className="text-xs text-muted">{subtitle}</div>
              <div className="text-sm font-medium">{subtitleValue}</div>
            </div>
          )}
        </div>
        {footer && <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">{footer}</div>}
      </CardContent>
    </Card>
  )
}
