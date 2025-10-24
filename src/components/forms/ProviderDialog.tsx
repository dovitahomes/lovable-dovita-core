import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateProvider, type ProviderFormData } from "@/hooks/useCreateProvider";
import { Loader2 } from "lucide-react";

interface ProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProviderDialog({ open, onOpenChange }: ProviderDialogProps) {
  const createProvider = useCreateProvider();
  const [formData, setFormData] = useState<Partial<ProviderFormData>>({
    name: "",
    code_short: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProvider.mutate(formData as ProviderFormData, {
      onSuccess: () => {
        onOpenChange(false);
        setFormData({
          name: "",
          code_short: "",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Proveedor</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre del proveedor"
              required
            />
          </div>

          <div>
            <Label>Alias / Código *</Label>
            <Input
              value={formData.code_short}
              onChange={(e) => setFormData({ ...formData, code_short: e.target.value })}
              placeholder="PROV01"
              required
              maxLength={50}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createProvider.isPending}>
              {createProvider.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Proveedor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
