"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Award, Check, CheckCircle2, Edit, Info, Loader2, Users, X, XCircle } from "lucide-react"
import type { CategoriaInstructor, Clase, Disciplina, FormulaDB, Instructor, PagoInstructor } from "@/types/schema"

// Add import for mostrarCategoriaVisual at the top of the file
import { mostrarCategoriaVisual } from "@/utils/config"

interface CategoryTabProps {
  instructor: Instructor
  pagoSeleccionado: PagoInstructor
  categoriasPorDisciplina: any[]
  disciplinas: Disciplina[]
  clasesInstructor: Clase[]
  formulas: FormulaDB[]
  editandoCategoria: boolean
  setEditandoCategoria: (value: boolean) => void
  factoresEditados: {
    dobleteos: number
    horariosNoPrime: number
    participacionEventos: boolean
    cumpleLineamientos: boolean
  }
  setFactoresEditados: (value: any) => void
  isActualizandoInstructor: boolean
  guardarFactoresEditados: () => void
  isActualizandoCategorias: boolean
  reevaluarTodasCategorias: () => void
  getColorCategoria: (categoria: CategoriaInstructor) => string
  formatearCategoria: (categoria: CategoriaInstructor) => string
  calcularMetricas: (clases: Clase[], disciplinaId?: number) => any
  cumpleRequisito: (valor: number | boolean, requisito: number | boolean, esMinimo?: boolean) => boolean
}

const requisitosCategoria = {
  EMBAJADOR_SENIOR: {
    ocupacion: 0,
    localesEnLima: 0,
    clases: 0,
    dobleteos: 0,
    horariosNoPrime: 0,
    participacionEventos: false,
    cumpleLineamientos: false,
  },
  EMBAJADOR: {
    ocupacion: 0,
    localesEnLima: 0,
    clases: 0,
    dobleteos: 0,
    horariosNoPrime: 0,
    participacionEventos: false,
    cumpleLineamientos: false,
  },
  EMBAJADOR_JUNIOR: {
    ocupacion: 0,
    localesEnLima: 0,
    clases: 0,
    dobleteos: 0,
    horariosNoPrime: 0,
    participacionEventos: false,
    cumpleLineamientos: false,
  },
  INSTRUCTOR: {
    ocupacion: 0,
    localesEnLima: 0,
    clases: 0,
    dobleteos: 0,
    horariosNoPrime: 0,
    participacionEventos: false,
    cumpleLineamientos: false,
  },
}

