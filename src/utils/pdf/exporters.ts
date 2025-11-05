import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import type { CorporateBrand } from "./brand";
import { hexToRgb } from "./brand";
import { drawHeader, drawFooter } from "./membrete";
import { PAGE_CONFIGS, applyTypography } from "./page";

/**
 * Export Gantt chart to PDF with institutional branding
 * Landscape orientation, Letter size
 */
export async function exportGanttPDF(
  planData: any,
  brand: CorporateBrand,
  options?: { filename?: string }
): Promise<string> {
  const doc = new jsPDF({
    orientation: "landscape",
    format: "letter",
    unit: "pt",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryRgb = hexToRgb(brand.colorPrimario);
  const secondaryRgb = hexToRgb(brand.colorSecundario);

  // Draw header
  const contentStartY = await drawHeader(doc, brand, { orientation: "landscape" });

  // Document title
  let currentY = contentStartY + 5;
  applyTypography(doc, "title");
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text("CRONOGRAMA DE GANTT", pageWidth / 2, currentY, { align: "center" });

  currentY += 8;
  applyTypography(doc, "body");
  doc.setTextColor(0, 0, 0);
  doc.text(
    `Proyecto: ${planData.projectName} | Tipo: ${planData.ganttType === "parametrico" ? "Paramétrico" : "Ejecutivo"}`,
    pageWidth / 2,
    currentY,
    { align: "center" }
  );

  // Add Gantt grid content here (reuse existing logic)
  // This is a simplified version - integrate with existing ganttExport logic

  // Draw footer
  drawFooter(doc, brand, { pageNumber: 1, totalPages: 1 });

  // Save
  const filename =
    options?.filename ||
    `Gantt_${planData.projectName.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(filename);

  return filename;
}

/**
 * Export Budget to PDF with institutional branding
 * Portrait orientation, Letter size
 */
export async function exportBudgetPDF(
  budgetData: any,
  brand: CorporateBrand,
  options?: { filename?: string }
): Promise<string> {
  const doc = new jsPDF({
    orientation: "portrait",
    format: "letter",
    unit: "pt",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryRgb = hexToRgb(brand.colorPrimario);
  const secondaryRgb = hexToRgb(brand.colorSecundario);

  // Track page count for footer
  let pageCount = 1;

  // Draw header
  const contentStartY = await drawHeader(doc, brand, { orientation: "portrait" });

  // Document title
  let currentY = contentStartY + 5;
  applyTypography(doc, "title");
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text(
    `PRESUPUESTO ${budgetData.type === "parametrico" ? "PARAMÉTRICO" : "EJECUTIVO"}`,
    pageWidth / 2,
    currentY,
    { align: "center" }
  );

  currentY += 10;
  applyTypography(doc, "body");
  doc.setTextColor(0, 0, 0);

  // Budget info
  doc.text(`Versión: ${budgetData.version}`, 40, currentY);
  doc.text(`Fecha: ${format(new Date(), "dd/MM/yyyy")}`, pageWidth - 40, currentY, {
    align: "right",
  });

  currentY += 8;
  doc.text(`Cliente: ${budgetData.clientName || "N/A"}`, 40, currentY);

  if (budgetData.notas) {
    currentY += 8;
    applyTypography(doc, "small");
    doc.setTextColor(100, 100, 100);
    const notasLines = doc.splitTextToSize(`Notas: ${budgetData.notas}`, pageWidth - 80);
    notasLines.forEach((line: string) => {
      doc.text(line, 40, currentY);
      currentY += 10;
    });
    doc.setTextColor(0, 0, 0);
  }

  currentY += 10;

  // Items table
  const tableData = budgetData.items.map((item: any) => {
    const cantNecesaria = item.cant_real * (1 + item.desperdicio_pct / 100);
    const precioUnit = item.costo_unit * (1 + item.honorarios_pct / 100);
    const total = cantNecesaria * precioUnit;

    return [
      `${item.mayor_name}\n${item.partida_name}`,
      item.descripcion || "-",
      item.unidad,
      item.cant_real.toLocaleString("es-MX", { minimumFractionDigits: 2 }),
      `${item.desperdicio_pct}%`,
      cantNecesaria.toLocaleString("es-MX", { minimumFractionDigits: 2 }),
      `$${item.costo_unit.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      `${item.honorarios_pct}%`,
      `$${precioUnit.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      `$${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        "Concepto",
        "Descripción",
        "Unidad",
        "Cant.",
        "Desp.",
        "Cant. Nec.",
        "Costo Unit.",
        "Hon.",
        "Precio Unit.",
        "Total",
      ],
    ],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: primaryRgb,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 50 },
      2: { cellWidth: 30, halign: "center" },
      3: { cellWidth: 35, halign: "right" },
      4: { cellWidth: 25, halign: "center" },
      5: { cellWidth: 40, halign: "right" },
      6: { cellWidth: 45, halign: "right" },
      7: { cellWidth: 25, halign: "center" },
      8: { cellWidth: 45, halign: "right" },
      9: { cellWidth: 50, halign: "right" },
    },
    margin: { left: 40, right: 40 },
    didDrawPage: (hookData) => {
      drawFooter(doc, brand, {
        pageNumber: hookData.pageNumber,
        totalPages: pageCount,
      });
    },
  });

  // Totals section
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  const totalsX = pageWidth - 120;

  applyTypography(doc, "heading");
  doc.setTextColor(0, 0, 0);
  doc.text("Subtotal:", totalsX, finalY);
  doc.text(
    `$${budgetData.subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
    pageWidth - 40,
    finalY,
    { align: "right" }
  );

  if (budgetData.ivaEnabled) {
    doc.setFont("helvetica", "normal");
    doc.text("IVA (16%):", totalsX, finalY + 10);
    doc.text(
      `$${budgetData.iva.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      pageWidth - 40,
      finalY + 10,
      { align: "right" }
    );
  }

  // Total line
  doc.setDrawColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]);
  doc.setLineWidth(1);
  const totalY = finalY + (budgetData.ivaEnabled ? 20 : 10);
  doc.line(totalsX - 10, totalY - 3, pageWidth - 40, totalY - 3);

  applyTypography(doc, "subtitle");
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text("TOTAL:", totalsX, totalY + 5);
  doc.text(
    `$${budgetData.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
    pageWidth - 40,
    totalY + 5,
    { align: "right" }
  );

  // Save
  const filename =
    options?.filename ||
    `Presupuesto_${budgetData.clientName?.replace(/\s+/g, "_") || "Proyecto"}_${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(filename);

  return filename;
}

/**
 * Generic PDF exporter for other modules
 * Flexible sections-based approach
 */
export async function exportGenericPDF(
  sections: Array<{
    title: string;
    content: string | Array<any>;
    type?: "text" | "table";
  }>,
  brand: CorporateBrand,
  options?: {
    title?: string;
    orientation?: "portrait" | "landscape";
    filename?: string;
  }
): Promise<string> {
  const orientation = options?.orientation || "portrait";
  const doc = new jsPDF({
    orientation,
    format: "letter",
    unit: "pt",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryRgb = hexToRgb(brand.colorPrimario);

  // Draw header
  const contentStartY = await drawHeader(doc, brand, { orientation });

  // Document title
  let currentY = contentStartY + 5;
  if (options?.title) {
    applyTypography(doc, "title");
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.text(options.title, pageWidth / 2, currentY, { align: "center" });
    currentY += 15;
  }

  // Render sections
  sections.forEach((section) => {
    applyTypography(doc, "heading");
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.text(section.title, 40, currentY);
    currentY += 10;

    if (section.type === "table" && Array.isArray(section.content)) {
      // Render as table (simplified)
      applyTypography(doc, "body");
      doc.setTextColor(0, 0, 0);
      section.content.forEach((row) => {
        doc.text(JSON.stringify(row), 40, currentY);
        currentY += 12;
      });
    } else {
      // Render as text
      applyTypography(doc, "body");
      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(section.content as string, pageWidth - 80);
      lines.forEach((line: string) => {
        doc.text(line, 40, currentY);
        currentY += 12;
      });
    }

    currentY += 10;
  });

  // Draw footer
  drawFooter(doc, brand, { pageNumber: 1 });

  // Save
  const filename =
    options?.filename || `Documento_${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(filename);

  return filename;
}
