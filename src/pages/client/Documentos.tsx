import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMyProjects, useClientDocuments } from "@/features/client/hooks";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ClientDocumentos() {
  const { currentProject } = useMyProjects();
  const projectId = currentProject?.id || null;
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);

  const { data: documents, isLoading } = useClientDocuments(projectId, selectedFolder);

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

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">No hay proyecto seleccionado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Documentos</h2>
        <p className="text-sm text-muted-foreground">Gestiona los documentos de tu proyecto</p>
      </div>

      <Tabs value={selectedFolder || "all"} onValueChange={(v) => setSelectedFolder(v === "all" ? undefined : v)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Todos</TabsTrigger>
          {folders.map(folder => (
            <TabsTrigger key={folder.value} value={folder.value}>
              {folder.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedFolder || "all"} className="space-y-3 mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : documents && documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">
                        {getFileIcon(doc.file_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{doc.nombre}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{format(new Date(doc.created_at), "d MMM yyyy", { locale: es })}</span>
                          <span>•</span>
                          <span>{formatFileSize(doc.file_size)}</span>
                        </div>
                        {doc.etiqueta && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {doc.etiqueta}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => window.open(doc.file_url, '_blank')}
                          aria-label="Ver documento"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = doc.file_url;
                            link.download = doc.nombre;
                            link.click();
                          }}
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
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No hay documentos</h3>
                <p className="text-sm text-muted-foreground">
                  Los documentos de tu proyecto aparecerán aquí
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
