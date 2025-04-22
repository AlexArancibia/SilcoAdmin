import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Building, Calendar, Info, Users } from "lucide-react"
import type { CategoriaInstructor } from "@/types/schema"

interface InstructorCategoriesProps {
  getCategoriesByDiscipline: () => any[]
}

export function InstructorCategories({ getCategoriesByDiscipline }: InstructorCategoriesProps) {
  const formatCategoryName = (category: CategoriaInstructor) => {
    switch (category) {
      case "EMBAJADOR_SENIOR":
        return "Embajador Senior"
      case "EMBAJADOR":
        return "Embajador"
      case "EMBAJADOR_JUNIOR":
        return "Embajador Junior"
      case "INSTRUCTOR":
        return "Instructor"
      default:
        return category
    }
  }

  const getCategoryColor = (category: CategoriaInstructor) => {
    switch (category) {
      case "EMBAJADOR_SENIOR":
        return "text-purple-600"
      case "EMBAJADOR":
        return "text-blue-600"
      case "EMBAJADOR_JUNIOR":
        return "text-teal-600"
      case "INSTRUCTOR":
        return "text-gray-600"
      default:
        return "text-gray-600"
    }
  }

  const getCategoryBgColor = (category: CategoriaInstructor): string => {
    switch (category) {
      case "EMBAJADOR_SENIOR":
        return "border-border"
      case "EMBAJADOR":
        return "border-border"
      case "EMBAJADOR_JUNIOR":
        return "border-border"
      case "INSTRUCTOR":
        return "border-border"
      default:
        return "border-gray-200"
    }
  }

  return (
    <Card className="card border border-border shadow-sm">
      <CardHeader className="pb-2 px-4 pt-3">
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle className="flex items-center gap-1.5 text-lg">
              <BarChart3 className="h-4 w-4 text-primary" />
              Categorías y métricas
            </CardTitle>
            <CardDescription className="text-sm mt-0.5">Información por disciplina</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pt-2 pb-3">
        {getCategoriesByDiscipline().length === 0 ? (
          <div className="text-center py-4 text-muted">No hay métricas para el periodo seleccionado</div>
        ) : (
          <>
            <div className="space-y-3">
              {getCategoriesByDiscipline().map((categoria) => {
                const categoryColor = getCategoryColor(categoria.categoria)
                const disciplinaColor = categoria.disciplina?.color || "#6366f1"
                const bgColorClass = getCategoryBgColor(categoria.categoria)

                return (
                  <div key={`metrics-${categoria.id}`} className={`rounded-lg overflow-hidden border border-border ${bgColorClass}`}>
                    <div className="px-3 py-2 bg-card flex-between border-b">
                      <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full" style={{ backgroundColor: disciplinaColor }} />
                        <span className="font-medium text-sm">{categoria.disciplina?.nombre}</span>
                      </div>
               
                    </div>

                    <div className="p-3 bg-gradient-to-b from-card to-background">
                      <div className="grid grid-cols-3 gap-2">
                        <MetricCard
                          icon={<Calendar className="h-3.5 w-3.5 text-blue-500" />}
                          label="Clases"
                          value={categoria.metricas?.clases || 0}
                        />

                        <MetricCard
                          icon={<Users className="h-3.5 w-3.5 text-green-500" />}
                          label="Ocupación"
                          value={`${Math.round(categoria.metricas?.ocupacion || 0)}%`}
                        />

                        <MetricCard
                          icon={<Building className="h-3.5 w-3.5 text-purple-500" />}
                          label="Locales en Lima"
                          value={categoria.metricas?.localesEnLima || 0}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-3 p-2.5 bg-blue-50 dark:bg-slate-950 border border-border rounded-md flex items-start gap-1.5">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                La recategorización de instructores se realiza al finalizar cada periodo.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Componente de métrica con diseño de tarjeta
function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="card p-1.5 text-center border shadow-sm">
      <div className="flex-center mb-0.5">{icon}</div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}
