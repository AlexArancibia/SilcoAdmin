"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { usePagosStore } from "@/store/usePagosStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { useClasesStore } from "@/store/useClasesStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { evaluarFormula } from "@/lib/formula-evaluator"
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
import {
  ArrowUpDown,
  Calendar,
  Calculator,
  ChevronDown,
  Download,
  Eye,
  Filter,
  Loader2,
  Percent,
  RefreshCw,
  Search,
  Users,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { EstadoPago, TipoReajuste, PagoInstructor, Instructor, Disciplina, Periodo, Clase } from "@/types/schema"
import { PagosStats } from "@/components/payments/pagos-stats"

export default function PagosPage() {
  const router = useRouter()
  const { pagos, fetchPagos, actualizarPago, isLoading: isLoadingPagos } = usePagosStore()
  const { periodos, fetchPeriodos, periodoSeleccionadoId, setPeriodoSeleccionado } = usePeriodosStore()
  const { instructores, fetchInstructores } = useInstructoresStore()
  const { clases, fetchClases } = useClasesStore()
  const { disciplinas, fetchDisciplinas } = useDisciplinasStore()

  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [filtroInstructor, setFiltroInstructor] = useState<string>("todos")
  const [busqueda, setBusqueda] = useState<string>("")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "periodoId",
    direction: "desc",
  })
  const [isRecalculando, setIsRecalculando] = useState<boolean>(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>("todos")
  const [paginaActual, setPaginaActual] = useState<number>(1)
  const elementosPorPagina = 10

  // Cargar datos iniciales
  useEffect(() => {
    fetchPeriodos()
    fetchInstructores()
    fetchDisciplinas()
  }, [fetchPeriodos, fetchInstructores, fetchDisciplinas])

  // Cargar pagos cuando cambie el periodo seleccionado
  useEffect(() => {
    if (periodoSeleccionadoId) {
      fetchPagos({ periodoId: periodoSeleccionadoId })
      fetchClases({ periodoId: periodoSeleccionadoId })
    }
  }, [fetchPagos, fetchClases, periodoSeleccionadoId])

  // Filtrar pagos
  const filteredPagos = pagos.filter((pago) => {
    let match = true

    if (filtroEstado !== "todos") {
      match = match && pago.estado === filtroEstado
    }

    if (filtroInstructor !== "todos") {
      match = match && pago.instructorId === Number.parseInt(filtroInstructor)
    }

    if (busqueda) {
      const instructor = instructores.find((i) => i.id === pago.instructorId)
      const instructorNombre = instructor ? instructor.nombre.toLowerCase() : ""
      const periodo = periodos.find((p) => p.id === pago.periodoId)
      const periodoNombre = periodo ? `Periodo ${periodo.numero} - ${periodo.año}`.toLowerCase() : ""

      match =
        match &&
        (instructorNombre.includes(busqueda.toLowerCase()) ||
          periodoNombre.includes(busqueda.toLowerCase()) ||
          pago.estado.toLowerCase().includes(busqueda.toLowerCase()))
    }

    return match
  })

  // Filtrar por tab activo
  const tabFilteredPagos =
    activeTab === "todos"
      ? filteredPagos
      : filteredPagos.filter((pago) => {
          if (activeTab === "pendientes") return pago.estado === "PENDIENTE"
          if (activeTab === "aprobados") return pago.estado === "APROBADO"
          return true
        })

  // Ordenar pagos
  const sortedPagos = [...tabFilteredPagos].sort((a, b) => {
    if (sortConfig.key === "periodoId") {
      return sortConfig.direction === "asc" ? a.periodoId - b.periodoId : b.periodoId - a.periodoId
    }

    if (sortConfig.key === "instructorId") {
      const instructorA = instructores.find((i) => i.id === a.instructorId)?.nombre || ""
      const instructorB = instructores.find((i) => i.id === b.instructorId)?.nombre || ""
      return sortConfig.direction === "asc"
        ? instructorA.localeCompare(instructorB)
        : instructorB.localeCompare(instructorA)
    }

    if (sortConfig.key === "monto") {
      return sortConfig.direction === "asc" ? a.monto - b.monto : b.monto - a.monto
    }

    if (sortConfig.key === "estado") {
      return sortConfig.direction === "asc" ? a.estado.localeCompare(b.estado) : b.estado.localeCompare(a.estado)
    }

    if (sortConfig.key === "fecha") {
      const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(a.createdAt!)
      const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt!)
      return sortConfig.direction === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
    }

    return 0
  })

  // Paginación
  const totalPaginas = Math.ceil(sortedPagos.length / elementosPorPagina)
  const paginatedPagos = sortedPagos.slice((paginaActual - 1) * elementosPorPagina, paginaActual * elementosPorPagina)

  // Función para cambiar el ordenamiento
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  // Función para obtener el nombre del instructor
  const getNombreInstructor = (instructorId: number): string => {
    const instructor = instructores.find((i) => i.id === instructorId)
    return instructor ? instructor.nombre : `Instructor ${instructorId}`
  }

  // Función para obtener el nombre del periodo
  const getNombrePeriodo = (periodoId: number): string => {
    const periodo = periodos.find((p) => p.id === periodoId)
    return periodo ? `Periodo ${periodo.numero} - ${periodo.año}` : `Periodo ${periodoId}`
  }

  // Función para formatear moneda
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Función para obtener el color del estado
  const getEstadoColor = (estado: EstadoPago): string => {
    switch (estado) {
      case "APROBADO":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  // Función para calcular el monto final con retención y reajuste
  const calcularMontoFinal = (pago: PagoInstructor): number => {
    let montoFinal = pago.monto

    // Aplicar retención (obligatorio según schema)
    montoFinal -= pago.retencion

    // Aplicar reajuste (obligatorio según schema)
    if (pago.tipoReajuste === "PORCENTAJE") {
      montoFinal += (pago.monto * pago.reajuste) / 100
    } else {
      // FIJO
      montoFinal += pago.reajuste
    }

    return montoFinal
  }

  // Función para obtener la fórmula de una disciplina para un periodo específico
  const getFormulaDisciplina = (disciplinaId: number, periodoId: number) => {
    const disciplina = disciplinas.find(d => d.id === disciplinaId)
    if (!disciplina || !disciplina.formulas) return null
    
    const formulaDB = disciplina.formulas.find(f => f.periodoId === periodoId)
    return formulaDB ? formulaDB.parametros.formula : null
  }

  // Función para recalcular todos los pagos
  const recalcularTodosPagos = async () => {
    if (!periodoSeleccionadoId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un periodo para recalcular los pagos",
        variant: "destructive",
      })
      return
    }

    setIsRecalculando(true)
    setShowConfirmDialog(false)

    try {
      // Obtener todos los instructores
      const todosInstructores = instructores

      // Obtener todas las clases del periodo
      await fetchClases({ periodoId: periodoSeleccionadoId })

      let pagosActualizados = 0
      let pagosCreados = 0
      let instructoresSinClases = 0

      // Para cada instructor, recalcular su pago
      for (const instructor of todosInstructores) {
        // Filtrar clases del instructor en este periodo
        const clasesInstructor = clases.filter(
          (clase) => clase.instructorId === instructor.id && clase.periodoId === periodoSeleccionadoId,
        )

        if (clasesInstructor.length === 0) {
          instructoresSinClases++
          continue // Saltar al siguiente instructor si no tiene clases
        }

        // Calcular el monto total
        let montoTotal = 0
        const detallesClases = []

        for (const clase of clasesInstructor) {
          // Obtener la fórmula de la disciplina para este periodo
          const formula = getFormulaDisciplina(clase.disciplinaId, periodoSeleccionadoId)

          // Datos para evaluar la fórmula
          const datosEvaluacion = {
            reservaciones: clase.reservasTotales,
            listaEspera: clase.listasEspera,
            cortesias: clase.cortesias,
            capacidad: clase.lugares,
            reservasPagadas: clase.reservasPagadas,
            lugares: clase.lugares,
          }

          let montoCalculado = 0
          let detalleCalculo = null

          // Evaluar la fórmula si existe
          if (formula) {
            try {
              const resultado = evaluarFormula(formula, datosEvaluacion)
              montoCalculado = resultado.valor
              detalleCalculo = resultado
            } catch (error) {
              console.error(`Error al evaluar fórmula para clase ${clase.id}:`, error)
              montoCalculado = 0
              detalleCalculo = { error: error instanceof Error ? error.message : "Error desconocido" }
            }
          } else {
            // Si no hay fórmula, registrar un error
            montoCalculado = 0
            detalleCalculo = { error: "No hay fórmula definida para esta disciplina en este periodo" }
          }

          // Agregar a los totales
          montoTotal += montoCalculado

          // Agregar detalle de clase
          detallesClases.push({
            claseId: clase.id,
            montoCalculado,
            detalleCalculo,
            disciplinaId: clase.disciplinaId,
            fechaClase: clase.fecha,
          })
        }

        // Buscar si ya existe un pago para este instructor en este periodo
        const pagoExistente = pagos.find(
          (p) => p.instructorId === instructor.id && p.periodoId === periodoSeleccionadoId,
        )

        if (pagoExistente) {
          // Mantener los valores de retención y reajuste existentes
          const { retencion, reajuste, tipoReajuste } = pagoExistente

          // Actualizar pago existente
          await actualizarPago(pagoExistente.id,{
            ...pagoExistente,
            monto: montoTotal,
            retencion,
            reajuste,
            tipoReajuste,
            detalles: {
              ...pagoExistente.detalles,
              clases: detallesClases,
              resumen: {
                ...pagoExistente.detalles?.resumen,
                totalClases: clasesInstructor.length,
                totalMonto: montoTotal,
                comentarios: `Pago recalculado automáticamente el ${new Date().toLocaleDateString()}`,
              },
            },
          })
          pagosActualizados++
        } else {
          // Crear nuevo pago (simulado ya que no tenemos función crearPago)
          // En una implementación real, deberías llamar a tu API para crear el pago
          console.log("Nuevo pago a crear:", {
            instructorId: instructor.id,
            periodoId: periodoSeleccionadoId,
            monto: montoTotal,
            estado: "PENDIENTE" as EstadoPago,
            retencion: 0,
            reajuste: 0,
            tipoReajuste: "FIJO" as TipoReajuste,
            detalles: {
              clases: detallesClases,
              resumen: {
                totalClases: clasesInstructor.length,
                totalMonto: montoTotal,
                comentarios: `Pago creado automáticamente el ${new Date().toLocaleDateString()}`,
                moneda: "PEN",
              },
            },
          })
          pagosCreados++
        }
      }

      // Recargar pagos
      await fetchPagos({ periodoId: periodoSeleccionadoId })

      toast({
        title: "Recálculo completado",
        description: `Se han actualizado ${pagosActualizados} pagos y creado ${pagosCreados} nuevos. ${instructoresSinClases} instructores sin clases.`,
      })
    } catch (error) {
      toast({
        title: "Error al recalcular pagos",
        description: error instanceof Error ? error.message : "Error desconocido al recalcular pagos",
        variant: "destructive",
      })
    } finally {
      setIsRecalculando(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Gestión de Pagos</h1>
          <p className="text-muted-foreground">Administra y recalcula los pagos de todos los instructores</p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={periodoSeleccionadoId?.toString() || ""}
            onValueChange={(value) => setPeriodoSeleccionado(value ? Number(value) : null)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Seleccionar periodo" />
            </SelectTrigger>
            <SelectContent>
              {periodos.map((periodo) => (
                <SelectItem key={periodo.id} value={periodo.id.toString()}>
                  Periodo {periodo.numero} - {periodo.año}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="default"
            onClick={() => setShowConfirmDialog(true)}
            disabled={isRecalculando || !periodoSeleccionadoId}
          >
            {isRecalculando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Recalcular Pagos
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PagosStats pagos={pagos} instructores={instructores} periodos={periodos} />
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="bg-muted/20 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl text-primary">Todos los Pagos</CardTitle>
            <CardDescription>
              {periodoSeleccionadoId
                ? `Pagos del ${getNombrePeriodo(periodoSeleccionadoId)}`
                : "Selecciona un periodo para ver los pagos"}
            </CardDescription>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="border-muted">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger
                value="todos"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Todos
              </TabsTrigger>
              <TabsTrigger
                value="pendientes"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Pendientes
              </TabsTrigger>
              <TabsTrigger
                value="aprobados"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Aprobados
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por instructor, periodo o estado..."
                  className="pl-8 bg-background border-muted"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger className="w-[180px] bg-background border-muted">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                    <SelectItem value="APROBADO">Aprobados</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filtroInstructor} onValueChange={setFiltroInstructor}>
                  <SelectTrigger className="w-[180px] bg-background border-muted">
                    <Users className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los instructores</SelectItem>
                    {instructores.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id.toString()}>
                        {instructor.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoadingPagos ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                <div className="rounded-lg border shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="text-primary font-medium">
                          <Button
                            variant="ghost"
                            onClick={() => requestSort("instructorId")}
                            className="text-primary group"
                          >
                            Instructor
                            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-primary font-medium">
                          <Button
                            variant="ghost"
                            onClick={() => requestSort("periodoId")}
                            className="text-primary group"
                          >
                            Periodo
                            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-primary font-medium">
                          <Button variant="ghost" onClick={() => requestSort("monto")} className="text-primary group">
                            Monto Base
                            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-primary font-medium">Ajustes</TableHead>
                        <TableHead className="text-primary font-medium">Monto Final</TableHead>
                        <TableHead className="text-primary font-medium">
                          <Button variant="ghost" onClick={() => requestSort("estado")} className="text-primary group">
                            Estado
                            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right text-primary font-medium">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPagos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                            No se encontraron pagos con los filtros seleccionados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedPagos.map((pago) => {
                          const montoFinal = calcularMontoFinal(pago)

                          return (
                            <TableRow key={pago.id} className="hover:bg-muted/20 transition-colors">
                              <TableCell className="font-medium">{getNombreInstructor(pago.instructorId)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-primary/60" />
                                  {getNombrePeriodo(pago.periodoId)}
                                </div>
                              </TableCell>
                              <TableCell>{formatCurrency(pago.monto)}</TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1 text-xs">
                                  {pago.retencion > 0 && (
                                    <span className="text-red-600">Retención: -{formatCurrency(pago.retencion)}</span>
                                  )}
                                  {pago.reajuste > 0 && (
                                    <span className="text-green-600 flex items-center">
                                      Reajuste:{" "}
                                      {pago.tipoReajuste === "PORCENTAJE" ? (
                                        <span className="flex items-center">
                                          +{pago.reajuste}%
                                          <Percent className="h-3 w-3 ml-1" />
                                        </span>
                                      ) : (
                                        `+${formatCurrency(pago.reajuste)}`
                                      )}
                                    </span>
                                  )}
                                  {pago.retencion === 0 && pago.reajuste === 0 && (
                                    <span className="text-muted-foreground">Sin ajustes</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{formatCurrency(montoFinal)}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getEstadoColor(pago.estado)}>
                                  {pago.estado}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted transition-colors">
                                      <span className="sr-only">Abrir menú</span>
                                      <ChevronDown className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40 rounded-lg">
                                    <DropdownMenuItem
                                      className="cursor-pointer"
                                      onClick={() => router.push(`/pagos/${pago.id}`)}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      Ver detalles
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer">
                                      <Calculator className="mr-2 h-4 w-4" />
                                      Recalcular
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer">
                                      <Download className="mr-2 h-4 w-4" />
                                      Exportar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginación */}
                {totalPaginas > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {(paginaActual - 1) * elementosPorPagina + 1} a{" "}
                      {Math.min(paginaActual * elementosPorPagina, sortedPagos.length)} de {sortedPagos.length} pagos
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPaginaActual(paginaActual - 1)}
                        disabled={paginaActual === 1}
                      >
                        Anterior
                      </Button>
                      {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                        <Button
                          key={pagina}
                          variant={pagina === paginaActual ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPaginaActual(pagina)}
                          className={pagina === paginaActual ? "bg-primary text-primary-foreground" : ""}
                        >
                          {pagina}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPaginaActual(paginaActual + 1)}
                        disabled={paginaActual === totalPaginas}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar recálculo de pagos</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción recalculará los pagos de todos los instructores para el periodo seleccionado. Los montos se
              actualizarán basados en las clases impartidas y las fórmulas de cada disciplina. ¿Estás seguro de que
              deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={recalcularTodosPagos}>Recalcular Pagos</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}