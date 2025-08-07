import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import type { 
  DatosExcelClase, 
  ResultadoAnalisis, 
  InstructorVS, 
  InstructorAnalysis, 
  DisciplineAnalysis,
  ErrorImportacion 
} from "@/types/importacion"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      )
    }

    // Verificar que sea un archivo Excel
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json(
        { error: "El archivo debe ser un archivo Excel (.xlsx o .xls)" },
        { status: 400 }
      )
    }

    console.log("Iniciando análisis del archivo:", fileName)

    // Leer el archivo Excel
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    
    // Obtener la primera hoja
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]

    console.log("Hoja encontrada:", firstSheetName)

    // Opciones para procesar fechas correctamente
    const options = {
      raw: false,
      dateNF: "yyyy-mm-dd",
      cellDates: true,
      defval: "",
    }

    // Convertir a JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, options)
    console.log("Datos raw extraídos:", rawData.length, "filas")
    
    // Preprocesar los datos
    const processedData = preprocessExcelData(rawData)
    console.log("Datos procesados:", processedData.length, "filas")

    // Realizar análisis
    const resultado = await analizarDatos(processedData)
    console.log("Análisis completado")

    return NextResponse.json(resultado)
  } catch (error) {
    console.error("Error al analizar archivo Excel:", error)
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    )
  }
}

// Función para preprocesar los datos del Excel
function preprocessExcelData(data: any[]): DatosExcelClase[] {
  console.log("Iniciando preprocesamiento de datos...")
  console.log(`Datos originales: ${data.length} filas`)

  // Filtrar filas con datos críticos faltantes
  let processedData = data.filter((row) => {
    const hasCriticalData = row.Instructor && row.Disciplina && row.Día
    if (!hasCriticalData) {
      console.log("Fila descartada por falta de datos críticos:", row)
    }
    return hasCriticalData
  })

  console.log(`Después de filtrar filas incompletas: ${processedData.length} filas`)

  // Procesar cada fila para normalizar datos
  processedData = processedData.map((row) => {
    const processedRow = { ...row }

    // Normalizar nombres de instructores
    if (processedRow.Instructor) {
      processedRow.Instructor = processedRow.Instructor.split(" ")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ")
        .trim()
    }

    // Normalizar nombres de disciplinas
    if (processedRow.Disciplina) {
      processedRow.Disciplina = processedRow.Disciplina.split(" ")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ")
        .trim()
    }

    // Normalizar otros campos de texto
    if (processedRow.Estudio) {
      processedRow.Estudio = processedRow.Estudio.trim()
    }
    if (processedRow.Salon) {
      processedRow.Salon = processedRow.Salon.trim()
    }

    // Asegurar que los campos numéricos sean números
    const numericFields = ["Reservas Totales", "Listas de Espera", "Cortesias", "Lugares", "Reservas Pagadas", "Semana"]
    numericFields.forEach((field) => {
      if (field in processedRow) {
        if (typeof processedRow[field] === "string") {
          const numValue = Number(processedRow[field].replace(/[^\d.-]/g, ""))
          processedRow[field] = isNaN(numValue) ? 0 : numValue
        } else if (processedRow[field] === null || processedRow[field] === undefined) {
          processedRow[field] = 0
        }
      } else {
        processedRow[field] = 0
      }
    })

    return processedRow
  })

  console.log(`Preprocesamiento completado: ${processedData.length} filas válidas`)
  return processedData as DatosExcelClase[]
}

// Función para analizar los datos
async function analizarDatos(data: DatosExcelClase[]): Promise<ResultadoAnalisis> {
  const errores: ErrorImportacion[] = []
  
  try {
    console.log("Obteniendo datos del sistema...")
    
    // Obtener datos del sistema
    const [instructores, disciplinas] = await Promise.all([
      prisma.instructor.findMany({
        include: {
          disciplinas: true
        }
      }),
      prisma.disciplina.findMany({
        where: { activo: true }
      })
    ])

    // Filtrar instructores activos
    const instructoresActivos = instructores.filter(instructor => {
      const extrainfo = instructor.extrainfo as any
      return extrainfo?.estado === 'ACTIVO' || extrainfo?.activo === true || !extrainfo?.activo
    })

    console.log(`Instructores totales: ${instructores.length}`)
    console.log(`Instructores activos: ${instructoresActivos.length}`)
    console.log(`Disciplinas encontradas: ${disciplinas.length}`)

    // Analizar semanas encontradas
    const semanasEncontradas = [...new Set(data.map(row => row.Semana).filter(semana => semana > 0))].sort((a, b) => a - b)
    console.log("Semanas encontradas:", semanasEncontradas)

    // Analizar instructores
    console.log("Analizando instructores...")
    const instructorAnalysis = await analizarInstructores(data, instructoresActivos)

    // Analizar disciplinas
    console.log("Analizando disciplinas...")
    const disciplineAnalysis = await analizarDisciplinas(data, disciplinas)

    // Analizar instructores VS
    console.log("Analizando instructores VS...")
    const instructoresVS = analizarInstructoresVS(data)

    // Obtener listas únicas
    const instructoresEncontrados = [...new Set(data.map(row => row.Instructor))]
    const disciplinasEncontradas = [...new Set(data.map(row => row.Disciplina))]

    console.log("Análisis completado exitosamente")

    return {
      totalRegistros: data.length,
      semanasEncontradas,
      instructoresEncontrados,
      disciplinasEncontradas,
      instructoresVS,
      instructorAnalysis,
      disciplineAnalysis,
      errores
    }
  } catch (error) {
    console.error("Error en analizarDatos:", error)
    throw error
  }
}

