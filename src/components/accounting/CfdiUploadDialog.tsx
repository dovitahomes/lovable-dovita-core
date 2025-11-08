import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Eye, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useUploadCfdi } from "@/hooks/useUploadCfdi";
import { cn } from "@/lib/utils";

interface CfdiUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  providerId?: string;
  projectId?: string;
}

export function CfdiUploadDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  providerId,
  projectId 
}: CfdiUploadDialogProps) {
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  
  const { uploadCfdi, uploading, progress } = useUploadCfdi();

  const { getRootProps: getXmlRootProps, getInputProps: getXmlInputProps, isDragActive: isXmlDragActive } = useDropzone({
    accept: { 'text/xml': ['.xml'] },
    multiple: false,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setXmlFile(acceptedFiles[0]);
        setMetadata(null); // Reset metadata cuando se selecciona nuevo archivo
      }
    }
  });

  const { getRootProps: getPdfRootProps, getInputProps: getPdfInputProps, isDragActive: isPdfDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setPdfFile(acceptedFiles[0]);
      }
    }
  });

  const handleUpload = async () => {
    if (!xmlFile || !providerId) return;

    try {
      const result = await uploadCfdi({
        xmlFile,
        pdfFile: pdfFile || undefined,
        emisorId: providerId,
        projectId,
      });

      setMetadata(result.metadata);
      onSuccess?.();
      
      // No cerrar inmediatamente para mostrar preview de metadatos
      // El usuario cierra manualmente después de ver los metadatos
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const handleClose = () => {
    setXmlFile(null);
    setPdfFile(null);
    setMetadata(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Subir CFDI (XML/PDF)</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* XML Upload */}
          <div>
            <Label>Archivo XML *</Label>
            <div
              {...getXmlRootProps()}
              className={cn(
                "mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                isXmlDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                xmlFile && "border-green-500 bg-green-500/5"
              )}
            >
              <input {...getXmlInputProps()} />
              {xmlFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">{xmlFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(xmlFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setXmlFile(null);
                      setMetadata(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Arrastra el archivo XML aquí o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-muted-foreground">Máx. 5MB</p>
                </div>
              )}
            </div>
          </div>

          {/* PDF Upload (opcional) */}
          <div>
            <Label>Archivo PDF (opcional)</Label>
            <div
              {...getPdfRootProps()}
              className={cn(
                "mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                isPdfDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                pdfFile && "border-blue-500 bg-blue-500/5"
              )}
            >
              <input {...getPdfInputProps()} />
              {pdfFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">{pdfFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(pdfFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPdfFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Arrastra el archivo PDF aquí o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-muted-foreground">Máx. 10MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cargando...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Metadata Preview */}
          {metadata && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Metadatos Extraídos</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">UUID:</span>
                    <p className="font-mono text-xs break-all">{metadata.uuid || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Folio:</span>
                    <p className="font-medium">{metadata.folio_number || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fecha:</span>
                    <p className="font-medium">{metadata.fecha_emision || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total:</span>
                    <p className="font-medium">${metadata.total?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Emisor:</span>
                    <p className="font-medium text-xs">{metadata.emisor?.nombre || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">RFC Emisor:</span>
                    <p className="font-mono text-xs">{metadata.emisor?.rfc || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            {metadata ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!metadata && (
            <Button 
              onClick={handleUpload} 
              disabled={uploading || !xmlFile || !providerId}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Cargando...' : 'Cargar CFDI'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}