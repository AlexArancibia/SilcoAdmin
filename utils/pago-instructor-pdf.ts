import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import type { PagoInstructor, Instructor, Periodo, Clase, Disciplina } from "@/types/schema"
import { dmSansBase64 } from "./dm-sans64"

/**
 * Genera un PDF con el comprobante de pago de un instructor
 */
export const generatePagoPDF = (
  pago: PagoInstructor,
  instructor: Instructor,
  periodo: Periodo,
  clases: Clase[],
  disciplinas: Disciplina[],
): jsPDF => {
  // Inicialización del documento
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12 // Reducido aún más para maximizar el ancho de las tablas
  const headerHeight = 28

  // Ancho máximo disponible para todas las tablas
  const tableWidth = pageWidth - margin * 2

  // Registrar la fuente DM Sans
  doc.addFileToVFS("dm-sans.ttf", dmSansBase64)
  doc.addFont("dm-sans.ttf", "DMSans", "normal")
  doc.setFont("DMSans")

  // Paleta de colores (RGB) - Colores claros
  const primaryColor: [number, number, number] = [71, 142, 124] // Color principal (164 29% 39%)
  const textColor: [number, number, number] = [60, 60, 60] // Texto principal
  const lightTextColor: [number, number, number] = [120, 120, 120] // Texto secundario
  const borderColor: [number, number, number] = [200, 200, 200] // Bordes
  const successColor: [number, number, number] = [92, 184, 92] // Verde claro
  const errorColor: [number, number, number] = [217, 83, 79] // Rojo claro

  /**
   * Formatea un valor numérico como moneda (PEN)
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  /**
   * Formatea una fecha en formato corto (DD/MM/YY)
   */
  const formatDate = (date: Date | string): string => {
    const dateObj = new Date(date)
    return dateObj.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })
  }

  /**
   * Formatea una hora en formato (HH:MM AM/PM) con +5 horas
   */
  const formatTime = (date: Date | string): string => {
    const dateObj = new Date(date)
    // Añadir 5 horas
    dateObj.setHours(dateObj.getHours() + 5)

    return dateObj.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  // Estadísticas del instructor
  const instructorDisciplines = disciplinas.filter((d) => instructor.disciplinas?.some((id) => id.id === d.id))
  const totalClasses = clases.length
  const totalSpots = clases.reduce((sum, c) => sum + c.lugares, 0)
  const totalBooked = clases.reduce((sum, c) => sum + c.reservasPagadas, 0)
  const occupancyRate = totalSpots > 0 ? (totalBooked / totalSpots) * 100 : 0

  // Cálculos de montos (según el código original)
  const retencionMonto = (pago.monto * pago.retencion) / 100
  const reajusteMonto = pago.tipoReajuste === "PORCENTAJE" ? (pago.monto * pago.reajuste) / 100 : pago.reajuste
  const montoFinal = pago.pagoFinal || pago.monto - retencionMonto + reajusteMonto

  // ===== 1. ENCABEZADO DEL DOCUMENTO =====

  // Línea superior
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setLineWidth(0.7)
  doc.line(margin, 8, pageWidth - margin, 8)

  // Título del documento
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setFontSize(14)
  doc.text("COMPROBANTE DE PAGO", margin, 16)

  // Información del periodo y número
  doc.setTextColor(textColor[0], textColor[1], textColor[2])
  doc.setFontSize(9)
  doc.text(`Período: ${periodo.numero} - ${periodo.año}`, margin, 24)
  doc.text(`N° ${pago.id.toString().padStart(6, "0")}`, pageWidth - margin, 16, { align: "right" })
  doc.text(`Fecha: ${formatDate(pago.createdAt || new Date())}`, pageWidth - margin, 24, { align: "right" })

  // Estado del pago
  const estadoColor = pago.estado === "APROBADO" ? successColor : errorColor
  doc.setTextColor(estadoColor[0], estadoColor[1], estadoColor[2])
  doc.setFontSize(9)
  doc.text(`Estado: ${pago.estado}`, pageWidth - margin, 32, { align: "right" })
  doc.setTextColor(textColor[0], textColor[1], textColor[2])

  // Línea inferior
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2])
  doc.setLineWidth(0.5)
  doc.line(margin, headerHeight + 8, pageWidth - margin, headerHeight + 8)

  // ===== 2. INFORMACIÓN DEL INSTRUCTOR =====

  let currentY = headerHeight + 16

  // Título de sección
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setFontSize(11)
  doc.text("INFORMACIÓN DEL INSTRUCTOR", margin, currentY)
  currentY += 8

  // Tabla simple para información del instructor
  autoTable(doc, {
    startY: currentY,
    body: [
      [
        { content: "Nombre:", styles: { fontStyle: "bold" } },
        { content: instructor.nombre, colSpan: 3 },
      ],
      [
        { content: "Disciplinas:", styles: { fontStyle: "bold" } },
        { content: instructorDisciplines.map((d) => d.nombre).join(", "), colSpan: 3 },
      ],
      [
        { content: "Clases:", styles: { fontStyle: "bold" } },
        { content: totalClasses.toString() },
        { content: "Asistencia:", styles: { fontStyle: "bold" } },
        { content: `${totalBooked}/${totalSpots} (${occupancyRate.toFixed(1)}%)` },
      ],
    ],
    theme: "plain",
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: borderColor,
      lineWidth: 0.1,
      textColor: textColor,
    },
    columnStyles: {
      0: { cellWidth: tableWidth * 0.15 }, // 15% del ancho total
      1: { cellWidth: tableWidth * 0.35 }, // 35% del ancho total
      2: { cellWidth: tableWidth * 0.15 }, // 15% del ancho total
      3: { cellWidth: tableWidth * 0.35 }, // 35% del ancho total
    },
    margin: { left: margin, right: margin },
    tableWidth: tableWidth,
  })

  currentY = (doc as any).lastAutoTable.finalY + 10

  // ===== 3. PAGO POR DISCIPLINA CON ESTADÍSTICAS (MOVIDO ANTES DEL RESUMEN) =====

  if (clases.length > 0) {
    // Agrupar clases por disciplina
    const clasesPorDisciplina: Record<
      string,
      {
        disciplina: Disciplina | undefined
        clases: Clase[]
        totalMonto: number
      }
    > = {}

    clases.forEach((clase) => {
      const disciplina = disciplinas.find((d) => d.id === clase.disciplinaId)
      const disciplinaId = disciplina?.id || "sin-disciplina"

      if (!clasesPorDisciplina[disciplinaId]) {
        clasesPorDisciplina[disciplinaId] = {
          disciplina,
          clases: [],
          totalMonto: 0,
        }
      }

      const montoClase = pago.detalles?.clases?.find((d: any) => d.claseId === clase.id)?.montoCalculado || 0
      clasesPorDisciplina[disciplinaId].clases.push(clase)
      clasesPorDisciplina[disciplinaId].totalMonto += montoClase
    })

    // Título de sección
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFontSize(11)
    doc.text("PAGO POR DISCIPLINA", margin, currentY)
    currentY += 8

    // Tabla de resumen por disciplina
    autoTable(doc, {
      startY: currentY,
      head: [["DISCIPLINA", "CLASES", "ASISTENCIA", "OCUPACIÓN", "MONTO"]],
      body: Object.values(clasesPorDisciplina).map(({ disciplina, clases, totalMonto }) => {
        const totalLugares = clases.reduce((sum, c) => sum + c.lugares, 0)
        const totalReservas = clases.reduce((sum, c) => sum + c.reservasPagadas, 0)
        const ocupacion = totalLugares > 0 ? (totalReservas / totalLugares) * 100 : 0

        return [
          disciplina?.nombre || "Sin disciplina asignada",
          clases.length.toString(),
          `${totalReservas}/${totalLugares}`,
          `${ocupacion.toFixed(1)}%`,
          formatCurrency(totalMonto),
        ]
      }),
      foot: [["", "", "", "Monto Base:", formatCurrency(pago.monto)]],
      theme: "grid",
      headStyles: {
        fillColor: [245, 245, 245],
        textColor: textColor,
        lineColor: borderColor,
        fontSize: 9,
        cellPadding: 4,
        lineWidth: 0.2,
        halign: "center",
      },
      footStyles: {
        fillColor: [245, 245, 245],
        textColor: primaryColor,
        fontStyle: "bold",
        fontSize: 9,
        halign: "right",
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        lineColor: borderColor,
        lineWidth: 0.2,
        textColor: textColor,
      },
      columnStyles: {
        0: { cellWidth: tableWidth * 0.4 }, // 40% del ancho total
        1: { cellWidth: tableWidth * 0.1, halign: "center" }, // 10% del ancho total
        2: { cellWidth: tableWidth * 0.15, halign: "center" }, // 15% del ancho total
        3: { cellWidth: tableWidth * 0.15, halign: "center" }, // 15% del ancho total
        4: { cellWidth: tableWidth * 0.2, halign: "right" }, // 20% del ancho total
      },
      margin: { left: margin, right: margin },
      tableWidth: tableWidth,
      didParseCell: (data) => {
        // Alinear a la derecha el encabezado de MONTO
        if (data.section === "head" && data.column.index === 4) {
          data.cell.styles.halign = "right"
        }
      },
    })

    currentY = (doc as any).lastAutoTable.finalY + 10
  }

  // ===== 4. RESUMEN DE PAGO (MOVIDO DESPUÉS DEL PAGO POR DISCIPLINA) =====

  // Título de sección
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setFontSize(11)
  doc.text("RESUMEN DE PAGO", margin, currentY)
  currentY += 8

  autoTable(doc, {
    startY: currentY,
    head: [["CONCEPTO", "DETALLE", "MONTO"]],
    body: [
      ["Monto Base", "Por clases impartidas", formatCurrency(pago.monto)],
      ["Retención", `Aplicada (${pago.retencion}%)`, `-${formatCurrency(retencionMonto)}`],
      [
        "Reajuste",
        pago.tipoReajuste === "PORCENTAJE" ? `${pago.reajuste}%` : "Monto fijo",
        formatCurrency(reajusteMonto),
      ],
      ["TOTAL A PAGAR", "", formatCurrency(montoFinal)],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: textColor,
      lineColor: borderColor,
      fontSize: 9,
      cellPadding: 4,
      lineWidth: 0.2,
      halign: "center",
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      lineColor: borderColor,
      lineWidth: 0.2,
      textColor: textColor,
    },
    columnStyles: {
      0: { cellWidth: tableWidth * 0.3, fontStyle: "bold" }, // 30% del ancho total
      1: { cellWidth: tableWidth * 0.45 }, // 45% del ancho total
      2: { cellWidth: tableWidth * 0.25, halign: "right" }, // 25% del ancho total
    },
    margin: { left: margin, right: margin },
    tableWidth: tableWidth,
    didParseCell: (data) => {
      // Alinear a la derecha el encabezado de MONTO
      if (data.section === "head" && data.column.index === 2) {
        data.cell.styles.halign = "right"
      }

      // Aplicar negrita y color al total
      if (data.section === "body" && data.row.index === 3) {
        if (data.column.index === 0 || data.column.index === 2) {
          data.cell.styles.fontStyle = "bold"
          data.cell.styles.textColor = primaryColor
        }
      }
    },
  })

  currentY = (doc as any).lastAutoTable.finalY + 10

  // ===== 5. DETALLE DE CLASES POR DISCIPLINA =====

  if (clases.length > 0) {
    // Título de sección
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFontSize(11)
    // doc.text("DETALLE DE CLASES POR DISCIPLINA", margin, currentY)
    currentY += 8

    // Crear tablas para cada disciplina - cada una en una página nueva
    const clasesPorDisciplina: Record<
      string,
      {
        disciplina: Disciplina | undefined
        clases: Clase[]
      }
    > = {}

    clases.forEach((clase) => {
      const disciplina = disciplinas.find((d) => d.id === clase.disciplinaId)
      const disciplinaId = disciplina?.id || "sin-disciplina"

      if (!clasesPorDisciplina[disciplinaId]) {
        clasesPorDisciplina[disciplinaId] = {
          disciplina,
          clases: [],
        }
      }

      clasesPorDisciplina[disciplinaId].clases.push(clase)
    })

    // Siempre comenzar en una nueva página para el detalle de clases
    doc.addPage()
    currentY = 15

    Object.entries(clasesPorDisciplina).forEach(([disciplinaId, { disciplina, clases }], index) => {
      // Cada disciplina en una página nueva, excepto la primera que ya está en una página nueva
      if (index > 0) {
        doc.addPage()
        currentY = 15
      }

      // Nombre de la disciplina como título de página
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.setFontSize(12)
      doc.text(disciplina?.nombre || "Sin disciplina asignada", margin, currentY)

      // Línea bajo el nombre
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.setLineWidth(0.5)
      doc.line(margin, currentY + 3, pageWidth - margin, currentY + 3)

      currentY += 10

      // Tabla de clases para esta disciplina con fecha y hora separadas
      autoTable(doc, {
        startY: currentY,
        head: [["FECHA", "HORA", "ESTUDIO", "ASISTENCIA", "MONTO"]],
        body: clases.map((clase) => {
          const montoClase = pago.detalles?.clases?.find((d: any) => d.claseId === clase.id)?.montoCalculado || 0
          return [
            formatDate(clase.fecha),
            formatTime(clase.fecha),
            clase.estudio,
            `${clase.reservasPagadas}/${clase.lugares}`,
            formatCurrency(montoClase),
          ]
        }),
        theme: "grid",
        headStyles: {
          fillColor: [245, 245, 245],
          textColor: textColor,
          lineColor: borderColor,
          fontSize: 9,
          cellPadding: 3,
          lineWidth: 0.2,
          halign: "center",
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          lineColor: borderColor,
          lineWidth: 0.2,
          textColor: textColor,
        },
        columnStyles: {
          0: { cellWidth: tableWidth * 0.12, halign: "center" }, // 12% del ancho total
          1: { cellWidth: tableWidth * 0.12, halign: "center" }, // 12% del ancho total
          2: { cellWidth: tableWidth * 0.46 }, // 46% del ancho total
          3: { cellWidth: tableWidth * 0.12, halign: "center" }, // 12% del ancho total
          4: { cellWidth: tableWidth * 0.18, halign: "right" }, // 18% del ancho total
        },
        margin: { left: margin, right: margin },
        tableWidth: tableWidth,
        didParseCell: (data) => {
          // Alinear a la derecha el encabezado de MONTO
          if (data.section === "head" && data.column.index === 4) {
            data.cell.styles.halign = "right"
          }
        },
      })

      // Calcular el total para esta disciplina
      const totalDisciplina = clases.reduce((sum, clase) => {
        const montoClase = pago.detalles?.clases?.find((d: any) => d.claseId === clase.id)?.montoCalculado || 0
        return sum + montoClase
      }, 0)

      // Agregar un pie de tabla con el total de la disciplina
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY,
        body: [["", "", "", "Total Disciplina:", formatCurrency(totalDisciplina)]],
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: borderColor,
          lineWidth: 0.2,
          textColor: primaryColor,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: tableWidth * 0.12 }, // 12% del ancho total
          1: { cellWidth: tableWidth * 0.12 }, // 12% del ancho total
          2: { cellWidth: tableWidth * 0.46 }, // 46% del ancho total
          3: { cellWidth: tableWidth * 0.12, halign: "right" }, // 12% del ancho total
          4: { cellWidth: tableWidth * 0.18, halign: "right" }, // 18% del ancho total
        },
        margin: { left: margin, right: margin },
        tableWidth: tableWidth,
      })

      currentY = (doc as any).lastAutoTable.finalY
    })
  }

  // ===== PIE DE PÁGINA =====

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Línea decorativa sutil
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2])
    doc.setLineWidth(0.5)
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)

    // Texto del pie
    doc.setFontSize(7)
    doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2])
    doc.text(
      `Generado el ${new Date().toLocaleDateString("es-PE", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })} • Página ${i} de ${pageCount}`,
      margin,
      pageHeight - 6,
    )

    // Logo o marca de agua (sutil)
    doc.text("SISTEMA DE PAGOS", pageWidth - margin, pageHeight - 6, { align: "right" })
  }

  return doc
}

