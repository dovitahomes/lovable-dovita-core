import { useState } from "react";
import useClientProjects from "@/features/client/hooks/useClientProjects";
import { useClientDocuments } from "@/features/client/hooks/useClientDocuments";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, MessageSquare, Image, FileIcon, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const FOLDER_TYPES = [
  { value: "all", label: "Todos" },
  { value: "Contratos", label: "Contratos" },
  { value: "Facturas", label: "Facturas" },
  { value: "Planos", label: "Planos" },
  { value: "Otros", label: "Otros" },
];

export default function Docs() {
  const navigate = useNavigate();
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);
  
  const { 
    projects, 
    loading: projectsLoading, 
    selectedProjectId, 
    setSelectedProjectId 
  } = useClientProjects();

  const { data: documents = [], isLoading, error, refetch } = useClientDocuments(
    selectedProjectId,
    selectedFolder === "all" ? undefined : selectedFolder
  );

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isPreviewable = (fileType: string | null) => {
    if (!fileType) return false;
    return fileType.startsWith('image/') || fileType === 'application/pdf';
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return FileIcon;
    if (fileType.startsWith('image/')) return Image;
    if (fileType === 'application/pdf') return FileText;
    return FileIcon;
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Documento descargado");
    } catch (err) {
      toast.error("No se pudo descargar el documento");
    }
  };

  if (projectsLoading) {
    return (
      <div className="space-y-4 pb-20">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center px-4 pb-20">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-foreground">No tienes proyectos</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Aún no tienes proyectos asignados con documentos.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    toast.error("No se pudieron cargar tus documentos", {
      action: {
        label: "Reintentar",
        onClick: () => refetch(),
      },
    });
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Documentos</h1>
        <p className="text-sm text-muted-foreground">Tus archivos del proyecto</p>
      </div>

      {/* Project selector (if multiple) */}
      {projects.length > 1 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Proyecto</label>
          <Select
            value={selectedProjectId || undefined}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona un proyecto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  Proyecto {format(parseISO(project.created_at), "dd/MM/yyyy")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Folder filter tabs */}
      <Tabs value={selectedFolder} onValueChange={setSelectedFolder} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {FOLDER_TYPES.map((folder) => (
            <TabsTrigger key={folder.value} value={folder.value} className="text-xs">
              {folder.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {FOLDER_TYPES.map((folder) => (
          <TabsContent key={folder.value} value={folder.value} className="space-y-3 mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-6 text-center px-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-base font-medium text-foreground">No hay documentos</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {folder.value === "all" 
                      ? "Aún no hay documentos en este proyecto."
                      : `No hay documentos en la carpeta "${folder.label}".`
                    }
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/client/chat')}
                  variant="default"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Abrir chat
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => {
                  const Icon = getFileIcon(doc.file_type);
                  const canPreview = isPreviewable(doc.file_type);

                  return (
                    <div
                      key={doc.id}
                      className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-3">
                        {/* Document info */}
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground text-sm truncate">
                              {doc.nombre}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {doc.etiqueta && (
                                <Badge variant="secondary" className="text-xs">
                                  {doc.etiqueta}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(doc.file_size)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(parseISO(doc.created_at), "dd/MM/yyyy", { locale: es })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Preview (if image or PDF) */}
                        {canPreview && previewDoc === doc.id && (
                          <div className="mt-3 border rounded-lg overflow-hidden">
                            {doc.file_type?.startsWith('image/') ? (
                              <img
                                src={doc.file_url}
                                alt={doc.nombre}
                                className="w-full max-h-96 object-contain bg-muted"
                              />
                            ) : doc.file_type === 'application/pdf' ? (
                              <iframe
                                src={doc.file_url}
                                className="w-full h-96"
                                title={doc.nombre}
                              />
                            ) : null}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          {canPreview && (
                            <Button
                              onClick={() => setPreviewDoc(previewDoc === doc.id ? null : doc.id)}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              {previewDoc === doc.id ? "Ocultar" : "Ver"}
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDownload(doc.file_url, doc.nombre)}
                            variant={canPreview ? "outline" : "default"}
                            size="sm"
                            className="flex-1"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Descargar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
