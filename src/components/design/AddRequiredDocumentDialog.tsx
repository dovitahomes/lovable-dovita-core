import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAddRequiredDocument } from "@/hooks/useRequiredDocuments";

interface AddRequiredDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function AddRequiredDocumentDialog({
  open,
  onOpenChange,
  projectId,
}: AddRequiredDocumentDialogProps) {
  const [fase, setFase] = useState<'arquitectonico' | 'ejecutivo' | 'construccion'>('arquitectonico');
  const [documentoTipo, setDocumentoTipo] = useState("");
  const [obligatorio, setObligatorio] = useState(true);

  const addMutation = useAddRequiredDocument();

  const handleSubmit = async () => {
    if (!documentoTipo.trim()) {
      return;
    }

    await addMutation.mutateAsync({
      project_id: projectId,
      fase,
      documento_tipo: documentoTipo.trim(),
      obligatorio,
    });

    // Reset form
    setDocumentoTipo("");
    setObligatorio(true);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Documento Personalizado</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Fase</Label>
            <Select
              value={fase}
              onValueChange={(v) => setFase(v as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="arquitectonico">Arquitectónico</SelectItem>
                <SelectItem value="ejecutivo">Ejecutivo</SelectItem>
                <SelectItem value="construccion">Construcción</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tipo de Documento</Label>
            <Input
              value={documentoTipo}
              onChange={(e) => setDocumentoTipo(e.target.value)}
              placeholder="Ej: Estudio de Impacto Ambiental"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="obligatorio"
              checked={obligatorio}
              onCheckedChange={(checked) => setObligatorio(checked as boolean)}
            />
            <Label htmlFor="obligatorio" className="cursor-pointer">
              Documento obligatorio
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!documentoTipo.trim() || addMutation.isPending}
          >
            Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
