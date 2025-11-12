import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { useCreateBudgetTemplate } from "@/hooks/useBudgetTemplates";
import { BudgetItem } from "./ParametricBudgetWizard";
import { toast } from "sonner";

interface SaveAsTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  items: BudgetItem[];
}

export function SaveAsTemplateDialog({ open, onClose, items }: SaveAsTemplateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createTemplate = useCreateBudgetTemplate();

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    if (items.length === 0) {
      toast.error("No hay partidas para guardar");
      return;
    }

    await createTemplate.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      type: 'parametrico',
      items: items,
    });

    setName("");
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Guardar como Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del Template *</Label>
            <Input
              placeholder="Ej: Casa Habitación Estándar"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Descripción (opcional)</Label>
            <Textarea
              placeholder="Describe para qué sirve este template..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="text-xs text-muted-foreground">
            Este template incluirá {items.length} partida{items.length !== 1 ? 's' : ''} y podrá ser reutilizado en futuros presupuestos.
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={createTemplate.isPending || !name.trim()}
          >
            {createTemplate.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
