import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { prisma } from "@/lib/prisma"
import type { 
  DatosExcelClase, 
  TablaClasesEditable, 
  ClaseEditable
} from "@/types/importacion"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const semanaInicial = parseInt(formData.get("semanaInicial") as string)

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      )
    }

    if (!semanaInicial || semanaInicial < 1) {
      return NextResponse.json(
        { error: "La semana inicial debe ser un número mayor a 0" },
        { status: 400 }
      )
    }

    // Leer el archivo Excel
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]

    // Opciones para procesar fechas correctamente
    const options = {
      raw: false,
      dateNF: "yyyy-mm-dd",
      cellDates: true,
      defval: "",
    }

    // Convertir a JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, options)
    const processedData = preprocessExcelData(rawData)

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

    // Generar tabla de clases editables con mapeo automático de semanas
    const resultado = generarTablaClases(
      processedData, 
      instructoresActivos, 
      disciplinas, 
      semanaInicial
    )

    return NextResponse.json(resultado)
  } catch (error) {
    console.error("Error al generar tabla de clases:", error)
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
  let processedData = data.filter((row) => {
    const hasCriticalData = row.Instructor && row.Disciplina && row.Día
    return hasCriticalData
  })

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
      processedRow.Disciplina = processedRow.Disciplina.trim()
    }

    // Normalizar nombres de estudios
    if (processedRow.Estudio) {
      processedRow.Estudio = processedRow.Estudio.trim()
    }

    // Normalizar nombres de salones
    if (processedRow.Salon) {
      processedRow.Salon = processedRow.Salon.trim()
    }

    // Procesar fecha
    if (processedRow.Día) {
      if (typeof processedRow.Día === 'string') {
        processedRow.Día = new Date(processedRow.Día)
      }
    }

    // Procesar hora
    if (processedRow.Hora) {
      processedRow.Hora = processedRow.Hora.toString().trim()
    }

    // Procesar semana
    if (processedRow.Semana) {
      processedRow.Semana = parseInt(processedRow.Semana) || 1
    } else {
      processedRow.Semana = 1
    }

    return processedRow
  })

  return processedData
}

