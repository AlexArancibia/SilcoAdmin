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
      cellText: false,
      cellNF: false,
      cellStyles: false
    }

    // Convertir a JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, options)
    console.log("Datos raw del Excel:", JSON.stringify(rawData.slice(0, 2), null, 2))
    
    // Verificar las columnas del Excel
    if (rawData.length > 0) {
      const primeraFila = rawData[0] as any
      console.log("📋 Columnas detectadas en Excel:", Object.keys(primeraFila))
      console.log("📊 Valores de la primera fila:", primeraFila)
      
      // Verificar si hay columnas con valores de fecha por defecto de Excel
      const columnas = Object.keys(primeraFila)
      for (const col of columnas) {
        const valor = primeraFila[col]
        if (valor === "1900-01-01" || valor === "1900-01-01T00:00:00.000Z") {
          console.log(`⚠️ Columna "${col}" tiene valor por defecto de Excel: ${valor}`)
        }
      }
    }
    
    const processedData = preprocessExcelData(rawData)
    console.log("Datos procesados:", JSON.stringify(processedData.slice(0, 2), null, 2))

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

// Función para verificar que las columnas Día y Hora existan
function verifyRequiredColumns(data: any[]): boolean {
  if (data.length === 0) return false
  
  const primeraFila = data[0]
  const columnas = Object.keys(primeraFila)
  
  console.log("🔍 Verificando columnas requeridas...")
  console.log("Columnas disponibles:", columnas)
  
  const tieneDia = columnas.includes('Día')
  const tieneHora = columnas.includes('Hora')
  
  if (!tieneDia) {
    console.log("❌ Columna 'Día' no encontrada")
    return false
  }
  
  if (!tieneHora) {
    console.log("❌ Columna 'Hora' no encontrada")
    return false
  }
  
  console.log("✅ Columnas 'Día' y 'Hora' encontradas correctamente")
  return true
}

