// components/penalizaciones-covers-tab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CalendarCheck, Award, Zap, GraduationCap, Users } from "lucide-react"
import { formatCurrency } from "@/utils/format-utils"

interface PenalizacionesCoversTabProps {
  detalles: {
    penalizaciones?: {
      detalle?: Array<{
        tipo: string
        fecha: string
        puntos: number
        disciplina: string
        descripcion: string
      }>
      puntos?: number
      maxPermitidos?: number
      excedentes?: number
      descuento?: number
      montoDescuento?: number
    }
    covers?: {
      totalCovers: number
      coversConBono: number
      bonoTotal: number
      coversConFullHouse: number
      clasesFullHouse: string[]
    }
    brandeos?: {
      totalBrandeos: number
      bonoTotal: number
      brandeos: Array<{
        id: number
        numero: number
        comentarios?: string
        createdAt: string
      }>
    }
    themeRides?: {
      totalThemeRides: number
      bonoTotal: number
      themeRides: Array<{
        id: number
        numero: number
        comentarios?: string
        createdAt: string
      }>
    }
    workshops?: {
      totalWorkshops: number
      bonoTotal: number
      workshops: Array<{
        id: number
        nombre: string
        fecha: string
        pago: number
        comentarios?: string
        createdAt: string
      }>
    }
    versus?: {
      totalClasesVersus: number
      bonoTotal: number
      clasesVersus: Array<{
        id: string
        fecha: string
        disciplina: string
        vsNum: number
      }>
    }
    resumen?: {
      totalClases: number
      totalMonto: number
      descuentoPenalizacion: number
      montoDescuento: number
      retencion: number
      pagoFinal: number
      categorias: any[]
      comentarios: string
    }
  }
  pagoSeleccionado?: {
    penalizacion?: number
  }
}