// Update the CategoryTab component to get properties from pagoSeleccionado instead of instructor
export function CategoryTab({
  instructor,
  pagoSeleccionado,
  categoriasPorDisciplina,
  disciplinas,
  clasesInstructor,
  formulas,
  editandoCategoria,
  setEditandoCategoria,
  factoresEditados,
  setFactoresEditados,
  isActualizandoInstructor,
  guardarFactoresEditados,
  isActualizandoCategorias,
  reevaluarTodasCategorias,
  getColorCategoria,
  formatearCategoria,
  calcularMetricas,
  cumpleRequisito,
}: CategoryTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center text-foreground">
          <Award className="h-5 w-5 mr-2 text-primary" />
          Factores de Cálculo
        </h3>

        <div className="flex items-center gap-2">
          {editandoCategoria ? (
            <div className="flex items-center gap-2 bg-card p-2 rounded-lg border shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="dobleteos" className="text-sm font-medium text-muted-foreground">
                    Dobleteos:
                  </Label>
                  <Input
                    id="dobleteos"
                    type="number"
                    value={factoresEditados.dobleteos}
                    onChange={(e) => setFactoresEditados({ ...factoresEditados, dobleteos: Number(e.target.value) })}
                    className="w-20 h-8 border focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="horariosNoPrime" className="text-sm font-medium text-muted-foreground">
                    Horarios No Prime:
                  </Label>
                  <div className="flex items-center">
                    <Input
                      id="horariosNoPrime"
                      type="number"
                      value={factoresEditados.horariosNoPrime}
                      disabled={true}
                      className="w-20 h-8 border bg-muted/20 text-muted-foreground cursor-not-allowed"
                    />
                    <span className="ml-2 text-xs text-muted-foreground italic">(Automático)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="participacionEventos" className="text-sm font-medium text-muted-foreground">
                    Participación en Eventos:
                  </Label>
                  <Switch
                    id="participacionEventos"
                    checked={factoresEditados.participacionEventos}
                    onCheckedChange={(checked) =>
                      setFactoresEditados({ ...factoresEditados, participacionEventos: checked })
                    }
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="cumpleLineamientos" className="text-sm font-medium text-muted-foreground">
                    Cumple Lineamientos:
                  </Label>
                  <Switch
                    id="cumpleLineamientos"
                    checked={factoresEditados.cumpleLineamientos}
                    onCheckedChange={(checked) =>
                      setFactoresEditados({ ...factoresEditados, cumpleLineamientos: checked })
                    }
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <Button
                  size="sm"
                  variant="default"
                  onClick={guardarFactoresEditados}
                  disabled={isActualizandoInstructor}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isActualizandoInstructor ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Guardar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditandoCategoria(false)}
                  disabled={isActualizandoInstructor}
                  className="border hover:bg-muted/10 text-muted-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 bg-card border hover:bg-muted/10 text-muted-foreground hover:text-foreground"
              onClick={() => setEditandoCategoria(true)}
            >
              <Edit className="h-4 w-4 mr-1" />
              <span>Editar Factores</span>
            </Button>
          )}
        </div>
      </div>
      <Separator className="my-2 bg-border" />

      {categoriasPorDisciplina.length === 0 ? (
        <div className="text-center py-8 bg-card rounded-lg border shadow-sm">
          <Award className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">Sin categorías asignadas</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Este instructor no tiene categorías asignadas para el periodo actual.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {categoriasPorDisciplina.map((categoria, index) => {
            // Get the discipline associated with this category
            const disciplina = disciplinas.find((d) => d.id === categoria.disciplinaId)

            // Calculate real metrics for this discipline
            const metricasReales = calcularMetricas(clasesInstructor, categoria.disciplinaId)

            return (
              <Card key={index} className="border overflow-hidden bg-card shadow-sm">
                <CardHeader className="border-b bg-card">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{
                          backgroundColor: disciplina?.color || "#6366F1",
                        }}
                      ></div>
                      <CardTitle className="text-lg text-foreground font-bold">
                        {disciplina?.nombre || `Disciplina ${categoria.disciplinaId}`}
                      </CardTitle>
                    </div>
                    {/* Add the category badge here */}
                    <Badge variant="outline" className={getColorCategoria(categoria.categoria)}>
                      {formatearCategoria(categoria.categoria)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                    <div className="p-4 border-r border-b md:border-b-0 border">
                      <h4 className="text-sm font-medium mb-3 flex items-center text-foreground">
                        <Users className="h-4 w-4 mr-2 text-primary" />
                        Métricas de Rendimiento (Reales)
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Ocupación:</span>
                          <div className="flex items-center gap-2">
                            <div className="relative w-24 h-3 bg-border rounded-full overflow-hidden">
                              <div
                                className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                                  metricasReales.ocupacion >= 80
                                    ? "bg-emerald-500"
                                    : metricasReales.ocupacion >= 50
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                }`}
                                style={{ width: `${Math.min(metricasReales.ocupacion, 100)}%` }}
                              >
                                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-white">
                                  {metricasReales.ocupacion}%
                                </span>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={`${
                                metricasReales.ocupacion >= 80
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                  : metricasReales.ocupacion >= 50
                                    ? "bg-amber-50 text-amber-600 border-amber-200"
                                    : "bg-rose-50 text-rose-600 border-rose-200"
                              }`}
                            >
                              {metricasReales.ocupacion}%
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Clases:</span>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            {metricasReales.clases}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Locales en Lima:</span>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            {metricasReales.localesEnLima}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <h4 className="text-sm font-medium mb-3 flex items-center text-foreground">
                        <Award className="h-4 w-4 mr-2 text-primary" />
                        Factores de Cálculo
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Dobleteos:</span>
                          <Badge
                            variant="outline"
                            className={
                              cumpleRequisito(
                                pagoSeleccionado.dobleteos || 0,
                                formulas.length > 0 && categoria
                                  ? formulas.find((f) => f.disciplinaId === categoria.disciplinaId)
                                      ?.requisitosCategoria[categoria.categoria as keyof typeof requisitosCategoria]
                                      ?.dobleteos || 0
                                  : 0,
                              )
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }
                          >
                            {pagoSeleccionado.dobleteos || 0}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Horarios No Prime:</span>
                          <Badge
                            variant="outline"
                            className={
                              cumpleRequisito(
                                pagoSeleccionado.horariosNoPrime || 0,
                                formulas.length > 0 && categoria
                                  ? formulas.find((f) => f.disciplinaId === categoria.disciplinaId)
                                      ?.requisitosCategoria[categoria.categoria as keyof typeof requisitosCategoria]
                                      ?.horariosNoPrime || 0
                                  : 0,
                              )
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }
                          >
                            {pagoSeleccionado.horariosNoPrime || 0}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Participación en Eventos:</span>
                          <div className="flex items-center">
                            {pagoSeleccionado.participacionEventos ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 mr-1" />
                            ) : formulas.length > 0 &&
                              categoria &&
                              formulas.find((f) => f.disciplinaId === categoria.disciplinaId)?.requisitosCategoria[
                                categoria.categoria as keyof typeof requisitosCategoria
                              ]?.participacionEventos ? (
                              <XCircle className="h-4 w-4 text-rose-600 mr-1" />
                            ) : (
                              <Info className="h-4 w-4 text-muted-foreground mr-1" />
                            )}
                            <Badge
                              variant="outline"
                              className={
                                pagoSeleccionado.participacionEventos
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : formulas.length > 0 &&
                                      categoria &&
                                      formulas.find((f) => f.disciplinaId === categoria.disciplinaId)
                                        ?.requisitosCategoria[categoria.categoria as keyof typeof requisitosCategoria]
                                        ?.participacionEventos
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-muted/10 text-muted-foreground border"
                              }
                            >
                              {pagoSeleccionado.participacionEventos ? "Sí" : "No"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Cumple Lineamientos:</span>
                          <div className="flex items-center">
                            {pagoSeleccionado.cumpleLineamientos ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 mr-1" />
                            ) : (
                              <XCircle className="h-4 w-4 text-rose-600 mr-1" />
                            )}
                            <Badge
                              variant="outline"
                              className={
                                pagoSeleccionado.cumpleLineamientos
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }
                            >
                              {pagoSeleccionado.cumpleLineamientos ? "Sí" : "No"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t bg-muted/10">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-muted-foreground">
                        Última actualización:{" "}
                        {categoria.updatedAt ? new Date(categoria.updatedAt).toLocaleDateString() : "No disponible"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Criteria section */}
          <div className="bg-card p-4 rounded-lg border shadow-sm">
            <h4 className="text-sm font-medium mb-3 text-foreground">Criterios de Cálculo por Disciplina</h4>

            {disciplinas.length > 0 && formulas.length > 0 ? (
              <div className="space-y-4">
                {disciplinas
                  .filter(
                    (d) =>
                      // Filter to only include disciplines that the instructor has taught AND have visual categories
                      clasesInstructor.some((c) => c.disciplinaId === d.id) && mostrarCategoriaVisual(d.nombre),
                  )
                  .map((disciplina) => {
                    // Find the formula for this specific discipline
                    const disciplinaFormula = formulas.find((f) => f.disciplinaId === disciplina.id) || formulas[0]
                    const requisitos = disciplinaFormula.requisitosCategoria

                    // Find the current category for this discipline
                    const currentCategory =
                      instructor.categorias?.find(
                        (cat) => cat.disciplinaId === disciplina.id && cat.periodoId === pagoSeleccionado.periodoId,
                      )?.categoria || "INSTRUCTOR"

                    return (
                      <div key={disciplina.id} className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: disciplina.color || "#6366F1" }}
                            ></div>
                            <h5 className="font-medium text-foreground">{disciplina.nombre}</h5>
                          </div>
                          <Badge variant="outline" className={getColorCategoria(currentCategory)}>
                            {formatearCategoria(currentCategory)}
                          </Badge>
                        </div>

                        <div className="space-y-2 bg-muted/10 p-3 rounded-md">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium flex items-center">
                              <span className="text-xs">Embajador Senior</span>
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Ocupación ≥ {requisitos.EMBAJADOR_SENIOR.ocupacion}%, ≥{" "}
                              {requisitos.EMBAJADOR_SENIOR.localesEnLima} locales, ≥{" "}
                              {requisitos.EMBAJADOR_SENIOR.clases} clases, ≥ {requisitos.EMBAJADOR_SENIOR.dobleteos}{" "}
                              dobleteos, ≥ {requisitos.EMBAJADOR_SENIOR.horariosNoPrime} horarios no prime
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium flex items-center">
                              <span className="text-xs">Embajador</span>
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Ocupación ≥ {requisitos.EMBAJADOR.ocupacion}%, ≥ {requisitos.EMBAJADOR.localesEnLima}{" "}
                              locales, ≥ {requisitos.EMBAJADOR.clases} clases, ≥ {requisitos.EMBAJADOR.dobleteos}{" "}
                              dobleteos, ≥ {requisitos.EMBAJADOR.horariosNoPrime} horarios no prime
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium flex items-center">
                              <span className="text-xs">Embajador Junior</span>
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Ocupación ≥ {requisitos.EMBAJADOR_JUNIOR.ocupacion}%, ≥{" "}
                              {requisitos.EMBAJADOR_JUNIOR.localesEnLima} locales, ≥{" "}
                              {requisitos.EMBAJADOR_JUNIOR.clases} clases, ≥ {requisitos.EMBAJADOR_JUNIOR.dobleteos}{" "}
                              dobleteos, ≥ {requisitos.EMBAJADOR_JUNIOR.horariosNoPrime} horarios no prime
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium flex items-center">
                              <span className="text-xs">Instructor</span>
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Ocupación {"< "}
                              {requisitos.EMBAJADOR_JUNIOR.ocupacion}% o{"< "}
                              {requisitos.EMBAJADOR_JUNIOR.clases} clases o no cumple lineamientos
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                {/* Show message if no disciplines with visual categories */}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-muted-foreground">Cargando información de requisitos...</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