// Función para preprocesar los datos del Excel
function preprocessExcelData(data: any[]): DatosExcelClase[] {
  // Verificar que las columnas requeridas existan
  if (!verifyRequiredColumns(data)) {
    throw new Error("El archivo Excel debe contener las columnas 'Día' y 'Hora'")
  }
  
  let processedData = data.filter((row: any) => {
    const hasCriticalData = row.Instructor && row.Disciplina && row.Día
    return hasCriticalData
  })

  processedData = processedData.map((row, index) => {
    console.log(`\n--- Procesando fila ${index + 1} ---`)
    console.log("Row original:", row)
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

    // Procesar fecha - manejar diferentes formatos
    if (processedRow.Día) {
      if (typeof processedRow.Día === 'string') {
        // Limpiar la fecha si tiene caracteres extra
        const fechaLimpia = processedRow.Día.toString().trim()
        console.log(`Procesando fecha original: "${fechaLimpia}"`)
        
        // Intentar parsear la fecha
        const fechaParsed = new Date(fechaLimpia)
        
        // Verificar si la fecha es válida
        if (!isNaN(fechaParsed.getTime())) {
          processedRow.Día = fechaParsed
          console.log(`Fecha parseada exitosamente: ${fechaParsed.toISOString()}`)
        } else {
          console.log(`Error al parsear fecha: "${fechaLimpia}"`)
          // Si no se puede parsear, mantener como string
          processedRow.Día = fechaLimpia
        }
      }
    }

    // Verificar si hay problema con fecha y hora separadas
    // Si la fecha es "1900-01-01" (fecha por defecto de Excel) y hay hora válida,
    // probablemente la fecha real está en otro campo
    if (processedRow.Día && processedRow.Hora) {
      if (processedRow.Día instanceof Date && processedRow.Día.getFullYear() === 1900) {
        console.log("⚠️ Detectada fecha por defecto de Excel (1900-01-01), revisando otros campos...")
        // Buscar en otros campos que puedan contener la fecha real
        const camposPosibles = ['Fecha', 'Date', 'Dia', 'Día', 'Fecha y Hora']
        for (const campo of camposPosibles) {
          if (processedRow[campo] && processedRow[campo] !== processedRow.Día) {
            console.log(`Encontrado campo alternativo "${campo}":`, processedRow[campo])
            // Intentar usar este campo como fecha
            const fechaAlternativa = new Date(processedRow[campo])
            if (!isNaN(fechaAlternativa.getTime()) && fechaAlternativa.getFullYear() > 1900) {
              console.log(`✅ Usando fecha alternativa: ${fechaAlternativa.toISOString()}`)
              processedRow.Día = fechaAlternativa
              break
            }
          }
        }
      }
    }

    // Procesar hora - asegurar formato consistente
    if (processedRow.Hora) {
      let horaStr = processedRow.Hora.toString().trim()
      
      console.log(`Procesando hora original: "${horaStr}"`)
      
      // Verificar si Excel interpretó la hora como fecha (formato 1900-01-01)
      if (horaStr === "1900-01-01" || horaStr === "1900-01-01T00:00:00.000Z") {
        console.log(`⚠️ Excel interpretó la hora como fecha: "${horaStr}"`)
        console.log(`🔍 Esto puede indicar un problema en el formato de la columna Hora del Excel`)
        console.log(`💡 Asegúrate de que la columna Hora tenga formato de hora, no de fecha`)
        
        // Usar hora por defecto y continuar
        processedRow.Hora = "12:00"
        horaStr = "12:00"
      }
      
      // Normalizar diferentes formatos de hora
      if (horaStr.includes(":")) {
        // Formato HH:MM:SS a.m./p.m. (hora peruana) - "6:00:00 a. m."
        if (horaStr.includes("a. m.") || horaStr.includes("p. m.") || horaStr.includes("(hora peruana)")) {
          console.log(`🕐 Procesando hora en formato peruano: "${horaStr}"`)
          
          // Limpiar texto adicional y convertir a formato estándar
          let horaLimpia = horaStr
            .replace(/\s*\(hora peruana\)/g, "") // Remover "(hora peruana)"
            .replace(/\s*a\.\s*m\./g, " AM") // Normalizar "a. m." a "AM"
            .replace(/\s*p\.\s*m\./g, " PM") // Normalizar "p. m." a "PM"
            .replace(/\s+/g, " ") // Normalizar espacios múltiples
            .trim()
          
          console.log(`Hora limpia: "${horaLimpia}"`)
          
          // Extraer horas, minutos y periodo
          const match = horaLimpia.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})\s*(AM|PM)$/i)
          if (match) {
            let [_, horas, minutos, segundos, periodo] = match
            let horasNum = parseInt(horas)
            const minutosNum = parseInt(minutos)
            
            console.log(`📊 Valores extraídos: ${horasNum}:${minutosNum} ${periodo}`)
            
            // Convertir a formato 24 horas CORRECTAMENTE
            if (periodo.toUpperCase() === 'PM' && horasNum !== 12) {
              horasNum += 12
              console.log(`🔄 PM: ${horasNum - 12} → ${horasNum} (formato 24h)`)
            } else if (periodo.toUpperCase() === 'AM' && horasNum === 12) {
              horasNum = 0
              console.log(`🔄 AM 12:00 → 00:00 (formato 24h)`)
            } else {
              console.log(`✅ AM: ${horasNum}:${minutosNum} (ya en formato 24h)`)
            }
            
            processedRow.Hora = `${horasNum.toString().padStart(2, '0')}:${minutosNum.toString().padStart(2, '0')}`
            console.log(`✅ Hora convertida: "${processedRow.Hora}"`)
          } else {
            // Fallback: intentar extraer solo horas y minutos
            const matchSimple = horaLimpia.match(/^(\d{1,2}):(\d{1,2})\s*(AM|PM)$/i)
            if (matchSimple) {
              let [_, horas, minutos, periodo] = matchSimple
              let horasNum = parseInt(horas)
              const minutosNum = parseInt(minutos)
              
              console.log(`📊 Valores extraídos (fallback): ${horasNum}:${minutosNum} ${periodo}`)
              
              if (periodo.toUpperCase() === 'PM' && horasNum !== 12) {
                horasNum += 12
                console.log(`🔄 PM: ${horasNum - 12} → ${horasNum} (formato 24h)`)
              } else if (periodo.toUpperCase() === 'AM' && horasNum === 12) {
                horasNum = 0
                console.log(`🔄 AM 12:00 → 00:00 (formato 24h)`)
              } else {
                console.log(`✅ AM: ${horasNum}:${minutosNum} (ya en formato 24h)`)
              }
              
              processedRow.Hora = `${horasNum.toString().padStart(2, '0')}:${minutosNum.toString().padStart(2, '0')}`
              console.log(`✅ Hora convertida (fallback): "${processedRow.Hora}"`)
            }
          }
        } else {
          // Formato HH:MM o H:MM estándar
          const [horas, minutos] = horaStr.split(":")
          const horasNum = parseInt(horas)
          const minutosNum = parseInt(minutos)
          
          if (!isNaN(horasNum) && !isNaN(minutosNum)) {
            // Formatear como HH:MM
            processedRow.Hora = `${horasNum.toString().padStart(2, '0')}:${minutosNum.toString().padStart(2, '0')}`
            console.log(`Hora formateada estándar: "${processedRow.Hora}"`)
          }
        }
      } else if (horaStr.match(/^\d{1,2}$/)) {
        // Solo horas (ej: "14" para 2:00 PM)
        const horasNum = parseInt(horaStr)
        if (horasNum >= 0 && horasNum <= 23) {
          processedRow.Hora = `${horasNum.toString().padStart(2, '0')}:00`
          console.log(`Hora solo horas: "${processedRow.Hora}"`)
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
          
          processedRow.Hora = `${horasNum.toString().padStart(2, '0')}:${minutosNum.toString().padStart(2, '0')}`
          console.log(`Hora convertida formato 12h: "${processedRow.Hora}"`)
        }
      }
      
      console.log(`Hora final procesada: "${processedRow.Hora}"`)
    }

    // COMBINAR FECHA Y HORA EN UN SOLO CAMPO ISO
    if (processedRow.Día && processedRow.Hora) {
      try {
        // Verificar si la hora es válida (no debe ser "1900-01-01")
        if (processedRow.Hora === "1900-01-01" || processedRow.Hora === "1900-01-01T00:00:00.000Z") {
          console.log(`⚠️ Hora inválida detectada: "${processedRow.Hora}", saltando combinación`)
          return
        }

        console.log(`🔄 Combinando fecha y hora:`)
        console.log(`   Fecha: ${processedRow.Día}`)
        console.log(`   Hora: ${processedRow.Hora}`)

        let fechaBase: Date
        
        // Si Día es un string, intentar parsearlo
        if (typeof processedRow.Día === 'string') {
          // Manejar formato americano 7/14/25
          if (processedRow.Día.includes('/')) {
            const [mes, dia, año] = processedRow.Día.split('/')
            // Convertir año de 2 dígitos a 4 dígitos
            const añoCompleto = parseInt(año) < 50 ? 2000 + parseInt(año) : 1900 + parseInt(año)
            fechaBase = new Date(añoCompleto, parseInt(mes) - 1, parseInt(dia))
            console.log(`📅 Fecha parseada desde formato americano: ${fechaBase.toISOString()}`)
          } else {
            fechaBase = new Date(processedRow.Día)
            console.log(`📅 Fecha parseada desde string: ${fechaBase.toISOString()}`)
          }
        } else if (processedRow.Día instanceof Date) {
          fechaBase = new Date(processedRow.Día)
          console.log(`📅 Fecha ya es Date: ${fechaBase.toISOString()}`)
        } else {
          throw new Error('Formato de fecha no válido')
        }

        // Verificar que la fecha sea válida
        if (isNaN(fechaBase.getTime())) {
          throw new Error('Fecha inválida')
        }

        // Verificar que la hora tenga formato válido (debe contener ":")
        if (!processedRow.Hora.includes(':')) {
          console.log(`⚠️ Formato de hora inválido: "${processedRow.Hora}", saltando combinación`)
          return
        }

        // Extraer hora y minutos de la hora procesada
        const [horas, minutos] = processedRow.Hora.split(':').map(Number)
        
        console.log(`⏰ Hora extraída: ${horas}:${minutos}`)
        
        // Verificar que las horas y minutos sean números válidos
        if (isNaN(horas) || isNaN(minutos) || horas < 0 || horas > 23 || minutos < 0 || minutos > 59) {
          console.log(`⚠️ Valores de hora/minutos inválidos: ${horas}:${minutos}, saltando combinación`)
          return
        }
        
        // Crear fecha completa con hora
        const fechaCompleta = new Date(fechaBase)
        fechaCompleta.setHours(horas, minutos, 0, 0)
        
        console.log(`📅 Fecha base: ${fechaBase.toISOString()}`)
        console.log(`⏰ Hora a aplicar: ${horas}:${minutos}`)
        console.log(`📅 Fecha resultante: ${fechaCompleta.toISOString()}`)
        
        // Verificar que la fecha resultante sea válida
        if (isNaN(fechaCompleta.getTime())) {
          throw new Error('Fecha resultante inválida')
        }
        
        // Convertir a ISO string
        const fechaISO = fechaCompleta.toISOString()
        
        console.log(`✅ Fecha y hora combinadas exitosamente:`)
        console.log(`   Fecha original: ${processedRow.Día}`)
        console.log(`   Hora original: ${processedRow.Hora}`)
        console.log(`   Resultado ISO: ${fechaISO}`)
        
        // Guardar la fecha ISO en el campo Día
        processedRow.Día = fechaISO
        
        // Marcar que la hora está incluida en la fecha ISO
        processedRow.Hora = "Incluida en fecha"
        
      } catch (error) {
        console.error(`❌ Error al combinar fecha y hora:`, error)
        // Mantener los campos separados si hay error
      }
    }

    // Procesar semana
    if (processedRow.Semana) {
      processedRow.Semana = parseInt(processedRow.Semana) || 1
    } else {
      processedRow.Semana = 1
    }

    console.log("Row procesada:", {
      Día: processedRow.Día,
      Hora: processedRow.Hora,
      Semana: processedRow.Semana
    })
    console.log("--- Fin fila ---\n")

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
          dia: typeof row.Día === 'string' && row.Día.includes('T') ? row.Día : (row.Día instanceof Date ? row.Día.toISOString() : String(row.Día)),
          hora: row.Hora || "", // Hora vacía si ya está combinada con la fecha
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
      dia: typeof row.Día === 'string' && row.Día.includes('T') ? row.Día : (row.Día instanceof Date ? row.Día.toISOString() : String(row.Día)),
      hora: row.Hora || "", // Hora vacía si ya está combinada con la fecha
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