export function PenalizacionesCoversTab({ detalles, pagoSeleccionado }: PenalizacionesCoversTabProps) {
  // Datos de penalizaciones
  const penalizacionTotal = pagoSeleccionado?.penalizacion || detalles?.penalizaciones?.montoDescuento || 0
  const penalizacionPorcentaje = detalles?.penalizaciones?.descuento || 0
  const puntosPenalizacion = detalles?.penalizaciones?.puntos || 0
  const maxPuntosPermitidos = detalles?.penalizaciones?.maxPermitidos || 0
  const puntosExcedentes = detalles?.penalizaciones?.excedentes || 0
  const detallePenalizaciones = detalles?.penalizaciones?.detalle || []
  
  // Datos de covers
  const coverTotal = detalles?.covers?.bonoTotal || 0
  const totalCovers = detalles?.covers?.coversConBono || 0
  const coversInstructor: Array<{
    claseId: string
    fecha: string
    disciplina: string
    comentarios: string
  }> = [] // Los covers individuales no están en la nueva estructura

  // Datos de brandeos
  const brandeoTotal = detalles?.brandeos?.bonoTotal || 0
  const totalBrandeos = detalles?.brandeos?.totalBrandeos || 0
  const brandeosInstructor = detalles?.brandeos?.brandeos || []

  // Datos de theme rides
  const themeRideTotal = detalles?.themeRides?.bonoTotal || 0
  const totalThemeRides = detalles?.themeRides?.totalThemeRides || 0
  const themeRidesInstructor = detalles?.themeRides?.themeRides || []

  // Datos de workshops
  const workshopTotal = detalles?.workshops?.bonoTotal || 0
  const totalWorkshops = detalles?.workshops?.totalWorkshops || 0
  const workshopsInstructor = detalles?.workshops?.workshops || []

  // Datos de versus
  const versusTotal = detalles?.versus?.bonoTotal || 0
  const totalClasesVersus = detalles?.versus?.totalClasesVersus || 0
  const clasesVersusInstructor = detalles?.versus?.clasesVersus || []

  return (
    <div className="space-y-4 px-2 sm:px-0">
      {/* Tarjeta de Penalizaciones */}
      <Card className="border rounded-lg shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b px-4 sm:px-6">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            <CardTitle className="text-sm sm:text-base font-medium">Penalizaciones aplicadas</CardTitle>
          </div>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs sm:text-xs">
            {puntosPenalizacion} puntos
          </Badge>
        </CardHeader>
        <CardContent className="pt-3 px-4 sm:px-6">
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Puntos acumulados:</span>
              <span className="font-medium">{puntosPenalizacion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Límite permitido:</span>
              <span className="font-medium">{maxPuntosPermitidos}</span>
            </div>
            {puntosExcedentes > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Puntos excedentes:</span>
                <span className="font-medium text-rose-600">
                  {puntosExcedentes}
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
                <h4 className="text-xs sm:text-xs font-medium mb-1 text-muted-foreground">Detalles:</h4>
                <div className="space-y-2">
                  {detallePenalizaciones.map((pen, index) => (
                    <div key={index} className="text-2xs sm:text-xs border rounded p-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{pen.tipo.replace(/_/g, ' ')}</span>
                        <span className="text-rose-600">-{pen.puntos} pts</span>
                      </div>
                      {pen.descripcion && pen.descripcion !== "Sin descripción" && (
                        <div className="text-muted-foreground mt-1">Motivo: {pen.descripcion}</div>
                      )}
                      <div className="text-muted-foreground mt-1">
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
      <Card className="border rounded-lg shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b px-4 sm:px-6">
          <div className="flex items-center space-x-2">
            <CalendarCheck className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
            <CardTitle className="text-sm sm:text-base font-medium">Covers realizados</CardTitle>
          </div>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-xs sm:text-xs">
            {totalCovers} covers
          </Badge>
        </CardHeader>
        <CardContent className="pt-3 px-4 sm:px-6">
          <div className="space-y-3 text-xs sm:text-sm">
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
            {totalCovers > 0 && (
              <div className="mt-3">
                <h4 className="text-2xs sm:text-xs font-medium mb-1 text-muted-foreground">Resumen:</h4>
                <div className="text-2xs sm:text-xs border rounded p-2">
                  <div className="flex justify-between font-medium">
                    <span>Covers con bono:</span>
                    <span className="text-emerald-600">{totalCovers} covers</span>
                  </div>
                  <div className="mt-1">
                    <div>Total a recibir: {formatCurrency(coverTotal)}</div>
                    {detalles?.covers?.coversConFullHouse && detalles.covers.coversConFullHouse > 0 && (
                      <div>Covers con full house: {detalles.covers.coversConFullHouse}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tarjeta de Brandeos */}
      {brandeoTotal > 0 && (
        <Card className="border rounded-lg shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b px-4 sm:px-6">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              <CardTitle className="text-sm sm:text-base font-medium">Brandeos realizados</CardTitle>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs sm:text-xs">
              {totalBrandeos} brandeos
            </Badge>
          </CardHeader>
          <CardContent className="pt-3 px-4 sm:px-6">
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de brandeos:</span>
                <span className="font-medium">{totalBrandeos}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pago por brandeo:</span>
                <span className="font-medium">{formatCurrency(15)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">Total a recibir:</span>
                <span className="font-bold text-emerald-600">+{formatCurrency(brandeoTotal)}</span>
              </div>

              {/* Detalle de brandeos */}
              {brandeosInstructor.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-2xs sm:text-xs font-medium mb-1 text-muted-foreground">Detalles:</h4>
                  <div className="space-y-2">
                    {brandeosInstructor.map((brandeo, index) => (
                      <div key={index} className="text-2xs sm:text-xs border rounded p-2">
                        <div className="flex justify-between font-medium">
                          <span>Brandeo #{brandeo.numero}</span>
                          <span className="text-emerald-600">+{formatCurrency(15)}</span>
                        </div>
                        <div className="mt-1 space-y-1">
                          <div>Fecha: {new Date(brandeo.createdAt).toLocaleDateString()}</div>
                          {brandeo.comentarios && (
                            <div className="text-muted-foreground mt-1">
                              <span className="font-medium">Comentarios:</span> {brandeo.comentarios}
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
      )}

      {/* Tarjeta de Theme Rides */}
      {themeRideTotal > 0 && (
        <Card className="border rounded-lg shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b px-4 sm:px-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <CardTitle className="text-sm sm:text-base font-medium">Theme Rides realizados</CardTitle>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs sm:text-xs">
              {totalThemeRides} theme rides
            </Badge>
          </CardHeader>
          <CardContent className="pt-3 px-4 sm:px-6">
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de theme rides:</span>
                <span className="font-medium">{totalThemeRides}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pago por theme ride:</span>
                <span className="font-medium">{formatCurrency(30)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">Total a recibir:</span>
                <span className="font-bold text-emerald-600">+{formatCurrency(themeRideTotal)}</span>
              </div>

              {/* Detalle de theme rides */}
              {themeRidesInstructor.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-2xs sm:text-xs font-medium mb-1 text-muted-foreground">Detalles:</h4>
                  <div className="space-y-2">
                    {themeRidesInstructor.map((themeRide, index) => (
                      <div key={index} className="text-2xs sm:text-xs border rounded p-2">
                        <div className="flex justify-between font-medium">
                          <span>Theme Ride #{themeRide.numero}</span>
                          <span className="text-emerald-600">+{formatCurrency(30)}</span>
                        </div>
                        <div className="mt-1 space-y-1">
                          <div>Fecha: {new Date(themeRide.createdAt).toLocaleDateString()}</div>
                          {themeRide.comentarios && (
                            <div className="text-muted-foreground mt-1">
                              <span className="font-medium">Comentarios:</span> {themeRide.comentarios}
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
      )}

      {/* Tarjeta de Workshops */}
      {workshopTotal > 0 && (
        <Card className="border rounded-lg shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b px-4 sm:px-6">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              <CardTitle className="text-sm sm:text-base font-medium">Workshops realizados</CardTitle>
            </div>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs sm:text-xs">
              {totalWorkshops} workshops
            </Badge>
          </CardHeader>
          <CardContent className="pt-3 px-4 sm:px-6">
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de workshops:</span>
                <span className="font-medium">{totalWorkshops}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">Total a recibir:</span>
                <span className="font-bold text-emerald-600">+{formatCurrency(workshopTotal)}</span>
              </div>

              {/* Detalle de workshops */}
              {workshopsInstructor.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-2xs sm:text-xs font-medium mb-1 text-muted-foreground">Detalles:</h4>
                  <div className="space-y-2">
                    {workshopsInstructor.map((workshop, index) => (
                      <div key={index} className="text-2xs sm:text-xs border rounded p-2">
                        <div className="flex justify-between font-medium">
                          <span>{workshop.nombre}</span>
                          <span className="text-emerald-600">+{formatCurrency(workshop.pago)}</span>
                        </div>
                        <div className="mt-1 space-y-1">
                          <div>Fecha: {new Date(workshop.fecha).toLocaleDateString()}</div>
                          {workshop.comentarios && (
                            <div className="text-muted-foreground mt-1">
                              <span className="font-medium">Comentarios:</span> {workshop.comentarios}
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
      )}

      {/* Tarjeta de Versus */}
      {versusTotal > 0 && (
        <Card className="border rounded-lg shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b px-4 sm:px-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
              <CardTitle className="text-sm sm:text-base font-medium">Clases Versus realizadas</CardTitle>
            </div>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 text-xs sm:text-xs">
              {totalClasesVersus} clases
            </Badge>
          </CardHeader>
          <CardContent className="pt-3 px-4 sm:px-6">
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de clases versus:</span>
                <span className="font-medium">{totalClasesVersus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pago por clase versus:</span>
                <span className="font-medium">{formatCurrency(30)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">Total a recibir:</span>
                <span className="font-bold text-emerald-600">+{formatCurrency(versusTotal)}</span>
              </div>

              {/* Detalle de clases versus */}
              {clasesVersusInstructor.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-2xs sm:text-xs font-medium mb-1 text-muted-foreground">Detalles:</h4>
                  <div className="space-y-2">
                    {clasesVersusInstructor.map((clase, index) => (
                      <div key={index} className="text-2xs sm:text-xs border rounded p-2">
                        <div className="flex justify-between font-medium">
                          <span>Clase #{clase.id}</span>
                          <span className="text-emerald-600">+{formatCurrency(30)}</span>
                        </div>
                        <div className="mt-1 space-y-1">
                          <div>Fecha: {new Date(clase.fecha).toLocaleDateString()}</div>
                          <div>Disciplina: {clase.disciplina}</div>
                          <div>Instructores: {clase.vsNum}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}