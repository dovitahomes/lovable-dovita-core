import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import type { GanttItem, GanttMinistration } from "@/hooks/useGanttPlan";
import type { BudgetMajor } from "@/hooks/useBudgetMajors";
import type { WeekCell } from "@/utils/ganttTime";
import type { CorporateContent } from "@/hooks/useCorporateContent";
import { calculateBarPosition } from "@/utils/ganttTime";

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
  const doc = new jsPDF({ orientation: "landscape", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Colors from CMS
  const primaryColor = params.corporateData?.color_primario || "#1e40af";
  const secondaryColor = params.corporateData?.color_secundario || "#059669";
  const primaryRgb = hexToRgb(primaryColor);
  const secondaryRgb = hexToRgb(secondaryColor);
  const redRgb: [number, number, number] = [211, 47, 47]; // Red for ministrations

  // Header with logo and corporate info
  let headerHeight = 35;
  if (params.corporateData?.logo_url) {
    try {
      doc.addImage(params.corporateData.logo_url, "PNG", 10, 8, 35, 18);
    } catch (e) {
      console.error("Error loading logo for PDF");
    }
  }

  // Company name and project
  doc.setFontSize(16);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text(params.corporateData?.nombre_empresa || "Dovita", pageWidth / 2, 12, { align: "center" });
  
  doc.setFontSize(14);
  doc.text("Cronograma de Gantt", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`Proyecto: ${params.projectName}`, 50, 12);
  doc.text(`Tipo: ${params.ganttType === "parametrico" ? "Paramétrico" : "Ejecutivo"}`, 50, 17);
  doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 50, 22);

  if (params.corporateData?.telefono_principal) {
    doc.text(`Tel: ${params.corporateData.telefono_principal}`, 50, 27);
  }

  // Gantt grid table with visual bars
  const monthNumbers = Array.from(params.monthsMap.keys()).sort((a, b) => a - b);
  
  // Build complex header (two rows)
  const headerRow1: string[] = ["#", "Mayor", "Importe", "%"];
  const headerRow2: string[] = ["", "", "", ""];
  
  monthNumbers.forEach((monthNum) => {
    const monthWeeks = params.monthsMap.get(monthNum) || [];
    // Add month header spanning its weeks
    headerRow1.push(`Mes ${monthNum}`);
    for (let i = 1; i < monthWeeks.length; i++) {
      headerRow1.push(""); // Colspan placeholder
    }
    // Add week sub-headers
    monthWeeks.forEach((week, idx) => {
      headerRow2.push(`S${idx + 1}`);
    });
  });

  // Build data rows with visual bars
  const tableData = params.items.map((item, index) => {
    const row: any[] = [
      index + 1,
      item.tu_nodes?.name || "Sin nombre",
      item.mayor?.importe ? `$${item.mayor.importe.toLocaleString("es-MX", { maximumFractionDigits: 0 })}` : "-",
      item.mayor?.pct_of_total ? `${item.mayor.pct_of_total.toFixed(1)}%` : "-",
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
      row.push(overlaps ? "█" : "");
    });
    
    return row;
  });

  // Render main table
  autoTable(doc, {
    startY: headerHeight,
    head: [headerRow1.slice(0, 4).concat(monthNumbers.map(m => `Mes ${m}`)), headerRow2],
    body: tableData,
    theme: "grid",
    headStyles: { 
      fillColor: primaryRgb,
      fontSize: 7,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 1.5,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
      1: { halign: "left", cellWidth: 40 },
      2: { halign: "right", cellWidth: 25 },
      3: { halign: "center", cellWidth: 12 },
    },
    didDrawCell: (data) => {
      // Highlight ministration columns with red vertical lines
      if (data.section === "body" && data.column.index >= 4) {
        const weekIdx = data.column.index - 4;
        const week = params.weeks[weekIdx];
        
        if (week) {
          params.ministrations.forEach((m) => {
            const mDate = new Date(m.date);
            if (mDate >= week.startDate && mDate <= week.endDate) {
              // Draw red vertical line
              doc.setDrawColor(redRgb[0], redRgb[1], redRgb[2]);
              doc.setLineWidth(0.8);
              const x = data.cell.x + data.cell.width / 2;
              doc.line(x, data.cell.y, x, data.cell.y + data.cell.height);
            }
          });
        }
      }
    },
  });

  // Ministrations table
  if (params.ministrations.length > 0) {
    const currentY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(11);
    doc.setTextColor(redRgb[0], redRgb[1], redRgb[2]);
    doc.text("Ministraciones Programadas", 10, currentY);

    const ministrationsData = params.ministrations.map((m, idx) => [
      idx + 1,
      format(new Date(m.date), "dd/MM/yyyy"),
      m.label,
      m.percent ? `${m.percent.toFixed(1)}%` : "-",
      m.accumulated_percent ? `${m.accumulated_percent.toFixed(1)}%` : "-",
      m.alcance || "-",
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [["#", "Fecha", "Etiqueta", "% Ministración", "% Inversión Acum.", "Alcance"]],
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
        1: { halign: "center", cellWidth: 25 },
        2: { halign: "left", cellWidth: 40 },
        3: { halign: "center", cellWidth: 25 },
        4: { halign: "center", cellWidth: 30 },
        5: { halign: "left", cellWidth: 'auto' },
      },
    });
  }

  // Footer
  const footerY = pageHeight - 10;
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generado por ${params.corporateData?.nombre_empresa || "Sistema Dovita"}`, 10, footerY);
  doc.text(`Página 1 de 1`, pageWidth - 30, footerY);

  // Save
  const fileName = `Gantt_${params.projectName.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(fileName);
  
  return fileName;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [30, 64, 175]; // Default blue
}
