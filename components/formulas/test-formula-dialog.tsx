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
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert,   AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Calculator } from "lucide-react"
import type { CategoriaInstructor } from "@/types/schema"

interface TestFormulaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formula: any
}

export function TestFormulaDialog({ open, onOpenChange, formula }: TestFormulaDialogProps) {
  const [testInstructorType, setTestInstructorType] = useState<CategoriaInstructor>("INSTRUCTOR")
  const [testClaseParams, setTestClaseParams] = useState({
    reservasTotales: 20,
    lugares: 50,
    listasEspera: 0,
    cortesias: 0,
    reservasPagadas: 20,
  })
  const [testResult, setTestResult] = useState<any>(null)

  // Reset test parameters when dialog opens/closes
  useEffect(() => {
    if (open) {
      setTestResult(null)
      setTestInstructorType("INSTRUCTOR")
      setTestClaseParams({
        reservasTotales: 20,
        lugares: 50,
        listasEspera: 0,
        cortesias: 0,
        reservasPagadas: 20,
      })
    }
  }, [open])

  // Handle test parameter changes
  const handleTestParamChange = (field: string, value: string) => {
    setTestClaseParams((prev) => ({
      ...prev,
      [field]: Number(value),
    }))
  }

  // Calculate test result
  const calculateTestResult = () => {
    if (!formula) return

    try {
      // Get payment parameters for the selected instructor type
      const parametros = formula.parametrosPago[testInstructorType]

      if (!parametros) {
        setTestResult({
          error: `No se encontraron parámetros para el tipo de instructor: ${testInstructorType}`,
        })
        return
      }

      // Get reservation count and capacity
      const reservaciones = testClaseParams.reservasTotales
      const capacidad = testClaseParams.lugares

      // Determine applicable tariff based on occupancy
      let tarifaAplicada = 0
      let tipoTarifa = ""

      // Check if it's full house
      const esFullHouse = reservaciones >= capacidad

      if (esFullHouse) {
        tarifaAplicada = parametros.tarifaFullHouse
        tipoTarifa = "Full House"
      } else {
        // Sort tariffs by reservation number (ascending)
        const tarifasOrdenadas = [...parametros.tarifas].sort((a, b) => a.numeroReservas - b.numeroReservas)

        // Find applicable tariff
        let tarifaEncontrada = false
        for (const tarifa of tarifasOrdenadas) {
          if (reservaciones <= tarifa.numeroReservas) {
            tarifaAplicada = tarifa.tarifa
            tipoTarifa = `Hasta ${tarifa.numeroReservas} reservas`
            tarifaEncontrada = true
            break
          }
        }

        // If no applicable tariff found, use full house tariff
        if (!tarifaEncontrada) {
          tarifaAplicada = parametros.tarifaFullHouse
          tipoTarifa = "Full House (por defecto)"
        }
      }

      // Calculate base amount: tariff * reservations
      let montoPago = tarifaAplicada * reservaciones

      // Apply fixed quota if it exists
      if (parametros.cuotaFija && parametros.cuotaFija > 0) {
        montoPago += parametros.cuotaFija
      }

      // Bonus is calculated in another part of the system
      let bonoAplicado = 0
      if (parametros.bono && parametros.bono > 0) {
        bonoAplicado = parametros.bono * reservaciones
        // We don't add the bonus to montoPago as it's handled elsewhere
      }

      // Check if minimum guaranteed applies
      let minimoAplicado = false
      if (montoPago < parametros.minimoGarantizado && parametros.minimoGarantizado > 0) {
        minimoAplicado = true
        montoPago = parametros.minimoGarantizado
      }

      // Check if maximum applies
      let maximoAplicado = false
      if (montoPago > parametros.maximo) {
        maximoAplicado = true
        montoPago = parametros.maximo
      }

      // Generate calculation details
      let detalleCalculo = `${reservaciones} reservas × S/.${tarifaAplicada.toFixed(2)} = S/.${(reservaciones * tarifaAplicada).toFixed(2)}`

      if (parametros.cuotaFija && parametros.cuotaFija > 0) {
        detalleCalculo += `\nCuota fija: +S/.${parametros.cuotaFija.toFixed(2)}`
        detalleCalculo += `\nSubtotal con cuota fija: S/.${(reservaciones * tarifaAplicada + parametros.cuotaFija).toFixed(2)}`
      }

      if (minimoAplicado) {
        detalleCalculo += `\nSe aplicó el mínimo garantizado: S/.${parametros.minimoGarantizado.toFixed(2)}`
      }

      if (maximoAplicado) {
        detalleCalculo += `\nSe aplicó el máximo: S/.${parametros.maximo.toFixed(2)}`
      }

      setTestResult({
        montoPago,
        tarifaAplicada,
        tipoTarifa,
        minimoAplicado,
        maximoAplicado,
        bonoAplicado: bonoAplicado > 0 ? bonoAplicado : undefined,
        detalleCalculo,
      })
    } catch (error) {
      setTestResult({
        error: error instanceof Error ? error.message : "Error desconocido al calcular el pago",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Probar Fórmula</DialogTitle>
          <DialogDescription>
            Prueba la fórmula con diferentes parámetros para ver el resultado del cálculo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="test-instructor-type">Tipo de Instructor</Label>
              <Select
                value={testInstructorType}
                onValueChange={(value) => setTestInstructorType(value as CategoriaInstructor)}
              >
                <SelectTrigger id="test-instructor-type">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                  <SelectItem value="EMBAJADOR_JUNIOR">Embajador Junior</SelectItem>
                  <SelectItem value="EMBAJADOR">Embajador</SelectItem>
                  <SelectItem value="EMBAJADOR_SENIOR">Embajador Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Parámetros de la Clase</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parámetro</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Reservas Totales</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={testClaseParams.reservasTotales}
                      onChange={(e) => handleTestParamChange("reservasTotales", e.target.value)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    Número total de reservas para la clase
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Lugares</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={testClaseParams.lugares}
                      onChange={(e) => handleTestParamChange("lugares", e.target.value)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">Capacidad total de la clase</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Listas de Espera</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={testClaseParams.listasEspera}
                      onChange={(e) => handleTestParamChange("listasEspera", e.target.value)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">Número de personas en lista de espera</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Cortesías</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={testClaseParams.cortesias}
                      onChange={(e) => handleTestParamChange("cortesias", e.target.value)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">Número de cortesías otorgadas</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Reservas Pagadas</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={testClaseParams.reservasPagadas}
                      onChange={(e) => handleTestParamChange("reservasPagadas", e.target.value)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">Número de reservas pagadas</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {testResult && (
            <div className="mt-4 p-4 border rounded-md bg-muted/30">
              <h3 className="text-lg font-medium mb-2">Resultado del Cálculo</h3>
              {testResult.error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{testResult.error}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-xl font-bold">Pago: S/.{testResult.montoPago.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      Tarifa aplicada: {testResult.tipoTarifa} (S/.{testResult.tarifaAplicada.toFixed(2)})
                    </p>
                  </div>
                  <div className="text-sm whitespace-pre-line bg-background p-3 rounded border">
                    {testResult.detalleCalculo}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={calculateTestResult}>
            <Calculator className="mr-2 h-4 w-4" />
            Calcular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
