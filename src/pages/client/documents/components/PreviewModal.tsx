import { X, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Document {
  id: string;
  nombre: string;
  file_type?: string | null;
  file_url: string;
}

interface PreviewModalProps {
  document: Document | null;
  open: boolean;
  onClose: () => void;
}

export function PreviewModal({ document, open, onClose }: PreviewModalProps) {
  if (!document) return null;

  const isPdf = document.file_type === "application/pdf";
  const isImage = document.file_type?.startsWith("image/");

  const handleDownload = () => {
    window.open(document.file_url, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold text-slate-900 truncate pr-4">
              {document.nombre}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-slate-50">
          {isPdf ? (
            <iframe
              src={document.file_url}
              className="w-full h-full"
              title={document.nombre}
            />
          ) : isImage ? (
            <div className="flex items-center justify-center h-full p-6">
              <img
                src={document.file_url}
                alt={document.nombre}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <p className="text-slate-600 mb-4">
                Vista previa no disponible para este tipo de archivo
              </p>
              <Button onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Descargar archivo
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
