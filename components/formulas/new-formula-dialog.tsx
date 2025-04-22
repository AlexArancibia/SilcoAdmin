"use client"

import { useState } from "react"
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

interface NewFormulaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  disciplinas: any[]
  periodos: any[]
  formulas: any[]
  fetchFormulaPorDisciplinaYPeriodo: (disciplinaId: number, periodoId: number) => Promise<any>
  onContinue: (open: boolean) => void
}

export function NewFormulaDialog({
  open,
  onOpenChange,
  disciplinas,
  periodos,
  formulas,
  fetchFormulaPorDisciplinaYPeriodo,
  onContinue,
}: NewFormulaDialogProps) {
  const [disciplinaSeleccionadaId, setDisciplinaSeleccionadaId] = useState<string>("")
  const [periodoSeleccionadoId, setPeriodoSeleccionadoId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  // Reset form when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setDisciplinaSeleccionadaId("")
      setPeriodoSeleccionadoId("")
    }
    onOpenChange(open)
  }

  // Get available disciplines (without formula for the selected period)
  const getDisciplinasDisponibles = () => {
    if (!periodoSeleccionadoId) return disciplinas

    const periodoId = Number(periodoSeleccionadoId)
    const disciplinasConFormula = formulas.filter((f) => f.periodoId === periodoId).map((f) => f.disciplinaId)

    return disciplinas.filter((d) => !disciplinasConFormula.includes(d.id))
  }

  const handleContinue = async () => {
    if (!disciplinaSeleccionadaId || !periodoSeleccionadoId) {
      toast({
        title: "Error",
        description: "Debes seleccionar una disciplina y un período",
        variant: "destructive",
      })
      return
    }

    const disciplinaId = Number(disciplinaSeleccionadaId)
    const periodoId = Number(periodoSeleccionadoId)

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

      // Continue to parameters dialog
      onContinue(true)
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error al verificar fórmula existente",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Fórmula</DialogTitle>
          <DialogDescription>Selecciona la disciplina y el período para la nueva fórmula de cálculo.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="periodo">Período</Label>
            <Select value={periodoSeleccionadoId} onValueChange={setPeriodoSeleccionadoId} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar período" />
              </SelectTrigger>
              <SelectContent>
                {periodos.map((periodo) => (
                  <SelectItem key={periodo.id} value={periodo.id.toString()}>
                    Periodo {periodo.numero} - {periodo.año}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="disciplina">Disciplina</Label>
            <Select
              value={disciplinaSeleccionadaId}
              onValueChange={setDisciplinaSeleccionadaId}
              disabled={!periodoSeleccionadoId || isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar disciplina" />
              </SelectTrigger>
              <SelectContent>
                {periodoSeleccionadoId ? (
                  getDisciplinasDisponibles().length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      Todas las disciplinas ya tienen fórmulas asignadas para este período
                    </div>
                  ) : (
                    getDisciplinasDisponibles().map((disciplina) => (
                      <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                        {disciplina.nombre}
                      </SelectItem>
                    ))
                  )
                ) : (
                  <div className="p-2 text-center text-sm text-muted-foreground">Selecciona un período primero</div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleContinue}
            disabled={
              !periodoSeleccionadoId ||
              !disciplinaSeleccionadaId ||
              isLoading ||
              getDisciplinasDisponibles().length === 0
            }
          >
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
