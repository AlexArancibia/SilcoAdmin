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
import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal, Key } from "react"

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

  // Calcular penalización
  const penalizacionTotal = pagoSeleccionado.penalizacion || 0
  const penalizacionPorcentaje = pagoSeleccionado.detalles?.penalizaciones?.porcentajeDescuento || 0
  const puntosPenalizacion = pagoSeleccionado.detalles?.penalizaciones?.totalPuntos || 0
  const maxPuntosPermitidos = pagoSeleccionado.detalles?.penalizaciones?.maxPuntosPermitidos || 0

  // Calcular subtotal y monto final con reajuste, bonos y covers
  const subtotal = totalMontoBase + montoReajuste + (pagoSeleccionado.bono ?? 0) + coverTotal - penalizacionTotal

  // Total de clases
  const totalClases = pagoSeleccionado.detalles?.resumen?.totalClases || clasesInstructor.length

  return (
    <div className="space-y-6">
      {/* CARD 1: Desglose por Disciplina */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-medium">Desglose por Disciplina</CardTitle>
          </div>
          <div className="text-sm text-muted-foreground">
            {estadisticasPorDisciplina.length} disciplinas • {totalClases} clases • Ocupación:{" "}
            <span className={getOcupacionTextColor(ocupacionPromedio)}>{ocupacionPromedio}%</span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/10">
              <tr>
                <th className="text-left py-3 px-3 font-medium text-muted-foreground border-b">Disciplina</th>
                <th className="text-center py-3 px-3 font-medium text-muted-foreground border-b">Clases</th>
                <th className="text-center py-3 px-3 font-medium text-muted-foreground border-b">Reservas</th>
                <th className="text-center py-3 px-3 font-medium text-muted-foreground border-b">Lugares</th>
                <th className="text-center py-3 px-3 font-medium text-muted-foreground border-b">Ocupación</th>
                <th className="text-right py-3 px-3 font-medium text-muted-foreground border-b">
                  Monto Base por Disciplina
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {estadisticasPorDisciplina.map((disciplina) => (
                <tr key={disciplina.disciplinaId} className="hover:bg-muted/5">
                  <td className="py-3 px-3">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: disciplina.color }}></div>
                      <span className="font-medium">{disciplina.nombre}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">{disciplina.clases}</td>
                  <td className="py-3 px-3 text-center">{disciplina.reservas}</td>
                  <td className="py-3 px-3 text-center">{disciplina.capacidad}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center">
                      <div className="w-16 h-2 bg-muted/30 rounded-full overflow-hidden mr-2">
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
                    <div className="font-medium">{formatCurrency(disciplina.montoBase)}</div>
                  </td>
                </tr>
              ))}

              {/* Subtotales por disciplinas */}
              <tr className="bg-muted/10 font-medium border-t-2">
                <td colSpan={5} className="py-3 px-3 text-right"></td>
                <td className="py-3 px-3 text-right font-medium">{formatCurrency(totalMontoBase)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

 

      {/* CARD 3: Resumen de Pago */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-medium">Resumen de Pago</CardTitle>
          </div>
          <Badge variant="outline" className={getEstadoColor(pagoSeleccionado.estado)}>
            {pagoSeleccionado.estado}
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {/* Monto Base Total */}
              <tr className="hover:bg-muted/5">
                <td className="py-3 px-3 font-medium">Monto Base Total:</td>
                <td className="py-3 px-3 text-right font-medium w-1/3">{formatCurrency(totalMontoBase)}</td>
              </tr>

              {/* Reajuste */}
              <tr className="hover:bg-muted/5">
                <td className="py-3 px-3">
                  <div className="flex items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Reajuste:</span>
                      {!editandoReajuste && (
                        <Badge variant="outline" className="font-normal">
                          {pagoSeleccionado.tipoReajuste === "PORCENTAJE" ? `${pagoSeleccionado.reajuste}%` : "Fijo"}
                        </Badge>
                      )}
                      {!editandoReajuste ? (
                        isInstructor ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center text-muted-foreground ml-1">
                                  <Lock className="h-4 w-4" />
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
                            className="h-7 w-7 p-0 rounded-full ml-1"
                            onClick={() => {
                              setNuevoReajuste(pagoSeleccionado.reajuste)
                              setTipoReajuste(pagoSeleccionado.tipoReajuste)
                              setEditandoReajuste(true)
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        )
                      ) : (
                        <div className="flex items-center gap-2 ml-1">
                          {isActualizandoReajuste ? (
                            <Button disabled variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setEditandoReajuste(false)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-primary hover:text-primary hover:bg-primary/10"
                                onClick={actualizarReajuste}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {editandoReajuste && !isInstructor && (
                    <div className="mt-3 space-y-3 ml-0">
                      <div className="flex items-center gap-4">
                        <RadioGroup
                          value={tipoReajuste}
                          onValueChange={(value) => setTipoReajuste(value as TipoReajuste)}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="FIJO" id="fijo" />
                            <Label htmlFor="fijo" className="font-medium">
                              Fijo
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="PORCENTAJE" id="porcentaje" />
                            <Label htmlFor="porcentaje" className="font-medium">
                              Porcentaje
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="flex items-center">
                        <div className="relative w-full max-w-[180px]">
                          <input
                            type="number"
                            value={nuevoReajuste}
                            onChange={(e) => setNuevoReajuste(Number(e.target.value))}
                            className="w-full h-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-base"
                            step="0.01"
                          />
                          {tipoReajuste === "PORCENTAJE" && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                              %
                            </span>
                          )}
                        </div>

                        {tipoReajuste === "PORCENTAJE" && (
                          <div className="ml-3 text-sm text-muted-foreground">
                            ≈ {formatCurrency(totalMontoBase * (nuevoReajuste / 100))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </td>
                <td className="py-3 px-3 text-right align-top">
                  <div className={`font-medium ${montoReajuste >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {montoReajuste >= 0 ? "+" : ""}
                    {formatCurrency(montoReajuste)}
                  </div>
                </td>
              </tr>

              {/* Bono */}
              {pagoSeleccionado.bono !== null && pagoSeleccionado.bono !== undefined && pagoSeleccionado.bono > 0 && (
                <tr className="hover:bg-muted/5">
                  <td className="py-3 px-3 font-medium">Bono:</td>
                  <td className="py-3 px-3 text-right">
                    <div className="font-medium text-emerald-600">+{formatCurrency(pagoSeleccionado.bono)}</div>
                  </td>
                </tr>
              )}

              {/* Cover */}
              {coverTotal > 0 && (
                <tr className="hover:bg-muted/5">
                  <td className="py-3 px-3 font-medium">Covers:</td>
                  <td className="py-3 px-3 text-right">
                    <div className="font-medium text-emerald-600">+{formatCurrency(coverTotal)}</div>
                  </td>
                </tr>
              )}
              {/* Penalización */}
              {penalizacionTotal > 0 && (
                <tr className="hover:bg-muted/5">
                  <td className="py-3 px-3 font-medium">Penalización:</td>
                  <td className="py-3 px-3 text-right">
                    <div className="font-medium text-rose-600">-{formatCurrency(penalizacionTotal)}</div>
                  </td>
                </tr>
              )}
              {/* Subtotal con Reajustes, Penalizaciones y Covers */}
              <tr className="bg-muted/5 font-medium">
                <td className="py-3 px-3 font-medium">Subtotal con Reajustes, Penalizaciones y Cover:</td>
                <td className="py-3 px-3 text-right font-medium">{formatCurrency(subtotal)}</td>
              </tr>



              {/* Retención Total */}
              <tr className="font-medium">
                <td className="py-3 px-3 font-medium">Retención Total ({retencionValor * 100}%) :</td>
                <td className="py-3 px-3 text-right font-medium text-rose-600">-{formatCurrency(pagoSeleccionado.retencion)}</td>
              </tr>

              {/* Monto Final */}
              <tr className="bg-primary/5 font-bold border-t-2">
                <td className="py-4 px-3 text-base font-bold">MONTO FINAL:</td>
                <td className="py-4 px-3 text-right text-xl text-primary font-bold">
                  {formatCurrency(pagoSeleccionado.pagoFinal)}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
      
      <CommentsSection pagoId={pagoSeleccionado.id} comentariosIniciales={pagoSeleccionado.comentarios || ""} />
    </div>
  )
}