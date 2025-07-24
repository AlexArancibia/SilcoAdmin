"use client"

import { useState, useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { usePagosStore } from "@/store/usePagosStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { useClasesStore } from "@/store/useClasesStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { useFormulasStore } from "@/store/useFormulaStore"
import { calcularPago } from "@/lib/formula-evaluator"
import { instructoresApi } from "@/lib/api/instructores-api"
import { retencionValor } from "@/utils/const"
import { mostrarCategoriaVisual, HORARIOS_NO_PRIME } from "@/utils/config"
import type { CategoriaInstructor, EstadoPago, FormulaDB, CategoriaInstructorModel, Periodo, Penalizacion, Clase } from "@/types/schema"
import { useCoversStore } from "@/store/useCoverStore"

// Función auxiliar para obtener una clave de fecha consistente
function obtenerClaveFecha(fecha: any): string {
  try {
    if (typeof fecha === "string") {
      const match = fecha.match(/^\d{4}-\d{2}-\d{2}/)
      if (match) {
        return match[0]
      }

      const dateObj = new Date(fecha)
      if (!isNaN(dateObj.getTime())) {
        return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`
      }

      return fecha
    }

    if (fecha instanceof Date && !isNaN(fecha.getTime())) {
      return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`
    }

    if (fecha && typeof fecha === "object") {
      if ("year" in fecha && "month" in fecha && "day" in fecha) {
        return `${fecha.year}-${String(fecha.month).padStart(2, "0")}-${String(fecha.day).padStart(2, "0")}`
      }
    }

    return JSON.stringify(fecha)
  } catch (error) {
    console.error("Error al obtener clave de fecha:", error)
    return "fecha-invalida"
  }
}

// Función auxiliar para obtener la hora de una fecha
function obtenerHora(fecha: any): string {
  try {
    if (typeof fecha === "string") {
      const match = fecha.match(/\d{2}:\d{2}/)
      if (match) {
        return match[0]
      }

      const dateObj = new Date(fecha)
      if (!isNaN(dateObj.getTime())) {
        return `${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`
      }

      return "00:00"
    }

    if (fecha instanceof Date && !isNaN(fecha.getTime())) {
      return `${String(fecha.getHours()).padStart(2, "0")}:${String(fecha.getMinutes()).padStart(2, "0")}`
    }

    if (fecha && typeof fecha === "object") {
      if ("hours" in fecha && "minutes" in fecha) {
        return `${String(fecha.hours).padStart(2, "0")}:${String(fecha.minutes).padStart(2, "0")}`
      }
    }

    return "00:00"
  } catch (error) {
    console.error("Error al obtener hora:", error)
    return "00:00"
  }
}

// Función para calcular dobleteos (clases consecutivas) para un instructor en la disciplina Síclo
const calcularDobleteos = (clasesInstructor: any[], disciplinaSicloId: number | null): number => {
  if (!disciplinaSicloId || clasesInstructor.length === 0) {
    return 0
  }

  const clasesSiclo = clasesInstructor.filter((c) => c.disciplinaId === disciplinaSicloId)

  if (clasesSiclo.length <= 1) {
    return 0
  }

  const clasesPorDia: Record<string, any[]> = {}

  clasesSiclo.forEach((clase) => {
    const fechaKey = obtenerClaveFecha(clase.fecha)

    if (!clasesPorDia[fechaKey]) {
      clasesPorDia[fechaKey] = []
    }

    clasesPorDia[fechaKey].push({
      ...clase,
      hora: obtenerHora(clase.fecha),
    })
  })

  let totalDobleteos = 0

  Object.values(clasesPorDia).forEach((clasesDelDia) => {
    clasesDelDia.sort((a, b) => {
      const horaA = a.hora.split(":").map(Number)
      const horaB = b.hora.split(":").map(Number)

      if (horaA[0] !== horaB[0]) {
        return horaA[0] - horaB[0]
      }
      return horaA[1] - horaB[1]
    })

    for (let i = 0; i < clasesDelDia.length - 1; i++) {
      const horaActual = clasesDelDia[i].hora.split(":").map(Number)
      const horaSiguiente = clasesDelDia[i + 1].hora.split(":").map(Number)

      if (
        (horaSiguiente[0] === horaActual[0] + 1 && horaSiguiente[1] === horaActual[1]) ||
        (horaSiguiente[0] === horaActual[0] && Math.abs(horaSiguiente[1] - horaActual[1]) === 60)
      ) {
        totalDobleteos++
      }
    }
  })

  return totalDobleteos / 4
}

export function useCalculation(
  setShowProcessLogsDialog: (show: boolean) => void,
  setShowCalculateDialog: (show: boolean) => void,
) {
  const { pagos, fetchPagos, actualizarPago, crearPago } = usePagosStore()
  const { periodos, periodoActual, actualizarPeriodo } = usePeriodosStore()
  const { instructores, fetchInstructores, actualizarInstructor } = useInstructoresStore()
  const { clases } = useClasesStore()
  const { disciplinas } = useDisciplinasStore()
  const { formulas, fetchFormulas, crearFormula } = useFormulasStore()

  const [isCalculatingPayments, setIsCalculatingPayments] = useState<boolean>(false)
  const [processLogs, setProcessLogs] = useState<string[]>([])
  const [selectedPeriodoId, setSelectedPeriodoId] = useState<number | null>(null)
  const [calcularBonoEnPeriodo, setCalcularBonoEnPeriodo] = useState<boolean>(false)

  // Estados para el diálogo de duplicación de fórmulas
  const [showFormulaDuplicationDialog, setShowFormulaDuplicationDialog] = useState<boolean>(false)
  const [periodoOrigenFormulas, setPeriodoOrigenFormulas] = useState<Periodo | null>(null)
  const [isDuplicatingFormulas, setIsDuplicatingFormulas] = useState<boolean>(false)

  // Estados para categorías manuales
  const [selectedInstructorId, setSelectedInstructorId] = useState<number | null>(null)
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<number | null>(null)
  const [manualCategoria, setManualCategoria] = useState<CategoriaInstructor>("INSTRUCTOR")
  const [manualCategorias, setManualCategorias] = useState<
    {
      instructorId: number
      disciplinaId: number
      categoria: CategoriaInstructor
    }[]
  >([])

  // Estados para el cálculo de bonos
  const [periodosSeleccionadosParaBono, setPeriodosSeleccionadosParaBono] = useState<number[]>([])
  const [isCalculatingBonuses, setIsCalculatingBonuses] = useState<boolean>(false)

  useEffect(() => {
    if (periodoActual && selectedPeriodoId === null) {
      setSelectedPeriodoId(periodoActual.id)
    }
  }, [periodoActual, selectedPeriodoId])

  const addProcessLog = (message: string, instructorId?: number) => {
    const timestamp = new Date().toLocaleTimeString()
    const formattedMessage = `[${timestamp}] ${message}`

    setProcessLogs((prev) => {
      if (!instructorId) {
        return [...prev, formattedMessage]
      }

      const instructor = instructores.find((i) => i.id === instructorId)
      const instructorName = instructor ? instructor.nombre : `Instructor ${instructorId}`

      const lastLog = prev[prev.length - 1] || ""
      const isNewInstructorSection = !lastLog.includes(`[INSTRUCTOR: ${instructorName}]`)

      if (isNewInstructorSection && prev.length > 0) {
        return [...prev, `\n[INSTRUCTOR: ${instructorName}] ${formattedMessage}`]
      }

      return [...prev, `[INSTRUCTOR: ${instructorName}] ${formattedMessage}`]
    })
  }

  // Función para verificar si existen fórmulas para un periodo
  const verificarFormulasExistentes = (periodoId: number): boolean => {
    return formulas.some((f) => f.periodoId === periodoId)

    
  }


const calcularPenalizacion = (clasesInstructor: Clase[], penalizaciones: Penalizacion[]) => {
  console.log("CALCULO PENALIZACIOM ...")
  const totalClases = clasesInstructor.length;
  const maxPuntosPermitidos = Math.floor(totalClases * 0.1); // 10% del total de clases
  
  // Detalle completo de cada penalización
  const detallePenalizaciones = penalizaciones.map(p => ({
    tipo: p.tipo,
    puntos: p.puntos,
    descripcion: p.descripcion || 'Sin descripción',
    fecha: p.aplicadaEn,
    disciplina: disciplinas.find(d => d.id === p.disciplinaId)?.nombre || 'General'
  }));

  const totalPuntos = penalizaciones.reduce((sum, p) => sum + p.puntos, 0);
  const puntosExcedentes = Math.max(0, totalPuntos - maxPuntosPermitidos);
  const porcentajeDescuento = puntosExcedentes; // 1 punto = 1% de descuento
  console.log(porcentajeDescuento)

  return {
    puntos: totalPuntos,
    maxPermitidos: maxPuntosPermitidos,
    excedentes: puntosExcedentes,
    descuento: porcentajeDescuento,
    detalle: detallePenalizaciones
  };
};



  // Función para encontrar el periodo más cercano con fórmulas
  const encontrarPeriodoConFormulas = (periodoId: number): Periodo | null => {
    const periodosConFormulas = periodos.filter((p) => formulas.some((f) => f.periodoId === p.id))

    if (periodosConFormulas.length === 0) {
      return null
    }

    periodosConFormulas.sort((a, b) => {
      const distanciaA = Math.abs(a.id - periodoId)
      const distanciaB = Math.abs(b.id - periodoId)
      return distanciaA - distanciaB
    })

    return periodosConFormulas[0]
  }

  // Función para duplicar fórmulas de un periodo a otro
  const duplicarFormulas = async (periodoOrigenId: number, periodoDestinoId: number): Promise<void> => {
    setIsDuplicatingFormulas(true)

    try {
      const formulasOrigen = formulas.filter((f) => f.periodoId === periodoOrigenId)

      if (formulasOrigen.length === 0) {
        throw new Error("No se encontraron fórmulas en el periodo origen")
      }

      for (const formula of formulasOrigen) {
        const nuevaFormula = {
          ...formula,
          id: undefined,
          periodoId: periodoDestinoId,
        }

        await crearFormula(nuevaFormula)
      }

      await fetchFormulas()

      toast({
        title: "Fórmulas duplicadas",
        description: `Se han duplicado ${formulasOrigen.length} fórmulas al periodo seleccionado.`,
      })

      setShowFormulaDuplicationDialog(false)
      calcularPagosPeriodo()
    } catch (error) {
      toast({
        title: "Error al duplicar fórmulas",
        description: error instanceof Error ? error.message : "Error desconocido al duplicar fórmulas",
        variant: "destructive",
      })
    } finally {
      setIsDuplicatingFormulas(false)
    }
  }

  // Función para agregar una categoría manual
  const agregarCategoriaManual = () => {
    if (!selectedInstructorId || !selectedDisciplinaId || !selectedPeriodoId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un instructor, una disciplina y un periodo",
        variant: "destructive",
      })
      return
    }

    const existeAsignacion = manualCategorias.some(
      (c) => c.instructorId === selectedInstructorId && c.disciplinaId === selectedDisciplinaId,
    )

    if (existeAsignacion) {
      setManualCategorias((prev) =>
        prev.map((c) =>
          c.instructorId === selectedInstructorId && c.disciplinaId === selectedDisciplinaId
            ? { ...c, categoria: manualCategoria }
            : c,
        ),
      )
    } else {
      setManualCategorias((prev) => [
        ...prev,
        {
          instructorId: selectedInstructorId,
          disciplinaId: selectedDisciplinaId,
          categoria: manualCategoria,
        },
      ])
    }

    toast({
      title: "Categoría asignada",
      description: `Se ha asignado la categoría ${manualCategoria} al instructor seleccionado para la disciplina seleccionada.`,
    })
  }

  // Función para eliminar una categoría manual
  const eliminarCategoriaManual = (instructorId: number, disciplinaId: number) => {
    setManualCategorias((prev) =>
      prev.filter((c) => !(c.instructorId === instructorId && c.disciplinaId === disciplinaId)),
    )

    toast({
      title: "Categoría eliminada",
      description: "Se ha eliminado la asignación manual de categoría.",
    })
  }

  // FUNCIÓN CORREGIDA: determinarCategoria
  const determinarCategoria = (
    instructorId: number,
    disciplinaId: number,
    periodoId: number,
    formula: FormulaDB,
    metricas: {
      ocupacion: number
      clasesPorSemana: number
      localesEnLima: number
      dobleteos: number
      horariosNoPrime: number
      participacionEventos: boolean
      cumpleLineamientos: boolean
    },
  ): CategoriaInstructor => {
    console.log(
      `\n[CATEGORIA] Evaluando categoría para instructor ID ${instructorId}, disciplina ID ${disciplinaId}, periodo ID ${periodoId}`,
    )

    // Verificar si hay una categoría manual asignada
    const categoriaManual = manualCategorias.find(
      (c) => c.instructorId === instructorId && c.disciplinaId === disciplinaId,
    )

    if (categoriaManual) {
      console.log(`[CATEGORIA] ✅ Usando categoría manual asignada: ${categoriaManual.categoria}`)
      return categoriaManual.categoria
    }

    const instructor = instructores.find((i) => i.id === instructorId)
    if (!instructor) {
      console.log(`[CATEGORIA] ❌ ERROR: Instructor ID ${instructorId} no encontrado`)
      return "INSTRUCTOR"
    }

    console.log(`[CATEGORIA] Evaluando instructor: ${instructor.nombre}`)
    console.log(`[CATEGORIA] Métricas:`, metricas)

    const requisitos = formula.requisitosCategoria
    console.log(`[CATEGORIA] Evaluando requisitos según fórmula ID ${formula.id}`)

    // Evaluar EMBAJADOR_SENIOR
    if (
      requisitos.EMBAJADOR_SENIOR &&
      metricas.ocupacion >= requisitos.EMBAJADOR_SENIOR.ocupacion &&
      metricas.clasesPorSemana >= requisitos.EMBAJADOR_SENIOR.clases &&
      metricas.localesEnLima >= requisitos.EMBAJADOR_SENIOR.localesEnLima &&
      metricas.dobleteos >= requisitos.EMBAJADOR_SENIOR.dobleteos &&
      metricas.horariosNoPrime >= requisitos.EMBAJADOR_SENIOR.horariosNoPrime &&
      (metricas.participacionEventos || !requisitos.EMBAJADOR_SENIOR.participacionEventos) &&
      (metricas.cumpleLineamientos || !requisitos.EMBAJADOR_SENIOR.lineamientos)
    ) {
      console.log(`[CATEGORIA] ✅ Cumple requisitos para EMBAJADOR_SENIOR`)
      return "EMBAJADOR_SENIOR"
    }

    // Evaluar EMBAJADOR
    if (
      requisitos.EMBAJADOR &&
      metricas.ocupacion >= requisitos.EMBAJADOR.ocupacion &&
      metricas.clasesPorSemana >= requisitos.EMBAJADOR.clases &&
      metricas.localesEnLima >= requisitos.EMBAJADOR.localesEnLima &&
      metricas.dobleteos >= requisitos.EMBAJADOR.dobleteos &&
      metricas.horariosNoPrime >= requisitos.EMBAJADOR.horariosNoPrime &&
      (metricas.participacionEventos || !requisitos.EMBAJADOR.participacionEventos) &&
      (metricas.cumpleLineamientos || !requisitos.EMBAJADOR.lineamientos)
    ) {
      console.log(`[CATEGORIA] ✅ Cumple requisitos para EMBAJADOR`)
      return "EMBAJADOR"
    }

    // Evaluar EMBAJADOR_JUNIOR
    if (
      requisitos.EMBAJADOR_JUNIOR &&
      metricas.ocupacion >= requisitos.EMBAJADOR_JUNIOR.ocupacion &&
      metricas.clasesPorSemana >= requisitos.EMBAJADOR_JUNIOR.clases &&
      metricas.localesEnLima >= requisitos.EMBAJADOR_JUNIOR.localesEnLima &&
      metricas.dobleteos >= requisitos.EMBAJADOR_JUNIOR.dobleteos &&
      metricas.horariosNoPrime >= requisitos.EMBAJADOR_JUNIOR.horariosNoPrime &&
      (metricas.participacionEventos || !requisitos.EMBAJADOR_JUNIOR.participacionEventos) &&
      (metricas.cumpleLineamientos || !requisitos.EMBAJADOR_JUNIOR.lineamientos)
    ) {
      console.log(`[CATEGORIA] ✅ Cumple requisitos para EMBAJADOR_JUNIOR`)
      return "EMBAJADOR_JUNIOR"
    }

    console.log(`[CATEGORIA] ⚠️ No cumple requisitos para ninguna categoría especial, asignando INSTRUCTOR`)
    return "INSTRUCTOR"
  }

  // FUNCIÓN CORREGIDA: crearCategoriaInstructor
  const crearCategoriaInstructor = async (
    instructorId: number,
    disciplinaId: number,
    periodoId: number,
    categoria: CategoriaInstructor,
    metricas: {
      ocupacion: number
      clases: number
      localesEnLima: number
      dobleteos: number
      horariosNoPrime: number
      participacionEventos: boolean
    },
    esManual = false,
  ): Promise<boolean> => {
    try {
      console.log(
        `[CREAR_CATEGORIA] Creando categoría para instructor ${instructorId}, disciplina ${disciplinaId}, periodo ${periodoId}`,
      )

      // Obtener el instructor actualizado
      const instructorActualizado = await instructoresApi.getInstructor(instructorId)

      // Preparar la nueva categoría
      const nuevaCategoria: CategoriaInstructorModel = {
        id: Date.now(),
        instructorId,
        disciplinaId,
        periodoId,
        categoria,
        metricas: {
          ocupacion: metricas.ocupacion,
          clases: metricas.clases,
          localesEnLima: metricas.localesEnLima,
          dobleteos: metricas.dobleteos,
          horariosNoPrime: metricas.horariosNoPrime,
          participacionEventos: metricas.participacionEventos,
          esManual: esManual,
        },
      }

      // Obtener categorías existentes
      const categorias = instructorActualizado.categorias || []

      // Verificar si ya existe una categoría para esta disciplina y periodo
      const categoriaIndex = categorias.findIndex((c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId)

      const updatedCategorias = [...categorias]

      if (categoriaIndex >= 0) {
        updatedCategorias[categoriaIndex] = { ...updatedCategorias[categoriaIndex], ...nuevaCategoria }
        console.log(`[CREAR_CATEGORIA] Reemplazando categoría existente`)
      } else {
        updatedCategorias.push(nuevaCategoria)
        console.log(`[CREAR_CATEGORIA] Agregando nueva categoría`)
      }

      // Actualizar instructor con las nuevas categorías
      await actualizarInstructor(instructorId, {
        categorias: updatedCategorias,
      })

      console.log(`[CREAR_CATEGORIA] ✅ Categoría creada/actualizada exitosamente`)
      return true
    } catch (error) {
      console.error(`[CREAR_CATEGORIA] ❌ Error al crear categoría:`, error)
      return false
    }
  }

  // Función para aplicar las categorías manuales
  const aplicarCategoriasManual = async () => {
    if (manualCategorias.length === 0) {
      toast({
        title: "Error",
        description: "No hay categorías manuales para aplicar",
        variant: "destructive",
      })
      return
    }

    if (!selectedPeriodoId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un periodo",
        variant: "destructive",
      })
      return
    }

    setProcessLogs([])
    setShowProcessLogsDialog(true)
    addProcessLog("🚀 Iniciando proceso de aplicación de categorías manuales...")
    setIsCalculatingPayments(true)

    try {
      let categoriasActualizadas = 0

      for (const asignacion of manualCategorias) {
        const { instructorId, disciplinaId, categoria } = asignacion

        const instructor = instructores.find((i) => i.id === instructorId)
        if (!instructor) {
          addProcessLog(`⚠️ Instructor ID ${instructorId} no encontrado, omitiendo`)
          continue
        }

        const disciplina = disciplinas.find((d) => d.id === disciplinaId)
        if (!disciplina) {
          addProcessLog(`⚠️ Disciplina ID ${disciplinaId} no encontrada, omitiendo`)
          continue
        }

        addProcessLog(
          `Aplicando categoría manual ${categoria} para ${instructor.nombre} en ${disciplina.nombre}`,
          instructorId,
        )

        const categoriaCreada = await crearCategoriaInstructor(
          instructorId,
          disciplinaId,
          selectedPeriodoId,
          categoria,
          {
            ocupacion: 0,
            clases: 0,
            localesEnLima: 0,
            dobleteos: 0,
            horariosNoPrime: 0,
            participacionEventos: true, // CAMBIO: true por defecto
          },
          true, // esManual = true
        )

        if (categoriaCreada) {
          categoriasActualizadas++
          addProcessLog(`✅ Categoría manual aplicada: ${categoria}`, instructorId)
        }
      }

      await fetchInstructores()

      addProcessLog("\n🏁 Proceso completado. Resumen:")
      addProcessLog(`✅ Categorías manuales aplicadas: ${categoriasActualizadas}`)

      toast({
        title: "Categorías manuales aplicadas",
        description: `Se han aplicado ${categoriasActualizadas} categorías manuales.`,
      })
    } catch (error) {
      addProcessLog(`❌ Error en el proceso: ${error instanceof Error ? error.message : "Error desconocido"}`)
      toast({
        title: "Error al aplicar categorías manuales",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      addProcessLog("🏁 Finalizando proceso")
      setIsCalculatingPayments(false)
    }
  }

  // FUNCIÓN PRINCIPAL CORREGIDA: calcularPagosPeriodo
  const calcularPagosPeriodo = async () => {
  const periodoId = selectedPeriodoId || periodoActual?.id;

  if (!periodoId) {
    toast({
      title: "Error",
      description: "Debes seleccionar un periodo para calcular los pagos",
      variant: "destructive",
    });
    return;
  }

  setProcessLogs([]);
  setShowProcessLogsDialog(true);
  addProcessLog("🚀 Iniciando proceso de cálculo de pagos...");
  setIsCalculatingPayments(true);
  setShowCalculateDialog(false);

 

    let pagosActualizados = 0
    let pagosCreados = 0
    let categoriasCreadas = 0

    try {
      // Obtener instructores con clases en este periodo
      const instructoresConClases = [
        ...new Set(clases.filter((c) => c.periodoId === periodoId).map((c) => c.instructorId)),
      ]
      const todosInstructores = instructores.filter((i) => instructoresConClases.includes(i.id))

      console.log(
        "[Cálculo de Pagos] Instructores a procesar:",
        todosInstructores.map((i) => ({ id: i.id, nombre: i.nombre }))
      );

      addProcessLog(`👥 Total instructores con clases: ${todosInstructores.length}`)

      // PASO 1: CREAR/ACTUALIZAR CATEGORÍAS PARA TODOS LOS INSTRUCTORES
      addProcessLog("📊 PASO 1: Creando/actualizando categorías de instructores...")

      for (const instructor of todosInstructores) {
        addProcessLog(`Procesando categorías para ${instructor.nombre}`, instructor.id)

        const clasesInstructor = clases.filter(
          (clase) => clase.instructorId === instructor.id && clase.periodoId === periodoId,
        )

        if (clasesInstructor.length === 0) {
          addProcessLog(`Sin clases, omitiendo`, instructor.id)
          continue
        }

        // Obtener el pago existente para obtener métricas manuales
        const pagoExistente = pagos.find((p) => p.instructorId === instructor.id && p.periodoId === periodoId)

        // Si el pago está aprobado, no recalcular
        if (pagoExistente && pagoExistente.estado === "APROBADO") {
          addProcessLog(`⚠️ Pago ya aprobado, manteniendo valores existentes`, instructor.id)
          continue
        }

        // Calcular métricas base
        const disciplinasUnicas = [...new Set(clasesInstructor.map((c) => c.disciplinaId))]

        // Calcular dobleteos y horarios no prime
        const disciplinaSiclo = disciplinas.find((d) => d.nombre === "Síclo")
        const sicloId = disciplinaSiclo ? disciplinaSiclo.id : null
        const dobleteos = calcularDobleteos(clasesInstructor, sicloId)

        const horariosNoPrime = clasesInstructor.filter((clase) => {
          if (sicloId && clase.disciplinaId !== sicloId) return false

          try {
            const hora = obtenerHora(clase.fecha)
            const estudio = clase.estudio || ""

            for (const [estudioConfig, horarios] of Object.entries(HORARIOS_NO_PRIME)) {
              if (estudio.toLowerCase().includes(estudioConfig.toLowerCase()) && horarios[hora]) {
                return true
              }
            }
            return false
          } catch (error) {
            return false
          }
        }).length

        // Procesar cada disciplina
        for (const disciplinaId of disciplinasUnicas) {
          const disciplina = disciplinas.find((d) => d.id === disciplinaId)
          if (!disciplina || !mostrarCategoriaVisual(disciplina.nombre)) {
            continue
          }

          // Verificar si hay categoría manual
          const categoriaManual = manualCategorias.find(
            (c) => c.instructorId === instructor.id && c.disciplinaId === disciplinaId,
          )

          if (categoriaManual) {
            addProcessLog(`Usando categoría manual: ${categoriaManual.categoria}`, instructor.id)
            continue
          }

          // Obtener fórmula para esta disciplina
          const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodoId)
          if (!formula) {
            addProcessLog(`No se encontró fórmula para ${disciplina.nombre}`, instructor.id)
            continue
          }

          // Calcular métricas específicas para esta disciplina
          const clasesDisciplina = clasesInstructor.filter((c) => c.disciplinaId === disciplinaId)
          const totalClases = clasesDisciplina.length
          const clasesPorSemana = totalClases / 4

          let totalReservas = 0
          let totalLugares = 0
          clasesDisciplina.forEach((clase) => {
            totalReservas += clase.reservasTotales
            totalLugares += clase.lugares
          })
          const ocupacion = totalLugares > 0 ? (totalReservas / totalLugares) * 100 : 0

          const localesEnLima = new Set(
            clasesDisciplina.filter((c) => c.ciudad.toLowerCase().includes("lima")).map((c) => c.estudio),
          ).size

          // Preparar métricas completas
          const metricasCompletas = {
            ocupacion,
            clasesPorSemana,
            localesEnLima,
            dobleteos,
            horariosNoPrime: horariosNoPrime / 4,
            participacionEventos: pagoExistente?.participacionEventos ?? true, // CAMBIO: true por defecto
            cumpleLineamientos: pagoExistente?.cumpleLineamientos ?? true, // CAMBIO: true por defecto
          }

          // Determinar categoría
          const categoriaCalculada = determinarCategoria(
            instructor.id,
            disciplinaId,
            periodoId,
            formula,
            metricasCompletas,
          )

          // Crear/actualizar categoría
          const categoriaCreada = await crearCategoriaInstructor(
            instructor.id,
            disciplinaId,
            periodoId,
            categoriaCalculada,
            {
              ocupacion,
              clases: totalClases,
              localesEnLima,
              dobleteos,
              horariosNoPrime: horariosNoPrime / 4,
              participacionEventos: metricasCompletas.participacionEventos,
            },
            false, // esManual = false
          )

          if (categoriaCreada) {
            categoriasCreadas++
            addProcessLog(`✅ Categoría ${categoriaCalculada} creada para ${disciplina.nombre}`, instructor.id)
          } else {
            addProcessLog(`❌ Error al crear categoría para ${disciplina.nombre}`, instructor.id)
          }
        }
      }

      // Recargar instructores para tener las categorías actualizadas
      await fetchInstructores()
      addProcessLog(`✅ Categorías procesadas: ${categoriasCreadas}`)

      // PASO 2: CALCULAR PAGOS CON LAS CATEGORÍAS ACTUALIZADAS
      addProcessLog("💰 PASO 2: Calculando pagos con categorías actualizadas...")

      const pagosParaActualizar: any[] = []

      for (const instructor of todosInstructores) {
        const clasesInstructor = clases.filter(
          (clase) => clase.instructorId === instructor.id && clase.periodoId === periodoId,
        )

        if (clasesInstructor.length === 0) continue

        const pagoExistente = pagos.find((p) => p.instructorId === instructor.id && p.periodoId === periodoId)

        if (pagoExistente && pagoExistente.estado === "APROBADO") {
          pagosActualizados++
          continue
        }

        // Obtener instructor actualizado con categorías
        const instructorActualizado = await instructoresApi.getInstructor(instructor.id)

        // Calcular pago total
        let montoTotal = 0
        const detallesClases = []
        const disciplinasUnicas = [...new Set(clasesInstructor.map((c) => c.disciplinaId))]

        // Calcular métricas generales
        const disciplinaSiclo = disciplinas.find((d) => d.nombre === "Síclo")
        const sicloId = disciplinaSiclo ? disciplinaSiclo.id : null
        const dobleteos = calcularDobleteos(clasesInstructor, sicloId)

        const horariosNoPrime = clasesInstructor.filter((clase) => {
          if (sicloId && clase.disciplinaId !== sicloId) return false

          try {
            const hora = obtenerHora(clase.fecha)
            const estudio = clase.estudio || ""

            for (const [estudioConfig, horarios] of Object.entries(HORARIOS_NO_PRIME)) {
              if (estudio.toLowerCase().includes(estudioConfig.toLowerCase()) && horarios[hora]) {
                return true
              }
            }
            return false
          } catch (error) {
            return false
          }
        }).length



        // Calcular pago por disciplina
        for (const disciplinaId of disciplinasUnicas) {
          const clasesDisciplina = clasesInstructor.filter((c) => c.disciplinaId === disciplinaId)
          const disciplina = disciplinas.find((d) => d.id === disciplinaId)

          if (!disciplina) continue

          const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodoId)
          if (!formula) continue

          // Obtener categoría del instructor
          let categoriaInstructor: CategoriaInstructor

          const categoriaManual = manualCategorias.find(
            (c) => c.instructorId === instructor.id && c.disciplinaId === disciplinaId,
          )

          if (categoriaManual) {
            categoriaInstructor = categoriaManual.categoria
          } else {
            const categoriaInfo = instructorActualizado.categorias?.find(
              (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId,
            )
            categoriaInstructor = categoriaInfo?.categoria || "INSTRUCTOR"
          }

          // Calcular pago por cada clase
          for (const clase of clasesDisciplina) {
            try {
              // Verificar si esta clase debe considerarse Full House
              const esFullHouse = instructor.covers?.some(
                c => c.claseId === clase.id && c.periodoId === periodoId && c.pagoFullHouse === true
              );

              let claseParaCalculo = { ...clase };

              // Ajustar para Full House si corresponde
              if (esFullHouse) {
                claseParaCalculo = {
                  ...claseParaCalculo,
                  reservasTotales: claseParaCalculo.lugares, // Forzar 100% ocupación
                };
                addProcessLog(
                  `🏠 FULL HOUSE: Clase ${clase.id} se considera al 100% de ocupación`,
                  instructor.id
                );
              }

              // Ajustar para clases versus
              if (clase.esVersus && clase.vsNum && clase.vsNum > 1) {
                const reservasAjustadas = claseParaCalculo.reservasTotales * clase.vsNum;
                const lugaresAjustados = claseParaCalculo.lugares * clase.vsNum;

                claseParaCalculo = {
                  ...claseParaCalculo,
                  reservasTotales: reservasAjustadas,
                  lugares: lugaresAjustados,
                };

                addProcessLog(
                  `⚖️ CLASE VS: Ajustando para cálculo: Reservas ${clase.reservasTotales} x ${clase.vsNum} = ${reservasAjustadas}, Lugares ${clase.lugares} x ${clase.vsNum} = ${lugaresAjustados}`,
                  instructor.id,
                );
              }

              const resultado = calcularPago(claseParaCalculo, categoriaInstructor, formula);
              let detalleCalculo = resultado.detalleCalculo;
                if (esFullHouse) {
                  detalleCalculo = `FULL HOUSE (ocupación forzada al 100%) - ${detalleCalculo}`;
                }

              let montoPagoFinal = resultado.montoPago;
              if (clase.esVersus && clase.vsNum && clase.vsNum > 1) {
                montoPagoFinal = resultado.montoPago / clase.vsNum;
                addProcessLog(
                  `⚖️ CLASE VS: Dividiendo pago entre ${clase.vsNum} instructores: ${resultado.montoPago.toFixed(2)} / ${clase.vsNum} = ${montoPagoFinal.toFixed(2)}`,
                  instructor.id,
                );
              }

              montoTotal += montoPagoFinal;

              addProcessLog(
                `💰 PAGO POR CLASE [${clase.id}]: ${disciplina.nombre} - ${new Date(clase.fecha).toLocaleDateString()} ${obtenerHora(clase.fecha)}` +
                  `\n   Monto: ${Number(montoPagoFinal).toFixed(2)} | Categoría: ${categoriaInstructor}` +
                  `\n   Reservas: ${claseParaCalculo.reservasTotales}/${claseParaCalculo.lugares} (${Math.round((claseParaCalculo.reservasTotales / claseParaCalculo.lugares) * 100)}% ocupación)` +
                  (clase.esVersus ? `\n   Versus: Sí (${clase.vsNum} instructores)` : "") +
                  (esFullHouse ? `\n   FULL HOUSE: Sí` : "") +
                  `\n   Detalle: ${resultado.detalleCalculo}`,
                instructor.id,
              );

              // Check if this is a non-prime hour class
              const hora = obtenerHora(clase.fecha);
              const estudio = clase.estudio || "";
              let esNoPrime = false;

              for (const [estudioConfig, horarios] of Object.entries(HORARIOS_NO_PRIME)) {
                if (estudio.toLowerCase().includes(estudioConfig.toLowerCase()) && horarios[hora]) {
                  esNoPrime = true;
                  break;
                }
              }

              if (esNoPrime) {
                addProcessLog(
                  `⏱️ HORARIO NO PRIME: ${disciplina.nombre} - ${new Date(clase.fecha).toLocaleDateString()} ${hora}` +
                    `\n   Estudio: ${estudio} | Hora: ${hora}`,
                  instructor.id,
                );
              }

              detallesClases.push({
                claseId: clase.id,
                montoCalculado: montoPagoFinal,
                disciplinaId: clase.disciplinaId,
                disciplinaNombre: disciplina.nombre,
                fechaClase: clase.fecha,
                detalleCalculo: resultado.detalleCalculo + (esFullHouse ? " (FULL HOUSE)" : ""),
                categoria: categoriaInstructor,
                esVersus: clase.esVersus,
                vsNum: clase.vsNum,
                esFullHouse: esFullHouse || false,
              });
            } catch (error) {
              addProcessLog(`Error al calcular pago para clase ${clase.id}`, instructor.id);
            }
          }
        }

        // Add a summary of metrics for the instructor
        const totalClases = clasesInstructor.length
        const clasesPorSemana = totalClases / 4
        const totalReservas = clasesInstructor.reduce((sum, c) => sum + c.reservasTotales, 0)
        const totalCapacidad = clasesInstructor.reduce((sum, c) => sum + c.lugares, 0)
        const ocupacionPromedio = totalCapacidad > 0 ? (totalReservas / totalCapacidad) * 100 : 0
        const disciplinasUnicasCount = new Set(clasesInstructor.map((c) => c.disciplinaId)).size
        const estudiosUnicos = new Set(clasesInstructor.map((c) => c.estudio)).size
        const clasesNoPrime = clasesInstructor.filter((clase) => {
          const hora = obtenerHora(clase.fecha)
          const estudio = clase.estudio || ""
          for (const [estudioConfig, horarios] of Object.entries(HORARIOS_NO_PRIME)) {
            if (estudio.toLowerCase().includes(estudioConfig.toLowerCase()) && horarios[hora]) {
              return true
            }
          }
          return false
        }).length

        // Calcular bonos si está habilitado
        const bonoTotal = 0
        if (calcularBonoEnPeriodo) {
          addProcessLog(`ℹ️ El cálculo de bonos se gestionará con otra función`, instructor.id)
        }


                // Calculate covers for the instructor
 
          // Obtener penalizaciones del instructor en este periodo
          const penalizacionesInstructor = instructor.penalizaciones?.filter(p => p.periodoId === periodoId && p.activa) || [];

          // Calcular penalización
          const { 
            puntos: totalPuntos, 
            maxPermitidos, 
            excedentes, 
            descuento, 
            detalle: detallePenalizaciones 
           } = calcularPenalizacion(clasesInstructor, penalizacionesInstructor);
          




        // Calcular covers para el instructor - versión mejorada
          const coversInstructor = instructor.covers?.filter(c => {
            // Asegurarse que el cover pertenece al periodo correcto
            return c.periodoId === periodoId && 
                  // Verificar que no esté marcado como justificado (si aplica)
                  (c.pagoBono == true); 
          }) || [];

          const detallesCovers = coversInstructor.map(cover => {
            const claseCover = clases.find(c => c.id === cover.claseId);
            const disciplina = claseCover ? disciplinas.find(d => d.id === claseCover.disciplinaId) : null;
            
            return {
              claseId: cover.claseId,
              fechaClase: claseCover?.fecha || null,
              disciplinaId: claseCover?.disciplinaId || null,
              disciplinaNombre: disciplina?.nombre || 'Desconocida',
              montoCalculado: 80, // Monto fijo por cover
              detalleCalculo: `Cover realizado para clase de ${disciplina?.nombre || 'desconocida'} el ${claseCover?.fecha ? new Date(claseCover.fecha).toLocaleDateString() : 'fecha desconocida'}`,
              esCover: true
            };
          });

          const coverTotal = coversInstructor.length * 80;
          console.log("✅ Covers calculados:", {
            totalCovers: coversInstructor.length,
            coverTotal,
            covers: coversInstructor.map(c => ({
              id: c.id,
              claseId: c.claseId,
              justificacion: c.justificacion
            }))
          });

          // Calcular subtotal
          const subtotal = montoTotal + 
                          (pagoExistente?.reajuste || 0) + 
                          (pagoExistente?.bono || 0) + 
                          coverTotal;

          console.log("🧮 Subtotal:", {
            montoBase: montoTotal,
            reajuste: pagoExistente?.reajuste || 0,
            bono: pagoExistente?.bono || 0,
            cover: coverTotal,
            subtotal
          });

          // Resto del cálculo...
          const penalizacionMonto = subtotal * (descuento / 100);
          const subtotalConPenalizacion = subtotal - penalizacionMonto;
          const retencionCalculada = subtotalConPenalizacion * retencionValor;
          const pagoFinal = subtotalConPenalizacion - retencionCalculada;

          console.log("💰 Pago final calculado:", {
            subtotal,
            penalizacion: penalizacionMonto,
            subtotalConPenalizacion,
            retencion: retencionCalculada,
            pagoFinal
          });

        addProcessLog(
          `RESUMEN DE MÉTRICAS:` +
            `\n   Total Clases: ${totalClases} (${clasesPorSemana.toFixed(1)} por semana) | Disciplinas: ${disciplinasUnicasCount} | Estudios: ${estudiosUnicos}` +
            `\n   Ocupación Promedio: ${ocupacionPromedio.toFixed(1)}% (${totalReservas}/${totalCapacidad})` +
            `\n   Clases en Horario No Prime: ${clasesNoPrime} (${((clasesNoPrime / totalClases) * 100).toFixed(1)}%)` +
            `\n   Monto Total: ${montoTotal.toFixed(2)} | Bono: ${bonoTotal.toFixed(2)} | Final: ${pagoFinal.toFixed(2)}`,
          instructor.id,
        )

        // Preparar datos del pago
        try {
          if (pagoExistente) {
            if (pagoExistente.estado === "APROBADO") {
              addProcessLog(`✅ Pago aprobado, no se modificará`, instructor.id)
              continue
            }

            const actualizacion = {
              id: pagoExistente.id,
              instructorId: instructor.id,
              periodoId: periodoId,
              monto: montoTotal,
              bono: bonoTotal,
              estado: pagoExistente.estado,
              penalizacion: penalizacionMonto,
              retencion: retencionCalculada,
              reajuste: pagoExistente.reajuste,
              tipoReajuste: pagoExistente.tipoReajuste,
              pagoFinal: pagoFinal,
              dobleteos: dobleteos,
              cover: coverTotal,
              horariosNoPrime: horariosNoPrime / 4,
              participacionEventos: pagoExistente.participacionEventos ?? true, // CAMBIO: true por defecto si es null/undefined
              cumpleLineamientos: pagoExistente.cumpleLineamientos ?? true, // CAMBIO: true por defecto si es null/undefined
              detalles: {
                clases: detallesClases,
                penalizaciones: {
                  totalPuntos,
                  maxPuntosPermitidos: maxPermitidos,
                  puntosExcedentes: excedentes,
                  porcentajeDescuento: descuento,
                  montoDescuento: penalizacionMonto,
                  detalle: detallePenalizaciones
                },
                detallesCovers,
              resumen: {
                  totalClases: detallesClases.length,
                  totalMonto: montoTotal,
                  bono: bonoTotal,
                  disciplinas: disciplinasUnicas.length,
                  categorias: disciplinasUnicas.map((disciplinaId) => {
                    const categoriaManualAsignada = manualCategorias.find(
                      (c) => c.instructorId === instructor.id && c.disciplinaId === disciplinaId,
                    )

                    if (categoriaManualAsignada) {
                      const disc = disciplinas.find((d) => d.id === disciplinaId)
                      return {
                        disciplinaId,
                        disciplinaNombre: disc?.nombre || `Disciplina ${disciplinaId}`,
                        categoria: categoriaManualAsignada.categoria,
                        esManual: true,
                      }
                    }

                    const categoriaInfo = instructorActualizado.categorias?.find(
                      (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId,
                    )
                    const categoria = categoriaInfo?.categoria || "INSTRUCTOR"
                    const disc = disciplinas.find((d) => d.id === disciplinaId)
                    return {
                      disciplinaId,
                      disciplinaNombre: disc?.nombre || `Disciplina ${disciplinaId}`,
                      categoria: categoria,
                      esManual: categoriaInfo?.metricas?.["esManual"] || false,
                    }
                  }),
                  comentarios: `Calculado el ${new Date().toLocaleDateString()}`,
                },
              },
            }

            pagosParaActualizar.push({ id: pagoExistente.id, data: actualizacion })
            pagosActualizados++
            addProcessLog(`✅ Pago preparado para actualización`, instructor.id)
          } else {
            const pagoData = {
              instructorId: instructor.id,
              periodoId: periodoId,
              monto: montoTotal,
              bono: bonoTotal,
              estado: "PENDIENTE" as EstadoPago,
              retencion: retencionCalculada,
              reajuste: 0,
              tipoReajuste: "FIJO" as const,
              pagoFinal: pagoFinal,
              dobleteos: dobleteos,
              cover: coverTotal,
              penalizacion: penalizacionMonto,
              horariosNoPrime: horariosNoPrime / 4,
              participacionEventos: true, // CAMBIO: true por defecto
              cumpleLineamientos: true, // CAMBIO: true por defecto
              detalles: {
                penalizaciones: {
                  totalPuntos,
                  maxPuntosPermitidos: maxPermitidos,
                  puntosExcedentes: excedentes,
                  porcentajeDescuento: descuento,
                  montoDescuento: penalizacionMonto,
                  detalle: detallePenalizaciones
                },
                detallesCovers,
                clases: detallesClases,
                resumen: {
                  totalClases: detallesClases.length,
                  totalMonto: montoTotal,
                  bono: bonoTotal,
                  disciplinas: disciplinasUnicas.length,
                  categorias: disciplinasUnicas.map((disciplinaId) => {
                    const categoriaManualAsignada = manualCategorias.find(
                      (c) => c.instructorId === instructor.id && c.disciplinaId === disciplinaId,
                    )

                    if (categoriaManualAsignada) {
                      const disc = disciplinas.find((d) => d.id === disciplinaId)
                      return {
                        disciplinaId,
                        disciplinaNombre: disc?.nombre || `Disciplina ${disciplinaId}`,
                        categoria: categoriaManualAsignada.categoria,
                        esManual: true,
                      }
                    }

                    const categoriaInfo = instructorActualizado.categorias?.find(
                      (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId,
                    )
                    const categoria = categoriaInfo?.categoria || "INSTRUCTOR"
                    const disc = disciplinas.find((d) => d.id === disciplinaId)
                    return {
                      disciplinaId,
                      disciplinaNombre: disc?.nombre || `Disciplina ${disciplinaId}`,
                      categoria: categoria,
                      esManual: categoriaInfo?.metricas?.["esManual"] || false,
                    }
                  }),
                  comentarios: `Calculado el ${new Date().toLocaleDateString()}`,
                },
              },
            }

            pagosParaActualizar.push({ id: null, data: pagoData })
            pagosCreados++
            addProcessLog(`✅ Pago preparado para creación`, instructor.id)
          }
        } catch (error) {
          addProcessLog(
            `❌ Error al procesar pago: ${error instanceof Error ? error.message : "Error desconocido"}`,
            instructor.id,
          )
        }
      }

      // Actualizar base de datos
      addProcessLog(`\n🔄 Actualizando base de datos con ${pagosParaActualizar.length} pagos...`)

      for (const pago of pagosParaActualizar) {
        try {
          if (pago.id) {
            const { id, ...datosActualizacion } = pago.data
            await actualizarPago(pago.id, datosActualizacion)
          } else {
            await crearPago(pago.data as any)
          }
        } catch (error) {
          addProcessLog(`❌ Error al guardar pago: ${error instanceof Error ? error.message : "Error desconocido"}`)
        }
      }

      await fetchPagos()
      addProcessLog(`✅ Base de datos actualizada correctamente`)

      // Update period if bonuses were calculated
      if (calcularBonoEnPeriodo) {
        const periodoSeleccionado = periodos.find((p) => p.id === periodoId)
        if (periodoSeleccionado) {
          await actualizarPeriodo(periodoId, {
            ...periodoSeleccionado,
            bonoCalculado: true,
          })
          addProcessLog(`✅ Periodo marcado con bonos calculados`)
        }
      }

      // Resumen final
      addProcessLog("\n🏁 Proceso completado. Resumen:")
      addProcessLog(`✅ Categorías creadas/actualizadas: ${categoriasCreadas}`)
      addProcessLog(`✅ Pagos creados: ${pagosCreados}`)
      addProcessLog(`🔄 Pagos actualizados: ${pagosActualizados}`)
      addProcessLog(`👥 Total instructores procesados: ${todosInstructores.length}`)
      addProcessLog(
        `💵 Total monto procesado: ${pagos
          .filter((p) => p.periodoId === periodoId)
          .reduce((sum, p) => sum + p.monto, 0)
          .toFixed(2)}`,
      )
      addProcessLog(
        `📊 Promedio de clases por instructor: ${(clases.filter((c) => c.periodoId === periodoId).length / todosInstructores.length).toFixed(1)}`,
      )

      toast({
        title: "Cálculo completado",
        description: `Se han creado ${categoriasCreadas} categorías, ${pagosCreados} pagos nuevos y actualizado ${pagosActualizados}.`,
      })
    } catch (error) {
      addProcessLog(`❌ Error en el proceso: ${error instanceof Error ? error.message : "Error desconocido"}`)
      toast({
        title: "Error al calcular pagos",
        description: error instanceof Error ? error.message : "Error desconocido al calcular pagos",
        variant: "destructive",
      })
    } finally {
      addProcessLog("🏁 Finalizando proceso")
      setIsCalculatingPayments(false)
    }
  }

  // Función para manejar la duplicación de fórmulas
  const handleDuplicateFormulas = async () => {
    if (!periodoOrigenFormulas || !selectedPeriodoId) {
      toast({
        title: "Error",
        description: "No se puede duplicar las fórmulas sin un periodo origen o destino",
        variant: "destructive",
      })
      return
    }

    await duplicarFormulas(periodoOrigenFormulas.id, selectedPeriodoId)
  }

  // Función para re-evaluar todas las categorías de instructores
  const reevaluarTodasCategorias = async () => {
    console.log("\n[REEVALUACION] 🔄 Iniciando proceso de reevaluación de categorías...")

    setProcessLogs([])
    setShowProcessLogsDialog(true)
    addProcessLog("🔄 Re-evaluando categorías de instructores...")

    const periodoId = selectedPeriodoId || periodoActual?.id

    if (!periodoId) {
      console.log("[REEVALUACION] ❌ ERROR: No hay periodo seleccionado")
      addProcessLog("❌ Error: No hay periodo seleccionado")
      toast({
        title: "Error",
        description: "Debes seleccionar un periodo para re-evaluar las categorías",
        variant: "destructive",
      })
      return
    }

    if (!verificarFormulasExistentes(periodoId)) {
      const periodoOrigen = encontrarPeriodoConFormulas(periodoId)
      setPeriodoOrigenFormulas(periodoOrigen)
      setShowFormulaDuplicationDialog(true)
      setShowCalculateDialog(false)
      return
    }

    setIsCalculatingPayments(true)
    setShowCalculateDialog(false)

    try {
      addProcessLog(`📅 Re-evaluando categorías para periodo ID: ${periodoId}`)

      const instructoresConClases = [
        ...new Set(clases.filter((c) => c.periodoId === periodoId).map((c) => c.instructorId)),
      ]
      const todosInstructores = instructores.filter((i) => instructoresConClases.includes(i.id))

      addProcessLog(`👥 Total instructores con clases: ${todosInstructores.length}`)

      let categoriasActualizadas = 0

      // Helper function to calculate metrics
      const calcularMetricas = (clasesInstructor: any[], disciplinaId: number) => {
        const clasesDisciplina = clasesInstructor.filter((c) => c.disciplinaId === disciplinaId)
        const totalClases = clasesDisciplina.length
        const clasesPorSemana = totalClases / 4

        let totalReservas = 0
        let totalLugares = 0
        clasesDisciplina.forEach((clase) => {
          totalReservas += clase.reservasTotales
          totalLugares += clase.lugares
        })
        const ocupacion = totalLugares > 0 ? (totalReservas / totalLugares) * 100 : 0

        const localesEnLima = new Set(
          clasesDisciplina.filter((c) => c.ciudad.toLowerCase().includes("lima")).map((c) => c.estudio),
        ).size

        return { ocupacion, clases: totalClases, clasesPorSemana, localesEnLima }
      }

      // Process each instructor
      for (const instructor of todosInstructores) {
        addProcessLog(`Procesando instructor ${instructor.nombre}`, instructor.id)

        const clasesInstructor = clases.filter(
          (clase) => clase.instructorId === instructor.id && clase.periodoId === periodoId,
        )

        if (clasesInstructor.length === 0) {
          addProcessLog(`Sin clases, omitiendo`, instructor.id)
          continue
        }

        const pagoInstructor = pagos.find((p) => p.instructorId === instructor.id && p.periodoId === periodoId)

        if (!pagoInstructor) {
          addProcessLog(`Sin pago registrado, omitiendo`, instructor.id)
          continue
        }

        const disciplinasInstructor = [...new Set(clasesInstructor.map((c) => c.disciplinaId))]

        // Preservar valores manuales del pago existente
        const valoresManuales = {
          dobleteos: pagoInstructor.dobleteos || 0,
          participacionEventos: pagoInstructor.participacionEventos ?? true, // CAMBIO: true por defecto
          cumpleLineamientos: pagoInstructor.cumpleLineamientos ?? true, // CAMBIO: true por defecto
        }

        // Process each discipline the instructor has taught
        for (const disciplinaId of disciplinasInstructor) {
          const disciplina = disciplinas.find((d) => d.id === disciplinaId)
          const nombreDisciplina = disciplina?.nombre || `Disciplina ${disciplinaId}`

          // Skip disciplines that don't have visual categories
          if (disciplina && !mostrarCategoriaVisual(disciplina.nombre)) {
            continue
          }

          // Verificar si hay una categoría manual asignada
          const categoriaManual = manualCategorias.find(
            (c) => c.instructorId === instructor.id && c.disciplinaId === disciplinaId,
          )

          if (categoriaManual) {
            addProcessLog(
              `⚠️ Instructor tiene categoría manual asignada: ${categoriaManual.categoria}, omitiendo recálculo`,
              instructor.id,
            )
            continue
          }

          // Calculate real metrics for this discipline
          const metricasBase = calcularMetricas(clasesInstructor, disciplinaId)

          // Get formula for this discipline
          const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodoId)

          if (!formula) {
            addProcessLog(`No se encontró fórmula para ${nombreDisciplina}, omitiendo`, instructor.id)
            continue
          }

          // Prepare complete metrics using preserved manual values
          const metricasCompletas = {
            ...metricasBase,
            dobleteos: valoresManuales.dobleteos,
            horariosNoPrime: pagoInstructor.horariosNoPrime || 0,
            participacionEventos: valoresManuales.participacionEventos,
            cumpleLineamientos: valoresManuales.cumpleLineamientos,
          }

          const categoriaCalculada = determinarCategoria(
            instructor.id,
            disciplinaId,
            periodoId,
            formula,
            metricasCompletas,
          )

          // Get existing category
          const existingCategoria = instructor.categorias?.find(
            (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId,
          )

          // Si la categoría existente es manual, no actualizarla
          if (existingCategoria && existingCategoria.metricas && existingCategoria.metricas["esManual"]) {
            addProcessLog(
              `⚠️ Categoría existente es manual (${existingCategoria.categoria}), no se actualizará`,
              instructor.id,
            )
            continue
          }

          // If the category has changed, update it
          if (existingCategoria?.categoria !== categoriaCalculada) {
            try {
              addProcessLog(
                `🔄 Actualizando categoría para ${instructor.nombre} en ${nombreDisciplina} de ${existingCategoria?.categoria} a ${categoriaCalculada}`,
                instructor.id,
              )

              const categoriaActualizada = await crearCategoriaInstructor(
                instructor.id,
                disciplinaId,
                periodoId,
                categoriaCalculada,
                {
                  ocupacion: metricasBase.ocupacion,
                  clases: metricasBase.clases,
                  localesEnLima: metricasBase.localesEnLima,
                  dobleteos: valoresManuales.dobleteos,
                  horariosNoPrime: pagoInstructor.horariosNoPrime || 0,
                  participacionEventos: valoresManuales.participacionEventos,
                },
                false, // esManual = false
              )

              if (categoriaActualizada) {
                categoriasActualizadas++
                addProcessLog(
                  `✅ Categoría actualizada para ${instructor.nombre} en ${nombreDisciplina} a ${categoriaCalculada}`,
                  instructor.id,
                )
              }
            } catch (error) {
              addProcessLog(
                `❌ Error al actualizar categoría para ${instructor.nombre} en ${nombreDisciplina}: ${
                  error instanceof Error ? error.message : "Error desconocido"
                }`,
                instructor.id,
              )
            }
          } else {
            addProcessLog(
              `✓ Categoría sin cambios para ${instructor.nombre} en ${nombreDisciplina} (${categoriaCalculada})`,
              instructor.id,
            )
          }
        }
      }

      // Final summary
      addProcessLog("\n🏁 Proceso completado. Resumen:")
      addProcessLog(`✅ Categorías actualizadas: ${categoriasActualizadas}`)
      addProcessLog(`👥 Total instructores procesados: ${todosInstructores.length}`)

      await fetchInstructores()
      toast({
        title: "Re-evaluación completada",
        description: `Se han actualizado ${categoriasActualizadas} categorías de instructores.`,
      })
    } catch (error) {
      addProcessLog(`❌ Error en el proceso: ${error instanceof Error ? error.message : "Error desconocido"}`)
      toast({
        title: "Error al re-evaluar categorías",
        description: error instanceof Error ? error.message : "Error desconocido al re-evaluar categorías",
        variant: "destructive",
      })
    } finally {
      addProcessLog("🏁 Finalizando proceso")
      setIsCalculatingPayments(false)
    }
  }

  // Función para verificar si un periodo ya tiene bonos calculados
  const verificarBonoCalculado = (periodoId: number): boolean => {
    const periodo = periodos.find((p) => p.id === periodoId)
    return periodo?.bonoCalculado || false
  }

  // Función para obtener periodos disponibles para cálculo de bonos
  const obtenerPeriodosDisponiblesParaBono = (): Periodo[] => {
    return periodos.filter((p) => !p.bonoCalculado)
  }

  // Función para añadir o quitar un periodo de la selección para bonos
  const togglePeriodoParaBono = (periodoId: number) => {
    setPeriodosSeleccionadosParaBono((prev) => {
      if (prev.includes(periodoId)) {
        return prev.filter((id) => id !== periodoId)
      } else {
        return [...prev, periodoId]
      }
    })
  }

  // Función para calcular bonos para los periodos seleccionados
  const calcularBonosPeriodo = async () => {
    if (periodosSeleccionadosParaBono.length === 0 && selectedPeriodoId) {
      setPeriodosSeleccionadosParaBono([selectedPeriodoId])
    }

    if (periodosSeleccionadosParaBono.length === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos un periodo para calcular bonos",
        variant: "destructive",
      })
      return
    }

    setProcessLogs([])
    setShowProcessLogsDialog(true)
    addProcessLog("🚀 Iniciando proceso de cálculo de bonos...")
    addProcessLog(`📊 Periodos seleccionados: ${periodosSeleccionadosParaBono.join(", ")}`)
    setIsCalculatingBonuses(true)

    try {
      const instructoresConClases = [
        ...new Set(
          clases.filter((c) => periodosSeleccionadosParaBono.includes(c.periodoId)).map((c) => c.instructorId),
        ),
      ]

      const todosInstructores = instructores.filter((i) => instructoresConClases.includes(i.id))
      addProcessLog(`👥 Total instructores a procesar: ${todosInstructores.length}`)

      let bonosActualizados = 0
      const pagosParaActualizar: any[] = []

      // Procesar cada instructor
      for (const instructor of todosInstructores) {
        addProcessLog(`Procesando bonos para ${instructor.nombre}`, instructor.id)

        // Procesar cada periodo seleccionado
        for (const periodoId of periodosSeleccionadosParaBono) {
          const periodo = periodos.find((p) => p.id === periodoId)
          if (!periodo) continue

          addProcessLog(`Calculando bonos para periodo ${periodo.numero}-${periodo.año}`, instructor.id)

          const pagoExistente = pagos.find((p) => p.instructorId === instructor.id && p.periodoId === periodoId)

          if (!pagoExistente) {
            addProcessLog(`⚠️ No existe pago para este periodo, omitiendo`, instructor.id)
            continue
          }

          if (pagoExistente.estado === "CANCELADO") {
            addProcessLog(`⚠️ Pago cancelado, omitiendo`, instructor.id)
            continue
          }

          const clasesInstructor = clases.filter((c) => c.instructorId === instructor.id && c.periodoId === periodoId)

          if (clasesInstructor.length === 0) {
            addProcessLog(`⚠️ Sin clases en este periodo, omitiendo`, instructor.id)
            continue
          }

          const disciplinasUnicas = [...new Set(clasesInstructor.map((c) => c.disciplinaId))]
          const instructorActualizado = await instructoresApi.getInstructor(instructor.id)

          let bonoTotal = 0
          const detallesBono: string[] = []

          const tieneCategoriasEspeciales = instructorActualizado.categorias?.some(
            (cat) => cat.periodoId === periodoId && cat.categoria !== "INSTRUCTOR",
          )

          if (tieneCategoriasEspeciales) {
            addProcessLog(`Calculando bonos por categorías especiales`, instructor.id)

            for (const disciplinaId of disciplinasUnicas) {
              const categoriaManual = manualCategorias.find(
                (c) => c.instructorId === instructor.id && c.disciplinaId === disciplinaId,
              )

              let categoriaInfo

              if (categoriaManual && categoriaManual.categoria !== "INSTRUCTOR") {
                categoriaInfo = {
                  disciplinaId,
                  periodoId,
                  categoria: categoriaManual.categoria,
                }
                addProcessLog(`Usando categoría manual ${categoriaManual.categoria} para bono`, instructor.id)
              } else {
                categoriaInfo = instructorActualizado.categorias?.find(
                  (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId && c.categoria !== "INSTRUCTOR",
                )
              }

              if (categoriaInfo) {
                const disciplina = disciplinas.find((d) => d.id === disciplinaId)
                const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodoId)

                if (formula) {
                  const bonoPorAlumno = formula.parametrosPago?.[categoriaInfo.categoria]?.bono || 0

                  if (bonoPorAlumno > 0) {
                    const clasesDisciplina = clasesInstructor.filter((c) => c.disciplinaId === disciplinaId)
                    let totalReservas = 0

                    clasesDisciplina.forEach((clase) => {
                      if (clase.esVersus && clase.vsNum && clase.vsNum > 1) {
                        totalReservas += clase.reservasTotales / clase.vsNum
                      } else {
                        totalReservas += clase.reservasTotales
                      }
                    })

                    const bonoDisciplina = bonoPorAlumno * totalReservas
                    bonoTotal += bonoDisciplina

                    const disciplinaNombre = disciplina?.nombre || `Disciplina ${disciplinaId}`
                    detallesBono.push(
                      `${disciplinaNombre}: ${bonoDisciplina.toFixed(2)} (${totalReservas} reservas x ${bonoPorAlumno} por alumno)`,
                    )

                    addProcessLog(
                      `Bono para ${disciplinaNombre}: ${bonoDisciplina.toFixed(2)} (${totalReservas} reservas x ${bonoPorAlumno} por alumno)`,
                      instructor.id,
                    )
                  }
                }
              }
            }
          } else {
            addProcessLog(`⚠️ No tiene categorías especiales, no aplica bono`, instructor.id)
          }

          // Si hay bono calculado, actualizar el pago
          if (bonoTotal > 0) {
            const comentarioBono = `Bono calculado para periodo ${periodo.numero}-${periodo.año}: ${bonoTotal.toFixed(2)}. Detalles: ${detallesBono.join("; ")}`

            const nuevoReajuste = (pagoExistente.reajuste || 0) + bonoTotal
            const nuevosComentarios = pagoExistente.comentarios
              ? `${pagoExistente.comentarios}\n${comentarioBono}`
              : comentarioBono

            const actualizacion = {
              id: pagoExistente.id,
              reajuste: nuevoReajuste,
              comentarios: nuevosComentarios,
              bono: bonoTotal,
            }

            pagosParaActualizar.push({ id: pagoExistente.id, data: actualizacion })
            bonosActualizados++

            addProcessLog(`✅ Bono calculado: ${bonoTotal.toFixed(2)}`, instructor.id)
            addProcessLog(`✅ Nuevo reajuste total: ${nuevoReajuste.toFixed(2)}`, instructor.id)
          } else {
            addProcessLog(`ℹ️ No se calculó bono para este periodo`, instructor.id)
          }
        }
      }

      // Actualizar todos los pagos en la base de datos
      addProcessLog(`\n🔄 Actualizando base de datos con ${pagosParaActualizar.length} pagos...`)

      for (const pago of pagosParaActualizar) {
        try {
          const { id, ...datosActualizacion } = pago.data
          await actualizarPago(pago.id, datosActualizacion)
        } catch (error) {
          addProcessLog(`❌ Error al guardar pago: ${error instanceof Error ? error.message : "Error desconocido"}`)
        }
      }

      await fetchPagos()
      addProcessLog(`✅ Base de datos actualizada correctamente`)

      // Marcar los periodos como con bonos calculados
      for (const periodoId of periodosSeleccionadosParaBono) {
        const periodoSeleccionado = periodos.find((p) => p.id === periodoId)
        if (periodoSeleccionado && !periodoSeleccionado.bonoCalculado) {
          await actualizarPeriodo(periodoId, {
            ...periodoSeleccionado,
            bonoCalculado: true,
          })
          addProcessLog(
            `✅ Periodo ${periodoSeleccionado.numero}-${periodoSeleccionado.año} marcado con bonos calculados`,
          )
        }
      }

      // Final summary
      addProcessLog("\n🏁 Proceso completado. Resumen:")
      addProcessLog(`✅ Bonos actualizados: ${bonosActualizados}`)
      addProcessLog(`👥 Total instructores procesados: ${todosInstructores.length}`)
      addProcessLog(`📅 Periodos procesados: ${periodosSeleccionadosParaBono.length}`)

      toast({
        title: "Cálculo de bonos completado",
        description: `Se han actualizado ${bonosActualizados} bonos para ${todosInstructores.length} instructores.`,
      })

      setPeriodosSeleccionadosParaBono([])
    } catch (error) {
      addProcessLog(`❌ Error en el proceso: ${error instanceof Error ? error.message : "Error desconocido"}`)
      toast({
        title: "Error al calcular bonos",
        description: error instanceof Error ? error.message : "Error desconocido al calcular bonos",
        variant: "destructive",
      })
    } finally {
      addProcessLog("🏁 Finalizando proceso")
      setIsCalculatingBonuses(false)
    }
  }

  return {
    // Estados principales
    isCalculatingPayments,
    processLogs,
    setProcessLogs,
    selectedPeriodoId,
    setSelectedPeriodoId,
    calcularBonoEnPeriodo,
    setCalcularBonoEnPeriodo,

    // Funciones principales
    calcularPagosPeriodo,
    reevaluarTodasCategorias,

    // Estados y funciones para duplicación de fórmulas
    showFormulaDuplicationDialog,
    setShowFormulaDuplicationDialog,
    periodoOrigenFormulas,
    isDuplicatingFormulas,
    handleDuplicateFormulas,

    // Estados y funciones para categorías manuales
    selectedInstructorId,
    setSelectedInstructorId,
    selectedDisciplinaId,
    setSelectedDisciplinaId,
    manualCategoria,
    setManualCategoria,
    manualCategorias,
    setManualCategorias,
    agregarCategoriaManual,
    eliminarCategoriaManual,
    aplicarCategoriasManual,

    // Estados y funciones para bonos
    isCalculatingBonuses,
    periodosSeleccionadosParaBono,
    setPeriodosSeleccionadosParaBono,
    verificarBonoCalculado,
    obtenerPeriodosDisponiblesParaBono,
    togglePeriodoParaBono,
    calcularBonosPeriodo,
  }
}