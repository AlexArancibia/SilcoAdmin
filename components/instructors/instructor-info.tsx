"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Award, Save } from "lucide-react"
import type { Instructor } from "@/types/schema"
import type { PagoInstructor } from "@/types/schema"

interface InstructorInfoProps {
  instructor: Instructor | null
  isEditing: boolean
  isSaving: boolean
  editedInstructor: Partial<Instructor>
  editedPaymentMetrics: {
    dobleteos: number
    horariosNoPrime: number
    participacionEventos: boolean
    cumpleLineamientos: boolean
  }
  handleSaveChanges: () => void
  handleInputChange: (field: string, value: any) => void
  handleExtraInfoChange: (field: string, value: any) => void
  handlePaymentMetricChange: (field: string, value: any) => void
  pagosPeriodo: PagoInstructor[]
}

export function InstructorInfo({
  instructor,
  isEditing,
  isSaving,
  editedInstructor,
  editedPaymentMetrics,
  handleSaveChanges,
  handleInputChange,
  handleExtraInfoChange,
  handlePaymentMetricChange,
  pagosPeriodo,
}: InstructorInfoProps) {
  if (!instructor) return null

  // Get metrics from the most recent payment
  const latestPago = pagosPeriodo.length > 0 ? [...pagosPeriodo].sort((a, b) => b.periodoId - a.periodoId)[0] : null

  const biografia = instructor?.extrainfo?.biografia || "Sin biografia"
  const experiencia = instructor?.extrainfo?.experiencia || 0
  const telefono = instructor?.extrainfo?.telefono || "No disponible"

  return (
    <Card className="card border shadow-sm">
      <CardHeader className="pb-2 px-4 pt-3">
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle className="flex items-center gap-1.5 text-lg">
              <Award className="h-4 w-4 text-primary" />
              Información del instructor
            </CardTitle>
            <CardDescription className="text-sm mt-0.5">Detalles y métricas del instructor</CardDescription>
          </div>
          {isEditing && (
            <Button onClick={handleSaveChanges} disabled={isSaving} size="sm" className="btn btn-primary btn-sm h-8">
              {isSaving ? (
                <>Guardando...</>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Guardar
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pt-2 pb-3">
        {isEditing ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="biografia" className="text-xs">
                Biografía
              </Label>
              <Textarea
                id="biografia"
                value={editedInstructor.extrainfo?.biografia || ""}
                onChange={(e) => handleExtraInfoChange("biografia", e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="experiencia" className="text-xs text-muted-foreground">
                  Experiencia (años)
                </Label>
                <Input
                  id="experiencia"
                  type="number"
                  value={editedInstructor.extrainfo?.experiencia || 0}
                  onChange={(e) => handleExtraInfoChange("experiencia", Number.parseInt(e.target.value))}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telefono" className="text-xs">
                  Teléfono
                </Label>
                <Input
                  id="telefono"
                  value={editedInstructor.extrainfo?.telefono || ""}
                  onChange={(e) => handleExtraInfoChange("telefono", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="especialidad" className="text-xs">
                  Especialidad
                </Label>
                <Input
                  id="especialidad"
                  value={editedInstructor.extrainfo?.especialidad || ""}
                  onChange={(e) => handleExtraInfoChange("especialidad", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="activo" className="flex-between text-xs">
                  Activo
                  <Switch
                    id="activo"
                    checked={editedInstructor.extrainfo?.activo || false}
                    onCheckedChange={(checked) => handleExtraInfoChange("activo", checked)}
                  />
                </Label>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t mt-2">
              <h3 className="text-xs font-medium">Métricas y requisitos (del pago)</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dobleteos" className="text-xs">
                    Dobleteos
                  </Label>
                  <Input
                    id="dobleteos"
                    type="number"
                    value={editedPaymentMetrics.dobleteos}
                    onChange={(e) => handlePaymentMetricChange("dobleteos", Number.parseInt(e.target.value))}
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="horariosNoPrime" className="text-xs">
                    Horarios no prime
                  </Label>
                  <Input
                    id="horariosNoPrime"
                    type="number"
                    value={editedPaymentMetrics.horariosNoPrime}
                    onChange={(e) => handlePaymentMetricChange("horariosNoPrime", Number.parseInt(e.target.value))}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex-between">
                  <Label htmlFor="cumpleLineamientos" className="text-xs">
                    Cumple lineamientos
                  </Label>
                  <Switch
                    id="cumpleLineamientos"
                    checked={editedPaymentMetrics.cumpleLineamientos}
                    onCheckedChange={(checked) => handlePaymentMetricChange("cumpleLineamientos", checked)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex-between">
                  <Label htmlFor="participacionEventos" className="text-xs">
                    Participa en eventos
                  </Label>
                  <Switch
                    id="participacionEventos"
                    checked={editedPaymentMetrics.participacionEventos}
                    onCheckedChange={(checked) => handlePaymentMetricChange("participacionEventos", checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
              <h3 className="text-xs font-medium mb-1">Biografía</h3>
              <p className="text-sm">{biografia}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-2 card border rounded-lg">
                <h3 className="text-xs font-medium  text-muted-foreground">Experiencia</h3>
                <p className="text-sm font-medium">{experiencia} años</p>
              </div>

              <div className="p-2 card border rounded-lg">
                <h3 className="text-xs font-medium  text-muted-foreground">Teléfono</h3>
                <p className="text-sm font-medium">{telefono}</p>
              </div>

              <div className="p-2 card border rounded-lg">
                <h3 className="text-xs font-medium  text-muted-foreground">Dobleteos</h3>
                <p className="text-sm font-medium">{latestPago?.dobleteos || 0}</p>
              </div>

              <div className="p-2 card border rounded-lg">
                <h3 className="text-xs font-medium  text-muted-foreground">Horarios no prime</h3>
                <p className="text-sm font-medium">{latestPago?.horariosNoPrime || 0}</p>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-medium mb-2">Cumplimiento de requisitos</h3>
              <div className="space-y-1.5">
                <div className="flex-between p-2 bg-primary/5 rounded-md border border-primary/10">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`size-1.5 rounded-full ${latestPago?.cumpleLineamientos ? "bg-green-500" : "bg-red-500"}`}
                    ></div>
                    <span className="text-xs">Lineamientos</span>
                  </div>
                  <Badge
                    variant={latestPago?.cumpleLineamientos ? "success" : "destructive"}
                    className="badge text-[10px] h-5 px-1.5"
                  >
                    {latestPago?.cumpleLineamientos ? "Cumple" : "No cumple"}
                  </Badge>
                </div>

                <div className="flex-between p-2 bg-primary/5 rounded-md border border-primary/10">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`size-1.5 rounded-full ${latestPago?.participacionEventos ? "bg-green-500" : "bg-amber-500"}`}
                    ></div>
                    <span className="text-xs">Eventos</span>
                  </div>
                  <Badge
                    variant={latestPago?.participacionEventos ? "success" : "secondary"}
                    className="badge text-[10px] h-5 px-1.5 dark:text-slate-800"
                  >
                    {latestPago?.participacionEventos ? "Participa" : "No participa"}
                  </Badge>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
