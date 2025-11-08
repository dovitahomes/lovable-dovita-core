import { useState } from "react";
import { useRequiredDocuments, useMarkDocumentUploaded, useUnmarkDocumentUploaded } from "@/hooks/useRequiredDocuments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DocumentChecklistTabProps {
  projectId: string;
}

export function DocumentChecklistTab({ projectId }: DocumentChecklistTabProps) {
  const { data: documents, isLoading } = useRequiredDocuments(projectId);
  const markUploaded = useMarkDocumentUploaded();
  const unmarkUploaded = useUnmarkDocumentUploaded();

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
            <Badge variant={overallProgress === 100 ? "default" : "secondary"}>
              {overallProgress}%
            </Badge>
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
                          if (checked) {
                            // In real scenario, this would trigger document upload
                            // For now, just mark as uploaded
                            markUploaded.mutate({
                              id: doc.id,
                              document_id: "temp-doc-id", // Replace with actual document_id
                            });
                          } else {
                            unmarkUploaded.mutate(doc.id);
                          }
                        }}
                        disabled={markUploaded.isPending || unmarkUploaded.isPending}
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
    </div>
  );
}
