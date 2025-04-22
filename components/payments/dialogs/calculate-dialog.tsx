"use client"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
  calcularBonoEnPeriodo: boolean
  setCalcularBonoEnPeriodo: (value: boolean) => void
  calcularPagosPeriodo: () => void
}

export function CalculateDialog({
  showCalculateDialog,
  setShowCalculateDialog,
  periodos,
  selectedPeriodoId,
  setSelectedPeriodoId,
  calcularBonoEnPeriodo,
  setCalcularBonoEnPeriodo,
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

          <div className="flex items-center space-x-2 pt-2">
            <Switch id="calcular-bono" checked={calcularBonoEnPeriodo} onCheckedChange={setCalcularBonoEnPeriodo} />
            <Label htmlFor="calcular-bono" className="cursor-pointer">
              Calcular bonos en este periodo
            </Label>
          </div>

          {selectedPeriodoId && (
            <div className="bg-muted/20 p-3 rounded-md text-sm">
              <p className="font-medium">Información de bonos:</p>
              {periodos.find((p) => p.id === selectedPeriodoId)?.bonoCalculado ? (
                <p className="text-green-600 mt-1">✓ Ya se han calculado bonos para este periodo</p>
              ) : (
                <p className="text-amber-600 mt-1">⚠️ No se han calculado bonos para este periodo</p>
              )}
              <p className="mt-2 text-muted-foreground">
                Último periodo con bonos calculados:{" "}
                {periodos.filter((p) => p.bonoCalculado).sort((a, b) => b.id - a.id)[0]
                  ? `Periodo ${periodos.filter((p) => p.bonoCalculado).sort((a, b) => b.id - a.id)[0].numero} - ${periodos.filter((p) => p.bonoCalculado).sort((a, b) => b.id - a.id)[0].año}`
                  : "Ninguno"}
              </p>

              {/* Add information about accumulated bonuses */}
              {calcularBonoEnPeriodo && selectedPeriodoId && (
                <div className="mt-2 text-blue-600">
                  <p className="font-medium">Acumulación de bonos:</p>
                  <p className="text-xs mt-1">
                    Se incluirán bonos acumulados de periodos anteriores donde se calcularon pero no se pagaron.
                  </p>
                  {periodos.filter((p) => p.id < selectedPeriodoId && p.bonoCalculado === true).length > 0 ? (
                    <p className="text-xs mt-1">
                      Periodos con bonos pendientes:{" "}
                      {periodos
                        .filter((p) => p.id < selectedPeriodoId && p.bonoCalculado === true)
                        .map((p) => `${p.numero}-${p.año}`)
                        .join(", ")}
                    </p>
                  ) : (
                    <p className="text-xs mt-1">No hay bonos pendientes de periodos anteriores.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={calcularPagosPeriodo}>Calcular Pagos</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
