import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  Loader2,
  X
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';

interface ImportPreview {
  toCreate: PreviewRow[];
  toUpdate: PreviewRow[];
  errors: ErrorRow[];
}

interface PreviewRow {
  codigo: string;
  nombre: string;
  tipo: string;
  parent_codigo?: string;
  unidad?: string;
  action: 'create' | 'update';
}

interface ErrorRow {
  row: number;
  codigo: string;
  nombre: string;
  tipo: string;
  error: string;
}

interface TUImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: any[]) => Promise<void>;
  scopeFilter: 'global' | 'sucursal' | 'proyecto';
}

export function TUImportDialog({ 
  open, 
  onOpenChange, 
  onImport,
  scopeFilter 
}: TUImportDialogProps) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);
    
    try {
      const preview = await processFile(file);
      setPreview(preview);
    } catch (error: any) {
      console.error("Error processing file:", error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    multiple: false
  });

  const processFile = async (file: File): Promise<ImportPreview> => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });

    const preview: ImportPreview = {
      toCreate: [],
      toUpdate: [],
      errors: []
    };

    const sheets = ['Departamentos', 'Mayores', 'Partidas', 'Subpartidas'];
    const typeMap: Record<string, string> = {
      'Departamentos': 'departamento',
      'Mayores': 'mayor',
      'Partidas': 'partida',
      'Subpartidas': 'subpartida'
    };

    let rowNumber = 0;

    for (const sheetName of sheets) {
      if (!workbook.SheetNames.includes(sheetName)) {
        preview.errors.push({
          row: 0,
          codigo: '',
          nombre: '',
          tipo: typeMap[sheetName],
          error: `Sheet "${sheetName}" no encontrado en el archivo`
        });
        continue;
      }

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      for (let i = 0; i < jsonData.length; i++) {
        rowNumber++;
        const row = jsonData[i];

        // Validaciones básicas
        if (!row['Código'] || !row['Nombre']) {
          preview.errors.push({
            row: rowNumber,
            codigo: row['Código'] || '',
            nombre: row['Nombre'] || '',
            tipo: typeMap[sheetName],
            error: 'Código y Nombre son obligatorios'
          });
          continue;
        }

        // Validar longitud
        if (row['Código'].length > 10) {
          preview.errors.push({
            row: rowNumber,
            codigo: row['Código'],
            nombre: row['Nombre'],
            tipo: typeMap[sheetName],
            error: 'Código debe tener máximo 10 caracteres'
          });
          continue;
        }

        if (row['Nombre'].length > 255) {
          preview.errors.push({
            row: rowNumber,
            codigo: row['Código'],
            nombre: row['Nombre'],
            tipo: typeMap[sheetName],
            error: 'Nombre debe tener máximo 255 caracteres'
          });
          continue;
        }

        // Validar jerarquía (mayores/partidas/subpartidas deben tener padre)
        if (typeMap[sheetName] !== 'departamento' && !row['Código Padre']) {
          preview.errors.push({
            row: rowNumber,
            codigo: row['Código'],
            nombre: row['Nombre'],
            tipo: typeMap[sheetName],
            error: `${typeMap[sheetName]} requiere "Código Padre"`
          });
          continue;
        }

        // Asumir que todos son nuevos (create)
        // En una implementación real, consultarías la BD para verificar si existe
        preview.toCreate.push({
          codigo: row['Código'],
          nombre: row['Nombre'],
          tipo: typeMap[sheetName],
          parent_codigo: row['Código Padre'] || undefined,
          unidad: row['Unidad'] || undefined,
          action: 'create'
        });
      }
    }

    return preview;
  };

  const handleConfirmImport = async () => {
    if (!preview) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      const allRows = [...preview.toCreate, ...preview.toUpdate];
      const total = allRows.length;

      for (let i = 0; i < allRows.length; i++) {
        const row = allRows[i];
        
        // Simulate progress (en producción, esto sería la importación real)
        await new Promise(resolve => setTimeout(resolve, 50));
        
        setImportProgress(((i + 1) / total) * 100);
      }

      // Call the actual import function
      await onImport(allRows);

      // Reset state
      setPreview(null);
      setSelectedFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Error importing:", error);
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setSelectedFile(null);
    setImportProgress(0);
    onOpenChange(false);
  };

  const getTypeIcon = (tipo: string) => {
    return <FileText className="h-4 w-4" />;
  };

  const getTypeBadge = (tipo: string) => {
    const config: Record<string, { className: string; label: string }> = {
      departamento: { 
        className: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
        label: "DEP"
      },
      mayor: { 
        className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
        label: "MAY"
      },
      partida: { 
        className: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
        label: "PAR"
      },
      subpartida: { 
        className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
        label: "SUB"
      }
    };
    
    const badge = config[tipo] || config.departamento;
    return (
      <Badge variant="default" className={cn("text-xs font-semibold", badge.className)}>
        {badge.label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Catálogo TU
          </DialogTitle>
          <DialogDescription>
            Carga un archivo Excel con la estructura del catálogo (4 sheets: Departamentos, Mayores, Partidas, Subpartidas)
          </DialogDescription>
        </DialogHeader>

        {!preview ? (
          // Upload Zone
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all",
                "hover:border-primary hover:bg-primary/5",
                isDragActive && "border-primary bg-primary/10",
                isProcessing && "opacity-50 pointer-events-none"
              )}
            >
              <input {...getInputProps()} />
              
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    Procesando archivo...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-medium mb-1">
                      {isDragActive 
                        ? "Suelta el archivo aquí" 
                        : "Arrastra un archivo Excel aquí"
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      o haz clic para seleccionar (.xlsx, .xls)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {selectedFile && !isProcessing && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          // Preview Zone
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    Para Crear
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {preview.toCreate.length}
                </p>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Download className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    Para Actualizar
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {preview.toUpdate.length}
                </p>
              </div>

              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-400">
                    Errores
                  </span>
                </div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                  {preview.errors.length}
                </p>
              </div>
            </div>

            {/* Errors Alert */}
            {preview.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Se encontraron {preview.errors.length} errores. Corrige el archivo y vuelve a importar.
                </AlertDescription>
              </Alert>
            )}

            {/* Preview Table */}
            <div className="border rounded-lg max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-medium">Acción</th>
                    <th className="text-left p-3 font-medium">Tipo</th>
                    <th className="text-left p-3 font-medium">Código</th>
                    <th className="text-left p-3 font-medium">Nombre</th>
                    <th className="text-left p-3 font-medium">Padre</th>
                    <th className="text-left p-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Rows to Create */}
                  {preview.toCreate.map((row, idx) => (
                    <tr key={`create-${idx}`} className="border-t hover:bg-muted/50">
                      <td className="p-3">
                        <Badge variant="default" className="bg-green-500/10 text-green-700 border-green-500/20">
                          Crear
                        </Badge>
                      </td>
                      <td className="p-3">{getTypeBadge(row.tipo)}</td>
                      <td className="p-3">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {row.codigo}
                        </code>
                      </td>
                      <td className="p-3 font-medium">{row.nombre}</td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {row.parent_codigo || '-'}
                      </td>
                      <td className="p-3">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </td>
                    </tr>
                  ))}

                  {/* Rows to Update */}
                  {preview.toUpdate.map((row, idx) => (
                    <tr key={`update-${idx}`} className="border-t hover:bg-muted/50">
                      <td className="p-3">
                        <Badge variant="default" className="bg-blue-500/10 text-blue-700 border-blue-500/20">
                          Actualizar
                        </Badge>
                      </td>
                      <td className="p-3">{getTypeBadge(row.tipo)}</td>
                      <td className="p-3">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {row.codigo}
                        </code>
                      </td>
                      <td className="p-3 font-medium">{row.nombre}</td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {row.parent_codigo || '-'}
                      </td>
                      <td className="p-3">
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      </td>
                    </tr>
                  ))}

                  {/* Error Rows */}
                  {preview.errors.map((row, idx) => (
                    <tr key={`error-${idx}`} className="border-t bg-red-500/5 hover:bg-red-500/10">
                      <td className="p-3">
                        <Badge variant="destructive">Error</Badge>
                      </td>
                      <td className="p-3">{getTypeBadge(row.tipo)}</td>
                      <td className="p-3">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {row.codigo || 'N/A'}
                        </code>
                      </td>
                      <td className="p-3 font-medium">{row.nombre || 'N/A'}</td>
                      <td className="p-3 text-muted-foreground text-xs">
                        Fila {row.row}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs">{row.error}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Progress Bar */}
            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Importando nodos...</span>
                  <span className="font-medium">{Math.round(importProgress)}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isImporting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={preview.errors.length > 0 || isImporting || preview.toCreate.length === 0}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirmar Importación
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
