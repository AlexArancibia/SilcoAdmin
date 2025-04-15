"use client"

import type React from "react"

import { useEffect, useState, useCallback, useRef, use } from "react"
import { notFound } from "next/navigation"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { useClasesStore } from "@/store/useClasesStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { usePagosStore } from "@/store/usePagosStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { useFormulasStore } from "@/store/useFormulaStore"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PeriodSelector } from "@/components/period-selector"
import { InstructorPaymentHistory } from "@/components/instructors/instructor-payment-history"
import { DashboardShell } from "@/components/dashboard/shell"
import { calcularPago } from "@/lib/formula-evaluator"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import type { Instructor, PagoInstructor, Clase, CategoriaInstructor } from "@/types/schema"
import type { ResultadoCalculo } from "@/lib/formula-evaluator"
import {
  Calendar,
  DollarSign,
  Users,
  Info,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Award,
  Phone,
  Star,
  Edit,
  Save,
  X,
  BarChart3,
  Sparkles,
  Building,
} from "lucide-react"

export default function InstructorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const instructorId = Number.parseInt(resolvedParams.id)

  // Store hooks
  const { fetchInstructor, instructorSeleccionado, isLoading, actualizarInstructor } = useInstructoresStore()
  const { fetchClases, clases, isLoading: isLoadingClases } = useClasesStore()
  const { periodos, periodosSeleccionados, fetchPeriodos } = usePeriodosStore()
  const { pagos, fetchPagos, isLoading: isLoadingPagos } = usePagosStore()
  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()
  const { formulas, fetchFormulas } = useFormulasStore()

  // Local state
  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [paymentDetails, setPaymentDetails] = useState<any[]>([])
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null)
  const [clasesPeriodo, setClasesPeriodo] = useState<Clase[]>([])
  const [pagosPeriodo, setPagosPeriodo] = useState<PagoInstructor[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedInstructor, setEditedInstructor] = useState<Partial<Instructor>>({})
  const dataLoaded = useRef(false)

  const itemsPerPage = 10
  const totalPages = Math.ceil(paymentDetails.length / itemsPerPage)
  const startIndex = currentPage * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPayments = paymentDetails.slice(startIndex, endIndex)

  // Load initial data
  useEffect(() => {
    if (isNaN(instructorId)) notFound()
    if (dataLoaded.current) return
    dataLoaded.current = true

    const loadData = async () => {
      try {
        await Promise.all([
          fetchInstructor(instructorId),
          fetchDisciplinas(),
          fetchFormulas(),
          fetchClases(),
          fetchPagos(),
        ])
      } catch (error) {
        console.error("Error al cargar datos:", error)
      }
    }

    loadData()
  }, [instructorId, fetchInstructor, fetchDisciplinas, fetchFormulas, fetchClases, fetchPagos])

  // Update instructor state when instructorSeleccionado changes
  useEffect(() => {
    if (instructorSeleccionado) {
      setInstructor(instructorSeleccionado)
      setEditedInstructor({
        cumpleLineamientos: instructorSeleccionado.cumpleLineamientos,
        dobleteos: instructorSeleccionado.dobleteos,
        horariosNoPrime: instructorSeleccionado.horariosNoPrime,
        participacionEventos: instructorSeleccionado.participacionEventos,
        extrainfo: { ...instructorSeleccionado.extrainfo },
      })
    }
  }, [instructorSeleccionado])

  // Filter classes and payments when periods change
  useEffect(() => {
    if (clases.length > 0 && periodosSeleccionados.length > 0) {
      const filteredClases = clases.filter(
        (clase) => clase.instructorId === instructorId && periodosSeleccionados.some((p) => p.id === clase.periodoId),
      )

      const filteredPagos = pagos.filter(
        (pago) => pago.instructorId === instructorId && periodosSeleccionados.some((p) => p.id === pago.periodoId),
      )

      setClasesPeriodo(filteredClases)
      setPagosPeriodo(filteredPagos)
    } else {
      setClasesPeriodo([])
      setPagosPeriodo([])
    }
  }, [clases, pagos, periodosSeleccionados, instructorId])

  // Calculate payments when relevant data changes
  const calculatePayments = useCallback(() => {
    if (!clasesPeriodo || clasesPeriodo.length === 0 || isLoadingDisciplinas || !disciplinas.length) {
      setPaymentDetails([])
      return
    }

    const details: any[] = []
    setUltimaActualizacion(new Date())

    clasesPeriodo.forEach((clase) => {
      const disciplina = disciplinas.find((d) => d.id === clase.disciplinaId)
      const formula = formulas.find((f) => f.disciplinaId === disciplina?.id && f.periodoId === clase.periodoId)

      let montoCalculado = 0
      let detalleCalculo = null
      let resultadoCalculo: ResultadoCalculo | null = null

      if (formula) {
        try {
          // Obtener la categoría del instructor para esta disciplina
          const categoriaInstructor =
            instructor?.categorias?.find(
              (cat) => cat.disciplinaId === clase.disciplinaId && cat.periodoId === clase.periodoId,
            )?.categoria || "INSTRUCTOR"

          // Usar la nueva función de cálculo
          resultadoCalculo = calcularPago(clase, categoriaInstructor, formula)
          montoCalculado = resultadoCalculo.montoPago
          detalleCalculo = {
            mensaje: resultadoCalculo.detalleCalculo,
            pasos: [
              { descripcion: `Tarifa aplicada: ${resultadoCalculo.tarifaAplicada} (${resultadoCalculo.tipoTarifa})` },
              { descripcion: `Reservas: ${clase.reservasTotales} de ${clase.lugares} lugares` },
              { descripcion: `Monto calculado: ${resultadoCalculo.montoPago.toFixed(2)}` },
            ],
          }

          // Agregar información sobre mínimo/máximo si aplica
          if (resultadoCalculo.minimoAplicado) {
            detalleCalculo.pasos.push({
              descripcion: `Se aplicó el mínimo garantizado`,
            })
          }

          if (resultadoCalculo.maximoAplicado) {
            detalleCalculo.pasos.push({
              descripcion: `Se aplicó el máximo permitido`,
            })
          }

          // Agregar información sobre bono si existe
          if (resultadoCalculo.bonoAplicado) {
            detalleCalculo.pasos.push({
              descripcion: `Bono aplicable: ${resultadoCalculo.bonoAplicado.toFixed(2)} (no incluido en el total)`,
            })
          }
        } catch (error) {
          console.error(`Error al calcular pago para clase ${clase.id}:`, error)
          montoCalculado = 0
          detalleCalculo = { error: error instanceof Error ? error.message : "Error desconocido" }
        }
      } else {
        montoCalculado = 0
        detalleCalculo = { error: "No hay fórmula definida para esta disciplina" }
      }

      details.push({
        claseId: clase.id,
        fecha: clase.fecha,
        disciplina: disciplina?.nombre || `Disciplina ${clase.disciplinaId}`,
        disciplinaId: clase.disciplinaId,
        estudio: clase.estudio,
        reservas: clase.reservasTotales,
        capacidad: clase.lugares,
        montoCalculado,
        detalleCalculo,
        resultadoCalculo,
      })
    })

    details.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    setPaymentDetails(details)
  }, [clasesPeriodo, disciplinas, formulas, isLoadingDisciplinas, instructor?.categorias])

  // Execute calculatePayments when filtered data changes
  useEffect(() => {
    calculatePayments()
  }, [calculatePayments])

  // Helper functions
  const formatDate = (date: Date | undefined) => {
    if (!date) return "N/A"
    return format(new Date(date), "dd MMM yyyy", { locale: es })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount)
  }

  // Derived calculations
  const totalClases = clasesPeriodo.length
  const clasesCompletadas = clasesPeriodo.filter((c) => new Date(c.fecha) < new Date()).length

  

  const totalReservas = clasesPeriodo.reduce((sum, c) => sum + c.reservasTotales, 0)
  const totalLugares = clasesPeriodo.reduce((sum, c) => sum + c.lugares, 0)
  const montoPendiente = pagosPeriodo.find((p) => p.estado === "PENDIENTE")?.monto || 0
  const totalMonto = paymentDetails.reduce((sum, detail) => sum + detail.montoCalculado, 0)
  const ocupacionPromedio = Math.round( totalReservas /totalLugares * 100)
  // Instructor details
  const telefono = instructor?.extrainfo?.telefono || "No disponible"
  const especialidad = instructor?.extrainfo?.especialidad || "No especificada"
  const estado = instructor?.extrainfo?.activo ? "activo" : "inactivo"
  const foto = instructor?.extrainfo?.foto
  const biografia = instructor?.extrainfo?.biografia || "Sin biografia"
  const experiencia = instructor?.extrainfo?.experiencia || 0
  const disciplinasInstructor = instructor?.disciplinas || []

  // Add a new function to calculate total potential bonus
  const totalPotentialBonus = paymentDetails.reduce(
    (sum, detail) => sum + (detail.resultadoCalculo?.bonoAplicado || 0),
    0,
  )

  // Handle editing functions
  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setEditedInstructor({
        cumpleLineamientos: instructor?.cumpleLineamientos,
        dobleteos: instructor?.dobleteos,
        horariosNoPrime: instructor?.horariosNoPrime,
        participacionEventos: instructor?.participacionEventos,
        extrainfo: { ...instructor?.extrainfo },
      })
    }
    setIsEditing(!isEditing)
  }

  const handleSaveChanges = async () => {
    if (!instructor) return

    try {
      setIsSaving(true)
      const updatedInstructor = await actualizarInstructor(instructor.id, editedInstructor)
      setInstructor(updatedInstructor)
      setIsEditing(false)
      toast({
        title: "Cambios guardados",
        description: "La información del instructor ha sido actualizada correctamente.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error al actualizar instructor:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setEditedInstructor((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleExtraInfoChange = (field: string, value: any) => {
    setEditedInstructor((prev) => ({
      ...prev,
      extrainfo: {
        ...prev.extrainfo,
        [field]: value,
      },
    }))
  }

  // Get categories by discipline for current period
  const getCategoriesByDiscipline = () => {
    if (!instructor?.categorias || !periodosSeleccionados.length) return []

    return instructor.categorias.filter((cat) => periodosSeleccionados.some((p) => p.id === cat.periodoId))
  }

  const formatCategoryName = (category: CategoriaInstructor) => {
    switch (category) {
      case "EMBAJADOR_SENIOR":
        return "Embajador Senior"
      case "EMBAJADOR":
        return "Embajador"
      case "EMBAJADOR_JUNIOR":
        return "Embajador Junior"
      case "INSTRUCTOR":
        return "Instructor"
      default:
        return category
    }
  }

  const getCategoryColor = (category: CategoriaInstructor) => {
    switch (category) {
      case "EMBAJADOR_SENIOR":
        return "text-purple-600"
      case "EMBAJADOR":
        return "text-blue-600"
      case "EMBAJADOR_JUNIOR":
        return "text-teal-600"
      case "INSTRUCTOR":
        return "text-gray-600"
      default:
        return "text-gray-600"
    }
  }

  if (isLoading) {
    return <InstructorDetailSkeleton />
  }

  return (
    <DashboardShell>
      {/* Header Section */}
      <div className="bg-white rounded-xl p-5 border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border border-primary/10">
              <AvatarImage src={foto || "/placeholder.svg"} alt={instructor?.nombre} />
              <AvatarFallback className="text-lg font-bold bg-primary/5">
                {instructor?.nombre?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{instructor?.nombre}</h1>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleEditToggle}>
                  {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-1">
                <div className="flex items-center">
                  <Phone className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{telefono}</span>
                </div>
                <span className="mx-1 text-xs text-muted-foreground">•</span>
                <div className="flex items-center">
                  <Star className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{especialidad}</span>
                </div>
                <span className="mx-1 text-xs text-muted-foreground">•</span>
                <Badge variant={instructor?.extrainfo?.activo ? "success" : "secondary"} className="capitalize text-xs">
                  {estado}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-2">
                {disciplinasInstructor.map((disciplina) => (
                  <Badge key={disciplina.id} variant="outline" className="bg-primary/5 text-xs">
                    {disciplina.nombre}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="md:self-start mt-2 md:mt-0">
            <PeriodSelector />
          </div>
        </div>

        {/* Stats Grid - Unificar estilo y poner en una sola fila */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
          <StatCard
            icon={<Calendar className="h-5 w-5" />}
            title="Clases"
            value={totalClases}
            description={`${clasesCompletadas} completadas`}
            color="text-blue-500"
          />

          <StatCard
            icon={<Users className="h-5 w-5" />}
            title="Ocupación"
            value={`${ocupacionPromedio}%`}
            description="Promedio"
            color="text-green-500"
          />

          <StatCard
            icon={<DollarSign className="h-5 w-5" />}
            title="Total a pagar"
            value={formatAmount(totalMonto)}
            description={
              totalPotentialBonus > 0 ? `Bono potencial: ${formatAmount(totalPotentialBonus)}` : "Este periodo"
            }
            color="text-purple-500"
            secondaryIcon={totalPotentialBonus > 0 ? <Sparkles className="h-3.5 w-3.5 text-green-500" /> : undefined}
          />

          <div className="bg-white rounded-lg p-4 border shadow-sm hover:shadow-md transition-shadow">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-teal-500">
              <Users className="h-5 w-5" />
            </div>
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">Reservas</p>
              <p className="text-xl font-bold">{totalReservas}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-xs text-muted-foreground">de {totalLugares} lugares</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-3 gap-5 mt-5">
        {/* Left Column - Instructor Info */}
        <div className="md:col-span-1 space-y-5">
          <Card className="border shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Información del instructor
                </CardTitle>
                <CardDescription>Detalles y métricas del instructor</CardDescription>
              </div>
              {isEditing && (
                <Button onClick={handleSaveChanges} disabled={isSaving} size="sm">
                  {isSaving ? (
                    <>Guardando...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar
                    </>
                  )}
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="biografia">Biografía</Label>
                    <Textarea
                      id="biografia"
                      value={editedInstructor.extrainfo?.biografia || ""}
                      onChange={(e) => handleExtraInfoChange("biografia", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experiencia">Experiencia (años)</Label>
                      <Input
                        id="experiencia"
                        type="number"
                        value={editedInstructor.extrainfo?.experiencia || 0}
                        onChange={(e) => handleExtraInfoChange("experiencia", Number.parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        value={editedInstructor.extrainfo?.telefono || ""}
                        onChange={(e) => handleExtraInfoChange("telefono", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="especialidad">Especialidad</Label>
                      <Input
                        id="especialidad"
                        value={editedInstructor.extrainfo?.especialidad || ""}
                        onChange={(e) => handleExtraInfoChange("especialidad", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="activo" className="flex items-center justify-between">
                        Activo
                        <Switch
                          id="activo"
                          checked={editedInstructor.extrainfo?.activo || false}
                          onCheckedChange={(checked) => handleExtraInfoChange("activo", checked)}
                        />
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium">Métricas y requisitos</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dobleteos">Dobleteos</Label>
                        <Input
                          id="dobleteos"
                          type="number"
                          value={editedInstructor.dobleteos || 0}
                          onChange={(e) => handleInputChange("dobleteos", Number.parseInt(e.target.value))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="horariosNoPrime">Horarios no prime</Label>
                        <Input
                          id="horariosNoPrime"
                          type="number"
                          value={editedInstructor.horariosNoPrime || 0}
                          onChange={(e) => handleInputChange("horariosNoPrime", Number.parseInt(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="cumpleLineamientos">Cumple lineamientos</Label>
                        <Switch
                          id="cumpleLineamientos"
                          checked={editedInstructor.cumpleLineamientos || false}
                          onCheckedChange={(checked) => handleInputChange("cumpleLineamientos", checked)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="participacionEventos">Participa en eventos</Label>
                        <Switch
                          id="participacionEventos"
                          checked={editedInstructor.participacionEventos || false}
                          onCheckedChange={(checked) => handleInputChange("participacionEventos", checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <h3 className="text-sm font-medium mb-2">Biografía</h3>
                    <p className="text-sm">{biografia}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3">
                    <div className="p-3 bg-white border rounded-lg">
                      <h3 className="text-xs font-medium text-muted-foreground">Experiencia</h3>
                      <p className="text-sm font-medium">{experiencia} años</p>
                    </div>

                    <div className="p-3 bg-white border rounded-lg">
                      <h3 className="text-xs font-medium text-muted-foreground">Teléfono</h3>
                      <p className="text-sm font-medium">{telefono}</p>
                    </div>

                    <div className="p-3 bg-white border rounded-lg">
                      <h3 className="text-xs font-medium text-muted-foreground">Dobleteos</h3>
                      <p className="text-sm font-medium">{instructor?.dobleteos || 0}</p>
                    </div>

                    <div className="p-3 bg-white border rounded-lg">
                      <h3 className="text-xs font-medium text-muted-foreground">Horarios no prime</h3>
                      <p className="text-sm font-medium">{instructor?.horariosNoPrime || 0}</p>
                    </div>
                  </div>

                  <div className="pt-3">
                    <h3 className="text-sm font-medium mb-3">Cumplimiento de requisitos</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2.5 bg-primary/5 rounded-md border border-primary/10">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${instructor?.cumpleLineamientos ? "bg-green-500" : "bg-red-500"}`}
                          ></div>
                          <span className="text-sm">Lineamientos</span>
                        </div>
                        <Badge variant={instructor?.cumpleLineamientos ? "success" : "destructive"}>
                          {instructor?.cumpleLineamientos ? "Cumple" : "No cumple"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-primary/5 rounded-md border border-primary/10">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${instructor?.participacionEventos ? "bg-green-500" : "bg-amber-500"}`}
                          ></div>
                          <span className="text-sm">Eventos</span>
                        </div>
                        <Badge variant={instructor?.participacionEventos ? "success" : "secondary"}>
                          {instructor?.participacionEventos ? "Participa" : "No participa"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Metrics Card - Improved Design */}
          <Card className="border shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Categorías y métricas
              </CardTitle>
              <CardDescription>Información por disciplina</CardDescription>
            </CardHeader>
            <CardContent>
              {getCategoriesByDiscipline().length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No hay métricas para el periodo seleccionado
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {getCategoriesByDiscipline().map((categoria) => {
                      const categoryColor = getCategoryColor(categoria.categoria)
                      const disciplinaColor = categoria.disciplina?.color || "#6366f1"
                      const bgColorClass = getCategoryBgColor(categoria.categoria)

                      return (
                        <div
                          key={`metrics-${categoria.id}`}
                          className={`rounded-lg overflow-hidden border ${bgColorClass}`}
                        >
                          <div className="px-4 py-3 bg-white flex items-center justify-between border-b">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: disciplinaColor }} />
                              <span className="font-medium">{categoria.disciplina?.nombre}</span>
                            </div>
                            <Badge
                              variant="outline"
                              className={`bg-white font-medium ${categoryColor.replace("text-", "border-")}`}
                            >
                              <span className={categoryColor}>{formatCategoryName(categoria.categoria)}</span>
                            </Badge>
                          </div>

                          <div className="p-4 bg-gradient-to-b from-white to-gray-50">
                            <div className="grid grid-cols-3 gap-3">
                              <MetricCard
                                icon={<Calendar className="h-4 w-4 text-blue-500" />}
                                label="Clases"
                                value={categoria.metricas?.clases || 0}
                              />

                              <MetricCard
                                icon={<Users className="h-4 w-4 text-green-500" />}
                                label="Ocupación"
                                value={`${Math.round(categoria.metricas?.ocupacion || 0)}%`}
                              />

                              <MetricCard
                                icon={<Building className="h-4 w-4 text-purple-500" />}
                                label="Locales en Lima"
                                value={categoria.metricas?.localesEnLima || 0}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-5 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      La recategorización de instructores se realiza al finalizar cada periodo.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Classes and Payments */}
        <div className="md:col-span-2 space-y-5">
          <Card className="border shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Clases y cálculo de pagos
                </CardTitle>
                <CardDescription className="mt-2">
                  Listado de clases y cálculo de pagos para el instructor
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              {isLoadingClases || isLoadingDisciplinas ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : clasesPeriodo.length === 0 ? (
                <EmptyState
                  icon={<Calendar className="h-12 w-12" />}
                  title="No hay clases"
                  description="No hay clases asignadas en el periodo seleccionado."
                />
              ) : (
                <>
                  <div className="rounded-lg border overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead>Fecha</TableHead>
                            <TableHead>Disciplina</TableHead>
                            <TableHead>Estudio</TableHead>
                            <TableHead>Reservas</TableHead>
                            <TableHead>Lugares</TableHead>
                            <TableHead>Ocupación</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentPayments.map((detail) => (
                            <TableRow key={detail.claseId} className="hover:bg-muted/20">
                              <TableCell className="whitespace-nowrap">
                                <div className="flex items-center">
                                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                  {formatDate(detail.fecha)}
                                </div>
                              </TableCell>
                              <TableCell>{detail.disciplina}</TableCell>
                              <TableCell>{detail.estudio}</TableCell>
                              <TableCell>{detail.reservas}</TableCell>
                              <TableCell>{detail.capacidad}</TableCell>
                              <TableCell>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="flex items-center w-full">
                                      <div className="flex items-center w-full max-w-[120px]">
                                        <Progress
                                          value={(detail.reservas / detail.capacidad) * 100}
                                          className="h-2 mr-2"
                                        />
                                        <span className="text-sm">
                                          {Math.round((detail.reservas / detail.capacidad) * 100)}%
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {detail.reservas} reservas de {detail.capacidad} lugares
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell className="text-right font-medium whitespace-nowrap">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="flex items-center justify-end gap-1">
                                      {formatAmount(detail.montoCalculado)}
                                      <Info className="h-3 w-3 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent className="w-64 max-w-sm">
                                      {detail.detalleCalculo?.error ? (
                                        <p className="text-red-500">Error: {detail.detalleCalculo.error}</p>
                                      ) : detail.resultadoCalculo ? (
                                        <div className="space-y-1">
                                          <p className="font-semibold">Detalle de cálculo:</p>
                                          <ul className="text-xs space-y-1">
                                            {detail.detalleCalculo.pasos.map((paso: any, idx: number) => (
                                              <li key={idx} className="flex items-start gap-1">
                                                <span className="text-primary">•</span>
                                                <span>{paso.descripcion}</span>
                                              </li>
                                            ))}
                                          </ul>
                                          {detail.resultadoCalculo.bonoAplicado && (
                                            <div className="mt-2 pt-2 border-t text-xs">
                                              <span className="font-medium text-green-600">Bono potencial: </span>
                                              {formatAmount(detail.resultadoCalculo.bonoAplicado)}
                                              <p className="text-muted-foreground mt-1">
                                                El bono se aplica al final del periodo según cumplimiento de requisitos
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <p>No hay detalles disponibles</p>
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-4 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage((old) => Math.max(old - 1, 0))}
                        disabled={currentPage === 0}
                        aria-label="Página anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <span className="text-sm text-muted-foreground">
                        {currentPage + 1} / {Math.max(1, totalPages)}
                      </span>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage((old) => Math.min(old + 1, totalPages - 1))}
                        disabled={currentPage >= totalPages - 1 || totalPages === 0}
                        aria-label="Siguiente página"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment History Card */}
          <Card className="border shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Historial de pagos
              </CardTitle>
              <CardDescription>Registro de todos los pagos realizados</CardDescription>
            </CardHeader>

            <CardContent>
              <InstructorPaymentHistory pagos={pagosPeriodo} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}

// Componente de métrica con diseño de tarjeta
function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="bg-white rounded-md p-2 text-center border shadow-sm">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

// Helper function to get background color class based on category
function getCategoryBgColor(category: CategoriaInstructor): string {
  switch (category) {
    case "EMBAJADOR_SENIOR":
      return "border-purple-200"
    case "EMBAJADOR":
      return "border-blue-200"
    case "EMBAJADOR_JUNIOR":
      return "border-teal-200"
    case "INSTRUCTOR":
      return "border-gray-200"
    default:
      return "border-gray-200"
  }
}

// Helper function to get the next category
function getNextCategory(currentCategory: CategoriaInstructor): CategoriaInstructor {
  switch (currentCategory) {
    case "INSTRUCTOR":
      return "EMBAJADOR_JUNIOR"
    case "EMBAJADOR_JUNIOR":
      return "EMBAJADOR"
    case "EMBAJADOR":
      return "EMBAJADOR_SENIOR"
    default:
      return "EMBAJADOR_SENIOR"
  }
}

// Helper components
function StatCard({
  icon,
  title,
  value,
  description,
  color,
  secondaryIcon,
}: {
  icon: React.ReactNode
  title: string
  value: string | number
  description: string
  color?: string
  secondaryIcon?: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-lg p-4 border shadow-sm hover:shadow-md transition-shadow">
      <div className={`h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center ${color}`}>{icon}</div>
      <div className="mt-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-xl font-bold">{value}</p>
        <div className="flex items-center gap-1 mt-0.5">
          {secondaryIcon && <div className="mr-1">{secondaryIcon}</div>}
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  )
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
      <div className="mx-auto h-12 w-12 text-muted-foreground opacity-50">{icon}</div>
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function InstructorDetailSkeleton() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 border">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] md:col-span-1 rounded-lg" />
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-[300px] rounded-lg" />
            <Skeleton className="h-[200px] rounded-lg" />
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
