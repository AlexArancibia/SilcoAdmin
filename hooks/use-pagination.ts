"use client"

import { useState, useMemo } from "react"
import type { PagoInstructor } from "@/types/schema"

export function usePagination(sortedPagos: PagoInstructor[]) {
  const [paginaActual, setPaginaActual] = useState<number>(1)
  const [elementosPorPagina, setElementosPorPagina] = useState<number>(10)

  // Paginación
  const totalPaginas = useMemo(() => {
    return Math.ceil(sortedPagos.length / elementosPorPagina)
  }, [sortedPagos.length, elementosPorPagina])

  const paginatedPagos = useMemo(() => {
    return sortedPagos.slice((paginaActual - 1) * elementosPorPagina, paginaActual * elementosPorPagina)
  }, [sortedPagos, paginaActual, elementosPorPagina])

  return {
    paginaActual,
    setPaginaActual,
    elementosPorPagina,
    setElementosPorPagina,
    totalPaginas,
    paginatedPagos,
  }
}
