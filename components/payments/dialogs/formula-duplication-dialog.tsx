"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"
import type { Periodo } from "@/types/schema"

interface FormulaDuplicationDialogProps {
  showDialog: boolean
  setShowDialog: (show: boolean) => void
  selectedPeriodoId: number | null
  periodoOrigen: Periodo | null
  isDuplicating: boolean
  handleDuplicateFormulas: () => Promise<void>
}

export function FormulaDuplicationDialog({
  showDialog,
  setShowDialog,
  selectedPeriodoId,
  periodoOrigen,
  isDuplicating,
  handleDuplicateFormulas,
}: FormulaDuplicationDialogProps) {
  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>No se encontraron fórmulas para este periodo</AlertDialogTitle>
          <AlertDialogDescription>
            No existen fórmulas de cálculo para el periodo seleccionado. Para poder calcular los pagos, es necesario
            tener fórmulas configuradas.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-4">
          {periodoOrigen ? (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-sm">
              <p className="font-medium text-amber-800">Duplicar fórmulas de otro periodo</p>
              <p className="mt-1 text-amber-700">
                Se pueden duplicar las fórmulas del periodo más cercano:
                <span className="font-medium">
                  {" "}
                  Periodo {periodoOrigen.numero} - {periodoOrigen.año}
                </span>
              </p>
              <p className="mt-2 text-amber-600 text-xs">
                Esta acción copiará todas las fórmulas de cálculo del periodo origen al periodo seleccionado.
              </p>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 p-3 rounded-md text-sm">
              <p className="font-medium text-red-800">No hay periodos con fórmulas</p>
              <p className="mt-1 text-red-700">
                No se encontraron periodos con fórmulas configuradas. Es necesario crear fórmulas manualmente.
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          {periodoOrigen && (
            <AlertDialogAction
              onClick={handleDuplicateFormulas}
              disabled={isDuplicating}
              className="flex items-center gap-2"
            >
              {isDuplicating && <Loader2 className="h-4 w-4 animate-spin" />}
              {isDuplicating ? "Duplicando..." : "Duplicar Fórmulas"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