/**
 * Descarga un PDF con el comprobante de pago
 */
export const downloadPagoPDF = (
  pago: PagoInstructor,
  instructor: Instructor,
  periodo: Periodo,
  clases: Clase[],
  disciplinas: Disciplina[],
): void => {
  try {
    const doc = generatePagoPDF(pago, instructor, periodo, clases, disciplinas)
    const fileName = `Pago_${instructor.nombre.replace(/\s+/g, "_")}_${periodo.numero}-${periodo.año}.pdf`
    doc.save(fileName)
  } catch (error) {
    console.error("Error al generar el PDF:", error)
    alert("Ocurrió un error al generar el PDF. Por favor, inténtelo de nuevo.")
  }
}

/**
 * Abre una ventana de impresión con el comprobante de pago
 */
export const printPagoPDF = (
  pago: PagoInstructor,
  instructor: Instructor,
  periodo: Periodo,
  clases: Clase[],
  disciplinas: Disciplina[],
): void => {
  try {
    const doc = generatePagoPDF(pago, instructor, periodo, clases, disciplinas)
    doc.autoPrint({ variant: "non-conform" })

    const blobUrl = doc.output("bloburl")
    window.open(blobUrl, "_blank")
  } catch (error) {
    console.error("Error al imprimir el PDF:", error)
    alert("No se pudo abrir la ventana de impresión. Se intentará descargar el documento.")

    try {
      downloadPagoPDF(pago, instructor, periodo, clases, disciplinas)
    } catch (downloadError) {
      console.error("Error al descargar el PDF:", downloadError)
      alert("Ocurrió un error al generar el PDF. Por favor, inténtelo de nuevo.")
    }
  }
}
