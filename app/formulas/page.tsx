"use client"

import { Checkbox } from "@/components/ui/checkbox"

import { useState, useEffect } from "react"
import { PlusCircle, Trash2, AlertCircle, Settings, Plus, Calculator, Info, X } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import type { FormulaDB, RequisitosCategoria, ParametrosPago, CategoriaInstructor } from "@/types/schema"
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
    seleccionarFormula,
  } = useFormulasStore()

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isNewFormulaDialogOpen, setIsNewFormulaDialogOpen] = useState(false)
  const [isParametrosDialogOpen, setIsParametrosDialogOpen] = useState(false)
  const [isTestFormulaDialogOpen, setIsTestFormulaDialogOpen] = useState(false)
  const [disciplinaSeleccionadaId, setDisciplinaSeleccionadaId] = useState<string>("")
  const [periodoSeleccionadoId, setPeriodoSeleccionadoId] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("tarifas")
  const [tarifaSimple, setTarifaSimple] = useState(false)

  // Estados para los requisitos y parámetros de pago
  const [requisitosCategoria, setRequisitosCategoria] = useState<Record<string, RequisitosCategoria>>({})
  const [parametrosPago, setParametrosPago] = useState<Record<string, ParametrosPago>>({})

  // Estados para probar la fórmula
  const [testInstructorType, setTestInstructorType] = useState<CategoriaInstructor>("INSTRUCTOR")
  const [testClaseParams, setTestClaseParams] = useState({
    reservasTotales: 20,
    lugares: 50,
    listasEspera: 0,
    cortesias: 0,
    reservasPagadas: 20,
  })
  const [testResult, setTestResult] = useState<any>(null)

  // Tipos de instructor disponibles
  const tiposInstructor = ["INSTRUCTOR", "EMBAJADOR_JUNIOR", "EMBAJADOR", "EMBAJADOR_SENIOR"]

  // 1. Add state to store original values for dialogs
  const [originalParametrosPago, setOriginalParametrosPago] = useState<Record<string, ParametrosPago>>({})
  const [originalRequisitosCategoria, setOriginalRequisitosCategoria] = useState<Record<string, RequisitosCategoria>>(
    {},
  )
  const [originalTarifaSimple, setOriginalTarifaSimple] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    fetchDisciplinas()
    fetchPeriodos()
    fetchFormulas()
  }, [fetchDisciplinas, fetchPeriodos, fetchFormulas])

  // Cargar requisitos y parámetros cuando se selecciona una fórmula
  useEffect(() => {
    if (formulaSeleccionada) {
      if (formulaSeleccionada.requisitosCategoria) {
        setRequisitosCategoria(formulaSeleccionada.requisitosCategoria)
      }

      if (formulaSeleccionada.parametrosPago) {
        setParametrosPago(formulaSeleccionada.parametrosPago)

        // Verificar si todas las tarifas son iguales para activar tarifa simple
        const primerTipo = tiposInstructor[0]
        const tarifasIguales = tiposInstructor.every((tipo) => {
          if (!formulaSeleccionada.parametrosPago[tipo as CategoriaInstructor]) return false

          // Comparar valores básicos
          const primerParams = formulaSeleccionada.parametrosPago[primerTipo as CategoriaInstructor]
          const tipoParams = formulaSeleccionada.parametrosPago[tipo as CategoriaInstructor]

          if (
            primerParams.minimoGarantizado !== tipoParams.minimoGarantizado ||
            primerParams.tarifaFullHouse !== tipoParams.tarifaFullHouse ||
            primerParams.maximo !== tipoParams.maximo ||
            primerParams.bono !== tipoParams.bono ||
            primerParams.cuotaFija !== tipoParams.cuotaFija
          ) {
            return false
          }

          // Comparar tarifas
          if (primerParams.tarifas.length !== tipoParams.tarifas.length) return false

          // Ordenar tarifas para comparar
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
      }
    }
  }, [formulaSeleccionada])

  const handleCreateFormula = () => {
    setDisciplinaSeleccionadaId("")
    setPeriodoSeleccionadoId("")
    setRequisitosCategoria({})
    setTarifaSimple(false)

    // Inicializar parametrosPago con estructura de tarifas vacía
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
    setIsNewFormulaDialogOpen(true)
  }

  // 2. Update the handleEditParametros function to store original values
  const handleEditParametros = (formula: FormulaDB) => {
    seleccionarFormula(formula)

    // Store original values
    if (formula.parametrosPago) {
      setOriginalParametrosPago(JSON.parse(JSON.stringify(formula.parametrosPago)))
    }

    if (formula.requisitosCategoria) {
      setOriginalRequisitosCategoria(JSON.parse(JSON.stringify(formula.requisitosCategoria)))
    }

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

    setOriginalTarifaSimple(tarifasIguales)
    setIsParametrosDialogOpen(true)
  }

  const handleDeleteFormula = (formula: FormulaDB) => {
    seleccionarFormula(formula)
    setIsDeleteDialogOpen(true)
  }

  const handleTestFormula = (formula: FormulaDB) => {
    seleccionarFormula(formula)
    setTestResult(null)
    setTestInstructorType("INSTRUCTOR")
    setTestClaseParams({
      reservasTotales: 20,
      lugares: 50,
      listasEspera: 0,
      cortesias: 0,
      reservasPagadas: 20,
    })
    setIsTestFormulaDialogOpen(true)
  }

  const confirmDeleteFormula = async () => {
    if (formulaSeleccionada) {
      setIsSaving(true)
      try {
        await eliminarFormula(formulaSeleccionada.id)

        toast({
          title: "Fórmula eliminada",
          description: `La fórmula para ${formulaSeleccionada.disciplina?.nombre || "la disciplina seleccionada"} ha sido eliminada.`,
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

      setIsParametrosDialogOpen(true)
      setIsNewFormulaDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error al verificar fórmula existente",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    }
  }

  const handleSaveParametros = async () => {
    if (!formulaSeleccionada && (!disciplinaSeleccionadaId || !periodoSeleccionadoId)) {
      toast({
        title: "Error",
        description: "No se encontró la fórmula seleccionada",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      if (formulaSeleccionada) {
        // Actualizar fórmula existente
        await actualizarFormula(formulaSeleccionada.id, {
          requisitosCategoria,
          parametrosPago,
        })

        toast({
          title: "Parámetros actualizados",
          description: "Los parámetros de la fórmula han sido actualizados exitosamente.",
        })
      } else {
        // Crear nueva fórmula
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
      setIsParametrosDialogOpen(false)
      seleccionarFormula(null)
    }
  }

  // Manejadores para cambios en requisitos y parámetros
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

  const handleParametroPagoChange = (categoria: string, campo: string, valor: string) => {
    if (tarifaSimple) {
      // Si tarifa simple está activada, aplicar el cambio a todos los tipos de instructor
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
      // Comportamiento normal, solo actualizar el tipo seleccionado
      setParametrosPago((prev) => ({
        ...prev,
        [categoria]: {
          ...(prev[categoria] || {}),
          [campo]: Number(valor),
        },
      }))
    }
  }

  // Manejador para cambiar tarifa
  const handleTarifaChange = (categoria: string, index: number, campo: string, valor: string) => {
    if (tarifaSimple) {
      // Si tarifa simple está activada, aplicar el cambio a todos los tipos de instructor
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
      // Comportamiento normal
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

  // Agregar una nueva tarifa
  const agregarTarifa = (categoria: string) => {
    if (tarifaSimple) {
      // Si tarifa simple está activada, agregar la tarifa a todos los tipos
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
      // Comportamiento normal
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

  // Eliminar una tarifa
  const eliminarTarifa = (categoria: string, index: number) => {
    if (tarifaSimple) {
      // Si tarifa simple está activada, eliminar la tarifa de todos los tipos
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
      // Comportamiento normal
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

  // Manejar cambio en el checkbox de tarifa simple
  const handleTarifaSimpleChange = (checked: boolean) => {
    setTarifaSimple(checked)

    if (checked) {
      // Si se activa, copiar los valores del primer tipo a todos los demás
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

  // Manejar cambios en los parámetros de prueba
  const handleTestParamChange = (field: string, value: string) => {
    setTestClaseParams((prev) => ({
      ...prev,
      [field]: Number(value),
    }))
  }

  // Calcular el resultado de la prueba
  const calculateTestResult = () => {
    if (!formulaSeleccionada) return

    try {
      // Obtener los parámetros de pago para el tipo de instructor seleccionado
      const parametros = formulaSeleccionada.parametrosPago[testInstructorType]

      if (!parametros) {
        setTestResult({
          error: `No se encontraron parámetros para el tipo de instructor: ${testInstructorType}`,
        })
        return
      }

      // Obtener la cantidad de reservaciones y capacidad
      const reservaciones = testClaseParams.reservasTotales
      const capacidad = testClaseParams.lugares

      // Determinar la tarifa aplicable según la ocupación
      let tarifaAplicada = 0
      let tipoTarifa = ""

      // Verificar si es full house
      const esFullHouse = reservaciones >= capacidad

      if (esFullHouse) {
        tarifaAplicada = parametros.tarifaFullHouse
        tipoTarifa = "Full House"
      } else {
        // Ordenar tarifas por número de reservas (de menor a mayor)
        const tarifasOrdenadas = [...parametros.tarifas].sort((a, b) => a.numeroReservas - b.numeroReservas)

        // Encontrar la tarifa aplicable
        let tarifaEncontrada = false
        for (const tarifa of tarifasOrdenadas) {
          if (reservaciones <= tarifa.numeroReservas) {
            tarifaAplicada = tarifa.tarifa
            tipoTarifa = `Hasta ${tarifa.numeroReservas} reservas`
            tarifaEncontrada = true
            break
          }
        }

        // Si no se encontró una tarifa aplicable, usar la tarifa full house
        if (!tarifaEncontrada) {
          tarifaAplicada = parametros.tarifaFullHouse
          tipoTarifa = "Full House (por defecto)"
        }
      }

      // Calcular el monto base: tarifa * reservaciones
      let montoPago = tarifaAplicada * reservaciones

      // Aplicar cuota fija si existe
      if (parametros.cuotaFija && parametros.cuotaFija > 0) {
        montoPago += parametros.cuotaFija
      }

      // El bono se calcula en otra parte del sistema
      let bonoAplicado = 0
      if (parametros.bono && parametros.bono > 0) {
        bonoAplicado = parametros.bono * reservaciones
        // No sumamos el bono al montoPago ya que se maneja en otra parte del sistema
      }

      // Verificar si se aplica el mínimo garantizado
      let minimoAplicado = false
      if (montoPago < parametros.minimoGarantizado && parametros.minimoGarantizado > 0) {
        minimoAplicado = true
        montoPago = parametros.minimoGarantizado
      }

      // Verificar si se aplica el máximo
      let maximoAplicado = false
      if (montoPago > parametros.maximo) {
        maximoAplicado = true
        montoPago = parametros.maximo
      }

      // Generar detalle del cálculo
      let detalleCalculo = `${reservaciones} reservas × S/.${tarifaAplicada.toFixed(2)} = S/.${(reservaciones * tarifaAplicada).toFixed(2)}`

      if (parametros.cuotaFija && parametros.cuotaFija > 0) {
        detalleCalculo += `\nCuota fija: +S/.${parametros.cuotaFija.toFixed(2)}`
        detalleCalculo += `\nSubtotal con cuota fija: S/.${(reservaciones * tarifaAplicada + parametros.cuotaFija).toFixed(2)}`
      }

      if (minimoAplicado) {
        detalleCalculo += `\nSe aplicó el mínimo garantizado: S/.${parametros.minimoGarantizado.toFixed(2)}`
      }

      if (maximoAplicado) {
        detalleCalculo += `\nSe aplicó el máximo: S/.${parametros.maximo.toFixed(2)}`
      }

      setTestResult({
        montoPago,
        tarifaAplicada,
        tipoTarifa,
        minimoAplicado,
        maximoAplicado,
        bonoAplicado: bonoAplicado > 0 ? bonoAplicado : undefined,
        detalleCalculo,
      })
    } catch (error) {
      setTestResult({
        error: error instanceof Error ? error.message : "Error desconocido al calcular el pago",
      })
    }
  }

  // Obtener disciplinas disponibles para nuevas fórmulas (sin fórmula en el período actual)
  const getDisciplinasDisponibles = () => {
    if (!periodoSeleccionadoId) return disciplinas

    const periodoId = Number(periodoSeleccionadoId)
    const disciplinasConFormula = formulas.filter((f) => f.periodoId === periodoId).map((f) => f.disciplinaId)

    return disciplinas.filter((d) => !disciplinasConFormula.includes(d.id))
  }

  const isLoading = isLoadingDisciplinas || isLoadingFormulas

  // 3. Update the setIsParametrosDialogOpen function to handle dialog close
  const handleParametrosDialogOpenChange = (open: boolean) => {
    if (!open && !isSaving) {
      // Reset to original values if dialog is closing without saving
      if (formulaSeleccionada) {
        setParametrosPago(JSON.parse(JSON.stringify(originalParametrosPago)))
        setRequisitosCategoria(JSON.parse(JSON.stringify(originalRequisitosCategoria)))
        setTarifaSimple(originalTarifaSimple)
      }
    }
    setIsParametrosDialogOpen(open)
  }

  // 4. Update the setIsNewFormulaDialogOpen function to handle dialog close
  const handleNewFormulaDialogOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form fields when dialog is closed
      setDisciplinaSeleccionadaId("")
      setPeriodoSeleccionadoId("")
    }
    setIsNewFormulaDialogOpen(open)
  }

  // 5. Update the setIsTestFormulaDialogOpen function to handle dialog close
  const handleTestFormulaDialogOpenChange = (open: boolean) => {
    if (!open) {
      // Reset test parameters when dialog is closed
      setTestResult(null)
      setTestInstructorType("INSTRUCTOR")
      setTestClaseParams({
        reservasTotales: 20,
        lugares: 50,
        listasEspera: 0,
        cortesias: 0,
        reservasPagadas: 20,
      })
    }
    setIsTestFormulaDialogOpen(open)
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Fórmulas de Cálculo"
        text="Gestiona las fórmulas y parámetros para el cálculo de pagos a instructores por disciplina y período."
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
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Fórmulas por Disciplina y Período</CardTitle>
                <CardDescription>
                  Cada disciplina puede tener fórmulas personalizadas para diferentes períodos.
                </CardDescription>
              </div>
              <Button onClick={handleCreateFormula} size="sm" className="h-9">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nueva Fórmula
              </Button>
            </div>
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
                    <TableHead>Tarifas</TableHead>
                    <TableHead>Última Actualización</TableHead>
                    <TableHead className="text-right w-[140px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formulas.map((formula) => {
                    const disciplina = disciplinas.find((d) => d.id === formula.disciplinaId)
                    const periodo = periodos.find((p) => p.id === formula.periodoId)
                    const tarifasInstructor = formula.parametrosPago?.INSTRUCTOR?.tarifas || []

                    return (
                      <TableRow key={formula.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <Badge
                            variant="outline"
                            style={{ backgroundColor: disciplina?.color ? `${disciplina.color}20` : undefined }}
                            className="font-medium"
                          >
                            {disciplina?.nombre || `Disciplina ${formula.disciplinaId}`}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {periodo ? `${periodo.numero}/${periodo.año}` : `Periodo ${formula.periodoId}`}
                        </TableCell>
                        <TableCell>
                          {tarifasInstructor.length > 0 ? (
                            <span className="text-sm">{tarifasInstructor.length} niveles de tarifa</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Sin tarifas configuradas</span>
                          )}
                        </TableCell>
                        <TableCell>{new Date(formula.updatedAt!).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleTestFormula(formula)}
                                    className="h-8 w-8"
                                  >
                                    <Calculator className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Probar Fórmula</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditParametros(formula)}
                                    className="h-8 w-8"
                                  >
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Editar Parámetros</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteFormula(formula)}
                                    className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Eliminar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
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

      {/* Diálogo para crear nueva fórmula */}
      <Dialog open={isNewFormulaDialogOpen} onOpenChange={handleNewFormulaDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Fórmula</DialogTitle>
            <DialogDescription>
              Selecciona la disciplina y el período para la nueva fórmula de cálculo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="periodo">Período</Label>
              <Select value={periodoSeleccionadoId} onValueChange={setPeriodoSeleccionadoId} disabled={isLoading}>
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
                    <div className="p-2 text-center text-sm text-muted-foreground">Selecciona un período primero</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFormulaDialogOpen(false)} disabled={isLoading || isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleContinueNewFormula}
              disabled={
                !periodoSeleccionadoId ||
                !disciplinaSeleccionadaId ||
                isLoading ||
                isSaving ||
                getDisciplinasDisponibles().length === 0
              }
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar parámetros */}
      <Dialog open={isParametrosDialogOpen} onOpenChange={handleParametrosDialogOpenChange}>
        <DialogContent className="max-w-[90rem]">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <DialogTitle className="text-xl">
                {formulaSeleccionada
                  ? `${formulaSeleccionada.disciplina?.nombre || "Fórmula seleccionada"}`
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

              {/* Contenido de Tarifas por Reservas */}
              <TabsContent value="tarifas">
                <Card className="mb-4 border-none shadow-sm">
                  <CardHeader className="pb-0 pt-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-medium">Configuración de Tarifas</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Obtener el máximo número de reservas actual
                          const maxReservas =
                            parametrosPago.INSTRUCTOR?.tarifas?.length > 0
                              ? Math.max(...parametrosPago.INSTRUCTOR.tarifas.map((t) => t.numeroReservas))
                              : 0

                          // Agregar un nuevo nivel para todos los tipos
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
                                        // Actualizar este nivel para todos los tipos
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
                                        // Eliminar este nivel para todos los tipos
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

              {/* Contenido de Requisitos de Categorías */}
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
            <Button variant="outline" onClick={() => setIsParametrosDialogOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveParametros} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar Parámetros"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para probar la fórmula */}
      <Dialog open={isTestFormulaDialogOpen} onOpenChange={handleTestFormulaDialogOpenChange}>
        <DialogContent className="max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Probar Fórmula</DialogTitle>
            <DialogDescription>
              Prueba la fórmula con diferentes parámetros para ver el resultado del cálculo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="test-instructor-type">Tipo de Instructor</Label>
                <Select
                  value={testInstructorType}
                  onValueChange={(value) => setTestInstructorType(value as CategoriaInstructor)}
                >
                  <SelectTrigger id="test-instructor-type">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                    <SelectItem value="EMBAJADOR_JUNIOR">Embajador Junior</SelectItem>
                    <SelectItem value="EMBAJADOR">Embajador</SelectItem>
                    <SelectItem value="EMBAJADOR_SENIOR">Embajador Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Parámetros de la Clase</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parámetro</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Descripción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Reservas Totales</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={testClaseParams.reservasTotales}
                        onChange={(e) => handleTestParamChange("reservasTotales", e.target.value)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      Número total de reservas para la clase
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Lugares</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={testClaseParams.lugares}
                        onChange={(e) => handleTestParamChange("lugares", e.target.value)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">Capacidad total de la clase</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Listas de Espera</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={testClaseParams.listasEspera}
                        onChange={(e) => handleTestParamChange("listasEspera", e.target.value)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      Número de personas en lista de espera
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Cortesías</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={testClaseParams.cortesias}
                        onChange={(e) => handleTestParamChange("cortesias", e.target.value)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">Número de cortesías otorgadas</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Reservas Pagadas</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={testClaseParams.reservasPagadas}
                        onChange={(e) => handleTestParamChange("reservasPagadas", e.target.value)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">Número de reservas pagadas</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {testResult && (
              <div className="mt-4 p-4 border rounded-md bg-muted/30">
                <h3 className="text-lg font-medium mb-2">Resultado del Cálculo</h3>
                {testResult.error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{testResult.error}</AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="mb-4">
                      <p className="text-xl font-bold">Pago: S/.{testResult.montoPago.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        Tarifa aplicada: {testResult.tipoTarifa} (S/.{testResult.tarifaAplicada.toFixed(2)})
                      </p>
                    </div>
                    <div className="text-sm whitespace-pre-line bg-background p-3 rounded border">
                      {testResult.detalleCalculo}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestFormulaDialogOpen(false)}>
              Cerrar
            </Button>
            <Button onClick={calculateTestResult}>
              <Calculator className="mr-2 h-4 w-4" />
              Calcular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la fórmula para {formulaSeleccionada?.disciplina?.nombre}?
              <br />
              Esta acción no se puede deshacer.
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
