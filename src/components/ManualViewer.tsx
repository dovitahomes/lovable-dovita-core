import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface ManualViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manual: {
    file_path: string;
    titulo: string;
    file_type: string;
  } | null;
}

const getMimeType = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
  };
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
};

export function ManualViewer({ open, onOpenChange, manual }: ManualViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && manual) {
      loadDocument();
    }

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
    };
  }, [open, manual]);

  const loadDocument = async () => {
    if (!manual) return;

    setLoading(true);
    setError(null);
    
    try {
      const { data, error: downloadError } = await supabase
        .storage
        .from('documentos')
        .download(manual.file_path);

      if (downloadError) throw downloadError;

      const mimeType = data.type || getMimeType(manual.file_type);
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      setBlobUrl(url);
    } catch (err) {
      console.error('Error loading document:', err);
      setError('Error al cargar el documento');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!blobUrl || !manual) return;
    
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${manual.titulo}.${manual.file_type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleClose = () => {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
    setError(null);
    onOpenChange(false);
  };

  const isPDF = manual?.file_type.toLowerCase() === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(manual?.file_type.toLowerCase() || '');
  const isOfficeDoc = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(manual?.file_type.toLowerCase() || '');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {manual?.titulo}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!blobUrl || loading}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden rounded-lg border bg-muted/20">
          {loading && (
            <div className="h-full flex flex-col gap-4 p-4">
              <Skeleton className="h-full w-full" />
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Cargando documento...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-lg font-medium text-foreground">{error}</p>
              <Button onClick={loadDocument} variant="outline">
                Reintentar
              </Button>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <>
              {isPDF && (
                <iframe
                  src={blobUrl}
                  className="w-full h-full"
                  title={manual.titulo}
                />
              )}

              {isImage && (
                <div className="h-full flex items-center justify-center p-4 overflow-auto">
                  <img
                    src={blobUrl}
                    alt={manual.titulo}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}

              {isOfficeDoc && (
                <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
                  <FileText className="h-16 w-16 text-muted-foreground" />
                  <div className="text-center space-y-2">
                    <p className="text-lg font-medium text-foreground">
                      Vista previa no disponible para este tipo de archivo
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Archivos .{manual.file_type.toUpperCase()} requieren ser descargados para visualizarse
                    </p>
                  </div>
                  <Button onClick={handleDownload} size="lg">
                    <Download className="h-5 w-5 mr-2" />
                    Descargar para visualizar
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
