"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ArrowRight, BookOpen, Loader2 } from "lucide-react"
import type { Disciplina } from "@/types/schema"

interface DisciplineValidationProps {
  disciplineAnalysis: {
    total: number
    existing: number
    new: number
    disciplines: Array<{
      name: string
      exists: boolean
      count: number
      mappedTo?: string
      matchedDiscipline?: Disciplina
    }>
  }
  handleDisciplineMapping: (originalName: string, mappedName: string) => void
  isLoadingDisciplinas: boolean
  setCurrentStep: (step: number) => void
}

export function DisciplineValidation({
  disciplineAnalysis,
  handleDisciplineMapping,
  isLoadingDisciplinas,
  setCurrentStep,
}: DisciplineValidationProps) {
  if (isLoadingDisciplinas) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Cargando disciplinas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6 border shadow-sm">
        <h3 className="text-lg font-medium text-primary mb-4">Validación de Disciplinas</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-background p-5 rounded-lg border shadow-sm">
            <div className="text-sm text-muted-foreground mb-1">Total de Disciplinas</div>
            <div className="text-2xl font-bold text-primary">{disciplineAnalysis.total}</div>
          </div>
          <div className="bg-background p-5 rounded-lg border shadow-sm">
            <div className="text-sm text-muted-foreground mb-1">Disciplinas Existentes</div>
            <div className="text-2xl font-bold text-green-600">{disciplineAnalysis.existing}</div>
          </div>
          <div className="bg-background p-5 rounded-lg border shadow-sm">
            <div className="text-sm text-muted-foreground mb-1">Disciplinas Nuevas</div>
            <div className="text-2xl font-bold text-blue-600">{disciplineAnalysis.new}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-primary">Detalle de Disciplinas</h4>
            <div className="text-sm text-muted-foreground">
              Puedes mapear disciplinas nuevas a existentes o crearlas automáticamente
            </div>
          </div>

          <div className="bg-background rounded-lg border overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-primary">Disciplina</th>
                  <th className="text-left py-3 px-4 font-medium text-primary">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-primary">Clases</th>
                  <th className="text-left py-3 px-4 font-medium text-primary">Acción</th>
                </tr>
              </thead>
              <tbody>
                {disciplineAnalysis.disciplines.map((discipline, index) => (
                  <tr key={index} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium">
                      {discipline.name}
                      {discipline.mappedTo && (
                        <span className="text-primary ml-2 flex items-center gap-1 text-xs">
                          <ArrowRight className="h-3 w-3" />
                          <span className="font-medium">{discipline.mappedTo}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {discipline.exists ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 flex items-center w-fit px-2 py-0.5"
                        >
                          <BookOpen className="h-3 w-3 mr-1.5" />
                          Existente
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 flex items-center w-fit px-2 py-0.5"
                        >
                          <BookOpen className="h-3 w-3 mr-1.5" />
                          Nueva
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">{discipline.count}</td>
                    <td className="py-3 px-4">
                      {!discipline.exists && (
                        <Select onValueChange={(value) => handleDisciplineMapping(discipline.name, value)}>
                          <SelectTrigger className="h-9 w-[180px] border-muted">
                            <SelectValue placeholder="Mapear a..." />
                          </SelectTrigger>
                          <SelectContent>
                            {/* This would be populated with actual disciplines from the store */}
                            {/* disciplinas.map((d) => (
                              <SelectItem key={d.id} value={d.nombre}>
                                {d.nombre}
                              </SelectItem>
                            )) */}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setCurrentStep(2)} className="border-muted">
          <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
        </Button>
        <Button onClick={() => setCurrentStep(4)} className="bg-primary hover:bg-primary/90 transition-colors">
          Continuar <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
