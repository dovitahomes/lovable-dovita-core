import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useUnifiedProjectDocuments } from "@/hooks/useUnifiedProjectDocuments";
import { useDocumentsUpload } from "@/hooks/useDocumentsUpload";
import { useMarkDocumentUploaded } from "@/hooks/useRequiredDocuments";
import { deleteFromBucket } from "@/lib/storage-helpers";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, Download, Trash2, FileText, Filter } from "lucide-react";
import { ChecklistAssociationDialog } from "@/components/design/ChecklistAssociationDialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ProjectDocumentsTabProps {
  projectId: string;
}

export function ProjectDocumentsTab({ projectId }: ProjectDocumentsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [visibilidad, setVisibilidad] = useState<"interno" | "cliente">("interno");
  const [etiqueta, setEtiqueta] = useState("");
  const [showAssociationDialog, setShowAssociationDialog] = useState(false);
  const [lastUploadedDocId, setLastUploadedDocId] = useState<string | null>(null);
  
  const { data: documents = [], isLoading } = useUnifiedProjectDocuments(projectId);
  const markUploaded = useMarkDocumentUploaded();
  
  // Filter by category in the frontend
  const filteredDocuments = selectedCategory === "all" 
    ? documents 
    : documents.filter(doc => doc.tipo_carpeta === selectedCategory);
  
  const uploadMutation = useDocumentsUpload();

  const categories = ["general", "contratos", "planos", "presupuestos", "facturas", "permisos"];

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    uploadMutation.mutate({
      projectId,
      file,
      category: selectedCategory === "all" ? "general" : selectedCategory,
      visibilidad,
      etiqueta,
    }, {
      onSuccess: async () => {
        setEtiqueta("");
        
        // Get the newly uploaded document ID
        const { data: newDoc } = await supabase
          .from("documents")
          .select("id")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        
        if (newDoc) {
          setLastUploadedDocId(newDoc.id);
          setShowAssociationDialog(true);
        }
      }
    });
  };

  const handleAssociate = (requiredDocId: string) => {
    if (!lastUploadedDocId) return;
    
    markUploaded.mutate(
      {
        id: requiredDocId,
        document_id: lastUploadedDocId,
      },
      {
        onSuccess: () => {
          setShowAssociationDialog(false);
          setLastUploadedDocId(null);
        },
      }
    );
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
    disabled: uploadMutation.isPending,
  });

  const handleDownload = (doc: any) => {
    if (doc.url) {
      window.open(doc.url, '_blank');
    } else {
      toast.error("URL de descarga no disponible");
    }
  };

  const handleDelete = async (doc: any) => {
    if (!confirm(`¿Eliminar "${doc.nombre}"?`)) return;

    try {
      // Delete from storage
      await deleteFromBucket("project_docs", doc.file_url);

      // Delete from database
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;

      toast.success("Documento eliminado");
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast.error(error.message || "Error al eliminar el documento");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subir Documento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Categoría</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
          </div>

          <div>
            <Label>Etiqueta (opcional)</Label>
            <Input
              value={etiqueta}
              onChange={(e) => setEtiqueta(e.target.value)}
              placeholder="Ej: Revisión final, Versión 2..."
            />
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            } ${uploadMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {uploadMutation.isPending ? (
              <p>Subiendo...</p>
            ) : isDragActive ? (
              <p>Suelta el archivo aquí...</p>
            ) : (
              <p>Arrastra un archivo o haz clic para seleccionar</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              PDF, Word, Excel, Imágenes (máx. 10 MB)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Documentos del Proyecto</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Cargando documentos...</p>
          ) : filteredDocuments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay documentos en esta categoría</p>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.nombre}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
                        {doc.etiqueta && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">
                            {doc.etiqueta}
                          </span>
                        )}
                        {doc.visibilidad === 'cliente' && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                            Visible para cliente
                          </span>
                        )}
                        <span>
                          {formatDistanceToNow(new Date(doc.created_at), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Descargar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ChecklistAssociationDialog
        open={showAssociationDialog}
        onOpenChange={setShowAssociationDialog}
        projectId={projectId}
        documentId={lastUploadedDocId || ""}
        onAssociate={handleAssociate}
        isPending={markUploaded.isPending}
      />
    </div>
  );
}
