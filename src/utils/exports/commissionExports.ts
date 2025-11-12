import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CommissionExportData {
  id: string;
  tipo: string;
  sujeto_nombre: string;
  cliente_nombre: string;
  proyecto_nombre: string;
  base_amount: number;
  percent: number;
  calculated_amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  payment_method: string | null;
  payment_reference: string | null;
}

/**
 * Export commissions to Excel with multiple sheets
 */
export async function exportCommissionsToExcel(
  commissions: CommissionExportData[],
  filters: {
    tipo?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }
) {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Summary by Type
  const summaryData = [
    ["Tipo", "Total Comisiones", "Monto Total", "Pendiente", "Pagado"],
  ];

  const byAlianza = commissions.filter((c) => c.tipo === "alianza");
  const byColaborador = commissions.filter((c) => c.tipo === "colaborador");

  summaryData.push([
    "Alianzas",
    byAlianza.length.toString(),
    `$${byAlianza
      .reduce((sum, c) => sum + c.calculated_amount, 0)
      .toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
    `$${byAlianza
      .filter((c) => c.status !== "pagada")
      .reduce((sum, c) => sum + c.calculated_amount, 0)
      .toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
    `$${byAlianza
      .filter((c) => c.status === "pagada")
      .reduce((sum, c) => sum + c.calculated_amount, 0)
      .toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
  ]);

  summaryData.push([
    "Colaboradores",
    byColaborador.length.toString(),
    `$${byColaborador
      .reduce((sum, c) => sum + c.calculated_amount, 0)
      .toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
    `$${byColaborador
      .filter((c) => c.status !== "pagada")
      .reduce((sum, c) => sum + c.calculated_amount, 0)
      .toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
    `$${byColaborador
      .filter((c) => c.status === "pagada")
      .reduce((sum, c) => sum + c.calculated_amount, 0)
      .toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
  ]);

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen");

  // Sheet 2: Detailed Data
  const detailData = [
    [
      "Tipo",
      "Sujeto",
      "Cliente",
      "Proyecto",
      "Base",
      "%",
      "Comisión",
      "Estado",
      "Fecha Generación",
      "Fecha Pago",
      "Método Pago",
      "Referencia",
    ],
  ];

  commissions.forEach((c) => {
    detailData.push([
      c.tipo === "alianza" ? "Alianza" : "Colaborador",
      c.sujeto_nombre,
      c.cliente_nombre,
      c.proyecto_nombre,
      `$${c.base_amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      `${c.percent}%`,
      `$${c.calculated_amount.toLocaleString("es-MX", {
        minimumFractionDigits: 2,
      })}`,
      c.status === "pagada" ? "Pagada" : c.status === "pendiente" ? "Pendiente" : "Calculada",
      format(new Date(c.created_at), "dd/MM/yyyy", { locale: es }),
      c.paid_at ? format(new Date(c.paid_at), "dd/MM/yyyy", { locale: es }) : "-",
      c.payment_method || "-",
      c.payment_reference || "-",
    ]);
  });

  const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
  XLSX.utils.book_append_sheet(workbook, detailSheet, "Detalle");

  // Sheet 3: By Alliance
  if (byAlianza.length > 0) {
    const alianzaData = [["Alianza", "# Comisiones", "Monto Total", "Pendiente", "Pagado"]];

    const alianzaGroups = byAlianza.reduce((acc, c) => {
      if (!acc[c.sujeto_nombre]) {
        acc[c.sujeto_nombre] = [];
      }
      acc[c.sujeto_nombre].push(c);
      return acc;
    }, {} as Record<string, CommissionExportData[]>);

    Object.entries(alianzaGroups).forEach(([nombre, comms]) => {
      alianzaData.push([
        nombre,
        comms.length.toString(),
        `$${comms
          .reduce((sum, c) => sum + c.calculated_amount, 0)
          .toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
        `$${comms
          .filter((c) => c.status !== "pagada")
          .reduce((sum, c) => sum + c.calculated_amount, 0)
          .toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
        `$${comms
          .filter((c) => c.status === "pagada")
          .reduce((sum, c) => sum + c.calculated_amount, 0)
          .toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      ]);
    });

    const alianzaSheet = XLSX.utils.aoa_to_sheet(alianzaData);
    XLSX.utils.book_append_sheet(workbook, alianzaSheet, "Por Alianza");
  }

  // Generate file name
  const fileName = `comisiones_${format(new Date(), "yyyy-MM-dd")}.xlsx`;

  // Save file
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export commissions to PDF
 */
export async function exportCommissionsToPDF(
  commissions: CommissionExportData[],
  filters: {
    tipo?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }
) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.text("Reporte de Comisiones", 14, 20);

  // Filters info
  doc.setFontSize(10);
  let yPos = 30;
  if (filters.tipo) {
    doc.text(`Tipo: ${filters.tipo === "alianza" ? "Alianzas" : "Colaboradores"}`, 14, yPos);
    yPos += 6;
  }
  if (filters.status) {
    doc.text(`Estado: ${filters.status}`, 14, yPos);
    yPos += 6;
  }
  if (filters.dateFrom || filters.dateTo) {
    doc.text(
      `Período: ${filters.dateFrom || "Inicio"} - ${filters.dateTo || "Fin"}`,
      14,
      yPos
    );
    yPos += 6;
  }
  doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`, 14, yPos);
  yPos += 10;

  // Summary
  const totalComisiones = commissions.reduce((sum, c) => sum + c.calculated_amount, 0);
  const totalPendiente = commissions
    .filter((c) => c.status !== "pagada")
    .reduce((sum, c) => sum + c.calculated_amount, 0);
  const totalPagado = commissions
    .filter((c) => c.status === "pagada")
    .reduce((sum, c) => sum + c.calculated_amount, 0);

  doc.setFontSize(12);
  doc.text("Resumen", 14, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [["Concepto", "Monto"]],
    body: [
      ["Total Comisiones", `$${totalComisiones.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`],
      ["Pendiente", `$${totalPendiente.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`],
      ["Pagado", `$${totalPagado.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`],
    ],
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
  });

  // Detailed table
  yPos = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.text("Detalle de Comisiones", 14, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [["Tipo", "Sujeto", "Cliente", "Proyecto", "Comisión", "Estado"]],
    body: commissions.map((c) => [
      c.tipo === "alianza" ? "Alianza" : "Colab.",
      c.sujeto_nombre,
      c.cliente_nombre,
      c.proyecto_nombre,
      `$${c.calculated_amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      c.status === "pagada" ? "Pagada" : c.status === "pendiente" ? "Pend." : "Calc.",
    ]),
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
  });

  // Save
  const fileName = `comisiones_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}
