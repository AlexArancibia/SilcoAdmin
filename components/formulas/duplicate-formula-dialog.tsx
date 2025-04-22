"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DuplicateFormulaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formula: any
  periodos: any[]
  formulas: any[]
  fetchFormulaPorDisciplinaYPeriodo: (disciplinaId: number, periodoId: number) => Promise<any>
  crearFormula: (formula: any) => Promise<any>
  fetchFormulas: () => Promise<void>
  seleccionarFormula: (formula: any) => void
}

export function DuplicateFormulaDialog({
  open,
  onOpenChange,
  formula,
  periodos,
  formulas,
  fetchFormulaPorDisciplinaYPeriodo,
  crearFormula,
  fetchFormulas,
  seleccionarFormula,
}: DuplicateFormulaDialogProps) {
  const [periodoDestinoId, setPeriodoDestinoId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setPeriodoDestinoId("")
    }
  }, [open])

  // Get available periods (without formula for the selected discipline)
  const getPeriodosDisponibles = () => {
    if (!formula) return periodos

    const disciplinaId = formula.disciplinaId
    const periodosConFormula = formulas.filter((f) => f.disciplinaId === disciplinaId).map((f) => f.periodoId)

    return periodos.filter((p) => !periodosConFormula.includes(p.id))
  }

  const handleDuplicate = async () => {
    if (!formula || !periodoDestinoId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un período de destino",
        variant: "destructive",
      })
      return
    }

    const disciplinaId = formula.disciplinaId
    const periodoId = Number(periodoDestinoId)

    setIsLoading(true)

    try {
      // Check if formula already exists
      const existeFormula = await fetchFormulaPorDisciplinaYPeriodo(disciplinaId, periodoId)

      if (existeFormula) {
        toast({
          title: "Error",
          description: "Ya existe una fórmula para esta disciplina y período",
          variant: "destructive",
        })
        return
      }

      // Create new formula with data from the original
      const nuevaFormula = {
        disciplinaId,
        periodoId,
        requisitosCategoria: formula.requisitosCategoria,
        parametrosPago: formula.parametrosPago,
      }

      await crearFormula(nuevaFormula)
      await fetchFormulas()

      toast({
        title: "Fórmula duplicada",
        description: "La fórmula ha sido duplicada exitosamente al período seleccionado.",
      })

      onOpenChange(false)
      seleccionarFormula(null)
    } catch (error) {
      toast({
        title: "Error al duplicar fórmula",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const periodoOrigen = formula ? periodos.find((p) => p.id === formula.periodoId) : null
  const disciplina = formula ? formula.disciplina : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicar Fórmula</DialogTitle>
          <DialogDescription>
            Duplica la fórmula de cálculo a otro período manteniendo todos los parámetros.
          </DialogDescription>
        </DialogHeader>

        {formula && (
          <div className="grid gap-4 py-4">
            <Alert className="bg-primary/10 border-primary/20">
              <AlertTitle className="text-primary">Información de la fórmula a duplicar</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1">
                  <p>
                    <span className="font-medium">Disciplina:</span>{" "}
                    {disciplina?.nombre || `Disciplina ${formula.disciplinaId}`}
                  </p>
                  <p>
                    <span className="font-medium">Período origen:</span>{" "}
                    {periodoOrigen ? `${periodoOrigen.numero}/${periodoOrigen.año}` : `Periodo ${formula.periodoId}`}
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="grid gap-2">
              <Label htmlFor="periodoDestino">Período de destino</Label>
              <Select value={periodoDestinoId} onValueChange={setPeriodoDestinoId} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar período de destino" />
                </SelectTrigger>
                <SelectContent>
                  {getPeriodosDisponibles().length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      No hay períodos disponibles para duplicar esta fórmula
                    </div>
                  ) : (
                    getPeriodosDisponibles().map((periodo) => (
                      <SelectItem key={periodo.id} value={periodo.id.toString()}>
                        Periodo {periodo.numero} - {periodo.año}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleDuplicate}
            disabled={!periodoDestinoId || isLoading || getPeriodosDisponibles().length === 0}
          >
            Duplicar Fórmula
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
