import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import type { 
  DatosExcelClase, 
  ConfiguracionImportacion,
  ResultadoImportacion,
  ErrorImportacion,
  MapeoSemanas
} from "@/types/importacion"

export async function POST(request: NextRequest) {
  try {
    console.log("=== INICIANDO PROCESAMIENTO DE IMPORTACIÓN ===")
    
    const formData = await request.formData()
    const file = formData.get("file") as File
    const configuracionJson = formData.get("configuracion") as string

    if (!file || !configuracionJson) {
      return NextResponse.json(
        { error: "Archivo y configuración son requeridos" },
        { status: 400 }
      )
    }

    console.log("Archivo recibido:", file.name)
    console.log("Configuración recibida:", configuracionJson.substring(0, 200) + "...")

    const configuracion: ConfiguracionImportacion = JSON.parse(configuracionJson)

    // Validar configuración
    if (!configuracion.periodoId) {
      return NextResponse.json(
        { error: "ID del periodo es requerido" },
        { status: 400 }
      )
    }

    console.log("Periodo ID:", configuracion.periodoId)
    console.log("Mapeo semanas:", configuracion.mapeoSemanas)
    console.log("Instructores a crear:", configuracion.instructoresCreados)

    // Verificar que el periodo existe
    const periodo = await prisma.periodo.findUnique({
      where: { id: configuracion.periodoId }
    })

    if (!periodo) {
      return NextResponse.json(
        { error: "Periodo no encontrado" },
        { status: 404 }
      )
    }

    console.log("Periodo encontrado:", periodo.numero, periodo.año)

    // Leer el archivo Excel
    console.log("Leyendo archivo Excel...")
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]

    const options = {
      raw: false,
      dateNF: "yyyy-mm-dd",
      cellDates: true,
      defval: "",
    }

    const rawData = XLSX.utils.sheet_to_json(worksheet, options)
    console.log("Datos raw extraídos:", rawData.length, "filas")
    
    const processedData = preprocessExcelData(rawData)
    console.log("Datos procesados:", processedData.length, "filas")

    // Procesar la importación
    console.log("Iniciando procesamiento de importación...")
    const resultado = await procesarImportacion(processedData, configuracion)

    console.log("=== PROCESAMIENTO COMPLETADO ===")
    return NextResponse.json(resultado)
  } catch (error) {
    console.error("=== ERROR EN PROCESAMIENTO ===")
    console.error("Error al procesar importación:", error)
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace")
    
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// Función para preprocesar los datos del Excel (similar a la anterior)
function preprocessExcelData(data: any[]): DatosExcelClase[] {
  console.log("Iniciando preprocesamiento de datos...")
  console.log(`Datos originales: ${data.length} filas`)

  let processedData = data.filter((row) => {
    const hasCriticalData = row.Instructor && row.Disciplina && row.Día
    if (!hasCriticalData) {
      console.log("Fila descartada por falta de datos críticos:", row)
    }
    return hasCriticalData
  })

  console.log(`Después de filtrar filas incompletas: ${processedData.length} filas`)

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

    // Normalizar otros campos
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

// Función principal para procesar la importación
async function procesarImportacion(data: DatosExcelClase[], configuracion: ConfiguracionImportacion): Promise<ResultadoImportacion> {
  const errores: ErrorImportacion[] = []
  let clasesCreadas = 0
  let instructoresCreados = 0
  let clasesEliminadas = 0

  try {
    console.log("=== INICIANDO PROCESAMIENTO DE IMPORTACIÓN ===")
    console.log("Total de registros a procesar:", data.length)
    console.log("Configuración recibida:", {
      periodoId: configuracion.periodoId,
      mapeoSemanas: configuracion.mapeoSemanas.length,
      instructoresCreados: configuracion.instructoresCreados.length
    })

    // 1. PASO 1: CREAR INSTRUCTORES FALTANTES
    console.log("=== PASO 1: Creando instructores faltantes ===")
    const instructoresCache: Record<string, number> = {}
    
    // Obtener instructores existentes
    const instructoresExistentes = await prisma.instructor.findMany({
      include: {
        disciplinas: true
      }
    })

    // Filtrar instructores activos
    const instructoresActivos = instructoresExistentes.filter(instructor => {
      const extrainfo = instructor.extrainfo as any
      return extrainfo?.estado === 'ACTIVO' || extrainfo?.activo === true || !extrainfo?.activo
    })

    // Llenar caché con instructores activos
    instructoresActivos.forEach((instructor) => {
      instructoresCache[instructor.nombre.toLowerCase()] = instructor.id
    })

    // Crear instructores faltantes
    for (const nombreInstructor of configuracion.instructoresCreados) {
      try {
        // Verificar si el instructor ya existe (case-insensitive)
        const instructorExistente = instructoresActivos.find(
          instructor => instructor.nombre.toLowerCase() === nombreInstructor.toLowerCase()
        )
        
        if (instructorExistente) {
          console.log(`Instructor ya existe: ${nombreInstructor} (ID: ${instructorExistente.id})`)
          // Asegurar que esté en el caché
          instructoresCache[nombreInstructor.toLowerCase()] = instructorExistente.id
        } else if (!instructoresCache[nombreInstructor.toLowerCase()]) {
          const instructorId = await crearInstructor(nombreInstructor)
          instructoresCache[nombreInstructor.toLowerCase()] = instructorId
          instructoresCreados++
          console.log(`Instructor creado: ${nombreInstructor} (ID: ${instructorId})`)
        }
      } catch (error) {
        console.error(`Error al crear instructor ${nombreInstructor}:`, error)
        errores.push({
          fila: 0,
          mensaje: `Error al crear instructor "${nombreInstructor}": ${error instanceof Error ? error.message : "Error desconocido"}`
        })
      }
    }

    // 2. PASO 2: ELIMINAR CLASES EXISTENTES PARA LAS SEMANAS A IMPORTAR
    console.log("=== PASO 2: Eliminando clases existentes ===")
    const semanasAImportar = configuracion.mapeoSemanas.map(ms => ms.semanaPeriodo)
    
    const clasesExistentes = await prisma.clase.findMany({
      where: {
        periodoId: configuracion.periodoId,
        semana: {
          in: semanasAImportar
        }
      }
    })

    if (clasesExistentes.length > 0) {
      await prisma.clase.deleteMany({
        where: {
          periodoId: configuracion.periodoId,
          semana: {
            in: semanasAImportar
          }
        }
      })
      clasesEliminadas = clasesExistentes.length
      console.log(`Se eliminaron ${clasesEliminadas} clases existentes`)
    }

    // 3. PASO 3: FILTRAR DATOS POR SEMANAS MAPEADAS
    console.log("=== PASO 3: Filtrando datos por semanas mapeadas ===")
    
    // Obtener las semanas del Excel que están mapeadas
    const semanasExcelMapeadas = configuracion.mapeoSemanas.map(ms => ms.semanaExcel)
    console.log("Semanas del Excel que se procesarán:", semanasExcelMapeadas)
    
    // Filtrar datos para procesar solo las semanas mapeadas
    const datosFiltrados = data.filter(row => {
      const semanaMapeada = semanasExcelMapeadas.includes(row.Semana)
      if (!semanaMapeada) {
        console.log(`Fila descartada: Semana ${row.Semana} no está mapeada`)
      }
      return semanaMapeada
    })
    
    console.log(`Datos originales: ${data.length}, Datos filtrados: ${datosFiltrados.length}`)
    
    // 4. PASO 4: CREAR NUEVAS CLASES
    console.log("=== PASO 4: Creando nuevas clases ===")
    
    for (let i = 0; i < datosFiltrados.length; i++) {
      try {
        const row = datosFiltrados[i]
        console.log(`\n--- Procesando registro ${i + 1}/${datosFiltrados.length} ---`)

        // Aplicar mapeo de disciplinas
        const disciplinaMapeada = configuracion.mapeoDisciplinas[row.Disciplina] || row.Disciplina
        
        // Buscar disciplina en el sistema
        const disciplina = await prisma.disciplina.findFirst({
          where: {
            nombre: {
              equals: disciplinaMapeada,
              mode: 'insensitive'
            },
            activo: true
          }
        })

        if (!disciplina) {
          errores.push({
            fila: i + 1,
            mensaje: `No se encontró la disciplina "${disciplinaMapeada}"`
          })
          continue
        }

        // Procesar instructores (regular o VS)
        const instructorIds = await procesarInstructores(row, configuracion, instructoresCache)

        if (instructorIds.length === 0) {
          errores.push({
            fila: i + 1,
            mensaje: `No se pudieron procesar los instructores para "${row.Instructor}"`
          })
          continue
        }

        // Procesar fecha y hora
        const fechaConHora = await procesarFechaHora(row.Día, row.Hora)
        if (!fechaConHora) {
          errores.push({
            fila: i + 1,
            mensaje: `Formato de fecha/hora inválido: "${row.Día}" "${row.Hora}"`
          })
          continue
        }

        // Mapear semana del Excel a semana del periodo
        const semanaPeriodo = mapearSemana(row.Semana, configuracion.mapeoSemanas)
        if (!semanaPeriodo) {
          // Semana no mapeada - se descarta silenciosamente
          console.log(`Fila ${i + 1}: Semana ${row.Semana} del Excel no mapeada, descartando registro`)
          continue
        }

        // Crear clase(es)
        if (instructorIds.length === 1) {
          // Clase regular
          await crearClaseRegular(row, instructorIds[0], disciplina.id, configuracion.periodoId, semanaPeriodo, fechaConHora)
          clasesCreadas++
        } else {
          // Clase VS (hasta 4 instructores)
          await crearClasesVS(row, instructorIds, disciplina.id, configuracion.periodoId, semanaPeriodo, fechaConHora, configuracion)
          clasesCreadas += instructorIds.length
        }

      } catch (error) {
        console.error(`Error al procesar fila ${i + 1}:`, error)
        errores.push({
          fila: i + 1,
          mensaje: error instanceof Error ? error.message : "Error desconocido"
        })
      }
    }

    console.log("=== PROCESO DE IMPORTACIÓN COMPLETADO ===")
    console.log(`Clases creadas: ${clasesCreadas}`)
    console.log(`Instructores creados: ${instructoresCreados}`)
    console.log(`Clases eliminadas: ${clasesEliminadas}`)

    return {
      totalRegistros: data.length,
      registrosFiltrados: datosFiltrados.length,
      registrosImportados: clasesCreadas,
      registrosConError: errores.length,
      errores,
      clasesCreadas,
      clasesEliminadas,
      instructoresCreados
    }

  } catch (error) {
    console.error("Error general en la importación:", error)
    throw error
  }
}

// Función para crear instructor
async function crearInstructor(nombre: string): Promise<number> {
  if (nombre.toLowerCase().includes(" vs ") || nombre.toLowerCase().includes(" vs. ")) {
    throw new Error(`No se puede crear un instructor con "vs" en el nombre: ${nombre}`)
  }

  const capitalizedName = nombre
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  const nombreSinEspacios = nombre.replace(/\s+/g, "").toLowerCase()
  const cantidadLetras = nombreSinEspacios.length
  const simbolo = cantidadLetras % 2 === 0 ? "#" : "%"
  const patternPassword = `${nombreSinEspacios}${cantidadLetras}${simbolo}`
  const hashedPassword = await hash(patternPassword, 10)

  const nuevoInstructor = await prisma.instructor.create({
    data: {
      nombre: capitalizedName,
      password: hashedPassword,
      extrainfo: {
        estado: "ACTIVO",
        activo: true,
        especialidad: "",
        passwordTemporal: patternPassword,
      }
    }
  })

  console.log(`Instructor creado: ${capitalizedName}, ID: ${nuevoInstructor.id}`)
  return nuevoInstructor.id
}

// Función para procesar instructores (regular o VS)
async function procesarInstructores(row: DatosExcelClase, configuracion: ConfiguracionImportacion, instructoresCache: Record<string, number>): Promise<number[]> {
  const instructorIds: number[] = []

  console.log(`Procesando instructor: "${row.Instructor}"`)

  // Verificar si es instructor VS
  if (row.Instructor.toLowerCase().includes(" vs ") || row.Instructor.toLowerCase().includes(" vs. ")) {
    console.log(`Instructor VS detectado: "${row.Instructor}"`)
    const vsConfig = configuracion.instructoresVS.find(vs => vs.originalName === row.Instructor)
    
    if (vsConfig) {
      console.log(`Configuración VS encontrada:`, vsConfig)
      for (let i = 0; i < vsConfig.instructores.length; i++) {
        if (vsConfig.keepInstructores[i]) {
          const instructorName = vsConfig.instructores[i]
          console.log(`Buscando instructor VS: "${instructorName}"`)
          const instructorId = instructoresCache[instructorName.toLowerCase()]
          
          if (instructorId) {
            instructorIds.push(instructorId)
            console.log(`Instructor VS encontrado: "${instructorName}" (ID: ${instructorId})`)
          } else {
            console.error(`Instructor VS no encontrado: "${instructorName}"`)
            console.log("Instructores disponibles en caché:", Object.keys(instructoresCache))
            throw new Error(`Instructor no encontrado: ${instructorName}`)
          }
        }
      }
    } else {
      console.error(`Configuración VS no encontrada para: "${row.Instructor}"`)
      console.log("Configuraciones VS disponibles:", configuracion.instructoresVS.map(vs => vs.originalName))
      throw new Error(`Configuración VS no encontrada para: ${row.Instructor}`)
    }
  } else {
    // Instructor regular
    console.log(`Instructor regular: "${row.Instructor}"`)
    const instructorId = instructoresCache[row.Instructor.toLowerCase()]
    if (instructorId) {
      instructorIds.push(instructorId)
      console.log(`Instructor regular encontrado: "${row.Instructor}" (ID: ${instructorId})`)
    } else {
      console.error(`Instructor regular no encontrado: "${row.Instructor}"`)
      console.log("Instructores disponibles en caché:", Object.keys(instructoresCache))
      throw new Error(`Instructor no encontrado: ${row.Instructor}`)
    }
  }

  console.log(`Instructor IDs resultantes:`, instructorIds)
  return instructorIds
}

// Función para procesar fecha y hora
async function procesarFechaHora(dia: any, hora: any): Promise<Date | null> {
  let fecha: Date | null = null

  // Procesar fecha
  if (dia instanceof Date && !isNaN(dia.getTime())) {
    fecha = dia
  } else if (typeof dia === "string") {
    try {
      fecha = new Date(dia)
      if (isNaN(fecha.getTime())) {
        const parts = dia.split("/")
        if (parts.length === 3) {
          fecha = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
        }
      }
    } catch (error) {
      console.error(`Error al parsear fecha: ${dia}`, error)
      return null
    }
  }

  if (!fecha || isNaN(fecha.getTime())) {
    return null
  }

  // Procesar hora
  if (hora) {
    const horaStr = String(hora).trim()
    if (horaStr.includes(":")) {
      const [horasStr, minutosStr] = horaStr.split(":")
      const horas = Number.parseInt(horasStr, 10)
      const minutos = Number.parseInt(minutosStr, 10)

      if (!isNaN(horas) && !isNaN(minutos)) {
        fecha.setUTCHours(horas, minutos, 0, 0)
      }
    }
  }

  return fecha
}

// Función para mapear semana del Excel a semana del periodo
function mapearSemana(semanaExcel: number, mapeoSemanas: MapeoSemanas[]): number | null {
  const mapeo = mapeoSemanas.find(ms => ms.semanaExcel === semanaExcel)
  return mapeo ? mapeo.semanaPeriodo : null
}

// Función para crear clase regular
async function crearClaseRegular(row: DatosExcelClase, instructorId: number, disciplinaId: number, periodoId: number, semana: number, fecha: Date) {
  const claseData: any = {
    periodoId,
    disciplinaId,
    instructorId,
    pais: row.País || "México",
    ciudad: row.Ciudad || "Ciudad de México",
    estudio: row.Estudio || "",
    salon: row.Salon || "",
    fecha,
    reservasTotales: row["Reservas Totales"] || 0,
    listasEspera: row["Listas de Espera"] || 0,
    cortesias: row.Cortesias || 0,
    lugares: Number(row.Lugares || 0),
    reservasPagadas: row["Reservas Pagadas"] || 0,
    textoEspecial: row["Texto espcial"] || "",
    semana,
    esVersus: false
  }

  // Solo agregar ID si existe
  if (row.ID_clase) {
    claseData.id = String(row.ID_clase)
  }

  const nuevaClase = await prisma.clase.create({
    data: claseData
  })

  console.log(`Clase regular creada: ${nuevaClase.id}`)
}

// Función para crear clases VS (hasta 4 instructores)
async function crearClasesVS(row: DatosExcelClase, instructorIds: number[], disciplinaId: number, periodoId: number, semana: number, fecha: Date, configuracion: ConfiguracionImportacion) {
  const totalReservas = row["Reservas Totales"] || 0
  const totalLugares = Number(row.Lugares || 0)
  const totalReservasPagadas = row["Reservas Pagadas"] || 0

  // Dividir valores entre instructores
  const reservasPorInstructor = Math.ceil(totalReservas / instructorIds.length)
  const lugaresPorInstructor = Math.ceil(totalLugares / instructorIds.length)
  const reservasPagadasPorInstructor = Math.ceil(totalReservasPagadas / instructorIds.length)

  // Crear una clase para cada instructor
  for (let i = 0; i < instructorIds.length; i++) {
    const claseData: any = {
      periodoId,
      disciplinaId,
      instructorId: instructorIds[i],
      pais: row.País || "México",
      ciudad: row.Ciudad || "Ciudad de México",
      estudio: row.Estudio || "",
      salon: row.Salon || "",
      fecha,
      reservasTotales: reservasPorInstructor,
      listasEspera: row["Listas de Espera"] || 0,
      cortesias: row.Cortesias || 0,
      lugares: lugaresPorInstructor,
      reservasPagadas: reservasPagadasPorInstructor,
      textoEspecial: row["Texto espcial"] || "",
      semana,
      esVersus: true,
      vsNum: instructorIds.length
    }

    // Solo agregar ID si existe
    if (row.ID_clase) {
      claseData.id = `${String(row.ID_clase)}${String.fromCharCode(97 + i)}` // a, b, c, d
    }

    const nuevaClase = await prisma.clase.create({
      data: claseData
    })

    console.log(`Clase VS ${String.fromCharCode(97 + i)} creada: ${nuevaClase.id}`)
  }
} 