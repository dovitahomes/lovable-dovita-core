import { useClientDocuments } from '@/hooks/client-app/useClientDocuments';
import { getProjectFileUrl } from '@/lib/storage/client-storage-helpers';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, FileText, Image as ImageIcon, X } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ProjectDocumentsTabProps {
  projectId: string;
}

export default function ProjectDocumentsTab({ projectId }: ProjectDocumentsTabProps) {
  const { data: documents, isLoading } = useClientDocuments(projectId);
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  const handleDownload = async (doc: any) => {
    try {
      const { url } = await getProjectFileUrl('project_docs', doc.file_url, 300);
      window.open(url, '_blank');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo descargar el archivo',
        variant: 'destructive',
      });
    }
  };
  
  const handlePreview = async (doc: any) => {
    try {
      setPreviewLoading(true);
      const { url } = await getProjectFileUrl('project_docs', doc.file_url, 600);
      setPreviewUrl(url);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la vista previa',
        variant: 'destructive',
      });
    } finally {
      setPreviewLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-6 w-6 mb-2" />
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-3" />
            <Skeleton className="h-8 w-full" />
          </Card>
        ))}
      </div>
    );
  }
  
  if (!documents || documents.length === 0) {
    return (
      <Card>
        <div className="p-6 text-center text-muted-foreground">
          No hay documentos disponibles
        </div>
      </Card>
    );
  }
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => {
          const isImage = doc.file_type?.startsWith('image/');
          const isPdf = doc.file_type === 'application/pdf';
          
          return (
            <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {isImage ? (
                    <ImageIcon className="h-6 w-6 text-blue-500" />
                  ) : (
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" title={doc.nombre}>
                    {doc.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : 'Tamaño desconocido'}
                  </p>
                  
                  <div className="mt-3 flex gap-2">
                    {(isImage || isPdf) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreview(doc)}
                        disabled={previewLoading}
                      >
                        Ver
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(doc)}
                      title="Descargar"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      
      {/* Preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Vista Previa</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewUrl(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <iframe 
                src={previewUrl} 
                className="w-full h-[80vh]"
                title="Vista previa de documento"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
