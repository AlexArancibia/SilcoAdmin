import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import type { PagoInstructor, Instructor, Periodo } from "@/types/schema"
import { dmSansBase64 } from "./dm-sans64"
import { retencionValor } from "./const"

/**
 * Genera un PDF con el reporte de múltiples pagos
 */
export const generatePagosPDF = (
  pagos: PagoInstructor[],
  instructores: Instructor[],
  periodos: Periodo[],
  filtros: {
    estado?: string
    instructor?: string
    periodos?: string
  } = {},
): jsPDF => {
  // Inicialización del documento
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12 // Margen reducido para maximizar el espacio
  const headerHeight = 40

  // Ancho máximo disponible para todas las tablas
  const tableWidth = pageWidth - margin * 2

  // Registrar la fuente DM Sans
  doc.addFileToVFS("dm-sans.ttf", dmSansBase64)
  doc.addFont("dm-sans.ttf", "DMSans", "normal")
  doc.setFont("DMSans")

  // Paleta de colores
  const primaryDark: [number, number, number] = [30, 41, 59]
  const secondaryDark: [number, number, number] = [15, 23, 42]
  const accentColor: [number, number, number] = [236, 72, 153]
  const textLight: [number, number, number] = [226, 232, 240]
  const lightBg: [number, number, number] = [241, 245, 249]
  const borderColor: [number, number, number] = [150, 150, 150]
  const successColor: [number, number, number] = [21, 128, 61]
  const errorColor: [number, number, number] = [185, 28, 28]

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

  // ===== 1. ENCABEZADO DEL DOCUMENTO =====
  doc.setFillColor(primaryDark[0], primaryDark[1], primaryDark[2])
  doc.rect(0, 0, pageWidth, headerHeight, "F")

  // Título principal
  doc.setTextColor(textLight[0], textLight[1], textLight[2])
  doc.setFontSize(16)
  doc.text("REPORTE DE PAGOS", margin, 20)

  // Detalles del reporte
  doc.setFontSize(9)
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-PE")}`, pageWidth - margin, 16, { align: "right" })
  doc.text(`Total registros: ${pagos.length}`, pageWidth - margin, 24, { align: "right" })
  doc.text(
    `Generado: ${new Date().toLocaleDateString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    pageWidth - margin,
    32,
    { align: "right" },
  )

  // ===== 2. INFORMACIÓN DE FILTROS =====
  let currentY = headerHeight + 10

  // Fondo para la sección de filtros
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2])
  doc.rect(margin, currentY - 5, tableWidth, 20, "F")
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.2)
  doc.rect(margin, currentY - 5, tableWidth, 20, "S")

  // Texto de filtros
  doc.setTextColor(secondaryDark[0], secondaryDark[1], secondaryDark[2])
  doc.setFontSize(9)

  let filtrosTexto = "Filtros aplicados: "
  if (filtros.estado && filtros.estado !== "todos") filtrosTexto += `Estado: ${filtros.estado}, `
  if (filtros.instructor && filtros.instructor !== "todos") {
    const instructor = instructores.find((i) => i.id === Number.parseInt(filtros.instructor!))
    if (instructor) filtrosTexto += `Instructor: ${instructor.nombre}, `
  }
  if (filtros.periodos) filtrosTexto += `Periodos: ${filtros.periodos}`

  if (filtrosTexto === "Filtros aplicados: ") filtrosTexto += "Ninguno"

  doc.text(filtrosTexto, margin + 5, currentY + 5)

  currentY += 20

  // ===== 3. RESUMEN POR PERIODO Y TOTAL =====

  // Título de sección
  doc.setTextColor(secondaryDark[0], secondaryDark[1], secondaryDark[2])
  doc.setFontSize(11)
  doc.text("RESUMEN POR PERIODO", margin, currentY)
  currentY += 8

  // Filtrar periodos según los seleccionados en filtros
  const periodosFiltrados = filtros.periodos
    ? periodos.filter((p) => filtros.periodos?.includes(p.id.toString()))
    : periodos

  // Agrupar pagos por periodo filtrado
  const pagosPorPeriodo = periodosFiltrados.map((periodo) => {
    const pagosPeriodo = pagos.filter((p) => p.periodoId === periodo.id)
    const montoTotal = pagosPeriodo.reduce((sum, p) => sum + p.monto, 0)
    const retencionTotal = pagosPeriodo.reduce((sum, p) => sum + (p.monto * p.retencion) / 100, 0)
    const finalTotal = pagosPeriodo.reduce((sum, p) => {
      const retencionMonto = (p.monto * p.retencion) / 100
      const reajusteMonto = p.tipoReajuste === "PORCENTAJE" ? (p.monto * p.reajuste) / 100 : p.reajuste
      return sum + (p.monto - retencionMonto + reajusteMonto)
    }, 0)

    return {
      periodo: `${periodo.numero}-${periodo.año}`,
      cantidad: pagosPeriodo.length,
      monto: montoTotal,
      retencion: retencionTotal,
      final: finalTotal,
    }
  })

  // Totales generales
  const totalGeneral = {
    cantidad: pagosPorPeriodo.reduce((sum, p) => sum + p.cantidad, 0),
    monto: pagosPorPeriodo.reduce((sum, p) => sum + p.monto, 0),
    retencion: pagosPorPeriodo.reduce((sum, p) => sum + p.retencion, 0),
    final: pagosPorPeriodo.reduce((sum, p) => sum + p.final, 0),
  }

  // Preparar datos para la tabla
  const tableData = [
    ...pagosPorPeriodo.map((p) => [
      p.periodo,
      p.cantidad.toString(),
      formatCurrency(p.monto),
      formatCurrency(p.retencion),
      formatCurrency(p.final),
    ]),
    [
      "TOTAL GENERAL",
      totalGeneral.cantidad.toString(),
      formatCurrency(totalGeneral.monto),
      formatCurrency(totalGeneral.retencion),
      formatCurrency(totalGeneral.final),
    ],
  ]

  // Tabla de resumen por periodo
  autoTable(doc, {
    startY: currentY,
    head: [["Periodo", "Pagos", "Monto Base", "Retención", "Total"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: primaryDark,
      textColor: textLight,
      fontSize: 9,
      cellPadding: 4,
      lineWidth: 0,
      halign: "center",
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      lineColor: borderColor,
      lineWidth: 0.2,
      textColor: secondaryDark,
    },
    columnStyles: {
      0: { cellWidth: tableWidth * 0.25 }, // 25% del ancho total
      1: { cellWidth: tableWidth * 0.15, halign: "center" }, // 15% del ancho total
      2: { cellWidth: tableWidth * 0.2, halign: "right" }, // 20% del ancho total
      3: { cellWidth: tableWidth * 0.2, halign: "right" }, // 20% del ancho total
      4: { cellWidth: tableWidth * 0.2, halign: "right" }, // 20% del ancho total
    },
    margin: { left: margin, right: margin },
    tableWidth: tableWidth,
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      // Resaltar fila de total general
      if (data.section === "body" && data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = "bold"
        data.cell.styles.fillColor = lightBg
      }

      // Alinear a la derecha los encabezados de montos
      if (data.section === "head" && (data.column.index === 2 || data.column.index === 3 || data.column.index === 4)) {
        data.cell.styles.halign = "right"
      }
    },
  })

  // ===== 4. DETALLE DE PAGOS =====
  currentY = (doc as any).lastAutoTable.finalY + 15

  // Título de sección
  doc.setFontSize(11)
  doc.setTextColor(secondaryDark[0], secondaryDark[1], secondaryDark[2])
  doc.text("DETALLE DE PAGOS", margin, currentY)
  currentY += 8

  // Preparar datos para la tabla de detalle
  const detalleData = pagos
    .filter((p) => !filtros.periodos || filtros.periodos.includes(p.periodoId.toString()))
    .map((pago) => {
      const instructor = instructores.find((i) => i.id === pago.instructorId)
      const periodo = periodos.find((p) => p.id === pago.periodoId)
      const retencionMonto = (pago.monto * retencionValor) 
      const reajusteMonto = pago.tipoReajuste === "PORCENTAJE" ? (pago.monto * pago.reajuste) / 100 : pago.reajuste
      const montoFinal = pago.monto - retencionMonto + reajusteMonto

      return [
        instructor ? instructor.nombre : `ID ${pago.instructorId}`,
        periodo ? `${periodo.numero}-${periodo.año}` : `ID ${pago.periodoId}`,
        formatCurrency(pago.monto),
        pago.tipoReajuste === "PORCENTAJE" ? `${pago.reajuste}%` : formatCurrency(pago.reajuste),
        formatCurrency(retencionMonto),
        formatCurrency(montoFinal),
        pago.estado,
      ]
    })

  // Tabla de detalle de pagos
  autoTable(doc, {
    startY: currentY,
    head: [["Instructor", "Periodo", "Base", "Reajuste", "Retención", "Total", "Estado"]],
    body: detalleData,
    theme: "grid",
    headStyles: {
      fillColor: primaryDark,
      textColor: textLight,
      fontSize: 9,
      cellPadding: 4,
      lineWidth: 0,
      halign: "center",
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: borderColor,
      lineWidth: 0.2,
      textColor: secondaryDark,
      overflow: "linebreak",
    },
    columnStyles: {
      0: { cellWidth: tableWidth * 0.22 }, // 22% del ancho total
      1: { cellWidth: tableWidth * 0.13 }, // 13% del ancho total
      2: { cellWidth: tableWidth * 0.13, halign: "right" }, // 13% del ancho total
      3: { cellWidth: tableWidth * 0.13, halign: "right" }, // 13% del ancho total
      4: { cellWidth: tableWidth * 0.13, halign: "right" }, // 13% del ancho total
      5: { cellWidth: tableWidth * 0.13, halign: "right" }, // 13% del ancho total
      6: { cellWidth: tableWidth * 0.13, halign: "center" }, // 13% del ancho total
    },
    margin: { left: margin, right: margin },
    tableWidth: tableWidth,
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      // Alinear a la derecha los encabezados de montos
      if (data.section === "head" && data.column.index >= 2 && data.column.index <= 5) {
        data.cell.styles.halign = "right"
      }

      // Colorear el estado según su valor
      if (data.section === "body" && data.column.index === 6) {
        const estado = data.cell.text[0]
        if (estado === "APROBADO") {
          data.cell.styles.textColor = successColor
          data.cell.styles.fontStyle = "bold"
        } else if (estado === "RECHAZADO") {
          data.cell.styles.textColor = errorColor
          data.cell.styles.fontStyle = "bold"
        }
      }
    },
  })

  // ===== 5. PIE DE PÁGINA =====
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Línea decorativa sutil
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2])
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)

    // Texto del pie
    doc.setFontSize(7)
    doc.setTextColor(borderColor[0], borderColor[1], borderColor[2])
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

    // Logo o marca de agua
    doc.text("SISTEMA DE PAGOS", pageWidth - margin, pageHeight - 6, { align: "right" })
  }

  return doc
}

/**
 * Descarga un PDF con el reporte de pagos
 */
export const downloadPagosPDF = (
  pagos: PagoInstructor[],
  instructores: Instructor[],
  periodos: Periodo[],
  filtros: {
    estado?: string
    instructor?: string
    periodos?: string
  } = {},
): void => {
  try {
    const doc = generatePagosPDF(pagos, instructores, periodos, filtros)
    const fileName = `Reporte_Pagos_${new Date().toISOString().split("T")[0]}.pdf`
    doc.save(fileName)
  } catch (error) {
    console.error("Error al generar el PDF:", error)
    alert("Ocurrió un error al generar el PDF. Por favor, inténtelo de nuevo.")
  }
}

/**
 * Abre una ventana de impresión con el reporte de pagos
 */
export const printPagosPDF = (
  pagos: PagoInstructor[],
  instructores: Instructor[],
  periodos: Periodo[],
  filtros: {
    estado?: string
    instructor?: string
    periodos?: string
  } = {},
): void => {
  try {
    const doc = generatePagosPDF(pagos, instructores, periodos, filtros)
    doc.autoPrint({ variant: "non-conform" })

    const blobUrl = doc.output("bloburl")
    window.open(blobUrl, "_blank")
  } catch (error) {
    console.error("Error al imprimir el PDF:", error)
    alert("No se pudo abrir la ventana de impresión. Se intentará descargar el documento.")

    try {
      downloadPagosPDF(pagos, instructores, periodos, filtros)
    } catch (downloadError) {
      console.error("Error al descargar el PDF:", downloadError)
      alert("Ocurrió un error al generar el PDF. Por favor, inténtelo de nuevo.")
    }
  }
}
