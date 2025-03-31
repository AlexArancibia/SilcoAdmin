"use client"

import { useState, useEffect } from "react"
import { PlusCircle, Edit, Trash2, Calculator, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { FormulaBuilder } from "@/components/formula-builder/formula-builder"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import type { Formula } from "@/types/formula"
import type { Disciplina, FormulaDB, Periodo } from "@/types/schema"
import { useFormulasStore } from "@/store/useFormulaStore"

export default function FormulasPage() {
  const { disciplinas, isLoading: isLoadingDisciplinas, fetchDisciplinas } = useDisciplinasStore()
  const { periodos, fetchPeriodos } = usePeriodosStore()
  const {
    formulas,
    formulaSeleccionada,
    isLoading: isLoadingFormulas,
    error,
    fetchFormulas,
    fetchFormulasPorDisciplina,
    fetchFormulaPorDisciplinaYPeriodo,
    crearFormula,
    actualizarFormula,
    eliminarFormula,
    seleccionarFormula
  } = useFormulasStore()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isNewFormulaDialogOpen, setIsNewFormulaDialogOpen] = useState(false)
  const [nuevaFormulaNombre, setNuevaFormulaNombre] = useState("")
  const [nuevaFormulaDescripcion, setNuevaFormulaDescripcion] = useState("")
  const [disciplinaSeleccionadaId, setDisciplinaSeleccionadaId] = useState<string>("")
  const [periodoSeleccionadoId, setPeriodoSeleccionadoId] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    fetchDisciplinas()
    fetchPeriodos()
    fetchFormulas()
  }, [fetchDisciplinas, fetchPeriodos, fetchFormulas])

  const handleCreateFormula = () => {
    setNuevaFormulaNombre("")
    setNuevaFormulaDescripcion("")
    setDisciplinaSeleccionadaId("")
    setPeriodoSeleccionadoId("")
    setIsNewFormulaDialogOpen(true)
  }

  const handleEditFormula = (formula: FormulaDB) => {
    seleccionarFormula(formula)
    setIsDialogOpen(true)
  }

  const handleDeleteFormula = (formula: FormulaDB) => {
    seleccionarFormula(formula)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteFormula = async () => {
    if (formulaSeleccionada) {
      setIsSaving(true)
      try {
        await eliminarFormula(formulaSeleccionada.id)
        
        toast({
          title: "Fórmula eliminada",
          description: `La fórmula "${formulaSeleccionada.parametros.formula.nombre}" ha sido eliminada.`,
        })

        fetchFormulas()
      } catch (error) {
        toast({
          title: "Error al eliminar",
          description: error instanceof Error ? error.message : "Error desconocido",
          variant: "destructive",
        })
      } finally {
        setIsSaving(false)
        setIsDeleteDialogOpen(false)
        seleccionarFormula(null)
      }
    }
  }

  const handleContinueNewFormula = async () => {
    if (!disciplinaSeleccionadaId || !periodoSeleccionadoId) {
      toast({
        title: "Error",
        description: "Debes seleccionar una disciplina y un período",
        variant: "destructive",
      })
      return
    }

    if (!nuevaFormulaNombre) {
      toast({
        title: "Error",
        description: "El nombre de la fórmula es requerido",
        variant: "destructive",
      })
      return
    }

    const disciplinaId = Number(disciplinaSeleccionadaId)
    const periodoId = Number(periodoSeleccionadoId)

    // Verificar si ya existe una fórmula para esta disciplina y período
    try {
      const existeFormula = await fetchFormulaPorDisciplinaYPeriodo(disciplinaId, periodoId)
      
      if (existeFormula) {
        toast({
          title: "Error",
          description: "Ya existe una fórmula para esta disciplina y período",
          variant: "destructive",
        })
        return
      }

      // Crear una fórmula vacía
      const nuevaFormula: Formula = {
        id: `formula-${Date.now()}`,
        nombre: nuevaFormulaNombre,
        descripcion: nuevaFormulaDescripcion,
        nodos: [],
        conexiones: [],
        nodoResultado: "",
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        disciplinaId,
        periodoId
      }

      // Crear el objeto FormulaDB para previsualización
      const formulaPreview: FormulaDB = {
        id: 0, // Temporal hasta que se guarde
        disciplinaId,
        periodoId,
        parametros: {
          formula: nuevaFormula
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        disciplina: disciplinas.find(d => d.id === disciplinaId),
        periodo: periodos.find(p => p.id === periodoId)
      }

      seleccionarFormula(formulaPreview)
      setIsNewFormulaDialogOpen(false)
      setIsDialogOpen(true)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al verificar fórmula existente",
        variant: "destructive",
      })
    }
  }

  const handleSaveFormula = async (formula: Formula) => {
    if (!formulaSeleccionada) {
      toast({
        title: "Error",
        description: "No se encontró la fórmula seleccionada",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // Actualizar la fórmula con los datos del builder
      const formulaActualizada = {
        ...formula,
        fechaActualizacion: new Date()
      }

      if (formulaSeleccionada.id === 0) {
        // Crear nueva fórmula
        await crearFormula({
          disciplinaId: formulaSeleccionada.disciplinaId,
          periodoId: formulaSeleccionada.periodoId,
          parametros: {
            formula: formulaActualizada
          }
        })
        
        toast({
          title: "Fórmula creada",
          description: `La fórmula "${formulaActualizada.nombre}" ha sido creada exitosamente.`,
        })
      } else {
        // Actualizar fórmula existente
        await actualizarFormula(formulaSeleccionada.id, {
          formula: formulaActualizada
        })
        
        toast({
          title: "Fórmula actualizada",
          description: `La fórmula "${formulaActualizada.nombre}" ha sido actualizada exitosamente.`,
        })
      }

      fetchFormulas()
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
      setIsDialogOpen(false)
      seleccionarFormula(null)
    }
  }

  // Obtener disciplinas disponibles para nuevas fórmulas (sin fórmula en el período actual)
  const getDisciplinasDisponibles = () => {
    if (!periodoSeleccionadoId) return disciplinas
    
    const periodoId = Number(periodoSeleccionadoId)
    const disciplinasConFormula = formulas
      .filter(f => f.periodoId === periodoId)
      .map(f => f.disciplinaId)
    
    return disciplinas.filter(d => !disciplinasConFormula.includes(d.id))
  }

  const isLoading = isLoadingDisciplinas || isLoadingFormulas

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Fórmulas de Cálculo"
        text="Gestiona las fórmulas personalizadas para el cálculo de pagos a instructores por disciplina y período."
      >
        <Button onClick={handleCreateFormula}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Fórmula
        </Button>
      </DashboardHeader>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-8 w-full bg-muted animate-pulse rounded"></div>
          <div className="h-64 w-full bg-muted animate-pulse rounded"></div>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}. Por favor, intenta recargar la página.</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Fórmulas por Disciplina y Período</CardTitle>
            <CardDescription>
              Cada disciplina puede tener fórmulas personalizadas para diferentes períodos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formulas.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No hay fórmulas configuradas</AlertTitle>
                <AlertDescription>
                  No se han creado fórmulas de cálculo. Haz clic en "Nueva Fórmula" para crear una.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Nombre de la Fórmula</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Última Actualización</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formulas.map((formula) => {
                    const disciplina = disciplinas.find(d => d.id === formula.disciplinaId)
                    const periodo = periodos.find(p => p.id === formula.periodoId)
                    
                    return (
                      <TableRow key={formula.id}>
                        <TableCell>
                          <Badge
                            variant="outline"
                            style={{ backgroundColor: disciplina?.color ? `${disciplina.color}20` : undefined }}
                          >
                            {disciplina?.nombre || `Disciplina ${formula.disciplinaId}`}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {periodo ? `Periodo ${periodo.numero} - ${periodo.año}` : `Periodo ${formula.periodoId}`}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formula.parametros.formula?.nombre || "Sin nombre"}
                        </TableCell>
                        <TableCell>{formula.parametros.formula?.descripcion || "Sin descripción"}</TableCell>
                        <TableCell>
                          {new Date(formula.updatedAt!).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="icon" onClick={() => handleEditFormula(formula)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => handleDeleteFormula(formula)}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diálogo para seleccionar disciplina, período y nombre de la nueva fórmula */}
      <Dialog open={isNewFormulaDialogOpen} onOpenChange={setIsNewFormulaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Fórmula</DialogTitle>
            <DialogDescription>
              Selecciona la disciplina, el período y proporciona un nombre para la nueva fórmula.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="periodo">Período</Label>
              <Select 
                value={periodoSeleccionadoId} 
                onValueChange={setPeriodoSeleccionadoId}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((periodo) => (
                    <SelectItem key={periodo.id} value={periodo.id.toString()}>
                      Periodo {periodo.numero} - {periodo.año}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="disciplina">Disciplina</Label>
              <Select 
                value={disciplinaSeleccionadaId} 
                onValueChange={setDisciplinaSeleccionadaId}
                disabled={!periodoSeleccionadoId || isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {periodoSeleccionadoId ? (
                    getDisciplinasDisponibles().length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        Todas las disciplinas ya tienen fórmulas asignadas para este período
                      </div>
                    ) : (
                      getDisciplinasDisponibles().map((disciplina) => (
                        <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                          {disciplina.nombre}
                        </SelectItem>
                      ))
                    )
                  ) : (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      Selecciona un período primero
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre de la Fórmula</Label>
              <Input
                id="nombre"
                value={nuevaFormulaNombre}
                onChange={(e) => setNuevaFormulaNombre(e.target.value)}
                placeholder="Ej: Fórmula de pago estándar"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={nuevaFormulaDescripcion}
                onChange={(e) => setNuevaFormulaDescripcion(e.target.value)}
                placeholder="Describe cómo funciona esta fórmula"
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsNewFormulaDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleContinueNewFormula} 
              disabled={
                !periodoSeleccionadoId || 
                !disciplinaSeleccionadaId || 
                !nuevaFormulaNombre || 
                isLoading ||
                getDisciplinasDisponibles().length === 0
              }
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar fórmula con el constructor visual */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[90rem]">
          <DialogHeader>
            <DialogTitle>
              {formulaSeleccionada ? (
                <>
                  {formulaSeleccionada.id === 0 ? "Crear" : "Editar"} Fórmula:{" "}
                  {formulaSeleccionada.parametros.formula?.nombre || "Nueva fórmula"}
                  <span className="text-muted-foreground ml-2">
                    ({disciplinas.find(d => d.id === formulaSeleccionada.disciplinaId)?.nombre} -{" "}
                    {periodos.find(p => p.id === formulaSeleccionada.periodoId) 
                      ? `Periodo ${periodos.find(p => p.id === formulaSeleccionada.periodoId)?.numero} - ${periodos.find(p => p.id === formulaSeleccionada.periodoId)?.año}`
                      : `Periodo ${formulaSeleccionada.periodoId}`})
                  </span>
                </>
              ) : (
                "Nueva Fórmula"
              )}
            </DialogTitle>
            <DialogDescription>
              Utiliza el constructor visual para crear o modificar la fórmula de cálculo.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {formulaSeleccionada && (
              <FormulaBuilder
                formula={formulaSeleccionada.parametros.formula}
                onSave={handleSaveFormula}
                isLoading={isSaving}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la fórmula "{formulaSeleccionada?.parametros.formula?.nombre}"? 
              <br />
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)} 
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteFormula} 
              disabled={isSaving}
            >
              {isSaving ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}