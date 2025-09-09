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

    // 3. PASO 3: ELIMINAR TODAS LAS CLASES EXISTENTES DEL PERIODO
    console.log("=== PASO 3: Eliminando todas las clases existentes del periodo ===")
    
    const clasesExistentes = await prisma.clase.findMany({
      where: {
        periodoId: configuracion.periodoId
      }
    })

    if (clasesExistentes.length > 0) {
      await prisma.clase.deleteMany({
        where: {
          periodoId: configuracion.periodoId
        }
      })
      console.log(`Se eliminaron ${clasesExistentes.length} clases existentes del periodo ${configuracion.periodoId}`)
    } else {
      console.log(`No se encontraron clases existentes en el periodo ${configuracion.periodoId}`)
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
        console.log(`Procesando clase: ${clase.instructor} - Día: ${clase.dia} - Hora: ${clase.hora}`)
        const fecha = await procesarFechaHora(clase.dia, clase.hora)
        if (!fecha) {
          throw new Error(`Fecha/hora inválida: ${clase.dia} ${clase.hora}`)
        }
        console.log(`Fecha procesada: ${fecha.toISOString()} para instructor: ${clase.instructor}`)

        // Crear la clase
        if (clase.esInstructorVS && clase.instructoresVS) {
          // Clase VS individual - crear una sola clase
          console.log(`Creando clase VS para instructor: ${clase.instructor}, instructores VS: ${clase.instructoresVS.join(', ')}, vsNum: ${clase.instructoresVS.length}`)
          await crearClaseRegular(clase, instructorId, disciplinaId, configuracion.periodoId, clase.semana, fecha)
          clasesCreadas++
        } else {
          // Clase regular
          console.log(`Creando clase regular para instructor: ${clase.instructor}`)
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

  console.log(`=== PROCESANDO FECHA Y HORA ===`)
  console.log(`Día recibido: ${dia} (tipo: ${typeof dia})`)
  console.log(`Hora recibida: ${hora} (tipo: ${typeof hora})`)

  // Procesar fecha
  if (dia instanceof Date && !isNaN(dia.getTime())) {
    fecha = new Date(dia) // Crear una nueva instancia para no modificar la original
    console.log(`Fecha es instancia de Date válida: ${fecha.toISOString()}`)
  } else if (typeof dia === "string") {
    try {
      // Intentar diferentes formatos de fecha
      fecha = new Date(dia)
      if (isNaN(fecha.getTime())) {
        // Formato DD/MM/YYYY
        const parts = dia.split("/")
        if (parts.length === 3) {
          fecha = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
          console.log(`Fecha parseada desde DD/MM/YYYY: ${fecha.toISOString()}`)
        } else {
          // Formato YYYY-MM-DD
          fecha = new Date(dia)
          console.log(`Fecha parseada desde YYYY-MM-DD: ${fecha.toISOString()}`)
        }
      } else {
        console.log(`Fecha parseada directamente: ${fecha.toISOString()}`)
      }
    } catch (error) {
      console.error(`Error al parsear fecha: ${dia}`, error)
      return null
    }
  }

  if (!fecha || isNaN(fecha.getTime())) {
    console.error(`Fecha inválida: ${dia}`)
    return null
  }

  // Procesar hora - asegurar que se incluya correctamente
  if (hora) {
    const horaStr = String(hora).trim()
    console.log(`Procesando hora: "${horaStr}" para fecha: ${fecha.toISOString()}`)
    
    if (horaStr.includes(":")) {
      // Formato HH:MM:SS a.m./p.m. (hora peruana) - "7:00:00 a. m. (hora peruana)"
      if (horaStr.includes("a. m.") || horaStr.includes("p. m.") || horaStr.includes("(hora peruana)")) {
        // Limpiar texto adicional y convertir a formato estándar
        let horaLimpia = horaStr
          .replace(/\s*\(hora peruana\)/g, "") // Remover "(hora peruana)"
          .replace(/\s*a\.\s*m\./g, " AM") // Normalizar "a. m." a "AM"
          .replace(/\s*p\.\s*m\./g, " PM") // Normalizar "p. m." a "PM"
          .replace(/\s+/g, " ") // Normalizar espacios múltiples
          .trim()
        
        console.log(`Hora limpia (formato peruano): "${horaLimpia}"`)
        
        // Extraer horas, minutos y periodo
        const match = horaLimpia.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})\s*(AM|PM)$/i)
        if (match) {
          let [_, horas, minutos, segundos, periodo] = match
          let horasNum = parseInt(horas)
          const minutosNum = parseInt(minutos)
          
          // Convertir a formato 24 horas
          if (periodo.toUpperCase() === 'PM' && horasNum !== 12) {
            horasNum += 12
          } else if (periodo.toUpperCase() === 'AM' && horasNum === 12) {
            horasNum = 0
          }
          
          fecha.setHours(horasNum, minutosNum, 0, 0)
          console.log(`Hora aplicada desde formato peruano: ${fecha.toISOString()} (${horasNum}:${minutosNum.toString().padStart(2, '0')})`)
        } else {
          // Fallback: intentar extraer solo horas y minutos
          const matchSimple = horaLimpia.match(/^(\d{1,2}):(\d{1,2})\s*(AM|PM)$/i)
          if (matchSimple) {
            let [_, horas, minutos, periodo] = matchSimple
            let horasNum = parseInt(horas)
            const minutosNum = parseInt(minutos)
            
            if (periodo.toUpperCase() === 'PM' && horasNum !== 12) {
              horasNum += 12
            } else if (periodo.toUpperCase() === 'AM' && horasNum === 12) {
              horasNum = 0
            }
            
            fecha.setHours(horasNum, minutosNum, 0, 0)
            console.log(`Hora aplicada (fallback peruano): ${fecha.toISOString()} (${horasNum}:${minutosNum.toString().padStart(2, '0')})`)
          }
        }
      } else {
        // Formato HH:MM estándar
        const [horasStr, minutosStr] = horaStr.split(":")
        const horas = Number.parseInt(horasStr, 10)
        const minutos = Number.parseInt(minutosStr, 10)

        if (!isNaN(horas) && !isNaN(minutos) && horas >= 0 && horas <= 23 && minutos >= 0 && minutos <= 59) {
          // Usar setHours en lugar de setUTCHours para evitar problemas de zona horaria
          fecha.setHours(horas, minutos, 0, 0)
          console.log(`Hora aplicada estándar: ${fecha.toISOString()} (${horas}:${minutos.toString().padStart(2, '0')})`)
        } else {
          console.warn(`Hora inválida: ${horas}:${minutos}`)
        }
      }
    } else if (horaStr.match(/^\d{1,2}$/)) {
      // Solo horas (ej: "14" para 2:00 PM)
      const horas = Number.parseInt(horaStr, 10)
      if (horas >= 0 && horas <= 23) {
        fecha.setHours(horas, 0, 0, 0)
        console.log(`Hora aplicada solo horas: ${fecha.toISOString()} (${horas}:00)`)
      }
    } else if (horaStr.match(/^\d{1,2}:\d{2}\s*(AM|PM)$/i)) {
      // Formato 12 horas (ej: "2:30 PM")
      const match = horaStr.match(/^(\d{1,2}):(\d{1,2})\s*(AM|PM)$/i)
      if (match) {
        let [_, horas, minutos, periodo] = match
        let horasNum = parseInt(horas)
        const minutosNum = parseInt(minutos)
        
        if (periodo.toUpperCase() === 'PM' && horasNum !== 12) {
          horasNum += 12
        } else if (periodo.toUpperCase() === 'AM' && horasNum === 12) {
          horasNum = 0
        }
        
        fecha.setHours(horasNum, minutosNum, 0, 0)
        console.log(`Hora aplicada desde formato 12h: ${fecha.toISOString()} (${horasNum}:${minutosNum.toString().padStart(2, '0')})`)
      }
    } else {
      console.warn(`Formato de hora no reconocido: ${horaStr}`)
    }
  } else {
    // Si no hay hora, establecer una hora por defecto (ej: 12:00 PM)
    fecha.setHours(12, 0, 0, 0)
    console.log(`Hora por defecto aplicada: ${fecha.toISOString()} (12:00)`)
  }

  console.log(`=== FECHA FINAL PROCESADA ===`)
  console.log(`ISO String: ${fecha.toISOString()}`)
  console.log(`Locale String: ${fecha.toLocaleString('es-MX')}`)
  console.log(`Timestamp: ${fecha.getTime()}`)
  
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
      vsNum: clase.esInstructorVS && clase.instructoresVS ? clase.instructoresVS.length : null,
      pais: "Perú",
      ciudad: "Lima"
    }
  })
} 