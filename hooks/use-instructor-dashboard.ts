"use client"

import { useState, useEffect } from "react"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { useClasesStore } from "@/store/useClasesStore"
import { usePagosStore } from "@/store/usePagosStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import type { Instructor, Clase, PagoInstructor } from "@/types/schema"

export function useInstructorDashboard(instructorId: number) {
  // Tabs state
  const [activeTab, setActiveTab] = useState<string>("clases")

  // Store hooks
  const { fetchInstructor, instructorSeleccionado, isLoading } = useInstructoresStore()
  const { fetchClases, clases, isLoading: isLoadingClases } = useClasesStore()
  const { periodos, periodosSeleccionados, periodoActual } = usePeriodosStore()
  const { pagos, fetchPagos, isLoading: isLoadingPagos } = usePagosStore()
  const { disciplinas, fetchDisciplinas } = useDisciplinasStore()

  // Local state
  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [clasesInstructor, setClasesInstructor] = useState<Clase[]>([])
  const [pagosPeriodo, setPagosPeriodo] = useState<PagoInstructor[]>([])
  const [stats, setStats] = useState({
    totalClases: 0,
    clasesCompletadas: 0,
    proximasClases: 0,
    ocupacionPromedio: 0,
    totalReservas: 0,
    totalPagos: 0,
    pagosPendientes: 0,
    ultimoPago: 0,
  })

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchInstructor(instructorId), fetchClases(), fetchPagos(), fetchDisciplinas()])
    }

    loadData()
  }, [instructorId, fetchInstructor, fetchClases, fetchPagos, fetchDisciplinas])

  // Update instructor state when instructorSeleccionado changes
  useEffect(() => {
    if (instructorSeleccionado) {
      setInstructor(instructorSeleccionado)
    }
  }, [instructorSeleccionado])

  // Filter classes and payments when periods change
  useEffect(() => {
    if (clases.length > 0 && instructor) {
      // Filter classes for this instructor
      const filteredClases = clases.filter((clase) => clase.instructorId === instructorId)

      // If there are selected periods, filter by them
      const clasesFiltered =
        periodosSeleccionados.length > 0
          ? filteredClases.filter((clase) => periodosSeleccionados.some((p) => p.id === clase.periodoId))
          : filteredClases

      setClasesInstructor(clasesFiltered)

      // Calculate stats
      const now = new Date()
      const completedClasses = clasesFiltered.filter((clase) => new Date(clase.fecha) < now)
      const upcomingClasses = clasesFiltered.filter((clase) => new Date(clase.fecha) >= now)

      const totalReservas = clasesFiltered.reduce((sum, clase) => sum + clase.reservasTotales, 0)
      const totalCapacidad = clasesFiltered.reduce((sum, clase) => sum + clase.lugares, 0)
      const ocupacionPromedio = totalCapacidad > 0 ? Math.round((totalReservas / totalCapacidad) * 100) : 0

      // Filter payments for this instructor
      const filteredPagos = pagos.filter((pago) => pago.instructorId === instructorId)

      // If there are selected periods, filter by them
      const pagosFiltered =
        periodosSeleccionados.length > 0
          ? filteredPagos.filter((pago) => periodosSeleccionados.some((p) => p.id === pago.periodoId))
          : filteredPagos

      setPagosPeriodo(pagosFiltered)

      // Calculate payment stats
      const totalPagos = pagosFiltered.reduce((sum, pago) => sum + pago.pagoFinal, 0)
      const pagosPendientes = pagosFiltered
        .filter((pago) => pago.estado === "PENDIENTE")
        .reduce((sum, pago) => sum + pago.pagoFinal, 0)

      // Get most recent payment amount
      const sortedPagos = [...pagosFiltered].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      )
      const ultimoPago = sortedPagos.length > 0 ? sortedPagos[0].pagoFinal : 0

      // Update stats
      setStats({
        totalClases: clasesFiltered.length,
        clasesCompletadas: completedClasses.length,
        proximasClases: upcomingClasses.length,
        ocupacionPromedio,
        totalReservas,
        totalPagos,
        pagosPendientes,
        ultimoPago,
      })
    }
  }, [clases, pagos, instructor, instructorId, periodosSeleccionados])

  // Get categories by discipline for current period
  const categoriasPorDisciplina =
    instructor?.categorias?.filter(
      (cat) => !periodosSeleccionados.length || periodosSeleccionados.some((p) => p.id === cat.periodoId),
    ) || []

  return {
    instructor,
    isLoading,
    activeTab,
    setActiveTab,
    stats,
    clasesInstructor,
    pagosPeriodo,
    categoriasPorDisciplina,
    isLoadingClases,
    isLoadingPagos,
  }
}
