import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import type { GanttItem, GanttMinistration } from "@/hooks/useGanttPlan";
import type { BudgetMajor } from "@/hooks/useBudgetMajors";
import type { WeekCell } from "@/utils/ganttTime";
import type { CorporateContent } from "@/hooks/useCorporateContent";

export async function exportGanttToPDF(params: {
  projectName: string;
  ganttType: "parametrico" | "ejecutivo";
  items: (GanttItem & { mayor?: BudgetMajor })[];
  ministrations: GanttMinistration[];
  weeks: WeekCell[];
  monthsMap: Map<number, WeekCell[]>;
  corporateData: CorporateContent | null;
}) {
  const doc = new jsPDF({ orientation: "landscape", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Primary color for headers
  const primaryColor = params.corporateData?.color_primario || "#1e40af";
  const rgb = hexToRgb(primaryColor);

  // Header with logo
  if (params.corporateData?.logo_url) {
    try {
      doc.addImage(params.corporateData.logo_url, "PNG", 10, 10, 40, 20);
    } catch (e) {
      console.error("Error loading logo for PDF");
    }
  }

  doc.setFontSize(18);
  doc.text("Cronograma de Gantt", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Proyecto: ${params.projectName}`, 10, 40);
  doc.text(
    `Tipo: ${params.ganttType === "parametrico" ? "Paramétrico" : "Ejecutivo"}`,
    10,
    45
  );
  doc.text(`Fecha: ${format(new Date(), "dd/MM/yyyy")}`, 10, 50);

  // Gantt grid table
  const headers: string[] = ["#", "Mayor", "Importe", "%"];
  
  // Add month columns
  const monthNumbers = Array.from(params.monthsMap.keys()).sort((a, b) => a - b);
  monthNumbers.forEach((monthNum) => {
    headers.push(`Mes ${monthNum}`);
  });

  const tableData = params.items.map((item, index) => {
    const row: any[] = [
      index + 1,
      item.tu_nodes?.name || "",
      item.mayor?.importe ? `$${item.mayor.importe.toLocaleString()}` : "",
      item.mayor?.pct_of_total ? `${item.mayor.pct_of_total.toFixed(1)}%` : "",
    ];
    
    // Add visual representation for each month (simplified)
    monthNumbers.forEach(() => {
      row.push("▬▬"); // Visual bar representation
    });
    
    return row;
  });

  autoTable(doc, {
    startY: 60,
    head: [headers],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: rgb },
    styles: { fontSize: 8 },
  });

  // Ministrations table
  if (params.ministrations.length > 0) {
    const ministrationsData = params.ministrations.map((m, idx) => [
      idx + 1,
      format(new Date(m.date), "dd/MM/yyyy"),
      m.label,
      m.percent ? `${m.percent.toFixed(1)}%` : "",
      m.accumulated_percent ? `${m.accumulated_percent.toFixed(1)}%` : "",
      m.alcance || "",
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [["#", "Fecha", "Etiqueta", "% Ministración", "% Acumulado", "Alcance"]],
      body: ministrationsData,
      theme: "grid",
      headStyles: { fillColor: [220, 38, 38] }, // Red for ministrations
      styles: { fontSize: 8 },
    });
  }

  // Footer
  const fileName = `cronograma_${params.ganttType}_${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(fileName);
  
  return fileName;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [30, 64, 175]; // Default blue
}
