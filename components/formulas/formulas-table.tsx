"use client"

import { PlusCircle, Trash2, Settings, Calculator, Copy, Calendar, ChevronDown, Layers, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert,  AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

import type { FormulaDB } from "@/types/schema"
import { useState } from "react"

interface FormulasTableProps {
  formulas: FormulaDB[]
  disciplinas: any[]
  periodos: any[]
  onEditParameters: (formula: FormulaDB) => void
  onDeleteFormula: (formula: FormulaDB) => void
  onTestFormula: (formula: FormulaDB) => void
  onDuplicateFormula: (formula: FormulaDB) => void
  onCreateFormula: () => void
}

export function FormulasTable({
  formulas,
  disciplinas,
  periodos,
  onEditParameters,
  onDeleteFormula,
  onTestFormula,
  onDuplicateFormula,
  onCreateFormula,
}: FormulasTableProps) {
  // Track which periods are expanded (default all expanded)
  const [expandedPeriods, setExpandedPeriods] = useState<Record<number, boolean>>({})

  // Group formulas by period
  const formulasByPeriod = formulas.reduce(
    (acc, formula) => {
      const periodoId = formula.periodoId
      if (!acc[periodoId]) {
        acc[periodoId] = []
      }
      acc[periodoId].push(formula)
      return acc
    },
    {} as Record<number, FormulaDB[]>,
  )

  // Sort periods by newest first (assuming higher ID = newer period)
  const sortedPeriodIds = Object.keys(formulasByPeriod)
    .map(Number)
    .sort((a, b) => b - a)

  // Toggle period expansion
  const togglePeriod = (periodoId: number) => {
    setExpandedPeriods((prev) => ({
      ...prev,
      [periodoId]: !prev[periodoId],
    }))
  }

  // Check if a period is expanded
  const isPeriodExpanded = (periodoId: number) => {
    return expandedPeriods[periodoId] !== false // Default to expanded
  }

  return (
    <>
       
      <CardContent className="p-0">
        {formulas.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No hay fórmulas configuradas</AlertTitle>
            <AlertDescription>
              No se han creado fórmulas de cálculo. Haz clic en "Nueva Fórmula" para crear una.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {sortedPeriodIds.map((periodoId) => {
              const periodo = periodos.find((p) => p.id === periodoId)
              const formulasForPeriod = formulasByPeriod[periodoId]
              const isExpanded = isPeriodExpanded(periodoId)

              return (
                <div key={periodoId} className="rounded-lg border shadow-sm overflow-hidden transition-all">
                  <Collapsible open={isExpanded} onOpenChange={() => togglePeriod(periodoId)}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-medium text-primary">
                            {periodo ? `Periodo ${periodo.numero} - ${periodo.año}` : `Periodo ${periodoId}`}
                          </h3>
                          <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20">
                            {formulasForPeriod.length} fórmula{formulasForPeriod.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 text-primary transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 bg-card">
                        <div className="rounded-lg border overflow-hidden">
                          <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow>
                                <TableHead className="font-medium">Disciplina</TableHead>
                                <TableHead className="font-medium">Tarifas</TableHead>
                                <TableHead className="font-medium">Última Actualización</TableHead>
                                <TableHead className="text-right w-[180px] font-medium">Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {formulasForPeriod.map((formula) => {
                                const disciplina = disciplinas.find((d) => d.id === formula.disciplinaId)
                                const tarifasInstructor = formula.parametrosPago?.INSTRUCTOR?.tarifas || []

                                return (
                                  <TableRow key={formula.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        style={{
                                          backgroundColor: disciplina?.color ? `${disciplina.color}20` : undefined,
                                          borderColor: disciplina?.color ? `${disciplina.color}40` : undefined,
                                        }}
                                        className="font-medium"
                                      >
                                        {disciplina?.nombre || `Disciplina ${formula.disciplinaId}`}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {tarifasInstructor.length > 0 ? (
                                        <div className="flex items-center">
                                          <div className="w-4 h-4 rounded-full bg-green-500 mr-2 flex items-center justify-center">
                                            <span className="text-[10px] text-white font-bold">
                                              {tarifasInstructor.length}
                                            </span>
                                          </div>
                                          <span className="text-sm">
                                            {tarifasInstructor.length} nivel{tarifasInstructor.length !== 1 ? "es" : ""}{" "}
                                            de tarifa
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-sm text-muted-foreground flex items-center">
                                          <div className="w-4 h-4 rounded-full bg-amber-500 mr-2 flex items-center justify-center">
                                            <span className="text-[10px] text-white font-bold">0</span>
                                          </div>
                                          Sin tarifas configuradas
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center">
                                        <div className="w-2 h-2 rounded-full bg-primary/60 mr-2"></div>
                                        {new Date(formula.updatedAt!).toLocaleDateString()}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end space-x-1">
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onTestFormula(formula)}
                                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                              >
                                                <Calculator className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">Probar Fórmula</TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDuplicateFormula(formula)}
                                                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                              >
                                                <Copy className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">Duplicar Fórmula</TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEditParameters(formula)}
                                                className="h-8 w-8 hover:bg-amber-50 hover:text-amber-600"
                                              >
                                                <Settings className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">Editar Parámetros</TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDeleteFormula(formula)}
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">Eliminar</TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </>
  )
}
