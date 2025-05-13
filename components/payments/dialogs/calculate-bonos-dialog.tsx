"use client"
import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Periodo } from "@/types/schema"

interface CalculateBonosDialogProps {
  showCalculateBonosDialog: boolean
  setShowCalculateBonosDialog: (show: boolean) => void
  periodos: Periodo[]
  selectedPeriodoId: number | null
  setSelectedPeriodoId: (id: number | null) => void
  calcularBonosPeriodo: () => void
  periodosSeleccionadosParaBono?: number[]
  setPeriodosSeleccionadosParaBono?: (periodos: number[]) => void
  verificarBonoCalculado?: (periodoId: number) => boolean
  obtenerPeriodosDisponiblesParaBono?: () => Periodo[]
  togglePeriodoParaBono?: (periodoId: number) => void
}

export function CalculateBonosDialog({
  showCalculateBonosDialog,
  setShowCalculateBonosDialog,
  periodos,
  selectedPeriodoId,
  setSelectedPeriodoId,
  calcularBonosPeriodo,
  periodosSeleccionadosParaBono = [],
  setPeriodosSeleccionadosParaBono = () => {},
  verificarBonoCalculado = () => false,
  obtenerPeriodosDisponiblesParaBono = () => [],
  togglePeriodoParaBono = () => {},
}: CalculateBonosDialogProps) {
  const [periodosDisponibles, setPeriodosDisponibles] = useState<Periodo[]>([])
  const [mostrarPeriodosAdicionales, setMostrarPeriodosAdicionales] = useState<boolean>(false)

  // Cargar periodos disponibles cuando se abre el diálogo
  useEffect(() => {
    if (showCalculateBonosDialog) {
      const disponibles = obtenerPeriodosDisponiblesParaBono()
      setPeriodosDisponibles(disponibles)

      // Si hay un periodo seleccionado, añadirlo a la lista de periodos para bono
      if (selectedPeriodoId && !periodosSeleccionadosParaBono.includes(selectedPeriodoId)) {
        setPeriodosSeleccionadosParaBono([selectedPeriodoId])
      }
    }
  }, [showCalculateBonosDialog, selectedPeriodoId, obtenerPeriodosDisponiblesParaBono])

  // Función para manejar el cambio del periodo principal
  const handlePeriodoChange = (value: string) => {
    const periodoId = Number(value)
    setSelectedPeriodoId(periodoId)

    // Actualizar la lista de periodos seleccionados para bono
    if (!periodosSeleccionadosParaBono.includes(periodoId)) {
      setPeriodosSeleccionadosParaBono([
        ...periodosSeleccionadosParaBono.filter((id) => id !== selectedPeriodoId),
        periodoId,
      ])
    }
  }

  // Función para manejar el cálculo de bonos
  const handleCalcularBonos = () => {
    calcularBonosPeriodo()
    setShowCalculateBonosDialog(false)
  }

  return (
    <AlertDialog open={showCalculateBonosDialog} onOpenChange={setShowCalculateBonosDialog}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Calcular Bonos para Periodo</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción calculará los bonos para todos los instructores en los periodos seleccionados. Los bonos se
            calcularán basados en las categorías de los instructores y su desempeño.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="periodo-bonos">Periodo principal para calcular bonos</Label>
            <Select value={selectedPeriodoId?.toString() || ""} onValueChange={handlePeriodoChange}>
              <SelectTrigger id="periodo-bonos" className="w-full mt-1">
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

          {selectedPeriodoId && (
            <div className="bg-muted/20 p-3 rounded-md text-sm">
              <p className="font-medium">Información de bonos:</p>
              {verificarBonoCalculado(selectedPeriodoId) ? (
                <p className="text-amber-600 mt-1">
                  ⚠️ Ya se han calculado bonos para este periodo. Calcular nuevamente actualizará los valores existentes.
                </p>
              ) : (
                <p className="text-green-600 mt-1">✓ Este periodo no tiene bonos calculados</p>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="mostrar-periodos-adicionales"
              checked={mostrarPeriodosAdicionales}
              onCheckedChange={(checked) => setMostrarPeriodosAdicionales(!!checked)}
            />
            <Label htmlFor="mostrar-periodos-adicionales" className="cursor-pointer">
              Añadir periodos adicionales para cálculo de bonos
            </Label>
          </div>

          {mostrarPeriodosAdicionales && (
            <div className="border rounded-md p-3">
              <Label className="mb-2 block">Selecciona periodos adicionales:</Label>
              <ScrollArea className="h-40 w-full">
                <div className="space-y-2">
                  {periodos
                    .filter((p) => p.id !== selectedPeriodoId)
                    .map((periodo) => (
                      <div key={periodo.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`periodo-${periodo.id}`}
                          checked={periodosSeleccionadosParaBono.includes(periodo.id)}
                          onCheckedChange={() => togglePeriodoParaBono(periodo.id)}
                          disabled={periodo.bonoCalculado}
                        />
                        <Label htmlFor={`periodo-${periodo.id}`} className="cursor-pointer flex items-center">
                          Periodo {periodo.numero} - {periodo.año}
                          {periodo.bonoCalculado && (
                            <Badge variant="outline" className="ml-2">
                              Bono calculado
                            </Badge>
                          )}
                        </Label>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {periodosSeleccionadosParaBono.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
              <p className="font-medium">Periodos seleccionados para cálculo de bonos:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {periodosSeleccionadosParaBono.map((periodoId) => {
                  const periodo = periodos.find((p) => p.id === periodoId)
                  return periodo ? (
                    <Badge key={periodoId} variant="secondary" className="flex items-center gap-1">
                      {periodo.numero}-{periodo.año}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 rounded-full"
                        onClick={() => togglePeriodoParaBono(periodoId)}
                      >
                        ×
                      </Button>
                    </Badge>
                  ) : null
                })}
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleCalcularBonos} disabled={periodosSeleccionadosParaBono.length === 0}>
            Calcular Bonos
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