// Función para analizar instructores
async function analizarInstructores(data: DatosExcelClase[], instructoresSistema: any[]): Promise<InstructorAnalysis> {
  const instructorInfo: Record<string, { count: number; disciplines: Set<string> }> = {}

  // Procesar cada fila para recopilar información de instructores
  data.forEach((row) => {
    const instructor = row.Instructor
    const discipline = row.Disciplina

    // Detectar instructores VS (hasta 4 instructores)
    if (instructor.toLowerCase().includes(" vs ") || instructor.toLowerCase().includes(" vs. ")) {
      const parts = instructor.split(/\s+vs\.?\s+/i)
      if (parts.length >= 2 && parts.length <= 4) {
        // Agregar cada instructor individual
        parts.forEach(part => {
          const instructorName = part.trim()
          if (!instructorInfo[instructorName]) {
            instructorInfo[instructorName] = {
              count: 0,
              disciplines: new Set<string>()
            }
          }
          instructorInfo[instructorName].count += 1
          instructorInfo[instructorName].disciplines.add(discipline)
        })
      }
    } else {
      // Instructor regular
      if (!instructorInfo[instructor]) {
        instructorInfo[instructor] = {
          count: 0,
          disciplines: new Set<string>()
        }
      }
      instructorInfo[instructor].count += 1
      instructorInfo[instructor].disciplines.add(discipline)
    }
  })

  // Crear análisis
  const instructorsAnalysis = Object.keys(instructorInfo).map((name) => {
    const matchedInstructor = instructoresSistema.find((i) => 
      i.nombre.toLowerCase() === name.toLowerCase()
    )

    return {
      name,
      exists: !!matchedInstructor,
      count: instructorInfo[name].count,
      disciplines: Array.from(instructorInfo[name].disciplines), // Convertir Set a Array
      matchedInstructor
    }
  })

  const existingCount = instructorsAnalysis.filter((i) => i.exists).length

  return {
    total: instructorsAnalysis.length,
    existing: existingCount,
    new: instructorsAnalysis.length - existingCount,
    instructors: instructorsAnalysis.sort((a, b) => b.count - a.count)
  }
}

// Función para analizar disciplinas
async function analizarDisciplinas(data: DatosExcelClase[], disciplinasSistema: any[]): Promise<DisciplineAnalysis> {
  const disciplineCounts: Record<string, number> = {}
  
  data.forEach((row) => {
    const discipline = row.Disciplina
    disciplineCounts[discipline] = (disciplineCounts[discipline] || 0) + 1
  })

  const disciplinesAnalysis = Object.keys(disciplineCounts).map((name) => {
    const matchedDiscipline = disciplinasSistema.find((d) => 
      d.nombre.toLowerCase() === name.toLowerCase()
    )

    return {
      name,
      exists: !!matchedDiscipline,
      count: disciplineCounts[name],
      matchedDiscipline
    }
  })

  const existingCount = disciplinesAnalysis.filter((d) => d.exists).length

  return {
    total: disciplinesAnalysis.length,
    existing: existingCount,
    new: disciplinesAnalysis.length - existingCount,
    disciplines: disciplinesAnalysis.sort((a, b) => b.count - a.count)
  }
}

// Función para analizar instructores VS
function analizarInstructoresVS(data: DatosExcelClase[]): InstructorVS[] {
  const vsInstructorsData: Record<string, InstructorVS> = {}

  data.forEach((row) => {
    const instructor = row.Instructor

    // Detectar instructores VS (hasta 4 instructores)
    if (instructor.toLowerCase().includes(" vs ") || instructor.toLowerCase().includes(" vs. ")) {
      const parts = instructor.split(/\s+vs\.?\s+/i)
      if (parts.length >= 2 && parts.length <= 4) {
        const instructores = parts.map(part => part.trim())
        
        if (!vsInstructorsData[instructor]) {
          vsInstructorsData[instructor] = {
            originalName: instructor,
            instructores,
            count: 0,
            keepInstructores: new Array(instructores.length).fill(true)
          }
        }
        vsInstructorsData[instructor].count++
      }
    }
  })

  return Object.values(vsInstructorsData)
} 