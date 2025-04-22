"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Edit, Loader2, X, Calendar, Users, Percent } from "lucide-react"
import type { Instructor, PagoInstructor, Periodo, TipoReajuste, Disciplina, EstadoPago, Clase } from "@/types/schema"
import { retencionValor } from "@/utils/const"

// Modificar la interfaz PaymentDetailsProps para tipar correctamente clasesInstructor
interface PaymentDetailsProps {
  pagoSeleccionado: PagoInstructor
  instructor: Instructor
  periodo: Periodo
  disciplinas: Disciplina[]
  editandoReajuste: boolean
  setEditandoReajuste: (value: boolean) => void
  nuevoReajuste: number
  setNuevoReajuste: (value: number) => void
  tipoReajuste: TipoReajuste
  setTipoReajuste: (value: TipoReajuste) => void
  isActualizandoReajuste: boolean
  actualizarReajuste: () => void
  formatCurrency: (amount: number) => string
  montoFinalCalculado: number
  ocupacionPromedio: number
  clasesInstructor?: Clase[] // Especificar que es un array de Clase
  totalReservas?: number
  totalCapacidad?: number
}

export function PaymentDetails({
  pagoSeleccionado,
  instructor,
  periodo,
  disciplinas,
  editandoReajuste,
  setEditandoReajuste,
  nuevoReajuste,
  setNuevoReajuste,
  tipoReajuste,
  setTipoReajuste,
  isActualizandoReajuste,
  actualizarReajuste,
  formatCurrency,
  montoFinalCalculado,
  ocupacionPromedio,
  clasesInstructor = [],
  totalReservas = 0,
  totalCapacidad = 0,
}: PaymentDetailsProps) {
  // Modificar la función que agrupa las clases por disciplina para usar tipado correcto
  const clasesPorDisciplina = clasesInstructor.reduce<Record<number, Clase[]>>((acc, clase) => {
    const disciplinaId = clase.disciplinaId
    if (!acc[disciplinaId]) {
      acc[disciplinaId] = []
    }
    acc[disciplinaId].push(clase)
    return acc
  }, {})

  // Calcular estadísticas por disciplina
  const estadisticasPorDisciplina = Object.entries(clasesPorDisciplina)
    .map(([disciplinaId, clases]) => {
      const disciplina = disciplinas.find((d) => d.id === Number(disciplinaId))
      const reservas = clases.reduce((sum, c) => sum + c.reservasTotales, 0)
      const capacidad = clases.reduce((sum, c) => sum + c.lugares, 0)
      const ocupacion = capacidad > 0 ? Math.round((reservas / capacidad) * 100) : 0

      // Buscar detalles de pago para esta disciplina
      const detallesDisciplina =
        pagoSeleccionado.detalles?.clases
          .filter((c: { disciplinaId: number }) => c.disciplinaId === Number(disciplinaId))
          .reduce((sum: any, c: { montoCalculado: any }) => sum + c.montoCalculado, 0) || 0

      return {
        disciplinaId: Number(disciplinaId),
        nombre: disciplina?.nombre || `Disciplina ${disciplinaId}`,
        color: disciplina?.color || "#6366F1",
        clases: clases.length,
        reservas,
        capacidad,
        ocupacion,
        monto: detallesDisciplina,
      }
    })
    .sort((a, b) => b.monto - a.monto) // Ordenar por monto de mayor a menor

  const getEstadoColor = (estado: EstadoPago): string => {
    switch (estado) {
      case "APROBADO":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }
  return (
    <div className="space-y-6">
      {/* Sección de información general */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center">
            <h3 className="text-lg font-medium text-foreground">Información General</h3>
            <div className="ml-2 px-2 py-0.5 bg-primary/10 rounded text-xs font-medium text-primary">
              ID: {pagoSeleccionado.id}
            </div>
          </div>
          <Separator className="my-2 bg-border" />

          <div className="grid grid-cols-1 gap-3 bg-muted/10 p-4 rounded-lg border">
            <div className="flex justify-between items-center py-1 border-b border-dashed">
              <div className="text-sm font-medium text-muted-foreground">Instructor:</div>
              <div className="font-medium text-foreground">{instructor.nombre}</div>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-dashed">
              <div className="text-sm font-medium text-muted-foreground">Periodo:</div>
              <div>
                <span className="px-2 py-0.5 bg-primary/10 rounded-full text-xs font-medium text-primary">
                  {periodo.numero} - {periodo.año}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-dashed">
              <div className="text-sm font-medium text-muted-foreground">Estado:</div>
              <Badge variant="outline" className={getEstadoColor(pagoSeleccionado.estado)}>
                {pagoSeleccionado.estado}
              </Badge>
            </div>

            <div className="mt-2 pt-2 border-t">
              <div className="text-sm font-medium mb-2 text-muted-foreground">Desglose del Pago:</div>
              <div className="space-y-2 bg-card p-3 rounded-md shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">Monto Base:</div>
                  <div className="font-medium text-foreground">{formatCurrency(pagoSeleccionado.monto)}</div>
                </div>

                {pagoSeleccionado.bono !== null && pagoSeleccionado.bono !== undefined && pagoSeleccionado.bono > 0 && (
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">Bono:</div>
                    <div className="text-emerald-600 font-medium">+{formatCurrency(pagoSeleccionado.bono)}</div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">Reajuste:</div>
                  {editandoReajuste ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={nuevoReajuste}
                          onChange={(e) => setNuevoReajuste(Number(e.target.value))}
                          className="w-24 h-8 px-2 border rounded text-right focus:outline-none focus:ring-primary focus:border-primary"
                          step="0.01"
                        />
                        <div className="flex items-center">
                          {isActualizandoReajuste ? (
                            <div className="flex items-center justify-center w-8 h-8">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            </div>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 py-0 border hover:bg-muted/10 hover:text-foreground"
                                onClick={actualizarReajuste}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 py-0 hover:bg-muted/10"
                                onClick={() => setEditandoReajuste(false)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <RadioGroup
                        value={tipoReajuste}
                        onValueChange={(value) => setTipoReajuste(value as TipoReajuste)}
                        className="flex space-x-2"
                      >
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="FIJO" id="fijo" className="h-4 w-4" />
                          <Label htmlFor="fijo" className="text-xs text-muted-foreground">
                            Fijo
                          </Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="PORCENTAJE" id="porcentaje" className="h-4 w-4" />
                          <Label htmlFor="porcentaje" className="text-xs text-muted-foreground">
                            Porcentaje
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div
                        className={
                          pagoSeleccionado.reajuste >= 0 ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"
                        }
                      >
                        {pagoSeleccionado.tipoReajuste === "PORCENTAJE"
                          ? `${pagoSeleccionado.reajuste >= 0 ? "+" : ""}${pagoSeleccionado.reajuste}%`
                          : `${pagoSeleccionado.reajuste >= 0 ? "+" : ""}${formatCurrency(pagoSeleccionado.reajuste)}`}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:bg-muted/10"
                        onClick={() => {
                          setNuevoReajuste(pagoSeleccionado.reajuste)
                          setTipoReajuste(pagoSeleccionado.tipoReajuste)
                          setEditandoReajuste(true)
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Subtotal (suma de monto base + bono + reajuste) */}
                <div className="flex justify-between items-center pt-1 border-t border-dashed">
                  <div className="text-sm font-medium text-muted-foreground">Subtotal:</div>
                  <div className="font-medium text-foreground">
                    {formatCurrency(
                      pagoSeleccionado.monto +
                        (pagoSeleccionado.bono !== null &&
                        pagoSeleccionado.bono !== undefined &&
                        pagoSeleccionado.bono > 0
                          ? pagoSeleccionado.bono
                          : 0) +
                        (pagoSeleccionado.tipoReajuste === "PORCENTAJE"
                          ? pagoSeleccionado.monto * (pagoSeleccionado.reajuste / 100)
                          : pagoSeleccionado.reajuste),
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">Retención:</div>
                  <div className="text-rose-600 font-medium">-{formatCurrency(pagoSeleccionado.retencion)}</div>
                </div>

                <Separator className="my-1 bg-border" />

                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-muted-foreground">Monto Final:</div>
                  <div className="font-bold text-lg text-primary">{formatCurrency(montoFinalCalculado)}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center py-1 text-xs text-muted-foreground mt-2">
              <div>Creado: {new Date(pagoSeleccionado.createdAt!).toLocaleDateString()}</div>
              <div>
                Actualizado:{" "}
                {pagoSeleccionado.updatedAt ? new Date(pagoSeleccionado.updatedAt).toLocaleDateString() : "-"}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-foreground">Resumen del Cálculo</h3>
            <Separator className="my-2 bg-border" />
          </div>

          <div className="grid grid-cols-1 gap-3 bg-muted/10 p-4 rounded-lg border">
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-primary" />
                <span className="font-medium text-muted-foreground">Total de Clases:</span>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {pagoSeleccionado.detalles?.resumen?.totalClases || clasesInstructor.length}
              </Badge>
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-primary" />
                <span className="font-medium text-muted-foreground">Ocupación Promedio:</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-24 h-3 bg-border rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                      ocupacionPromedio >= 80
                        ? "bg-emerald-500"
                        : ocupacionPromedio >= 50
                          ? "bg-amber-500"
                          : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(ocupacionPromedio, 100)}%` }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-white">
                      {ocupacionPromedio}%
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`${
                    ocupacionPromedio >= 80
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : ocupacionPromedio >= 50
                        ? "bg-amber-50 text-amber-600 border-amber-200"
                        : "bg-rose-50 text-rose-600 border-rose-200"
                  }`}
                >
                  {ocupacionPromedio}%
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-primary" />
                <span className="font-medium text-muted-foreground">Total Reservas:</span>
              </div>
              <div className="font-medium text-foreground">
                {totalReservas} / {totalCapacidad}
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center">
                <Percent className="h-4 w-4 mr-2 text-primary" />
                <span className="font-medium text-muted-foreground">Tipo de Reajuste:</span>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {pagoSeleccionado.tipoReajuste}
              </Badge>
            </div>

            <div className="mt-2">
              <div className="text-sm font-medium mb-2 text-muted-foreground">Comentarios:</div>
              <div className="text-sm bg-card p-3 rounded-md shadow-sm text-muted-foreground">
                {pagoSeleccionado.detalles?.resumen?.comentarios || "Sin comentarios"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de desglose por disciplina */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-foreground mb-4">Desglose por Disciplina</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {estadisticasPorDisciplina.map((disciplina) => (
            <Card key={disciplina.disciplinaId} className="border overflow-hidden">
              <CardHeader className="bg-muted/10 border-b pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: disciplina.color }}></div>
                    <CardTitle className="text-base font-medium">{disciplina.nombre}</CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    {disciplina.clases} clases
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Ocupación</span>
                    <div className="flex items-center mt-1">
                      <div className="relative w-16 h-2 bg-border rounded-full overflow-hidden mr-2">
                        <div
                          className={`absolute top-0 left-0 h-full rounded-full ${
                            disciplina.ocupacion >= 80
                              ? "bg-emerald-500"
                              : disciplina.ocupacion >= 50
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          }`}
                          style={{ width: `${Math.min(disciplina.ocupacion, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{disciplina.ocupacion}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Reservas</span>
                    <span className="text-sm font-medium mt-1">
                      {disciplina.reservas} / {disciplina.capacidad}
                    </span>
                  </div>
                  <div className="flex flex-col col-span-2">
                    <span className="text-xs text-muted-foreground">Monto (con retención)</span>
                    <div>
                      <span className="text-base font-bold text-primary">
                        {formatCurrency(disciplina.monto * (1 - retencionValor))}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        (Bruto: {formatCurrency(disciplina.monto)})
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
