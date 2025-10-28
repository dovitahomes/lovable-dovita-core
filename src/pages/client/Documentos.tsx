import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download, Eye, Loader2, AlertCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMyProjects, useClientDocuments } from "@/features/client/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ClientDocumentos() {
  const { currentProject, isLoading: projectsLoading } = useMyProjects();
  const navigate = useNavigate();
  const projectId = currentProject?.id || null;
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);

  const { data: documents, isLoading, error, refetch } = useClientDocuments(projectId, selectedFolder);

  const folders = [
    { value: "contratos", label: "Contratos" },
    { value: "facturas", label: "Facturas" },
    { value: "planos", label: "Planos" },
    { value: "otros", label: "Otros" },
  ];

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string | null) => {
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('image')) return '🖼️';
    if (fileType?.includes('word') || fileType?.includes('document')) return '📝';
    return '📎';
  };

  const isPreviewable = (fileType: string | null) => {
    return fileType?.includes('image') || fileType?.includes('pdf');
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    link.click();
  };

  if (projectsLoading) {
    return (
      <div className="space-y-4 pb-20">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">No hay proyecto seleccionado</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 pb-20">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Documentos</h1>
          <p className="text-sm text-muted-foreground">Gestiona los documentos de tu proyecto</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="text-center space-y-2">
              <p className="font-medium text-foreground">Error al cargar documentos</p>
              <p className="text-sm text-muted-foreground">No se pudieron cargar los documentos del proyecto</p>
            </div>
            <Button onClick={() => refetch()} variant="outline">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Documentos</h1>
        <p className="text-sm text-muted-foreground">Gestiona los documentos de tu proyecto</p>
      </div>

      <Tabs value={selectedFolder || "all"} onValueChange={(v) => setSelectedFolder(v === "all" ? undefined : v)}>
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
          {folders.map(folder => (
            <TabsTrigger key={folder.value} value={folder.value} className="text-xs">
              {folder.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedFolder || "all"} className="space-y-3 mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : documents && documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">
                        {getFileIcon(doc.file_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground mb-1">{doc.nombre}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{format(new Date(doc.created_at), "d MMM yyyy", { locale: es })}</span>
                          <span>•</span>
                          <span>{formatFileSize(doc.file_size)}</span>
                        </div>
                        {doc.etiqueta && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {doc.etiqueta}
                          </Badge>
                        )}

                        {/* Preview for images/PDFs */}
                        {previewDoc === doc.id && isPreviewable(doc.file_type) && (
                          <div className="mt-3 rounded-lg overflow-hidden border">
                            {doc.file_type?.includes('image') ? (
                              <img 
                                src={doc.file_url} 
                                alt={doc.nombre}
                                className="w-full max-h-64 object-contain bg-muted"
                              />
                            ) : doc.file_type?.includes('pdf') ? (
                              <iframe
                                src={doc.file_url}
                                className="w-full h-64"
                                title={doc.nombre}
                              />
                            ) : null}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {isPreviewable(doc.file_type) && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setPreviewDoc(previewDoc === doc.id ? null : doc.id)}
                            aria-label={previewDoc === doc.id ? "Ocultar vista previa" : "Ver vista previa"}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDownload(doc.file_url, doc.nombre)}
                          aria-label="Descargar documento"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center px-4">
                <FileText className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {selectedFolder ? `No hay ${folders.find(f => f.value === selectedFolder)?.label.toLowerCase()}` : "No hay documentos"}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                  Los documentos de tu proyecto aparecerán aquí. Mantente en contacto con tu equipo para más información.
                </p>
                <Button onClick={() => navigate('/client/chat')} variant="default">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Abrir chat
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
