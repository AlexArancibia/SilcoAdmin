"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info, Plus, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { FormulaDB, RequisitosCategoria, ParametrosPago, CategoriaInstructor } from "@/types/schema"

interface EditParametersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formula: FormulaDB | null
  disciplinas: any[]
  isSaving: boolean
  setIsSaving: (isSaving: boolean) => void
  crearFormula: (formula: any) => Promise<any>
  actualizarFormula: (id: number, formula: any) => Promise<any>
  fetchFormulas: () => Promise<void>
  seleccionarFormula: (formula: any) => void
}

export function EditParametersDialog({
  open,
  onOpenChange,
  formula,
  disciplinas,
  isSaving,
  setIsSaving,
  crearFormula,
  actualizarFormula,
  fetchFormulas,
  seleccionarFormula,
}: EditParametersDialogProps) {
  // Instructor types
  const tiposInstructor = ["INSTRUCTOR", "EMBAJADOR_JUNIOR", "EMBAJADOR", "EMBAJADOR_SENIOR"]

  // State for requirements and payment parameters
  const [requisitosCategoria, setRequisitosCategoria] = useState<Record<string, RequisitosCategoria>>({})
  const [parametrosPago, setParametrosPago] = useState<Record<string, ParametrosPago>>({})
  const [tarifaSimple, setTarifaSimple] = useState(false)
  const [activeTab, setActiveTab] = useState("tarifas")

  // State to store original values for dialog
  const [originalParametrosPago, setOriginalParametrosPago] = useState<Record<string, ParametrosPago>>({})
  const [originalRequisitosCategoria, setOriginalRequisitosCategoria] = useState<Record<string, RequisitosCategoria>>(
    {},
  )
  const [originalTarifaSimple, setOriginalTarifaSimple] = useState(false)

  // Initialize state when dialog opens
  useEffect(() => {
    if (open && formula) {
      // Editing existing formula - only set these values once when the dialog opens
      if (formula.requisitosCategoria) {
        setRequisitosCategoria(formula.requisitosCategoria)
        setOriginalRequisitosCategoria(JSON.parse(JSON.stringify(formula.requisitosCategoria)))
      }

      if (formula.parametrosPago) {
        setParametrosPago(formula.parametrosPago)
        setOriginalParametrosPago(JSON.parse(JSON.stringify(formula.parametrosPago)))

        // Check if all tariffs are equal to determine if tarifa simple was active
        const primerTipo = tiposInstructor[0]
        const tarifasIguales = tiposInstructor.every((tipo) => {
          if (!formula.parametrosPago[tipo as CategoriaInstructor]) return false

          // Compare basic values
          const primerParams = formula.parametrosPago[primerTipo as CategoriaInstructor]
          const tipoParams = formula.parametrosPago[tipo as CategoriaInstructor]

          if (
            primerParams.minimoGarantizado !== tipoParams.minimoGarantizado ||
            primerParams.tarifaFullHouse !== tipoParams.tarifaFullHouse ||
            primerParams.maximo !== tipoParams.maximo ||
            primerParams.bono !== tipoParams.bono ||
            primerParams.cuotaFija !== tipoParams.cuotaFija
          ) {
            return false
          }

          // Compare tariffs
          if (primerParams.tarifas.length !== tipoParams.tarifas.length) return false

          // Sort tariffs for comparison
          const primerTarifasOrdenadas = [...primerParams.tarifas].sort((a, b) => a.numeroReservas - b.numeroReservas)
          const tipoTarifasOrdenadas = [...tipoParams.tarifas].sort((a, b) => a.numeroReservas - b.numeroReservas)

          return primerTarifasOrdenadas.every((tarifa, index) => {
            return (
              tarifa.numeroReservas === tipoTarifasOrdenadas[index].numeroReservas &&
              tarifa.tarifa === tipoTarifasOrdenadas[index].tarifa
            )
          })
        })

        setTarifaSimple(tarifasIguales)
        setOriginalTarifaSimple(tarifasIguales)
      }
    } else if (open && !formula) {
      // Creating new formula - initialize empty values
      setRequisitosCategoria({})
      setTarifaSimple(false)

      // Initialize parametrosPago with empty tariff structure
      const parametrosVacios: Record<string, ParametrosPago> = {}
      tiposInstructor.forEach((tipo) => {
        parametrosVacios[tipo] = {
          minimoGarantizado: 0,
          tarifas: [{ tarifa: 0, numeroReservas: 20 }],
          tarifaFullHouse: 0,
          maximo: 0,
          bono: 0,
          cuotaFija: 0,
        }
      })

      setParametrosPago(parametrosVacios)
    }
    // Only run this effect when the dialog opens
  }, [open, formula])

  // Handle dialog close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSaving && formula) {
      // Reset to original values if dialog is closing without saving
      setParametrosPago(JSON.parse(JSON.stringify(originalParametrosPago)))
      setRequisitosCategoria(JSON.parse(JSON.stringify(originalRequisitosCategoria)))
      setTarifaSimple(originalTarifaSimple)
    }
    onOpenChange(newOpen)
  }

  // Handle requirement changes
  const handleRequisitoChange = (categoria: string, campo: string, valor: string | boolean) => {
    setRequisitosCategoria((prev) => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        [campo]:
          campo === "participacionEventos" || campo === "lineamientos"
            ? Boolean(valor)
            : typeof valor === "string"
              ? Number(valor)
              : valor,
      },
    }))
  }

  // Handle payment parameter changes
  const handleParametroPagoChange = (categoria: string, campo: string, valor: string) => {
    if (tarifaSimple) {
      // If tarifa simple is active, apply the change to all instructor types
      const nuevoValor = Number(valor)
      const nuevosParametros = { ...parametrosPago }

      tiposInstructor.forEach((tipo) => {
        nuevosParametros[tipo] = {
          ...nuevosParametros[tipo],
          [campo]: nuevoValor,
        }
      })

      setParametrosPago(nuevosParametros)
    } else {
      // Normal behavior, only update the selected type
      setParametrosPago((prev) => ({
        ...prev,
        [categoria]: {
          ...(prev[categoria] || {}),
          [campo]: Number(valor),
        },
      }))
    }
  }

  // Handle tariff changes
  const handleTarifaChange = (categoria: string, index: number, campo: string, valor: string) => {
    if (tarifaSimple) {
      // If tarifa simple is active, apply the change to all instructor types
      const nuevoValor = Number(valor)
      const nuevosParametros = { ...parametrosPago }

      tiposInstructor.forEach((tipo) => {
        const nuevasTarifas = [...nuevosParametros[tipo].tarifas]
        nuevasTarifas[index] = {
          ...nuevasTarifas[index],
          [campo]: nuevoValor,
        }

        nuevosParametros[tipo] = {
          ...nuevosParametros[tipo],
          tarifas: nuevasTarifas,
        }
      })

      setParametrosPago(nuevosParametros)
    } else {
      // Normal behavior
      setParametrosPago((prev) => {
        const nuevasTarifas = [...prev[categoria].tarifas]
        nuevasTarifas[index] = {
          ...nuevasTarifas[index],
          [campo]: Number(valor),
        }

        return {
          ...prev,
          [categoria]: {
            ...prev[categoria],
            tarifas: nuevasTarifas,
          },
        }
      })
    }
  }

  // Add a new tariff
  const agregarTarifa = (categoria: string) => {
    if (tarifaSimple) {
      // If tarifa simple is active, add the tariff to all types
      const nuevosParametros = { ...parametrosPago }

      tiposInstructor.forEach((tipo) => {
        const tarifas = nuevosParametros[tipo].tarifas || []
        const maxReservas = tarifas.length > 0 ? Math.max(...tarifas.map((t) => t.numeroReservas)) : 0

        nuevosParametros[tipo] = {
          ...nuevosParametros[tipo],
          tarifas: [...tarifas, { tarifa: 0, numeroReservas: maxReservas + 10 }],
        }
      })

      setParametrosPago(nuevosParametros)
    } else {
      // Normal behavior
      setParametrosPago((prev) => {
        const tarifas = prev[categoria].tarifas || []
        const maxReservas = tarifas.length > 0 ? Math.max(...tarifas.map((t) => t.numeroReservas)) : 0

        const nuevaTarifa = { tarifa: 0, numeroReservas: maxReservas + 10 }

        return {
          ...prev,
          [categoria]: {
            ...prev[categoria],
            tarifas: [...tarifas, nuevaTarifa],
          },
        }
      })
    }
  }

  // Remove a tariff
  const eliminarTarifa = (categoria: string, index: number) => {
    if (tarifaSimple) {
      // If tarifa simple is active, remove the tariff from all types
      const nuevosParametros = { ...parametrosPago }

      tiposInstructor.forEach((tipo) => {
        const nuevasTarifas = [...nuevosParametros[tipo].tarifas]
        nuevasTarifas.splice(index, 1)

        nuevosParametros[tipo] = {
          ...nuevosParametros[tipo],
          tarifas: nuevasTarifas,
        }
      })

      setParametrosPago(nuevosParametros)
    } else {
      // Normal behavior
      setParametrosPago((prev) => {
        const nuevasTarifas = [...prev[categoria].tarifas]
        nuevasTarifas.splice(index, 1)
        return {
          ...prev,
          [categoria]: {
            ...prev[categoria],
            tarifas: nuevasTarifas,
          },
        }
      })
    }
  }

  // Handle tarifa simple checkbox change
  const handleTarifaSimpleChange = (checked: boolean) => {
    setTarifaSimple(checked)

    if (checked) {
      // If activated, copy values from the first type to all others
      const primerTipo = tiposInstructor[0]
      const nuevosParametros = { ...parametrosPago }

      tiposInstructor.forEach((tipo) => {
        if (tipo !== primerTipo) {
          nuevosParametros[tipo] = JSON.parse(JSON.stringify(nuevosParametros[primerTipo]))
        }
      })

      setParametrosPago(nuevosParametros)
    }
  }

  // Save parameters
  const handleSaveParameters = async () => {
    if (!formula && (!disciplinaSeleccionadaId || !periodoSeleccionadoId)) {
      toast({
        title: "Error",
        description: "No se encontró la fórmula seleccionada",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      if (formula) {
        // Update existing formula
        await actualizarFormula(formula.id, {
          requisitosCategoria,
          parametrosPago,
        })

        toast({
          title: "Parámetros actualizados",
          description: "Los parámetros de la fórmula han sido actualizados exitosamente.",
        })
      } else {
        // Create new formula
        const disciplinaId = Number(disciplinaSeleccionadaId)
        const periodoId = Number(periodoSeleccionadoId)

        await crearFormula({
          disciplinaId,
          periodoId,
          requisitosCategoria,
          parametrosPago,
        })

        toast({
          title: "Fórmula creada",
          description: "La fórmula ha sido creada exitosamente.",
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
      onOpenChange(false)
      seleccionarFormula(null)
    }
  }

  // Get disciplina and periodo IDs from URL if creating new formula
  const searchParams =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const disciplinaSeleccionadaId = searchParams.get("disciplinaId") || ""
  const periodoSeleccionadoId = searchParams.get("periodoId") || ""

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[90rem]">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <DialogTitle className="text-xl">
              {formula
                ? `${formula.disciplina?.nombre || "Fórmula seleccionada"}`
                : `Nueva Fórmula: ${disciplinas.find((d) => d.id === Number(disciplinaSeleccionadaId))?.nombre || ""}`}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Configura las tarifas y parámetros de pago para esta fórmula.
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2 bg-muted/50 px-3 py-1.5 rounded-md border">
              <Checkbox id="tarifa-simple" checked={tarifaSimple} onCheckedChange={handleTarifaSimpleChange} />
              <Label htmlFor="tarifa-simple" className="text-sm font-medium cursor-pointer">
                Tarifa Simple
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>
                      Al activar esta opción, los cambios en las tarifas se aplicarán a todos los tipos de instructor.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2">
          <Tabs defaultValue="tarifas" onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="grid grid-cols-2 mb-4 p-1 bg-gradient-to-r from-primary/10 to-secondary/10 border rounded-lg">
              <TabsTrigger
                value="tarifas"
                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:font-medium rounded-md transition-all"
              >
                Tarifas por Reservas
              </TabsTrigger>
              <TabsTrigger
                value="requisitos"
                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:font-medium rounded-md transition-all"
              >
                Requisitos de Categorías
              </TabsTrigger>
            </TabsList>

            {/* Tarifas por Reservas Tab */}
            <TabsContent value="tarifas">
              <Card className="mb-4 border-none shadow-sm">
                <CardHeader className="pb-0 pt-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-medium">Configuración de Tarifas</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Get the current maximum number of reservations
                        const maxReservas =
                          parametrosPago.INSTRUCTOR?.tarifas?.length > 0
                            ? Math.max(...parametrosPago.INSTRUCTOR.tarifas.map((t) => t.numeroReservas))
                            : 0

                        // Add a new level for all types
                        tiposInstructor.forEach((tipo) => agregarTarifa(tipo))
                      }}
                      className="h-8"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Agregar Nivel
                    </Button>
                  </div>
                  {tarifaSimple && (
                    <div className="mt-2 bg-amber-50 text-amber-800 px-3 py-2 rounded-md text-xs flex items-center">
                      <Info className="h-3.5 w-3.5 mr-1.5" />
                      Modo tarifa simple activado: los cambios se aplican a todos los tipos de instructor.
                    </div>
                  )}
                </CardHeader>
                <CardContent className="pt-2">
                  <Table className="border rounded-md">
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[180px]">Parámetro</TableHead>
                        {tiposInstructor.map((tipo, index) => (
                          <TableHead
                            key={tipo}
                            className={`text-center font-medium ${
                              tarifaSimple && index > 0 ? "text-muted-foreground" : "text-foreground"
                            }`}
                          >
                            {tipo.replace("_", " ")}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Mínimo Garantizado</TableCell>
                        {tiposInstructor.map((tipo, index) => (
                          <TableCell key={tipo} className="text-center py-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={parametrosPago[tipo]?.minimoGarantizado || 0}
                              onChange={(e) => handleParametroPagoChange(tipo, "minimoGarantizado", e.target.value)}
                              className="w-20 mx-auto h-8 text-sm"
                              disabled={tarifaSimple && index > 0}
                            />
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Tarifas por nivel de reserva */}
                      {parametrosPago.INSTRUCTOR?.tarifas
                        ?.sort((a, b) => a.numeroReservas - b.numeroReservas)
                        .map((tarifa, index) => (
                          <TableRow key={`tarifa-nivel-${index}`} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                            <TableCell className="font-medium py-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="mr-2 text-sm">Hasta</span>
                                  <Input
                                    type="number"
                                    value={tarifa.numeroReservas}
                                    onChange={(e) => {
                                      const newValue = e.target.value
                                      // Update this level for all types
                                      tiposInstructor.forEach((tipo) => {
                                        if (parametrosPago[tipo]?.tarifas?.[index]) {
                                          handleTarifaChange(tipo, index, "numeroReservas", newValue)
                                        }
                                      })
                                    }}
                                    className="w-14 h-7 text-sm"
                                  />
                                  <span className="ml-2 text-sm">reservas</span>
                                </div>
                                {index > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      // Remove this level for all types
                                      tiposInstructor.forEach((tipo) => {
                                        if (parametrosPago[tipo]?.tarifas?.length > index) {
                                          eliminarTarifa(tipo, index)
                                        }
                                      })
                                    }}
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive/90"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            {tiposInstructor.map((tipo, tipoIndex) => (
                              <TableCell key={`${tipo}-tarifa-${index}`} className="text-center py-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={parametrosPago[tipo]?.tarifas?.[index]?.tarifa || 0}
                                  onChange={(e) => handleTarifaChange(tipo, index, "tarifa", e.target.value)}
                                  className="w-20 mx-auto h-7 text-sm"
                                  disabled={tarifaSimple && tipoIndex > 0}
                                />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}

                      <TableRow className="bg-muted/20">
                        <TableCell className="font-medium py-2">Full House</TableCell>
                        {tiposInstructor.map((tipo, index) => (
                          <TableCell key={tipo} className="text-center py-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={parametrosPago[tipo]?.tarifaFullHouse || 0}
                              onChange={(e) => handleParametroPagoChange(tipo, "tarifaFullHouse", e.target.value)}
                              className="w-20 mx-auto h-8 text-sm"
                              disabled={tarifaSimple && index > 0}
                            />
                          </TableCell>
                        ))}
                      </TableRow>

                      <TableRow>
                        <TableCell className="font-medium py-2">Máximo</TableCell>
                        {tiposInstructor.map((tipo, index) => (
                          <TableCell key={tipo} className="text-center py-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={parametrosPago[tipo]?.maximo || 0}
                              onChange={(e) => handleParametroPagoChange(tipo, "maximo", e.target.value)}
                              className="w-20 mx-auto h-8 text-sm"
                              disabled={tarifaSimple && index > 0}
                            />
                          </TableCell>
                        ))}
                      </TableRow>

                      <TableRow className="bg-muted/20">
                        <TableCell className="font-medium py-2">Bono</TableCell>
                        {tiposInstructor.map((tipo, index) => (
                          <TableCell key={tipo} className="text-center py-2">
                            <div className="flex items-center justify-center gap-2">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`${tipo}-tiene-bono`}
                                  checked={!!parametrosPago[tipo]?.bono}
                                  onChange={(e) => {
                                    const newValue = e.target.checked ? 0.5 : 0
                                    handleParametroPagoChange(tipo, "bono", newValue.toString())
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 mr-2"
                                  disabled={tarifaSimple && index > 0}
                                />
                                {!!parametrosPago[tipo]?.bono ? (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={parametrosPago[tipo]?.bono || 0}
                                    onChange={(e) => handleParametroPagoChange(tipo, "bono", e.target.value)}
                                    className="w-16 h-7 text-sm"
                                    disabled={tarifaSimple && index > 0}
                                  />
                                ) : (
                                  <span className="text-sm text-muted-foreground">No</span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium py-2">Cuota Fija</TableCell>
                        {tiposInstructor.map((tipo, index) => (
                          <TableCell key={tipo} className="text-center py-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={parametrosPago[tipo]?.cuotaFija || 0}
                              onChange={(e) => handleParametroPagoChange(tipo, "cuotaFija", e.target.value)}
                              className="w-20 mx-auto h-8 text-sm"
                              disabled={tarifaSimple && index > 0}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Requisitos de Categorías Tab */}
            <TabsContent value="requisitos">
              <Card className="mb-4 border-none shadow-sm">
                <CardContent className="pt-4">
                  <Table className="border rounded-md">
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[180px]">Requisito</TableHead>
                        {tiposInstructor.map((tipo) => (
                          <TableHead key={tipo} className="text-center">
                            {tipo.replace("_", " ")}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="bg-muted/20">
                        <TableCell className="font-medium py-2">Ocupación (%)</TableCell>
                        {tiposInstructor.map((categoria) => (
                          <TableCell key={`${categoria}-ocupacion`} className="text-center py-2">
                            <Input
                              type="number"
                              value={requisitosCategoria[categoria]?.ocupacion || 0}
                              onChange={(e) => handleRequisitoChange(categoria, "ocupacion", e.target.value)}
                              className="w-20 mx-auto h-7 text-sm"
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium py-2">Clases</TableCell>
                        {tiposInstructor.map((categoria) => (
                          <TableCell key={`${categoria}-clases`} className="text-center py-2">
                            <Input
                              type="number"
                              value={requisitosCategoria[categoria]?.clases || 0}
                              onChange={(e) => handleRequisitoChange(categoria, "clases", e.target.value)}
                              className="w-20 mx-auto h-7 text-sm"
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="bg-muted/20">
                        <TableCell className="font-medium py-2">Locales en Lima</TableCell>
                        {tiposInstructor.map((categoria) => (
                          <TableCell key={`${categoria}-locales`} className="text-center py-2">
                            <Input
                              type="number"
                              value={requisitosCategoria[categoria]?.localesEnLima || 0}
                              onChange={(e) => handleRequisitoChange(categoria, "localesEnLima", e.target.value)}
                              className="w-20 mx-auto h-7 text-sm"
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium py-2">Dobleteos</TableCell>
                        {tiposInstructor.map((categoria) => (
                          <TableCell key={`${categoria}-dobleteos`} className="text-center py-2">
                            <Input
                              type="number"
                              value={requisitosCategoria[categoria]?.dobleteos || 0}
                              onChange={(e) => handleRequisitoChange(categoria, "dobleteos", e.target.value)}
                              className="w-20 mx-auto h-7 text-sm"
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="bg-muted/20">
                        <TableCell className="font-medium py-2">Horarios No-Prime</TableCell>
                        {tiposInstructor.map((categoria) => (
                          <TableCell key={`${categoria}-horarios`} className="text-center py-2">
                            <Input
                              type="number"
                              value={requisitosCategoria[categoria]?.horariosNoPrime || 0}
                              onChange={(e) => handleRequisitoChange(categoria, "horariosNoPrime", e.target.value)}
                              className="w-20 mx-auto h-7 text-sm"
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium py-2">Participación en Eventos</TableCell>
                        {tiposInstructor.map((categoria) => (
                          <TableCell key={`${categoria}-eventos`} className="text-center py-2">
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                id={`${categoria}-participacion`}
                                checked={!!requisitosCategoria[categoria]?.participacionEventos}
                                onChange={(e) =>
                                  handleRequisitoChange(categoria, "participacionEventos", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-gray-300"
                              />
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="bg-muted/20">
                        <TableCell className="font-medium py-2">Cumple Lineamientos</TableCell>
                        {tiposInstructor.map((categoria) => (
                          <TableCell key={`${categoria}-lineamientos`} className="text-center py-2">
                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                id={`${categoria}-lineamientos`}
                                checked={!!requisitosCategoria[categoria]?.lineamientos}
                                onChange={(e) => handleRequisitoChange(categoria, "lineamientos", e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSaveParameters} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar Parámetros"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
