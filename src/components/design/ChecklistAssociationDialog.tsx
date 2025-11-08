import { useState } from "react";
import { useRequiredDocuments } from "@/hooks/useRequiredDocuments";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";

interface ChecklistAssociationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  documentId: string;
  onAssociate: (requiredDocId: string) => void;
  isPending?: boolean;
}

export function ChecklistAssociationDialog({
  open,
  onOpenChange,
  projectId,
  documentId,
  onAssociate,
  isPending
}: ChecklistAssociationDialogProps) {
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const { data: requiredDocs } = useRequiredDocuments(projectId);

  const faseLabels = {
    arquitectonico: "Arquitectónica",
    ejecutivo: "Ejecutiva",
    construccion: "Construcción",
  };

  // Filter only pending documents
  const pendingDocs = requiredDocs?.filter(doc => !doc.subido) || [];

  // Group by fase
  const groupedDocs = pendingDocs.reduce((acc, doc) => {
    if (!acc[doc.fase]) acc[doc.fase] = [];
    acc[doc.fase].push(doc);
    return acc;
  }, {} as Record<string, typeof pendingDocs>);

  const handleAssociate = () => {
    if (selectedDocId) {
      onAssociate(selectedDocId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Asociar a Checklist?</DialogTitle>
        </DialogHeader>

        {pendingDocs.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-600" />
            <p className="text-muted-foreground">
              No hay documentos pendientes en el checklist
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecciona el documento del checklist al que corresponde este archivo:
            </p>

            <div>
              <Label>Documento del Checklist</Label>
              <Select value={selectedDocId} onValueChange={setSelectedDocId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un documento..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedDocs).map(([fase, docs]) => (
                    <div key={fase}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Fase {faseLabels[fase as keyof typeof faseLabels]}
                      </div>
                      {docs.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          <div className="flex items-center gap-2">
                            {doc.obligatorio ? (
                              <AlertCircle className="h-3 w-3 text-orange-600" />
                            ) : (
                              <Circle className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span>{doc.documento_tipo}</span>
                            {doc.obligatorio && (
                              <Badge variant="destructive" className="text-xs ml-2">
                                Obligatorio
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              También puedes omitir la asociación si este documento no forma parte del checklist.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {pendingDocs.length === 0 ? "Cerrar" : "Omitir"}
          </Button>
          {pendingDocs.length > 0 && (
            <Button onClick={handleAssociate} disabled={!selectedDocId || isPending}>
              {isPending ? "Asociando..." : "Asociar"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
