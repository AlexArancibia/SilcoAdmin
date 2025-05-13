"use client"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import type { Periodo } from "@/types/schema"

interface CalculateDialogProps {
  showCalculateDialog: boolean
  setShowCalculateDialog: (show: boolean) => void
  periodos: Periodo[]
  selectedPeriodoId: number | null
  setSelectedPeriodoId: (id: number | null) => void
  calcularPagosPeriodo: () => void
}

export function CalculateDialog({
  showCalculateDialog,
  setShowCalculateDialog,
  periodos,
  selectedPeriodoId,
  setSelectedPeriodoId,
  calcularPagosPeriodo,
}: CalculateDialogProps) {
  return (
    <AlertDialog open={showCalculateDialog} onOpenChange={setShowCalculateDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Calcular Pagos para Periodo</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción creará pagos para todos los instructores que no tengan pagos en el periodo seleccionado. Los
            montos se calcularán basados en las clases impartidas y las fórmulas de cada disciplina.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="periodo-calculo">Periodo para calcular pagos</Label>
            <Select
              value={selectedPeriodoId?.toString() || ""}
              onValueChange={(value) => setSelectedPeriodoId(Number(value))}
            >
              <SelectTrigger id="periodo-calculo" className="w-full mt-1">
                <SelectValue placeholder="Seleccionar periodo" />
              </SelectTrigger>
              <SelectContent>
                {periodos.map((periodo) => (
                  <SelectItem key={periodo.id} value={periodo.id.toString()}>
                    Periodo {periodo.numero} - {periodo.año}
                    {periodo.bonoCalculado ? " (Bono calculado)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted/20 p-3 rounded-md text-sm">
            <p className="font-medium">Nota importante:</p>
            <p className="mt-1">
              Este proceso solo calculará los pagos base. Para calcular bonos, utilice el botón "Calcular Bonos" en la
              barra de herramientas.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={calcularPagosPeriodo}>Calcular Pagos</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
