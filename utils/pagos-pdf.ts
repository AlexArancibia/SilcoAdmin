import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { PagoInstructor, Instructor, Periodo } from "@/types/schema";
import { dmSansBase64 } from "./dm-sans64";

export const generatePagosPDF = (
  pagos: PagoInstructor[],
  instructores: Instructor[],
  periodos: Periodo[],
  filtros: {
    estado?: string;
    instructor?: string;
    periodos?: string;
  } = {},
): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const headerHeight = 40;

  // Registrar la fuente DM Sans
  doc.addFileToVFS("dm-sans.ttf", dmSansBase64);
  doc.addFont("dm-sans.ttf", "DMSans", "normal");
  doc.setFont("DMSans");

  // Paleta de colores
  const primaryDark: [number, number, number] = [30, 41, 59];
  const secondaryDark: [number, number, number] = [15, 23, 42];
  const accentColor: [number, number, number] = [236, 72, 153];
  const textLight: [number, number, number] = [226, 232, 240];
  const lightBg: [number, number, number] = [241, 245, 249];
  const borderColor: [number, number, number] = [150, 150, 150];
  const successColor: [number, number, number] = [21, 128, 61];
  const errorColor: [number, number, number] = [185, 28, 28];

  // Función para formatear moneda
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // --- Encabezado ---
  doc.setFillColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.rect(0, 0, pageWidth, headerHeight, "F");
  
  // Texto principal
  doc.setTextColor(textLight[0], textLight[1], textLight[2]);
  doc.setFontSize(16);
  doc.text("REPORTE DE PAGOS", margin, 20);
  
  // Detalles
  doc.setFontSize(8);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, pageWidth - margin, 20, { align: "right" });
  doc.text(`Total registros: ${pagos.length}`, pageWidth - margin, 25, { align: "right" });
  doc.text(`Generado: ${new Date().toLocaleDateString('es-PE', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - margin, 30, { align: "right" });

  // --- Información de filtros ---
  let currentY = headerHeight + 10;
  const maxWidth = pageWidth - margin * 2;
  
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(margin - 5, currentY - 5, maxWidth + 10, 20, "F");
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.2);
  doc.rect(margin - 5, currentY - 5, maxWidth + 10, 20, "S");
  
  doc.setTextColor(secondaryDark[0], secondaryDark[1], secondaryDark[2]);
  doc.setFontSize(9);
  
  // Texto de filtros
  let filtrosTexto = "Filtros aplicados: ";
  if (filtros.estado && filtros.estado !== "todos") filtrosTexto += `Estado: ${filtros.estado}, `;
  if (filtros.instructor && filtros.instructor !== "todos") {
    const instructor = instructores.find((i) => i.id === Number.parseInt(filtros.instructor!));
    if (instructor) filtrosTexto += `Instructor: ${instructor.nombre}, `;
  }
  if (filtros.periodos) filtrosTexto += `Periodos: ${filtros.periodos}`;

  if (filtrosTexto === "Filtros aplicados: ") filtrosTexto += "Ninguno";

  doc.text(filtrosTexto, margin, currentY);
  
  currentY += 20;

  // --- Resumen por periodo y total ---
  // Filtrar periodos según los seleccionados en filtros
  const periodosFiltrados = filtros.periodos 
    ? periodos.filter(p => filtros.periodos?.includes(p.id.toString()))
    : periodos;

  // Agrupar pagos por periodo filtrado
  const pagosPorPeriodo = periodosFiltrados.map(periodo => {
    const pagosPeriodo = pagos.filter(p => p.periodoId === periodo.id);
    const montoTotal = pagosPeriodo.reduce((sum, p) => sum + p.monto, 0);
    const retencionTotal = pagosPeriodo.reduce((sum, p) => sum + p.retencion, 0);
    const finalTotal = pagosPeriodo.reduce((sum, p) => {
      const reajuste = p.tipoReajuste === "PORCENTAJE" ? (p.monto * p.reajuste) / 100 : p.reajuste;
      return sum + (p.monto - p.retencion + reajuste);
    }, 0);

    return {
      periodo: `${periodo.numero}-${periodo.año}`,
      cantidad: pagosPeriodo.length,
      monto: montoTotal,
      retencion: retencionTotal,
      final: finalTotal
    };
  });

  // Totales generales
  const totalGeneral = {
    cantidad: pagosPorPeriodo.reduce((sum, p) => sum + p.cantidad, 0),
    monto: pagosPorPeriodo.reduce((sum, p) => sum + p.monto, 0),
    retencion: pagosPorPeriodo.reduce((sum, p) => sum + p.retencion, 0),
    final: pagosPorPeriodo.reduce((sum, p) => sum + p.final, 0)
  };

  // Preparar datos para la tabla con más ancho
  const tableData = [
    ...pagosPorPeriodo.map(p => [
      p.periodo,
      p.cantidad.toString(),
      formatCurrency(p.monto),
      formatCurrency(p.retencion),
      formatCurrency(p.final)
    ]),
    [
      "TOTAL GENERAL",
      totalGeneral.cantidad.toString(),
      formatCurrency(totalGeneral.monto),
      formatCurrency(totalGeneral.retencion),
      formatCurrency(totalGeneral.final)
    ]
  ];

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
    },
    styles: { 
      fontSize: 9,
      cellPadding: 4,
      lineColor: borderColor,
      lineWidth: 0.2,
      textColor: secondaryDark,
    },
    columnStyles: { 
      0: { cellWidth: 40 },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 40, halign: "right" },
      3: { cellWidth: 40, halign: "right" },
      4: { cellWidth: 40, halign: "right" }
    },
    margin: { left: margin - 5, right: margin - 5 },
    tableWidth: maxWidth + 10,
    alternateRowStyles: { 
      fillColor: [248, 250, 252],
      font: "DMSans"
    },
    // didDrawCell: (data) => {
    //   // Resaltar fila de total general
    //   if (data.row.index === tableData.length - 1) {
    //     doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    //     doc.rect(
    //       data.cell.x,
    //       data.cell.y,
    //       data.cell.width,
    //       data.cell.height,
    //       "F"
    //     );
    //     doc.setTextColor(secondaryDark[0], secondaryDark[1], secondaryDark[2]);
    //     doc.setFont("DMSans");
    //     doc.text(data.cell.text[0], data.cell.x + 3, data.cell.y + 10);
    //   }
    // }
  });

  // --- Detalle de pagos ---
  currentY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setTextColor(...secondaryDark);
  doc.setFont("DMSans");
  doc.text("DETALLE DE PAGOS", margin, currentY);
  

  
  currentY += 8;

  const detalleData = pagos
    .filter(p => !filtros.periodos || filtros.periodos.includes(p.periodoId.toString()))
    .map((pago) => {
      const instructor = instructores.find((i) => i.id === pago.instructorId);
      const periodo = periodos.find((p) => p.id === pago.periodoId);
      const reajusteCalculado = pago.tipoReajuste === "PORCENTAJE" ? (pago.monto * pago.reajuste) / 100 : pago.reajuste;
      const montoFinal = pago.monto - pago.retencion + reajusteCalculado;

      return [
        instructor ? instructor.nombre : `ID ${pago.instructorId}`,
        periodo ? `${periodo.numero}-${periodo.año}` : `ID ${pago.periodoId}`,
        formatCurrency(pago.monto),
        pago.tipoReajuste === "PORCENTAJE" ? `${pago.reajuste}%` : formatCurrency(pago.reajuste),
        formatCurrency(pago.retencion),
        formatCurrency(montoFinal),
        pago.estado,
      ];
    });

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
      0: { cellWidth: 30, font: "DMSans" },
      1: { cellWidth: 25, font: "DMSans" },
      2: { cellWidth: 25, halign: "right", font: "DMSans" },
      3: { cellWidth: 25, halign: "right", font: "DMSans" },
      4: { cellWidth: 25, halign: "right", font: "DMSans" },
      5: { cellWidth: 25, halign: "right", font: "DMSans" },
      6: { 
        cellWidth: 30, 
        halign: "center",
        font: "DMSans",
      }
    },
    margin: { left: margin - 5, right: margin - 5 },
    tableWidth: maxWidth + 10,
    alternateRowStyles: { 
      fillColor: [248, 250, 252],
      font: "DMSans"
    }
  });

  // --- Pie de página ---
  currentY = (doc as any).lastAutoTable.finalY + 10;
  
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // doc.setDrawColor(...borderColor);
    // doc.setLineWidth(0.3);
    // doc.line(
    //   margin,
    //   doc.internal.pageSize.getHeight() - 15,
    //   pageWidth - margin,
    //   doc.internal.pageSize.getHeight() - 15
    // );
    
    doc.setFontSize(7);
    doc.setTextColor(...borderColor);
    doc.setFont("DMSans");
    doc.text(
      `Generado el ${new Date().toLocaleDateString('es-PE', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })} • Página ${i} de ${pageCount}`, 
      margin, doc.internal.pageSize.getHeight() - 8
    );
  }

  return doc;
};

export const downloadPagosPDF = (
  pagos: PagoInstructor[],
  instructores: Instructor[],
  periodos: Periodo[],
  filtros: {
    estado?: string;
    instructor?: string;
    periodos?: string;
  } = {},
): void => {
  const doc = generatePagosPDF(pagos, instructores, periodos, filtros);
  const fileName = `Reporte_Pagos_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const printPagosPDF = (
  pagos: PagoInstructor[],
  instructores: Instructor[],
  periodos: Periodo[],
  filtros: {
    estado?: string;
    instructor?: string;
    periodos?: string;
  } = {},
): void => {
  const doc = generatePagosPDF(pagos, instructores, periodos, filtros);
  doc.autoPrint({ variant: 'non-conform' });
  
  try {
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } catch (e) {
    alert('No se pudo abrir la ventana de impresión. Se descargará el documento.');
    downloadPagosPDF(pagos, instructores, periodos, filtros);
  }
};