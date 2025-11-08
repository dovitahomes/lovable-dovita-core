import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, etiqueta: string, visibilidad: 'interno' | 'cliente') => void;
  isPending?: boolean;
  documentType?: string;
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  onUpload,
  isPending,
  documentType
}: DocumentUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [etiqueta, setEtiqueta] = useState("");
  const [visibilidad, setVisibilidad] = useState<'interno' | 'cliente'>('cliente');

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo excede el tamaño máximo de 10 MB");
      return;
    }
    
    setSelectedFile(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".jpg", ".jpeg", ".png"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
    disabled: isPending,
  });

  const handleUpload = () => {
    if (!selectedFile) {
      toast.error("Selecciona un archivo primero");
      return;
    }
    onUpload(selectedFile, etiqueta, visibilidad);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setEtiqueta("");
    setVisibilidad('cliente');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Subir: {documentType || "Documento"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Visibilidad</Label>
            <Select value={visibilidad} onValueChange={(v: any) => setVisibilidad(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interno">Solo Interno</SelectItem>
                <SelectItem value="cliente">Visible para Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Etiqueta (opcional)</Label>
            <Input
              value={etiqueta}
              onChange={(e) => setEtiqueta(e.target.value)}
              placeholder="Ej: Versión final, Revisión 2..."
            />
          </div>

          {!selectedFile ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-primary bg-primary/5" : "border-border"
              } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-sm">Suelta el archivo aquí...</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Arrastra un archivo o haz clic para seleccionar
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                PDF, Word, Excel, Imágenes (máx. 10 MB)
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                disabled={isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || isPending}>
            {isPending ? "Subiendo..." : "Subir Documento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
