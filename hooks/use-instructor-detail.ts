"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { useClasesStore } from "@/store/useClasesStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { usePagosStore } from "@/store/usePagosStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { useFormulasStore } from "@/store/useFormulaStore"
import { calcularPago } from "@/lib/formula-evaluator"
import { toast } from "@/hooks/use-toast"
import type { Instructor, PagoInstructor, Clase } from "@/types/schema"
import type { ResultadoCalculo } from "@/lib/formula-evaluator"

export function useInstructorDetail(instructorId: number) {
  // Store hooks
  const { fetchInstructor, instructorSeleccionado, isLoading, actualizarInstructor } = useInstructoresStore()
  const { fetchClases, clases, isLoading: isLoadingClases } = useClasesStore()
  const { periodos, periodosSeleccionados, fetchPeriodos } = usePeriodosStore()
  const { actualizarPago, isLoading: isLoadingPagos } = usePagosStore()
  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()
  const { formulas, fetchFormulas } = useFormulasStore()

  // Local state
  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [paymentDetails, setPaymentDetails] = useState<any[]>([])
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null)
  const [clasesPeriodo, setClasesPeriodo] = useState<Clase[]>([])
  const [pagosPeriodo, setPagosPeriodo] = useState<PagoInstructor[]>([])
  const [allPagosInstructor, setAllPagosInstructor] = useState<PagoInstructor[]>([])
  const [isLoadingAllPagos, setIsLoadingAllPagos] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedInstructor, setEditedInstructor] = useState<Partial<Instructor>>({})
  const dataLoaded = useRef(false)

  const itemsPerPage = 10
  const totalPages = Math.ceil(allPagosInstructor.length / itemsPerPage)
  const startIndex = currentPage * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPayments = allPagosInstructor.slice(startIndex, endIndex)

  // Fetch all payments for this instructor
  const fetchAllInstructorPagos = useCallback(async () => {
    if (!instructorId) return
    
    setIsLoadingAllPagos(true)
    try {
      const response = await fetch(`/api/pagos?instructorId=${instructorId}&limit=100`)
      const data = await response.json()
      
      if (response.ok) {
        // Sort payments by most recent first
        const sortedPagos = data.data.sort((a: PagoInstructor, b: PagoInstructor) => {
          const dateA = new Date(b.updatedAt || b.createdAt || 0)
          const dateB = new Date(a.updatedAt || a.createdAt || 0)
          return dateA.getTime() - dateB.getTime()
        })
        setAllPagosInstructor(sortedPagos)
      } else {
        console.error('Error fetching instructor payments:', data.error)
        setAllPagosInstructor([])
      }
    } catch (error) {
      console.error('Error fetching instructor payments:', error)
      setAllPagosInstructor([])
    } finally {
      setIsLoadingAllPagos(false)
    }
  }, [instructorId])

  // Load initial data
  useEffect(() => {
    if (dataLoaded.current) return
    dataLoaded.current = true

    const loadData = async () => {
      try {
        await Promise.all([
          fetchInstructor(instructorId),
          fetchDisciplinas(),
          fetchFormulas(),
          fetchClases(),
          fetchAllInstructorPagos(),
        ])
      } catch (error) {
        console.error("Error al cargar datos:", error)
      }
    }

    loadData()
  }, [instructorId, fetchInstructor, fetchDisciplinas, fetchFormulas, fetchClases, fetchAllInstructorPagos])

  // Update instructor state when instructorSeleccionado changes
  useEffect(() => {
    if (instructorSeleccionado) {
      setInstructor(instructorSeleccionado)
      setEditedInstructor({
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

      // Filter payments by selected periods from all payments
      const filteredPagos = allPagosInstructor.filter(
        (pago: PagoInstructor) => periodosSeleccionados.some((p) => p.id === pago.periodoId)
      )

      setClasesPeriodo(filteredClases)
      setPagosPeriodo(filteredPagos)
    } else {
      setClasesPeriodo([])
      setPagosPeriodo([])
    }
  }, [clases, allPagosInstructor, periodosSeleccionados, instructorId])

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

  // Handle editing functions
  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setEditedInstructor({
        extrainfo: { ...instructor?.extrainfo },
      })
    }
    setIsEditing(!isEditing)
  }

  const handleSaveChanges = async () => {
    if (!instructor) return

    try {
      setIsSaving(true)

      // Update instructor data
      const updatedInstructor = await actualizarInstructor(instructor.id, editedInstructor)
      setInstructor(updatedInstructor)

      // If there are payments for the current period, update the latest one with the new metrics
      if (pagosPeriodo.length > 0) {
        const latestPago = pagosPeriodo[0]
        await actualizarPago(latestPago.id, {
          ...latestPago,
          dobleteos: editedPaymentMetrics.dobleteos,
          horariosNoPrime: editedPaymentMetrics.horariosNoPrime,
          participacionEventos: editedPaymentMetrics.participacionEventos,
          cumpleLineamientos: editedPaymentMetrics.cumpleLineamientos,
        })

        // Refresh payments data
        await fetchAllInstructorPagos() // Use fetchAllInstructorPagos to update the state
      }

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

  // Derived calculations
  const totalClases = clasesPeriodo.length
  const clasesCompletadas = clasesPeriodo.filter((c) => new Date(c.fecha) < new Date()).length
  const totalReservas = clasesPeriodo.reduce((sum, c) => sum + c.reservasTotales, 0)
  const totalLugares = clasesPeriodo.reduce((sum, c) => sum + c.lugares, 0)
  const totalMonto = paymentDetails.reduce((sum, detail) => sum + detail.montoCalculado, 0)
  const ocupacionPromedio = totalLugares > 0 ? Math.round((totalReservas / totalLugares) * 100) : 0

  // Add a new function to calculate total potential bonus
  const totalPotentialBonus = paymentDetails.reduce(
    (sum, detail) => sum + (detail.resultadoCalculo?.bonoAplicado || 0),
    0,
  )

  // Add a new state for edited payment metrics
  const [editedPaymentMetrics, setEditedPaymentMetrics] = useState({
    dobleteos: 0,
    horariosNoPrime: 0,
    participacionEventos: false,
    cumpleLineamientos: false,
  })

  // Update this useEffect to initialize payment metrics from the most recent payment
  useEffect(() => {
    if (pagosPeriodo.length > 0) {
      // Sort payments by period ID to get the most recent one
      const sortedPagos = [...pagosPeriodo].sort((a, b) => b.periodoId - a.periodoId)
      const latestPago = sortedPagos[0]

      setEditedPaymentMetrics({
        dobleteos: latestPago.dobleteos || 0,
        horariosNoPrime: latestPago.horariosNoPrime || 0,
        participacionEventos: latestPago.participacionEventos || false,
        cumpleLineamientos: latestPago.cumpleLineamientos || false,
      })
    }
  }, [pagosPeriodo])

  // Add a handler for payment metrics changes
  const handlePaymentMetricChange = (field: string, value: any) => {
    setEditedPaymentMetrics((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return {
    instructor,
    isLoading,
    isEditing,
    isSaving,
    editedInstructor,
    handleEditToggle,
    handleSaveChanges,
    handleInputChange,
    handleExtraInfoChange,
    clasesPeriodo,
    paymentDetails,
    currentPage,
    setCurrentPage,
    totalPages,
    currentPayments,
    pagosPeriodo,
    allPagosInstructor,
    isLoadingAllPagos,
    totalClases,
    clasesCompletadas,
    totalReservas,
    totalLugares,
    totalMonto,
    ocupacionPromedio,
    totalPotentialBonus,
    getCategoriesByDiscipline,
    isLoadingClases,
    isLoadingDisciplinas,
    editedPaymentMetrics,
    handlePaymentMetricChange,
    fetchAllInstructorPagos,
  }
}
