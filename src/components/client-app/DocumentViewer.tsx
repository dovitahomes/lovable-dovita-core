import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface DocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    name: string;
    type: string;
    url?: string;
  } | null;
}

export default function DocumentViewer({ open, onOpenChange, document }: DocumentViewerProps) {
  if (!document) return null;

  const getDocumentUrl = () => {
    // En producción, esto sería la URL real del documento
    // Por ahora usamos URLs de muestra
    if (document.type === 'pdf') {
      return 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    } else if (document.type === 'image') {
      return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800';
    } else if (document.type === 'docx') {
      // Google Docs Viewer para DOCX
      return 'https://docs.google.com/gview?url=https://file-examples.com/storage/fe6c5b0c09de9b1ebef0a28/2017/02/file-sample_100kB.doc&embedded=true';
    }
    return '';
  };

  const renderViewer = () => {
    const url = getDocumentUrl();

    if (document.type === 'pdf' || document.type === 'docx') {
      return (
        <iframe
          src={url}
          className="w-full h-[calc(80vh-120px)] rounded-lg border-0"
          title={document.name}
        />
      );
    } else if (document.type === 'image') {
      return (
        <div className="w-full h-[calc(80vh-120px)] flex items-center justify-center bg-muted/20 rounded-lg overflow-hidden">
          <img
            src={url}
            alt={document.name}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    }

    return (
      <div className="w-full h-[calc(80vh-120px)] flex items-center justify-center text-muted-foreground">
        Vista previa no disponible para este tipo de archivo
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold truncate pr-4">
              {document.name}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" onClick={() => {
                // Simular descarga
                window.open(getDocumentUrl(), '_blank');
              }}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden px-6 pb-6">
          {renderViewer()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
