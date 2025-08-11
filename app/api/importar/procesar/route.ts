import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { 
  ConfiguracionFinalImportacion,
  ResultadoImportacion,
  ErrorImportacion
} from "@/types/importacion"

export async function POST(request: NextRequest) {
  try {
    console.log("=== INICIANDO PROCESAMIENTO DE IMPORTACIÓN ===")
    
    const formData = await request.formData()
    const configuracionJson = formData.get("configuracion") as string

    if (!configuracionJson) {
      return NextResponse.json(
        { error: "Configuración es requerida" },
        { status: 400 }
      )
    }

    console.log("Configuración recibida:", configuracionJson.substring(0, 200) + "...")

    const configuracion: ConfiguracionFinalImportacion = JSON.parse(configuracionJson)

    // Validar configuración
    if (!configuracion.periodoId) {
      return NextResponse.json(
        { error: "ID del periodo es requerido" },
        { status: 400 }
      )
    }

    console.log("Periodo ID:", configuracion.periodoId)
    console.log("Total de clases:", configuracion.clases.length)

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

    // Procesar la importación
    console.log("Iniciando procesamiento de importación...")
    const resultado = await procesarImportacion(configuracion)

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

// Función principal para procesar la importación
async function procesarImportacion(configuracion: ConfiguracionFinalImportacion): Promise<ResultadoImportacion> {
  const errores: ErrorImportacion[] = []
  let clasesCreadas = 0
  let instructoresCreados = 0
  let pagosCreados = 0
  let asignacionesCreadas = 0

  try {
    console.log("=== INICIANDO PROCESAMIENTO DE IMPORTACIÓN ===")
    console.log("Total de clases a procesar:", configuracion.clases.length)

    // 1. PASO 1: CREAR INSTRUCTORES FALTANTES
    console.log("=== PASO 1: Creando instructores faltantes ===")
    const instructoresCache: Record<string, number> = {}
    
    // Obtener instructores existentes
    const instructoresExistentes = await prisma.instructor.findMany({
      include: {
        disciplinas: true
      }
    })

    // Llenar caché con instructores existentes
    instructoresExistentes.forEach((instructor) => {
      instructoresCache[instructor.nombre.toLowerCase()] = instructor.id
    })

    // Crear instructores faltantes automáticamente
    for (const clase of configuracion.clases) {
      if (!clase.eliminada) {
        const instructorNombre = clase.instructor
        if (!instructoresCache[instructorNombre.toLowerCase()]) {
          try {
            const instructorId = await crearInstructor(instructorNombre)
            instructoresCache[instructorNombre.toLowerCase()] = instructorId
            instructoresCreados++
            console.log(`Instructor creado: ${instructorNombre} (ID: ${instructorId})`)
          } catch (error) {
            console.error(`Error al crear instructor ${instructorNombre}:`, error)
            errores.push({
              fila: clase.filaOriginal,
              mensaje: `Error al crear instructor "${instructorNombre}": ${error instanceof Error ? error.message : "Error desconocido"}`
            })
          }
        }
      }
    }

    // 2. PASO 2: OBTENER DISCIPLINAS
    console.log("=== PASO 2: Obteniendo disciplinas ===")
    const disciplinas = await prisma.disciplina.findMany({
      where: { activo: true }
    })

    const disciplinasCache: Record<string, number> = {}
    disciplinas.forEach((disciplina) => {
      disciplinasCache[disciplina.nombre.toLowerCase()] = disciplina.id
    })

    // 3. PASO 3: ELIMINAR CLASES EXISTENTES PARA LAS SEMANAS A IMPORTAR
    console.log("=== PASO 3: Eliminando clases existentes ===")
    const semanasAImportar = [...new Set(configuracion.clases.map(c => c.semana))]
    
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
      console.log(`Se eliminaron ${clasesExistentes.length} clases existentes`)
    }

    // 4. PASO 4: CREAR CLASES
    console.log("=== PASO 4: Creando clases ===")
    for (const clase of configuracion.clases) {
      if (clase.eliminada) continue

      try {
        const instructorId = instructoresCache[clase.instructor.toLowerCase()]
        if (!instructorId) {
          throw new Error(`Instructor no encontrado: ${clase.instructor}`)
        }

        const disciplinaId = disciplinasCache[clase.disciplina.toLowerCase()]
        if (!disciplinaId) {
          throw new Error(`Disciplina no encontrada: ${clase.disciplina}`)
        }

        // Procesar fecha y hora
        const fecha = await procesarFechaHora(clase.dia, clase.hora)
        if (!fecha) {
          throw new Error(`Fecha/hora inválida: ${clase.dia} ${clase.hora}`)
        }

        // Crear la clase
        if (clase.esInstructorVS && clase.instructoresVS) {
          // Clase VS individual - crear una sola clase
          await crearClaseRegular(clase, instructorId, disciplinaId, configuracion.periodoId, clase.semana, fecha)
          clasesCreadas++
        } else {
          // Clase regular
          await crearClaseRegular(clase, instructorId, disciplinaId, configuracion.periodoId, clase.semana, fecha)
          clasesCreadas++
        }

        console.log(`Clase creada exitosamente para instructor: ${clase.instructor}`)
      } catch (error) {
        console.error(`Error al crear clase para instructor ${clase.instructor}:`, error)
        errores.push({
          fila: clase.filaOriginal,
          mensaje: `Error al crear clase: ${error instanceof Error ? error.message : "Error desconocido"}`
        })
      }
    }

    console.log(`Total de clases creadas: ${clasesCreadas}`)
    console.log(`Total de instructores creados: ${instructoresCreados}`)

    return {
      totalRegistros: configuracion.clases.length,
      registrosImportados: clasesCreadas,
      registrosConError: errores.length,
      errores,
      clasesCreadas,
      instructoresCreados,
      pagosCreados,
      asignacionesCreadas
    }

  } catch (error) {
    console.error("Error en procesarImportacion:", error)
    throw error
  }
}

// Función para crear instructor
async function crearInstructor(nombre: string): Promise<number> {
  console.log(`Creando instructor: ${nombre}`)
  
  const instructor = await prisma.instructor.create({
    data: {
      nombre: nombre,
      password: "",
      extrainfo: {
        estado: "ACTIVO",
        activo: true,
        fechaCreacion: new Date().toISOString()
      }
    }
  })

  console.log(`Instructor creado exitosamente: ${nombre} (ID: ${instructor.id})`)
  return instructor.id
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

// Función para crear clase regular
async function crearClaseRegular(clase: any, instructorId: number, disciplinaId: number, periodoId: number, semana: number, fecha: Date) {
  return await prisma.clase.create({
    data: {
      id: clase.id || `clase-${periodoId}-${semana}-${instructorId}-${Date.now()}`,
      instructorId,
      disciplinaId,
      periodoId,
      semana,
      fecha,
      salon: clase.salon || "",
      estudio: clase.estudio || "",
      reservasTotales: clase.reservasTotales || 0,
      listasEspera: clase.listasEspera || 0,
      cortesias: clase.cortesias || 0,
      lugares: clase.lugares || 0,
      reservasPagadas: clase.reservasPagadas || 0,
      esVersus: clase.esInstructorVS,
      pais: "México",
      ciudad: "Ciudad de México"
    }
  })
} 