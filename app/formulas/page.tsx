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
import type { Formula } from "@/types/formula"
import type { Disciplina, ParametrosDisciplina } from "@/types/schema"

export default function FormulasPage() {
  const { disciplinas, isLoading, error, fetchDisciplinas, actualizarDisciplina } = useDisciplinasStore()
  const [disciplinaSeleccionada, setDisciplinaSeleccionada] = useState<Disciplina | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isNewFormulaDialogOpen, setIsNewFormulaDialogOpen] = useState(false)
  const [nuevaFormulaNombre, setNuevaFormulaNombre] = useState("")
  const [nuevaFormulaDescripcion, setNuevaFormulaDescripcion] = useState("")
  const [disciplinaSeleccionadaId, setDisciplinaSeleccionadaId] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  // Cargar disciplinas al montar el componente
  useEffect(() => {
    fetchDisciplinas()
  }, [fetchDisciplinas])

  const handleCreateFormula = () => {
    setNuevaFormulaNombre("")
    setNuevaFormulaDescripcion("")
    setDisciplinaSeleccionadaId("")
    setIsNewFormulaDialogOpen(true)
  }

  const handleEditFormula = (disciplina: Disciplina) => {
    setDisciplinaSeleccionada(disciplina)
    setIsDialogOpen(true)
  }

  const handleDeleteFormula = (disciplina: Disciplina) => {
    setDisciplinaSeleccionada(disciplina)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteFormula = async () => {
    if (disciplinaSeleccionada) {
      setIsSaving(true)
      try {
        // Crear una copia de los parámetros sin la fórmula
        const nuevosParametros: ParametrosDisciplina = { ...(disciplinaSeleccionada.parametros || {}) }
        delete nuevosParametros.formula

        // Actualizar la disciplina sin la fórmula
        await actualizarDisciplina(disciplinaSeleccionada.id, {
          parametros: nuevosParametros,
        })

        toast({
          title: "Fórmula eliminada",
          description: `La fórmula de "${disciplinaSeleccionada.nombre}" ha sido eliminada.`,
        })

        // Recargar las disciplinas para actualizar la vista
        fetchDisciplinas()
      } catch (error) {
        toast({
          title: "Error al eliminar",
          description: error instanceof Error ? error.message : "Error desconocido",
          variant: "destructive",
        })
      } finally {
        setIsSaving(false)
        setIsDeleteDialogOpen(false)
        setDisciplinaSeleccionada(null)
      }
    }
  }

  const handleContinueNewFormula = () => {
    if (!disciplinaSeleccionadaId) {
      toast({
        title: "Error",
        description: "Debes seleccionar una disciplina",
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

    // Encontrar la disciplina seleccionada
    const disciplina = disciplinas.find((d) => d.id === Number.parseInt(disciplinaSeleccionadaId))

    if (!disciplina) {
      toast({
        title: "Error",
        description: "Disciplina no encontrada",
        variant: "destructive",
      })
      return
    }

    // Crear una fórmula vacía y asignarla a la disciplina seleccionada
    const nuevaFormula: Formula = {
      id: `formula-${Date.now()}`,
      nombre: nuevaFormulaNombre,
      descripcion: nuevaFormulaDescripcion,
      nodos: [],
      conexiones: [],
      nodoResultado: "",
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
    }

    // Crear una copia de la disciplina con la nueva fórmula
    const disciplinaConFormula = {
      ...disciplina,
      parametros: {
        ...(disciplina.parametros || {}),
        formula: nuevaFormula,
      },
    }

    setDisciplinaSeleccionada(disciplinaConFormula)
    setIsNewFormulaDialogOpen(false)
    setIsDialogOpen(true)
  }

  const handleSaveFormula = async (formula: Formula) => {
    if (!disciplinaSeleccionada) {
      toast({
        title: "Error",
        description: "No se encontró la disciplina seleccionada",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // Crear una copia de los parámetros con la fórmula actualizada
      const nuevosParametros: ParametrosDisciplina = {
        ...(disciplinaSeleccionada.parametros || {}),
        formula: formula,
      }

      // Actualizar la disciplina con la nueva fórmula
      await actualizarDisciplina(disciplinaSeleccionada.id, {
        parametros: nuevosParametros,
      })

      toast({
        title: "Fórmula guardada",
        description: `La fórmula para "${disciplinaSeleccionada.nombre}" ha sido guardada exitosamente.`,
      })

      // Recargar las disciplinas para actualizar la vista
      fetchDisciplinas()
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
      setIsDialogOpen(false)
      setDisciplinaSeleccionada(null)
    }
  }

  // Verificar si una disciplina ya tiene una fórmula asignada
  const disciplinaTieneFormula = (disciplina: Disciplina) => {
    return disciplina.parametros?.formula !== undefined
  }

  // Obtener disciplinas sin fórmula
  const disciplinasSinFormula = disciplinas.filter((d) => !disciplinaTieneFormula(d))

  // Obtener disciplinas con fórmula
  const disciplinasConFormula = disciplinas.filter((d) => disciplinaTieneFormula(d))

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Fórmulas de Cálculo"
        text="Gestiona las fórmulas personalizadas para el cálculo de pagos a instructores por disciplina."
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
            <CardTitle>Fórmulas por Disciplina</CardTitle>
            <CardDescription>
              Cada disciplina puede tener una fórmula personalizada para el cálculo de pagos a instructores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {disciplinasConFormula.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No hay fórmulas configuradas</AlertTitle>
                <AlertDescription>
                  Ninguna disciplina tiene una fórmula de cálculo configurada. Haz clic en "Nueva Fórmula" para crear
                  una.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Nombre de la Fórmula</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Última Actualización</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disciplinasConFormula.map((disciplina) => (
                    <TableRow key={disciplina.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          style={{ backgroundColor: disciplina.color ? `${disciplina.color}20` : undefined }}
                        >
                          {disciplina.nombre}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {disciplina.parametros?.formula?.nombre || "Sin nombre"}
                      </TableCell>
                      <TableCell>{disciplina.parametros?.formula?.descripcion || "Sin descripción"}</TableCell>
                      <TableCell>
                        {disciplina.parametros?.formula?.fechaActualizacion
                          ? new Date(disciplina.parametros.formula.fechaActualizacion).toLocaleDateString()
                          : new Date(disciplina.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="icon" onClick={() => handleEditFormula(disciplina)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDeleteFormula(disciplina)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                          <Button variant="outline" size="icon">
                            <Calculator className="h-4 w-4" />
                            <span className="sr-only">Probar</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diálogo para seleccionar disciplina y nombre de la nueva fórmula */}
      <Dialog open={isNewFormulaDialogOpen} onOpenChange={setIsNewFormulaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Fórmula</DialogTitle>
            <DialogDescription>
              Selecciona la disciplina y proporciona un nombre para la nueva fórmula.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="disciplina">Disciplina</Label>
              <Select value={disciplinaSeleccionadaId} onValueChange={setDisciplinaSeleccionadaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {disciplinasSinFormula.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      Todas las disciplinas ya tienen fórmulas asignadas
                    </div>
                  ) : (
                    disciplinasSinFormula.map((disciplina) => (
                      <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                        {disciplina.nombre}
                      </SelectItem>
                    ))
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
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={nuevaFormulaDescripcion}
                onChange={(e) => setNuevaFormulaDescripcion(e.target.value)}
                placeholder="Describe cómo funciona esta fórmula"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFormulaDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleContinueNewFormula} disabled={disciplinasSinFormula.length === 0}>
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
              {disciplinaSeleccionada
                ? `Editar Fórmula: ${disciplinaSeleccionada.parametros?.formula?.nombre || "Nueva fórmula"} (${disciplinaSeleccionada.nombre})`
                : "Nueva Fórmula"}
            </DialogTitle>
            <DialogDescription>
              Utiliza el constructor visual para crear o modificar la fórmula de cálculo.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {disciplinaSeleccionada && (
              <FormulaBuilder
                formula={disciplinaSeleccionada.parametros?.formula}
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
              ¿Estás seguro de que deseas eliminar la fórmula de "{disciplinaSeleccionada?.nombre}"? Esta acción no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteFormula} disabled={isSaving}>
              {isSaving ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}

