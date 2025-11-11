import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Download, FileSpreadsheet } from "lucide-react";
import { exportLeadsToFile, LeadExportData } from "@/utils/exports/leadsExport";

interface ExportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: any[];
  totalCount: number;
}

const ALL_COLUMNS: (keyof LeadExportData)[] = [
  "nombre_completo",
  "email",
  "telefono",
  "terreno_m2",
  "presupuesto_referencia",
  "notas",
  "status",
  "origen_lead",
  "amount",
  "probability",
  "expected_close_date",
  "sucursal",
  "created_at",
  "updated_at",
];

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

export function ExportLeadsDialog({
  open,
  onOpenChange,
  leads,
  totalCount,
}: ExportLeadsDialogProps) {
  const [format, setFormat] = useState<"xlsx" | "csv">("xlsx");
  const [filename, setFilename] = useState(`Leads_${new Date().toISOString().split("T")[0]}`);
  const [selectedColumns, setSelectedColumns] = useState<(keyof LeadExportData)[]>([
    "nombre_completo",
    "email",
    "telefono",
    "terreno_m2",
    "presupuesto_referencia",
    "status",
    "created_at",
  ]);

  const handleToggleColumn = (column: keyof LeadExportData) => {
    setSelectedColumns((prev) =>
      prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]
    );
  };

  const handleSelectAll = () => {
    setSelectedColumns(ALL_COLUMNS);
  };

  const handleDeselectAll = () => {
    setSelectedColumns([]);
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      return;
    }

    await exportLeadsToFile(leads, {
      format,
      columns: selectedColumns,
      filename,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Leads
          </DialogTitle>
          <DialogDescription>
            Se exportarán {leads.length} leads{" "}
            {totalCount > leads.length && `(de ${totalCount} totales con filtros aplicados)`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formato */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Formato de archivo</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as "xlsx" | "csv")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xlsx" id="xlsx" />
                <Label htmlFor="xlsx" className="cursor-pointer font-normal">
                  Excel (.xlsx) - Recomendado
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="cursor-pointer font-normal">
                  CSV (.csv) - Compatible universal
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Nombre del archivo */}
          <div className="space-y-3">
            <Label htmlFor="filename" className="text-base font-semibold">
              Nombre del archivo
            </Label>
            <div className="flex gap-2">
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Nombre del archivo"
              />
              <div className="flex items-center px-3 bg-muted rounded-md text-sm text-muted-foreground">
                .{format}
              </div>
            </div>
          </div>

          {/* Columnas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Columnas a incluir ({selectedColumns.length} de {ALL_COLUMNS.length})
              </Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  Todas
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                  Ninguna
                </Button>
              </div>
            </div>

            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {ALL_COLUMNS.map((column) => (
                  <div key={column} className="flex items-center space-x-2">
                    <Checkbox
                      id={column}
                      checked={selectedColumns.includes(column)}
                      onCheckedChange={() => handleToggleColumn(column)}
                    />
                    <Label
                      htmlFor={column}
                      className="text-sm cursor-pointer font-normal"
                    >
                      {COLUMN_LABELS[column]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  • La exportación respeta los filtros y búsquedas aplicadas actualmente
                </p>
                <p>• Los datos exportados incluyen formato y etiquetas en español</p>
                <p>
                  • El archivo Excel (.xlsx) incluye anchos de columna optimizados
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedColumns.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar {leads.length} Leads
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
