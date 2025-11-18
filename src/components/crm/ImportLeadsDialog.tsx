import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportRow {
  nombre_completo?: string;
  email?: string;
  telefono?: string;
  terreno_m2?: number;
  presupuesto_referencia?: number;
  notas?: string;
  status?: string;
  origen_lead?: string[];
  amount?: number;
  probability?: number;
  expected_close_date?: string;
}

interface ColumnMapping {
  [key: string]: keyof ImportRow | "ignore";
}

interface ImportResult {
  success: number;
  errors: number;
  duplicates: number;
  details: { row: number; message: string; type: "success" | "error" | "duplicate" }[];
}

export function ImportLeadsDialog({ open, onOpenChange }: ImportLeadsDialogProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "importing" | "results">("upload");
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [detectDuplicates, setDetectDuplicates] = useState(true);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const binaryStr = e.target?.result;
        const workbook = XLSX.read(binaryStr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        if (jsonData.length === 0) {
          toast.error("El archivo está vacío");
          return;
        }

        const fileHeaders = Object.keys(jsonData[0] as object);
        setHeaders(fileHeaders);
        setData(jsonData);

        // Auto-mapeo inteligente
        const autoMapping: ColumnMapping = {};
        fileHeaders.forEach((header) => {
          const lowerHeader = header.toLowerCase();
          if (lowerHeader.includes("nombre") || lowerHeader === "name") {
            autoMapping[header] = "nombre_completo";
          } else if (lowerHeader.includes("email") || lowerHeader.includes("correo")) {
            autoMapping[header] = "email";
          } else if (lowerHeader.includes("telefono") || lowerHeader.includes("tel") || lowerHeader.includes("phone")) {
            autoMapping[header] = "telefono";
          } else if (lowerHeader.includes("terreno") || lowerHeader.includes("m2") || lowerHeader.includes("area")) {
            autoMapping[header] = "terreno_m2";
          } else if (lowerHeader.includes("presupuesto") || lowerHeader.includes("budget")) {
            autoMapping[header] = "presupuesto_referencia";
          } else if (lowerHeader.includes("nota") || lowerHeader.includes("note")) {
            autoMapping[header] = "notas";
          } else if (lowerHeader.includes("status") || lowerHeader.includes("estado")) {
            autoMapping[header] = "status";
          } else if (lowerHeader.includes("amount") || lowerHeader.includes("monto")) {
            autoMapping[header] = "amount";
          } else if (lowerHeader.includes("probability") || lowerHeader.includes("probabilidad")) {
            autoMapping[header] = "probability";
          } else if ((lowerHeader.includes("cierre") || lowerHeader.includes("close")) && (lowerHeader.includes("fecha") || lowerHeader.includes("esperada") || lowerHeader.includes("esperado"))) {
            autoMapping[header] = "expected_close_date";
          } else {
            autoMapping[header] = "ignore";
          }
        });
        setColumnMapping(autoMapping);
        setStep("mapping");
        toast.success(`Archivo cargado: ${jsonData.length} registros`);
      } catch (error) {
        console.error("Error al leer archivo:", error);
        toast.error("Error al procesar el archivo");
      }
    };
    reader.readAsBinaryString(uploadedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
  });

  const handleNextStep = () => {
    if (step === "mapping") {
      const hasNombreCompleto = Object.values(columnMapping).includes("nombre_completo");
      if (!hasNombreCompleto) {
        toast.error("Debes mapear al menos la columna 'Nombre Completo'");
        return;
      }
      setStep("preview");
    }
  };

  const handleImport = async () => {
    setStep("importing");
    setImportProgress(0);

    // Helper function to convert Excel dates to ISO format
    const convertExcelDateToISO = (value: any): string | undefined => {
      if (!value) return undefined;
      
      // Si ya es string en formato ISO (YYYY-MM-DD), devolverlo
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
      }
      
      // Si es número de serie de Excel
      if (typeof value === 'number') {
        // Excel epoch: 1900-01-01 (con bug del 1900 leap year)
        const excelEpoch = new Date(1899, 11, 30); // 30 dic 1899
        const date = new Date(excelEpoch.getTime() + value * 86400000);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      }
      
      // Intentar parsear como fecha
      try {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().split('T')[0];
        }
      } catch {}
      
      return undefined;
    };

    const mappedData: ImportRow[] = data.map((row) => {
      const mappedRow: ImportRow = {};
      Object.entries(columnMapping).forEach(([fileColumn, dbColumn]) => {
        if (dbColumn !== "ignore" && row[fileColumn] !== undefined) {
          const value = row[fileColumn];
          if (dbColumn === "terreno_m2" || dbColumn === "presupuesto_referencia" || dbColumn === "amount" || dbColumn === "probability") {
            mappedRow[dbColumn] = parseFloat(value) || undefined;
          } else if (dbColumn === "origen_lead") {
            mappedRow[dbColumn] = [value.toString()];
          } else if (dbColumn === "expected_close_date") {
            mappedRow[dbColumn] = convertExcelDateToISO(value);
          } else {
            mappedRow[dbColumn] = value;
          }
        }
      });
      return mappedRow;
    });

    const result: ImportResult = {
      success: 0,
      errors: 0,
      duplicates: 0,
      details: [],
    };

    for (let i = 0; i < mappedData.length; i++) {
      const rowData = mappedData[i];
      const rowNumber = i + 2; // +2 porque empezamos en fila 1 y la fila 1 son headers

      try {
        // Validación mínima
        if (!rowData.nombre_completo || rowData.nombre_completo.trim() === "") {
          result.errors++;
          result.details.push({
            row: rowNumber,
            message: "Nombre completo requerido",
            type: "error",
          });
          continue;
        }

        // Detección de duplicados si está habilitada
        if (detectDuplicates && rowData.email) {
          const { data: existing } = await supabase
            .from("leads")
            .select("id")
            .eq("email", rowData.email)
            .limit(1);

          if (existing && existing.length > 0) {
            result.duplicates++;
            result.details.push({
              row: rowNumber,
              message: `Lead duplicado: ${rowData.email}`,
              type: "duplicate",
            });
            continue;
          }
        }

        // Insertar lead
        const { error } = await supabase.from("leads").insert({
          nombre_completo: rowData.nombre_completo,
          email: rowData.email || null,
          telefono: rowData.telefono || null,
          terreno_m2: rowData.terreno_m2 || null,
          presupuesto_referencia: rowData.presupuesto_referencia || null,
          notas: rowData.notas || null,
          status: (rowData.status as any) || "nuevo",
          origen_lead: rowData.origen_lead || null,
          amount: rowData.amount || null,
          probability: rowData.probability || null,
          expected_close_date: rowData.expected_close_date || null,
        });

        if (error) throw error;

        result.success++;
        result.details.push({
          row: rowNumber,
          message: `Lead creado: ${rowData.nombre_completo}`,
          type: "success",
        });
      } catch (error: any) {
        result.errors++;
        result.details.push({
          row: rowNumber,
          message: error.message || "Error desconocido",
          type: "error",
        });
      }

      setImportProgress(Math.round(((i + 1) / mappedData.length) * 100));
    }

    setImportResult(result);
    setStep("results");
    queryClient.invalidateQueries({ queryKey: ["leads"] });

    if (result.success > 0) {
      toast.success(`${result.success} leads importados exitosamente`);
    }
    if (result.errors > 0) {
      toast.error(`${result.errors} errores durante la importación`);
    }
    if (result.duplicates > 0) {
      toast.warning(`${result.duplicates} duplicados omitidos`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setData([]);
    setHeaders([]);
    setColumnMapping({});
    setStep("upload");
    setImportProgress(0);
    setImportResult(null);
  };

  const previewData = data.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Leads desde Excel/CSV</DialogTitle>
          <DialogDescription>
            {step === "upload" && "Sube un archivo Excel o CSV con los datos de tus leads"}
            {step === "mapping" && "Mapea las columnas del archivo a los campos de Dovita"}
            {step === "preview" && "Revisa los datos antes de importar"}
            {step === "importing" && "Importando leads..."}
            {step === "results" && "Resultados de la importación"}
          </DialogDescription>
        </DialogHeader>

        {/* UPLOAD STEP */}
        {step === "upload" && (
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg font-medium">Suelta el archivo aquí...</p>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">
                  Arrastra y suelta un archivo Excel o CSV aquí
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  o haz clic para seleccionar un archivo
                </p>
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Seleccionar archivo
                </Button>
              </>
            )}
          </div>
        )}

        {/* MAPPING STEP */}
        {step === "mapping" && (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Se detectaron {headers.length} columnas en el archivo. Mapea cada columna a un campo de Dovita:
              </p>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {headers.map((header) => (
                <div key={header} className="flex items-center gap-3">
                  <Label className="w-1/3 font-mono text-sm">{header}</Label>
                  <Select
                    value={columnMapping[header]}
                    onValueChange={(value) =>
                      setColumnMapping({ ...columnMapping, [header]: value as any })
                    }
                  >
                    <SelectTrigger className="w-2/3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ignore">-- Ignorar --</SelectItem>
                      <SelectItem value="nombre_completo">Nombre Completo *</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="telefono">Teléfono</SelectItem>
                      <SelectItem value="terreno_m2">M² Terreno</SelectItem>
                      <SelectItem value="presupuesto_referencia">Presupuesto Referencia</SelectItem>
                      <SelectItem value="notas">Notas</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="amount">Amount (Oportunidad)</SelectItem>
                      <SelectItem value="probability">Probability (%)</SelectItem>
                      <SelectItem value="expected_close_date">Fecha Cierre Esperada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="detectDuplicates"
                checked={detectDuplicates}
                onCheckedChange={(checked) => setDetectDuplicates(checked as boolean)}
              />
              <Label htmlFor="detectDuplicates" className="text-sm cursor-pointer">
                Detectar y omitir duplicados (por email)
              </Label>
            </div>
          </div>
        )}

        {/* PREVIEW STEP */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Vista previa de los primeros {previewData.length} de {data.length} registros
              </p>
            </div>
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    {Object.values(columnMapping)
                      .filter((col) => col !== "ignore")
                      .map((col) => (
                        <th key={col as string} className="px-4 py-2 text-left font-medium">
                          {col}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="border-t">
                      {Object.entries(columnMapping)
                        .filter(([_, dbCol]) => dbCol !== "ignore")
                        .map(([fileCol, _]) => (
                          <td key={fileCol} className="px-4 py-2">
                            {row[fileCol]?.toString() || "-"}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* IMPORTING STEP */}
        {step === "importing" && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <Upload className="h-16 w-16 mx-auto mb-4 text-primary animate-pulse" />
              <p className="text-lg font-medium mb-2">Importando leads...</p>
              <p className="text-sm text-muted-foreground mb-4">
                {importProgress}% completado
              </p>
            </div>
            <Progress value={importProgress} className="h-2" />
          </div>
        )}

        {/* RESULTS STEP */}
        {step === "results" && importResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-600">{importResult.success}</p>
                <p className="text-sm text-muted-foreground">Exitosos</p>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                <p className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</p>
                <p className="text-sm text-muted-foreground">Duplicados</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                <XCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <p className="text-2xl font-bold text-red-600">{importResult.errors}</p>
                <p className="text-sm text-muted-foreground">Errores</p>
              </div>
            </div>

            <div className="border rounded-lg max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Fila</th>
                    <th className="px-4 py-2 text-left font-medium">Resultado</th>
                    <th className="px-4 py-2 text-left font-medium">Mensaje</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.details.map((detail, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{detail.row}</td>
                      <td className="px-4 py-2">
                        {detail.type === "success" && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                        {detail.type === "duplicate" && (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        )}
                        {detail.type === "error" && (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{detail.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          )}
          {step === "mapping" && (
            <>
              <Button variant="outline" onClick={handleReset}>
                Volver
              </Button>
              <Button onClick={handleNextStep}>Continuar</Button>
            </>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("mapping")}>
                Volver
              </Button>
              <Button onClick={handleImport}>Importar {data.length} Leads</Button>
            </>
          )}
          {step === "results" && (
            <>
              <Button variant="outline" onClick={handleReset}>
                Importar otro archivo
              </Button>
              <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
