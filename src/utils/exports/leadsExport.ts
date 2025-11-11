import * as XLSX from "xlsx";
import { toast } from "sonner";

export interface LeadExportData {
  nombre_completo: string;
  email?: string;
  telefono?: string;
  terreno_m2?: number;
  presupuesto_referencia?: number;
  notas?: string;
  status: string;
  origen_lead?: string[];
  amount?: number;
  probability?: number;
  expected_close_date?: string;
  sucursal?: string;
  created_at: string;
  updated_at: string;
}

export interface ExportOptions {
  format: "xlsx" | "csv";
  columns: (keyof LeadExportData)[];
  filename?: string;
}

const COLUMN_LABELS: Record<keyof LeadExportData, string> = {
  nombre_completo: "Nombre Completo",
  email: "Email",
  telefono: "Teléfono",
  terreno_m2: "M² Terreno",
  presupuesto_referencia: "Presupuesto Referencia",
  notas: "Notas",
  status: "Status",
  origen_lead: "Origen",
  amount: "Amount",
  probability: "Probability (%)",
  expected_close_date: "Fecha Cierre Esperada",
  sucursal: "Sucursal",
  created_at: "Fecha Creación",
  updated_at: "Última Actualización",
};

export async function exportLeadsToFile(
  leads: any[],
  options: ExportOptions
): Promise<void> {
  try {
    // Transformar datos según columnas seleccionadas
    const exportData = leads.map((lead) => {
      const row: any = {};
      options.columns.forEach((col) => {
        const label = COLUMN_LABELS[col];
        let value = lead[col];

        // Formatear valores especiales
        if (col === "origen_lead" && Array.isArray(value)) {
          value = value.join(", ");
        } else if (col === "sucursal" && lead.sucursales) {
          value = lead.sucursales.name;
        } else if (col === "terreno_m2" && value) {
          value = `${value} m²`;
        } else if (col === "presupuesto_referencia" || col === "amount") {
          value = value ? `$${value.toLocaleString("es-MX")}` : "";
        } else if (col === "probability" && value) {
          value = `${value}%`;
        } else if ((col === "created_at" || col === "updated_at" || col === "expected_close_date") && value) {
          value = new Date(value).toLocaleDateString("es-MX");
        }

        row[label] = value || "";
      });
      return row;
    });

    // Crear libro de trabajo
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

    // Ajustar anchos de columna
    const maxWidths: number[] = [];
    exportData.forEach((row) => {
      Object.values(row).forEach((value, idx) => {
        const length = value.toString().length;
        maxWidths[idx] = Math.max(maxWidths[idx] || 10, length);
      });
    });
    worksheet["!cols"] = maxWidths.map((w) => ({ wch: Math.min(w + 2, 50) }));

    // Generar archivo
    const filename = options.filename || `Leads_${new Date().toISOString().split("T")[0]}`;
    const extension = options.format === "csv" ? "csv" : "xlsx";

    if (options.format === "csv") {
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      downloadBlob(blob, `${filename}.${extension}`);
    } else {
      XLSX.writeFile(workbook, `${filename}.${extension}`);
    }

    toast.success(`Archivo exportado: ${filename}.${extension}`);
  } catch (error) {
    console.error("Error al exportar leads:", error);
    toast.error("Error al exportar leads");
    throw error;
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Plantilla de ejemplo para importación
export async function downloadLeadsTemplate(): Promise<void> {
  const template = [
    {
      "Nombre Completo": "Juan Pérez",
      Email: "juan@example.com",
      Teléfono: "5551234567",
      "M² Terreno": 500,
      "Presupuesto Referencia": 2500000,
      Notas: "Cliente interesado en casa moderna",
      Status: "nuevo",
      Origen: "facebook",
      Amount: 3000000,
      "Probability (%)": 60,
      "Fecha Cierre Esperada": "2024-12-31",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

  // Ajustar anchos
  worksheet["!cols"] = [
    { wch: 20 },
    { wch: 25 },
    { wch: 15 },
    { wch: 12 },
    { wch: 20 },
    { wch: 30 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 22 },
  ];

  XLSX.writeFile(workbook, "Template_Importar_Leads.xlsx");
  toast.success("Plantilla descargada");
}
