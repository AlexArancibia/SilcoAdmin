"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Edit, Loader2, X, BookOpen, CreditCard, Lock, AlertTriangle, CalendarCheck } from "lucide-react"
import type { Instructor, PagoInstructor, Periodo, TipoReajuste, Disciplina, EstadoPago, Clase, Cover } from "@/types/schema"
import { retencionValor } from "@/utils/const"
import { useAuthStore } from "@/store/useAuthStore"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CommentsSection } from "./comment-section"

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
  clasesInstructor?: Clase[]
  totalReservas?: number
  totalCapacidad?: number
  coversInstructor?: Cover[]
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
  coversInstructor = [],
}: PaymentDetailsProps) {
  const userType = useAuthStore((state) => state.userType)
  const isInstructor = userType === "instructor"

  // Agrupar clases por disciplina
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
      const montoBase =
        pagoSeleccionado.detalles?.clases
          ?.filter((c: { disciplinaId: number }) => c.disciplinaId === Number(disciplinaId))
          ?.reduce((sum: any, c: { montoCalculado: any }) => sum + c.montoCalculado, 0) || 0

      const retencion = montoBase * retencionValor
      const montoFinal = montoBase - retencion

      return {
        disciplinaId: Number(disciplinaId),
        nombre: disciplina?.nombre || `Disciplina ${disciplinaId}`,
        color: disciplina?.color || "#6366F1",
        clases: clases.length,
        reservas,
        capacidad,
        ocupacion,
        montoBase,
        retencion,
        montoFinal,
      }
    })
    .sort((a, b) => b.montoBase - a.montoBase)

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

  const getOcupacionColor = (ocupacion: number) => {
    if (ocupacion >= 80) return "bg-emerald-500"
    if (ocupacion >= 50) return "bg-amber-500"
    return "bg-rose-500"
  }

  const getOcupacionTextColor = (ocupacion: number) => {
    if (ocupacion >= 80) return "text-emerald-600"
    if (ocupacion >= 50) return "text-amber-600"
    return "text-rose-600"
  }

  // Calcular totales para el resumen
  const totalMontoBase = estadisticasPorDisciplina.reduce((sum, d) => sum + d.montoBase, 0)
  const totalRetencion = estadisticasPorDisciplina.reduce((sum, d) => sum + d.retencion, 0)
  const totalMontoFinal = estadisticasPorDisciplina.reduce((sum, d) => sum + d.montoFinal, 0)

  // Calcular el monto del reajuste
  const montoReajuste =
    pagoSeleccionado.tipoReajuste === "PORCENTAJE"
      ? totalMontoBase * (pagoSeleccionado.reajuste / 100)
      : pagoSeleccionado.reajuste

  // Calcular covers
  const coverTotal = pagoSeleccionado.cover || 0
  const totalCovers = coversInstructor.length

  // Calcular nuevos bonos
  const brandeoTotal = pagoSeleccionado.brandeo || 0
  const themeRideTotal = pagoSeleccionado.themeRide || 0
  const workshopTotal = pagoSeleccionado.workshop || 0

  // Calcular penalización
  const penalizacionTotal = pagoSeleccionado.penalizacion || 0
  const penalizacionPorcentaje = pagoSeleccionado.detalles?.penalizaciones?.porcentajeDescuento || 0
  const puntosPenalizacion = pagoSeleccionado.detalles?.penalizaciones?.totalPuntos || 0
  const maxPuntosPermitidos = pagoSeleccionado.detalles?.penalizaciones?.maxPuntosPermitidos || 0

  // Calcular subtotal y monto final con reajuste, bonos y covers
  const subtotal = totalMontoBase + montoReajuste + (pagoSeleccionado.bono ?? 0) + coverTotal + brandeoTotal + themeRideTotal + workshopTotal - penalizacionTotal

  // Total de clases
  const totalClases = pagoSeleccionado.detalles?.resumen?.totalClases || clasesInstructor.length

  return (
    <div className="space-y-4 px-2 sm:px-0">
      {/* CARD 1: Desglose por Disciplina - Versión responsive */}
      <Card className="border rounded-lg shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b gap-2 px-4 sm:px-6">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-base sm:text-lg font-medium">Desglose por Disciplina</CardTitle>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">
            {estadisticasPorDisciplina.length} disciplinas • {totalClases} clases • Ocupación:{" "}
            <span className={getOcupacionTextColor(ocupacionPromedio)}>{ocupacionPromedio}%</span>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-[600px]">
            <table className="w-full text-sm">
              <thead className="bg-muted/10">
                <tr>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground border-b text-xs sm:text-sm">Disciplina</th>
                  <th className="text-center py-3 px-3 font-medium text-muted-foreground border-b text-xs sm:text-sm">Clases</th>
                  <th className="text-center py-3 px-3 font-medium text-muted-foreground border-b text-xs sm:text-sm">Reservas</th>
                  <th className="text-center py-3 px-3 font-medium text-muted-foreground border-b text-xs sm:text-sm">Lugares</th>
                  <th className="text-center py-3 px-3 font-medium text-muted-foreground border-b text-xs sm:text-sm">Ocupación</th>
                  <th className="text-right py-3 px-3 font-medium text-muted-foreground border-b text-xs sm:text-sm">Monto Base</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {estadisticasPorDisciplina.map((disciplina) => (
                  <tr key={disciplina.disciplinaId} className="hover:bg-muted/5">
                    <td className="py-3 px-3">
                      <div className="flex items-center min-w-[120px]">
                        <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: disciplina.color }}></div>
                        <span className="font-medium text-xs sm:text-sm truncate">{disciplina.nombre}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-xs sm:text-sm">{disciplina.clases}</td>
                    <td className="py-3 px-3 text-center text-xs sm:text-sm">{disciplina.reservas}</td>
                    <td className="py-3 px-3 text-center text-xs sm:text-sm">{disciplina.capacidad}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center">
                        <div className="w-12 sm:w-16 h-2 bg-muted/30 rounded-full overflow-hidden mr-2">
                          <div
                            className={`h-full rounded-full ${getOcupacionColor(disciplina.ocupacion)}`}
                            style={{ width: `${Math.min(disciplina.ocupacion, 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-medium ${getOcupacionTextColor(disciplina.ocupacion)}`}>
                          {disciplina.ocupacion}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="font-medium text-xs sm:text-sm">{formatCurrency(disciplina.montoBase)}</div>
                    </td>
                  </tr>
                ))}

                {/* Subtotales por disciplinas */}
                <tr className="bg-muted/10 font-medium border-t-2">
                  <td colSpan={5} className="py-3 px-3 text-right"></td>
                  <td className="py-3 px-3 text-right font-medium text-sm sm:text-base">
                    {formatCurrency(totalMontoBase)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* CARD 2: Resumen de Pago - Versión responsive */}
      <Card className="border rounded-lg shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b gap-2 px-4 sm:px-6">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle className="text-base sm:text-lg font-medium">Resumen de Pago</CardTitle>
          </div>
          <Badge variant="outline" className={`text-xs sm:text-sm ${getEstadoColor(pagoSeleccionado.estado)}`}>
            {pagoSeleccionado.estado}
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {/* Monto Base Total */}
            <div className="flex justify-between items-center py-3 px-4 sm:px-6 hover:bg-muted/5">
              <div className="text-xs sm:text-sm font-medium">Monto Base Total:</div>
              <div className="font-medium text-xs sm:text-sm">{formatCurrency(totalMontoBase)}</div>
            </div>

            {/* Reajuste */}
            <div className="py-3 px-4 sm:px-6 hover:bg-muted/5">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-medium">Reajuste:</span>
                    {!editandoReajuste && (
                      <Badge variant="outline" className="font-normal text-xs sm:text-xs">
                        {pagoSeleccionado.tipoReajuste === "PORCENTAJE" ? `${pagoSeleccionado.reajuste}%` : "Fijo"}
                      </Badge>
                    )}
                    {!editandoReajuste ? (
                      isInstructor ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center text-muted-foreground ml-1">
                                <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <p>Los instructores no pueden editar el reajuste</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 rounded-full ml-1"
                          onClick={() => {
                            setNuevoReajuste(pagoSeleccionado.reajuste)
                            setTipoReajuste(pagoSeleccionado.tipoReajuste)
                            setEditandoReajuste(true)
                          }}
                        >
                          <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Button>
                      )
                    ) : (
                      <div className="flex items-center gap-2 ml-1">
                        {isActualizandoReajuste ? (
                          <Button disabled variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setEditandoReajuste(false)}
                            >
                              <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={actualizarReajuste}
                            >
                              <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {editandoReajuste && !isInstructor && (
                    <div className="mt-3 space-y-3">
                      <RadioGroup
                        value={tipoReajuste}
                        onValueChange={(value) => setTipoReajuste(value as TipoReajuste)}
                        className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="FIJO" id="fijo" className="h-4 w-4" />
                          <Label htmlFor="fijo" className="text-xs sm:text-sm font-medium">
                            Fijo
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="PORCENTAJE" id="porcentaje" className="h-4 w-4" />
                          <Label htmlFor="porcentaje" className="text-xs sm:text-sm font-medium">
                            Porcentaje
                          </Label>
                        </div>
                      </RadioGroup>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="relative w-full sm:max-w-[180px]">
                          <input
                            type="number"
                            value={nuevoReajuste}
                            onChange={(e) => setNuevoReajuste(Number(e.target.value))}
                            className="w-full h-9 sm:h-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs sm:text-sm"
                            step="0.01"
                          />
                          {tipoReajuste === "PORCENTAJE" && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-xs sm:text-sm">
                              %
                            </span>
                          )}
                        </div>

                        {tipoReajuste === "PORCENTAJE" && (
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            ≈ {formatCurrency(totalMontoBase * (nuevoReajuste / 100))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className={`font-medium text-xs sm:text-sm ${montoReajuste >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {montoReajuste >= 0 ? "+" : ""}
                  {formatCurrency(montoReajuste)}
                </div>
              </div>
            </div>

            {/* Bono */}
            {pagoSeleccionado.bono !== null && pagoSeleccionado.bono !== undefined && pagoSeleccionado.bono > 0 && (
              <div className="flex justify-between items-center py-3 px-4 sm:px-6 hover:bg-muted/5">
                <div className="text-xs sm:text-sm font-medium">Bono:</div>
                <div className="font-medium text-xs sm:text-sm text-emerald-600">
                  +{formatCurrency(pagoSeleccionado.bono)}
                </div>
              </div>
            )}

            {/* Cover */}
            {coverTotal > 0 && (
              <div className="flex justify-between items-center py-3 px-4 sm:px-6 hover:bg-muted/5">
                <div className="text-xs sm:text-sm font-medium">Covers:</div>
                <div className="font-medium text-xs sm:text-sm text-emerald-600">
                  +{formatCurrency(coverTotal)}
                </div>
              </div>
            )}

            {/* Brandeo */}
            {brandeoTotal > 0 && (
              <div className="flex justify-between items-center py-3 px-4 sm:px-6 hover:bg-muted/5">
                <div className="text-xs sm:text-sm font-medium">Brandeo:</div>
                <div className="font-medium text-xs sm:text-sm text-emerald-600">
                  +{formatCurrency(brandeoTotal)}
                </div>
              </div>
            )}

            {/* Theme Ride */}
            {themeRideTotal > 0 && (
              <div className="flex justify-between items-center py-3 px-4 sm:px-6 hover:bg-muted/5">
                <div className="text-xs sm:text-sm font-medium">Theme Ride:</div>
                <div className="font-medium text-xs sm:text-sm text-emerald-600">
                  +{formatCurrency(themeRideTotal)}
                </div>
              </div>
            )}

            {/* Workshop */}
            {workshopTotal > 0 && (
              <div className="flex justify-between items-center py-3 px-4 sm:px-6 hover:bg-muted/5">
                <div className="text-xs sm:text-sm font-medium">Workshop:</div>
                <div className="font-medium text-xs sm:text-sm text-emerald-600">
                  +{formatCurrency(workshopTotal)}
                </div>
              </div>
            )}

            {/* Penalización */}
            {penalizacionTotal > 0 && (
              <div className="flex justify-between items-center py-3 px-4 sm:px-6 hover:bg-muted/5">
                <div className="text-xs sm:text-sm font-medium">Penalización:</div>
                <div className="font-medium text-xs sm:text-sm text-rose-600">
                  -{formatCurrency(penalizacionTotal)}
                </div>
              </div>
            )}

            {/* Subtotal con Reajustes, Penalizaciones y Bonos */}
            <div className="flex justify-between items-center py-3 px-4 sm:px-6 bg-muted/5 font-medium">
              <div className="text-xs sm:text-sm">Subtotal con Reajustes, Penalizaciones y Bonos:</div>
              <div className="font-medium text-xs sm:text-sm">{formatCurrency(subtotal)}</div>
            </div>

            {/* Retención Total */}
            <div className="flex justify-between items-center py-3 px-4 sm:px-6 font-medium">
              <div className="text-xs sm:text-sm">Retención Total ({retencionValor * 100}%) :</div>
              <div className="font-medium text-xs sm:text-sm text-rose-600">
                -{formatCurrency(pagoSeleccionado.retencion)}
              </div>
            </div>

            {/* Monto Final */}
            <div className="flex justify-between items-center py-4 px-4 sm:px-6 bg-primary/5 font-bold border-t-2">
              <div className="text-xs sm:text-sm font-bold">MONTO FINAL:</div>
              <div className="text-lg sm:text-xl text-primary font-bold">
                {formatCurrency(pagoSeleccionado.pagoFinal)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <CommentsSection pagoId={pagoSeleccionado.id} comentariosIniciales={pagoSeleccionado.comentarios || ""} />
    </div>
  )
}