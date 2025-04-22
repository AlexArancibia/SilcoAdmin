"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

interface DeleteFormulaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formula: any
  isSaving: boolean
  setIsSaving: (isSaving: boolean) => void
  eliminarFormula: (id: number) => Promise<void>
  fetchFormulas: () => Promise<void>
  seleccionarFormula: (formula: any) => void
}

export function DeleteFormulaDialog({
  open,
  onOpenChange,
  formula,
  isSaving,
  setIsSaving,
  eliminarFormula,
  fetchFormulas,
  seleccionarFormula,
}: DeleteFormulaDialogProps) {
  const confirmDelete = async () => {
    if (!formula) return

    setIsSaving(true)
    try {
      await eliminarFormula(formula.id)

      toast({
        title: "Fórmula eliminada",
        description: `La fórmula para ${formula.disciplina?.nombre || "la disciplina seleccionada"} ha sido eliminada.`,
      })

      fetchFormulas()
    } catch (error) {
      toast({
        title: "Error al eliminar",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
      onOpenChange(false)
      seleccionarFormula(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar eliminación</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar la fórmula para {formula?.disciplina?.nombre}?
            <br />
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirmDelete} disabled={isSaving}>
            {isSaving ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
