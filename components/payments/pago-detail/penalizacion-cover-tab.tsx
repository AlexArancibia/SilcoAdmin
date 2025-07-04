// components/penalizaciones-covers-tab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CalendarCheck } from "lucide-react"
import { formatCurrency } from "@/utils/format-utils"

interface PenalizacionesCoversTabProps {
  detalles: {
    penalizaciones?: {
      detalle: Array<{
        tipo: string
        fecha: string
        puntos: number
        disciplina: string
        descripcion: string
      }>
      totalPuntos: number
      montoDescuento: number
      puntosExcedentes: number
      maxPuntosPermitidos: number
      porcentajeDescuento: number
    }
    detallesCovers?: Array<{
      claseId: string
      esCover: boolean
      fechaClase: string
      disciplinaId: number
      detalleCalculo: string
      montoCalculado: number
      disciplinaNombre: string
    }>
  }
}

export function PenalizacionesCoversTab({ detalles }: PenalizacionesCoversTabProps) {
  // Datos de penalizaciones
  const penalizacionTotal = detalles?.penalizaciones?.montoDescuento || 0
  const penalizacionPorcentaje = detalles?.penalizaciones?.porcentajeDescuento || 0
  const puntosPenalizacion = detalles?.penalizaciones?.totalPuntos || 0
  const maxPuntosPermitidos = detalles?.penalizaciones?.maxPuntosPermitidos || 0
  const detallePenalizaciones = detalles?.penalizaciones?.detalle || []
  
  // Datos de covers
  const coverTotal = detalles?.detallesCovers?.reduce((total, cover) => total + (cover.montoCalculado || 0), 0) || 0
  const totalCovers = detalles?.detallesCovers?.length || 0
  const coversInstructor = detalles?.detallesCovers?.map(cover => ({
    claseId: cover.claseId,
    fecha: new Date(cover.fechaClase).toLocaleDateString(),
    disciplina: cover.disciplinaNombre,
    comentarios: cover.detalleCalculo
  })) || []

  return (
    <div className="space-y-4">
      {/* Tarjeta de Penalizaciones */}
      <Card className="text-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <CardTitle className="text-base font-medium">Penalizaciones aplicadas</CardTitle>
          </div>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs">
            {puntosPenalizacion} puntos
          </Badge>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Puntos acumulados:</span>
              <span className="font-medium">{puntosPenalizacion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Límite permitido:</span>
              <span className="font-medium">{maxPuntosPermitidos}</span>
            </div>
            {puntosPenalizacion > maxPuntosPermitidos && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Puntos excedentes:</span>
                <span className="font-medium text-rose-600">
                  {puntosPenalizacion - maxPuntosPermitidos}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Descuento aplicado:</span>
              <span className="font-medium text-rose-600">{penalizacionPorcentaje}%</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-medium">Total descuento:</span>
              <span className="font-bold text-rose-600">-{formatCurrency(penalizacionTotal)}</span>
            </div>

            {/* Detalle de penalizaciones */}
            {detallePenalizaciones.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-medium mb-1 text-muted-foreground">Detalles:</h4>
                <div className="space-y-1">
                  {detallePenalizaciones.map((pen, index) => (
                    <div key={index} className="text-xs">
                      <div className="flex justify-between">
                        <span className="font-medium">{pen.tipo.replace(/_/g, ' ')}</span>
                        <span className="text-rose-600">-{pen.puntos} pts</span>
                      </div>
                      {pen.descripcion && pen.descripcion !== "Sin descripción" && (
                        <div className="text-muted-foreground">Motivo: {pen.descripcion}</div>
                      )}
                      <div className="text-muted-foreground">
                        {new Date(pen.fecha).toLocaleDateString()} • {pen.disciplina}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tarjeta de Covers */}
      <Card className="text-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <div className="flex items-center space-x-2">
            <CalendarCheck className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-base font-medium">Covers realizados</CardTitle>
          </div>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-xs">
            {totalCovers} covers
          </Badge>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total de covers:</span>
              <span className="font-medium">{totalCovers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pago por cover:</span>
              <span className="font-medium">{formatCurrency(80)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-medium">Total a recibir:</span>
              <span className="font-bold text-emerald-600">+{formatCurrency(coverTotal)}</span>
            </div>

            {/* Detalle de covers */}
            {coversInstructor.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-medium mb-1 text-muted-foreground">Detalles por clase:</h4>
                <div className="space-y-2">
                  {coversInstructor.map((cover, index) => (
                    <div key={index} className="text-xs border rounded p-2">
                      <div className="flex justify-between font-medium">
                        <span>Cover #{index + 1}</span>
                        <span className="text-emerald-600">+{formatCurrency(80)}</span>
                      </div>
                      <div className="mt-1">
                        <div>Clase ID: {cover.claseId}</div>
                        <div>Fecha: {cover.fecha}</div>
                        <div>Disciplina: {cover.disciplina}</div>
                        {cover.comentarios && (
                          <div className="text-muted-foreground mt-1">
                            <span className="font-medium">Notas:</span> {cover.comentarios}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}