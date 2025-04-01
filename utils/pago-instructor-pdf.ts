import { jsPDF } from "jspdf"; 
import autoTable from "jspdf-autotable";
import type { PagoInstructor, Instructor, Periodo, Clase, Disciplina } from "@/types/schema";
import { dmSansBase64 } from "./dm-sans64";

export const generatePagoPDF = (
  pago: PagoInstructor,
  instructor: Instructor,
  periodo: Periodo,
  clases: Clase[],
  disciplinas: Disciplina[],
): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const headerHeight = 40;

  // Registrar la fuente DM Sans
  doc.addFileToVFS("dm-sans.ttf", dmSansBase64);
  doc.addFont("dm-sans.ttf", "DMSans", "normal");
  doc.setFont("DMSans");

  // Paleta de colores como tuplas fijas de 3 elementos
  const primaryDark: [number, number, number] = [30, 41, 59];
  const secondaryDark: [number, number, number] = [15, 23, 42];
  const accentColor: [number, number, number] = [60, 188, 153];
  const textLight: [number, number, number] = [226, 232, 240];
  const lightBg: [number, number, number] = [241, 245, 249];
  const borderColor: [number, number, number] = [150, 150, 150];
  const successColor: [number, number, number] = [21, 128, 61];
  const errorColor: [number, number, number] = [185, 28, 28];

  // Formato de moneda
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate instructor statistics
  const instructorDisciplines = disciplinas.filter(d => 
    instructor.disciplinas?.some(id => id.id === d.id)
  );
  const totalClasses = clases.length;
  const totalSpots = clases.reduce((sum, c) => sum + c.lugares, 0);
  const totalBooked = clases.reduce((sum, c) => sum + c.reservasPagadas, 0);
  const occupancyRate = totalSpots > 0 ? (totalBooked / totalSpots) * 100 : 0;

  // --- Encabezado ---
  doc.setFillColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.rect(0, 0, pageWidth, headerHeight, "F");
  
  // Logo or title
  doc.setTextColor(textLight[0], textLight[1], textLight[2]);
  doc.setFontSize(16);
  doc.text("COMPROBANTE DE PAGO", margin, 20);
  
  // Detalles de la factura
  doc.setFontSize(8);
  doc.text(`N° ${pago.id.toString().padStart(6, '0')}`, pageWidth - margin, 15, { align: "right" });
  doc.text(`Fecha: ${new Date(pago.createdAt || new Date()).toLocaleDateString('es-PE')}`, pageWidth - margin, 20, { align: "right" });
  doc.text(`Período: ${periodo.numero} - ${periodo.año}`, pageWidth - margin, 25, { align: "right" });
  doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, pageWidth - margin, 30, { align: "right" });

  // --- Información del instructor ---
  let currentY = headerHeight + 10;
  
  // Calculate maximum width for all sections
  const maxWidth = pageWidth - margin * 2+2;
  
  // Slimmer instructor section
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(margin  , currentY - 5, maxWidth  , 20, "F");
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.2);
  doc.rect(margin  , currentY - 5, maxWidth  , 20, "S");
  
  doc.setTextColor(secondaryDark[0], secondaryDark[1], secondaryDark[2]);
  doc.setFontSize(9);
  
  // Instructor info in two columns
  const instructorInfo = [
    `Nombre: ${instructor.nombre}`,
    `Disciplinas: ${instructorDisciplines.map(d => d.nombre).join(', ')}`,
    `Clases: ${totalClasses}`
  ];
  
  const statusInfo = [
    `Estado:`,
    pago.estado,
    `Ocupación: ${occupancyRate.toFixed(1)}%`
  ];
  
  // First column
  instructorInfo.forEach((info, i) => {
    doc.text(info, margin+5, currentY + (i * 4));
  });
  
  // Second column with status
  doc.setTextColor(secondaryDark[0], secondaryDark[1], secondaryDark[2]);
  statusInfo.forEach((info, i) => {
    if (i === 1) {
      const estadoColor = pago.estado === "APROBADO" ? successColor : errorColor;
      doc.setTextColor(estadoColor[0], estadoColor[1], estadoColor[2]);
      doc.text(info, margin + 90, currentY + (i * 4));
      doc.setTextColor(secondaryDark[0], secondaryDark[1], secondaryDark[2]);
    } else {
      doc.text(info, margin + 90, currentY + (i * 4));
    }
  });
  
  currentY += 20;

  // --- Resumen de pago ---
  const montoFinal = pago.pagoFinal || 
    (pago.monto - pago.retencion + 
     (pago.tipoReajuste === "PORCENTAJE" ? (pago.monto * pago.reajuste) / 100 : pago.reajuste));

  autoTable(doc, {
    startY: currentY,
    head: [["CONCEPTO", "DETALLE", "MONTO"]],
    body: [
      ["Monto Base", "Por clases impartidas", formatCurrency(pago.monto)],
      ["Retención", `Aplicada (${pago.retencion}%)`, `-${formatCurrency((pago.monto * pago.retencion) / 100)}`],
      ["Reajuste", 
       pago.tipoReajuste === "PORCENTAJE" ? `${pago.reajuste}%` : "Monto fijo", 
       pago.tipoReajuste === "PORCENTAJE" ? `${pago.reajuste}%` : formatCurrency(pago.reajuste)],
      ["TOTAL A PAGAR", "", formatCurrency(montoFinal)],
    ],
    theme: "plain",
    headStyles: { 
      fillColor: secondaryDark,
      textColor: textLight,
      lineColor: borderColor,
      fontSize: 8,
      cellPadding: 3,
      lineWidth: 0.2
    },
    styles: { 
      fontSize: 8,
      cellPadding: 3,
      lineColor: borderColor,
      lineWidth: 0.2,
      textColor: secondaryDark
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 80 },
      2: { cellWidth: 40, halign: "right" }
    },
    margin: { left: margin, right: margin },
    tableWidth: maxWidth,
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 2 && data.row.index === 3) {
        doc.setDrawColor(...accentColor);
        doc.setLineWidth(0.5);
        doc.rect(
          data.cell.x + 1,
          data.cell.y + 1,
          data.cell.width - 2,
          data.cell.height - 2,
          "S"
        );
      }
    }
  });

  // --- Clases impartidas ---
  if (clases.length > 0) {
    currentY = (doc as any).lastAutoTable.finalY + 8;
    
    // Título de sección
    doc.setFontSize(10);
    doc.setTextColor(...secondaryDark);
    doc.text("DETALLE DE CLASES IMPARTIDAS", margin, currentY);
    
    // Línea decorativa
 
    
    currentY += 6;
    
    autoTable(doc, {
      startY: currentY,
      head: [["FECHA", "DISCIPLINA", "ESTUDIO", "ASISTENCIA", "MONTO"]],
      body: clases.map((clase) => {
        const disciplina = disciplinas.find((d) => d.id === clase.disciplinaId);
        return [
          new Date(clase.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' }),
          disciplina?.nombre || `Disciplina ${clase.disciplinaId}`,
          clase.estudio,
          `${clase.reservasPagadas}/${clase.lugares}`,
          formatCurrency(pago.detalles?.clases?.find((d: any) => d.claseId === clase.id)?.montoCalculado || 0),
        ];
      }),
      theme: "grid",
      headStyles: { 
        fillColor: primaryDark, 
        textColor: textLight, 
        lineColor: borderColor,
        fontSize: 8,
        cellPadding: 3,
        lineWidth: 0.2
      },
      styles: { 
        fontSize: 7,
        cellPadding: 2,
        lineColor: borderColor,
        lineWidth: 0.2,
        textColor: secondaryDark,
        overflow: "linebreak"
      },
      columnStyles: { 
        0: { cellWidth: 25 },
        1: { cellWidth: 45 },
        2: { cellWidth: 45 },
        3: { cellWidth: 35, halign: "center" },
        4: { cellWidth: 30, halign: "right" }
      },
      margin: { left: margin, right: margin },
      tableWidth: maxWidth,
      alternateRowStyles: { 
        fillColor: [248, 250, 252] 
      }
    });
  }

  // --- Pie de página ---
  currentY = (doc as any).lastAutoTable.finalY + 10;
  
  // Pie de página
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Línea decorativa
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.3);
    doc.line(
      margin,
      doc.internal.pageSize.getHeight() - 15,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 15
    );
    
    // Texto del pie
    doc.setFontSize(7);
    doc.setTextColor(...borderColor);
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

export const downloadPagoPDF = (
  pago: PagoInstructor,
  instructor: Instructor,
  periodo: Periodo,
  clases: Clase[],
  disciplinas: Disciplina[],
): void => {
  const doc = generatePagoPDF(pago, instructor, periodo, clases, disciplinas);
  const fileName = `Pago_${instructor.nombre.replace(/\s+/g, "_")}_${periodo.numero}-${periodo.año}.pdf`;
  doc.save(fileName);
};

export const printPagoPDF = (
  pago: PagoInstructor,
  instructor: Instructor,
  periodo: Periodo,
  clases: Clase[],
  disciplinas: Disciplina[],
): void => {
  const doc = generatePagoPDF(pago, instructor, periodo, clases, disciplinas);
  doc.autoPrint({ variant: 'non-conform' });
  
  try {
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } catch (e) {
    alert('No se pudo abrir la ventana de impresión. Se descargará el documento.');
    downloadPagoPDF(pago, instructor, periodo, clases, disciplinas);
  }
};