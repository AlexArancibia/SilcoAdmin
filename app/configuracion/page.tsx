"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, isValid, addDays, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Check, Edit, Info, Loader2, Plus, Trash2, CalendarIcon } from "lucide-react"
import type { Periodo } from "@/types/schema"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export default function ConfiguracionPage() {
  const router = useRouter()
  const { periodos, periodoActual, isLoading, error, fetchPeriodos, crearPeriodo, actualizarPeriodo, eliminarPeriodo } =
    usePeriodosStore()

  const [activeTab, setActiveTab] = useState("periodos")
  const [openDialog, setOpenDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedPeriodo, setSelectedPeriodo] = useState<Periodo | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState("")

  // Estado para el formulario de nuevo periodo
  const [nuevoPeriodo, setNuevoPeriodo] = useState({
    numero: 0,
    año: new Date().getFullYear(),
    fechaInicio: new Date(),
    fechaFin: new Date(),
    fechaPago: new Date(),
    bonoCalculado: false,
  })

  // Estado para el formulario de edición
  const [periodoEditado, setPeriodoEditado] = useState<Partial<Periodo>>({
    numero: 0,
    año: 0,
    fechaInicio: new Date(),
    fechaFin: new Date(),
    fechaPago: new Date(),
  })

  // Cargar periodos al montar el componente
  useEffect(() => {
    fetchPeriodos()
  }, [fetchPeriodos])

  // Ordenar periodos por fecha
  const periodosOrdenados = [...periodos].sort((a, b) => {
    const fechaA = new Date(a.fechaInicio).getTime()
    const fechaB = new Date(b.fechaInicio).getTime()
    return fechaA - fechaB
  })

  // Verificar si hay gaps entre periodos
  const periodosConGaps = periodosOrdenados.reduce<{ periodo: Periodo; gap: number }[]>((acc, periodo, index) => {
    if (index === 0) return acc

    const periodoAnterior = periodosOrdenados[index - 1]
    const fechaFinAnterior = new Date(periodoAnterior.fechaFin)
    const fechaInicio = new Date(periodo.fechaInicio)

    // Añadir un día a la fecha fin anterior para calcular el gap
    const fechaSiguienteEsperada = addDays(fechaFinAnterior, 1)

    // Calcular la diferencia en días
    const gap = differenceInDays(fechaInicio, fechaSiguienteEsperada)

    if (gap > 0) {
      acc.push({
        periodo,
        gap,
      })
    }

    return acc
  }, [])

  // Función para formatear fechas
  const formatFecha = (fecha: string | Date) => {
    if (!fecha) return ""
    const date = typeof fecha === "string" ? new Date(fecha) : fecha
    return isValid(date) ? format(date, "dd MMM yyyy", { locale: es }) : ""
  }

  // Función para sugerir fecha de inicio para un nuevo periodo
  const sugerirFechaInicio = () => {
    if (periodosOrdenados.length === 0) {
      return new Date()
    }

    const ultimoPeriodo = periodosOrdenados[periodosOrdenados.length - 1]
    const fechaFinUltimo = new Date(ultimoPeriodo.fechaFin)
    // Añadir 1 día a la fecha fin del último periodo
    return addDays(fechaFinUltimo, 1)
  }

  // Función para sugerir número de periodo
  const sugerirNumeroPeriodo = () => {
    if (periodosOrdenados.length === 0) return 1

    const ultimoPeriodo = periodosOrdenados[periodosOrdenados.length - 1]
    const ultimoNumero = ultimoPeriodo.numero
    const ultimoAño = ultimoPeriodo.año
    const añoActual = new Date().getFullYear()

    if (ultimoAño < añoActual) {
      return 1 // Nuevo año, empezar desde 1
    }

    return ultimoNumero + 1
  }

  // Función para validar el formulario
  const validarFormulario = (data: any) => {
    const errores: Record<string, string> = {}

    if (!data.numero || data.numero <= 0) {
      errores.numero = "El número de periodo debe ser mayor a 0"
    }

    if (!data.año || data.año < 2000 || data.año > 2100) {
      errores.año = "El año debe estar entre 2000 y 2100"
    }

    if (!data.fechaInicio) {
      errores.fechaInicio = "La fecha de inicio es obligatoria"
    }

    if (!data.fechaFin) {
      errores.fechaFin = "La fecha de fin es obligatoria"
    } else if (data.fechaInicio && new Date(data.fechaFin) <= new Date(data.fechaInicio)) {
      errores.fechaFin = "La fecha de fin debe ser posterior a la fecha de inicio"
    }

    if (!data.fechaPago) {
      errores.fechaPago = "La fecha de pago es obligatoria"
    }

    return errores
  }

  // Función para crear un nuevo periodo
  const handleCrearPeriodo = async () => {
    const errores = validarFormulario(nuevoPeriodo)

    if (Object.keys(errores).length > 0) {
      setFormErrors(errores)
      return
    }

    try {
      await crearPeriodo({
        numero: nuevoPeriodo.numero,
        año: nuevoPeriodo.año,
        fechaInicio: nuevoPeriodo.fechaInicio,
        fechaFin: nuevoPeriodo.fechaFin,
        fechaPago: nuevoPeriodo.fechaPago,
        bonoCalculado: nuevoPeriodo.bonoCalculado,
      })

      setOpenDialog(false)
      setSuccessMessage("Periodo creado correctamente")
      setTimeout(() => setSuccessMessage(""), 3000)

      // Resetear formulario
      setNuevoPeriodo({
        numero: 0,
        año: new Date().getFullYear(),
        fechaInicio: new Date(),
        fechaFin: new Date(),
        fechaPago: new Date(),
        bonoCalculado: false,
      })
      setFormErrors({})
    } catch (error) {
      console.error("Error al crear periodo:", error)
    }
  }

  // Función para actualizar un periodo
  const handleActualizarPeriodo = async () => {
    if (!selectedPeriodo) return

    const errores = validarFormulario(periodoEditado)

    if (Object.keys(errores).length > 0) {
      setFormErrors(errores)
      return
    }

    try {
      await actualizarPeriodo(selectedPeriodo.id, periodoEditado)

      setOpenEditDialog(false)
      setSuccessMessage("Periodo actualizado correctamente")
      setTimeout(() => setSuccessMessage(""), 3000)
      setFormErrors({})
    } catch (error) {
      console.error("Error al actualizar periodo:", error)
    }
  }

  // Función para eliminar un periodo
  const handleEliminarPeriodo = async () => {
    if (!selectedPeriodo) return

    try {
      await eliminarPeriodo(selectedPeriodo.id)

      setOpenDeleteDialog(false)
      setSuccessMessage("Periodo eliminado correctamente")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      console.error("Error al eliminar periodo:", error)
    }
  }

  // Función para abrir el diálogo de edición
  const abrirDialogoEdicion = (periodo: Periodo) => {
    setSelectedPeriodo(periodo)
    setPeriodoEditado({
      numero: periodo.numero,
      año: periodo.año,
      fechaInicio: new Date(periodo.fechaInicio),
      fechaFin: new Date(periodo.fechaFin),
      fechaPago: new Date(periodo.fechaPago),
    })
    setFormErrors({})
    setOpenEditDialog(true)
  }

  // Función para abrir el diálogo de eliminación
  const abrirDialogoEliminacion = (periodo: Periodo) => {
    setSelectedPeriodo(periodo)
    setOpenDeleteDialog(true)
  }

  // Función para abrir el diálogo de creación
  const abrirDialogoCreacion = () => {
    const fechaInicio = sugerirFechaInicio()
    const fechaFin = addDays(fechaInicio, 28) // 28 días después de la fecha de inicio
    const fechaPago = addDays(fechaFin, 14) // 14 días después de la fecha de fin

    const nuevoPeriodoTemp = {
      numero: sugerirNumeroPeriodo(),
      año: new Date().getFullYear(),
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
      fechaPago: fechaPago,
      bonoCalculado: false,
    }
    setNuevoPeriodo(nuevoPeriodoTemp)
    setFormErrors({})
    setOpenDialog(true)
  }

  return (
    <div className="container py-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Configuración del Sistema
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Administra los periodos y configuraciones generales</p>
        </div>
      </div>

      {successMessage && (
        <Alert className="mb-4 bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-400">Éxito</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">{successMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full mb-4 bg-muted/30 p-1 rounded-lg">
          <TabsTrigger
            value="periodos"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-purple-500 data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Periodos
          </TabsTrigger>
          <TabsTrigger
            value="configuracion"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-purple-500 data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Configuración General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="periodos" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestión de Periodos</h2>
            <Button onClick={abrirDialogoCreacion} className="bg-purple-500 hover:bg-purple-600">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Periodo
            </Button>
          </div>

          {periodosConGaps.length > 0 && (
            <Alert className="mb-4 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-800 dark:text-amber-400">Atención</AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                Se detectaron {periodosConGaps.length} periodos con días sin cubrir entre ellos.
                <ul className="mt-2 list-disc list-inside">
                  {periodosConGaps.map(({ periodo, gap }) => (
                    <li key={periodo.id}>
                      {gap} día{gap !== 1 ? "s" : ""} sin cubrir antes del periodo {periodo.numero}/{periodo.año}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : periodosOrdenados.length === 0 ? (
            <Card className="border-dashed border-2 border-muted">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">No hay periodos configurados</p>
                <Button onClick={abrirDialogoCreacion} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primer periodo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Periodo</TableHead>
                      <TableHead>Fecha Inicio</TableHead>
                      <TableHead>Fecha Fin</TableHead>
                      <TableHead>Fecha Pago</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Bono</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periodosOrdenados.map((periodo) => {
                      const esActual = periodoActual?.id === periodo.id
                      const fechaActual = new Date()
                      const fechaInicio = new Date(periodo.fechaInicio)
                      const fechaFin = new Date(periodo.fechaFin)

                      let estado = "Futuro"
                      let colorEstado =
                        "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900"

                      if (fechaActual >= fechaInicio && fechaActual <= fechaFin) {
                        estado = "Actual"
                        colorEstado =
                          "bg-green-50 text-green-600 border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900"
                      } else if (fechaActual > fechaFin) {
                        estado = "Pasado"
                        colorEstado =
                          "bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-950/20 dark:text-slate-400 dark:border-slate-900"
                      }

                      return (
                        <TableRow key={periodo.id} className={esActual ? "bg-purple-50/30 dark:bg-purple-950/10" : ""}>
                          <TableCell className="font-medium">
                            {periodo.numero}/{periodo.año}
                          </TableCell>
                          <TableCell>{formatFecha(periodo.fechaInicio)}</TableCell>
                          <TableCell>{formatFecha(periodo.fechaFin)}</TableCell>
                          <TableCell>{formatFecha(periodo.fechaPago)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={colorEstado}>
                              {estado}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                periodo.bonoCalculado
                                  ? "bg-green-50 text-green-600 border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900"
                                  : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900"
                              }
                            >
                              {periodo.bonoCalculado ? "Calculado" : "Pendiente"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => abrirDialogoEdicion(periodo)}
                                className="h-8 w-8 text-slate-600 hover:text-purple-500"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => abrirDialogoEliminacion(periodo)}
                                className="h-8 w-8 text-slate-600 hover:text-red-500"
                              >
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
              </CardContent>
            </Card>
          )}

          {/* Diálogo para crear nuevo periodo */}
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Periodo</DialogTitle>
                <DialogDescription>
                  Completa la información para crear un nuevo periodo en el sistema.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número de Periodo</Label>
                    <Input
                      id="numero"
                      type="number"
                      value={nuevoPeriodo.numero}
                      onChange={(e) =>
                        setNuevoPeriodo({ ...nuevoPeriodo, numero: Number.parseInt(e.target.value) || 0 })
                      }
                      placeholder="Ej: 1"
                      className={formErrors.numero ? "border-red-300" : ""}
                    />
                    {formErrors.numero && <p className="text-xs text-red-500">{formErrors.numero}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="año">Año</Label>
                    <Input
                      id="año"
                      type="number"
                      value={nuevoPeriodo.año}
                      onChange={(e) =>
                        setNuevoPeriodo({
                          ...nuevoPeriodo,
                          año: Number.parseInt(e.target.value) || new Date().getFullYear(),
                        })
                      }
                      placeholder="Ej: 2023"
                      className={formErrors.año ? "border-red-300" : ""}
                    />
                    {formErrors.año && <p className="text-xs text-red-500">{formErrors.año}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !nuevoPeriodo.fechaInicio && "text-muted-foreground",
                            formErrors.fechaInicio && "border-red-300",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {nuevoPeriodo.fechaInicio
                            ? format(nuevoPeriodo.fechaInicio, "PPP", { locale: es })
                            : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={nuevoPeriodo.fechaInicio}
                          onSelect={(date) => {
                            if (date) {
                              const fechaInicio = date
                              const fechaFin = addDays(fechaInicio, 28)
                              const fechaPago = addDays(fechaFin, 14)

                              setNuevoPeriodo({
                                ...nuevoPeriodo,
                                fechaInicio: fechaInicio,
                                fechaFin: fechaFin,
                                fechaPago: fechaPago,
                              })
                            }
                          }}
                          locale={es}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {formErrors.fechaInicio && <p className="text-xs text-red-500">{formErrors.fechaInicio}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fechaFin">Fecha de Fin</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !nuevoPeriodo.fechaFin && "text-muted-foreground",
                            formErrors.fechaFin && "border-red-300",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {nuevoPeriodo.fechaFin
                            ? format(nuevoPeriodo.fechaFin, "PPP", { locale: es })
                            : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={nuevoPeriodo.fechaFin}
                          onSelect={(date) => {
                            if (date) {
                              const fechaFin = date
                              setNuevoPeriodo({
                                ...nuevoPeriodo,
                                fechaFin: fechaFin,
                                fechaPago: addDays(fechaFin, 14),
                              })
                            }
                          }}
                          locale={es}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {formErrors.fechaFin && <p className="text-xs text-red-500">{formErrors.fechaFin}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fechaPago">Fecha de Pago</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !nuevoPeriodo.fechaPago && "text-muted-foreground",
                            formErrors.fechaPago && "border-red-300",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {nuevoPeriodo.fechaPago
                            ? format(nuevoPeriodo.fechaPago, "PPP", { locale: es })
                            : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={nuevoPeriodo.fechaPago}
                          onSelect={(date) => date && setNuevoPeriodo({ ...nuevoPeriodo, fechaPago: date })}
                          locale={es}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {formErrors.fechaPago && <p className="text-xs text-red-500">{formErrors.fechaPago}</p>}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="bonoCalculado"
                    checked={nuevoPeriodo.bonoCalculado}
                    onChange={(e) => setNuevoPeriodo({ ...nuevoPeriodo, bonoCalculado: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <Label htmlFor="bonoCalculado" className="text-sm">
                    Bono calculado
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCrearPeriodo} className="bg-purple-500 hover:bg-purple-600">
                  Crear Periodo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Diálogo para editar periodo */}
          <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Editar Periodo</DialogTitle>
                <DialogDescription>Modifica la información del periodo seleccionado.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-numero">Número de Periodo</Label>
                    <Input
                      id="edit-numero"
                      type="number"
                      value={periodoEditado.numero}
                      onChange={(e) =>
                        setPeriodoEditado({ ...periodoEditado, numero: Number.parseInt(e.target.value) || 0 })
                      }
                      placeholder="Ej: 1"
                      className={formErrors.numero ? "border-red-300" : ""}
                    />
                    {formErrors.numero && <p className="text-xs text-red-500">{formErrors.numero}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-año">Año</Label>
                    <Input
                      id="edit-año"
                      type="number"
                      value={periodoEditado.año}
                      onChange={(e) =>
                        setPeriodoEditado({
                          ...periodoEditado,
                          año: Number.parseInt(e.target.value) || new Date().getFullYear(),
                        })
                      }
                      placeholder="Ej: 2023"
                      className={formErrors.año ? "border-red-300" : ""}
                    />
                    {formErrors.año && <p className="text-xs text-red-500">{formErrors.año}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-fechaInicio">Fecha de Inicio</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !periodoEditado.fechaInicio && "text-muted-foreground",
                            formErrors.fechaInicio && "border-red-300",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {periodoEditado.fechaInicio
                            ? format(
                                periodoEditado.fechaInicio instanceof Date
                                  ? periodoEditado.fechaInicio
                                  : new Date(periodoEditado.fechaInicio as string),
                                "PPP",
                                { locale: es },
                              )
                            : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={
                            periodoEditado.fechaInicio instanceof Date
                              ? periodoEditado.fechaInicio
                              : new Date(periodoEditado.fechaInicio as unknown as string)
                          }
                          onSelect={(date) => {
                            if (date) {
                              const fechaInicio = date
                              setPeriodoEditado({
                                ...periodoEditado,
                                fechaInicio: fechaInicio,
                                fechaFin: addDays(fechaInicio, 28),
                                fechaPago: addDays(addDays(fechaInicio, 28), 14),
                              })
                            }
                          }}
                          locale={es}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {formErrors.fechaInicio && <p className="text-xs text-red-500">{formErrors.fechaInicio}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-fechaFin">Fecha de Fin</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !periodoEditado.fechaFin && "text-muted-foreground",
                            formErrors.fechaFin && "border-red-300",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {periodoEditado.fechaFin
                            ? format(
                                periodoEditado.fechaFin instanceof Date
                                  ? periodoEditado.fechaFin
                                  : new Date(periodoEditado.fechaFin as string),
                                "PPP",
                                { locale: es },
                              )
                            : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={
                            periodoEditado.fechaFin instanceof Date
                              ? periodoEditado.fechaFin
                              : new Date(periodoEditado.fechaFin as unknown as string)
                          }
                          onSelect={(date) => {
                            if (date) {
                              const fechaFin = date
                              setPeriodoEditado({
                                ...periodoEditado,
                                fechaFin: fechaFin,
                                fechaPago: addDays(fechaFin, 14),
                              })
                            }
                          }}
                          locale={es}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {formErrors.fechaFin && <p className="text-xs text-red-500">{formErrors.fechaFin}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-fechaPago">Fecha de Pago</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !periodoEditado.fechaPago && "text-muted-foreground",
                            formErrors.fechaPago && "border-red-300",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {periodoEditado.fechaPago
                            ? format(
                                periodoEditado.fechaPago instanceof Date
                                  ? periodoEditado.fechaPago
                                  : new Date(periodoEditado.fechaPago as string),
                                "PPP",
                                { locale: es },
                              )
                            : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={
                            periodoEditado.fechaPago instanceof Date
                              ? periodoEditado.fechaPago
                              : new Date(periodoEditado.fechaPago as unknown as string)
                          }
                          onSelect={(date) => date && setPeriodoEditado({ ...periodoEditado, fechaPago: date })}
                          locale={es}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {formErrors.fechaPago && <p className="text-xs text-red-500">{formErrors.fechaPago}</p>}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenEditDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleActualizarPeriodo} className="bg-purple-500 hover:bg-purple-600">
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Diálogo para confirmar eliminación */}
          <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará el periodo {selectedPeriodo?.numero}/{selectedPeriodo?.año} y no se puede
                  deshacer. Los datos asociados a este periodo podrían verse afectados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleEliminarPeriodo} className="bg-red-500 hover:bg-red-600">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        <TabsContent value="configuracion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>Ajusta la configuración general del sistema.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Nombre del Sitio</Label>
                <Input id="siteName" defaultValue="Sistema de Gestión de Instructores" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Zona Horaria</Label>
                <select
                  id="timezone"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="America/Lima">America/Lima (GMT-5)</option>
                  <option value="America/Bogota">America/Bogota (GMT-5)</option>
                  <option value="America/Santiago">America/Santiago (GMT-4)</option>
                  <option value="America/Mexico_City">America/Mexico_City (GMT-6)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultCurrency">Moneda Predeterminada</Label>
                <select
                  id="defaultCurrency"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="PEN">Sol Peruano (PEN)</option>
                  <option value="USD">Dólar Estadounidense (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="COP">Peso Colombiano (COP)</option>
                </select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline">Cancelar</Button>
              <Button className="bg-purple-500 hover:bg-purple-600">Guardar Configuración</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuración de Notificaciones</CardTitle>
              <CardDescription>Configura las notificaciones del sistema.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Notificaciones por correo</h4>
                  <p className="text-sm text-muted-foreground">Recibe notificaciones por correo electrónico</p>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
                  </label>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Notificaciones en el sistema</h4>
                  <p className="text-sm text-muted-foreground">Recibe notificaciones dentro del sistema</p>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
                  </label>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Recordatorios de periodos</h4>
                  <p className="text-sm text-muted-foreground">
                    Recibe recordatorios sobre el inicio y fin de periodos
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
                  </label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline">Cancelar</Button>
              <Button className="bg-purple-500 hover:bg-purple-600">Guardar Configuración</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
