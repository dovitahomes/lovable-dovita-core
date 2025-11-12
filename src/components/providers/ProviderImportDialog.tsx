import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
} from "lucide-react";

interface ProviderImportDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ProviderRow {
  code_short: string;
  name: string;
  rfc?: string;
  razon_social?: string;
  email?: string;
  telefono?: string;
  [key: string]: any;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  created: number;
  updated: number;
  errors: ValidationError[];
}

const RFC_REGEX = /^([A-ZÑ&]{3,4}\d{6}[A-V1-9][A-Z1-9][0-9A])$/i;

export function ProviderImportDialog({ open, onClose }: ProviderImportDialogProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"upload" | "preview" | "processing" | "results">("upload");
  const [previewData, setPreviewData] = useState<ProviderRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json<ProviderRow>(firstSheet);

          if (jsonData.length === 0) {
            toast.error("El archivo está vacío");
            return;
          }

          setPreviewData(jsonData.slice(0, 5));
          validateData(jsonData);
          setStep("preview");
        } catch (error) {
          console.error("Error parsing file:", error);
          toast.error("Error al leer el archivo");
        }
      };

      reader.readAsArrayBuffer(file);
    },
  });

  const validateData = (data: ProviderRow[]) => {
    const errors: ValidationError[] = [];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 porque index empieza en 0 y hay header

      // Validar campos requeridos
      if (!row.code_short || row.code_short.trim() === "") {
        errors.push({
          row: rowNumber,
          field: "code_short",
          message: "Código/Alias es requerido",
        });
      }

      if (!row.name || row.name.trim() === "") {
        errors.push({
          row: rowNumber,
          field: "name",
          message: "Nombre es requerido",
        });
      }

      // Validar RFC si existe
      if (row.rfc && row.rfc.trim() !== "" && !RFC_REGEX.test(row.rfc)) {
        errors.push({
          row: rowNumber,
          field: "rfc",
          message: "RFC inválido",
        });
      }

      // Validar email si existe
      if (row.email && row.email.trim() !== "") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          errors.push({
            row: rowNumber,
            field: "email",
            message: "Email inválido",
          });
        }
      }
    });

    // Detectar duplicados por code_short
    const codeShortMap = new Map<string, number[]>();
    data.forEach((row, index) => {
      if (row.code_short) {
        const code = row.code_short.toUpperCase().trim();
        if (!codeShortMap.has(code)) {
          codeShortMap.set(code, []);
        }
        codeShortMap.get(code)!.push(index + 2);
      }
    });

    codeShortMap.forEach((rows, code) => {
      if (rows.length > 1) {
        rows.forEach((rowNum) => {
          errors.push({
            row: rowNum,
            field: "code_short",
            message: `Código duplicado '${code}' en archivo`,
          });
        });
      }
    });

    setValidationErrors(errors);
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        code_short: "PROV1",
        name: "Proveedor Ejemplo S.A. de C.V.",
        rfc: "ABC123456XYZ",
        razon_social: "PROVEEDOR EJEMPLO SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
        email: "contacto@proveedor.com",
        telefono: "5512345678",
      },
      {
        code_short: "PROV2",
        name: "Otro Proveedor",
        rfc: "DEF789012ABC",
        razon_social: "OTRO PROVEEDOR SOCIEDAD CIVIL",
        email: "ventas@otro.com",
        telefono: "5587654321",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Proveedores");

    // Ajustar anchos de columnas
    const maxWidth = 40;
    worksheet["!cols"] = [
      { wch: 15 }, // code_short
      { wch: maxWidth }, // name
      { wch: 15 }, // rfc
      { wch: maxWidth }, // razon_social
      { wch: 30 }, // email
      { wch: 15 }, // telefono
    ];

    XLSX.writeFile(workbook, "plantilla_proveedores.xlsx");
    toast.success("Plantilla descargada");
  };

  const processImport = async () => {
    if (previewData.length === 0) return;

    setStep("processing");
    setProgress(0);

    const created: number[] = [];
    const updated: number[] = [];
    const errors: ValidationError[] = [];

    // Obtener todos los datos del archivo completo
    const reader = new FileReader();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (!input?.files?.[0]) return;

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const allData = XLSX.utils.sheet_to_json<ProviderRow>(firstSheet);

        // Filtrar filas con errores de validación
        const validRows = allData.filter((_, index) => {
          const rowNumber = index + 2;
          return !validationErrors.some((e) => e.row === rowNumber);
        });

        const total = validRows.length;

        for (let i = 0; i < validRows.length; i++) {
          const row = validRows[i];
          const rowNumber = i + 2;

          try {
            // Verificar si existe el proveedor
            const { data: existing } = await supabase
              .from("providers")
              .select("id")
              .eq("code_short", row.code_short.toUpperCase().trim())
              .single();

            const providerData = {
              code_short: row.code_short.toUpperCase().trim(),
              name: row.name.trim(),
              fiscales_json: row.rfc || row.razon_social
                ? {
                    rfc: row.rfc?.toUpperCase().trim() || null,
                    razon_social: row.razon_social?.trim() || null,
                  }
                : null,
              contacto_json: row.email || row.telefono
                ? {
                    email: row.email?.trim() || null,
                    telefono: row.telefono?.trim() || null,
                  }
                : null,
              activo: true,
            };

            if (existing) {
              // Actualizar
              const { error } = await supabase
                .from("providers")
                .update(providerData)
                .eq("id", existing.id);

              if (error) throw error;
              updated.push(rowNumber);
            } else {
              // Crear
              const { error } = await supabase
                .from("providers")
                .insert(providerData);

              if (error) throw error;
              created.push(rowNumber);
            }
          } catch (error: any) {
            errors.push({
              row: rowNumber,
              field: "general",
              message: error.message || "Error al procesar",
            });
          }

          setProgress(Math.round(((i + 1) / total) * 100));
        }

        // Agregar errores de validación al reporte final
        const finalErrors = [...validationErrors, ...errors];

        setResult({
          created: created.length,
          updated: updated.length,
          errors: finalErrors,
        });

        setStep("results");
        queryClient.invalidateQueries({ queryKey: ["providers"] });

        if (finalErrors.length === 0) {
          toast.success(
            `Importación completada: ${created.length} creados, ${updated.length} actualizados`
          );
        } else {
          toast.warning(
            `Importación completada con ${finalErrors.length} errores`
          );
        }
      } catch (error) {
        console.error("Error processing import:", error);
        toast.error("Error al procesar importación");
        setStep("upload");
      }
    };

    reader.readAsArrayBuffer(input.files[0]);
  };

  const handleClose = () => {
    setStep("upload");
    setPreviewData([]);
    setValidationErrors([]);
    setProgress(0);
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Proveedores
          </DialogTitle>
          <DialogDescription>
            Importa proveedores desde un archivo Excel o CSV
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          {step === "upload" && (
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-lg font-medium">Suelta el archivo aquí...</p>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">
                      Arrastra un archivo Excel o CSV aquí
                    </p>
                    <p className="text-sm text-muted-foreground">
                      o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-muted-foreground mt-4">
                      Formatos soportados: .xlsx, .xls, .csv
                    </p>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                className="w-full gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar Plantilla Excel
              </Button>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <h3 className="font-semibold mb-2">Vista Previa (primeras 5 filas)</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>RFC</TableHead>
                        <TableHead>Razón Social</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Teléfono</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-xs">
                            {row.code_short}
                          </TableCell>
                          <TableCell>{row.name}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {row.rfc || "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {row.razon_social || "-"}
                          </TableCell>
                          <TableCell className="text-xs">{row.email || "-"}</TableCell>
                          <TableCell>{row.telefono || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {validationErrors.length > 0 && (
                <div className="rounded-lg border border-destructive/50 p-4 bg-destructive/5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <h3 className="font-semibold text-destructive">
                      {validationErrors.length} errores de validación
                    </h3>
                  </div>
                  <ScrollArea className="max-h-40">
                    <div className="space-y-1 text-sm">
                      {validationErrors.slice(0, 10).map((error, index) => (
                        <div key={index} className="text-muted-foreground">
                          Fila {error.row}, campo "{error.field}": {error.message}
                        </div>
                      ))}
                      {validationErrors.length > 10 && (
                        <div className="text-muted-foreground italic">
                          y {validationErrors.length - 10} errores más...
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  <p className="text-sm text-muted-foreground mt-2">
                    Las filas con errores serán omitidas durante la importación
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("upload")}>
                  Cancelar
                </Button>
                <Button onClick={processImport} className="flex-1">
                  Confirmar Importación
                </Button>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="space-y-4 py-8">
              <div className="text-center">
                <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-primary animate-pulse" />
                <h3 className="text-lg font-semibold mb-2">Procesando importación...</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Por favor espera mientras se procesan los registros
                </p>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">{progress}% completado</p>
              </div>
            </div>
          )}

          {step === "results" && result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border p-4 text-center bg-gradient-to-br from-green-500/10 to-green-500/5">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-500" />
                  <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                    {result.created}
                  </div>
                  <div className="text-sm text-muted-foreground">Creados</div>
                </div>

                <div className="rounded-lg border p-4 text-center bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-blue-600 dark:text-blue-500" />
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">
                    {result.updated}
                  </div>
                  <div className="text-sm text-muted-foreground">Actualizados</div>
                </div>

                <div className="rounded-lg border p-4 text-center bg-gradient-to-br from-red-500/10 to-red-500/5">
                  <XCircle className="h-8 w-8 mx-auto mb-2 text-red-600 dark:text-red-500" />
                  <div className="text-2xl font-bold text-red-600 dark:text-red-500">
                    {result.errors.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Errores</div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="rounded-lg border p-4 bg-muted/50">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    Detalle de Errores
                  </h3>
                  <ScrollArea className="max-h-60">
                    <div className="space-y-1 text-sm">
                      {result.errors.map((error, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Badge variant="destructive" className="shrink-0">
                            Fila {error.row}
                          </Badge>
                          <span className="text-muted-foreground">
                            {error.field}: {error.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <Button onClick={handleClose} className="w-full">
                Cerrar
              </Button>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
