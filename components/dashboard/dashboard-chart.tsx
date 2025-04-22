import type { ReactNode } from "react"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface DashboardChartProps {
  title: string
  icon: ReactNode
  description?: string
  isLoading?: boolean
  emptyMessage?: string
  isEmpty?: boolean
  children: ReactNode
  footer?: ReactNode
}

export function DashboardChart({
  title,
  icon,
  description,
  isLoading = false,
  emptyMessage = "No hay datos disponibles",
  isEmpty = false,
  children,
  footer,
}: DashboardChartProps) {
  return (
    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-2 p-4">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="text-purple-500 dark:text-purple-400">{icon}</div>
          {title}
        </CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isEmpty ? (
          <div className="text-center py-6 text-muted-foreground text-sm">{emptyMessage}</div>
        ) : (
          <>
            <div className="h-[240px] w-full">{children}</div>
            {footer && <div className="mt-3">{footer}</div>}
          </>
        )}
      </CardContent>
    </Card>
  )
}
