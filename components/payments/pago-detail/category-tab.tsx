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
  console.log("🔍 DEBUG: CategoryTab render")
  console.log("🔍 DEBUG: categoriasPorDisciplina:", categoriasPorDisciplina)
  console.log("🔍 DEBUG: disciplinas:", disciplinas)
  console.log("🔍 DEBUG: clasesInstructor:", clasesInstructor)
  console.log("🔍 DEBUG: instructor:", instructor)
  console.log("🔍 DEBUG: instructor.categorias:", instructor?.categorias)
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-lg font-medium flex items-center text-foreground">
          <Award className="h-5 w-5 mr-2 text-primary" />
          Factores de Cálculo
        </h3>

        <div className="flex items-center gap-2">
          {editandoCategoria ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card p-3 rounded-lg border shadow-sm w-full sm:w-auto">
              <div className="space-y-2 w-full">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <Label htmlFor="dobleteos" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    Dobleteos:
                  </Label>
                  <Input
                    id="dobleteos"
                    type="number"
                    value={factoresEditados.dobleteos}
                    onChange={(e) => setFactoresEditados({ ...factoresEditados, dobleteos: Number(e.target.value) })}
                    className="w-full sm:w-20 h-8 border focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <Label htmlFor="horariosNoPrime" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    Horarios No Prime:
                  </Label>
                  <div className="flex items-center w-full sm:w-auto">
                    <Input
                      id="horariosNoPrime"
                      type="number"
                      value={factoresEditados.horariosNoPrime}
                      disabled={true}
                      className="w-full sm:w-20 h-8 border bg-muted/20 text-muted-foreground cursor-not-allowed"
                    />
                    <span className="ml-2 text-xs text-muted-foreground italic hidden sm:inline">(Automático)</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <Label htmlFor="participacionEventos" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <Label htmlFor="cumpleLineamientos" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
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
              <div className="flex flex-row sm:flex-col gap-2 justify-end sm:justify-start">
                <Button
                  size="sm"
                  variant="default"
                  onClick={guardarFactoresEditados}
                  disabled={isActualizandoInstructor}
                  className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                >
                  {isActualizandoInstructor ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  <span className="sm:inline">Guardar</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditandoCategoria(false)}
                  disabled={isActualizandoInstructor}
                  className="border hover:bg-muted/10 text-muted-foreground w-full sm:w-auto"
                >
                  <X className="h-4 w-4 mr-1" />
                  <span className="sm:inline">Cancelar</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 bg-card border hover:bg-muted/10 text-muted-foreground hover:text-foreground w-full sm:w-auto"
                onClick={() => setEditandoCategoria(true)}
              >
                <Edit className="h-4 w-4 mr-1" />
                <span className="sm:inline">Editar Factores</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700 hover:text-blue-800 w-full sm:w-auto"
                onClick={reevaluarTodasCategorias}
                disabled={isActualizandoCategorias}
              >
                {isActualizandoCategorias ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Award className="h-4 w-4 mr-1" />
                )}
                <span className="sm:inline">Recalcular Categorías</span>
              </Button>
            </div>
          )}
        </div>
      </div>
      <Separator className="my-2 bg-border" />

      {categoriasPorDisciplina.length === 0 ? (
        <div className="text-center py-8 bg-card rounded-lg border shadow-sm">
          <Award className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">Sin categorías asignadas</h3>
          <p className="mt-2 text-sm text-muted-foreground px-4">
            Este instructor no tiene categorías asignadas para el periodo actual.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {categoriasPorDisciplina.map((categoria, index) => {
            const disciplina = disciplinas.find((d) => d.id === categoria.disciplinaId)
            const metricasReales = calcularMetricas(clasesInstructor, categoria.disciplinaId)

            return (
              <Card key={index} className="border overflow-hidden bg-card shadow-sm">
                <CardHeader className="border-b bg-card p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{
                          backgroundColor: disciplina?.color || "#6366F1",
                        }}
                      ></div>
                      <CardTitle className="text-base sm:text-lg text-foreground font-bold">
                        {disciplina?.nombre || `Disciplina ${categoria.disciplinaId}`}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className={getColorCategoria(categoria.categoria)}>
                      {formatearCategoria(categoria.categoria)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                    <div className="p-3 sm:p-4 border-b sm:border-r sm:border-b-0 border">
                      <h4 className="text-sm font-medium mb-2 flex items-center text-foreground">
                        <Users className="h-4 w-4 mr-2 text-primary" />
                        Métricas de Rendimiento
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-muted-foreground">Ocupación:</span>
                          <div className="flex items-center gap-2">
                            <div className="relative w-16 sm:w-24 h-3 bg-border rounded-full overflow-hidden">
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
                                {metricasReales.ocupacion >= 20 && (
                                  <span className="absolute inset-0 flex items-center justify-center text-[8px] sm:text-[9px] font-medium text-white">
                                    {metricasReales.ocupacion}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                metricasReales.ocupacion >= 80
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                                  : metricasReales.ocupacion >= 50
                                    ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                                    : "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800"
                              }`}
                            >
                              {metricasReales.ocupacion}%
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-muted-foreground">Clases por Semana:</span>
                          <Badge
                            variant="outline"
                            className="text-xs bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:border-primary/30"
                          >
                            {metricasReales.clases}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-muted-foreground">Locales en Lima:</span>
                          <Badge
                            variant="outline"
                            className="text-xs bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:border-primary/30"
                          >
                            {metricasReales.localesEnLima}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 sm:p-4">
                      <h4 className="text-sm font-medium mb-2 flex items-center text-foreground">
                        <Award className="h-4 w-4 mr-2 text-primary" />
                        Factores de Cálculo
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-muted-foreground">Dobleteos:</span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              cumpleRequisito(
                                pagoSeleccionado.dobleteos || 0,
                                formulas.length > 0 && categoria
                                  ? formulas.find((f) => f.disciplinaId === categoria.disciplinaId)
                                      ?.requisitosCategoria[categoria.categoria as keyof typeof requisitosCategoria]
                                      ?.dobleteos || 0
                                  : 0,
                              )
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                            }`}
                          >
                            {pagoSeleccionado.dobleteos || 0}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-muted-foreground">Horarios No Prime:</span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              cumpleRequisito(
                                pagoSeleccionado.horariosNoPrime || 0,
                                formulas.length > 0 && categoria
                                  ? formulas.find((f) => f.disciplinaId === categoria.disciplinaId)
                                      ?.requisitosCategoria[categoria.categoria as keyof typeof requisitosCategoria]
                                      ?.horariosNoPrime || 0
                                  : 0,
                              )
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                            }`}
                          >
                            {pagoSeleccionado.horariosNoPrime || 0}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-muted-foreground">Participación Eventos:</span>
                          <div className="flex items-center">
                            {pagoSeleccionado.participacionEventos ? (
                              <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400 mr-1" />
                            ) : formulas.length > 0 &&
                              categoria &&
                              formulas.find((f) => f.disciplinaId === categoria.disciplinaId)?.requisitosCategoria[
                                categoria.categoria as keyof typeof requisitosCategoria
                              ]?.participacionEventos ? (
                              <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-rose-600 dark:text-rose-400 mr-1" />
                            ) : (
                              <Info className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mr-1" />
                            )}
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                pagoSeleccionado.participacionEventos
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                                  : formulas.length > 0 &&
                                      categoria &&
                                      formulas.find((f) => f.disciplinaId === categoria.disciplinaId)
                                        ?.requisitosCategoria[categoria.categoria as keyof typeof requisitosCategoria]
                                        ?.participacionEventos
                                    ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800"
                                    : "bg-muted/10 text-muted-foreground border dark:bg-muted/20"
                              }`}
                            >
                              {pagoSeleccionado.participacionEventos ? "Sí" : "No"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-muted-foreground">Cumple Lineamientos:</span>
                          <div className="flex items-center">
                            {pagoSeleccionado.cumpleLineamientos ? (
                              <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-rose-600 dark:text-rose-400 mr-1" />
                            )}
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                pagoSeleccionado.cumpleLineamientos
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                                  : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800"
                              }`}
                            >
                              {pagoSeleccionado.cumpleLineamientos ? "Sí" : "No"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border-t bg-muted/10">
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
          <div className="bg-card p-3 sm:p-4 rounded-lg border shadow-sm">
            <h4 className="text-sm font-medium mb-3 text-foreground">Criterios de Cálculo por Disciplina</h4>

            {disciplinas.length > 0 && formulas.length > 0 ? (
              <div className="space-y-4">
                {disciplinas
                  .filter(
                    (d) =>
                      clasesInstructor.some((c) => c.disciplinaId === d.id) && mostrarCategoriaVisual(d.nombre),
                  )
                  .map((disciplina) => {
                    const disciplinaFormula = formulas.find((f) => f.disciplinaId === disciplina.id) || formulas[0]
                    const requisitos = disciplinaFormula.requisitosCategoria

                    const currentCategory =
                      instructor.categorias?.find(
                        (cat) => cat.disciplinaId === disciplina.id && cat.periodoId === pagoSeleccionado.periodoId,
                      )?.categoria || "INSTRUCTOR"

                    return (
                      <div key={disciplina.id} className="mb-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: disciplina.color || "#6366F1" }}
                            ></div>
                            <h5 className="font-medium text-sm sm:text-base text-foreground">{disciplina.nombre}</h5>
                          </div>
                          <Badge variant="outline" className={`text-xs sm:text-sm ${getColorCategoria(currentCategory)}`}>
                            {formatearCategoria(currentCategory)}
                          </Badge>
                        </div>

                        <div className="overflow-x-auto">
                          <div className="min-w-[500px] overflow-hidden rounded-lg border shadow-sm">
                            <table className="w-full text-xs sm:text-sm border-collapse">
                              <thead>
                                <tr className="bg-muted/30 dark:bg-muted/20">
                                  <th className="text-left p-2 sm:p-3 font-medium text-primary">Criterio</th>
                                  <th className="text-center p-2 sm:p-3 font-medium text-primary">Embajador Junior</th>
                                  <th className="text-center p-2 sm:p-3 font-medium text-primary">Embajador</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-t border-border/30 hover:bg-muted/5">
                                  <td className="p-2 sm:p-3 font-medium">Ocupación</td>
                                  <td
                                    className={`p-2 sm:p-3 text-center ${currentCategory === "EMBAJADOR_JUNIOR" ? "bg-primary/5 dark:bg-primary/10" : ""} ${
                                      calcularMetricas(clasesInstructor, disciplina.id).ocupacion >=
                                      requisitos.EMBAJADOR_JUNIOR.ocupacion
                                        ? "bg-green-50 dark:bg-green-950/20"
                                        : ""
                                    }`}
                                  >
                                    ≥ {requisitos.EMBAJADOR_JUNIOR.ocupacion}%
                                  </td>
                                  <td
                                    className={`p-2 sm:p-3 text-center ${currentCategory === "EMBAJADOR" ? "bg-primary/5 dark:bg-primary/10" : ""} ${
                                      calcularMetricas(clasesInstructor, disciplina.id).ocupacion >=
                                      requisitos.EMBAJADOR.ocupacion
                                        ? "bg-green-50 dark:bg-green-950/20"
                                        : ""
                                    }`}
                                  >
                                    ≥ {requisitos.EMBAJADOR.ocupacion}%
                                  </td>
                                </tr>
                                <tr className="border-t border-border/30 hover:bg-muted/5">
                                  <td className="p-2 sm:p-3 font-medium">Locales en Lima</td>
                                  <td
                                    className={`p-2 sm:p-3 text-center ${currentCategory === "EMBAJADOR_JUNIOR" ? "bg-primary/5 dark:bg-primary/10" : ""} ${
                                      calcularMetricas(clasesInstructor, disciplina.id).localesEnLima >=
                                      requisitos.EMBAJADOR_JUNIOR.localesEnLima
                                        ? "bg-green-50 dark:bg-green-950/20"
                                        : ""
                                    }`}
                                  >
                                    ≥ {requisitos.EMBAJADOR_JUNIOR.localesEnLima}
                                  </td>
                                  <td
                                    className={`p-2 sm:p-3 text-center ${currentCategory === "EMBAJADOR" ? "bg-primary/5 dark:bg-primary/10" : ""} ${
                                      calcularMetricas(clasesInstructor, disciplina.id).localesEnLima >=
                                      requisitos.EMBAJADOR.localesEnLima
                                        ? "bg-green-50 dark:bg-green-950/20"
                                        : ""
                                    }`}
                                  >
                                    ≥ {requisitos.EMBAJADOR.localesEnLima}
                                  </td>
                                </tr>
                                <tr className="border-t border-border/30 hover:bg-muted/5">
                                  <td className="p-2 sm:p-3 font-medium">Clases</td>
                                  <td
                                    className={`p-2 sm:p-3 text-center ${currentCategory === "EMBAJADOR_JUNIOR" ? "bg-primary/5 dark:bg-primary/10" : ""} ${
                                      calcularMetricas(clasesInstructor, disciplina.id).clases >=
                                      requisitos.EMBAJADOR_JUNIOR.clases
                                        ? "bg-green-50 dark:bg-green-950/20"
                                        : ""
                                    }`}
                                  >
                                    ≥ {requisitos.EMBAJADOR_JUNIOR.clases}
                                  </td>
                                  <td
                                    className={`p-2 sm:p-3 text-center ${currentCategory === "EMBAJADOR" ? "bg-primary/5 dark:bg-primary/10" : ""} ${
                                      calcularMetricas(clasesInstructor, disciplina.id).clases >=
                                      requisitos.EMBAJADOR.clases
                                        ? "bg-green-50 dark:bg-green-950/20"
                                        : ""
                                    }`}
                                  >
                                    ≥ {requisitos.EMBAJADOR.clases}
                                  </td>
                                </tr>
                                <tr className="border-t border-border/30 hover:bg-muted/5">
                                  <td className="p-2 sm:p-3 font-medium">Dobleteos</td>
                                  <td
                                    className={`p-2 sm:p-3 text-center ${currentCategory === "EMBAJADOR_JUNIOR" ? "bg-primary/5 dark:bg-primary/10" : ""} ${
                                      (pagoSeleccionado.dobleteos || 0) >= requisitos.EMBAJADOR_JUNIOR.dobleteos
                                        ? "bg-green-50 dark:bg-green-950/20"
                                        : ""
                                    }`}
                                  >
                                    ≥ {requisitos.EMBAJADOR_JUNIOR.dobleteos}
                                  </td>
                                  <td
                                    className={`p-2 sm:p-3 text-center ${currentCategory === "EMBAJADOR" ? "bg-primary/5 dark:bg-primary/10" : ""} ${
                                      (pagoSeleccionado.dobleteos || 0) >= requisitos.EMBAJADOR.dobleteos
                                        ? "bg-green-50 dark:bg-green-950/20"
                                        : ""
                                    }`}
                                  >
                                    ≥ {requisitos.EMBAJADOR.dobleteos}
                                  </td>
                                </tr>
                                <tr className="border-t border-border/30 hover:bg-muted/5">
                                  <td className="p-2 sm:p-3 font-medium">Horarios No Prime</td>
                                  <td
                                    className={`p-2 sm:p-3 text-center ${currentCategory === "EMBAJADOR_JUNIOR" ? "bg-primary/5 dark:bg-primary/10" : ""} ${
                                      (pagoSeleccionado.horariosNoPrime || 0) >=
                                      requisitos.EMBAJADOR_JUNIOR.horariosNoPrime
                                        ? "bg-green-50 dark:bg-green-950/20"
                                        : ""
                                    }`}
                                  >
                                    ≥ {requisitos.EMBAJADOR_JUNIOR.horariosNoPrime}
                                  </td>
                                  <td
                                    className={`p-2 sm:p-3 text-center ${currentCategory === "EMBAJADOR" ? "bg-primary/5 dark:bg-primary/10" : ""} ${
                                      (pagoSeleccionado.horariosNoPrime || 0) >= requisitos.EMBAJADOR.horariosNoPrime
                                        ? "bg-green-50 dark:bg-green-950/20"
                                        : ""
                                    }`}
                                  >
                                    ≥ {requisitos.EMBAJADOR.horariosNoPrime}
                                  </td>
                                </tr>
                                <tr className="border-t border-border/30 hover:bg-muted/5">
                                  <td className="p-2 sm:p-3 font-medium">Participación en Eventos</td>
                                  <td
                                    className={`p-2 sm:p-3 text-center ${currentCategory === "EMBAJADOR_JUNIOR" ? "bg-primary/5 dark:bg-primary/10" : ""} ${
                                      !requisitos.EMBAJADOR_JUNIOR.participacionEventos ||
                                      pagoSeleccionado.participacionEventos
                                        ? "bg-green-50 dark:bg-green-950/20"
                                        : ""
                                    }`}
                                  >
                                    {requisitos.EMBAJADOR_JUNIOR.participacionEventos ? "Sí" : "No"}
                                  </td>
                                  <td
                                    className={`p-2 sm:p-3 text-center ${currentCategory === "EMBAJADOR" ? "bg-primary/5 dark:bg-primary/10" : ""} ${
                                      !requisitos.EMBAJADOR.participacionEventos || pagoSeleccionado.participacionEventos
                                        ? "bg-green-50 dark:bg-green-950/20"
                                        : ""
                                    }`}
                                  >
                                    {requisitos.EMBAJADOR.participacionEventos ? "Sí" : "No"}
                                  </td>
                                </tr>
                                <tr className="border-t border-border/30 hover:bg-muted/5">
                                  <td className="p-2 sm:p-3 font-medium">Cumple Lineamientos</td>
                                  <td
                                    className={`p-2 sm:p-3 text-center ${currentCategory === "EMBAJADOR_JUNIOR" ? "bg-primary/5 dark:bg-primary/10" : ""} ${
                                      pagoSeleccionado.cumpleLineamientos ? "bg-green-50 dark:bg-green-950/20" : ""
                                    }`}
                                  >
                                    Requerido
                                  </td>
                                  <td
                                    className={`p-2 sm:p-3 text-center ${currentCategory === "EMBAJADOR" ? "bg-primary/5 dark:bg-primary/10" : ""} ${
                                      pagoSeleccionado.cumpleLineamientos ? "bg-green-50 dark:bg-green-950/20" : ""
                                    }`}
                                  >
                                    Requerido
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )
                  })}
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