"use client"

import { useState, useMemo } from "react"
import type { PagoInstructor, Instructor, Periodo } from "@/types/schema"

export function useFilters(pagos: PagoInstructor[], instructores: Instructor[], periodos: Periodo[]) {
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [filtroInstructor, setFiltroInstructor] = useState<string>("todos")
  const [busqueda, setBusqueda] = useState<string>("")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "periodoId",
    direction: "desc",
  })

  // Filtrar pagos por periodos seleccionados y otros filtros
  const filteredPagos = useMemo(() => {
    return pagos.filter((pago) => {
      // Filtrar por periodos seleccionados
      const periodoPago = periodos.find((p) => p.id === pago.periodoId)
      const enPeriodosSeleccionados = periodos.length === 0 || periodos.some((p) => p.id === pago.periodoId)

      if (!enPeriodosSeleccionados) return false

      // Resto de filtros
      if (filtroEstado !== "todos" && pago.estado !== filtroEstado) return false
      if (filtroInstructor !== "todos" && pago.instructorId !== Number.parseInt(filtroInstructor)) return false

      if (busqueda) {
        const instructor = instructores.find((i) => i.id === pago.instructorId)
        const instructorNombre = instructor ? instructor.nombre.toLowerCase() : ""
        const periodoNombre = periodoPago ? `Periodo ${periodoPago.numero} - ${periodoPago.año}`.toLowerCase() : ""

        if (
          !(
            instructorNombre.includes(busqueda.toLowerCase()) ||
            periodoNombre.includes(busqueda.toLowerCase()) ||
            pago.estado.toLowerCase().includes(busqueda.toLowerCase())
          )
        ) {
          return false
        }
      }

      return true
    })
  }, [pagos, periodos, filtroEstado, filtroInstructor, busqueda, instructores])

  // Ordenar pagos
  const sortedPagos = useMemo(() => {
    return [...filteredPagos].sort((a, b) => {
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
  }, [filteredPagos, sortConfig, instructores])

  // Función para cambiar el ordenamiento
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  return {
    filtroEstado,
    setFiltroEstado,
    filtroInstructor,
    setFiltroInstructor,
    busqueda,
    setBusqueda,
    sortConfig,
    setSortConfig,
    filteredPagos,
    sortedPagos,
    requestSort,
  }
}
