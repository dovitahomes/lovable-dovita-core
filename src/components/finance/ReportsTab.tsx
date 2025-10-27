import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { exportFinanceToXLSX } from "@/utils/exports/excel";
import { exportFinanceToPDF } from "@/utils/exports/pdf";

export function ReportsTab() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [period, setPeriod] = useState<"mensual" | "trimestral" | "anual">("mensual");
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Selecciona el periodo");
      return;
    }

    setLoading(true);
    try {
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select(`
          *,
          bank_accounts(numero_cuenta, banks(nombre)),
          projects(sucursal_id, clients(name)),
          providers(name),
          clients(name)
        `)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date");

      if (error) throw error;

      // Calculate totals
      const ingresos = transactions?.filter((t) => t.type === "ingreso") || [];
      const egresos = transactions?.filter((t) => t.type === "egreso") || [];

      const totalIngresos = ingresos.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalEgresos = egresos.reduce((sum, t) => sum + (t.amount || 0), 0);

      // Group by sucursal
      const bySucursal = new Map();
      transactions?.forEach((t) => {
        const sucursalId = t.projects?.sucursal_id || "sin_sucursal";
        if (!bySucursal.has(sucursalId)) {
          bySucursal.set(sucursalId, { ingresos: 0, egresos: 0 });
        }
        const current = bySucursal.get(sucursalId);
        if (t.type === "ingreso") {
          current.ingresos += t.amount || 0;
        } else {
          current.egresos += t.amount || 0;
        }
      });

      console.log("Report data:", {
        periodo: `${format(new Date(startDate), "dd/MM/yyyy")} - ${format(new Date(endDate), "dd/MM/yyyy")}`,
        totalIngresos,
        totalEgresos,
        balance: totalIngresos - totalEgresos,
        bySucursal: Array.from(bySucursal.entries()),
      });

      toast.success("Reporte generado. Revisa la consola para los datos.");
    } catch (error: any) {
      toast.error("Error al generar reporte: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    toast.info("Función de exportación a Excel en desarrollo");
  };

  const exportToPDF = () => {
    toast.info("Función de exportación a PDF en desarrollo");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generar Reporte Financiero</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Periodo</Label>
            <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensual">Mensual</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha Inicio</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Fecha Fin</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={generateReport} disabled={loading} className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Generar Reporte
            </Button>
            <Button 
              onClick={async () => {
                try {
                  await exportFinanceToXLSX();
                  toast.success("Excel exportado");
                } catch (error) {
                  toast.error("Error al exportar: " + (error instanceof Error ? error.message : "Error desconocido"));
                }
              }} 
              variant="outline" 
              disabled={loading}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button 
              onClick={async () => {
                try {
                  await exportFinanceToPDF();
                  toast.success("PDF exportado");
                } catch (error) {
                  toast.error("Error al exportar: " + (error instanceof Error ? error.message : "Error desconocido"));
                }
              }} 
              variant="outline" 
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vista Previa del Reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Selecciona un periodo y genera el reporte para ver los resultados
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
