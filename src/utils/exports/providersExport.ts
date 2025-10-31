import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProviderExportData {
  code_short: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  rfc?: string;
  razon_social?: string;
  regimen?: string;
  credit_days?: string;
  metodo_pago?: string;
  moneda?: string;
  contactos_json?: string;
}

export async function exportProvidersToCSV(providers: any[]) {
  const exportData: ProviderExportData[] = providers.map((p) => ({
    code_short: p.code_short,
    name: p.name,
    email: p.contacto_json?.email || "",
    phone: p.contacto_json?.telefono || "",
    address: p.fiscales_json?.direccion_fiscal || "",
    rfc: p.fiscales_json?.rfc || "",
    razon_social: p.fiscales_json?.razon_social || "",
    regimen: p.fiscales_json?.regimen_fiscal || "",
    credit_days: p.terms_json?.tiempo_entrega || "",
    metodo_pago: p.terms_json?.forma_pago || "",
    moneda: p.terms_json?.moneda || "MXN",
    contactos_json: p.contacto_json ? JSON.stringify(p.contacto_json) : "",
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Proveedores");

  XLSX.writeFile(wb, `proveedores_${new Date().toISOString().split("T")[0]}.xlsx`);
  toast.success("Archivo exportado correctamente");
}

export async function importProvidersFromCSV(file: File): Promise<{
  created: number;
  updated: number;
  errors: string[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ProviderExportData[];

        let created = 0;
        let updated = 0;
        const errors: string[] = [];

        for (const row of jsonData) {
          try {
            // Try to find existing provider by code_short
            const { data: existing } = await supabase
              .from("providers")
              .select("id")
              .eq("code_short", row.code_short)
              .maybeSingle();

            const providerData = {
              name: row.name,
              code_short: row.code_short || undefined, // Let DB generate if empty
              fiscales_json: {
                rfc: row.rfc || null,
                razon_social: row.razon_social || null,
                regimen_fiscal: row.regimen || null,
                direccion_fiscal: row.address || null,
              },
              terms_json: {
                tiempo_entrega: row.credit_days || null,
                forma_pago: row.metodo_pago || null,
                moneda: row.moneda || "MXN",
              },
              contacto_json: row.contactos_json
                ? JSON.parse(row.contactos_json)
                : {
                    email: row.email || null,
                    telefono: row.phone || null,
                  },
              activo: true,
            };

            if (existing) {
              // Update existing
              const { error } = await supabase
                .from("providers")
                .update(providerData)
                .eq("id", existing.id);

              if (error) throw error;
              updated++;
            } else {
              // Create new
              const { error } = await supabase.from("providers").insert([providerData]);

              if (error) throw error;
              created++;
            }
          } catch (err: any) {
            errors.push(
              `Fila ${row.name || row.code_short}: ${err.message}`
            );
          }
        }

        resolve({ created, updated, errors });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Error leyendo el archivo"));
    reader.readAsArrayBuffer(file);
  });
}
