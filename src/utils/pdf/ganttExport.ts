import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, differenceInDays } from "date-fns";
import type { GanttItem, GanttMinistration } from "@/hooks/useGanttPlan";
import type { BudgetMajor } from "@/hooks/useBudgetMajors";
import type { WeekCell } from "@/utils/ganttTime";
import type { CorporateContent } from "@/hooks/useCorporateContent";
import { calculateBarPosition, groupWeeksByMonth } from "@/utils/ganttTime";
import { drawHeader, drawFooter } from "./membrete";
import { hexToRgb } from "./brand";

export async function exportGanttToPDF(params: {
  projectName: string;
  ganttType: "parametrico" | "ejecutivo";
  items: (GanttItem & { mayor?: BudgetMajor })[];
  ministrations: GanttMinistration[];
  weeks: WeekCell[];
  monthsMap: Map<number, WeekCell[]>;
  corporateData: CorporateContent | null;
  timelineStart: Date;
  timelineEnd: Date;
}) {
  const doc = new jsPDF({ orientation: "landscape", format: "letter" }); // 11" x 8.5"
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Colors from CMS
  const primaryColor = params.corporateData?.color_primario || "#1e40af";
  const secondaryColor = params.corporateData?.color_secundario || "#059669";
  const primaryRgb = hexToRgb(primaryColor);
  const secondaryRgb = hexToRgb(secondaryColor);
  const redRgb: [number, number, number] = [211, 47, 47]; // Red for ministrations
  const barBlueRgb = primaryRgb; // Use primary color for bars

  // ============= HEADER SECTION (institutional letterhead) =============
  const brand = {
    logoUrl: params.corporateData?.logo_url || null,
    colorPrimario: primaryColor,
    colorSecundario: secondaryColor,
    razonSocial: params.corporateData?.nombre_empresa || "DOVITA",
    domicilio: params.corporateData?.direccion || "",
    telefono: params.corporateData?.telefono_principal || "",
    sitioWeb: params.corporateData?.sitio_web || "",
    emailPrincipal: params.corporateData?.email_principal || "",
  };

  let currentY = await drawHeader(doc, brand, { orientation: "landscape" });

  // Title
  doc.setFontSize(14);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text("CRONOGRAMA DE GANTT", pageWidth / 2, currentY, { align: "center" });
  
  currentY += 6;
  
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`Proyecto: ${params.projectName}`, pageWidth / 2, currentY, { align: "center" });
  
  currentY += 5;
  
  doc.text(
    `Tipo: ${params.ganttType === "parametrico" ? "Paramétrico" : "Ejecutivo"} | Generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
    pageWidth / 2,
    currentY,
    { align: "center" }
  );

  currentY += 8;

  // ============= GANTT GRID TABLE =============
  const monthNumbers = Array.from(params.monthsMap.keys()).sort((a, b) => a - b);
  const monthsMapLocal = groupWeeksByMonth(params.weeks);
  
  // Build header rows
  const headerCells: any[] = [];
  
  // Fixed columns
  headerCells.push({ content: "#", rowSpan: 2, styles: { halign: "center", valign: "middle" } });
  headerCells.push({ content: "Mayor", rowSpan: 2, styles: { halign: "center", valign: "middle" } });
  headerCells.push({ content: "Importe (MXN)", rowSpan: 2, styles: { halign: "center", valign: "middle" } });
  headerCells.push({ content: "% Total", rowSpan: 2, styles: { halign: "center", valign: "middle" } });

  // Month headers (spanning weeks)
  monthNumbers.forEach((monthNum) => {
    const monthWeeks = monthsMapLocal.get(monthNum) || [];
    headerCells.push({
      content: `Mes ${monthNum}`,
      colSpan: monthWeeks.length,
      styles: { halign: "center", fillColor: primaryRgb },
    });
  });

  // Week sub-headers
  const subHeaderCells: any[] = [
    { content: "", styles: { fillColor: [255, 255, 255] } },
    { content: "", styles: { fillColor: [255, 255, 255] } },
    { content: "", styles: { fillColor: [255, 255, 255] } },
    { content: "", styles: { fillColor: [255, 255, 255] } },
  ];

  monthNumbers.forEach((monthNum) => {
    const monthWeeks = monthsMapLocal.get(monthNum) || [];
    monthWeeks.forEach((week, idx) => {
      subHeaderCells.push({ content: `S${idx + 1}`, styles: { halign: "center", fontSize: 6 } });
    });
  });

  // Build data rows
  const bodyData = params.items.map((item, index) => {
    const row: any[] = [
      { content: (index + 1).toString(), styles: { halign: "center" } },
      { content: item.tu_nodes?.name || "Sin nombre", styles: { halign: "left" } },
      {
        content: item.mayor?.importe
          ? `$${item.mayor.importe.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : "-",
        styles: { halign: "right" },
      },
      {
        content: item.mayor?.pct_of_total ? `${item.mayor.pct_of_total.toFixed(1)}%` : "-",
        styles: { halign: "center" },
      },
    ];

    // Calculate bar position for this item
    const barPos = calculateBarPosition(
      new Date(item.start_date),
      new Date(item.end_date),
      params.timelineStart,
      params.timelineEnd
    );

    // For each week, determine if bar should be painted
    const totalWeeks = params.weeks.length;
    params.weeks.forEach((week, weekIdx) => {
      const weekStart = (weekIdx / totalWeeks) * 100;
      const weekEnd = ((weekIdx + 1) / totalWeeks) * 100;
      
      // Check if bar overlaps this week
      const overlaps = !(barPos.left + barPos.width < weekStart || barPos.left > weekEnd);
      
      row.push({
        content: overlaps ? "█" : "",
        styles: {
          halign: "center",
          textColor: overlaps ? barBlueRgb : [0, 0, 0],
          fontSize: overlaps ? 8 : 6,
        },
      });
    });
    
    return row;
  });

  // Render main table
  autoTable(doc, {
    startY: currentY,
    head: [headerCells, subHeaderCells],
    body: bodyData,
    theme: "grid",
    headStyles: { 
      fillColor: primaryRgb,
      fontSize: 7,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 1,
      minCellHeight: 6,
    },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 45 },
      2: { cellWidth: 25 },
      3: { cellWidth: 12 },
    },
    didDrawCell: (data) => {
      // Draw red vertical lines for ministrations
      if (data.section === "body" && data.column.index >= 4) {
        const weekIdx = data.column.index - 4;
        const week = params.weeks[weekIdx];
        
        if (week) {
          params.ministrations.forEach((m) => {
            const mDate = new Date(m.date);
            if (mDate >= week.startDate && mDate <= week.endDate) {
              doc.setDrawColor(redRgb[0], redRgb[1], redRgb[2]);
              doc.setLineWidth(1.2);
              const x = data.cell.x + data.cell.width / 2;
              doc.line(x, data.cell.y, x, data.cell.y + data.cell.height);
            }
          });
        }
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // ============= SUMMARY SECTION =============
  const totalBudget = params.items.reduce((sum, item) => sum + (item.mayor?.importe || 0), 0);
  const totalDays = differenceInDays(params.timelineEnd, params.timelineStart);
  const elapsedDays = differenceInDays(new Date(), params.timelineStart);
  const timeProgress = totalDays > 0 ? Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100)) : 0;
  
  const lastMinistration = params.ministrations.length > 0
    ? params.ministrations[params.ministrations.length - 1]
    : null;
  const accumulatedPercent = lastMinistration?.accumulated_percent || 0;
  const accumulatedInvestment = (totalBudget * accumulatedPercent) / 100;

  doc.setFontSize(10);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text("RESUMEN DE AVANCE", 10, currentY);
  
  currentY += 6;

  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(`Avance por tiempo: ${timeProgress.toFixed(1)}%`, 10, currentY);
  doc.text(
    `Inversión acumulada programada: $${accumulatedInvestment.toLocaleString("es-MX", { minimumFractionDigits: 2 })} (${accumulatedPercent.toFixed(1)}%)`,
    10,
    currentY + 5
  );

  currentY += 12;

  // ============= MINISTRATIONS TABLE =============
  if (params.ministrations.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(redRgb[0], redRgb[1], redRgb[2]);
    doc.text("MINISTRACIONES PROGRAMADAS", 10, currentY);

    currentY += 5;

    const ministrationsData = params.ministrations.map((m, idx) => [
      (idx + 1).toString(),
      m.percent ? `${m.percent.toFixed(1)}%` : "-",
      format(new Date(m.date), "dd/MM/yyyy"),
      m.label,
      m.alcance || "-",
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["#", "% del Total", "Fecha Estimada", "Etiqueta", "Descripción / Alcances"]],
      body: ministrationsData,
      theme: "striped",
      headStyles: { 
        fillColor: redRgb,
        fontSize: 8,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 7,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        1: { halign: "center", cellWidth: 20 },
        2: { halign: "center", cellWidth: 25 },
        3: { halign: "left", cellWidth: 35 },
        4: { halign: "left", cellWidth: "auto" },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // ============= FOOTER (institutional) =============
  drawFooter(doc, brand, { pageNumber: 1, totalPages: 1 });

  // Save
  const fileName = `Gantt_${params.projectName.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(fileName);
  
  return fileName;
}

// hexToRgb now imported from ./brand
