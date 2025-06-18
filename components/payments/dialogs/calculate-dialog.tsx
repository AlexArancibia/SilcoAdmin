"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Info } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Periodo, CategoriaInstructor } from "@/types/schema"

interface CalculateDialogProps {
  showCalculateDialog: boolean
  setShowCalculateDialog: (show: boolean) => void
  periodos: Periodo[]
  selectedPeriodoId: number | null
  setSelectedPeriodoId: (id: number | null) => void
  calcularPagosPeriodo: () => void
  // Props para categorías manuales
  instructores: any[]
  selectedInstructorId: number | null
  setSelectedInstructorId: (id: number | null) => void
  selectedDisciplinaId: number | null
  setSelectedDisciplinaId: (id: number | null) => void
  manualCategoria: CategoriaInstructor
  setManualCategoria: (categoria: CategoriaInstructor) => void
  manualCategorias: {
    instructorId: number
    disciplinaId: number
    categoria: CategoriaInstructor
  }[]
  agregarCategoriaManual: () => void
  eliminarCategoriaManual: (instructorId: number, disciplinaId: number) => void
  aplicarCategoriasManual: () => void
  isCalculatingPayments: boolean
}

export function CalculateDialog({
  showCalculateDialog,
  setShowCalculateDialog,
  periodos,
  selectedPeriodoId,
  setSelectedPeriodoId,
  calcularPagosPeriodo,
  // Props para categorías manuales
  instructores,
  selectedInstructorId,
  setSelectedInstructorId,
  selectedDisciplinaId,
  setSelectedDisciplinaId,
  manualCategoria,
  setManualCategoria,
  manualCategorias,
  agregarCategoriaManual,
  eliminarCategoriaManual,
  aplicarCategoriasManual,
  isCalculatingPayments,
}: CalculateDialogProps) {
  const [activeTab, setActiveTab] = useState("calcular")
  const [instructorSearch, setInstructorSearch] = useState("")

  // Establecer disciplina fija como Síclo (ID 1)
  const SICLO_DISCIPLINE_ID = 1

  // Asegurarse de que la disciplina seleccionada siempre sea Síclo
  if (selectedDisciplinaId !== SICLO_DISCIPLINE_ID) {
    setSelectedDisciplinaId(SICLO_DISCIPLINE_ID)
  }

  // Filtrar instructores basados en la búsqueda
  const filteredInstructores = instructores.filter((instructor) =>
    instructor.nombre.toLowerCase().includes(instructorSearch.toLowerCase()),
  )

  // Obtener nombre del instructor para mostrar en la tabla
  const getInstructorName = (instructorId: number) => {
    const instructor = instructores.find((i) => i.id === instructorId)
    return instructor ? instructor.nombre : `Instructor ID ${instructorId}`
  }

  // Categorías disponibles
  const categorias: CategoriaInstructor[] = ["INSTRUCTOR", "EMBAJADOR_JUNIOR", "EMBAJADOR", "EMBAJADOR_SENIOR"]

  // Función para manejar el cálculo de pagos
  const handleCalcularPagos = async () => {
    // Si hay categorías manuales, primero actualizarlas en la base de datos
    if (manualCategorias.length > 0) {
      // Primero aplicar las categorías manuales
      await aplicarCategoriasManual()
    }

    // Luego calcular los pagos
    calcularPagosPeriodo()
  }

  return (
    <AlertDialog open={showCalculateDialog} onOpenChange={setShowCalculateDialog}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Gestión de Pagos y Categorías</AlertDialogTitle>
          <AlertDialogDescription>
            Configure categorías manuales para instructores de Síclo y calcule los pagos.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calcular">Calcular Pagos</TabsTrigger>
            <TabsTrigger value="categorias">Categorías Manuales</TabsTrigger>
          </TabsList>

          {/* Pestaña de Cálculo de Pagos */}
          <TabsContent value="calcular" className="py-4 space-y-4">
            <div>
              <Label htmlFor="periodo-calculo">Periodo para calcular pagos</Label>
              <Select
                value={selectedPeriodoId?.toString() || ""}
                onValueChange={(value) => setSelectedPeriodoId(Number(value))}
              >
                <SelectTrigger id="periodo-calculo" className="w-full mt-1">
                  <SelectValue placeholder="Seleccionar periodo" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((periodo) => (
                    <SelectItem key={periodo.id} value={periodo.id.toString()}>
                      Periodo {periodo.numero} - {periodo.año}
                      {periodo.bonoCalculado ? " (Bono calculado)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {manualCategorias.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md text-sm flex items-start gap-2">
                <Info className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-700">Categorías manuales pendientes</p>
                  <p className="mt-1 text-yellow-600">
                    Hay {manualCategorias.length} categorías manuales pendientes de aplicar. Al calcular los pagos,
                    estas categorías se actualizarán permanentemente para los instructores seleccionados.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-muted/20 p-3 rounded-md text-sm">
              <p className="font-medium">Nota importante:</p>
              <p className="mt-1">
                Este proceso reevaluará automáticamente las categorías de todos los instructores basándose en sus
                métricas actuales, excepto para aquellos con categorías asignadas manualmente. Luego calculará los pagos
                utilizando las categorías actualizadas.
              </p>
              <p className="mt-1">
                Las categorías manuales configuradas en la pestaña "Categorías Manuales" tienen prioridad y no serán
                reevaluadas.
              </p>
            </div>
          </TabsContent>

          {/* Pestaña de Categorías Manuales */}
          <TabsContent value="categorias" className="py-4 space-y-6">
            {/* Formulario de asignación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instructor-select">Instructor</Label>
                <Select
                  value={selectedInstructorId?.toString() || ""}
                  onValueChange={(value) => setSelectedInstructorId(Number(value))}
                >
                  <SelectTrigger id="instructor-select" className="w-full">
                    <SelectValue placeholder="Buscar o seleccionar instructor" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    <div className="px-3 py-2 sticky top-0 bg-white z-10">
                      <Input
                        placeholder="Buscar instructor..."
                        value={instructorSearch}
                        onChange={(e) => setInstructorSearch(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    {filteredInstructores.length > 0 ? (
                      filteredInstructores.map((instructor) => (
                        <SelectItem key={instructor.id} value={instructor.id.toString()}>
                          {instructor.nombre}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No se encontraron instructores</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria-select">Categoría para Síclo</Label>
                <Select
                  value={manualCategoria}
                  onValueChange={(value) => setManualCategoria(value as CategoriaInstructor)}
                >
                  <SelectTrigger id="categoria-select" className="w-full">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={agregarCategoriaManual} className="w-full mt-2" disabled={!selectedInstructorId}>
                  Agregar Categoría
                </Button>
              </div>
            </div>

            {/* Tabla de categorías asignadas */}
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manualCategorias.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                        No hay categorías manuales asignadas
                      </TableCell>
                    </TableRow>
                  ) : (
                    manualCategorias.map((asignacion, index) => (
                      <TableRow key={`${asignacion.instructorId}-${asignacion.disciplinaId}`}>
                        <TableCell>{getInstructorName(asignacion.instructorId)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {asignacion.categoria.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarCategoriaManual(asignacion.instructorId, SICLO_DISCIPLINE_ID)}
                            title="Eliminar asignación"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="bg-muted/20 p-3 rounded-md text-sm">
              <p className="font-medium">Nota importante:</p>
              <p className="mt-1">
                Las categorías configuradas aquí se actualizarán permanentemente para los instructores cuando se
                calculen los pagos. Estas categorías reemplazarán las calculadas automáticamente y se mantendrán hasta
                que sean eliminadas manualmente.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleCalcularPagos} disabled={isCalculatingPayments || !selectedPeriodoId}>
            {isCalculatingPayments ? "Procesando..." : "Calcular Pagos"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