// Función para generar tabla de clases con mapeo automático de semanas
function generarTablaClases(
  data: DatosExcelClase[], 
  instructoresSistema: any[], 
  disciplinasSistema: any[],
  semanaInicial: number
): { tablaClases: TablaClasesEditable, mapeoDisciplinas: Record<string, string> } {
  const clases: ClaseEditable[] = []
  const mapeoDisciplinas: Record<string, string> = {}
  const disciplinasExcel = new Set<string>()
  const instructoresExcel = new Set<string>()
  const clasesVS = new Set<string>()

  // Analizar datos del Excel
  data.forEach((row, index) => {
    const semanaExcel = row.Semana || 1
    
    // Mapeo correcto: semanaInicial del Excel → semana 1 del periodo
    // Si semanaInicial = 28, entonces: semana 28 → semana 1, semana 29 → semana 2, etc.
    // Solo procesar las 4 semanas consecutivas empezando desde semanaInicial
    if (semanaExcel < semanaInicial || semanaExcel > semanaInicial + 3) {
      return // Saltar semanas fuera del rango del periodo
    }
    
    // Mapear: semanaInicial → semana 1, semanaInicial+1 → semana 2, etc.
    const semanaMapeada = semanaExcel - semanaInicial + 1

    // Detectar instructores VS
    const esInstructorVS = row.Instructor.toLowerCase().includes(" vs ") || 
                          row.Instructor.toLowerCase().includes(" vs. ") ||
                          row.Instructor.toLowerCase().includes(" vs.")
    
    if (esInstructorVS) {
      clasesVS.add(row.Instructor)
      
      // Separar los instructores VS y crear una clase para cada uno
      const instructoresVS = row.Instructor.split(/ vs\.? /i).map(instr => instr.trim())
      
      instructoresVS.forEach((instructor, index) => {
        // Crear ID único para cada instructor VS
        const idVS = row.ID_clase ? `${row.ID_clase}${String.fromCharCode(97 + index)}` : `clase-vs-${index}-${Date.now()}`
        
        // Crear clase editable para cada instructor VS
        const claseVS: ClaseEditable = {
          id: idVS,
          filaOriginal: index + 1,
          instructor: instructor,
          disciplina: row.Disciplina,
          estudio: row.Estudio || "",
          salon: row.Salon || "",
          dia: row.Día instanceof Date ? row.Día.toISOString().split('T')[0] : String(row.Día),
          hora: row.Hora || "",
          semana: semanaMapeada,
          reservasTotales: Number(row["Reservas Totales"] || 0),
          listasEspera: Number(row["Listas de Espera"] || 0),
          cortesias: Number(row.Cortesias || 0),
          lugares: Number(row.Lugares || 0),
          reservasPagadas: Number(row["Reservas Pagadas"] || 0),
          esInstructorVS: true,
          instructoresVS: instructoresVS,
          mapeoDisciplina: disciplinasSistema.some(disciplina => 
            disciplina.nombre.toLowerCase() === row.Disciplina.toLowerCase()
          ) ? row.Disciplina : undefined,
          mapeoSemana: semanaMapeada,
          instructorExiste: instructoresSistema.some(instr => 
            instr.nombre.toLowerCase() === instructor.toLowerCase()
          ),
          instructorNuevo: !instructoresSistema.some(instr => 
            instr.nombre.toLowerCase() === instructor.toLowerCase()
          ),
          eliminada: false,
          errores: []
        }
        
        clases.push(claseVS)
      })
      
      // No agregar la clase original VS, ya que se crearon las individuales
      return
    }

    // Recolectar disciplinas e instructores únicos
    disciplinasExcel.add(row.Disciplina)
    instructoresExcel.add(row.Instructor)

    // Buscar instructor en el sistema
    const instructorExiste = instructoresSistema.some(instructor => 
      instructor.nombre.toLowerCase() === row.Instructor.toLowerCase()
    )

    // Buscar disciplina en el sistema
    const disciplinaExiste = disciplinasSistema.some(disciplina => 
      disciplina.nombre.toLowerCase() === row.Disciplina.toLowerCase()
    )

    // Crear clase editable
    const clase: ClaseEditable = {
      id: row.ID_clase || `clase-${index}`,
      filaOriginal: index + 1,
      instructor: row.Instructor,
      disciplina: row.Disciplina,
      estudio: row.Estudio || "",
      salon: row.Salon || "",
      dia: row.Día instanceof Date ? row.Día.toISOString().split('T')[0] : String(row.Día),
      hora: row.Hora || "",
      semana: semanaMapeada,
      reservasTotales: Number(row["Reservas Totales"] || 0),
      listasEspera: Number(row["Listas de Espera"] || 0),
      cortesias: Number(row.Cortesias || 0),
      lugares: Number(row.Lugares || 0),
      reservasPagadas: Number(row["Reservas Pagadas"] || 0),
      esInstructorVS: false,
      instructoresVS: undefined,
      mapeoDisciplina: disciplinaExiste ? row.Disciplina : undefined,
      mapeoSemana: semanaMapeada,
      instructorExiste,
      instructorNuevo: !instructorExiste,
      eliminada: false,
      errores: []
    }

    clases.push(clase)
  })

  // Generar mapeo de disciplinas por defecto
  disciplinasExcel.forEach(disciplinaExcel => {
    const disciplinaExiste = disciplinasSistema.some(disciplina => 
      disciplina.nombre.toLowerCase() === disciplinaExcel.toLowerCase()
    )
    
    if (!disciplinaExiste) {
      // Buscar disciplina similar
      const disciplinaSimilar = disciplinasSistema.find(disciplina => 
        disciplina.nombre.toLowerCase().includes(disciplinaExcel.toLowerCase()) ||
        disciplinaExcel.toLowerCase().includes(disciplina.nombre.toLowerCase())
      )
      
      if (disciplinaSimilar) {
        mapeoDisciplinas[disciplinaExcel] = disciplinaSimilar.nombre
      }
    }
  })

  // Calcular estadísticas
  const totalClases = clases.length
  const clasesValidas = clases.filter(c => !c.eliminada).length
  const clasesConErrores = clases.filter(c => c.errores && c.errores.length > 0).length
  const clasesEliminadas = clases.filter(c => c.eliminada).length

  const tablaClases: TablaClasesEditable = {
    clases,
    totalClases,
    clasesValidas,
    clasesConErrores,
    clasesEliminadas
  }

  return { tablaClases, mapeoDisciplinas }
}
