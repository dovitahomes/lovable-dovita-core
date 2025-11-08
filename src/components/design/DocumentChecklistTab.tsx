import { useState } from "react";
import { useRequiredDocuments, useUnmarkDocumentUploaded, useDeleteRequiredDocument } from "@/hooks/useRequiredDocuments";
import { useChecklistDocumentUpload } from "@/hooks/useChecklistDocumentUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, CheckCircle2, Circle, AlertCircle, Upload, Plus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
import { AddRequiredDocumentDialog } from "./AddRequiredDocumentDialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DocumentChecklistTabProps {
  projectId: string;
}

export function DocumentChecklistTab({ projectId }: DocumentChecklistTabProps) {
  const { data: documents, isLoading } = useRequiredDocuments(projectId);
  const unmarkUploaded = useUnmarkDocumentUploaded();
  const uploadMutation = useChecklistDocumentUpload();
  const deleteMutation = useDeleteRequiredDocument();
  
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<{ id: string; tipo: string } | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  const faseLabels = {
    arquitectonico: "Fase Arquitectónica",
    ejecutivo: "Fase Ejecutiva",
    construccion: "Fase de Construcción",
  };

  const faseColors = {
    arquitectonico: "bg-blue-500",
    ejecutivo: "bg-purple-500",
    construccion: "bg-orange-500",
  };

  // Group documents by fase
  const groupedDocs = documents?.reduce((acc, doc) => {
    if (!acc[doc.fase]) acc[doc.fase] = [];
    acc[doc.fase].push(doc);
    return acc;
  }, {} as Record<string, typeof documents>) || {};

  // Calculate progress for each fase
  const calculateProgress = (docs: typeof documents) => {
    if (!docs || docs.length === 0) return 0;
    const uploaded = docs.filter((d) => d.subido).length;
    return Math.round((uploaded / docs.length) * 100);
  };

  // Calculate overall progress
  const overallProgress = documents ? calculateProgress(documents) : 0;

  const handleOpenUpload = (docId: string, docTipo: string) => {
    setSelectedDoc({ id: docId, tipo: docTipo });
    setUploadDialogOpen(true);
  };

  const handleUpload = (file: File, etiqueta: string, visibilidad: 'interno' | 'cliente') => {
    if (!selectedDoc) return;
    
    uploadMutation.mutate(
      {
        projectId,
        requiredDocId: selectedDoc.id,
        file,
        etiqueta,
        visibilidad,
      },
      {
        onSuccess: () => {
          setUploadDialogOpen(false);
          setSelectedDoc(null);
        },
      }
    );
  };

  const handleDeleteClick = (docId: string) => {
    setDocumentToDelete(docId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (documentToDelete) {
      await deleteMutation.mutateAsync({ id: documentToDelete, projectId });
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progreso General del Checklist</span>
            <div className="flex items-center gap-2">
              <Badge variant={overallProgress === 100 ? "default" : "secondary"}>
                {overallProgress}%
              </Badge>
              <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Documento
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {documents?.filter((d) => d.subido).length || 0} de {documents?.length || 0} documentos subidos
          </p>
        </CardContent>
      </Card>

      {/* Documents by Phase */}
      {(Object.keys(groupedDocs) as Array<keyof typeof faseLabels>).map((fase) => {
        const docs = groupedDocs[fase];
        const progress = calculateProgress(docs);
        const obligatorios = docs.filter((d) => d.obligatorio);
        const obligatoriosSubidos = obligatorios.filter((d) => d.subido).length;

        return (
          <Card key={fase}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-6 rounded ${faseColors[fase]}`} />
                  <span>{faseLabels[fase]}</span>
                </div>
                <div className="flex items-center gap-2">
                  {obligatorios.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Obligatorios: {obligatoriosSubidos}/{obligatorios.length}
                    </Badge>
                  )}
                  <Badge variant={progress === 100 ? "default" : "secondary"}>
                    {progress}%
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progress} variant="yellow" className="h-2" />
              
              <div className="space-y-2">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        checked={doc.subido}
                        onCheckedChange={(checked) => {
                          if (!checked) {
                            unmarkUploaded.mutate(doc.id);
                          }
                        }}
                        disabled={unmarkUploaded.isPending}
                      />
                      
                      <div className="flex items-center gap-2">
                        {doc.subido ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : doc.obligatorio ? (
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className={doc.subido ? "line-through text-muted-foreground" : ""}>
                            {doc.documento_tipo}
                          </span>
                          {doc.obligatorio && (
                            <Badge variant="destructive" className="text-xs">
                              Obligatorio
                            </Badge>
                          )}
                        </div>
                        {doc.fecha_subida && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Subido el {format(new Date(doc.fecha_subida), "dd 'de' MMMM, yyyy", { locale: es })}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!doc.subido && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenUpload(doc.id, doc.documento_tipo)}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Subir
                        </Button>
                      )}
                      {!doc.subido && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {!documents || documents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No hay documentos requeridos para este proyecto.
            </p>
          </CardContent>
        </Card>
      )}

      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUpload}
        isPending={uploadMutation.isPending}
        documentType={selectedDoc?.tipo}
      />

      <AddRequiredDocumentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        projectId={projectId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento del checklist?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El documento será eliminado permanentemente del checklist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
